import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { initDb } from '@/lib/db/init';
import { sql } from 'drizzle-orm';

export async function GET() {
  await initDb();

  const [typeRows, tagRows] = await Promise.all([
    db.selectDistinct({ type: schema.capes.type }).from(schema.capes),
    db.select({ tags: schema.capes.tags }).from(schema.capes)
      .where(sql`${schema.capes.tags} != '[]'`),
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
