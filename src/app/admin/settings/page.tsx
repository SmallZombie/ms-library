'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: '',
    siteUrl: '',
    allowRegistration: 'true',
    turnstileEnabled: 'false',
    turnstileSiteKey: '',
    turnstileSecretKey: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setSettings({
          siteName: data.siteName || '',
          siteUrl: data.siteUrl || '',
          allowRegistration: data.allowRegistration || 'true',
          turnstileEnabled: data.turnstileEnabled || 'false',
          turnstileSiteKey: data.turnstileSiteKey || '',
          turnstileSecretKey: data.turnstileSecretKey || '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage('');

    const urlPattern = /^https?:\/\/((([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})|((\d{1,3}\.){3}\d{1,3}))(:\d+)?([/?#][^\s]*)?$/;
    if (!urlPattern.test(settings.siteUrl) || settings.siteUrl.endsWith('/')) {
      setMessage('站点 URL 无效');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setMessage('保存成功');
      } else {
        setMessage('保存失败');
      }
    } catch {
      setMessage('网络错误');
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
        <Link href='/admin/users'>
          <Button variant='ghost' size='icon'><ArrowLeft className='h-4 w-4' /></Button>
        </Link>
        <h1 className='text-2xl font-bold'>站点设置</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>基本设置</CardTitle></CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label>站点名称</Label>
            <Input
              value={settings.siteName}
              onChange={e => setSettings(s => ({ ...s, siteName: e.target.value }))}
            />
          </div>
          <div className='space-y-2'>
            <Label>站点 URL</Label>
            <Input
              value={settings.siteUrl}
              onChange={e => setSettings(s => ({ ...s, siteUrl: e.target.value }))}
              placeholder='http(s)://example.com'
            />
            <p className='text-sm text-muted-foreground'>
              用于 Yggdrasil API，结尾不能有斜杠。
            </p>
          </div>
          <div className='space-y-2'>
            <Label>开放注册</Label>
            <select
              className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm'
              value={settings.allowRegistration}
              onChange={e => setSettings(s => ({ ...s, allowRegistration: e.target.value }))}
            >
              <option value='true'>是</option>
              <option value='false'>否</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cloudflare Turnstile</CardTitle></CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label>启用验证码</Label>
            <select
              className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm'
              value={settings.turnstileEnabled}
              onChange={e => setSettings(s => ({ ...s, turnstileEnabled: e.target.value }))}
            >
              <option value='true'>启用</option>
              <option value='false'>停用</option>
            </select>
            <p className='text-sm text-muted-foreground'>
              启用后，登录和注册页面将显示验证码。
            </p>
          </div>
          <div className='space-y-2'>
            <Label>Site Key</Label>
            <Input
              value={settings.turnstileSiteKey}
              onChange={e => setSettings(s => ({ ...s, turnstileSiteKey: e.target.value }))}
              placeholder='1x00000000000000000000AA'
            />
          </div>
          <div className='space-y-2'>
            <Label>Secret Key</Label>
            <Input
              type='password'
              value={settings.turnstileSecretKey}
              onChange={e => setSettings(s => ({ ...s, turnstileSecretKey: e.target.value }))}
              placeholder='1x0000000000000000000000000000000AA'
            />
          </div>
        </CardContent>
      </Card>

      <div className='flex items-center gap-4'>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Save className='mr-2 h-4 w-4' />}
          保存设置
        </Button>
        {message && <span className='text-sm text-muted-foreground'>{message}</span>}
      </div>
    </div>
  );
}
