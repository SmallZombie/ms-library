import { NextRequest, NextResponse } from 'next/server';
import { db, schema, skinsDir } from '@/lib/db';
import { initDb } from '@/lib/db/init';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb();
  const { id } = await params;

  const rows = await db.select()
    .from(schema.skins)
    .where(eq(schema.skins.id, parseInt(id)))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const skin = rows[0];
  let cape = null;
  if (skin.linkedCapeId) {
    const capeRows = await db.select()
      .from(schema.capes)
      .where(eq(schema.capes.id, skin.linkedCapeId))
      .limit(1);
    cape = capeRows[0] || null;
  }

  return NextResponse.json({ ...skin, cape });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb();
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.name !== void 0) updates.name = body.name;
  if (body.slim !== void 0) updates.slim = Boolean(body.slim);
  if (body.type !== void 0) updates.type = body.type;
  if (body.tags !== void 0) updates.tags = body.tags;
  if (body.source !== void 0) updates.source = body.source;
  if (body.linkedCapeId !== void 0) updates.linkedCapeId = body.linkedCapeId;

  await db.update(schema.skins)
    .set(updates)
    .where(eq(schema.skins.id, parseInt(id)));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb();
  const { id } = await params;

  const rows = await db.select()
    .from(schema.skins)
    .where(eq(schema.skins.id, parseInt(id)))
    .limit(1);

  if (rows.length > 0) {
    const filePath = path.join(skinsDir, '..', rows[0].filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  await db.delete(schema.skins)
    .where(eq(schema.skins.id, parseInt(id)));

  return NextResponse.json({ success: true });
}
