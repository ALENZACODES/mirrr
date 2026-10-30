/**
 * Per-visitor rate limiting for /api routes.
 *
 * Two token buckets per address. Routes that can reach Qloo or the narrator ("upstream") keep the
 * old allowance of 30 a minute, so the shared Qloo quota is protected exactly as before. Everything
 * else is computed locally from MIRRR's own data, and a person clicking through a lab fires a
 * request per control change, so those routes get a bucket of 240 that refills at 4 a second:
 * normal browsing never sees a 429, while a script hammering the API still does.
 * Idle buckets are swept so the map cannot grow without bound.
 */
export const UPSTREAM_PREFIXES = ['/api/taste/', '/api/agent/', '/api/trending', '/api/plan', '/api/transform', '/api/qloo/'];
export const TIERS = {
  upstream: { capacity: 30, perSecond: 30 / 60 },
  local: { capacity: 240, perSecond: 4 },
};

export function tierFor(path) {
  return UPSTREAM_PREFIXES.some(p => path === p.replace(/\/$/, '') || path.startsWith(p)) ? 'upstream' : 'local';
}

export function createRateLimiter({ tiers = TIERS, now = () => Date.now(), maxIdleMs = 10 * 60_000 } = {}) {
  const buckets = new Map();
  let lastSweep = now();
  function sweep(t) {
    if (t - lastSweep < 60_000) return;
    lastSweep = t;
    for (const [k, b] of buckets) if (t - b.at > maxIdleMs) buckets.delete(k);
  }
  /** Returns { ok, retryAfter } for one request from `ip` to `path`; retryAfter is whole seconds. */
  return function take(ip, path) {
    const t = now();
    sweep(t);
    const tier = tierFor(path);
    const { capacity, perSecond } = tiers[tier];
    const key = `${tier}|${ip}`;
    const b = buckets.get(key) ?? { tokens: capacity, at: t };
    b.tokens = Math.min(capacity, b.tokens + ((t - b.at) / 1000) * perSecond);
    b.at = t;
    buckets.set(key, b);
    if (b.tokens >= 1) { b.tokens -= 1; return { ok: true, retryAfter: 0 }; }
    return { ok: false, retryAfter: Math.ceil((1 - b.tokens) / perSecond) };
  };
}
