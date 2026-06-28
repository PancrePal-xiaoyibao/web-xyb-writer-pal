interface RateLimitEntry {
  count: number;
  resetAt: number;
}

type RateLimitStore = Map<string, RateLimitEntry>;

// In-memory stores (per instance; use Redis for multi-instance deployments)
const ipStore: RateLimitStore = new Map();
const userStore: RateLimitStore = new Map();
const apiKeyStore: RateLimitStore = new Map();

const WINDOW_MS = 60 * 1000; // 1 minute

const LIMITS = {
  ip: 60,
  user: 30,
  apiKey: 30,
} as const;

function checkLimit(
  store: RateLimitStore,
  key: string,
  maxRequests: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    // New window
    const resetAt = now + WINDOW_MS;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/** Periodically clean expired entries to prevent memory leak */
function cleanup(store: RateLimitStore): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    cleanup(ipStore);
    cleanup(userStore);
    cleanup(apiKeyStore);
  }, 5 * 60 * 1000);
}

export function checkIpLimit(ip: string) {
  return checkLimit(ipStore, ip, LIMITS.ip);
}

export function checkUserLimit(userId: string) {
  return checkLimit(userStore, userId, LIMITS.user);
}

export function checkApiKeyLimit(apiKeyId: string) {
  return checkLimit(apiKeyStore, apiKeyId, LIMITS.apiKey);
}

export type { RateLimitEntry };
