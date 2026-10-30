/**
 * MIRRR money layer: named products, aggregate counters, referral counts and the MIRRR Plus waitlist.
 *
 * Privacy: counters are plain numbers per event name. No cookies, no visitor IDs, no IP addresses,
 * no fingerprinting. The only personal data the server ever holds is a waitlist email a person typed
 * in herself, kept for one purpose (telling her when MIRRR Plus opens) and deleted on request.
 * Emails are never written to logs.
 *
 * Storage: plain JSON files in MIRRR_DATA_DIR (default: the OS temp dir). On Render's free plan the
 * disk is ephemeral, so these files are lost on every redeploy or restart. That limit is stated in
 * /api/stats and in the Help & Privacy text.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { createHash, randomBytes } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LIVE = JSON.parse(readFileSync(join(__dirname, '../data/products_live.json'), 'utf-8'));

export const UTM = LIVE.utm;
export const CLIENT_EVENTS = ['taste_run', 'tryon_complete', 'plan_save', 'leap_result', 'share', 'product_click'];
export const SERVER_EVENTS = ['waitlist_signup', 'waitlist_removal', 'ref_landing'];
export const ALL_EVENTS = [...CLIENT_EVENTS, ...SERVER_EVENTS];
export const MOMENTS = ['tryon', 'plan_save', 'leap', 'plus_page'];
const MAX_REF_CODES = 500;

export function withUtm(url, extra = {}) {
  const u = new URL(url);
  for (const [k, v] of Object.entries({ ...UTM, ...extra })) u.searchParams.set(k, v);
  return u.toString();
}

/** Named products for a look (or a Style Match guide id). Null when none were sourced. */
export function shopForLook(lookId) {
  const setId = LIVE.looks[lookId];
  if (!setId) return null;
  const set = LIVE.sets[setId];
  return {
    lookId, setId, setName: set.name, checkedAt: LIVE.checked_at,
    basis: 'Picked for this style of look from brands\u2019 own stores. Choose your exact shade on the brand\u2019s page.',
    products: set.products.map(id => {
      const p = LIVE.products[id];
      return { ...p, shop_url: withUtm(p.url, { utm_content: lookId }) };
    }),
  };
}
export const productData = () => LIVE;

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------
export function createStore({ dir = process.env.MIRRR_DATA_DIR || join(tmpdir(), 'mirrr-data'), now = () => Date.now() } = {}) {
  try { mkdirSync(dir, { recursive: true }); } catch { /* read-only: stay in memory */ }
  const countersFile = join(dir, 'counters.json');
  const waitlistFile = join(dir, 'waitlist.json');
  const read = (f, d) => { try { return existsSync(f) ? JSON.parse(readFileSync(f, 'utf-8')) : d; } catch { return d; } };
  const write = (f, v) => { try { const t = `${f}.tmp`; writeFileSync(t, JSON.stringify(v)); renameSync(t, f); return true; } catch { return false; } };

  const c = read(countersFile, null) ?? { since: new Date(now()).toISOString(), events: {}, refs: {} };
  for (const e of ALL_EVENTS) c.events[e] ??= 0;
  const wl = read(waitlistFile, { entries: [] });
  let timer = null;
  const flush = () => { timer = null; write(countersFile, c); };
  const later = () => { if (!timer) { timer = setTimeout(flush, 2000); timer.unref?.(); } };

  return {
    dir,
    count(event) {
      if (!ALL_EVENTS.includes(event)) return false;
      c.events[event] += 1; later(); return true;
    },
    countRef(code) {
      const ref = normaliseRef(code);
      if (!ref) return false;
      if (!(ref in c.refs) && Object.keys(c.refs).length >= MAX_REF_CODES) return false;
      c.refs[ref] = (c.refs[ref] ?? 0) + 1;
      c.events.ref_landing += 1; later(); return true;
    },
    stats() {
      const refs = Object.entries(c.refs).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([code, n]) => ({ code, landings: n }));
      return {
        counting_since: c.since,
        events: { ...c.events },
        top_referral_codes: refs,
        waitlist: { on_list: wl.entries.length },
        storage: 'Aggregate numbers in a server file. Render\u2019s free disk is ephemeral, so counts and the waitlist reset on each redeploy or restart.',
        privacy: 'Counts only. No cookies, visitor IDs, IP addresses or fingerprints are stored. Emails are never shown here.',
      };
    },
    joinWaitlist(email, moment) {
      const e = normaliseEmail(email);
      if (!e) return { ok: false, error: 'Please enter a valid email address.' };
      const m = MOMENTS.includes(moment) ? moment : 'plus_page';
      if (wl.entries.some(x => x.email === e)) return { ok: true, already: true };
      wl.entries.push({ email: e, moment: m, at: new Date(now()).toISOString() });
      const saved = write(waitlistFile, wl);
      c.events.waitlist_signup += 1; later();
      return { ok: true, saved };
    },
    leaveWaitlist(email) {
      const e = normaliseEmail(email);
      if (!e) return { ok: false, error: 'Please enter a valid email address.' };
      const before = wl.entries.length;
      wl.entries = wl.entries.filter(x => x.email !== e);
      const removed = before !== wl.entries.length;
      if (removed) { write(waitlistFile, wl); c.events.waitlist_removal += 1; later(); }
      // Same answer whether or not the email was on the list, so the endpoint cannot be used to test addresses.
      return { ok: true };
    },
    _waitlistSize: () => wl.entries.length,
    _flush: flush,
  };
}

export function normaliseEmail(v) {
  if (typeof v !== 'string') return null;
  const e = v.trim().toLowerCase();
  if (e.length < 6 || e.length > 254) return null;
  if (!/^[a-z0-9._%+-]{1,64}@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,24}$/.test(e)) return null;
  if (e.includes('..')) return null;
  return e;
}
export function normaliseRef(v) {
  if (typeof v !== 'string') return null;
  const r = v.trim().toLowerCase();
  return /^[a-z0-9-]{2,24}$/.test(r) ? r : null;
}

/** Waitlist limiter: 5 writes per 10 minutes per address. Addresses are kept only as salted hashes, in memory. */
export function createWaitlistLimiter({ max = 5, windowMs = 10 * 60_000, now = () => Date.now() } = {}) {
  const salt = randomBytes(16);
  const hits = new Map();
  return function allow(address) {
    const t = now();
    const k = createHash('sha256').update(salt).update(String(address)).digest('base64').slice(0, 16);
    const list = (hits.get(k) ?? []).filter(x => t - x < windowMs);
    if (hits.size > 5000) for (const [kk, l] of hits) if (!l.some(x => t - x < windowMs)) hits.delete(kk);
    if (list.length >= max) { hits.set(k, list); return false; }
    list.push(t); hits.set(k, list); return true;
  };
}
