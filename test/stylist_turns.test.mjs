/** Stylist typed turns (audit 2026-10-30, Fix 6): refinements compound over the real route, the
 * occasion carries, and an unchanged ranking is said plainly. Run: node --test test/stylist_turns.test.mjs */
import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

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

const turn = async (message, aesthetic, ids) => (await fetch(`${BASE}/api/agent/refine`, {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.7.0.1' },
  body: JSON.stringify({ message, currentAesthetic: aesthetic, previousLookIds: ids, tasteChips: [] }),
})).json();

test('four typed turns compound: bolder, bolder, wedding, then nothing', async () => {
  let a = { intensity: 0.5, warmth: 0.6, boldness: 0.5, texture: 0.5 };
  let ids = [];
  const t1 = await turn('make it bolder', a, ids); a = t1.aesthetic; ids = t1.looks.map(r => r.look.id);
  const t2 = await turn('make it bolder', a, ids); a = t2.aesthetic; ids = t2.looks.map(r => r.look.id);
  assert.equal(t1.aesthetic.intensity, 0.65); assert.equal(t2.aesthetic.intensity, 0.8);
  assert.match(t2.reply, /Intensity 65 → 80/);
  const t3 = await turn('what about for a wedding?', a, ids); a = t3.aesthetic; ids = t3.looks.map(r => r.look.id);
  assert.equal(t3.aesthetic.intensity, 0.8); // earlier turns kept
  assert.ok(/bridal|wedding|mehndi|umembeso/i.test(t3.looks[0].look.id + t3.looks[0].look.name));
  const t4 = await turn('hmm ok', a, ids);
  assert.match(t4.reply, /did not change/); assert.doesNotMatch(t4.reply, /new recommendations/);
  assert.match(t4.reply, /Still lifting wedding looks/);
});

test('the Stylist page sends the looks on screen with each typed turn', () => {
  const app = fs.readFileSync('public/app.js', 'utf8');
  assert.match(app, /previousLookIds: state\.stylistPageLookIds \?\? state\.currentLookIds \?\? \[\]/);
  assert.match(app, /state\.stylistPageLookIds = result\.looks\.map/);
});
