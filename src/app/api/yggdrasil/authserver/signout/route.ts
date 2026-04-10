import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { initDb } from '@/lib/db/init';
import { verifyPassword } from '@/lib/auth';
import { invalidateAllTokens } from '@/lib/yggdrasil';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  await initDb();

  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: 'ForbiddenOperationException', errorMessage: 'Invalid credentials. Invalid username or password.' },
      { status: 403 }
    );
  }

  const user = await db.select().from(schema.users)
    .where(sql`lower(${schema.users.username}) = lower(${username})`)
    .limit(1)
    .then(r => r[0]);

  if (!user) {
    return NextResponse.json(
      { error: 'ForbiddenOperationException', errorMessage: 'Invalid credentials. Invalid username or password.' },
      { status: 403 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: 'ForbiddenOperationException', errorMessage: 'Invalid credentials. Invalid username or password.' },
      { status: 403 }
    );
  }

  await invalidateAllTokens(user.id);
  return new NextResponse(null, { status: 204 });
}
