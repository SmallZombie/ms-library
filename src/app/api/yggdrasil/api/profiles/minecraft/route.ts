import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { initDb } from '@/lib/db/init';
import { serializeProfile } from '@/lib/yggdrasil';
import { sql } from 'drizzle-orm';

const MAX_NAMES = 10;

export async function POST(request: NextRequest) {
  await initDb();

  const names: string[] = await request.json();

  if (!Array.isArray(names) || names.length === 0) {
    return NextResponse.json([]);
  }

  const limitedNames = names.slice(0, MAX_NAMES);
  const results = [];

  for (const name of limitedNames) {
    const profile = await db.select().from(schema.profiles)
      .where(sql`lower(${schema.profiles.name}) = lower(${name})`)
      .limit(1)
      .then(r => r[0]);

    if (profile) {
      results.push(serializeProfile(profile));
    }
  }

  return NextResponse.json(results);
}
