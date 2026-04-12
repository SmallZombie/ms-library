'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { SkinViewer } from '@/components/skin-viewer';
import { TagInput } from '@/components/tag-input';
import { CapeTile } from '@/components/cape-tile';
import { CapeSelectDialog, type CapeSelectItem } from '@/components/cape-select-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeft, Save, Trash2, ExternalLink, Link2, Unlink, Pause, Play, Download } from 'lucide-react';

interface SkinData {
  id: number;
  name: string | null;
  slim: boolean;
  type: string | null;
  tags: string[];
  source: string | null;
  filePath: string;
  linkedCapeId: number | null;
  createdAt: number;
  updatedAt: number;
  cape: {
    id: number;
    name: string | null;
    type: string | null;
    tags: string[];
    filePath: string;
  } | null;
}

export default function SkinDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [skin, setSkin] = useState<SkinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const [name, setName] = useState('');
  const [slim, setSlim] = useState(false);
  const [type, setType] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [source, setSource] = useState('');
  const [selectedCape, setSelectedCape] = useState<CapeSelectItem | null>(null);

  const [capeDialogOpen, setCapeDialogOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/skins/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setSkin(data);
        setName(data.name || '');
        setSlim(data.slim ?? false);
        setType(data.type || '');
        setTags(data.tags || []);
        setSource(data.source || '');
        setSelectedCape(data.cape ?? null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/skins/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name || null,
        slim,
        type: type || null,
        tags,
        source: source || null,
        linkedCapeId: selectedCape?.id ?? null,
      }),
    });
    setSaving(false);

    const res = await fetch(`/api/skins/${id}`);
    const data = await res.json();
    setSkin(data);
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个皮肤吗？')) return;
    await fetch(`/api/skins/${id}`, { method: 'DELETE' });
    router.push('/skins');
  };

  if (loading) {
    return (
      <div className='p-6 max-w-5xl mx-auto space-y-6'>
        <Skeleton className='h-8 w-48' />
        <div className='grid md:grid-cols-2 gap-6'>
          <Skeleton className='h-96' />
          <div className='space-y-4'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
        </div>
      </div>
    );
  }

  if (!skin) {
    return (
      <div className='p-6 flex flex-col items-center justify-center py-20'>
        <p className='text-lg text-muted-foreground'>皮肤不存在</p>
        <Button variant='link' onClick={() => router.push('/skins')}>
          返回列表
        </Button>
      </div>
    );
  }

  const skinUrl = `/api/files/${skin.filePath}`;
  const capeUrl = selectedCape ? `/api/files/${selectedCape.filePath}` : void 0;

  return (
    <div className='p-6 max-w-5xl mx-auto space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' onClick={() => router.push('/skins')}>
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <h1 className='text-2xl font-bold'>{skin.name || `皮肤 #${skin.id}`}</h1>
      </div>

      <div className='grid items-start md:grid-cols-2 gap-6'>
        <Card className='pt-0'>
          <CardContent className='space-y-4 p-0 pb-4'>
            <div className='-flex justify-center'>
              <SkinViewer className='w-full h-full'
                key={`${skin.filePath}:${selectedCape?.filePath ?? 'no-cape'}`}
                skinUrl={skinUrl}
                capeUrl={capeUrl}
                slim={slim}
                width={350}
                height={600}
                animate={isAnimating}
                allowDrag={true}
              />
            </div>
            <div className='flex justify-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setIsAnimating((prev) => !prev)}
                className='gap-1.5'
              >
                {isAnimating ? (
                    <Pause className='h-3.5 w-3.5' />
                ) : (
                    <Play className='h-3.5 w-3.5' />
                )}
              </Button>
              <Button variant='outline' size='sm' className='gap-1.5' asChild>
                <a href={skinUrl} download={`${name}.png`}>
                  <Download className='h-3.5 w-3.5' />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className='space-y-4 min-w-0'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>基本信息</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>名称</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='皮肤名称'
                />
              </div>

              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='detail-slim'
                  checked={slim}
                  onChange={(e) => setSlim(e.target.checked)}
                  className='rounded'
                />
                <Label htmlFor='detail-slim'>纤细模型 (Alex)</Label>
              </div>

              <div className='space-y-2'>
                <Label>分类</Label>
                <Input
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder='分类'
                />
              </div>

              <div className='space-y-2'>
                <Label>标签</Label>
                <TagInput value={tags} onChange={setTags} />
              </div>

              <div className='space-y-2'>
                <Label>来源</Label>
                <div className='flex gap-2'>
                  <Input
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder='来源 URL'
                  />
                  {source && (
                    <Button variant='outline' size='icon' asChild>
                      <a href={source} target='_blank' rel='noopener noreferrer'>
                        <ExternalLink className='h-4 w-4' />
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              <div className='space-y-2'>
                <Label className='flex items-center gap-2'>
                  <Link2 className='h-4 w-4' />
                  关联披风
                </Label>

                {selectedCape ? (
                  <div className='space-y-2'>
                    <CapeTile
                      id={selectedCape.id}
                      name={selectedCape.name}
                      type={selectedCape.type}
                      tags={selectedCape.tags}
                      filePath={selectedCape.filePath}
                      selected={true}
                    />
                    <div className='flex gap-2'>
                      <Dialog open={capeDialogOpen} onOpenChange={setCapeDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant='outline' size='sm' className='gap-1.5'>
                            <Link2 className='h-3.5 w-3.5' />
                            更换
                          </Button>
                        </DialogTrigger>
                        <CapeSelectDialog
                          selectedId={selectedCape.id}
                          onSelect={(cape) => { setSelectedCape(cape); setCapeDialogOpen(false); }}
                        />
                      </Dialog>
                      <Button variant='outline' size='sm' onClick={() => setSelectedCape(null)} className='gap-1.5'>
                        <Unlink className='h-3.5 w-3.5' />
                        取消关联
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Dialog open={capeDialogOpen} onOpenChange={setCapeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant='outline' className='w-full gap-2'>
                        <Link2 className='h-4 w-4' />
                        选择披风
                      </Button>
                    </DialogTrigger>
                    <CapeSelectDialog
                      selectedId={null}
                      onSelect={(cape) => { setSelectedCape(cape); setCapeDialogOpen(false); }}
                    />
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>

          <div className='flex gap-2'>
            <Button onClick={handleSave} disabled={saving} className='flex-1 gap-2'>
              <Save className='h-4 w-4' />
              {saving ? '保存中...' : '保存'}
            </Button>
            <Button variant='destructive' onClick={handleDelete} className='gap-2'>
              <Trash2 className='h-4 w-4' />
              删除
            </Button>
          </div>

          <Card>
            <CardContent className='p-4 text-sm text-muted-foreground space-y-1'>
              <p>ID: {skin.id}</p>
              <p>创建时间: {new Date(skin.createdAt).toLocaleString('zh-CN')}</p>
              <p>更新时间: {new Date(skin.updatedAt).toLocaleString('zh-CN')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
