import { NextRequest, NextResponse } from 'next/server';
import { parseSite } from '@/lib/site-parsers';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'url parameter is required' }, { status: 400 });
  }

  try {
    const result = await parseSite(url);
    if (!result) {
      return NextResponse.json({ error: 'Unsupported site' }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to parse site' }, { status: 500 });
  }
}
