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

export default function LoginPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [allowRegistration, setAllowRegistration] = useState(false);

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
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: await sha256(password), turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '登录失败');
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

  return (
    <div className='grid place-items-center h-full p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl'>登录</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='username'>用户名</Label>
              <Input
                id='username'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder='请输入用户名'
                autoComplete='username'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>密码</Label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='请输入密码'
                autoComplete='current-password'
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
              登录
            </Button>

            {allowRegistration && (<p className='text-sm text-center text-muted-foreground'>
              还没有账号？{' '}
              <Link href='/register' className='text-primary hover:underline'>
                注册
              </Link>
            </p>)}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
