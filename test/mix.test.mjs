// Ingredient Checker: options, defaults, every choice matters, and the pair and pregnancy rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMixPlan, mixOptions, lookupGlossary, INGREDIENT_IDS, CONCERNS, STAGE_IDS } from '../src/ingredients/studio.js';
import { FITZPATRICK, MONK_TONES } from '../src/skin/clinic.js';

const shown = p => { const { choices, ...rest } = p; return JSON.stringify(rest); };
const DEFAULTS = { a: 'retinol', b: 'glycolic_acid', c: 'vitamin_c', d: 'niacinamide', fitzpatrick: 'V', stage: 'no', concern: 'darkspots', community: 'west_african', tone: 'mst7' };
const pair = (p, x, y) => p.pairs.find(q => (q.a === x && q.b === y) || (q.a === y && q.b === x));

test('options list every ingredient, stage, concern, the 9 communities and 10 Monk tones', () => {
  const o = mixOptions();
  assert.equal(o.ingredients.length, 30); assert.equal(o.communities.length, 9); assert.equal(o.tones.length, 10);
  assert.equal(o.stages.length, 6); assert.equal(o.concerns.length, 5);
});

test('the defaults are what an empty request gets, and bad values fall back to them', () => {
  assert.deepEqual(buildMixPlan({}).choices, DEFAULTS);
  assert.deepEqual(buildMixPlan({ a: 'mercury', b: 7, c: 'x', d: 'y', fitzpatrick: 'VII', stage: 't4', concern: 'z', tone: 'x' }).choices, DEFAULTS);
});

test('every value of every choice changes the plan or the picture', () => {
  const values = {
    a: INGREDIENT_IDS, b: INGREDIENT_IDS, c: ['none', ...INGREDIENT_IDS], d: ['none', ...INGREDIENT_IDS], fitzpatrick: FITZPATRICK, stage: STAGE_IDS,
    concern: CONCERNS.map(x => x.id), community: mixOptions().communities.map(c => c.id), tone: MONK_TONES.map(t => t.id),
  };
  const base = shown(buildMixPlan(DEFAULTS));
  for (const [k, list] of Object.entries(values)) {
    for (const v of list) {
      if (v === DEFAULTS[k]) continue;
      assert.notEqual(shown(buildMixPlan({ ...DEFAULTS, [k]: v })), base, `${k}=${v} changed nothing`);
    }
  }
});

test('pair verdicts follow the interactions guide', () => {
  const p = buildMixPlan({ a: 'retinol', b: 'benzoyl_peroxide', c: 'glycolic_acid', d: 'salicylic_acid' });
  assert.equal(pair(p, 'retinol', 'benzoyl_peroxide').level, 'avoid');
  assert.equal(pair(p, 'glycolic_acid', 'salicylic_acid').level, 'avoid');
  assert.equal(pair(p, 'retinol', 'glycolic_acid').level, 'split');
  const q = buildMixPlan({ a: 'vitamin_c', b: 'niacinamide', c: 'none', d: 'none' });
  assert.equal(q.pairs.length, 1); assert.equal(q.pairs[0].level, 'ok'); assert.match(q.pairs[0].text, /myth/);
  assert.equal(pair(buildMixPlan({ a: 'rosehip_oil', b: 'alpha_arbutin', c: 'none', d: 'none' }), 'rosehip_oil', 'alpha_arbutin').level, 'order');
  const none = pair(buildMixPlan({ a: 'rooibos', b: 'bakuchiol', c: 'none', d: 'none' }), 'rooibos', 'bakuchiol');
  assert.equal(none.level, 'none'); assert.doesNotMatch(none.text, /safe/i);
});

test('the week keeps retinol, acids and benzoyl peroxide apart', () => {
  const w = buildMixPlan(DEFAULTS).week;
  for (const d of w) {
    const pm = d.pm.map(s => s.id);
    assert.ok(!(pm.includes('retinol') && pm.includes('glycolic_acid')), `${d.day} has retinol and acid`);
    assert.ok(!pm.includes('vitamin_c'), 'vitamin C stays in the morning');
    if (pm.includes('retinol')) assert.ok(pm.indexOf('niacinamide') < pm.indexOf('retinol'), 'niacinamide before retinol');
  }
  assert.equal(w.filter(d => d.night === 'retinoid').length, 3); assert.equal(w.filter(d => d.night === 'acid').length, 2);
  const two = buildMixPlan({ a: 'glycolic_acid', b: 'salicylic_acid', c: 'none', d: 'none' }).week;
  for (const d of two) assert.ok(!(d.pm.some(s => s.id === 'glycolic_acid') && d.pm.some(s => s.id === 'salicylic_acid')));
  const bp = buildMixPlan({ a: 'retinol', b: 'benzoyl_peroxide', c: 'vitamin_c', d: 'none' }).week;
  for (const d of bp) { const pm = d.pm.map(s => s.id); assert.ok(!(pm.includes('retinol') && pm.includes('benzoyl_peroxide'))); assert.ok(!d.am.some(s => s.id === 'benzoyl_peroxide')); }
  for (const d of w) assert.equal(d.am.at(-1).label, 'Broad-spectrum SPF 30-50+');
});

test('deeper skin gets the buffer and the guide notes; lighter skin does not', () => {
  const v = buildMixPlan({ fitzpatrick: 'V' }); const ii = buildMixPlan({ fitzpatrick: 'II' });
  assert.ok(v.week[0].pm.some(s => s.id === 'buffer')); assert.ok(!ii.week[0].pm.some(s => s.id === 'buffer'));
  assert.ok(buildMixPlan({ fitzpatrick: 'II', concern: 'sensitive' }).week[0].pm.some(s => s.id === 'buffer'));
  assert.ok(v.skin.order && !ii.skin.order);
  assert.match(pair(buildMixPlan({ fitzpatrick: 'III' }), 'retinol', 'vitamin_c').text, /III-VI/);
  assert.doesNotMatch(pair(ii, 'retinol', 'vitamin_c').text, /III-VI/);
});

test('pregnancy stage takes avoided ingredients out of the routine and says why', () => {
  const p = buildMixPlan({ stage: 't1' });
  assert.equal(p.pregnancy.items.find(x => x.id === 'retinol').verdict, 'avoid');
  assert.deepEqual(p.leftOut, ['Retinol (Vitamin A)']);
  for (const d of p.week) assert.ok(!d.pm.some(s => s.id === 'retinol'));
  assert.equal(buildMixPlan({ stage: 't1', a: 'rooibos' }).pregnancy.items[0].verdict, 'ask');
  assert.equal(buildMixPlan({ stage: 'no' }).pregnancy, null);
  assert.ok(!buildMixPlan({ stage: 't2', concern: 'lines' }).concern.suggestions.some(s => s.id === 'retinol'));
});

test('community adds traditional ingredients only; no group skin claims, no lightening', () => {
  for (const c of mixOptions().communities) {
    const s = JSON.stringify(buildMixPlan({ community: c.id }));
    assert.doesNotMatch(s, /skin lightening treatment|bleach your|common in (South Asian|Black|Arab|Latina|East Asian|African)/i, c.id);
  }
  assert.ok(buildMixPlan({ community: 'south_asian' }).communityNotes.traditional.some(t => t.id === 'amla_oil'));
});

test('glossary lookup finds terms and refuses tiny queries', () => {
  assert.match(lookupGlossary('retinol').entry.term, /Retinol/);
  assert.equal(lookupGlossary('a').entry, null);
});
