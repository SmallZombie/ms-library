import { NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { initDb } from '@/lib/db/init';
import { getSession } from '@/lib/auth';
import { sql } from 'drizzle-orm';

export async function GET() {
  await initDb();
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const users = await db.select({
    id: schema.users.id,
    username: schema.users.username,
    isAdmin: schema.users.isAdmin,
    createdAt: schema.users.createdAt,
  }).from(schema.users).orderBy(schema.users.createdAt);

  const usersWithCounts = await Promise.all(
    users.map(async (user) => {
      const [skinCount, capeCount, profileCount] = await Promise.all([
        db.select({ count: sql<number>`COUNT(*)` }).from(schema.skins)
          .where(sql`${schema.skins.userId} = ${user.id}`),
        db.select({ count: sql<number>`COUNT(*)` }).from(schema.capes)
          .where(sql`${schema.capes.userId} = ${user.id}`),
        db.select({ count: sql<number>`COUNT(*)` }).from(schema.profiles)
          .where(sql`${schema.profiles.userId} = ${user.id}`),
      ]);
      return {
        ...user,
        skinCount: skinCount[0].count,
        capeCount: capeCount[0].count,
        profileCount: profileCount[0].count,
      };
    })
  );

  return NextResponse.json(usersWithCounts);
}
