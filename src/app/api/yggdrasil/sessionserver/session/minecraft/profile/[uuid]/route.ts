import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { initDb } from '@/lib/db/init';
import { serializeProfile, buildTexturesProperty } from '@/lib/yggdrasil';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  await initDb();
  const { uuid } = await params;

  const profile = await db.select().from(schema.profiles)
    .where(eq(schema.profiles.id, uuid))
    .limit(1)
    .then(r => r[0]);

  if (!profile) {
    return new NextResponse(null, { status: 204 });
  }

  const unsigned = request.nextUrl.searchParams.get('unsigned') !== 'false';
  const host = request.headers.get('host') || 'localhost';
  const texturesValue = await buildTexturesProperty(profile, host);

  return NextResponse.json(
    serializeProfile(profile, true, texturesValue, !unsigned)
  );
}
