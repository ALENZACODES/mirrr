/** Planner and Transform: the finishing card is "Hair & finishing", and a new user who picked no
 * finishing options gets no wig anywhere. Run: node --test test/hair_finishing.test.mjs */
import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const PORT = 4400 + Math.floor(Math.random() * 90);
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

test('the planner card and intro say Hair & finishing, not Wig', () => {
  const app = fs.readFileSync('public/app.js', 'utf8');
  assert.match(app, /planCard\('wig', 'Hair & finishing'/);
  assert.doesNotMatch(app, /Finishing — your choice/);
  const html = fs.readFileSync('public/index.html', 'utf8');
  assert.match(html, /look, shade, hair &amp; finishing, ritual and a timeline/);
});

test('nothing picked: the planner returns no wig and no wig finishing step', async () => {
  const plan = await post('/api/plan', { occasion: 'my cousin wedding in Lagos next month' });
  assert.equal(plan.wig ?? null, null);
  assert.deepEqual(plan.finishing.picked, []);
  assert.ok(plan.finishing.steps.every(s => s.option !== 'wigs' && !/wig:/i.test(s.title)));
});

test('nothing picked: the transformation has no wig row in any stage', async () => {
  const t = await post('/api/transform', { face: { shadeId: 'M24', undertone: 'warm' }, targetLookId: 'afrobeats_concert' });
  for (const st of t.stages) for (const step of st.steps) {
    assert.equal(step.wig ?? null, null, `${st.id}: ${step.title}`);
    assert.doesNotMatch(step.title, /wig/i);
  }
});
