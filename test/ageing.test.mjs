// Ageing Studio (src/ageing/studio.js): a routine for your decade, depth, concern and hormone stage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAgeingPlan, ageingOptions, DECADES, CONCERNS, STAGES } from '../src/ageing/studio.js';
import { FITZPATRICK, MONK_TONES } from '../src/skin/clinic.js';

const shown = p => { const { choices, ...rest } = p; return JSON.stringify(rest); };
const DEFAULTS = { decade: '30s', fitzpatrick: 'V', concern: 'pigment', stage: 'none', community: 'west_african', tone: 'mst7' };
const steps = list => list.map(s => s.step);

test('options list every choice, with the 9 communities and 10 Monk tones', () => {
  const o = ageingOptions();
  assert.equal(o.communities.length, 9); assert.equal(o.tones.length, 10);
  assert.deepEqual(o.decades.map(d => d.id), ['20s', '30s', '40s', '50s', '60s']);
  assert.equal(o.concerns.length, 5); assert.deepEqual(o.stages.map(s => s.id), ['none', 'perimenopause', 'menopause']);
});

test('the defaults are what an empty request gets, and bad values fall back to them', () => {
  assert.deepEqual(buildAgeingPlan({}).choices, DEFAULTS);
  assert.deepEqual(buildAgeingPlan({ decade: '90s', fitzpatrick: 'VII', concern: 1, stage: null, tone: 'x' }).choices, DEFAULTS);
});

test('every value of every choice changes the plan or the picture', () => {
  const values = {
    decade: DECADES.map(x => x.id), fitzpatrick: FITZPATRICK, concern: CONCERNS.map(x => x.id), stage: STAGES.map(x => x.id),
    community: ageingOptions().communities.map(c => c.id), tone: MONK_TONES.map(t => t.id),
  };
  const base = shown(buildAgeingPlan(DEFAULTS));
  for (const [k, list] of Object.entries(values)) {
    for (const v of list) {
      if (v === DEFAULTS[k]) continue;
      assert.notEqual(shown(buildAgeingPlan({ ...DEFAULTS, [k]: v })), base, `${k}=${v} changed nothing`);
    }
  }
});

test('retinoids go slower on deeper skin, and wait in the 20s unless lines are the concern', () => {
  assert.match(buildAgeingPlan({ fitzpatrick: 'VI' }).retinoid.frequency, /Once weekly/);
  assert.match(buildAgeingPlan({ fitzpatrick: 'IV' }).retinoid.frequency, /Twice weekly/);
  assert.match(buildAgeingPlan({ fitzpatrick: 'I' }).retinoid.frequency, /Every other night/);
  assert.ok(buildAgeingPlan({ fitzpatrick: 'I' }).retinoid.ramp.length > 0);
  assert.ok(buildAgeingPlan({ fitzpatrick: 'V' }).retinoid.deepSkin);
  assert.equal(buildAgeingPlan({ decade: '20s', concern: 'pigment' }).retinoid, null);
  assert.ok(!steps(buildAgeingPlan({ decade: '20s', concern: 'pigment' }).routine.pm).includes('Retinoid'));
  assert.ok(buildAgeingPlan({ decade: '20s', concern: 'lines' }).retinoid);
});

test('every routine ends the morning with sunscreen; the concern adds its own step', () => {
  for (const c of CONCERNS) {
    const p = buildAgeingPlan({ concern: c.id });
    assert.equal(p.routine.am.at(-1).step, 'Sunscreen');
  }
  assert.ok(steps(buildAgeingPlan({ concern: 'firmness' }).routine.pm).includes('Peptide serum'));
  assert.ok(steps(buildAgeingPlan({ concern: 'texture' }).routine.pm).includes('Lactic or glycolic acid'));
  assert.ok(steps(buildAgeingPlan({ concern: 'dryness' }).routine.am).includes('Rich moisturiser'));
  assert.ok(steps(buildAgeingPlan({ concern: 'pigment', fitzpatrick: 'I' }).routine.pm).includes('Niacinamide'));
  assert.ok(!steps(buildAgeingPlan({ concern: 'lines', fitzpatrick: 'I' }).routine.pm).includes('Niacinamide'));
});

test('in-clinic options respect depth: no ablative laser or medium peel advice for deep skin', () => {
  const deepPeel = JSON.stringify(buildAgeingPlan({ concern: 'pigment', fitzpatrick: 'VI' }).clinic);
  assert.match(deepPeel, /mandelic/i);
  const deepLaser = buildAgeingPlan({ concern: 'texture', fitzpatrick: 'VI' }).clinic.suitability;
  assert.match(deepLaser.avoid, /V-VI: contraindicated/);
  assert.match(JSON.stringify(buildAgeingPlan({ concern: 'lines', fitzpatrick: 'V' }).clinic), /dark skin/i);
  assert.equal(buildAgeingPlan({ concern: 'dryness' }).clinic, null);
});

test('hormone stage adds perimenopause or menopause care; menopause adds the hormone-therapy note', () => {
  assert.equal(buildAgeingPlan({ stage: 'none' }).hormones, null);
  const peri = buildAgeingPlan({ stage: 'perimenopause' }).hormones;
  assert.ok(peri.signs.includes('Irregular periods')); assert.ok(peri.skin.acne); assert.equal(peri.hrt, null);
  const meno = buildAgeingPlan({ stage: 'menopause' });
  assert.ok(meno.hormones.skin.collagen && meno.hormones.hrt.disclaimer);
  assert.ok(steps(meno.routine.pm).includes('Rich cream or facial oil'));
});

test('community adds foods and traditions only; it never changes the routine or retinoid pace', () => {
  const a = buildAgeingPlan({ community: 'arab' }); const b = buildAgeingPlan({ community: 'east_asian' });
  assert.deepEqual(a.routine, b.routine); assert.deepEqual(a.retinoid, b.retinoid); assert.deepEqual(a.clinic, b.clinic);
  assert.ok(a.communityNotes.foods.length > 0);
  assert.notDeepEqual(a.communityNotes.foods, b.communityNotes.foods);
  assert.equal(buildAgeingPlan({ community: 'latina' }).communityNotes.menopause, null);
  assert.ok(buildAgeingPlan({ community: 'black_american', stage: 'menopause' }).communityNotes.menopause.shea_butter);
});

test('the guides carry no made-up effect sizes or group ageing claims', () => {
  const all = JSON.stringify(ageingOptions().communities.map(c => buildAgeingPlan({ community: c.id, stage: 'menopause' })));
  for (const bad of [/SPF ?~?13/, /\d+-\d+ years (later|younger)/, /30% (collagen|lost|loss)/, /92 of/, /99% TEWL/]) assert.doesNotMatch(all, bad);
});
