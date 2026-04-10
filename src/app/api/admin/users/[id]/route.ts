import { NextRequest, NextResponse } from 'next/server';
import { db, schema, skinsDir, capesDir } from '@/lib/db';
import { initDb } from '@/lib/db/init';
import { getSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb();
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;

  const body = await request.json();
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.isAdmin !== undefined) updates.isAdmin = Boolean(body.isAdmin);

  await db.update(schema.users).set(updates).where(eq(schema.users.id, id));
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb();
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;

  if (id === session.userId) {
    return NextResponse.json({ error: '不能删除自己' }, { status: 400 });
  }

  const userSkins = await db.select().from(schema.skins).where(eq(schema.skins.userId, id));
  for (const skin of userSkins) {
    const fp = path.join(skinsDir, '..', skin.filePath);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  await db.delete(schema.skins).where(eq(schema.skins.userId, id));

  const userCapes = await db.select().from(schema.capes).where(eq(schema.capes.userId, id));
  for (const cape of userCapes) {
    const fp = path.join(capesDir, '..', cape.filePath);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  await db.delete(schema.capes).where(eq(schema.capes.userId, id));

  // delete profiles and tokens
  await db.delete(schema.profiles).where(eq(schema.profiles.userId, id));
  await db.delete(schema.tokens).where(eq(schema.tokens.userId, id));
  await db.delete(schema.users).where(eq(schema.users.id, id));

  return NextResponse.json({ success: true });
}
