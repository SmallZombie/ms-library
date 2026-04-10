import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { initDb } from '@/lib/db/init';
import { verifyJoin } from '@/lib/yggdrasil/session-store';
import { serializeProfile, buildTexturesProperty } from '@/lib/yggdrasil';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  await initDb();

  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username');
  const serverId = searchParams.get('serverId');
  const ip = searchParams.get('ip') || undefined;

  if (!username || !serverId) {
    return new NextResponse(null, { status: 204 });
  }

  const entry = verifyJoin(serverId, username, ip);
  if (!entry) {
    return new NextResponse(null, { status: 204 });
  }

  const profile = await db.select().from(schema.profiles)
    .where(eq(schema.profiles.id, entry.profileId))
    .limit(1)
    .then(r => r[0]);

  if (!profile || profile.name.toLowerCase() !== username.toLowerCase()) {
    return new NextResponse(null, { status: 204 });
  }

  const host = request.headers.get('host') || 'localhost';
  const texturesValue = await buildTexturesProperty(profile, host);

  return NextResponse.json(
    serializeProfile(profile, true, texturesValue, true)
  );
}
