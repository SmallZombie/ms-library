import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/lib/db/init';
import { findFileByHash } from '@/lib/yggdrasil/texture';
import fs from 'fs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  await initDb();
  const { hash } = await params;

  if (!/^[a-f0-9]{64}$/.test(hash)) {
    return NextResponse.json({ error: 'Invalid hash' }, { status: 400 });
  }

  const filePath = await findFileByHash(hash);
  if (!filePath || !fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const data = fs.readFileSync(filePath);
  return new NextResponse(data, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': data.length.toString(),
      'ETag': `"${hash}"`,
    },
  });
}
