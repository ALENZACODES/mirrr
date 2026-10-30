/** Brow & Kohl Studio: every option makes a visible change, community drives the ranking, safety
 * notes travel with kohl looks, and the routes answer over a real server.
 * Run: node --test test/studio.test.mjs */
import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import { spawn } from 'node:child_process';
import {
  buildStudioPlan, rankEyeLooks, studioOptions, toneForShade,
  EYE_LOOKS, BROW_STYLES, FACE_SHAPES, EYE_SHAPES, BROW_DENSITIES, SKIN_TONES,
} from '../src/studio/brow_kohl.js';

const base = { community: 'latina', faceShape: 'oval', eyeShape: 'almond', browDensity: 'medium', browStyle: 'soft_arch', eyeLook: 'cat_eye', skinTone: 'medium-olive' };
const geo = p => JSON.stringify([p.brow.geometry, p.eye.geometry]);

test('each eye look draws a different eye and carries its own technique', () => {
  const seen = new Map();
  for (const look of Object.keys(EYE_LOOKS)) {
    const p = buildStudioPlan({ ...base, eyeLook: look });
    assert.equal(p.eye.look, look);
    assert.ok(p.eye.steps.length >= 1, `${look} has no steps`);
    const g = JSON.stringify(p.eye.geometry);
    assert.ok(!seen.has(g), `${look} draws the same as ${seen.get(g)}`);
    seen.set(g, look);
  }
});

test('each brow architecture draws a different brow', () => {
  const seen = new Set();
  for (const style of Object.keys(BROW_STYLES)) {
    const p = buildStudioPlan({ ...base, browStyle: style });
    assert.equal(p.brow.style, style);
    assert.equal(p.brow.chosenBy, 'you');
    seen.add(JSON.stringify(p.brow.geometry));
  }
  assert.equal(seen.size, Object.keys(BROW_STYLES).length);
});

test('every option value changes the plan at its default strength', () => {
  const ref = buildStudioPlan(base);
  const fields = { faceShape: FACE_SHAPES, eyeShape: EYE_SHAPES, browDensity: BROW_DENSITIES, skinTone: SKIN_TONES };
  for (const [field, values] of Object.entries(fields)) {
    for (const v of values) {
      if (v === base[field]) continue;
      const p = buildStudioPlan({ ...base, [field]: v, browStyle: field === 'faceShape' ? '' : base.browStyle });
      const changed = field === 'faceShape' ? JSON.stringify(p.brow) !== JSON.stringify(buildStudioPlan({ ...base, browStyle: '' }).brow) || p.brow.faceAdvice.recommended !== ref.brow.faceAdvice.recommended
        : field === 'skinTone' ? JSON.stringify(p.eye.shadowColours) !== JSON.stringify(ref.eye.shadowColours)
        : geo(p) !== geo(ref);
      assert.ok(changed, `${field}=${v} made no difference`);
    }
  }
  const glasses = buildStudioPlan({ ...base, wearsGlasses: true });
  assert.ok(glasses.glasses.principles.length > 0);
  assert.equal(ref.glasses, null);
});

test('community traditions lead the eye-look ranking, with the reason', () => {
  const ea = rankEyeLooks('east_asian');
  assert.equal(ea[0].id, 'puppy_eye'); assert.ok(ea[0].forYou && /puppy/i.test(ea[0].because));
  const ar = rankEyeLooks('arab');
  assert.ok(ar.slice(0, 2).some(l => l.id === 'arab_wing') && ar[0].because);
  const la = rankEyeLooks('latina');
  assert.equal(la[0].id, 'cat_eye');
  // no explicit choice: the plan follows the community
  assert.equal(buildStudioPlan({ community: 'east_asian' }).eye.look, 'puppy_eye');
  assert.equal(buildStudioPlan({ community: 'east_asian' }).brow.style, 'straight');
  assert.equal(buildStudioPlan({ community: 'south_asian' }).brow.style, 'high_arch');
  const p = buildStudioPlan({ community: 'south_asian' });
  assert.ok(p.because.some(b => b.about === 'eye') && p.because.some(b => b.about === 'brow'));
});

test('kohl looks carry the lead warning and waterline safety; others do not', () => {
  for (const [id, look] of Object.entries(EYE_LOOKS)) {
    const p = buildStudioPlan({ ...base, eyeLook: id });
    if (look.product === 'kohl_kajal') {
      assert.match(p.eye.kohlSafety.name, /lead/i);
      assert.ok(p.eye.kohlSafety.safer.length > 0);
    } else assert.equal(p.eye.kohlSafety, null);
    assert.equal(!!p.eye.waterlineSafety, look.geometry.waterline.length > 0, id);
  }
});

test('saved shade ids map to skin depth; junk input falls back to safe defaults', () => {
  assert.equal(toneForShade('D37'), 'deep'); assert.equal(toneForShade('RD48'), 'deep');
  assert.equal(toneForShade('MD31'), 'medium-deep'); assert.equal(toneForShade('M22'), 'medium-olive');
  assert.equal(toneForShade('L09'), 'light'); assert.equal(toneForShade('MX55'), null);
  assert.equal(buildStudioPlan({ shadeId: 'D40' }).choices.skinTone, 'deep');
  const junk = buildStudioPlan({ faceShape: '<x>', eyeShape: 7, browDensity: null, eyeLook: 'nope', browStyle: 'nope', community: '???' });
  assert.equal(junk.choices.faceShape, 'oval'); assert.equal(junk.choices.eyeShape, 'almond');
  assert.ok(junk.eye.steps.length && junk.brow.steps.length);
  const o = studioOptions();
  assert.equal(o.communities.length, 9); assert.equal(o.eyeLooks.length, Object.keys(EYE_LOOKS).length);
});

const PORT = 3800 + Math.floor(Math.random() * 90);
let server;
before(async () => {
  server = spawn(process.execPath, ['src/server.js'], { env: { ...process.env, PORT: String(PORT), QLOO_API_KEY: '' }, stdio: 'pipe' });
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PORT}/api/health`)).ok) return; } catch { /* booting */ }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('server did not start');
});
after(() => server?.kill());

test('studio routes over HTTP', async () => {
  const B = `http://127.0.0.1:${PORT}`;
  const h = { 'x-forwarded-for': '10.5.5.5' };
  assert.equal((await fetch(`${B}/api/studio/options`, { headers: h })).status, 200);
  const looks = await (await fetch(`${B}/api/studio/looks?community=arab`, { headers: h })).json();
  assert.ok(looks.looks[0].forYou);
  const r = await fetch(`${B}/api/studio/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: JSON.stringify({ community: 'west_african', eyeLook: 'cat_eye' }) });
  assert.equal(r.status, 200);
  const plan = await r.json();
  assert.equal(plan.eye.look, 'cat_eye'); assert.equal(plan.community.id, 'west_african');
  const bad = await fetch(`${B}/api/studio/plan`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: '{oops' });
  assert.equal(bad.status, 400);
  const html = await (await fetch(`${B}/`, { headers: h })).text();
  assert.ok(html.includes('data-view="studio"') && html.includes('src="studio.js"'));
});

test('face shape reshapes the brow even when the community picked the architecture', () => {
  for (const community of ['arab', 'south_asian', 'east_asian']) {
    const seen = new Set();
    for (const faceShape of FACE_SHAPES) {
      const p = buildStudioPlan({ community, faceShape, browStyle: '' });
      assert.equal(p.brow.chosenBy, 'community');
      seen.add(JSON.stringify(p.brow.geometry));
      if (faceShape !== 'oval') assert.ok(p.because.some(b => b.about === 'brow' && b.text.includes(`${faceShape} face`)), `${community}/${faceShape} explains the tuning`);
    }
    assert.equal(seen.size, FACE_SHAPES.length, `${community}: every face shape draws a different brow`);
  }
});
