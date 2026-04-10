import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { initDb } from '@/lib/db/init';
import { hashPassword, createSession } from '@/lib/auth';
import { verifyTurnstile } from '@/lib/turnstile';
import { getSetting } from '@/lib/settings';
import { randomUUID } from 'crypto';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  await initDb();

  const body = await request.json();
  const { username, password, turnstileToken } = body;

  if (!username || !password) {
    return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
  }

  if (typeof username !== 'string' || username.length < 3 || username.length > 32) {
    return NextResponse.json({ error: '用户名长度需要在 3-32 个字符之间' }, { status: 400 });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return NextResponse.json({ error: '密码长度至少 6 个字符' }, { status: 400 });
  }

  const allowReg = await getSetting('allowRegistration');
  if (allowReg === 'false') {
    return NextResponse.json({ error: '注册功能已关闭' }, { status: 403 });
  }

  const turnstileOk = await verifyTurnstile(turnstileToken || '');
  if (!turnstileOk) {
    return NextResponse.json({ error: '验证码校验失败' }, { status: 400 });
  }

  const existing = await db.select({ id: schema.users.id })
    .from(schema.users)
    .where(sql`lower(${schema.users.username}) = lower(${username})`)
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: '用户名已存在' }, { status: 409 });
  }

  const userCount = await db.select({ count: sql<number>`COUNT(*)` }).from(schema.users);
  const isFirstUser = userCount[0].count === 0;

  const userId = randomUUID();
  const passwordHash = await hashPassword(password);
  const now = new Date();

  await db.insert(schema.users).values({
    id: userId,
    username,
    passwordHash,
    isAdmin: isFirstUser,
    createdAt: now,
    updatedAt: now,
  });

  await createSession({ userId, username, isAdmin: isFirstUser });

  return NextResponse.json({
    id: userId,
    username,
    isAdmin: isFirstUser,
  });
}
