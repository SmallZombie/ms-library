import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { initDb } from '@/lib/db/init';
import { getSession } from '@/lib/auth';
import { eq, sql } from 'drizzle-orm';
import { generateUnsignedUuid } from '@/lib/yggdrasil';

const MC_NAME_REGEX = /^[a-zA-Z0-9_]{3,16}$/;

export async function GET() {
  await initDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await db.select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, session.userId))
    .orderBy(schema.profiles.createdAt);

  const profilesWithDetails = await Promise.all(
    rows.map(async (profile) => {
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
      return { ...profile, skin, cape };
    })
  );

  return NextResponse.json(profilesWithDetails);
}

export async function POST(request: NextRequest) {
  await initDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, skinId, capeId } = body;

  if (!name || !MC_NAME_REGEX.test(name)) {
    return NextResponse.json(
      { error: '角色名必须为 3-16 个字符，只能包含字母、数字和下划线' },
      { status: 400 }
    );
  }

  const existing = await db.select({ id: schema.profiles.id })
    .from(schema.profiles)
    .where(sql`lower(${schema.profiles.name}) = lower(${name})`)
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: '角色名已被使用' }, { status: 409 });
  }

  if (skinId) {
    const skin = await db.select({ userId: schema.skins.userId })
      .from(schema.skins)
      .where(eq(schema.skins.id, skinId))
      .limit(1);
    if (skin.length === 0 || skin[0].userId !== session.userId) {
      return NextResponse.json({ error: '无效的皮肤' }, { status: 400 });
    }
  }

  if (capeId) {
    const cape = await db.select({ userId: schema.capes.userId })
      .from(schema.capes)
      .where(eq(schema.capes.id, capeId))
      .limit(1);
    if (cape.length === 0 || cape[0].userId !== session.userId) {
      return NextResponse.json({ error: '无效的披风' }, { status: 400 });
    }
  }

  const profileId = generateUnsignedUuid();
  const now = new Date();

  await db.insert(schema.profiles).values({
    id: profileId,
    userId: session.userId,
    name,
    skinId: skinId || null,
    capeId: capeId || null,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id: profileId, name });
}
