/**
 * MIRRR business entry points (server side): shop-by-look bundles, studio cross-sell by product
 * category, brand and stylist/salon interest lists, and aggregate taste trends for the brand offer.
 *
 * Honesty: bundles and cross-sell use only the real products in src/data/products_live.json (brands'
 * own stores, prices as of the stated date, no affiliate deal). Interest lists hold an email the person
 * typed herself with the consent box ticked; nothing is sold. Trends are plain counts of the Qloo tags
 * and top looks from taste runs: no person, session, IP or input text is stored.
 * Storage is the same ephemeral server file as the waitlist (reset on redeploy or restart).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { productData, withUtm, normaliseEmail } from './store.js';

export const INTEREST_KINDS = ['brand', 'pro', 'news'];
/** Beauty News sign-up: optional interests, none pre-selected. */
export const NEWS_INTERESTS = ['black', 'latina', 'south_asian', 'east_asian', 'mena', 'indigenous', 'multicultural', 'launches', 'hair', 'skin', 'makeup'];
export const PRO_TYPES = ['', 'stylist', 'braider', 'wig_install', 'colourist', 'makeup_artist', 'bridal', 'salon'];
export const BRAND_TYPES = ['', 'black_owned', 'indie', 'women_of_colour_owned', 'indigenous_owned', 'other'];
const MAX_TAGS = 300;

/** Every named-product list as a bundle, with item count and the sum of listed prices per currency. */
export function bundles() {
  const LIVE = productData();
  const looksBySet = {};
  for (const [look, set] of Object.entries(LIVE.looks)) (looksBySet[set] ??= []).push(look);
  return Object.entries(LIVE.sets).map(([id, set]) => {
    const items = set.products.map(pid => LIVE.products[pid]).filter(Boolean);
    const totals = {};
    for (const p of items) totals[p.currency] = Math.round(((totals[p.currency] ?? 0) + (p.price_min ?? 0)) * 100) / 100;
    return {
      id, name: set.name, count: items.length, totals, looks: looksBySet[id] ?? [],
      owned_by_label: [...new Set(items.map(p => p.ownership?.label).filter(Boolean))],
      products: items.map(p => ({ id: p.id, brand: p.brand, name: p.name, category: p.category, price_text: p.price_text, currency: p.currency, ownership: p.ownership?.label ?? null, shop_url: withUtm(p.url, { utm_content: `bundle_${id}` }) })),
    };
  });
}

/** Real products in the given categories, for a studio's "complete the routine" strip. */
export function productsByCategory(categories, surface = 'studio', limit = 6) {
  const LIVE = productData();
  const want = new Set(categories);
  const seen = new Set();
  const out = [];
  for (const p of Object.values(LIVE.products)) {
    if (!want.has(p.category) || seen.has(p.brand + p.category)) continue;
    seen.add(p.brand + p.category);
    out.push({ id: p.id, brand: p.brand, name: p.name, category: p.category, price_text: p.price_text, ownership: p.ownership?.label ?? null, ownership_source: p.ownership?.sources?.[0] ?? null, checked_at: p.checked_at, shop_url: withUtm(p.url, { utm_content: surface }) });
    if (out.length >= limit) break;
  }
  return out;
}

export function createBizStore({ dir = process.env.MIRRR_DATA_DIR || join(tmpdir(), 'mirrr-data'), now = () => Date.now() } = {}) {
  try { mkdirSync(dir, { recursive: true }); } catch { /* memory only */ }
  const file = join(dir, 'interest.json');
  const tfile = join(dir, 'trends.json');
  const read = (f, d) => { try { return existsSync(f) ? JSON.parse(readFileSync(f, 'utf-8')) : d; } catch { return d; } };
  const write = (f, v) => { try { const t = `${f}.tmp`; writeFileSync(t, JSON.stringify(v)); renameSync(t, f); return true; } catch { return false; } };
  const list = read(file, { entries: [] });
  const tr = read(tfile, null) ?? { since: new Date(now()).toISOString(), runs: 0, tags: {}, looks: {} };
  let timer = null;
  const later = () => { if (!timer) { timer = setTimeout(() => { timer = null; write(tfile, tr); }, 2000); timer.unref?.(); } };
  return {
    joinInterest({ kind, email, consent, type = '', interests = [] } = {}) {
      if (!INTEREST_KINDS.includes(kind)) return { ok: false, error: 'Unknown form.' };
      if (consent !== true) return { ok: false, error: 'Please tick the box to agree before sending.' };
      const e = normaliseEmail(email);
      if (!e) return { ok: false, error: 'Please enter a valid email address.' };
      const allowed = kind === 'brand' ? BRAND_TYPES : kind === 'pro' ? PRO_TYPES : [''];
      const t = allowed.includes(type) ? type : '';
      if (list.entries.some(x => x.kind === kind && x.email === e)) return { ok: true, already: true };
      const entry = { kind, email: e, type: t, at: new Date(now()).toISOString() };
      if (kind === 'news') entry.interests = [...new Set((Array.isArray(interests) ? interests : []).filter(x => NEWS_INTERESTS.includes(x)))];
      list.entries.push(entry);
      write(file, list);
      return { ok: true };
    },
    leaveInterest(email) {
      const e = normaliseEmail(email);
      if (!e) return { ok: false, error: 'Please enter a valid email address.' };
      const before = list.entries.length;
      list.entries = list.entries.filter(x => x.email !== e);
      if (before !== list.entries.length) write(file, list);
      return { ok: true };
    },
    interestCounts() {
      const c = { brand: 0, pro: 0, news: 0 };
      for (const x of list.entries) c[x.kind] += 1;
      return c;
    },
    /** Called after a live Qloo taste run: counts tag names and the top look id only. */
    recordTrend(result) {
      const q = result?.meta?.provenance ?? result?.qloo;
      if (!q?.qloo_powered) return false;
      tr.runs += 1;
      for (const t of (q.used ?? [])) {
        const n = String(t.name ?? '').trim().toLowerCase().slice(0, 40);
        if (!n || (!(n in tr.tags) && Object.keys(tr.tags).length >= MAX_TAGS)) continue;
        tr.tags[n] = (tr.tags[n] ?? 0) + 1;
      }
      const top = result?.looks?.[0]?.id ?? result?.looks?.[0]?.look?.id;
      if (typeof top === 'string' && /^[a-z0-9_]{1,60}$/.test(top)) tr.looks[top] = (tr.looks[top] ?? 0) + 1;
      later();
      return true;
    },
    trends() {
      const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }));
      return {
        counting_since: tr.since, live_qloo_taste_runs: tr.runs,
        top_qloo_tags: top(tr.tags, 15), top_looks: top(tr.looks, 10),
        what_this_is: 'Plain counts of the Qloo taste tags and top looks from live taste runs on MIRRR. No person, session, IP address or typed text is stored. Counts reset when the free server restarts.',
      };
    },
  };
}
