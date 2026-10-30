// Pregnancy & Postpartum planner: options, defaults, every choice matters, and the safety rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBumpPlan, bumpOptions, STAGES, CONCERNS, INGREDIENTS } from '../src/pregnancy/studio.js';
import { FITZPATRICK, MONK_TONES } from '../src/skin/clinic.js';

const shown = p => { const { choices, ...rest } = p; return JSON.stringify(rest); };
const DEFAULTS = { stage: 't2', concern: 'melasma', ingredient: 'retinoid', fitzpatrick: 'V', community: 'west_african', tone: 'mst7' };

test('options list every choice, with the 9 communities and 10 Monk tones', () => {
  const o = bumpOptions();
  assert.equal(o.communities.length, 9); assert.equal(o.tones.length, 10);
  assert.equal(o.stages.length, 5); assert.equal(o.concerns.length, 5); assert.equal(o.ingredients.length, INGREDIENTS.length);
});

test('the defaults are what an empty request gets, and bad values fall back to them', () => {
  assert.deepEqual(buildBumpPlan({}).choices, DEFAULTS);
  assert.deepEqual(buildBumpPlan({ stage: 't4', concern: 'x', ingredient: 'lead', fitzpatrick: 'VII', tone: 'x' }).choices, DEFAULTS);
});

test('every value of every choice changes the plan or the picture', () => {
  const values = {
    stage: STAGES.map(x => x.id), concern: CONCERNS.map(x => x.id), ingredient: INGREDIENTS.map(x => x.id),
    fitzpatrick: FITZPATRICK, community: bumpOptions().communities.map(c => c.id), tone: MONK_TONES.map(t => t.id),
  };
  const base = shown(buildBumpPlan(DEFAULTS));
  for (const [k, list] of Object.entries(values)) {
    for (const v of list) {
      if (v === DEFAULTS[k]) continue;
      assert.notEqual(shown(buildBumpPlan({ ...DEFAULTS, [k]: v })), base, `${k}=${v} changed nothing`);
    }
  }
});

test('every verdict quotes a guide sentence, and stages without a rule say so instead of guessing', () => {
  for (const ing of INGREDIENTS) {
    for (const s of STAGES) {
      const c = buildBumpPlan({ ingredient: ing.id, stage: s.id }).check;
      assert.ok(['ok', 'caution', 'avoid', 'ask'].includes(c.verdict), `${ing.id}/${s.id}`);
      assert.ok(typeof c.text === 'string' && c.text.length > 10, `${ing.id}/${s.id} has no source text`);
      if (c.verdict === 'ask') assert.match(c.text, /will not guess/);
    }
  }
});

test('the core safety rules', () => {
  const v = (ingredient, stage) => buildBumpPlan({ ingredient, stage }).check.verdict;
  for (const s of ['t1', 't2', 't3', 'bf']) { assert.equal(v('retinoid', s), 'avoid', s); assert.equal(v('hydroquinone', s), 'avoid', s); }
  assert.equal(v('retinoid', 'pp'), 'ok');
  for (const s of ['t1', 't2', 't3', 'bf', 'pp']) { assert.equal(v('mercury', s), 'avoid', s); assert.equal(v('azelaic', s), 'ok', s); assert.equal(v('mineralSpf', s), 'ok', s); }
  assert.equal(v('hairDye', 't1'), 'avoid'); assert.equal(v('hairDye', 't2'), 'caution'); assert.equal(v('hairDye', 'bf'), 'ask');
  assert.equal(v('clarySage', 't3'), 'avoid'); assert.equal(v('keratin', 't2'), 'avoid');
});

test('concern advice follows the stage', () => {
  assert.match(buildBumpPlan({ concern: 'melasma' }).concern.notNow.join(), /Hydroquinone/);
  assert.match(buildBumpPlan({ concern: 'melasma', stage: 'bf' }).concern.later, /tretinoin/);
  assert.match(buildBumpPlan({ concern: 'stretch', stage: 't1' }).concern.doNow[0], /^Weeks 12–16/);
  assert.match(buildBumpPlan({ concern: 'stretch', stage: 'pp' }).concern.doNow[0], /^After birth/);
  assert.match(buildBumpPlan({ concern: 'stretch' }).concern.expectations, /No cream is proven/);
  assert.ok(buildBumpPlan({ concern: 'hair', stage: 'bf' }).concern.seeDoctor.length > 0);
  assert.match(buildBumpPlan({ concern: 'itch', stage: 't3' }).concern.seeDoctor.join(), /cholestasis/);
});

test('melasma risk follows skin depth, not community', () => {
  assert.equal(buildBumpPlan({ fitzpatrick: 'II' }).melasma.higher, false);
  assert.equal(buildBumpPlan({ fitzpatrick: 'III' }).melasma.deeperSkin, null);
  assert.ok(buildBumpPlan({ fitzpatrick: 'VI' }).melasma.deeperSkin.strategies.length > 0);
  for (const c of bumpOptions().communities) assert.equal(buildBumpPlan({ community: c.id }).melasma.note, buildBumpPlan({}).melasma.note);
});

test('community adds traditions only: pregnancy ones while pregnant, postpartum ones after birth', () => {
  for (const c of bumpOptions().communities) {
    const a = buildBumpPlan({ community: c.id }).communityNotes; const b = buildBumpPlan({ community: c.id, stage: 'bf' }).communityNotes;
    assert.equal(a.kind, 'pregnancy'); assert.equal(b.kind, 'postpartum'); assert.ok(b.practices.length > 0, c.id);
    assert.ok(!/skinToneRange|hairTextures|predominant|(common|prevalent) (in|among) [A-Z][a-z]+ women/.test(JSON.stringify([a, b])), c.id);
  }
});
