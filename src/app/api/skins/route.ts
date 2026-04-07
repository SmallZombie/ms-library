import { NextRequest, NextResponse } from 'next/server';
import { db, schema, skinsDir } from '@/lib/db';
import { initDb } from '@/lib/db/init';
import { eq, like, sql, asc, desc } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  await initDb();

  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get('keyword');
  const type = searchParams.get('type');
  const tags = searchParams.getAll('tags');
  const order = searchParams.get('order');
  const offset = parseInt(searchParams.get('offset') || '0');
  const limit = parseInt(searchParams.get('limit') || '20');

  const conditions = [];
  if (keyword) {
    conditions.push(like(schema.skins.name, `%${keyword}%`));
  }
  if (type) {
    conditions.push(eq(schema.skins.type, type));
  }

  const where = conditions.length > 0
    ? sql`${sql.join(conditions, sql` AND `)}`
    : void 0;

  const [countResult, rows] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` })
      .from(schema.skins)
      .where(where),
    db.select()
      .from(schema.skins)
      .where(where)
      .orderBy(order === '1' ? desc(schema.skins.id) : asc(schema.skins.id))
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

  const skinsWithCapes = await Promise.all(
    list.map(async (skin) => {
      if (skin.linkedCapeId) {
        const cape = await db.select()
          .from(schema.capes)
          .where(eq(schema.capes.id, skin.linkedCapeId))
          .limit(1);
        return { ...skin, cape: cape[0] || null };
      }
      return { ...skin, cape: null };
    })
  );

  return NextResponse.json({
    total: countResult[0].count,
    list: skinsWithCapes,
  });
}

export async function POST(request: NextRequest) {
  await initDb();

  const body = await request.json();
  const { name, slim, type, tags, source, file, fileMD5 } = body;

  if (!file || !fileMD5) {
    return NextResponse.json({ error: 'file and fileMD5 are required' }, { status: 400 });
  }

  const existing = await db.select()
    .from(schema.skins)
    .where(eq(schema.skins.fileHash, fileMD5))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ error: 'Skin with this hash already exists' }, { status: 409 });
  }

  const fileName = `${randomUUID()}.png`;
  const filePath = path.join(skinsDir, fileName);

  const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

  const now = new Date();
  const result = await db.insert(schema.skins).values({
    name: name || null,
    slim: Boolean(slim),
    type: type || null,
    tags: tags || [],
    source: source || null,
    fileHash: fileMD5,
    filePath: `skins/${fileName}`,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id: Number(result.lastInsertRowid) });
}
