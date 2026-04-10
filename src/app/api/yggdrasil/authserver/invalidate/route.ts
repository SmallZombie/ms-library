import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db/init';
import { invalidateToken } from '@/lib/yggdrasil';

export async function POST(request: NextRequest) {
  await initDb();

  const body = await request.json();
  const { accessToken } = body;

  if (accessToken) {
    await invalidateToken(accessToken);
  }

  return new NextResponse(null, { status: 204 });
}
