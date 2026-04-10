import { NextRequest, NextResponse } from 'next/server';
import { db, schema, capesDir } from '@/lib/db';
import { initDb } from '@/lib/db/init';
import { eq, like, sql, asc, desc, and } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  await initDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get('keyword');
  const type = searchParams.get('type');
  const tags = searchParams.getAll('tags');
  const order = searchParams.get('order');
  const offset = parseInt(searchParams.get('offset') || '0');
  const limit = parseInt(searchParams.get('limit') || '20');

  const conditions = [eq(schema.capes.userId, session.userId)];
  if (keyword) {
    conditions.push(like(schema.capes.name, `%${keyword}%`));
  }
  if (type) {
    conditions.push(eq(schema.capes.type, type));
  }

  const where = sql`${sql.join(conditions, sql` AND `)}`;

  const [countResult, rows] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` })
      .from(schema.capes)
      .where(where),
    db.select()
      .from(schema.capes)
      .where(where)
      .orderBy(order === '1' ? desc(schema.capes.id) : asc(schema.capes.id))
      .limit(limit)
      .offset(offset),
  ]);

  let list = rows;
  if (tags.length > 0) {
    list = rows.filter(row => {
      const rowTags = row.tags as string[];
      return tags.every(t => rowTags.includes(t));
    });
  }

  return NextResponse.json({
    total: countResult[0].count,
    list,
  });
}

export async function POST(request: NextRequest) {
  await initDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, type, tags, source, file, fileMD5 } = body;

  if (!file || !fileMD5) {
    return NextResponse.json({ error: 'file and fileMD5 are required' }, { status: 400 });
  }

  const existing = await db.select()
    .from(schema.capes)
    .where(and(eq(schema.capes.fileHash, fileMD5), eq(schema.capes.userId, session.userId)))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ error: 'Cape with this hash already exists' }, { status: 409 });
  }

  const fileName = `${randomUUID()}.png`;
  const filePath = path.join(capesDir, fileName);

  const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

  const now = new Date();
  const result = await db.insert(schema.capes).values({
    userId: session.userId,
    name: name || null,
    type: type || null,
    tags: tags || [],
    source: source || null,
    fileHash: fileMD5,
    filePath: `capes/${fileName}`,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id: Number(result.lastInsertRowid) });
}
