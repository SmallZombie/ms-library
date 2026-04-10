import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db/init';
import { getSession } from '@/lib/auth';
import { getAllSettings, setSetting, SettingKey } from '@/lib/settings';

export async function GET() {
  await initDb();
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const settings = await getAllSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  await initDb();
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const allowedKeys: SettingKey[] = ['siteName', 'siteUrl', 'allowRegistration', 'turnstileEnabled', 'turnstileSiteKey', 'turnstileSecretKey'];

  for (const key of allowedKeys) {
    if (body[key] !== undefined) {
      await setSetting(key, String(body[key]));
    }
  }

  return NextResponse.json({ success: true });
}
