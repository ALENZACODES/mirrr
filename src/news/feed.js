/**
 * MIRRR Beauty News: headlines about beauty brands that serve Black, Latina, South Asian, East Asian,
 * Middle Eastern and North African, Indigenous and other communities.
 *
 * Three layers so the page is never empty:
 *   A  direct RSS/Atom feeds (beauty publications and brand blogs), filtered for relevance
 *   B  Google News RSS search feeds per brand and topic, used when layer A finds too few items
 *   C  the last-known-good snapshot: a disk cache, and news-snapshot.json committed in the repo
 *      so a cold start on Render's free plan (disk wiped) still has real headlines at once
 *
 * Content rules: only the headline, source name, date, a one-line snippet from the feed and a link
 * to the original. No article bodies and no images are copied. Items about men's grooming, items
 * with slurs or colourist "whitening" products, and off-topic items are dropped. Nothing is invented:
 * every item comes from a feed, word for word, and the snapshot is a real fetch.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const SOURCES = JSON.parse(readFileSync(join(__dirname, 'sources.json'), 'utf-8'));
export const SNAPSHOT_PATH = join(__dirname, 'news-snapshot.json');
export const LAYER_LABELS = {
  A: 'Live: direct feeds',
  'A+B': 'Live: direct feeds + Google News fallback',
  B: 'Live: Google News fallback',
  C: 'Saved snapshot (last known good)',
};
export const MIN_DIRECT = 60;   // fewer than this from layer A -> also use layer B
export const MIN_KEEP = 8;      // fewer than this from a refresh -> merge with the last good set
export const MAX_ITEMS = 150;
export const MAX_AGE_DAYS = 60;
export const MAX_PER_KEY = 12; // at most this many items per brand (or per feed when no brand), so one big brand never floods the page
export const COMMUNITIES = SOURCES.communities.map(c => c.id);

// ---------------------------------------------------------------------------
// Parsing (RSS 2.0 and Atom, no dependencies)
// ---------------------------------------------------------------------------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '\u2013', mdash: '\u2014', hellip: '\u2026', rsquo: '\u2019', lsquo: '\u2018', rdquo: '\u201d', ldquo: '\u201c', eacute: '\u00e9', reg: '\u00ae', trade: '\u2122', copy: '\u00a9' };
export function decode(s) {
  return String(s ?? '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ''; }
    return ENT[e.toLowerCase()] ?? m;
  });
}
const cdata = s => String(s ?? '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
export function plain(s) {
  // Entities are decoded twice because many feeds escape their HTML (&lt;p&gt;).
  let t = decode(cdata(s));
  t = t.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' ');
  t = decode(t).replace(/<[^>]*>/g, ' ');
  return t.replace(/\s+/g, ' ').trim();
}
function tag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? m[1] : null;
}
function attr(block, name, a) {
  const re = new RegExp(`<${name}\\s[^>]*${a}\\s*=\\s*["']([^"']+)["'][^>]*>`, 'gi');
  return [...block.matchAll(re)].map(m => ({ all: m[0], val: decode(m[1]) }));
}
export function oneLine(s, max = 180) {
  const t = plain(s);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(' ');
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.\u2013\u2014-]+$/, '')}\u2026`;
}
function isoDate(s) {
  if (!s) return null;
  const t = Date.parse(plain(s));
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

/** Parse an RSS or Atom document into raw items: { title, url, date, snippet, source }. */
export function parseFeed(xml, { name = '', kind = 'publication', id = '' } = {}) {
  const doc = String(xml ?? '');
  const out = [];
  const isAtom = /<feed[\s>]/i.test(doc) && !/<rss[\s>]/i.test(doc);
  const blocks = isAtom ? doc.match(/<entry[\s>][\s\S]*?<\/entry>/gi) : doc.match(/<item[\s>][\s\S]*?<\/item>/gi);
  for (const b of blocks ?? []) {
    let title = plain(tag(b, 'title'));
    let url = '';
    if (isAtom) {
      const links = attr(b, 'link', 'href');
      url = (links.find(l => /rel\s*=\s*["']alternate/i.test(l.all)) ?? links.find(l => !/rel\s*=/i.test(l.all)) ?? links[0])?.val ?? '';
    } else {
      url = plain(tag(b, 'link')) || plain(tag(b, 'guid'));
    }
    const date = isoDate(tag(b, 'pubDate') ?? tag(b, 'published') ?? tag(b, 'updated') ?? tag(b, 'dc:date'));
    let source = name;
    const src = tag(b, 'source');
    if (kind === 'google' && src) {
      source = plain(src);
      // Google News titles end in " - Publisher".
      const suffix = ` - ${source}`;
      if (title.endsWith(suffix)) title = title.slice(0, -suffix.length).trim();
    }
    let snippet = oneLine(tag(b, 'description') ?? tag(b, 'summary') ?? tag(b, 'content') ?? '');
    if (kind === 'google' || norm(snippet).startsWith(norm(title).slice(0, 40))) snippet = '';
    if (!title || !/^https?:\/\//i.test(url)) continue;
    out.push({ title, url: url.trim(), date, snippet, source: source || 'Unknown source', feed: id, via: kind === 'google' ? 'google' : 'direct' });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Relevance, safety and tagging
// ---------------------------------------------------------------------------
const rx = list => new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${list.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '[\\p{L}-]*').replace(/'/g, "['\u2019]?")).join('|')})(?:$|[^\\p{L}\\p{N}])`, 'iu');
const BEAUTY = rx(SOURCES.beauty_words);
const BLOCK_MEN = rx(SOURCES.block.mens_grooming);
const rot13 = w => w.replace(/[a-z]/gi, c => String.fromCharCode((c <= 'Z' ? 65 : 97) + ((c.toLowerCase().charCodeAt(0) - 97 + 13) % 26)));
const BLOCK_HARM = rx([...SOURCES.block.harmful, ...(SOURCES.block.slurs_rot13 ?? []).map(rot13)]);
const BLOCK_OFF = rx(SOURCES.block.off_topic);
const COMMUNITY_RX = Object.fromEntries(SOURCES.communities.map(c => [c.id, rx(c.keywords)]));
const BRAND_RX = SOURCES.brands.map(b => ({ b, re: rx([b.name, ...(b.aliases ?? [])]), strip: new RegExp([b.name, ...(b.aliases ?? [])].map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi') }));
const BLOCK_SOURCE = new RegExp((SOURCES.block.sources ?? []).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') || '$^', 'i');
// An ambiguous brand name (Kayali, Topicals, Tower 28...) counts only next to a beauty word other than the name itself.
const brandHit = (x, text) => x.re.test(text) && (!x.b.ambiguous || BEAUTY.test(text.replace(x.strip, ' ')));

export function norm(s) { return String(s ?? '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
export function normUrl(u) {
  try {
    const x = new URL(u);
    for (const k of [...x.searchParams.keys()]) if (/^(utm_|fbclid|gclid|mc_|oc$|ref$)/i.test(k)) x.searchParams.delete(k);
    x.hash = '';
    return `${x.hostname.replace(/^www\./, '').toLowerCase()}${x.pathname.replace(/\/+$/, '')}${x.search}`;
  } catch { return String(u); }
}

/** Why an item is blocked, or null. Blocking always wins over relevance. */
export function blockedReason(item) {
  const text = `${item.title} ${item.snippet}`;
  if (BLOCK_HARM.test(text)) return 'harmful';
  if (BLOCK_MEN.test(text)) return 'mens_grooming';
  if (BLOCK_OFF.test(item.title)) return 'off_topic';
  if (BLOCK_SOURCE.test(item.source ?? '') || BLOCK_SOURCE.test(item.url ?? '')) return 'blocked_source';
  if (norm(item.title).split(' ').length < 4) return 'too_short';
  return null;
}

/** Brands and communities an item is about (from the headline and snippet only). */
export function tagItem(item, hint = {}) {
  const text = `${item.title} ${item.snippet}`;
  const brands = BRAND_RX.filter(x => brandHit(x, text) || x.b.name === hint.ownBrand).map(x => x.b);
  const communities = new Set(brands.flatMap(b => b.communities));
  for (const [id, re] of Object.entries(COMMUNITY_RX)) if (re.test(text)) communities.add(id);
  if (hint.community && (brands.length || BEAUTY.test(text))) communities.add(hint.community);
  return { brands: brands.map(b => b.name), communities: [...communities].filter(c => COMMUNITIES.includes(c)) };
}

/**
 * Keep an item only if it is about beauty AND about a listed brand or a community.
 * Google News brand queries must name the brand in the headline or snippet.
 */
export function relevant(item, hint = {}) {
  if (blockedReason(item)) return null;
  const t = tagItem(item, hint);
  const text = `${item.title} ${item.snippet}`;
  if (hint.brand && !t.brands.includes(hint.brand)) return null;
  const aboutBeauty = BEAUTY.test(text) || t.brands.length > 0;
  if (!aboutBeauty) return null;
  if (!t.brands.length && !t.communities.length) return null;
  return { ...item, ...t };
}

export function dedupe(items) {
  const seenU = new Set(), seenT = new Set(), out = [];
  for (const it of items) {
    const u = normUrl(it.url), t = norm(it.title);
    if (seenU.has(u) || (t && seenT.has(t))) continue;
    seenU.add(u); if (t) seenT.add(t);
    out.push(it);
  }
  return out;
}
export function sortNewest(items) {
  return [...items].sort((a, b) => (Date.parse(b.date ?? 0) || 0) - (Date.parse(a.date ?? 0) || 0));
}
export function finalise(items, now = Date.now()) {
  const fresh = items.filter(i => {
    const t = Date.parse(i.date ?? '');
    return Number.isFinite(t) && t <= now + 36e5 && now - t <= MAX_AGE_DAYS * 864e5;
  });
  // Direct publisher links win over Google News redirects for the same story (direct come first).
  const ordered = [...fresh.filter(i => i.via === 'direct'), ...fresh.filter(i => i.via !== 'direct')];
  const per = {};
  return sortNewest(dedupe(ordered)).filter(i => {
    const k = i.brands?.[0] ?? i.feed ?? i.source;
    per[k] = (per[k] ?? 0) + 1;
    return per[k] <= MAX_PER_KEY;
  }).slice(0, MAX_ITEMS);
}

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------
export const googleUrl = q => `https://news.google.com/rss/search?q=${encodeURIComponent(`${q} when:30d`)}&hl=en-US&gl=US&ceid=US:en`;
export function googleSources(src = SOURCES) {
  return [
    ...src.google_topics.map(t => ({ id: `g-${t.id}`, name: `Google News: ${t.q}`, url: googleUrl(t.q), kind: 'google', hint: { community: t.community } })),
    ...src.brands.map(b => ({ id: `g-brand-${norm(b.name).replace(/ /g, '-')}`, name: `Google News: ${b.name}`, url: googleUrl(`"${b.name}"`), kind: 'google', hint: { brand: b.name } })),
  ];
}
export function directSources(src = SOURCES) {
  return src.feeds.map(f => ({ ...f, hint: { ...(f.community ? { community: f.community } : {}), ...(f.brand ? { ownBrand: f.brand } : {}) } }));
}

async function fetchText(fetchImpl, url, timeoutMs) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const r = await fetchImpl(url, { signal: ac.signal, headers: { 'user-agent': 'Mozilla/5.0 (compatible; MIRRR-BeautyNews/1.0; +https://mirrr-upbn.onrender.com/#news)', accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const text = await r.text();
    if (text.length > 4_000_000) throw new Error('too large');
    return text;
  } finally { clearTimeout(timer); }
}

/** Fetch a list of sources with limited concurrency; one failing source never affects another. */
export async function fetchSources(list, { fetchImpl = globalThis.fetch, timeoutMs = 8000, concurrency = 6 } = {}) {
  const results = new Array(list.length);
  let next = 0;
  async function worker() {
    while (next < list.length) {
      const i = next++;
      const s = list[i];
      try {
        const xml = await fetchText(fetchImpl, s.url, timeoutMs);
        const raw = parseFeed(xml, s);
        const kept = raw.map(it => relevant(it, s.hint)).filter(Boolean);
        results[i] = { id: s.id, name: s.name, ok: true, raw: raw.length, kept: kept.length, items: kept };
      } catch (e) {
        results[i] = { id: s.id, name: s.name, ok: false, error: e?.name === 'AbortError' ? 'timeout' : String(e?.message ?? e).slice(0, 80), items: [] };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, list.length) }, worker));
  return results;
}

/** Layers A then B. Returns the items plus an honest report of what worked. */
export async function aggregate({ fetchImpl = globalThis.fetch, now = () => Date.now(), sources = SOURCES, timeoutMs, minDirect = MIN_DIRECT } = {}) {
  const a = await fetchSources(directSources(sources), { fetchImpl, timeoutMs });
  let items = finalise(a.flatMap(r => r.items), now());
  let layer = 'A', b = [];
  if (items.length < minDirect) {
    b = await fetchSources(googleSources(sources), { fetchImpl, timeoutMs });
    const merged = finalise([...a.flatMap(r => r.items), ...b.flatMap(r => r.items)], now());
    layer = items.length ? 'A+B' : 'B';
    items = merged;
  }
  const report = [...a, ...b].map(({ items: _i, ...r }) => r);
  return {
    fetched_at: new Date(now()).toISOString(), layer, items,
    sources: { tried: report.length, ok: report.filter(r => r.ok).length, failed: report.filter(r => !r.ok).map(r => ({ id: r.id, name: r.name, error: r.error })) },
    report,
  };
}

// ---------------------------------------------------------------------------
// Service: timer, disk cache, snapshot
// ---------------------------------------------------------------------------
export function loadSnapshot(path) {
  try {
    if (!existsSync(path)) return null;
    const s = JSON.parse(readFileSync(path, 'utf-8'));
    if (!Array.isArray(s?.items) || !s.fetched_at) return null;
    // Re-check every saved item against today's rules, so an old file can never show something the filters now block.
    const items = s.items.filter(i => i && i.title && /^https?:\/\//.test(i.url) && !blockedReason(i));
    return { ...s, items };
  } catch { return null; }
}

export function createNewsService({
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
  snapshotPath = SNAPSHOT_PATH,
  dir = process.env.MIRRR_DATA_DIR || join(tmpdir(), 'mirrr-data'),
  intervalMs = 30 * 60_000,
  offline = process.env.MIRRR_NEWS_OFFLINE === '1',
  timeoutMs = 8000,
  sources = SOURCES,
  log = (...a) => console.log('[news]', ...a),
} = {}) {
  try { mkdirSync(dir, { recursive: true }); } catch { /* memory only */ }
  const cachePath = join(dir, 'news-cache.json');
  const write = v => { try { const t = `${cachePath}.tmp`; writeFileSync(t, JSON.stringify(v)); renameSync(t, cachePath); return true; } catch { return false; } };

  // Layer C at boot: the newer of the disk cache and the committed snapshot.
  const disk = loadSnapshot(cachePath), repo = loadSnapshot(snapshotPath);
  const pick = [disk, repo].filter(x => x && x.items.length).sort((x, y) => Date.parse(y.fetched_at) - Date.parse(x.fetched_at))[0] ?? null;
  let state = pick
    ? { items: sortNewest(pick.items), fetched_at: pick.fetched_at, layer: 'C', snapshot_from: pick === disk ? 'disk cache' : 'repo snapshot', sources: pick.sources ?? null }
    : { items: [], fetched_at: null, layer: 'C', snapshot_from: 'none', sources: null };
  let lastAttempt = null, lastError = null, running = null, timer = null;

  async function refresh() {
    if (running) return running;
    running = (async () => {
      lastAttempt = new Date(now()).toISOString();
      if (offline) { lastError = 'offline mode: live feeds disabled'; return state; }
      try {
        const r = await aggregate({ fetchImpl, now, timeoutMs, sources });
        if (r.items.length >= MIN_KEEP) {
          state = { items: r.items, fetched_at: r.fetched_at, layer: r.layer, snapshot_from: null, sources: r.sources };
        } else if (r.items.length) {
          // Too few new items: keep the last good set and add the new ones on top.
          state = { items: finalise([...r.items, ...state.items], now()), fetched_at: r.fetched_at, layer: `${r.layer}+C`, snapshot_from: state.snapshot_from ?? 'earlier live fetch', sources: r.sources };
        } else {
          lastError = `live fetch found no items (${r.sources.failed.length} of ${r.sources.tried} sources failed); kept the last good set`;
          return state;
        }
        lastError = null;
        write({ fetched_at: state.fetched_at, layer: state.layer, sources: state.sources, items: state.items });
        log(`refreshed: ${state.items.length} items, layer ${state.layer}, ${r.sources.ok}/${r.sources.tried} sources ok`);
      } catch (e) {
        lastError = String(e?.message ?? e).slice(0, 120);
        log('refresh failed, keeping last good set:', lastError);
      }
      return state;
    })().finally(() => { running = null; });
    return running;
  }

  return {
    get() {
      const layer = state.layer;
      return {
        updated_at: state.fetched_at,
        layer,
        layer_label: LAYER_LABELS[layer] ?? (layer.endsWith('+C') ? `${LAYER_LABELS[layer.slice(0, -2)] ?? 'Live'}, topped up from the last good set` : layer),
        snapshot_from: state.snapshot_from,
        last_attempt: lastAttempt,
        last_error: lastError,
        refresh_minutes: Math.round(intervalMs / 60_000),
        count: state.items.length,
        sources: state.sources ? { tried: state.sources.tried, ok: state.sources.ok, failed: state.sources.failed?.length ?? 0 } : null,
        items: state.items.map(({ title, url, source, date, snippet, brands, communities, via }) => ({ title, url, source, date, snippet, brands, communities, via })),
      };
    },
    refresh,
    start({ firstDelayMs = 3000 } = {}) {
      if (timer) return;
      const kick = () => { refresh().catch(() => {}); };
      setTimeout(kick, firstDelayMs).unref?.();
      timer = setInterval(kick, intervalMs);
      timer.unref?.();
    },
    stop() { if (timer) clearInterval(timer); timer = null; },
    _state: () => state,
  };
}
