import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db/init';
import { getPublicKeyPem } from '@/lib/yggdrasil/keys';
import { getSetting } from '@/lib/settings';

// reference: https://github.com/yushijinhun/authlib-injector/wiki/启动器技术规范
export async function GET() {
  await initDb();

  const publicKey = getPublicKeyPem();
  const [siteName, siteUrl] = await Promise.all([
    getSetting('siteName'),
    getSetting('siteUrl'),
  ]);

  if (!siteUrl) {
    return NextResponse.json({ error: 'Site URL is not set' }, { status: 500 });
  }
  const skinDomain = new URL(siteUrl).hostname;

  return NextResponse.json({
    meta: {
      serverName: siteName || 'MSLibrary',
      implementationName: 'ms-library-yggdrasil',
      implementationVersion: '1.0.0',
      links: {
        homepage: siteUrl,
        register: `${siteUrl}/register`,
      },
      'feature.non_email_login': true,
    },
    skinDomains: [skinDomain],
    signaturePublickey: publicKey,
  });
}
