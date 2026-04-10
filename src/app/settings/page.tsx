'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { sha256 } from '@/lib/hash';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwMessage('');

    if (newPassword.length < 6) {
      setPwError('新密码长度至少 6 个字符');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('两次输入的新密码不一致');
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: await sha256(oldPassword),
          newPassword: await sha256(newPassword),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error || '修改失败');
        return;
      }
      setPwMessage('密码修改成功');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPwError('网络错误');
    } finally {
      setPwLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setDeleteError('');

    if (!deletePassword) {
      setDeleteError('请输入密码确认');
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: await sha256(deletePassword) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || '删除失败');
        return;
      }
      await logout();
      router.push('/login');
    } catch {
      setDeleteError('网络错误');
    } finally {
      setDeleteLoading(false);
    }
  }

  if (!user) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  return (
    <div className='p-6 max-w-2xl mx-auto space-y-6'>
      <div className='flex items-center gap-4'>
        <Link href='/skins'>
          <Button variant='ghost' size='icon'><ArrowLeft className='h-4 w-4' /></Button>
        </Link>
        <h1 className='text-2xl font-bold'>账户设置</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>账户信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <Label>用户名</Label>
            <Input value={user.username} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='oldPassword'>当前密码</Label>
              <Input
                id='oldPassword'
                type='password'
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder='请输入当前密码'
                autoComplete='current-password'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='newPassword'>新密码</Label>
              <Input
                id='newPassword'
                type='password'
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder='至少 6 个字符'
                autoComplete='new-password'
                required
                minLength={6}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmNewPassword'>确认新密码</Label>
              <Input
                id='confirmNewPassword'
                type='password'
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder='请再次输入新密码'
                autoComplete='new-password'
                required
              />
            </div>

            {pwError && <p className='text-sm text-destructive'>{pwError}</p>}
            {pwMessage && <p className='text-sm text-green-600'>{pwMessage}</p>}

            <Button type='submit' disabled={pwLoading}>
              {pwLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              修改密码
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className='border-destructive/50'>
        <CardHeader>
          <CardTitle className='text-destructive'>删除账户</CardTitle>
          <CardDescription>
            删除后将清除你的所有数据（皮肤、披风、角色等），且无法恢复。
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {deleteConfirm && (
            <div className='space-y-2'>
              <Label htmlFor='deletePassword'>输入密码确认删除</Label>
              <Input
                id='deletePassword'
                type='password'
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                placeholder='请输入当前密码'
                autoComplete='current-password'
              />
            </div>
          )}

          {deleteError && <p className='text-sm text-destructive'>{deleteError}</p>}

          <Button
            variant='destructive'
            onClick={handleDeleteAccount}
            disabled={deleteLoading}
          >
            {deleteLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {deleteConfirm ? '确认删除账户' : '删除账户'}
          </Button>

          {deleteConfirm && (
            <Button
              variant='ghost'
              className='ml-2'
              onClick={() => { setDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); }}
            >
              取消
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
