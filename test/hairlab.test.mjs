// Hair Colour Lab: the engine (src/hairlab/colour_lab.js) and its HTTP routes.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import {
  buildColourPlan, colourLabOptions, levelForHex, colourFamily, hexToLab, STAGES, TARGETS, TEXTURES, POROSITIES, HISTORIES, START_LEVELS, TECHNIQUE_OPTIONS,
} from '../src/hairlab/colour_lab.js';
import { BLEACHING_GUIDE } from '../src/hair_colouring_guide.js';

const base = { community: 'latina', texture: 'type_2b', porosity: 'medium', history: 'virgin', startLevel: 2, target: 'honey_blonde', technique: '' };

test('colour arithmetic: lightness levels and pigment stages', () => {
  assert.equal(levelForHex('#0a0a0a'), 1);
  assert.ok(levelForHex('#e8e0d0') >= 9);
  assert.ok(Math.abs(hexToLab('#ffffff').L - 100) < 0.01);
  assert.equal(STAGES.length, 6);
  assert.deepEqual(STAGES.map(s => s.level), [...STAGES.map(s => s.level)].sort((a, b) => a - b), 'stages get lighter');
  assert.equal(colourFamily('#6b1a2e').family, 'red');
  assert.equal(colourFamily('#0047ab').family, 'vivid');
  assert.equal(colourFamily('#e8e0d0').stage, 5);
  assert.equal(colourFamily('#0a0a0a').stage, null);
  for (const t of TARGETS) assert.ok(colourFamily(t.hexCode), t.id);
});

// What the person sees: everything except the echo of their own choices.
const shown = p => { const { choices, ...rest } = p; return JSON.stringify(rest); };

test('every option changes what the plan shows', () => {
  const ref = shown(buildColourPlan(base));
  const alt = { community: 'arab', texture: 'type_4c', porosity: 'high', history: 'relaxed', startLevel: 5, target: 'cobalt_blue', technique: 'classic_ombre' };
  for (const [k, v] of Object.entries(alt)) {
    const p = buildColourPlan({ ...base, [k]: v });
    assert.notEqual(shown(p), ref, `${k}=${v} changes the plan`);
  }
  for (const k of ['texture', 'porosity', 'history', 'startLevel', 'target']) {
    const list = { texture: TEXTURES.map(t => t.id), porosity: POROSITIES, history: HISTORIES.map(h => h.id), startLevel: START_LEVELS.map(s => s.level), target: TARGETS.map(t => t.id) }[k];
    const seen = new Set(list.map(v => shown(buildColourPlan({ ...base, [k]: v }))));
    assert.equal(seen.size, list.length, `each ${k} gives its own plan`);
  }
});

test('lift and sessions follow the guide: darker start or lighter goal means more lift', () => {
  const ceiling = Math.max(...BLEACHING_GUIDE.bleach_on_type_4_reality_check.approach.find(a => /per session/.test(a)).match(/\d+/g).map(Number));
  let prev = -1;
  for (const target of ['espresso', 'copper_red', 'honey_blonde', 'platinum_statement']) {
    const p = buildColourPlan({ ...base, target });
    assert.ok(p.lift >= prev, `${target} needs at least as much lift as the darker goal`);
    assert.equal(p.sessions, p.lift === 0 ? 0 : Math.ceil(p.lift / ceiling));
    assert.equal(p.path.length, p.sessions);
    if (p.path.length) assert.equal(p.path.at(-1).level, p.target.level);
    prev = p.lift;
  }
  const fromBlack = buildColourPlan({ ...base, startLevel: 1 }); const fromLight = buildColourPlan({ ...base, startLevel: 6 });
  assert.ok(fromBlack.lift > fromLight.lift);
  const darker = buildColourPlan({ ...base, startLevel: 5, target: 'jet_black' });
  assert.equal(darker.lift, 0); assert.equal(darker.developer, null);
  assert.ok(!darker.steps.some(s => /lighten/i.test(s)));
});

test('type 4 hair: 20 Vol, face-framing first, never 40 Vol, and the processing warning', () => {
  const p = buildColourPlan({ ...base, texture: 'type_4c', startLevel: 1, target: 'platinum_statement' });
  assert.match(p.developer.volume, /^20 Vol/);
  assert.equal(p.technique.id, 'face_framing_highlights');
  assert.ok(p.warnings.some(w => w.why === 'Type 4 hair'));
  assert.ok(p.tryOnWig);
  for (const t of TEXTURES) for (const target of ['platinum_statement', 'honey_blonde', 'copper_red']) {
    const q = buildColourPlan({ ...base, texture: t.id, startLevel: 1, target });
    if (q.developer) assert.doesNotMatch(q.developer.volume, /^40/, `${t.id}/${target}`);
  }
});

test('plant dyes take bleach out of the plan', () => {
  const h = buildColourPlan({ ...base, target: 'henna_red', community: 'south_asian' });
  assert.equal(h.technique.id, 'henna_colour'); assert.equal(h.plantDye, true);
  assert.equal(h.lift, 0); assert.equal(h.developer, null);
  assert.ok(h.steps.some(s => /henna/i.test(s)));
  const forced = buildColourPlan({ ...base, target: 'platinum_statement', technique: 'henna_colour' });
  assert.equal(forced.lift, 0); assert.ok(forced.chemicalLift > 0);
  assert.ok(forced.steps.some(s => /cannot lighten/.test(s)));
});

test('history drives the warnings', () => {
  const relaxed = buildColourPlan({ ...base, history: 'relaxed' });
  assert.ok(relaxed.warnings.some(w => w.why === 'Relaxed hair' && /relax/i.test(w.text)));
  assert.ok(relaxed.tryOnWig);
  const henna = buildColourPlan({ ...base, history: 'henna' });
  assert.ok(henna.warnings.some(w => w.why === 'Henna in the hair' && /henna/i.test(w.text)));
  const lightened = buildColourPlan({ ...base, history: 'lightened' });
  assert.ok(lightened.warnings.some(w => /NEVER apply bleach on top/.test(w.text)));
  for (const p of [relaxed, henna, lightened]) for (const w of p.warnings) assert.ok(w.text.length > 20 && !w.text.includes('[object'), w.why);
});

test('technique choice and texture fit', () => {
  const p = buildColourPlan({ ...base, texture: 'type_4b', technique: 'classic_balayage' });
  assert.equal(p.technique.id, 'classic_balayage'); assert.equal(p.technique.fitsTexture, false); assert.match(p.technique.fitNote, /4B/);
  const patterns = new Set(TECHNIQUE_OPTIONS.map(t => buildColourPlan({ ...base, technique: t.id }).technique.pattern));
  assert.ok(patterns.size >= 5, 'techniques draw different placements');
  const rec = buildColourPlan({ ...base, texture: 'type_3c' });
  assert.equal(rec.technique.id, 'melanin_balayage'); assert.ok(rec.technique.why);
});

test('junk input falls back to safe defaults, and options are complete', () => {
  const p = buildColourPlan({ texture: '<x>', porosity: 9, history: null, startLevel: 'abc', target: 'natural_4c', technique: 'nope', community: '???' });
  assert.equal(p.choices.porosity, 'medium'); assert.equal(p.choices.history, 'virgin'); assert.equal(p.choices.startLevel, 2);
  assert.equal(p.target.id, 'honey_blonde'); assert.notEqual(p.technique.id, 'nope');
  const o = colourLabOptions();
  assert.equal(o.communities.length, 9);
  assert.equal(o.textures.length, 12);
  assert.ok(Object.values(o.targets).flat().every(t => /^#[0-9a-f]{6}$/i.test(t.hex)));
});

const PORT = 3700 + Math.floor(Math.random() * 90);
let server;
before(async () => {
  server = spawn(process.execPath, ['src/server.js'], { env: { ...process.env, PORT: String(PORT), QLOO_API_KEY: '' }, stdio: 'pipe' });
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PORT}/api/health`)).ok) return; } catch { /* booting */ }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('server did not start');
});
after(() => server?.kill());

test('hair lab routes over HTTP', async () => {
  const B = `http://127.0.0.1:${PORT}`;
  const h = { 'x-forwarded-for': '10.6.6.6' };
  const o = await (await fetch(`${B}/api/hairlab/options`, { headers: h })).json();
  assert.equal(o.textures.length, 12);
  const r = await fetch(`${B}/api/hairlab/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: JSON.stringify({ ...base, texture: 'type_4c', target: 'burgundy' }) });
  assert.equal(r.status, 200);
  const p = await r.json();
  assert.equal(p.choices.texture, 'type_4c'); assert.equal(p.target.id, 'burgundy');
  const bad = await fetch(`${B}/api/hairlab/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: '{oops' });
  assert.equal(bad.status, 400);
  const html = await (await fetch(`${B}/`, { headers: h })).text();
  assert.ok(html.includes('data-view="hairlab"') && html.includes('src="hairlab.js"'));
  const lib = await (await fetch(`${B}/api/library`, { headers: h })).json();
  assert.equal(lib.shelves.find(s => s.id === 'hair').guides.length, 12);
});
