/** 60-Second Transformation (Phase 3): the five-step chain, its rules, and the real endpoints it calls.
 * Run: node --test test/sixty.test.mjs */
import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { SIXTY_STEPS, parseFavourites, missingForStart, stepAfter, progressLabel, tasteRequest, topLooks, tasteSource, transformRequest } from '../public/sixty-core.js';

const PORT = 4300 + Math.floor(Math.random() * 90);
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
const post = async (p, b) => (await fetch(`${BASE}${p}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })).json();

test('five steps in order, with a progress label and a Back that stops at the first step', () => {
  assert.deepEqual(SIXTY_STEPS.map(s => s.id), ['you', 'taste', 'shade', 'plan', 'tryon']);
  assert.equal(progressLabel(0), 'Step 1 of 5 · You');
  assert.equal(progressLabel(4), 'Step 5 of 5 · Try-on');
  assert.equal(stepAfter(0, 'back'), 0);
  assert.equal(stepAfter(2, 'back'), 1);
  assert.equal(stepAfter(4, 'next'), 4);
});

test('favourites are trimmed, de-duplicated and capped at five', () => {
  assert.deepEqual(parseFavourites(' Burna Boy , tems; Tems\nRihanna'), ['Burna Boy', 'tems', 'Rihanna']);
  assert.equal(parseFavourites('a,b,c,d,e,f,g').length, 5);
  assert.deepEqual(parseFavourites(''), []);
});

test('step 1 asks for favourites, tone and undertone before running', () => {
  assert.match(missingForStart({}), /artist/);
  assert.match(missingForStart({ favourites: ['Tems'] }), /tone/);
  assert.match(missingForStart({ favourites: ['Tems'], depth: 41 }), /undertone/);
  assert.equal(missingForStart({ favourites: ['Tems'], depth: 41, undertone: 'warm' }), null);
});

test('taste source never claims Qloo when the run did not reach it', () => {
  assert.equal(tasteSource({ meta: { qloo_powered: true, entities_resolved: 1, tags_from_qloo: 14 } }).live, true);
  assert.equal(tasteSource({ meta: { qloo_powered: false, qloo_unreachable: true } }).live, false);
  assert.doesNotMatch(tasteSource({ meta: {} }).text, /Live Qloo/);
});

test('the whole chain runs on the real endpoints: taste → named shade → staged plan → try-on colours', async () => {
  const you = { favourites: ['Burna Boy', 'Tems'], depth: 41, undertone: 'warm' };
  const run = await post('/api/agent/run', tasteRequest(you));
  const looks = topLooks(run);
  assert.ok(looks.length >= 1 && looks.length <= 3, 'one to three looks');
  assert.ok(looks.every(l => l.id && l.name));
  const { shades } = await post('/api/shades/find', { depthTarget: you.depth, undertone: you.undertone, topN: 3 });
  assert.equal(shades.length, 3);
  assert.ok(shades[0].name && /^#[0-9A-F]{6}$/i.test(shades[0].hex) && shades[0].code);
  const plan = await post('/api/transform', transformRequest({ shade: shades[0], undertone: you.undertone, lookId: looks[0].id, favourites: you.favourites }));
  assert.equal(plan.target.id, looks[0].id);
  assert.equal(plan.face.shade.code, shades[0].code, 'the plan uses the shade picked in step 3');
  assert.ok(plan.stages.length >= 2 && plan.stages.every(s => s.steps.length));
  const pal = await (await fetch(`${BASE}/api/photo/palette?look=${looks[0].id}&skin=6b4a35`)).json();
  assert.ok(pal && typeof pal === 'object' && !pal.error);
});

test('the view is wired: hero entry, menu item, section, script, and a try-on hand-off by look id', () => {
  const html = fs.readFileSync('public/index.html', 'utf8');
  assert.match(html, /id="heroSixtyBtn"[^>]*data-open-sixty/);
  assert.match(html, /data-view="sixty"/);
  assert.match(html, /<section id="view-sixty" class="view hidden">[\s\S]*id="sxRoot"/);
  assert.match(html, /<script type="module" src="sixty.js"><\/script>/);
  const ui = fs.readFileSync('public/sixty.js', 'utf8');
  assert.match(ui, /nearestModelFace/);
  assert.match(ui, /MODEL_FACE_NOTE/);
  assert.match(ui, /data-sx="back"/);
  assert.match(fs.readFileSync('public/app.js', 'utf8'), /addEventListener\('mirrr:tryon-look'/);
});
