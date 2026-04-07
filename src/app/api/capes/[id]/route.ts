import { NextRequest, NextResponse } from 'next/server';
import { db, schema, capesDir } from '@/lib/db';
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
    .from(schema.capes)
    .where(eq(schema.capes.id, parseInt(id)))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
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
  if (body.type !== void 0) updates.type = body.type;
  if (body.tags !== void 0) updates.tags = body.tags;
  if (body.source !== void 0) updates.source = body.source;

  await db.update(schema.capes)
    .set(updates)
    .where(eq(schema.capes.id, parseInt(id)));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb();
  const { id } = await params;

  const rows = await db.select()
    .from(schema.capes)
    .where(eq(schema.capes.id, parseInt(id)))
    .limit(1);

  if (rows.length > 0) {
    const filePath = path.join(capesDir, '..', rows[0].filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  await db.delete(schema.capes)
    .where(eq(schema.capes.id, parseInt(id)));

  return NextResponse.json({ success: true });
}
