'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { SkinViewer } from '@/components/skin-viewer';
import { TagInput } from '@/components/tag-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Trash2, ExternalLink } from 'lucide-react';

interface CapeData {
  id: number;
  name: string | null;
  type: string | null;
  tags: string[];
  source: string | null;
  filePath: string;
  createdAt: number;
  updatedAt: number;
}

export default function CapeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [cape, setCape] = useState<CapeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'cape' | 'elytra'>('cape');

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [source, setSource] = useState('');

  useEffect(() => {
    fetch(`/api/capes/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setCape(data);
        setName(data.name || '');
        setType(data.type || '');
        setTags(data.tags || []);
        setSource(data.source || '');
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/capes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name || null,
        type: type || null,
        tags,
        source: source || null,
      }),
    });
    setSaving(false);

    const res = await fetch(`/api/capes/${id}`);
    const data = await res.json();
    setCape(data);
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这个披风吗？')) return;
    await fetch(`/api/capes/${id}`, { method: 'DELETE' });
    router.push('/capes');
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

  if (!cape) {
    return (
      <div className='p-6 flex flex-col items-center justify-center py-20'>
        <p className='text-lg text-muted-foreground'>披风不存在</p>
        <Button variant='link' onClick={() => router.push('/capes')}>
          返回列表
        </Button>
      </div>
    );
  }

  const capeUrl = `/api/files/${cape.filePath}`;

  return (
    <div className='p-6 max-w-5xl mx-auto space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' onClick={() => router.push('/capes')}>
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <h1 className='text-2xl font-bold'>{cape.name || `披风 #${cape.id}`}</h1>
      </div>

      <div className='grid md:grid-cols-2 gap-6'>
        {/* 3D Preview */}
        <Card>
          <CardContent className='p-6 space-y-4'>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'cape' | 'elytra')}>
              <TabsList className='w-full'>
                <TabsTrigger value='cape' className='flex-1'>披风</TabsTrigger>
                <TabsTrigger value='elytra' className='flex-1'>鞘翅</TabsTrigger>
              </TabsList>
              <TabsContent value='cape' className='flex justify-center pt-4'>
                <SkinViewer
                  capeUrl={capeUrl}
                  elytra={false}
                  width={350}
                  height={450}
                  animate={true}
                  cameraPosition={{ x: 0, y: 5, z: -30 }}
                  allowDrag={true}
                />
              </TabsContent>
              <TabsContent value='elytra' className='flex justify-center pt-4'>
                <SkinViewer
                  capeUrl={capeUrl}
                  elytra={true}
                  width={350}
                  height={450}
                  animate={true}
                  cameraPosition={{ x: 0, y: 5, z: -30 }}
                  allowDrag={true}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <div className='space-y-4'>
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
                  placeholder='披风名称'
                />
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
              <p>ID: {cape.id}</p>
              <p>创建时间: {new Date(cape.createdAt).toLocaleString('zh-CN')}</p>
              <p>更新时间: {new Date(cape.updatedAt).toLocaleString('zh-CN')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
