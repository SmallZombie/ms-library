import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { initDb } from '@/lib/db/init';
import { getSession } from '@/lib/auth';
import { eq, and, sql } from 'drizzle-orm';

const MC_NAME_REGEX = /^[a-zA-Z0-9_]{3,16}$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const rows = await db.select()
    .from(schema.profiles)
    .where(and(eq(schema.profiles.id, id), eq(schema.profiles.userId, session.userId)))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const profile = rows[0];
  let skin = null;
  let cape = null;
  if (profile.skinId) {
    const s = await db.select().from(schema.skins).where(eq(schema.skins.id, profile.skinId)).limit(1);
    skin = s[0] || null;
  }
  if (profile.capeId) {
    const c = await db.select().from(schema.capes).where(eq(schema.capes.id, profile.capeId)).limit(1);
    cape = c[0] || null;
  }

  return NextResponse.json({ ...profile, skin, cape });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const existing = await db.select()
    .from(schema.profiles)
    .where(and(eq(schema.profiles.id, id), eq(schema.profiles.userId, session.userId)))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.name !== undefined) {
    if (!MC_NAME_REGEX.test(body.name)) {
      return NextResponse.json(
        { error: '角色名必须为 3-16 个字符，只能包含字母、数字和下划线' },
        { status: 400 }
      );
    }
    const nameCheck = await db.select({ id: schema.profiles.id })
      .from(schema.profiles)
      .where(sql`lower(${schema.profiles.name}) = lower(${body.name}) AND ${schema.profiles.id} != ${id}`)
      .limit(1);
    if (nameCheck.length > 0) {
      return NextResponse.json({ error: '角色名已被使用' }, { status: 409 });
    }
    updates.name = body.name;
  }

  if (body.skinId !== undefined) {
    if (body.skinId === null) {
      updates.skinId = null;
    } else {
      const skin = await db.select({ userId: schema.skins.userId })
        .from(schema.skins)
        .where(eq(schema.skins.id, body.skinId))
        .limit(1);
      if (skin.length === 0 || skin[0].userId !== session.userId) {
        return NextResponse.json({ error: '无效的皮肤' }, { status: 400 });
      }
      updates.skinId = body.skinId;
    }
  }

  if (body.capeId !== undefined) {
    if (body.capeId === null) {
      updates.capeId = null;
    } else {
      const cape = await db.select({ userId: schema.capes.userId })
        .from(schema.capes)
        .where(eq(schema.capes.id, body.capeId))
        .limit(1);
      if (cape.length === 0 || cape[0].userId !== session.userId) {
        return NextResponse.json({ error: '无效的披风' }, { status: 400 });
      }
      updates.capeId = body.capeId;
    }
  }

  await db.update(schema.profiles).set(updates).where(eq(schema.profiles.id, id));
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  await db.delete(schema.tokens).where(eq(schema.tokens.profileId, id));
  await db.delete(schema.profiles)
    .where(and(eq(schema.profiles.id, id), eq(schema.profiles.userId, session.userId)));

  return NextResponse.json({ success: true });
}
