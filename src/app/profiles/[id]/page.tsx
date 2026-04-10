'use client';

import { useState, useEffect, use } from 'react';
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
import { Loader2, ArrowLeft, Save, Unlink } from 'lucide-react';
import Link from 'next/link';

export default function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [name, setName] = useState('');
  const [selectedSkin, setSelectedSkin] = useState<SkinSelectItem | null>(null);
  const [selectedCape, setSelectedCape] = useState<CapeSelectItem | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [yggdrasilServer, setYggdrasilServer] = useState('');

  const [skinDialogOpen, setSkinDialogOpen] = useState(false);
  const [capeDialogOpen, setCapeDialogOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/profiles/${id}`).then(r => r.json()),
      fetch('/api/settings/public').then(r => r.json()),
    ]).then(async ([profile, settingsData]) => {
      setName(profile.name || '');
      setYggdrasilServer(settingsData.yggdrasilServer || '');

      const fetches: Promise<void>[] = [];
      if (profile.skinId) {
        fetches.push(
          fetch(`/api/skins/${profile.skinId}`).then(r => r.json()).then(data => {
            setSelectedSkin(data);
          }).catch(() => {})
        );
      }
      if (profile.capeId) {
        fetches.push(
          fetch(`/api/capes/${profile.capeId}`).then(r => r.json()).then(data => {
            setSelectedCape(data);
          }).catch(() => {})
        );
      }
      await Promise.all(fetches);
      setLoading(false);
    });
  }, [id]);

  async function handleSave() {
    setError('');
    setMessage('');
    setSaving(true);

    try {
      const res = await fetch(`/api/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          skinId: selectedSkin?.id ?? null,
          capeId: selectedCape?.id ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '保存失败');
        return;
      }
      setMessage('保存成功');
    } catch {
      setError('网络错误');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  return (
    <div className='p-6 max-w-2xl mx-auto space-y-6'>
      <div className='flex items-center gap-4'>
        <Link href='/profiles'>
          <Button variant='ghost' size='icon'><ArrowLeft className='h-4 w-4' /></Button>
        </Link>
        <h1 className='text-2xl font-bold'>编辑角色</h1>
      </div>

      <Card className='gap-0 pt-0'>
        <CardContent className='pt-6 space-y-4'>
          {(yggdrasilServer && <div className='space-y-2'>
            <p className='text-sm text-muted-foreground'>
              将 <a href={`authlib-injector:yggdrasil-server:${encodeURIComponent(yggdrasilServer)}`}>此链接</a> 拖拽到受支持的启动器来快捷添加第三方验证。
            </p>
          </div>)}

          <div className='space-y-2'>
            <Label>角色名</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              pattern='^[a-zA-Z0-9_]{3,16}$'
            />
          </div>

          <div className='space-y-2'>
            <Label>UUID</Label>
            <Input value={id} readOnly className='font-mono text-sm opacity-70' />
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

          <div className='flex items-center gap-4'>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Save className='mr-2 h-4 w-4' />}
              保存
            </Button>
            {message && <span className='text-sm text-muted-foreground'>{message}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
