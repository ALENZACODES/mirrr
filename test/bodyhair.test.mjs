// Hair Removal Planner: options, defaults, every choice matters, and the safety rules from the guides.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildHairRemovalPlan, hairRemovalOptions, verdict, suitedToArea, AREAS, HAIR, COLOURS, METHODS, OCCASIONS } from '../src/bodyhair/studio.js';
import { FITZPATRICK, MONK_TONES } from '../src/skin/clinic.js';

const shown = p => { const { choices, ...rest } = p; return JSON.stringify(rest); };
const DEFAULTS = { area: 'underarms', hair: 'coily', colour: 'dark', fitzpatrick: 'V', method: 'shaving', occasion: 'none', community: 'west_african', tone: 'mst7' };

test('options list every choice, with the 9 communities, 10 Monk tones and 9 methods', () => {
  const o = hairRemovalOptions();
  assert.equal(o.communities.length, 9); assert.equal(o.tones.length, 10); assert.equal(o.methods.length, 9);
  assert.deepEqual(o.occasions.map(x => x.id), ['none', 'wedding', 'carnival', 'beachSeason']);
  assert.equal(o.areas.length, 5); assert.equal(o.hair.length, 3); assert.equal(o.colours.length, 2);
});

test('the defaults are what an empty request gets, and bad values fall back to them', () => {
  assert.deepEqual(buildHairRemovalPlan({}).choices, DEFAULTS);
  assert.deepEqual(buildHairRemovalPlan({ area: 'back', hair: 1, colour: 'green', fitzpatrick: 'VII', method: 'magic', occasion: null, tone: 'x' }).choices, DEFAULTS);
});

test('every value of every choice changes the plan or the picture', () => {
  const values = {
    area: AREAS.map(x => x.id), hair: HAIR.map(x => x.id), colour: COLOURS.map(x => x.id), fitzpatrick: FITZPATRICK,
    method: METHODS.map(x => x.id), occasion: OCCASIONS.map(x => x.id), community: hairRemovalOptions().communities.map(c => c.id), tone: MONK_TONES.map(t => t.id),
  };
  const base = shown(buildHairRemovalPlan(DEFAULTS));
  for (const [k, list] of Object.entries(values)) {
    for (const v of list) {
      if (v === DEFAULTS[k]) continue;
      assert.notEqual(shown(buildHairRemovalPlan({ ...DEFAULTS, [k]: v })), base, `${k}=${v} changed nothing`);
    }
  }
});

test('only Nd:YAG is safe on types V and VI; light hair rules out every laser and IPL', () => {
  for (const f of ['V', 'VI']) assert.deepEqual(buildHairRemovalPlan({ fitzpatrick: f }).skinType.safeLasers, ['Nd:YAG (1064nm)']);
  assert.equal(buildHairRemovalPlan({ fitzpatrick: 'I' }).skinType.safeLasers.length, 3);
  assert.deepEqual(buildHairRemovalPlan({ fitzpatrick: 'I', colour: 'light' }).skinType.safeLasers, []);
  assert.equal(verdict('IPL', { area: 'legs', hair: 'fine', colour: 'dark', fitz: 'VI' }).level, 'avoid');
  assert.equal(verdict('laser', { area: 'legs', hair: 'fine', colour: 'light', fitz: 'II' }).level, 'avoid');
  assert.equal(verdict('laser', { area: 'legs', hair: 'fine', colour: 'dark', fitz: 'II' }).level, 'good');
  assert.equal(verdict('electrolysis', { area: 'face', hair: 'fine', colour: 'light', fitz: 'VI' }).level, 'good');
  assert.ok(buildHairRemovalPlan({ fitzpatrick: 'VI' }).laserSafety);
  assert.equal(buildHairRemovalPlan({ fitzpatrick: 'II' }).laserSafety, null);
});

test('coily hair gets the razor bump warning, ingrown care and the darker-skin mistakes', () => {
  const p = buildHairRemovalPlan({});
  assert.equal(p.verdict.level, 'caution'); assert.match(p.verdict.why[0], /single blade/);
  assert.ok(p.aftercare.ingrown.prevention.length > 0);
  assert.ok(p.aftercare.darkMarks.niacinamide);
  const fine = buildHairRemovalPlan({ hair: 'fine', fitzpatrick: 'II' });
  assert.equal(fine.verdict.level, 'good'); assert.equal(fine.aftercare.ingrown, null); assert.equal(fine.aftercare.darkMarks, null);
  assert.ok(!JSON.stringify(p.aftercare).includes('Stretch skin taut'));
});

test('threading is for the face only, and each area lists the methods named best for it', () => {
  assert.equal(verdict('threading', { area: 'legs', hair: 'fine', colour: 'dark', fitz: 'III' }).level, 'avoid');
  assert.equal(verdict('threading', { area: 'face', hair: 'fine', colour: 'dark', fitz: 'III' }).level, 'good');
  assert.ok(suitedToArea('face').includes('threading')); assert.ok(!suitedToArea('legs').includes('threading'));
  for (const a of AREAS) assert.ok(suitedToArea(a.id).length > 0, a.id);
});

test('an event adds its timeline and the tradition for the chosen community', () => {
  assert.equal(buildHairRemovalPlan({}).occasion, null);
  const w = buildHairRemovalPlan({ occasion: 'wedding', community: 'south_asian' });
  assert.ok(w.occasion.timeline.length > 20); assert.ok(w.occasion.yourTradition);
});

test('community adds traditions only, never skin or hair concerns', () => {
  for (const c of hairRemovalOptions().communities) {
    const n = buildHairRemovalPlan({ community: c.id }).communityNotes;
    assert.ok(n.signature.primary, c.id);
    for (const k of Object.keys(n.traditions)) assert.ok(!/pfb|hyperpig|laser|ingrown|brightening/i.test(k), `${c.id}: ${k}`);
  }
});
