import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db/init';
import { validateToken } from '@/lib/yggdrasil';
import { recordJoin } from '@/lib/yggdrasil/session-store';

export async function POST(request: NextRequest) {
  await initDb();

  const body = await request.json();
  const { accessToken, selectedProfile, serverId } = body;

  if (!accessToken || !selectedProfile || !serverId) {
    return NextResponse.json(
      { error: 'ForbiddenOperationException', errorMessage: 'Invalid token.' },
      { status: 403 }
    );
  }

  const token = await validateToken(accessToken);
  if (!token) {
    return NextResponse.json(
      { error: 'ForbiddenOperationException', errorMessage: 'Invalid token.' },
      { status: 403 }
    );
  }

  if (token.profileId !== selectedProfile) {
    return NextResponse.json(
      { error: 'ForbiddenOperationException', errorMessage: 'Invalid token.' },
      { status: 403 }
    );
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '';

  recordJoin(serverId, accessToken, selectedProfile, ip);

  return new NextResponse(null, { status: 204 });
}
