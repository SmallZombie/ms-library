import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { getSession, verifyPassword, clearSession } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { password } = await request.json();

  if (!password) {
    return NextResponse.json({ error: '请输入密码确认' }, { status: 400 });
  }

  const users = await db.select()
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .limit(1);

  if (users.length === 0) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  const user = users[0];
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: '密码错误' }, { status: 401 });
  }

  const userId = session.userId;

  await db.delete(schema.tokens).where(eq(schema.tokens.userId, userId));
  await db.delete(schema.profiles).where(eq(schema.profiles.userId, userId));
  await db.delete(schema.skins).where(eq(schema.skins.userId, userId));
  await db.delete(schema.capes).where(eq(schema.capes.userId, userId));
  await db.delete(schema.users).where(eq(schema.users.id, userId));

  await clearSession();

  return NextResponse.json({ ok: true });
}
