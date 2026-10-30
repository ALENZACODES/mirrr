/** Look-card to plan mapping (audit 2026-10-30, Fix 4 follow-up): Style Match's BECOME THIS LOOK on
 * Mehndi Bride built a Bollywood Bridal plan, because signature looks were mapped by a name hash.
 * Every Style Match look now maps to one named library look, in its own community.
 * Run: node --test test/look_mapping.test.mjs */
import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { LOOKS } from '../src/look_engine.js';

const PORT = 4200 + Math.floor(Math.random() * 90);
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

const app = fs.readFileSync('public/app.js', 'utf8');
const block = app.slice(app.indexOf('const STYLE_MATCH_PLAN_LOOK = {'), app.indexOf('};', app.indexOf('const STYLE_MATCH_PLAN_LOOK = {')));
const MAP = Object.fromEntries([...block.matchAll(/(\w+): '(\w+)'/g)].map(m => [m[1], m[2]]));
const libIds = new Set(LOOKS.map(l => l.id));

test('every Style Match look has a named plan look that exists', async () => {
  const { looks } = await (await fetch(`${BASE}/api/style-match/looks`)).json();
  assert.equal(looks.length, 8);
  for (const l of looks) {
    assert.ok(MAP[l.id], `${l.id} has no plan look`);
    assert.ok(libIds.has(MAP[l.id]), `${l.id} -> ${MAP[l.id]} is not a library look`);
  }
});

test('Mehndi Bride builds Mehndi Bridal, not Bollywood Bridal; Persian Queen builds Persian Editorial', () => {
  assert.equal(MAP.mehndi_bride, 'mehndi_bridal');
  assert.equal(MAP.persian_queen, 'persian_editorial');
  assert.equal(MAP.k_beauty_seoul, 'k_beauty_glass');
});

test('signature looks are never mapped by a hash or a random pick', () => {
  const fn = app.slice(app.indexOf('async function becomeThisLook'), app.indexOf('// Capture phase so the card'));
  assert.doesNotMatch(fn, /lookForArtist|Math\.random/);
  assert.match(fn, /STYLE_MATCH_PLAN_LOOK\[lookId\]/);
});

test('a transform for each mapped look returns a plan for exactly that look', async () => {
  for (const planId of new Set(Object.values(MAP))) {
    const r = await fetch(`${BASE}/api/transform`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ face: { shadeId: 'MD30', depth: 'medium-deep', undertone: 'warm' }, targetLookId: planId }) });
    assert.equal(r.status, 200, planId);
    const plan = await r.json();
    assert.equal(plan.look?.id ?? plan.target?.id ?? plan.targetLookId, planId, JSON.stringify(plan).slice(0, 200));
  }
});

test('Taste, Library, Look Book and Transform picker cards pass their own look id', () => {
  const ids = [...app.matchAll(/data-become="\$\{(?:esc\()?(\w+)\.id\)?\}"/g)].map(m => m[1]);
  assert.ok(ids.length >= 4, String(ids.length));
  assert.doesNotMatch(app, /data-become="\$\{[^}]*(name|community)[^}]*\}"/);
});

test('when a signature look builds on a differently named look, the plan says so', () => {
  assert.match(app, /builds on our \$\{planName\} look, the closest step-by-step plan/);
  assert.match(app, /tf-mapped/);
});
