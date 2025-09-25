const windows = new Map<string, { count: number; expires: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || existing.expires < now) {
    windows.set(key, { count: 1, expires: now + windowMs });
    return { success: true };
  }

  if (existing.count >= limit) {
    return { success: false, retryAfter: existing.expires - now };
  }

  existing.count += 1;
  return { success: true };
}

export function resetRateLimitStore() {
  windows.clear();
}
