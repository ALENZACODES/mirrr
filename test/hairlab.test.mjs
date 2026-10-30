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
  assert.equal(lib.shelves.find(s => s.id === 'growth').guides.length, 9);
  const jo = await (await fetch(`${B}/api/hairlab/journey-options`, { headers: h })).json();
  assert.equal(jo.journeys.length, 5); assert.equal(jo.cmPerMonth, 1.27); assert.equal(jo.minBreakWeeks, 2);
  const jr = await fetch(`${B}/api/hairlab/journey`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: JSON.stringify({ journey: 'transition', relaxedCm: 15, months: 6 }) });
  assert.equal(jr.status, 200);
  assert.equal((await jr.json()).remainingMonths, 6);
  assert.equal((await fetch(`${B}/api/hairlab/journey`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: '{oops' })).status, 400);
  assert.ok(html.includes('data-hl-tab="journeys"') && html.includes('src="journeys.js"'));
});

// The Skin Clinic shares this file's server so the suite starts one process, not two.
test('skin clinic routes over HTTP', async () => {
  const B = `http://127.0.0.1:${PORT}`;
  const h = { 'x-forwarded-for': '10.6.6.7' };
  const o = await (await fetch(`${B}/api/skin/options`, { headers: h })).json();
  assert.equal(o.concerns.length, 7); assert.equal(o.tones.length, 10);
  const r = await fetch(`${B}/api/skin/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: JSON.stringify({ concern: 'melasma', fitzpatrick: 'VI', community: 'latina' }) });

test('nails and scent studio routes over HTTP', async () => {
  const B = `http://127.0.0.1:${PORT}`;
  const h = { 'x-forwarded-for': '10.6.6.10' };
  const o = await (await fetch(`${B}/api/nails/options`, { headers: h })).json();
  assert.equal(o.shapes.length, 6); assert.equal(o.tones.length, 10);
  const r = await fetch(`${B}/api/nails/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: JSON.stringify({ shape: 'stiletto', wear: 'natural', scentOccasion: 'religious', community: 'arab' }) });
  assert.equal(r.status, 200);
  const p = await r.json();
  assert.equal(p.choices.shape, 'stiletto'); assert.equal(p.community.id, 'arab'); assert.ok(p.nails.wear.lengthWarning); assert.ok(p.scent.concentration.alcoholFree);
  assert.equal((await fetch(`${B}/api/nails/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: '{oops' })).status, 400);
  const html = await (await fetch(`${B}/`, { headers: h })).text();
  assert.ok(html.includes('data-view="nails"') && html.includes('src="nails.js"'));
  const lib = await (await fetch(`${B}/api/library`, { headers: h })).json();
  assert.equal(lib.shelves.find(s => s.id === 'nails').guides.length, 14);
});

test('ageing studio routes over HTTP', async () => {
  const B = `http://127.0.0.1:${PORT}`;
  const h = { 'x-forwarded-for': '10.6.6.11' };
  const o = await (await fetch(`${B}/api/ageing/options`, { headers: h })).json();
  assert.equal(o.decades.length, 5); assert.equal(o.tones.length, 10);
  const r = await fetch(`${B}/api/ageing/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: JSON.stringify({ decade: '50s', fitzpatrick: 'VI', stage: 'menopause', community: 'south_asian' }) });
  assert.equal(r.status, 200);
  const p = await r.json();
  assert.equal(p.choices.decade, '50s'); assert.equal(p.community.id, 'south_asian'); assert.match(p.retinoid.frequency, /Once weekly/); assert.ok(p.hormones.hrt);
  assert.equal((await fetch(`${B}/api/ageing/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: '{oops' })).status, 400);
  const html = await (await fetch(`${B}/`, { headers: h })).text();
  assert.ok(html.includes('data-view="ageing"') && html.includes('src="ageing.js"'));
  const lib = await (await fetch(`${B}/api/library`, { headers: h })).json();
  assert.equal(lib.shelves.find(s => s.id === 'ageing').guides.length, 7);
});

test('hair removal planner routes over HTTP', async () => {
  const B = `http://127.0.0.1:${PORT}`;
  const h = { 'x-forwarded-for': '10.6.6.12' };
  const o = await (await fetch(`${B}/api/hair-removal/options`, { headers: h })).json();
  assert.equal(o.methods.length, 9); assert.equal(o.tones.length, 10);
  const r = await fetch(`${B}/api/hair-removal/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: JSON.stringify({ method: 'laser', fitzpatrick: 'VI', area: 'legs', community: 'caribbean' }) });
  assert.equal(r.status, 200);
  const p = await r.json();
  assert.equal(p.choices.method, 'laser'); assert.equal(p.community.id, 'caribbean'); assert.deepEqual(p.skinType.safeLasers, ['Nd:YAG (1064nm)']); assert.equal(p.verdict.level, 'caution');
  assert.equal((await fetch(`${B}/api/hair-removal/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: '{oops' })).status, 400);
  const html = await (await fetch(`${B}/`, { headers: h })).text();
  assert.ok(html.includes('data-view="hair-removal"') && html.includes('src="hairremoval.js"'));
  const lib = await (await fetch(`${B}/api/library`, { headers: h })).json();
  assert.equal(lib.shelves.find(s => s.id === 'bodyhair').guides.length, 2);
});

test('smile and lip care routes over HTTP', async () => {
  const B = `http://127.0.0.1:${PORT}`;
  const h = { 'x-forwarded-for': '10.6.6.13' };
  const o = await (await fetch(`${B}/api/smile/options`, { headers: h })).json();
  assert.equal(o.practices.length, 8); assert.equal(o.tones.length, 10);
  const r = await fetch(`${B}/api/smile/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: JSON.stringify({ concern: 'halitosis', practice: 'tongueScraping', teeth: 'bleeding', community: 'south_asian' }) });
  assert.equal(r.status, 200);
  const p = await r.json();
  assert.equal(p.choices.concern, 'halitosis'); assert.equal(p.community.id, 'south_asian'); assert.ok(p.practice.targets); assert.ok(p.routine.forTeeth.length > 0);
  assert.equal((await fetch(`${B}/api/smile/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: '{oops' })).status, 400);
  const html = await (await fetch(`${B}/`, { headers: h })).text();
  assert.ok(html.includes('data-view="smile"') && html.includes('src="smile.js"'));
  const lib = await (await fetch(`${B}/api/library`, { headers: h })).json();
  assert.equal(lib.shelves.find(s => s.id === 'smile').guides.length, 1);
});

test('pregnancy and postpartum routes over HTTP', async () => {
  const B = `http://127.0.0.1:${PORT}`;
  const h = { 'x-forwarded-for': '10.6.6.14' };
  const o = await (await fetch(`${B}/api/bump/options`, { headers: h })).json();
  assert.equal(o.stages.length, 5); assert.equal(o.tones.length, 10);
  const r = await fetch(`${B}/api/bump/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: JSON.stringify({ stage: 'bf', ingredient: 'hydroquinone', concern: 'hair', community: 'caribbean' }) });
  assert.equal(r.status, 200);
  const p = await r.json();
  assert.equal(p.check.verdict, 'avoid'); assert.equal(p.community.id, 'caribbean'); assert.equal(p.communityNotes.kind, 'postpartum');
  assert.equal((await fetch(`${B}/api/bump/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: '{oops' })).status, 400);
  const html = await (await fetch(`${B}/`, { headers: h })).text();
  assert.ok(html.includes('data-view="bump"') && html.includes('src="bump.js"'));
  const lib = await (await fetch(`${B}/api/library`, { headers: h })).json();
  assert.equal(lib.shelves.find(s => s.id === 'bump').guides.length, 3);
});

test('bridal countdown routes over HTTP', async () => {
  const B = `http://127.0.0.1:${PORT}`;
  const h = { 'x-forwarded-for': '10.6.6.15' };
  const o = await (await fetch(`${B}/api/bridal/options`, { headers: h })).json();
  assert.equal(o.time.length, 7); assert.equal(o.styles.length, 8); assert.equal(o.tones.length, 10);
  const r = await fetch(`${B}/api/bridal/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: JSON.stringify({ time: '1m', fitzpatrick: 'VI', hairType: '4C', style: 'wash-and-go', community: 'arab' }) });
  assert.equal(r.status, 200);
  const p = await r.json();
  assert.equal(p.community.id, 'arab'); assert.ok(p.countdown.tooLate.length > 0); assert.equal(p.hair.suited, false); assert.ok(p.skin.noActives);
  assert.equal((await fetch(`${B}/api/bridal/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: '{oops' })).status, 400);
  const html = await (await fetch(`${B}/`, { headers: h })).text();
  assert.ok(html.includes('data-view="bridal"') && html.includes('src="bridal.js"'));
  const lib = await (await fetch(`${B}/api/library`, { headers: h })).json();
  assert.equal(lib.shelves.find(s => s.id === 'bridal').guides.length, 2);
});

test('colour and lip studio routes over HTTP', async () => {
  const B = `http://127.0.0.1:${PORT}`;
  const h = { 'x-forwarded-for': '10.6.6.9' };
  const o = await (await fetch(`${B}/api/colour/options`, { headers: h })).json();
  assert.equal(o.looks.length, 5); assert.equal(o.tones.length, 10);
  const r = await fetch(`${B}/api/colour/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: JSON.stringify({ look: 'ombre', finish: 'matte', care: 'dry', community: 'latina' }) });
  assert.equal(r.status, 200);
  const p = await r.json();
  assert.equal(p.choices.look, 'ombre'); assert.equal(p.community.id, 'latina'); assert.ok(p.finish.caution); assert.ok(p.lips.shade.centre);
  assert.equal((await fetch(`${B}/api/colour/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: '{oops' })).status, 400);
  const html = await (await fetch(`${B}/`, { headers: h })).text();
  assert.ok(html.includes('data-view="colour"') && html.includes('src="colour-studio.js"'));
  const lib = await (await fetch(`${B}/api/library`, { headers: h })).json();
  assert.equal(lib.shelves.find(s => s.id === 'colour').guides.length, 12);
});

test('complexion lab routes over HTTP', async () => {
  const B = `http://127.0.0.1:${PORT}`;
  const h = { 'x-forwarded-for': '10.6.6.8' };
  const o = await (await fetch(`${B}/api/complexion/options`, { headers: h })).json();
  assert.equal(o.faceShapes.length, 6); assert.equal(o.tones.length, 10);
  const r = await fetch(`${B}/api/complexion/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: JSON.stringify({ fitzpatrick: 'VI', faceShape: 'heart', occasion: 'photos', community: 'arab' }) });
  assert.equal(r.status, 200);
  const p = await r.json();
  assert.equal(p.choices.faceShape, 'heart'); assert.equal(p.community.id, 'arab'); assert.ok(p.set.flashback);
  assert.equal((await fetch(`${B}/api/complexion/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: '{oops' })).status, 400);
  const html = await (await fetch(`${B}/`, { headers: h })).text();
  assert.ok(html.includes('data-view="complexion"') && html.includes('src="complexion.js"'));
  const lib = await (await fetch(`${B}/api/library`, { headers: h })).json();
  assert.equal(lib.shelves.find(s => s.id === 'complexion').guides.length, 10);
});
  assert.equal(r.status, 200);
  const p = await r.json();
  assert.equal(p.choices.concern, 'melasma'); assert.equal(p.community.id, 'latina');
  assert.equal((await fetch(`${B}/api/skin/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: '{oops' })).status, 400);
  const html = await (await fetch(`${B}/`, { headers: h })).text();
  assert.ok(html.includes('data-view="skin"') && html.includes('src="skin.js"'));
  const lib = await (await fetch(`${B}/api/library`, { headers: h })).json();
  assert.equal(lib.shelves.find(s => s.id === 'skin').guides.length, 13);
});

test('ingredient checker routes over HTTP', async () => {
  const B = `http://127.0.0.1:${PORT}`;
  const h = { 'x-forwarded-for': '10.6.6.16' };
  const o = await (await fetch(`${B}/api/mix/options`, { headers: h })).json();
  assert.equal(o.ingredients.length, 30); assert.equal(o.stages.length, 6); assert.equal(o.tones.length, 10);
  const r = await fetch(`${B}/api/mix/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: JSON.stringify({ a: 'retinol', b: 'benzoyl_peroxide', c: 'none', d: 'none', stage: 'bf', community: 'east_asian' }) });
  assert.equal(r.status, 200);
  const p = await r.json();
  assert.equal(p.community.id, 'east_asian'); assert.equal(p.pairs[0].level, 'avoid'); assert.equal(p.pregnancy.items[0].verdict, 'avoid');
  assert.equal((await fetch(`${B}/api/mix/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: '{oops' })).status, 400);
  const t = await (await fetch(`${B}/api/mix/term?q=humectant`, { headers: h })).json();
  assert.match(t.entry.term, /Humectant/i);
  const html = await (await fetch(`${B}/`, { headers: h })).text();
  assert.ok(html.includes('data-view="mix"') && html.includes('src="mix.js"'));
  const lib = await (await fetch(`${B}/api/library`, { headers: h })).json();
  assert.equal(lib.shelves.find(s => s.id === 'ingredients').guides.length, 4);
});

test('eco beauty routes over HTTP', async () => {
  const B = `http://127.0.0.1:${PORT}`;
  const h = { 'x-forwarded-for': '10.6.6.17' };
  const o = await (await fetch(`${B}/api/eco/options`, { headers: h })).json();
  assert.equal(o.swaps.length, 7); assert.equal(o.ingredients.length, 32); assert.equal(o.tones.length, 10);
  const r = await fetch(`${B}/api/eco/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: JSON.stringify({ swap: 'razor', community: 'arab', ingredient: 'argan-oil', fitzpatrick: 'II' }) });
  assert.equal(r.status, 200);
  const p = await r.json();
  assert.equal(p.community.id, 'arab'); assert.match(p.swap.sustainable, /Safety razor/); assert.ok(p.ingredient.sourcing); assert.equal(p.sun.mineral, null);
  assert.equal((await fetch(`${B}/api/eco/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: '{oops' })).status, 400);
  const t = await (await fetch(`${B}/api/eco/term?q=upcycling`, { headers: h })).json();
  assert.match(t.entry.term, /upcycling/i);
  const html = await (await fetch(`${B}/`, { headers: h })).text();
  assert.ok(html.includes('data-view="eco"') && html.includes('src="eco.js"'));
  const lib = await (await fetch(`${B}/api/library`, { headers: h })).json();
  assert.equal(lib.shelves.find(s => s.id === 'eco').guides.length, 4);
});

test('calm and self-image routes over HTTP', async () => {
  const B = `http://127.0.0.1:${PORT}`;
  const h = { 'x-forwarded-for': '10.6.6.18' };
  const o = await (await fetch(`${B}/api/calm/options`, { headers: h })).json();
  assert.equal(o.communities.length, 9); assert.equal(o.regions.length, 6); assert.equal(o.tones.length, 10);
  const r = await fetch(`${B}/api/calm/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: JSON.stringify({ community: 'south_asian', ritual: '1', minutes: '10', focus: 'shedding', region: 'south-africa' }) });
  assert.equal(r.status, 200);
  const p = await r.json();
  assert.match(p.ritual.name, /Champi/); assert.equal(p.session.steps.length, 3); assert.match(p.support.lines[0].contact, /0800 567 567/);
  assert.equal((await fetch(`${B}/api/calm/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: '{oops' })).status, 400);
  const sr = await (await fetch(`${B}/api/calm/search?q=henna`, { headers: h })).json();
  assert.ok(sr.results.length >= 2);
  const html = await (await fetch(`${B}/`, { headers: h })).text();
  assert.ok(html.includes('data-view="calm"') && html.includes('src="calm.js"'));
  const lib = await (await fetch(`${B}/api/library`, { headers: h })).json();
  assert.equal(lib.shelves.find(s => s.id === 'mind').guides.length, 2);
});
