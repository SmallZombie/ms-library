'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import { Turnstile } from '@/components/turnstile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { sha256 } from '@/lib/hash';

export default function RegisterPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [allowRegistration, setAllowRegistration] = useState(true);

  useEffect(() => {
    if (user) {
      router.replace('/skins');
      return;
    }
    fetch('/api/settings/public')
      .then(r => r.json())
      .then(data => {
        if (data.turnstileSiteKey) setTurnstileSiteKey(data.turnstileSiteKey);
        setAllowRegistration(data.allowRegistration);
      });
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: await sha256(password), turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '注册失败');
        return;
      }
      await refresh();
      router.push('/skins');
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }

  if (!allowRegistration) {
    return (
      <div className='flex items-center justify-center min-h-screen p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>不可用</CardTitle>
          </CardHeader>
          <CardContent className='text-center'>
            <p className='text-muted-foreground mb-4'>管理员已禁用注册</p>
            <Link href='/login'>
              <Button variant='outline'>返回登录</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='flex items-center justify-center min-h-screen p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl'>注册</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='username'>用户名</Label>
              <Input
                id='username'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder='3-32 个字符'
                autoComplete='username'
                required
                minLength={3}
                maxLength={32}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>密码</Label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='至少 6 个字符'
                autoComplete='new-password'
                required
                minLength={6}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>确认密码</Label>
              <Input
                id='confirmPassword'
                type='password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder='请再次输入密码'
                autoComplete='new-password'
                required
              />
            </div>

            {turnstileSiteKey && (
              <div className='flex justify-center'>
                <Turnstile siteKey={turnstileSiteKey} onVerify={setTurnstileToken} />
              </div>
            )}

            {error && (
              <p className='text-sm text-destructive text-center'>{error}</p>
            )}

            <Button type='submit' className='w-full' disabled={loading}>
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              注册
            </Button>

            <p className='text-sm text-center text-muted-foreground'>
              已有账号？{' '}
              <Link href='/login' className='text-primary hover:underline'>
                登录
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
