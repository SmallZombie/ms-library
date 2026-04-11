'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Trash2, User, Shirt } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  skin: { id: number; name: string; filePath: string } | null;
  cape: { id: number; name: string; filePath: string } | null;
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch('/api/profiles');
    const data = await res.json();
    setProfiles(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`确认删除角色 "${name}"？`)) return;
    await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
    load();
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  return (
    <div className='p-6 max-w-4xl mx-auto space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>我的角色</h1>
        <Link href='/profiles/add'>
          <Button><Plus className='h-4 w-4 mr-2' />创建角色</Button>
        </Link>
      </div>

      {profiles.length === 0 ? (
        <div className='text-center py-12 text-muted-foreground'>
          <p>还没有角色</p>
          <p className='text-sm mt-1'>创建一个角色来在 Minecraft 中使用你的皮肤</p>
        </div>
      ) : (
        <div className='space-y-3'>
          {profiles.map(profile => (
            <Card key={profile.id}>
              <CardContent className='flex items-center justify-between py-4'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium font-mono'>{profile.name}</span>
                  </div>
                  <div className='flex items-center flex-wrap gap-x-3 text-sm text-muted-foreground'>
                    <span className='flex items-center gap-1'>
                      <User className='h-3 w-3' />
                      {profile.skin ? profile.skin.name || '未命名皮肤' : '无皮肤'}
                    </span>
                    <span className='flex items-center gap-1'>
                      <Shirt className='h-3 w-3' />
                      {profile.cape ? profile.cape.name || '未命名披风' : '无披风'}
                    </span>
                  </div>
                  <div className='text-xs text-muted-foreground font-mono'>
                    UUID: {profile.id}
                  </div>
                </div>
                <div className='flex gap-2'>
                  <Link href={`/profiles/${profile.id}`}>
                    <Button variant='outline' size='sm'>编辑</Button>
                  </Link>
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() => handleDelete(profile.id, profile.name)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
