import { db, schema } from '@/lib/db';
import { eq, and, lt } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { signData } from './keys';
import { ensureTextureSha256, getTextureUrl } from './texture';

const TOKEN_EXPIRY_DAYS = 15;
const MAX_TOKENS_PER_USER = 10;

export function generateUnsignedUuid(): string {
  return randomUUID().replace(/-/g, '');
}

export async function createToken(
  userId: string,
  clientToken: string | undefined,
  profileId: string | null
): Promise<{ accessToken: string; clientToken: string }> {
  const accessToken = generateUnsignedUuid();
  const ct = clientToken || generateUnsignedUuid();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // clean expired tokens
  await db.delete(schema.tokens)
    .where(lt(schema.tokens.expiresAt, now));

  // enforce max tokens per user
  const existing = await db.select({ accessToken: schema.tokens.accessToken, createdAt: schema.tokens.createdAt })
    .from(schema.tokens)
    .where(eq(schema.tokens.userId, userId))
    .orderBy(schema.tokens.createdAt);

  if (existing.length >= MAX_TOKENS_PER_USER) {
    const toDelete = existing.slice(0, existing.length - MAX_TOKENS_PER_USER + 1);
    for (const t of toDelete) {
      await db.delete(schema.tokens).where(eq(schema.tokens.accessToken, t.accessToken));
    }
  }

  await db.insert(schema.tokens).values({
    accessToken,
    clientToken: ct,
    userId,
    profileId,
    createdAt: now,
    expiresAt,
  });

  return { accessToken, clientToken: ct };
}

export async function validateToken(
  accessToken: string,
  clientToken?: string
): Promise<typeof schema.tokens.$inferSelect | null> {
  const conditions = [eq(schema.tokens.accessToken, accessToken)];
  if (clientToken) {
    conditions.push(eq(schema.tokens.clientToken, clientToken));
  }

  const rows = await db.select().from(schema.tokens)
    .where(and(...conditions))
    .limit(1);

  const token = rows[0];
  if (!token) return null;
  if (token.expiresAt < new Date()) {
    await db.delete(schema.tokens).where(eq(schema.tokens.accessToken, accessToken));
    return null;
  }
  return token;
}

export async function invalidateToken(accessToken: string): Promise<void> {
  await db.delete(schema.tokens).where(eq(schema.tokens.accessToken, accessToken));
}

export async function invalidateAllTokens(userId: string): Promise<void> {
  await db.delete(schema.tokens).where(eq(schema.tokens.userId, userId));
}

export function serializeProfile(
  profile: { id: string; name: string },
  includeProperties?: false
): { id: string; name: string };
export function serializeProfile(
  profile: { id: string; name: string },
  includeProperties: true,
  texturesValue: string,
  sign?: boolean
): { id: string; name: string; properties: Array<{ name: string; value: string; signature?: string }> };
export function serializeProfile(
  profile: { id: string; name: string },
  includeProperties = false,
  texturesValue?: string,
  sign = false
) {
  const result: Record<string, unknown> = {
    id: profile.id,
    name: profile.name,
  };

  if (includeProperties && texturesValue) {
    const prop: { name: string; value: string; signature?: string } = {
      name: 'textures',
      value: texturesValue,
    };
    if (sign) {
      prop.signature = signData(texturesValue);
    }
    result.properties = [prop];
  }

  return result;
}

export async function buildTexturesProperty(
  profile: { id: string; name: string; skinId: number | null; capeId: number | null },
  host: string
): Promise<string> {
  const textures: Record<string, { url: string; metadata?: Record<string, string> }> = {};

  if (profile.skinId) {
    const skin = await db.select().from(schema.skins)
      .where(eq(schema.skins.id, profile.skinId))
      .limit(1);
    if (skin[0]) {
      const sha256 = await ensureTextureSha256('skins', skin[0].id, skin[0].filePath);
      textures.SKIN = {
        url: getTextureUrl(host, sha256),
      };
      if (skin[0].slim) {
        textures.SKIN.metadata = { model: 'slim' };
      }
    }
  }

  if (profile.capeId) {
    const cape = await db.select().from(schema.capes)
      .where(eq(schema.capes.id, profile.capeId))
      .limit(1);
    if (cape[0]) {
      const sha256 = await ensureTextureSha256('capes', cape[0].id, cape[0].filePath);
      textures.CAPE = {
        url: getTextureUrl(host, sha256),
      };
    }
  }

  const payload = {
    timestamp: Date.now(),
    profileId: profile.id,
    profileName: profile.name,
    textures,
  };

  return Buffer.from(JSON.stringify(payload)).toString('base64');
}
