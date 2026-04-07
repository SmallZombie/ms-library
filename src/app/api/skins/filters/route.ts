import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { initDb } from '@/lib/db/init';
import { sql } from 'drizzle-orm';

export async function GET() {
  await initDb();

  const [typeRows, tagRows] = await Promise.all([
    db.selectDistinct({ type: schema.skins.type }).from(schema.skins),
    db.select({ tags: schema.skins.tags }).from(schema.skins)
      .where(sql`${schema.skins.tags} != '[]'`),
  ]);

  const types = typeRows
    .map(r => r.type)
    .filter((t): t is string => t !== null && t !== '');

  const tagSet = new Set<string>();
  for (const row of tagRows) {
    const tags = row.tags as string[];
    for (const tag of tags) {
      tagSet.add(tag);
    }
  }

  return NextResponse.json({
    types,
    tags: Array.from(tagSet),
  });
}
