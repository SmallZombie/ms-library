'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SkinViewer } from '@/components/skin-viewer';
import { TagInput } from '@/components/tag-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Upload, X, Loader2, Check } from 'lucide-react';
import SparkMD5 from 'spark-md5';

interface PendingCape {
  id: string;
  name: string;
  file: string;
  fileMD5: string;
  capeName: string;
  type: string;
  tags: string[];
  source: string;
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

export default function AddCapePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingCape[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const newPending: PendingCape[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const dataURL = await fileToDataURL(file);
      const md5 = computeMD5(dataURL);

      newPending.push({
        id: crypto.randomUUID(),
        name: file.name.replace(/\.\w+$/, ''),
        file: dataURL,
        fileMD5: md5,
        capeName: file.name.replace(/\.\w+$/, ''),
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

  const removePending = (id: string) => {
    setPending((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (selectedIdx >= next.length) setSelectedIdx(Math.max(0, next.length - 1));
      return next;
    });
  };

  const updatePending = (id: string, updates: Partial<PendingCape>) => {
    setPending((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleUploadAll = async () => {
    if (pending.length === 0) return;
    setUploading(true);

    for (const item of pending) {
      await fetch('/api/capes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.capeName || null,
          type: item.type || null,
          tags: item.tags,
          source: item.source || null,
          file: item.file,
          fileMD5: item.fileMD5,
        }),
      });
    }

    setUploading(false);
    router.push('/capes');
  };

  const current = pending[selectedIdx];

  return (
    <div className='p-6 max-w-5xl mx-auto space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' onClick={() => router.push('/capes')}>
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <h1 className='text-2xl font-bold'>添加披风</h1>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
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
          拖放披风文件到这里，或点击选择文件
        </p>
        <p className='text-xs text-muted-foreground mt-1'>
          支持 PNG 格式，可多选
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

      {pending.length > 0 && (
        <>
          <div className='flex flex-wrap gap-2'>
            {pending.map((item, idx) => (
              <Badge
                key={item.id}
                variant={idx === selectedIdx ? 'default' : 'outline'}
                className='cursor-pointer gap-1 pr-0.5'
                onClick={() => setSelectedIdx(idx)}
              >
                {item.capeName || `文件 ${idx + 1}`}
                <button
                  type='button'
                  className='ml-1 rounded-full p-0.5 hover:bg-foreground/20 transition-colors'
                  onClick={(e) => {
                    e.stopPropagation();
                    removePending(item.id);
                  }}
                >
                  <X className='h-3 w-3' />
                </button>
              </Badge>
            ))}
          </div>

          {current && (
            <div className='grid md:grid-cols-2 gap-6'>
              <Card>
                <CardContent className='flex justify-center p-6'>
                  <SkinViewer
                    capeUrl={current.file}
                    width={300}
                    height={400}
                    animate={false}
                    cameraPosition={{ x: 0, y: 5, z: -30 }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    披风详情
                    <Badge variant='secondary'>{selectedIdx + 1} / {pending.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>名称</Label>
                    <Input
                      value={current.capeName}
                      onChange={(e) => updatePending(current.id, { capeName: e.target.value })}
                      placeholder='披风名称'
                    />
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

          <div className='flex justify-end'>
            <Button
              size='lg'
              onClick={handleUploadAll}
              disabled={uploading}
              className='gap-2'
            >
              {uploading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Check className='h-4 w-4' />
              )}
              上传全部 ({pending.length} 个)
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
