'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface SkinItem {
  id: number;
  name: string;
  filePath: string;
}

interface CapeItem {
  id: number;
  name: string;
  filePath: string;
}

export default function AddProfilePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [skinId, setSkinId] = useState<string>('');
  const [capeId, setCapeId] = useState<string>('');
  const [skins, setSkins] = useState<SkinItem[]>([]);
  const [capes, setCapes] = useState<CapeItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/skins?limit=1000').then(r => r.json()),
      fetch('/api/capes?limit=1000').then(r => r.json()),
    ]).then(([skinsData, capesData]) => {
      setSkins(skinsData.list || []);
      setCapes(capesData.list || []);
    });
  }, []);

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
          skinId: skinId ? parseInt(skinId) : null,
          capeId: capeId ? parseInt(capeId) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '创建失败');
        return;
      }
      router.push('/profiles');
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

      <Card>
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
              <Select value={skinId} onValueChange={setSkinId}>
                <SelectTrigger>
                  <SelectValue placeholder='选择皮肤（可选）' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>无皮肤</SelectItem>
                  {skins.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name || `皮肤 #${s.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>披风</Label>
              <Select value={capeId} onValueChange={setCapeId}>
                <SelectTrigger>
                  <SelectValue placeholder='选择披风（可选）' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>无披风</SelectItem>
                  {capes.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name || `披风 #${c.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
