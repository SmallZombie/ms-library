import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { initDb } from '@/lib/db/init';
import { verifyPassword, createSession } from '@/lib/auth';
import { verifyTurnstile } from '@/lib/turnstile';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  await initDb();

  const body = await request.json();
  const { username, password, turnstileToken } = body;

  if (!username || !password) {
    return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
  }

  const turnstileOk = await verifyTurnstile(turnstileToken || '');
  if (!turnstileOk) {
    return NextResponse.json({ error: '验证码校验失败' }, { status: 400 });
  }

  const users = await db.select()
    .from(schema.users)
    .where(sql`lower(${schema.users.username}) = lower(${username})`)
    .limit(1);

  if (users.length === 0) {
    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
  }

  const user = users[0];
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
  }

  await createSession({
    userId: user.id,
    username: user.username,
    isAdmin: user.isAdmin,
  });

  return NextResponse.json({
    id: user.id,
    username: user.username,
    isAdmin: user.isAdmin,
  });
}
