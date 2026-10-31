// MIRRR Beauty News (src/news): parsing, dedupe, filtering, the A -> B -> C fallback order and snapshot loading.
// Every network call is mocked; nothing here touches the internet.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  parseFeed, relevant, dedupe, finalise, blockedReason, aggregate, loadSnapshot, createNewsService,
  SOURCES, SNAPSHOT_PATH, MIN_KEEP,
} from '../src/news/feed.js';
import { handleNews } from '../src/news/routes.js';

const fx = n => readFileSync(new URL(`./fixtures/news/${n}`, import.meta.url), 'utf8');
const NOW = Date.parse('2026-10-30T12:00:00Z');
const tiny = {
  ...SOURCES,
  feeds: [
    { id: 'pub', name: 'Test Beauty', url: 'https://feeds.test/rss', kind: 'publication' },
    { id: 'blog', name: 'Brand blog', url: 'https://feeds.test/atom', kind: 'brand', community: 'black' },
    { id: 'dead', name: 'Dead feed', url: 'https://feeds.test/dead', kind: 'publication' },
  ],
  google_topics: [],
  brands: SOURCES.brands.filter(b => b.name === 'Rare Beauty'),
};
const mockFetch = (map, calls = []) => async (url, opts) => {
  calls.push(url);
  for (const [k, v] of Object.entries(map)) if (url.includes(k)) {
    if (v instanceof Error) throw v;
    return { ok: true, status: 200, text: async () => v };
  }
  return { ok: false, status: 404, text: async () => '' };
};

test('parses RSS (CDATA, double-escaped HTML, entities) and Atom; skips items without a link', () => {
  const r = parseFeed(fx('rss.xml'), { name: 'Test Beauty', id: 'pub' });
  assert.equal(r.length, 6);
  assert.equal(r[0].title, 'Fenty Beauty launches 50 new foundation shades');
  assert.equal(r[0].snippet, 'Rihanna\u2019s brand adds deep shades.');
  assert.equal(r[0].date, '2026-10-29T10:00:00.000Z');
  assert.equal(r[0].via, 'direct');
  const a = parseFeed(fx('atom.xml'), { name: 'Brand blog' });
  assert.equal(a.length, 1);
  assert.equal(a[0].url, 'https://brand.example/blogs/news/4c');
  assert.equal(a[0].snippet, 'Moisture first.');
  const g = parseFeed(fx('google.xml'), { kind: 'google' });
  assert.equal(g[0].title, 'Rare Beauty adds a new blush shade');
  assert.equal(g[0].source, 'Allure');
  assert.equal(g[0].snippet, '', 'Google snippets just repeat the headline');
  assert.equal(g[0].via, 'google');
  assert.deepEqual(parseFeed('<html>not a feed</html>'), []);
});

test('filters: men\u2019s grooming, whitening products, slurs and off-topic items are dropped; brand queries must name the brand', () => {
  const items = parseFeed(fx('rss.xml'), { name: 'Test Beauty' }).map(i => relevant(i)).filter(Boolean);
  const titles = items.map(i => i.title);
  assert.ok(titles.includes('Black-owned beauty brands to know this fall'));
  assert.ok(titles.includes('Fenty Beauty launches 50 new foundation shades'));
  assert.ok(!titles.some(t => /beard|Stock market|whitening/i.test(t)));
  assert.equal(blockedReason({ title: 'The best beard oils for men', snippet: '' }), 'mens_grooming');
  assert.equal(blockedReason({ title: 'Skin-lightening cream review', snippet: '' }), 'harmful');
  const fenty = items.find(i => i.brands.includes('Fenty Beauty'));
  assert.ok(fenty.communities.length > 0, 'brand items carry the brand\u2019s communities for filtering');
  const g = parseFeed(fx('google.xml'), { kind: 'google' }).map(i => relevant(i, { brand: 'Rare Beauty' })).filter(Boolean);
  assert.deepEqual(g.map(i => i.title), ['Rare Beauty adds a new blush shade']);
  // The slur blocklist is stored encoded, so the words never appear in the repo, but it still works.
  assert.ok(SOURCES.block.slurs_rot13.length > 5);
  assert.equal(blockedReason({ title: `a ${'puvax'.replace(/[a-z]/g, c => String.fromCharCode(97 + ((c.charCodeAt(0) - 84) % 26)))} joke`, snippet: '' }), 'harmful');
});

test('ambiguous brand names need a beauty word; spam sources and too-short headlines are dropped', () => {
  const r = t => relevant({ title: t, snippet: '', source: 'Some Paper', url: 'https://x.com/1' });
  assert.equal(r('Ali Kayali capture is a victory that could backfire'), null);
  assert.ok(r('Kayali launches its new vanilla fragrance at Sephora'));
  assert.equal(r('Topicals: the real gateway drug for senior citizens'), null);
  assert.equal(r('Tower 28 announces partnership with a national football federation'), null);
  assert.ok(r('Selena Gomez and Demi Lovato reunite for Rare Beauty campaign'));
  assert.equal(blockedReason({ title: 'rare beauty', snippet: '' }), 'too_short');
  assert.equal(blockedReason({ title: 'NEW Pat McGrath Labs lipstick full size', snippet: '', source: 'alphavilleearredores.com.br' }), 'blocked_source');
});

test('dedupe by normalised URL (tracking tags dropped) and by headline; newest first; old and future items dropped', () => {
  const base = { snippet: '', source: 's', via: 'direct' };
  const d = dedupe([
    { ...base, title: 'A', url: 'https://www.x.com/a?utm_source=y' },
    { ...base, title: 'A different title', url: 'https://x.com/a/' },
    { ...base, title: 'a!', url: 'https://z.com/q' },
    { ...base, title: 'B', url: 'https://x.com/b' },
  ]);
  assert.deepEqual(d.map(i => i.title), ['A', 'B']);
  const f = finalise([
    { ...base, title: 'old', url: 'https://x/1', date: '2026-01-01T00:00:00Z' },
    { ...base, title: 'mid', url: 'https://x/2', date: '2026-10-20T00:00:00Z' },
    { ...base, title: 'new', url: 'https://x/3', date: '2026-10-29T00:00:00Z' },
    { ...base, title: 'future', url: 'https://x/4', date: '2026-12-29T00:00:00Z' },
    { ...base, title: 'undated', url: 'https://x/5', date: null },
  ], NOW);
  assert.deepEqual(f.map(i => i.title), ['new', 'mid']);
  // A direct publisher link wins over a Google News copy of the same story.
  const g = finalise([
    { ...base, via: 'google', title: 'Same story', url: 'https://news.google.com/1', date: '2026-10-29T00:00:00Z' },
    { ...base, via: 'direct', title: 'Same story', url: 'https://pub.com/1', date: '2026-10-29T00:00:00Z' },
  ], NOW);
  assert.equal(g.length, 1);
  assert.equal(g[0].url, 'https://pub.com/1');
});

test('layer A only when it finds enough; one dead feed never breaks the others', async () => {
  const calls = [];
  const r = await aggregate({ fetchImpl: mockFetch({ 'feeds.test/rss': fx('rss.xml'), 'feeds.test/atom': fx('atom.xml'), '/dead': new Error('boom') }, calls), now: () => NOW, sources: tiny, minDirect: 2 });
  assert.equal(r.layer, 'A');
  assert.ok(r.items.length >= 3);
  assert.equal(r.sources.failed.length, 1);
  assert.equal(r.sources.failed[0].id, 'dead');
  assert.ok(!calls.some(u => u.includes('news.google.com')), 'Google News is not called when layer A is enough');
});

test('layer B (Google News) is added when layer A finds too few, and used alone when A is down', async () => {
  const calls = [];
  const r = await aggregate({ fetchImpl: mockFetch({ 'feeds.test/rss': fx('rss.xml'), 'news.google.com': fx('google.xml') }, calls), now: () => NOW, sources: tiny, minDirect: 100 });
  assert.equal(r.layer, 'A+B');
  assert.ok(calls.some(u => u.includes('news.google.com')));
  assert.ok(r.items.some(i => i.via === 'google'));
  const b = await aggregate({ fetchImpl: mockFetch({ 'news.google.com': fx('google.xml') }), now: () => NOW, sources: tiny });
  assert.equal(b.layer, 'B');
  assert.equal(b.items.length, 1);
});

test('layer C: the committed snapshot is real, loads at boot, and serves when every feed is blocked', async () => {
  const snap = loadSnapshot(SNAPSHOT_PATH);
  assert.ok(snap, 'news-snapshot.json is committed');
  assert.ok(snap.items.length >= MIN_KEEP);
  for (const i of snap.items) {
    assert.match(i.url, /^https?:\/\//);
    assert.ok(i.title && i.source && i.date);
    assert.equal(blockedReason(i), null);
    assert.ok(!('image' in i) && !('content' in i), 'no images or article bodies are stored');
  }
  const dir = mkdtempSync(join(tmpdir(), 'news-'));
  const svc = createNewsService({ dir, fetchImpl: async () => { throw new Error('blocked'); }, now: () => NOW, log: () => {} });
  const before = svc.get();
  assert.equal(before.layer, 'C');
  assert.equal(before.snapshot_from, 'repo snapshot');
  assert.equal(before.count, snap.items.length);
  await svc.refresh();
  const after = svc.get();
  assert.equal(after.layer, 'C', 'a failed refresh keeps the last good set');
  assert.equal(after.count, snap.items.length);
  assert.match(after.last_error, /no items/);
  assert.ok(!existsSync(join(dir, 'news-cache.json')), 'an empty refresh never overwrites the cache');
});

test('a good refresh replaces the snapshot and is written to the disk cache, which wins at the next boot', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'news-'));
  const good = { fetched_at: '2026-11-05T00:00:00.000Z', layer: 'A', items: Array.from({ length: MIN_KEEP }, (_, k) => ({ title: `Fenty Beauty story ${k}`, url: `https://x.com/${k}`, source: 'X', date: '2026-10-29T00:00:00Z', snippet: '', brands: ['Fenty Beauty'], communities: ['black'], via: 'direct' })) };
  writeFileSync(join(dir, 'news-cache.json'), JSON.stringify(good));
  const svc = createNewsService({ dir, offline: true, log: () => {} });
  assert.equal(svc.get().snapshot_from, 'disk cache');
  assert.equal(svc.get().count, MIN_KEEP);
  const liveDir = mkdtempSync(join(tmpdir(), 'news-'));
  const live = createNewsService({ dir: liveDir, sources: tiny, now: () => NOW, log: () => {}, fetchImpl: mockFetch({ 'feeds.test/rss': fx('rss.xml'), 'feeds.test/atom': fx('atom.xml'), 'news.google.com': fx('google.xml') }) });
  await live.refresh();
  const g = live.get();
  // Too few for MIN_KEEP from this tiny mock, so the new items are merged on top of the last good set (the snapshot).
  assert.ok(['A', 'A+B', 'A+C', 'A+B+C'].includes(g.layer), g.layer);
  assert.ok(g.items.some(i => i.title === 'Black-owned beauty brands to know this fall'));
  assert.ok(g.count >= MIN_KEEP);
  assert.ok(existsSync(join(liveDir, 'news-cache.json')), 'the good set is written to the disk cache');
  assert.ok(g.items.every(i => !blockedReason(i)));
});

test('broken snapshot files are ignored, never crash', () => {
  const dir = mkdtempSync(join(tmpdir(), 'news-'));
  writeFileSync(join(dir, 'bad.json'), '{not json');
  assert.equal(loadSnapshot(join(dir, 'bad.json')), null);
  assert.equal(loadSnapshot(join(dir, 'missing.json')), null);
  writeFileSync(join(dir, 'old.json'), JSON.stringify({ fetched_at: '2026-10-01T00:00:00Z', items: [{ title: 'Beard oil for men', url: 'https://x/1' }, { title: 'Fenty Beauty adds a new lipstick', url: 'https://x/2' }] }));
  assert.deepEqual(loadSnapshot(join(dir, 'old.json')).items.map(i => i.title), ['Fenty Beauty adds a new lipstick'], 'old files are re-checked against today\u2019s filters');
});

test('API: /api/news says when and from which layer; sign-up needs consent, keeps only known interests, and can be removed', async () => {
  const svc = { get: () => ({ updated_at: '2026-10-30T00:00:00Z', layer: 'C', layer_label: 'Saved snapshot (last known good)', count: 0, items: [] }) };
  const call = async (method, path, body) => {
    let status = 0, json = null;
    const handled = await handleNews(method, path, new URL(`http://x${path}`), {}, {}, { sendJSON: (_r, s, j) => { status = s; json = j; }, readBody: async () => body, address: `t-${Math.random()}`, service: svc });
    return { handled, status, json };
  };
  const n = await call('GET', '/api/news');
  assert.equal(n.status, 200);
  assert.equal(n.json.layer, 'C');
  assert.ok(n.json.updated_at && n.json.layers.A && n.json.layers.C);
  const s = await call('GET', '/api/news/sources');
  assert.ok(s.json.feeds.length >= 10 && s.json.brands.length >= 20);
  assert.equal((await call('POST', '/api/news/signup', { email: 'a@b.co', consent: false })).status, 400);
  assert.equal((await call('POST', '/api/news/signup', { email: 'nope', consent: true })).status, 400);
  const ok = await call('POST', '/api/news/signup', { email: `n${Date.now()}@b.co`, consent: true, interests: ['black', 'hack'] });
  assert.equal(ok.status, 200);
  assert.match(ok.json.note, /only email you if you tick consent/);
  assert.equal((await call('POST', '/api/news/remove', { email: 'n@b.co' })).status, 200);
  assert.equal((await call('GET', '/api/other')).handled, false);
});

test('page: Beauty News in the nav, home band and footer; filters and interests start unselected; consent unticked', () => {
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const js = readFileSync(new URL('../public/news.js', import.meta.url), 'utf8');
  assert.match(html, /class="nav-link[^"]*" href="#news">Beauty News</);
  assert.match(html, /id="news-home"/);
  assert.match(html, /footer-earn"><a href="#news">Beauty News/);
  assert.match(html, /<script src="news.js" defer><\/script>/);
  assert.match(js, /<option value="">All brands<\/option>/);
  assert.match(js, /name="interest" value="\$\{esc\(k\)\}">/, 'interests are never pre-ticked');
  assert.match(js, /<input type="checkbox" name="consent">/);
  assert.match(js, /Email digests start soon; we&rsquo;ll only email you if you tick consent/);
  assert.match(js, /Remove my email/);
  assert.doesNotMatch(js + html, /\bethnic\b/i);
});
