// Smile & Lip Care planner: options, defaults, every choice matters, and the safety rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSmilePlan, smileOptions, CONCERNS, PRACTICES, TEETH } from '../src/oral/studio.js';
import { MONK_TONES } from '../src/skin/clinic.js';

const shown = p => { const { choices, ...rest } = p; return JSON.stringify(rest); };
const DEFAULTS = { concern: 'whitening', practice: 'chewingSticks', teeth: 'healthy', community: 'west_african', tone: 'mst7' };

test('options list every choice, with the 9 communities and 10 Monk tones', () => {
  const o = smileOptions();
  assert.equal(o.communities.length, 9); assert.equal(o.tones.length, 10);
  assert.deepEqual(o.concerns.map(c => c.id), ['whitening', 'halitosis', 'gumHealth', 'lipCare', 'toothache']);
  assert.equal(o.practices.length, 8); assert.deepEqual(o.teeth.map(t => t.id), ['healthy', 'sensitive', 'bleeding']);
});

test('the defaults are what an empty request gets, and bad values fall back to them', () => {
  assert.deepEqual(buildSmilePlan({}).choices, DEFAULTS);
  assert.deepEqual(buildSmilePlan({ concern: 'braces', practice: 7, teeth: null, tone: 'x' }).choices, DEFAULTS);
});

test('every value of every choice changes the plan or the picture', () => {
  const values = {
    concern: CONCERNS.map(x => x.id), practice: PRACTICES.map(x => x.id), teeth: TEETH.map(x => x.id),
    community: smileOptions().communities.map(c => c.id), tone: MONK_TONES.map(t => t.id),
  };
  const base = shown(buildSmilePlan(DEFAULTS));
  for (const [k, list] of Object.entries(values)) {
    for (const v of list) {
      if (v === DEFAULTS[k]) continue;
      assert.notEqual(shown(buildSmilePlan({ ...DEFAULTS, [k]: v })), base, `${k}=${v} changed nothing`);
    }
  }
});

test('every routine keeps fluoride brushing, and every concern adds its own steps', () => {
  for (const c of CONCERNS) {
    const p = buildSmilePlan({ concern: c.id });
    assert.match(p.routine.daily[0], /fluoride toothpaste/);
    assert.ok(p.routine.forConcern.length >= 2, c.id);
  }
  assert.ok(buildSmilePlan({ concern: 'toothache' }).routine.forConcern.some(s => /dentist/.test(s)));
});

test('a practice says whether it targets the concern', () => {
  assert.ok(buildSmilePlan({ concern: 'halitosis', practice: 'tongueScraping' }).practice.targets);
  assert.equal(buildSmilePlan({ concern: 'whitening', practice: 'tongueScraping' }).practice.targets, null);
  assert.match(buildSmilePlan({ concern: 'whitening', practice: 'charcoalWhitening' }).practice.targets, /surface stains only/);
  assert.match(buildSmilePlan({ concern: 'toothache', practice: 'greenTea' }).practice.warnings.join(), /see a dentist/);
});

test('sensitive teeth flag abrasive and acid steps; bleeding gums send you to a dentist', () => {
  const s = buildSmilePlan({ teeth: 'sensitive', practice: 'charcoalWhitening', community: 'black_american' });
  assert.match(s.practice.warnings.join(), /abrasive/);
  assert.ok(s.ritual.weeklyTreatment.find(x => /charcoal/i.test(x.step)).caution);
  assert.ok(s.routine.forTeeth.some(x => /potassium nitrate/.test(x)));
  assert.ok(!buildSmilePlan({ community: 'black_american' }).ritual.weeklyTreatment.some(x => x.caution));
  assert.ok(buildSmilePlan({ teeth: 'bleeding' }).routine.forTeeth.some(x => /dentist/.test(x)));
});

test('no ritual tells anyone to put lime or lemon on their teeth', () => {
  for (const c of smileOptions().communities) {
    const steps = Object.values(buildSmilePlan({ community: c.id }).ritual).flat().map(x => x.step);
    assert.ok(steps.filter(x => /\b(lime|lemon)\b/i.test(x)).every(x => /^Skip/.test(x)), c.id);
  }
});
