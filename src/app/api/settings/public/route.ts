import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db/init';
import { getSetting } from '@/lib/settings';

export async function GET() {
  await initDb();

  const [
    siteName,
    allowRegistration,
    turnstileEnabled,
    turnstileSiteKey,
    siteUrl,
  ] = await Promise.all([
    getSetting('siteName'),
    getSetting('allowRegistration'),
    getSetting('turnstileEnabled'),
    getSetting('turnstileSiteKey'),
    getSetting('siteUrl'),
  ]);
  return NextResponse.json({
    siteName,
    allowRegistration: allowRegistration !== 'false',
    turnstileSiteKey: turnstileEnabled === 'true' ? turnstileSiteKey : '',
    yggdrasilServer: `${siteUrl}/api/yggdrasil`,
  });
}
