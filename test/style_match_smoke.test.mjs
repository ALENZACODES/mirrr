/** Style Match smoke check (audit 2026-10-30, Fix 4). The view loaded zero looks because another
 * studio rendered a select with the same id as a Style Match filter. This checks that element ids
 * are unique across the app, that the view reads its filters from inside itself, and that the
 * unfiltered request returns all 8 signature looks. Run: node --test test/style_match_smoke.test.mjs */
import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const PORT = 4100 + Math.floor(Math.random() * 90);
const BASE = `http://127.0.0.1:${PORT}`;
let server;
before(async () => {
  server = spawn(process.execPath, ['src/server.js'], { env: { ...process.env, PORT: String(PORT), QLOO_API_KEY: '' }, stdio: 'pipe' });
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(`${BASE}/api/health`)).ok) return; } catch { /* booting */ }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('server did not start');
});
after(() => server?.kill());

test('no element id is declared twice across index.html and the view scripts', () => {
  const seen = new Map();
  for (const f of fs.readdirSync('public').filter(n => /\.(js|html)$/.test(n))) {
    const s = fs.readFileSync(`public/${f}`, 'utf8');
    const ids = new Set([...s.matchAll(/id="([A-Za-z][\w-]*)"/g), ...s.matchAll(/select\('([A-Za-z]\w*)'/g)].map(m => m[1]));
    for (const id of ids) {
      assert.ok(!seen.has(id), `id "${id}" is declared in both ${seen.get(id)} and ${f}`);
      seen.set(id, f);
    }
  }
});

test('Style Match reads its filters from inside its own view', () => {
  const app = fs.readFileSync('public/app.js', 'utf8');
  const fn = app.slice(app.indexOf('async function loadStyleMatchLooks'), app.indexOf('function flattenStyleProduct'));
  assert.match(fn, /getElementById\('view-style-match'\)/);
  assert.doesNotMatch(fn, /document\.getElementById\('sm(Fitzpatrick|Community|LookCommunity|Vibe)'\)/);
});

test('opening Style Match with no filters returns all 8 looks, each with a photo', async () => {
  const res = await fetch(`${BASE}/api/style-match/looks`);
  assert.equal(res.status, 200);
  const { looks } = await res.json();
  assert.equal(looks.length, 8);
  for (const l of looks) assert.ok(fs.existsSync(`public${l.image}`), `${l.id} photo ${l.image}`);
  const one = await (await fetch(`${BASE}/api/style-match/looks?community=arab`)).json();
  assert.equal(one.looks.length, 2);
});
