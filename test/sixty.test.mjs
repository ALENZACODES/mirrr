/** 60-Second Transformation (Phase 3): the six-step chain, its rules, and the real endpoints it calls.
 * Run: node --test test/sixty.test.mjs */
import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { SIXTY_STEPS, SIXTY_LOOKS, cleanPick, stepAfter, progressLabel, secondsLeft, tasteRequest, topLooks, tasteOutcome, shadeRequest, transformRequest, shareText } from '../public/sixty-core.js';
import { LOOKS } from '../src/look_engine.js';

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

test('six steps in order; progress reads "Step n of 6 · ~Xs left" and adds up to 60 seconds', () => {
  assert.deepEqual(SIXTY_STEPS.map(s => s.id), ['community', 'pick', 'taste', 'shade', 'plan', 'tryon']);
  assert.equal(secondsLeft(0), 60);
  assert.equal(progressLabel(0), 'Step 1 of 6 · ~60s left');
  assert.match(progressLabel(5), /^Step 6 of 6 · ~\d+s left$/);
  assert.ok(secondsLeft(3) < secondsLeft(2));
  assert.equal(stepAfter(0, 'back'), 0);
  assert.equal(stepAfter(3, 'back'), 2);
  assert.equal(stepAfter(5, 'next'), 5);
});

test('one pick: a single trimmed song or artist goes to the taste run with the community', () => {
  assert.equal(cleanPick('  Essence  '), 'Essence');
  assert.equal(cleanPick(''), '');
  assert.deepEqual(tasteRequest({ pick: 'Essence', communityId: 'west_african' }), { inputs: ['Essence'], communityId: 'west_african' });
});

test('every tappable look is a real library look with a portrait on disk', () => {
  const ids = new Set(LOOKS.map(l => l.id));
  for (const l of SIXTY_LOOKS) {
    assert.ok(ids.has(l.id), l.id);
    assert.equal(LOOKS.find(x => x.id === l.id).name, l.name);
    assert.ok(fs.existsSync(`public${l.img}`), l.img);
  }
});

test('a failed lookup offers manual pickers and never claims Qloo', () => {
  const live = tasteOutcome({ meta: { qloo_powered: true, tags_from_qloo: 12, provenance: { entities: [{ name: 'Wizkid' }] } }, looks: [{ look: { id: 'a', name: 'A' } }] }, 'Essence');
  assert.equal(live.failed, false); assert.equal(live.live, true); assert.match(live.text, /Live Qloo/);
  const none = tasteOutcome({ meta: { qloo_powered: false }, looks: [{ look: { id: 'a', name: 'A' } }] }, 'zzz');
  assert.equal(none.failed, true); assert.doesNotMatch(none.text, /Live Qloo/);
  const down = tasteOutcome(null, 'Essence');
  assert.equal(down.failed, true); assert.equal(down.looks.length, 0);
  const html = fs.readFileSync('public/sixty.js', 'utf8');
  assert.match(html, /o\.failed \? `<div class="sx-manual">/);
});

test('nothing is pre-selected: community, tone, undertone and look all start empty', () => {
  const ui = fs.readFileSync('public/sixty.js', 'utf8');
  assert.match(ui, /communityId: null, pick: '', tappedLook: null/);
  assert.match(ui, /depth: null, undertone: null, shades: \[\]/);
  assert.doesNotMatch(ui, /localStorage\.getItem/);
});

test('the whole chain runs on the real endpoints: taste → named shade → three-stage plan → try-on colours', async () => {
  const you = { communityId: 'west_african', pick: 'Burna Boy' };
  const run = await post('/api/agent/run', tasteRequest(you));
  const looks = topLooks(run);
  assert.ok(looks.length >= 1 && looks.length <= 3);
  const { shades } = await post('/api/shades/find', shadeRequest({ communityId: you.communityId, depth: 41, undertone: 'warm' }));
  assert.equal(shades.length, 3);
  assert.ok(shades[0].name && /^#[0-9A-F]{6}$/i.test(shades[0].hex) && shades[0].code);
  const plan = await post('/api/transform', transformRequest({ shade: shades[0], undertone: 'warm', communityId: you.communityId, lookId: looks[0].id, pick: you.pick }));
  assert.equal(plan.target.id, looks[0].id);
  assert.equal(plan.face.shade.code, shades[0].code, 'the plan uses the shade picked in the shade step');
  assert.equal(plan.stages.length, 3);
  assert.ok(plan.stages.every(s => s.steps.length));
  const pal = await (await fetch(`${BASE}/api/photo/palette?look=${looks[0].id}&skin=6b4a35`)).json();
  assert.ok(pal && typeof pal === 'object' && !pal.error);
  assert.match(shareText({ look: plan.target.name, shade: shades[0], community: 'West African' }), new RegExp(shades[0].code));
});

test('the view is wired: homepage card, menu item, section, deep link, save, share, try-on hand-off', () => {
  const html = fs.readFileSync('public/index.html', 'utf8');
  assert.match(html, /class="sixty-card home-link" id="sixtyCard" role="button" tabindex="0" data-open-sixty/);
  assert.match(html, /data-view="sixty"/);
  assert.match(html, /<section id="view-sixty" class="view hidden">[\s\S]*id="sxRoot"/);
  assert.match(html, /<script type="module" src="sixty.js"><\/script>/);
  const ui = fs.readFileSync('public/sixty.js', 'utf8');
  for (const s of [/nearestModelFace/, /MODEL_FACE_NOTE/, /data-sx="back"/, /data-sx="save"/, /data-sx="share"/, /location\.hash === '#sixty'/, />Before</, /After: /]) assert.match(ui, s);
  assert.match(fs.readFileSync('public/app.js', 'utf8'), /addEventListener\('mirrr:tryon-look'/);
});
