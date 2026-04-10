'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { SkinTile } from '@/components/skin-tile';
import { CapeTile } from '@/components/cape-tile';
import { SkinSelectDialog, type SkinSelectItem } from '@/components/skin-select-dialog';
import { CapeSelectDialog, type CapeSelectItem } from '@/components/cape-select-dialog';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Unlink } from 'lucide-react';
import Link from 'next/link';

export default function AddProfilePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedSkin, setSelectedSkin] = useState<SkinSelectItem | null>(null);
  const [selectedCape, setSelectedCape] = useState<CapeSelectItem | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [skinDialogOpen, setSkinDialogOpen] = useState(false);
  const [capeDialogOpen, setCapeDialogOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          skinId: selectedSkin?.id ?? null,
          capeId: selectedCape?.id ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '创建失败');
        return;
      }
      router.push(`/profiles/${data.id}`);
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='p-6 max-w-2xl mx-auto space-y-6'>
      <div className='flex items-center gap-4'>
        <Link href='/profiles'>
          <Button variant='ghost' size='icon'><ArrowLeft className='h-4 w-4' /></Button>
        </Link>
        <h1 className='text-2xl font-bold'>创建角色</h1>
      </div>

      <Card className='gap-0 pt-0'>
        <CardContent className='pt-6'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label>角色名</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder='3-16 个字符，只能包含字母、数字和下划线'
                pattern='^[a-zA-Z0-9_]{3,16}$'
                required
              />
              <p className='text-xs text-muted-foreground'>
                角色名需要符合 Minecraft 命名规范
              </p>
            </div>

            <div className='space-y-2'>
              <Label>皮肤</Label>
              {selectedSkin ? (
                <div className='space-y-2'>
                  <SkinTile
                    id={selectedSkin.id}
                    name={selectedSkin.name}
                    type={selectedSkin.type}
                    tags={selectedSkin.tags}
                    filePath={selectedSkin.filePath}
                    slim={selectedSkin.slim}
                    selected
                  />
                  <div className='flex gap-2'>
                    <Dialog open={skinDialogOpen} onOpenChange={setSkinDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant='outline' size='sm'>更换</Button>
                      </DialogTrigger>
                      <SkinSelectDialog
                        selectedId={selectedSkin.id}
                        onSelect={(skin) => { setSelectedSkin(skin); setSkinDialogOpen(false); }}
                      />
                    </Dialog>
                    <Button variant='outline' size='sm' onClick={() => setSelectedSkin(null)} className='gap-1.5'>
                      <Unlink className='h-3.5 w-3.5' />
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <Dialog open={skinDialogOpen} onOpenChange={setSkinDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant='outline' className='w-full'>选择皮肤</Button>
                  </DialogTrigger>
                  <SkinSelectDialog
                    selectedId={null}
                    onSelect={(skin) => { setSelectedSkin(skin); setSkinDialogOpen(false); }}
                  />
                </Dialog>
              )}
            </div>

            <div className='space-y-2'>
              <Label>披风</Label>
              {selectedCape ? (
                <div className='space-y-2'>
                  <CapeTile
                    id={selectedCape.id}
                    name={selectedCape.name}
                    type={selectedCape.type}
                    tags={selectedCape.tags}
                    filePath={selectedCape.filePath}
                    selected
                  />
                  <div className='flex gap-2'>
                    <Dialog open={capeDialogOpen} onOpenChange={setCapeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant='outline' size='sm'>更换</Button>
                      </DialogTrigger>
                      <CapeSelectDialog
                        selectedId={selectedCape.id}
                        onSelect={(cape) => { setSelectedCape(cape); setCapeDialogOpen(false); }}
                      />
                    </Dialog>
                    <Button variant='outline' size='sm' onClick={() => setSelectedCape(null)} className='gap-1.5'>
                      <Unlink className='h-3.5 w-3.5' />
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <Dialog open={capeDialogOpen} onOpenChange={setCapeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant='outline' className='w-full'>选择披风</Button>
                  </DialogTrigger>
                  <CapeSelectDialog
                    selectedId={null}
                    onSelect={(cape) => { setSelectedCape(cape); setCapeDialogOpen(false); }}
                  />
                </Dialog>
              )}
              <p className='text-sm text-muted-foreground'>一些 OptiFine 披风可能无法在游戏中正确显示</p>
            </div>

            {error && <p className='text-sm text-destructive'>{error}</p>}

            <Button type='submit' className='w-full' disabled={loading}>
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              创建角色
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
