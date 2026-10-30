/** Ritual Library: routes over a real server process, content audit, and a contract test for
 * every function exported by every wired guide. Run: node --test test/library.test.mjs */
import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import { spawn } from 'node:child_process';
import { GUIDES } from '../src/library/catalog.js';
import { LIBRARY_COMMUNITIES } from '../src/library/communities.js';
import { readGuide, searchLibrary, listLibrary, textWeight } from '../src/library/index.js';

const PORT = 3900 + Math.floor(Math.random() * 90);
const BASE = `http://127.0.0.1:${PORT}`;
let server;

before(async () => {
  server = spawn(process.execPath, ['src/server.js'], { env: { ...process.env, PORT: String(PORT), QLOO_API_KEY: '' }, stdio: 'pipe' });
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`${BASE}/api/health`)).ok) return; } catch { /* booting */ }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('server did not start');
});
after(() => server?.kill());

let ipSeq = 0;
const get = (path) => fetch(BASE + path, { headers: { 'x-forwarded-for': `10.9.${Math.floor(ipSeq / 25)}.${ipSeq++ % 25}` } });

test('GET /api/library lists every wired guide, ranked for the community asked for', async () => {
  const res = await get('/api/library?community=west-african');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.community.id, 'west_african');
  assert.equal(body.communities.length, 9);
  const ids = body.shelves.flatMap(s => s.guides.map(g => g.id));
  assert.deepEqual(new Set(ids), new Set(GUIDES.map(g => g.id)));
  assert.ok(body.shelves.flatMap(s => s.guides).some(g => g.forYou > 0));
});

test('every guide opens for every community over HTTP with readable sections', async () => {
  for (const g of GUIDES) {
    for (const c of [...LIBRARY_COMMUNITIES.map(x => x.id), '']) {
      const res = await get(`/api/library/guide/${g.id}${c ? `?community=${c}` : ''}`);
      assert.equal(res.status, 200, `${g.id} ${c}`);
      const view = await res.json();
      assert.ok(view.sections.length > 0, `${g.id} ${c} has no sections`);
      for (const s of view.sections) assert.ok(textWeight(s.body) > 0, `${g.id} ${c} ${s.title} is empty`);
    }
  }
});

test('changing the community changes the guide (community sections come first)', () => {
  let differing = 0;
  for (const g of GUIDES) {
    const a = readGuide(g.id, 'arab'); const b = readGuide(g.id, 'west_african');
    if (a.coversCommunity) {
      assert.equal(a.sections[0].scope, 'community', `${g.id} should lead with the arab section`);
      if (JSON.stringify(a.sections[0].body) !== JSON.stringify(b.sections[0].body)) differing++;
    }
  }
  assert.ok(differing >= GUIDES.length / 2, `only ${differing} guides changed with community`);
});

test('a community outside the 9 is mapped honestly, not silently', () => {
  const v = readGuide(GUIDES[0].id, 'southeast_asian');
  assert.equal(v.community.id, 'east_asian');
  assert.equal(v.community.substituted, true);
  const none = readGuide(GUIDES[0].id, 'nowhere');
  assert.equal(none.community, null);
});

test('search finds passages, filters by community, and survives junk input', async () => {
  const r = await (await get('/api/library/search?q=shea')).json();
  assert.ok(r.total > 0 && r.hits[0].snippet.toLowerCase().includes('shea'));
  const wa = searchLibrary('shea', { community: 'west_african' });
  assert.ok(wa.hits.every(h => h.community === null || h.community === 'west_african'));
  assert.equal(searchLibrary('', {}).hits.length, 0);
  const all = searchLibrary('hammam', { limit: 500 }).hits.map(h => h.guide + '|' + h.snippet);
  assert.equal(new Set(all).size, all.length, 'the same passage is listed twice');
  const junk = await get('/api/library/search?q=' + encodeURIComponent('<script>'.repeat(30)));
  assert.equal(junk.status, 200);
});

test('unknown guide is a 404 and existing routes still answer', async () => {
  assert.equal((await get('/api/library/guide/not_a_guide')).status, 404);
  for (const p of ['/api/health', '/api/looks', '/api/communities', '/api/shades/spectrum', '/api/wigs/catalogue']) {
    assert.equal((await get(p)).status, 200, p);
  }
  const html = await (await get('/')).text();
  assert.ok(html.includes('id="view-library"') && html.includes('src="library.js"'));
  assert.equal((await get('/library.js')).status, 200);
});

// Patterns for unverifiable statistics, citations and stereotyping that must not reach users.
const BANNED = [
  /\d\s?%\s+of\b/i, /\bet al\b/i, /\b(stud(y|ies)|surveys?|research|data|evidence)\s+(show|shows|showed|found|suggests?|proves?)\b/i,
  /\baccording to\b/i, /\b(million|billion)\b/i, /\b\d+\s+(in|out of)\s+\d+\b/i, /\bprevalence\b/i,
  /skin chemistry/i, /\b(exotic|fiery|sassy)\b/i, /[$£€]\s?\d/,
];
function* strings(v) { if (typeof v === 'string') yield v; else if (v && typeof v === 'object') for (const x of Object.values(v)) yield* strings(x); }

test('no wired guide carries invented statistics, citations or stereotyping phrases', () => {
  const bad = [];
  for (const g of GUIDES) for (const [name, v] of Object.entries(g.mod)) {
    if (/STATS?$/.test(name)) bad.push(`${g.id}.${name} export`);
    if (typeof v === 'function') continue;
    for (const s of strings(v)) { const hit = BANNED.find(r => r.test(s)); if (hit) bad.push(`${g.id}.${name}: ${s.slice(0, 90)}`); }
  }
  assert.deepEqual(bad, []);
});

// Every exported lookup function of every wired guide must return something real for at
// least one sensible argument (community ids in each spelling, keys and short codes of its own
// data, months).
function candidates(mod) {
  const comm = LIBRARY_COMMUNITIES.flatMap(c => [c.id, c.id.replace(/_/g, '-'), c.id.replace(/_([a-z])/g, (_, x) => x.toUpperCase())]);
  const keys = new Set();
  const collect = (v, depth) => {
    if (!v || typeof v !== 'object' || depth > 3 || keys.size > 600) return;
    for (const [k, inner] of Object.entries(v)) {
      if (!Array.isArray(v)) keys.add(k);
      if (inner && typeof inner === 'object') {
        for (const f of ['id', 'category', 'name', 'era', 'tag']) if (typeof inner[f] === 'string') keys.add(inner[f]);
        if (Array.isArray(inner.tags)) inner.tags.forEach(t => keys.add(t));
        // short codes the guide itself uses as values, e.g. hair types '4C' in hairTexturesBestFor
        if (Array.isArray(inner)) inner.forEach(x => { if (typeof x === 'string' && x.length <= 12) keys.add(x); });
      }
      collect(inner, depth + 1);
    }
  };
  for (const v of Object.values(mod)) collect(v, 0);
  return [undefined, ...comm, ...keys, 'january', 'March', 1, 3, 6, 'IV', 'V', 'oily', 'dry', 'shea', 'beginner', 'bridal'];
}
const real = r => r != null && r !== false && !(Array.isArray(r) && r.length === 0) && !(typeof r === 'object' && !Array.isArray(r) && Object.keys(r).length === 0) && r !== '';

test('every exported function of every wired guide returns real content', () => {
  const dead = [];
  for (const g of GUIDES) for (const [name, fn] of Object.entries(g.mod)) {
    if (typeof fn !== 'function') continue;
    let ok = false;
    // keys of a lookup map inside the function itself, quoted or bare ({ eczema: ECZEMA_GUIDE, 'west-african': ... })
    const ownKeys = [...fn.toString().matchAll(/(?:['"]([A-Za-z][\w -]{1,30})['"]|\b([a-z][\w]{1,30}))\s*:/g)].map(m => m[1] ?? m[2]);
    for (const a of [...ownKeys, ...candidates(g.mod)]) {
      try { if (real(fn(a, a))) { ok = true; break; } } catch { /* try next argument */ }
    }
    if (!ok) dead.push(`${g.id}.${name}`);
  }
  assert.deepEqual(dead, []);
});

test('listLibrary without a community still lists every shelf', () => {
  const l = listLibrary(null);
  assert.equal(l.community, null);
  assert.equal(l.shelves.flatMap(s => s.guides).length, GUIDES.length);
});
