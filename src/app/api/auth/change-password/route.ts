import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { getSession, verifyPassword, hashPassword } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const { oldPassword, newPassword } = await request.json();

  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: '请填写所有字段' }, { status: 400 });
  }

  if (typeof newPassword !== 'string' || newPassword.length < 64) {
    return NextResponse.json({ error: '密码格式不正确' }, { status: 400 });
  }

  const users = await db.select()
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .limit(1);

  if (users.length === 0) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  const user = users[0];
  const valid = await verifyPassword(oldPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: '原密码错误' }, { status: 401 });
  }

  const newHash = await hashPassword(newPassword);
  await db.update(schema.users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(schema.users.id, session.userId));

  return NextResponse.json({ ok: true });
}
