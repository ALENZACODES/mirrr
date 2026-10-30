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

// ---------------------------------------------------------------------------
// Who is asking. X-Forwarded-For is a list that every proxy appends to, so its left end is whatever
// the visitor typed and cannot be trusted. Only hops added by proxies we trust count: the loopback
// and private-network peers (Render's proxy and local tooling) and Cloudflare, which fronts Render.
// Walking the list from the right and skipping those trusted hops gives the address that the
// outermost trusted proxy saw connect, which a visitor cannot choose.
// ---------------------------------------------------------------------------

const cidrs = list => list.map(c => { const [ip, bits] = c.split('/'); return [v4(ip), Number(bits)]; });
const PRIVATE_V4 = cidrs(['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '127.0.0.0/8', '169.254.0.0/16', '100.64.0.0/10']);
// https://www.cloudflare.com/ips-v4 and https://www.cloudflare.com/ips-v6
const CLOUDFLARE_V4 = cidrs([
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18',
  '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
  '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
]);
const PRIVATE_V6 = ['::1', 'fc', 'fd', 'fe80:'];
const CLOUDFLARE_V6 = ['2400:cb00:', '2606:4700:', '2803:f800:', '2405:b500:', '2405:8100:', '2a06:98c', '2a06:98d', '2a06:98e', '2a06:98f', '2c0f:f248:'];

function v4(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4 || parts.some(x => !/^\d{1,3}$/.test(x) || Number(x) > 255)) return null;
  return parts.reduce((n, x) => n * 256 + Number(x), 0);
}
function within(raw, ranges4, prefixes6) {
  const ip = String(raw ?? '').trim().toLowerCase().replace(/^::ffff:/, '');
  const n = v4(ip);
  if (n !== null) return ranges4.some(([base, bits]) => Math.floor(n / 2 ** (32 - bits)) === Math.floor(base / 2 ** (32 - bits)));
  return ip.includes(':') && prefixes6.some(p => ip === p || ip.startsWith(p));
}
const isPrivateHop = ip => within(ip, PRIVATE_V4, PRIVATE_V6);
const isCloudflareHop = ip => within(ip, CLOUDFLARE_V4, CLOUDFLARE_V6);

/** True for an address belonging to a proxy we trust (private network, loopback or Cloudflare). */
export function isTrustedHop(ip) {
  return isPrivateHop(ip) || isCloudflareHop(ip);
}

const forwardedHops = req => {
  const raw = req.headers['x-forwarded-for'];
  return (Array.isArray(raw) ? raw.join(',') : String(raw ?? '')).split(',').map(h => h.trim()).filter(Boolean);
};

/**
 * The visitor's address for rate limiting. If the connection itself comes from a trusted proxy,
 * walk X-Forwarded-For (all copies of the header, in order) from the right and return the first hop
 * that is not a trusted proxy; otherwise the connection's own address is the visitor.
 */
export function clientAddress(req) {
  const peer = req.socket?.remoteAddress ?? 'unknown';
  if (!isTrustedHop(peer)) return peer;
  const hops = forwardedHops(req);
  for (let i = hops.length - 1; i >= 0; i--) if (!isTrustedHop(hops[i])) return hops[i];
  return hops[0] ?? peer;
}

/** The shape of the header, with no addresses in it: one letter per hop, p = private, c = Cloudflare, x = other. */
export function hopShape(req) {
  const kind = h => (isPrivateHop(h) ? 'p' : isCloudflareHop(h) ? 'c' : 'x');
  const cf = req.headers['cf-connecting-ip'];
  const picked = clientAddress(req);
  return `xff=${forwardedHops(req).map(kind).join('') || '-'} peer=${isTrustedHop(req.socket?.remoteAddress) ? 'trusted' : 'direct'} cf-connecting-ip=${cf ? (cf === picked ? 'same-as-picked' : 'differs') : 'absent'}`;
}
