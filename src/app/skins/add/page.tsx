'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SkinViewer } from '@/components/skin-viewer';
import { TagInput } from '@/components/tag-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft, Upload, Globe, X, Loader2, Check,
  CheckSquare, Square, ToggleLeft,
  Tags, FolderOpen, User, Link2, Trash2,
} from 'lucide-react';
import SparkMD5 from 'spark-md5';
import Image from 'next/image';
import { createUuid } from '@/lib/utils';

interface PendingFile {
  id: string;
  name: string;
  file: string;
  fileMD5: string;
  slim: boolean | null;
  skinName: string;
  type: string;
  tags: string[];
  source: string;
}

function inferSlimFromDataUrl(dataUrl: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(false);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const x = canvas.width === 128 ? 108 : 54;
        const y = canvas.width === 128 ? 40 : 20;
        const data = ctx.getImageData(x, y, 1, 1).data;
        const hasColor = data[3] !== 0;
        resolve(!hasColor);
      } catch {
        resolve(false);
      }
    };
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = dataUrl;
  });
}

function slimForApi(slim: boolean | null, inferred: boolean): boolean {
  if (slim === null) return inferred;
  return slim;
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function computeMD5(dataURL: string): string {
  const base64 = dataURL.replace(/^data:image\/\w+;base64,/, '');
  return SparkMD5.hash(atob(base64));
}

type BatchDialogType = 'tags' | 'type' | 'slim' | 'source' | null;

export default function AddSkinPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(
    null
  );
  const [autoDetectSlim, setAutoDetectSlim] = useState(false);
  const [siteUrl, setSiteUrl] = useState('');
  const [siteParsing, setSiteParsing] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDialog, setBatchDialog] = useState<BatchDialogType>(null);

  const [batchTags, setBatchTags] = useState<string[]>([]);
  const [batchTagMode, setBatchTagMode] = useState<'override' | 'append'>('append');
  const [batchType, setBatchType] = useState('');
  const [batchSlim, setBatchSlim] = useState<boolean | null>(null);
  const [batchSource, setBatchSource] = useState('');

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const newPending: PendingFile[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const dataURL = await fileToDataURL(file);
      const md5 = computeMD5(dataURL);

      newPending.push({
        id: createUuid(),
        name: file.name.replace(/\.\w+$/, ''),
        file: dataURL,
        fileMD5: md5,
        slim: null,
        skinName: file.name.replace(/\.\w+$/, ''),
        type: '',
        tags: [],
        source: '',
      });
    }
    setPending((prev) => [...prev, ...newPending]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleSiteParse = async () => {
    if (!siteUrl) return;
    setSiteParsing(true);
    try {
      const res = await fetch(`/api/skins/parse?url=${encodeURIComponent(siteUrl)}`);
      if (!res.ok) throw new Error('Parse failed');
      const data = await res.json();
      const md5 = computeMD5(data.file);

      setPending((prev) => [
        ...prev,
        {
          id: createUuid(),
          name: data.name || '从站点导入',
          file: data.file,
          fileMD5: md5,
          slim: typeof data.slim === 'boolean' ? data.slim : null,
          skinName: data.name || '',
          type: '',
          tags: [],
          source: siteUrl,
        },
      ]);
      setSiteUrl('');
    } catch {
      alert('解析失败，请检查 URL 是否正确');
    } finally {
      setSiteParsing(false);
    }
  };

  const removePending = (id: string) => {
    setPending((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (selectedIdx >= next.length) setSelectedIdx(Math.max(0, next.length - 1));
      return next;
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const updatePending = (id: string, updates: Partial<PendingFile>) => {
    setPending((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleUploadAll = async () => {
    if (pending.length === 0) return;
    setUploading(true);
    const snapshot = [...pending];
    const total = snapshot.length;
    setUploadProgress({ done: 0, total });

    try {
      const successIds: string[] = [];
      const failedItems: Array<{ id: string; name: string; reason: string }> = [];

      for (let i = 0; i < snapshot.length; i++) {
        const item = snapshot[i];
        let slimResolved = false;
        if (item.slim === null && autoDetectSlim) {
          try {
            slimResolved = await inferSlimFromDataUrl(item.file);
          } catch {
            slimResolved = false;
          }
        }
        const slim = slimForApi(item.slim, slimResolved);

        const res = await fetch('/api/skins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: item.skinName || null,
            slim,
            type: item.type || null,
            tags: item.tags,
            source: item.source || null,
            file: item.file,
            fileMD5: item.fileMD5,
          }),
        });

        if (res.ok) {
          successIds.push(item.id);
        } else {
          const reason = await res.text().catch(() => res.statusText);
          failedItems.push({
            id: item.id,
            name: item.skinName || item.name,
            reason: reason || '上传失败',
          });
        }

        setUploadProgress({ done: i + 1, total });
      }

      if (successIds.length > 0) {
        const successSet = new Set(successIds);
        setPending((prev) => {
          const next = prev.filter((p) => !successSet.has(p.id));
          if (next.length === 0) {
            setSelectedIdx(0);
          } else if (selectedIdx >= next.length) {
            setSelectedIdx(next.length - 1);
          }
          return next;
        });
        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (const id of successIds) next.delete(id);
          return next;
        });
      }

      if (failedItems.length > 0) {
        const preview = failedItems
          .slice(0, 5)
          .map((f) => `- ${f.name}: ${f.reason}`)
          .join('\n');
        const more = failedItems.length > 5 ? `\n... 还有 ${failedItems.length - 5} 项失败` : '';
        alert(
          `上传完成：成功 ${successIds.length}，失败 ${failedItems.length}\n\n失败项：\n${preview}${more}`
        );
      } else {
        router.push('/skins');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : '上传失败，请稍后重试');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(pending.map((p) => p.id)));
  const selectNone = () => setSelectedIds(new Set());
  const selectInvert = () => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      for (const p of pending) {
        if (!prev.has(p.id)) next.add(p.id);
      }
      return next;
    });
  };

  const batchDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要移除选中的 ${selectedIds.size} 个皮肤吗？`)) return;
    setPending((prev) => {
      const next = prev.filter((p) => !selectedIds.has(p.id));
      if (selectedIdx >= next.length) setSelectedIdx(Math.max(0, next.length - 1));
      return next;
    });
    setSelectedIds(new Set());
  };

  const applyBatchTags = () => {
    setPending((prev) =>
      prev.map((p) => {
        if (!selectedIds.has(p.id)) return p;
        if (batchTagMode === 'override') {
          return { ...p, tags: [...batchTags] };
        }
        const merged = [...new Set([...p.tags, ...batchTags])];
        return { ...p, tags: merged };
      })
    );
    setBatchDialog(null);
    setBatchTags([]);
  };

  const applyBatchType = () => {
    setPending((prev) =>
      prev.map((p) => (selectedIds.has(p.id) ? { ...p, type: batchType } : p))
    );
    setBatchDialog(null);
    setBatchType('');
  };

  const applyBatchSlim = () => {
    setPending((prev) =>
      prev.map((p) => (selectedIds.has(p.id) ? { ...p, slim: batchSlim } : p))
    );
    setBatchDialog(null);
  };

  const applyBatchSource = () => {
    setPending((prev) =>
      prev.map((p) => (selectedIds.has(p.id) ? { ...p, source: batchSource } : p))
    );
    setBatchDialog(null);
    setBatchSource('');
  };

  const current = pending[selectedIdx];

  return (
    <div className='p-6 max-w-6xl mx-auto space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' onClick={() => router.push('/skins')}>
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <h1 className='text-2xl font-bold'>添加皮肤</h1>
      </div>

      <Tabs defaultValue='local'>
        <TabsList>
          <TabsTrigger value='local' className='gap-2'>
            <Upload className='h-4 w-4' />
            本地文件
          </TabsTrigger>
          <TabsTrigger value='site' className='gap-2'>
            <Globe className='h-4 w-4' />
            从站点导入
          </TabsTrigger>
        </TabsList>

        <TabsContent value='local' className='mt-4'>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className='h-8 w-8 mx-auto mb-2 text-muted-foreground' />
            <p className='text-sm text-muted-foreground'>
              拖放文件到这里，或点击选择文件
            </p>
            <p className='text-xs text-muted-foreground mt-1'>
              支持 PNG、JPG 格式，可多选
            </p>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/png,image/jpeg'
              multiple
              className='hidden'
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value='site' className='mt-4'>
          <div className='flex gap-2'>
            <Input
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder='输入 NameMC 或 MinecraftSkins 页面 URL'
              className='flex-1'
              onKeyDown={(e) => e.key === 'Enter' && handleSiteParse()}
            />
            <Button onClick={handleSiteParse} disabled={siteParsing || !siteUrl}>
              {siteParsing ? <Loader2 className='h-4 w-4 animate-spin' /> : '解析'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {pending.length > 0 && (
        <>
          {uploading ? (
            <div className='space-y-3 rounded-xl border bg-card p-6 text-card-foreground shadow-sm'>
              <div className='flex items-center justify-between gap-4'>
                <p className='text-sm font-medium'>正在上传</p>
                <p className='text-sm text-muted-foreground tabular-nums'>
                  {uploadProgress?.done ?? 0} / {uploadProgress?.total ?? pending.length}
                </p>
              </div>
              <div className='h-2 overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full rounded-full bg-primary transition-[width] duration-300'
                  style={{
                    width: `${uploadProgress && uploadProgress.total > 0
                      ? Math.round((100 * uploadProgress.done) / uploadProgress.total)
                      : 0}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <>
          {/* Selection toolbar */}
          <div className='flex flex-wrap items-center gap-2'>
            <div className='flex items-center gap-1'>
              <Button variant='outline' size='sm' onClick={selectAll} className='gap-1.5 h-8'>
                <CheckSquare className='h-3.5 w-3.5' />
                全选
              </Button>
              <Button variant='outline' size='sm' onClick={selectNone} className='gap-1.5 h-8'>
                <Square className='h-3.5 w-3.5' />
                全不选
              </Button>
              <Button variant='outline' size='sm' onClick={selectInvert} className='gap-1.5 h-8'>
                <ToggleLeft className='h-3.5 w-3.5' />
                反选
              </Button>
            </div>

            <Separator orientation='vertical' className='h-6' />

            <span className='text-sm text-muted-foreground'>
              已选 {selectedIds.size} / {pending.length} 项
            </span>

            {selectedIds.size > 0 && (
              <>
                <Separator orientation='vertical' className='h-6' />

                <div className='flex items-center gap-1'>
                  <Button
                    variant='outline' size='sm'
                    onClick={() => { setBatchDialog('tags'); setBatchTags([]); setBatchTagMode('append'); }}
                    className='gap-1.5 h-8'
                  >
                    <Tags className='h-3.5 w-3.5' />
                    标签
                  </Button>
                  <Button
                    variant='outline' size='sm'
                    onClick={() => { setBatchDialog('type'); setBatchType(''); }}
                    className='gap-1.5 h-8'
                  >
                    <FolderOpen className='h-3.5 w-3.5' />
                    分类
                  </Button>
                  <Button
                    variant='outline' size='sm'
                    onClick={() => { setBatchDialog('slim'); setBatchSlim(null); }}
                    className='gap-1.5 h-8'
                  >
                    <User className='h-3.5 w-3.5' />
                    纤细
                  </Button>
                  <Button
                    variant='outline' size='sm'
                    onClick={() => { setBatchDialog('source'); setBatchSource(''); }}
                    className='gap-1.5 h-8'
                  >
                    <Link2 className='h-3.5 w-3.5' />
                    来源
                  </Button>

                  <Separator orientation='vertical' className='h-6' />

                  <Button
                    variant='destructive' size='sm'
                    onClick={batchDeleteSelected}
                    className='gap-1.5 h-8'
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                    删除
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className='flex min-h-0 flex-col gap-6 md:max-h-[calc(100dvh-10rem)] md:flex-row md:items-stretch md:overflow-hidden'>
            <div className='flex min-h-0 w-full min-w-0 flex-col md:flex-1 md:overflow-hidden'>
              <Card className='flex max-md:max-h-[min(24rem,55vh)] max-md:flex-none min-h-0 flex-1 flex-col overflow-hidden'>
                <CardHeader>
                  <CardTitle className='text-lg'>文件列表</CardTitle>
                </CardHeader>
                <CardContent className='flex min-h-0 flex-1 flex-col overflow-hidden p-0'>
                  <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain'>
                    <div className='divide-y'>
                      {pending.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
                            idx === selectedIdx
                              ? 'bg-accent'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedIdx(idx)}
                        >
                          <input
                            type='checkbox'
                            checked={selectedIds.has(item.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelect(item.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className='rounded shrink-0'
                          />
                          <Image
                            src={item.file}
                            width={64}
                            height={64}
                            alt={item.skinName}
                            className='w-8 h-8 rounded object-cover shrink-0'
                            style={{ imageRendering: 'pixelated' }}
                          />
                          <div className='min-w-0 flex-1'>
                            <p className='text-sm font-medium truncate'>
                              {item.skinName || `文件 ${idx + 1}`}
                            </p>
                            <div className='flex items-center gap-1 mt-0.5'>
                              {item.slim === true && (
                                <Badge variant='outline' className='text-xs py-0 px-1'>Alex</Badge>
                              )}
                              {item.slim === false && (
                                <Badge variant='outline' className='text-xs py-0 px-1'>Steve</Badge>
                              )}
                              {item.type && (
                                <Badge variant='outline' className='text-xs py-0 px-1'>{item.type}</Badge>
                              )}
                              {item.tags.length > 0 && (
                                <Badge variant='outline' className='text-xs py-0 px-1'>
                                  {item.tags.length} 个标签
                                </Badge>
                              )}
                            </div>
                          </div>
                          <button
                            type='button'
                            className='shrink-0 rounded-full p-1 hover:bg-destructive/10 hover:text-destructive transition-colors'
                            onClick={(e) => {
                              e.stopPropagation();
                              removePending(item.id);
                            }}
                          >
                            <X className='h-3.5 w-3.5' />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {current && (
              <div className='min-w-0 w-full space-y-4 md:min-h-0 md:flex-1 md:overflow-y-auto'>
                <Card>
                  <CardContent className='flex justify-center p-6'>
                    <SkinViewer
                      key={`${current.id}-${String(current.slim)}`}
                      skinUrl={current.file}
                      slim={current.slim === true}
                      width={280}
                      height={360}
                      animate={false}
                      allowDrag={true}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='text-lg flex items-center gap-2'>
                      编辑
                      <Badge variant='secondary'>{selectedIdx + 1} / {pending.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='space-y-2'>
                      <Label>名称</Label>
                      <Input
                        value={current.skinName}
                        onChange={(e) => updatePending(current.id, { skinName: e.target.value })}
                        placeholder='名称'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='slim-select'>纤细</Label>
                      <Select
                        value={
                          current.slim === null ? 'unset' : current.slim ? 'yes' : 'no'
                        }
                        onValueChange={(v) =>
                          updatePending(current.id, {
                            slim: v === 'unset' ? null : v === 'yes',
                          })
                        }
                      >
                        <SelectTrigger id='slim-select' className='w-full'>
                          <SelectValue placeholder='选择' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='unset'>未设置</SelectItem>
                          <SelectItem value='yes'>是 (Alex)</SelectItem>
                          <SelectItem value='no'>否 (Steve)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <Label>分类</Label>
                      <Input
                        value={current.type}
                        onChange={(e) => updatePending(current.id, { type: e.target.value })}
                        placeholder='分类'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label>标签</Label>
                      <TagInput
                        value={current.tags}
                        onChange={(tags) => updatePending(current.id, { tags })}
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label>来源</Label>
                      <Input
                        value={current.source}
                        onChange={(e) => updatePending(current.id, { source: e.target.value })}
                        placeholder='来源 URL'
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <div className='flex flex-wrap items-center justify-end gap-4'>
            <label className='flex cursor-pointer items-center gap-2 text-sm'>
              <input
                type='checkbox'
                checked={autoDetectSlim}
                onChange={(e) => setAutoDetectSlim(e.target.checked)}
                className='rounded border-input'
              />
              <span>自动检测纤细</span>
            </label>
            <Button size='lg' onClick={handleUploadAll} className='gap-2'>
              <Check className='h-4 w-4' />
              上传全部 ({pending.length} 个)
            </Button>
          </div>
            </>
          )}
        </>
      )}

      {/* Batch Tags Dialog */}
      <Dialog open={batchDialog === 'tags'} onOpenChange={(open) => !open && setBatchDialog(null)}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>批量设置标签（{selectedIds.size} 项）</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='flex gap-2'>
              <Button
                variant={batchTagMode === 'append' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setBatchTagMode('append')}
              >
                追加
              </Button>
              <Button
                variant={batchTagMode === 'override' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setBatchTagMode('override')}
              >
                覆盖
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              {batchTagMode === 'append'
                ? '将标签追加到已有标签中（不重复）'
                : '替换所有已有标签'}
            </p>
            <TagInput value={batchTags} onChange={setBatchTags} />
            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setBatchDialog(null)}>取消</Button>
              <Button onClick={applyBatchTags}>应用</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Type Dialog */}
      <Dialog open={batchDialog === 'type'} onOpenChange={(open) => !open && setBatchDialog(null)}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>批量设置分类（{selectedIds.size} 项）</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <Input
              value={batchType}
              onChange={(e) => setBatchType(e.target.value)}
              placeholder='分类名称'
              autoFocus
            />
            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setBatchDialog(null)}>取消</Button>
              <Button onClick={applyBatchType}>应用</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Slim Dialog */}
      <Dialog open={batchDialog === 'slim'} onOpenChange={(open) => !open && setBatchDialog(null)}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>批量设置纤细（{selectedIds.size} 项）</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label>纤细模型</Label>
              <Select
                value={batchSlim === null ? 'unset' : batchSlim ? 'yes' : 'no'}
                onValueChange={(v) =>
                  setBatchSlim(v === 'unset' ? null : v === 'yes')
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='unset'>未设置</SelectItem>
                  <SelectItem value='yes'>是 (Alex)</SelectItem>
                  <SelectItem value='no'>否 (Steve)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setBatchDialog(null)}>取消</Button>
              <Button onClick={applyBatchSlim}>应用</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Source Dialog */}
      <Dialog open={batchDialog === 'source'} onOpenChange={(open) => !open && setBatchDialog(null)}>
        <DialogContent className='max-w-sm'>
          <DialogHeader>
            <DialogTitle>批量设置来源（{selectedIds.size} 项）</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <Input
              value={batchSource}
              onChange={(e) => setBatchSource(e.target.value)}
              placeholder='来源 URL'
              autoFocus
            />
            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setBatchDialog(null)}>取消</Button>
              <Button onClick={applyBatchSource}>应用</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
