import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db/init';
import { validateToken } from '@/lib/yggdrasil';

export async function POST(request: NextRequest) {
  await initDb();

  const body = await request.json();
  const { accessToken, clientToken } = body;

  const token = await validateToken(accessToken, clientToken);
  if (!token) {
    return NextResponse.json(
      { error: 'ForbiddenOperationException', errorMessage: 'Invalid token.' },
      { status: 403 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
