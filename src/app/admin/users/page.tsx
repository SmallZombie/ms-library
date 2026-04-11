'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Shield, ShieldOff } from 'lucide-react';

interface UserInfo {
  id: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
  skinCount: number;
  capeCount: number;
  profileCount: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function toggleAdmin(userId: string, isAdmin: boolean) {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAdmin: !isAdmin }),
    });
    loadUsers();
  }

  async function deleteUser(userId: string, username: string) {
    if (!confirm(`确认删除用户 "${username}" 及其所有数据？此操作不可恢复。`)) return;
    await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    loadUsers();
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
      <h1 className='text-2xl font-bold'>用户管理</h1>

      <div className='space-y-3'>
        {users.map(user => (
          <Card key={user.id}>
            <CardContent className='flex items-center justify-between py-4'>
              <div className='space-y-1'>
                <div className='flex items-center gap-2'>
                  <span className='font-medium'>{user.username}</span>
                  {user.isAdmin && <Badge variant='secondary'>管理员</Badge>}
                </div>
                <div className='text-sm text-muted-foreground'>
                  皮肤: {user.skinCount} · 披风: {user.capeCount} · 角色: {user.profileCount}
                </div>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => toggleAdmin(user.id, user.isAdmin)}
                >
                  {user.isAdmin
                    ? <><ShieldOff className='h-4 w-4 mr-1' />取消管理员</>
                    : <><Shield className='h-4 w-4 mr-1' />设为管理员</>}
                </Button>
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={() => deleteUser(user.id, user.username)}
                >
                  <Trash2 className='h-4 w-4 mr-1' />删除
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
