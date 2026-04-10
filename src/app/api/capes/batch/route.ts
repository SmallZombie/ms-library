import { NextRequest, NextResponse } from 'next/server';
import { db, schema, capesDir } from '@/lib/db';
import { initDb } from '@/lib/db/init';
import { getSession } from '@/lib/auth';
import { eq, and, inArray } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  await initDb();
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { action, ids } = body as {
    action: 'update' | 'delete';
    ids: number[];
  };

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids is required' }, { status: 400 });
  }

  if (action === 'delete') {
    const rows = await db.select()
      .from(schema.capes)
      .where(and(inArray(schema.capes.id, ids), eq(schema.capes.userId, session.userId)));

    for (const row of rows) {
      const filePath = path.join(capesDir, '..', row.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const ownedIds = rows.map(r => r.id);
    if (ownedIds.length > 0) {
      await db.delete(schema.capes).where(inArray(schema.capes.id, ownedIds));
    }

    return NextResponse.json({ success: true, deleted: ownedIds.length });
  }

  if (action === 'update') {
    const { updates, tagMode } = body as {
      updates: Record<string, unknown>;
      tagMode?: 'override' | 'append';
    };

    if (!updates) {
      return NextResponse.json({ error: 'updates is required' }, { status: 400 });
    }

    const owned = await db.select()
      .from(schema.capes)
      .where(and(inArray(schema.capes.id, ids), eq(schema.capes.userId, session.userId)));
    const ownedIds = owned.map(r => r.id);

    if (tagMode === 'append' && Array.isArray(updates.tags)) {
      for (const row of owned) {
        const existingTags = (row.tags as string[]) || [];
        const merged = [...new Set([...existingTags, ...(updates.tags as string[])])];
        const rowUpdates: Record<string, unknown> = { ...updates, tags: merged, updatedAt: new Date() };
        await db.update(schema.capes).set(rowUpdates).where(eq(schema.capes.id, row.id));
      }
    } else if (ownedIds.length > 0) {
      const payload: Record<string, unknown> = { ...updates, updatedAt: new Date() };
      await db.update(schema.capes).set(payload).where(inArray(schema.capes.id, ownedIds));
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
