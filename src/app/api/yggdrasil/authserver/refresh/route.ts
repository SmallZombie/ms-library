import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/lib/db';
import { initDb } from '@/lib/db/init';
import { validateToken, invalidateToken, createToken, serializeProfile } from '@/lib/yggdrasil';
import { eq } from 'drizzle-orm';

function yggError(status: number, error: string, errorMessage: string) {
  return NextResponse.json({ error, errorMessage }, { status });
}

export async function POST(request: NextRequest) {
  await initDb();

  const body = await request.json();
  const { accessToken, clientToken, selectedProfile, requestUser } = body;

  const token = await validateToken(accessToken, clientToken);
  if (!token) {
    return yggError(403, 'ForbiddenOperationException', 'Invalid token.');
  }

  let profileId = token.profileId;

  if (selectedProfile) {
    if (token.profileId) {
      return NextResponse.json(
        { error: 'IllegalArgumentException', errorMessage: 'Access token already has a profile assigned.' },
        { status: 400 }
      );
    }
    const profile = await db.select().from(schema.profiles)
      .where(eq(schema.profiles.id, selectedProfile.id))
      .limit(1)
      .then(r => r[0]);

    if (!profile || profile.userId !== token.userId) {
      return yggError(403, 'ForbiddenOperationException', 'Invalid token.');
    }
    profileId = profile.id;
  }

  await invalidateToken(accessToken);
  const newToken = await createToken(token.userId, token.clientToken, profileId);

  const response: Record<string, unknown> = {
    accessToken: newToken.accessToken,
    clientToken: newToken.clientToken,
  };

  if (profileId) {
    const profile = await db.select().from(schema.profiles)
      .where(eq(schema.profiles.id, profileId))
      .limit(1)
      .then(r => r[0]);
    if (profile) {
      response.selectedProfile = serializeProfile(profile);
    }
  }

  if (requestUser) {
    response.user = {
      id: token.userId.replace(/-/g, ''),
      properties: [],
    };
  }

  return NextResponse.json(response);
}
