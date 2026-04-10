interface JoinEntry {
  accessToken: string;
  profileId: string;
  ip: string;
  timestamp: number;
}

const store = new Map<string, JoinEntry>();
const TTL = 30_000;

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.timestamp > TTL) {
      store.delete(key);
    }
  }
}

export function recordJoin(serverId: string, accessToken: string, profileId: string, ip: string) {
  cleanup();
  store.set(serverId, { accessToken, profileId, ip, timestamp: Date.now() });
}

export function verifyJoin(serverId: string, username: string, ip?: string): JoinEntry | null {
  cleanup();
  const entry = store.get(serverId);
  if (!entry) return null;
  if (ip && entry.ip && entry.ip !== ip) return null;
  store.delete(serverId);
  return entry;
}
