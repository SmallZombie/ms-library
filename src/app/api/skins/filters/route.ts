import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { initDb } from '@/lib/db/init';
import { getSession } from '@/lib/auth';
import { sql, eq, and } from 'drizzle-orm';

export async function GET() {
  await initDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [typeRows, tagRows] = await Promise.all([
    db.selectDistinct({ type: schema.skins.type })
      .from(schema.skins)
      .where(eq(schema.skins.userId, session.userId)),
    db.select({ tags: schema.skins.tags })
      .from(schema.skins)
      .where(and(eq(schema.skins.userId, session.userId), sql`${schema.skins.tags} != '[]'`)),
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
