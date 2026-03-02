/**
 * Cache mémoire pour les données des graphiques (évite de refetch les mêmes plages).
 * TTL 5 minutes. Clé = "graphType:duration:period" (ex. compresseur-k244:year:2026).
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

const store = new Map<string, { data: unknown; ts: number }>();

export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry || Date.now() - entry.ts > CACHE_TTL_MS) return null;
  return entry.data as T;
}

export function setCached(key: string, data: unknown): void {
  store.set(key, { data, ts: Date.now() });
}

/** Supprime toutes les entrées dont la clé commence par le préfixe (ex. "analyses:"). */
export function invalidateCacheByPrefix(prefix: string): void {
  for (const key of Array.from(store.keys())) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function cacheKey(
  graphType: string,
  duration: string,
  period: string
): string {
  return `${graphType}:${duration}:${period}`;
}
