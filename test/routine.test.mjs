// Routine Builder: options, defaults, every choice matters, skin type is the reader's own pick,
// pregnancy swaps, pacing for deeper types, heritage swaps and the audited skin guide.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRoutinePlan, routineOptions, searchRoutineIngredients, startNights, TYPES, CONCERNS } from '../src/routine/studio.js';
import * as skin from '../src/skin_analysis.js';

const shown = p => { const { choices, ...rest } = p; return JSON.stringify(rest); };
const DEFAULTS = { type: 'IV', undertone: 'unsure', feel: 'combination', concern: 'dark_marks', climate: 'temperate', steps: '5', pregnant: 'no', heritage: 'none', tone: 'mst7' };
const FIELDS = { types: 'type', undertones: 'undertone', feels: 'feel', concerns: 'concern', climates: 'climate', steps: 'steps', pregnancy: 'pregnant', heritages: 'heritage', tones: 'tone' };
const text = m => JSON.stringify(Object.fromEntries(Object.entries(m).filter(([, v]) => typeof v !== 'function')));

test('options list every type, undertone, feel, concern, climate, size, pregnancy answer, heritage and tone', () => {
  const o = routineOptions();
  assert.equal(o.types.length, 6); assert.equal(o.undertones.length, 10); assert.equal(o.feels.length, 5);
  assert.equal(o.concerns.length, 8); assert.equal(o.climates.length, 4); assert.equal(o.steps.length, 3);
  assert.equal(o.pregnancy.length, 2); assert.equal(o.heritages.length, 10); assert.equal(o.tones.length, 10);
});

test('the defaults are what an empty request gets, and bad values fall back to them', () => {
  assert.deepEqual(buildRoutinePlan({}).choices, DEFAULTS);
  assert.deepEqual(buildRoutinePlan(null).choices, DEFAULTS);
  assert.deepEqual(buildRoutinePlan({ type: 'VII', undertone: 'green', feel: 'x', concern: 'y', climate: 'mars', steps: '12', pregnant: 'maybe', heritage: 'atlantis', tone: 'x' }).choices, DEFAULTS);
  assert.equal(buildRoutinePlan({ heritage: 'west-african' }).choices.heritage, 'west_african');
});

test('every value of every choice changes the plan or the picture', () => {
  const o = routineOptions();
  for (const [list, field] of Object.entries(FIELDS)) {
    const seen = new Map();
    for (const v of o[list]) {
      const s = shown(buildRoutinePlan({ [field]: v.id }));
      assert.ok(!seen.has(s), `${field}=${v.id} looks the same as ${field}=${seen.get(s)}`);
      seen.set(s, v.id);
    }
  }
});

test('skin type is never set by heritage, and heritage only adds swaps', () => {
  for (const h of routineOptions().heritages) {
    const p = buildRoutinePlan({ heritage: h.id });
    assert.equal(p.choices.type, 'IV'); assert.equal(p.type.id, 'IV');
    if (h.id !== 'none') { assert.ok(p.heritage.swap.name); assert.ok(p.heritage.remedies.length > 0); }
  }
  const t = text(skin);
  assert.ok(!/communityLikelyCommunities|guessCommunities|ethnicRecommendations|skinCharacteristics/.test(t));
  for (const f of Object.values(skin.FITZPATRICK_EXTENDED)) assert.equal(f.communities, undefined);
  for (const u of Object.values(skin.UNDERTONE_PROFILES)) assert.equal(u.communities, undefined);
  for (const i of Object.values(skin.SKINCARE_INGREDIENTS)) assert.equal(i.communities, undefined);
  assert.equal(skin.FOUNDATIONS, undefined); assert.equal(skin.analyseRGBSkinTone, undefined);
});

test('a heavy butter swap goes to the body when the face is oily', () => {
  const p = buildRoutinePlan({ heritage: 'west_african', feel: 'oily' });
  assert.equal(p.heritage.where, 'body');
  assert.ok(!p.night.some(s => s.swap));
  const q = buildRoutinePlan({ heritage: 'west_african', feel: 'dry' });
  assert.ok(q.night.some(s => s.swap && s.swap.id === 'shea_butter'));
});

test('pregnancy removes retinol, arbutin, salicylic acid and tranexamic acid', () => {
  for (const concern of CONCERNS.map(c => c.id)) for (const steps of ['3', '5', '7']) {
    const p = buildRoutinePlan({ concern, steps, pregnant: 'yes' });
    const ids = [...p.morning, ...p.night].map(s => s.ingredient?.id).filter(Boolean);
    for (const bad of ['retinol', 'alpha_arbutin', 'salicylic_acid', 'tranexamic_acid']) assert.ok(!ids.includes(bad), `${concern}/${steps}: ${bad}`);
    assert.ok(p.notes.some(n => /pharmacist/.test(n)));
  }
});

test('strong actives start slower on types IV to VI and on sensitive skin, and never clash', () => {
  assert.equal(startNights('II', 'normal'), 3); assert.equal(startNights('V', 'normal'), 2); assert.equal(startNights('V', 'sensitive'), 1); assert.equal(startNights('I', 'oily'), 4);
  const light = buildRoutinePlan({ type: 'II', concern: 'lines', feel: 'normal' });
  const deep = buildRoutinePlan({ type: 'VI', concern: 'lines', feel: 'normal' });
  assert.equal(light.week.filter(w => w.active).length, 3); assert.equal(deep.week.filter(w => w.active).length, 2);
  assert.match(deep.pace, /dark marks/);
  for (const t of TYPES) for (const c of CONCERNS) for (const steps of ['3', '5', '7']) {
    const p = buildRoutinePlan({ type: t.id, concern: c.id, steps });
    assert.deepEqual(p.clashes, []);
    assert.ok(p.morning.at(-1).slot === 'am-sun', 'sunscreen is the last morning step');
    assert.ok(!p.week.some(w => w.active && w.extra), 'no exfoliant on a treatment night');
  }
});

test('the full routine adds layers; the simple one has three steps', () => {
  const s = buildRoutinePlan({ steps: '3' }); const f = buildRoutinePlan({ steps: '7' });
  assert.equal(s.morning.length, 3); assert.equal(s.night.length, 3);
  assert.ok(f.morning.length > s.morning.length && f.night.length > s.night.length);
});

test('ingredient search finds by benefit and ignores short queries', () => {
  assert.ok(searchRoutineIngredients('acne').results.some(r => r.id === 'salicylic_acid'));
  assert.deepEqual(searchRoutineIngredients('ac').results, []);
});

test('the audited skin guide: sun advice is SPF 30 for everyone and the corrected facts hold', () => {
  for (const f of Object.values(skin.FITZPATRICK_EXTENDED)) assert.match(f.sunProtection, /SPF 30/);
  assert.ok(!/natural SPF|for centuries\. Now a staple|purging|Modern dermatology increasingly validates/.test(text(skin)));
  assert.match(skin.SKINCARE_INGREDIENTS.amla_oil.ethnicSkinNote, /not a vitamin C product/);
  assert.match(skin.SKINCARE_INGREDIENTS.bakuchiol.culturalContext, /psoralens/);
  assert.equal(skin.getSkincareRoutine('arab').label, 'Arab and North African traditions');
  assert.equal(skin.getFitzpatrickInfo('VI').id, 'VI');
});
