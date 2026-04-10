import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { initDb } from '@/lib/db/init';
import { verifyPassword } from '@/lib/auth';
import { createToken, serializeProfile } from '@/lib/yggdrasil';
import { eq, sql } from 'drizzle-orm';
import { sha256 } from '@/lib/hash';

function yggError(status: number, error: string, errorMessage: string) {
  return NextResponse.json({ error, errorMessage }, { status });
}

export async function POST(request: NextRequest) {
  await initDb();

  const body = await request.json();
  const { username, password, clientToken, requestUser } = body;

  if (!username || !password) {
    return yggError(403, 'ForbiddenOperationException', 'Invalid credentials. Invalid username or password.');
  }

  // can be use email or player name login
  // https://minecraft.wiki/w/Yggdrasil#Payload
  let user = await db.select().from(schema.users)
    .where(sql`lower(${schema.users.username}) = lower(${username})`)
    .limit(1)
    .then(r => r[0]);

  let loginByProfileName: typeof schema.profiles.$inferSelect | null = null;

  if (!user) {
    // try login by profile name
    const profile = await db.select().from(schema.profiles)
      .where(sql`lower(${schema.profiles.name}) = lower(${username})`)
      .limit(1)
      .then(r => r[0]);

    if (profile) {
      user = await db.select().from(schema.users)
        .where(eq(schema.users.id, profile.userId))
        .limit(1)
        .then(r => r[0]);
      loginByProfileName = profile;
    }
  }

  if (!user) {
    return yggError(403, 'ForbiddenOperationException', 'Invalid credentials. Invalid username or password.');
  }

  const valid = await verifyPassword(await sha256(password), user.passwordHash);
  if (!valid) {
    return yggError(403, 'ForbiddenOperationException', 'Invalid credentials. Invalid username or password.');
  }

  const profiles = await db.select().from(schema.profiles)
    .where(eq(schema.profiles.userId, user.id));

  let selectedProfile: typeof schema.profiles.$inferSelect | null = null;
  if (loginByProfileName) {
    selectedProfile = loginByProfileName;
  } else if (profiles.length === 1) {
    selectedProfile = profiles[0];
  }

  const token = await createToken(user.id, clientToken, selectedProfile?.id || null);

  const response: Record<string, unknown> = {
    accessToken: token.accessToken,
    clientToken: token.clientToken,
    availableProfiles: profiles.map(p => serializeProfile(p)),
  };

  if (selectedProfile) {
    response.selectedProfile = serializeProfile(selectedProfile);
  }

  if (requestUser) {
    response.user = {
      id: user.id.replace(/-/g, ''),
      properties: [],
    };
  }

  return NextResponse.json(response);
}
