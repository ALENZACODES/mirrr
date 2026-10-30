// Night Routine planner: options, defaults, every choice matters, and the routine rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildNightPlan, nightOptions, methodsForHair, HAIR, METHODS, SKIN, ACTIVES, POSITIONS, HOURS } from '../src/sleep/studio.js';
import { FITZPATRICK, MONK_TONES } from '../src/skin/clinic.js';

const shown = p => { const { choices, ...rest } = p; return JSON.stringify(rest); };
const DEFAULTS = { hair: 'coily', method: 'bonnet', skin: 'normal', active: 'none', position: 'side_sleeping', hours: 7, fitzpatrick: 'V', community: 'west_african', tone: 'mst7' };

test('options list every choice, with the 9 communities and 10 Monk tones', () => {
  const o = nightOptions();
  assert.equal(o.communities.length, 9); assert.equal(o.tones.length, 10);
  assert.equal(o.methods.length, 6); assert.equal(o.actives.length, 6); assert.equal(o.positions.length, 3);
  assert.deepEqual(o.hours.map(h => h.id), [5, 6, 7, 8, 9]);
});

test('the defaults are what an empty request gets, and bad values fall back to them', () => {
  assert.deepEqual(buildNightPlan({}).choices, DEFAULTS);
  assert.deepEqual(buildNightPlan({ hair: 'bald', method: 'helmet', skin: 1, active: 'magic', position: 'upside', hours: 12, fitzpatrick: 'VII', tone: 'x' }).choices, DEFAULTS);
  assert.equal(buildNightPlan({ hours: '8' }).choices.hours, 8);
});

test('every value of every choice changes the plan or the picture', () => {
  const values = {
    hair: HAIR.map(x => x.id), method: METHODS.map(x => x.id), skin: SKIN.map(x => x.id), active: ACTIVES.map(x => x.id),
    position: POSITIONS.map(x => x.id), hours: HOURS, fitzpatrick: FITZPATRICK, community: nightOptions().communities.map(c => c.id), tone: MONK_TONES.map(t => t.id),
  };
  const base = shown(buildNightPlan(DEFAULTS));
  for (const [k, list] of Object.entries(values)) {
    for (const v of list) {
      if (v === DEFAULTS[k]) continue;
      assert.notEqual(shown(buildNightPlan({ ...DEFAULTS, [k]: v })), base, `${k}=${v} changed nothing`);
    }
  }
});

test('hair protection follows hair texture as the guide names it', () => {
  assert.ok(methodsForHair('coily').includes('bonnet')); assert.ok(!methodsForHair('straight').includes('bonnet'));
  assert.ok(methodsForHair('straight').includes('looseBraid')); assert.ok(methodsForHair('braids').includes('headWrap'));
  assert.equal(buildNightPlan({ hair: 'straight', method: 'bonnet' }).hairProtection.suited, false);
  assert.equal(buildNightPlan({}).hairProtection.suited, true);
});

test('retinoid and exfoliant nights warn not to combine; oily and acne-prone skin skip slugging', () => {
  assert.match(buildNightPlan({ active: 'retinoid' }).conflicts.avoid.join(), /AHA\/BHA/);
  assert.equal(buildNightPlan({}).conflicts.avoid.length, 0);
  assert.match(buildNightPlan({ skin: 'dry' }).routine.at(-1).step, /Slugging/);
  assert.match(buildNightPlan({ skin: 'normal' }).routine.at(-1).step, /Sleeping mask/);
  assert.match(buildNightPlan({ skin: 'acne' }).routine.at(-1).detail, /acne/i);
  assert.match(buildNightPlan({ active: 'exfoliant', fitzpatrick: 'VI' }).routine[1].strength, /Lower concentrations/);
  assert.equal(buildNightPlan({ active: 'exfoliant', fitzpatrick: 'II' }).routine[1].strength, null);
  assert.ok(buildNightPlan({}).skinType.darkMarks); assert.equal(buildNightPlan({ fitzpatrick: 'II' }).skinType.darkMarks, null);
});

test('short nights list the effects; the deep-sleep note is not a clock-time myth', () => {
  assert.ok(buildNightPlan({ hours: 5 }).sleep.shortSleepEffects.length > 0);
  assert.equal(buildNightPlan({ hours: 8 }).sleep.shortSleepEffects, null);
  assert.match(buildNightPlan({}).sleep.deepSleep, /whatever the clock time/);
});

test('community adds traditions only, never skin or hair types', () => {
  for (const c of nightOptions().communities) {
    const n = JSON.stringify(buildNightPlan({ community: c.id }).communityNotes);
    assert.ok(!/skinToneRange|hairTextures|primarySkinConcern|predominant/.test(n), c.id);
  }
});
