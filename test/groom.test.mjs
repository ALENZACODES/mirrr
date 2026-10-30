// Grooming Studio: options, defaults, every choice matters, beard texture is the reader's own pick,
// razor-bump risk, safe oil dilution, the week and the audited grooming guides.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGroomPlan, groomOptions, bumpRisk, searchGroom, GOALS } from '../src/groom/studio.js';
import * as beard from '../src/beard_grooming_ethnic.js';
import * as mens from '../src/mens_grooming_ethnic_guide.js';

const shown = p => { const { choices, ...rest } = p; return JSON.stringify(rest); };
const DEFAULTS = { texture: 'wavy', goal: 'short_box_beard', tool: 'single_blade', direction: 'with', problem: 'bumps', scent: 'none', heritage: 'none', tone: 'mst7' };
const FIELDS = { textures: 'texture', goals: 'goal', tools: 'tool', directions: 'direction', problems: 'problem', scents: 'scent', heritages: 'heritage', tones: 'tone' };
const text = m => JSON.stringify(Object.fromEntries(Object.entries(m).filter(([, v]) => typeof v !== 'function')));

test('options list every texture, look, tool, direction, problem, scent, heritage and tone', () => {
  const o = groomOptions();
  assert.equal(o.textures.length, 3); assert.equal(o.goals.length, 8); assert.equal(o.tools.length, 4); assert.equal(o.directions.length, 2);
  assert.equal(o.problems.length, 6); assert.equal(o.scents.length, 5); assert.equal(o.heritages.length, 10); assert.equal(o.tones.length, 10);
  assert.ok(o.goals.every(g => g.risk === undefined && g.shaves === undefined), 'internal scores stay on the server');
});

test('the defaults are what an empty request gets, and bad values fall back to them', () => {
  assert.deepEqual(buildGroomPlan({}).choices, DEFAULTS);
  assert.deepEqual(buildGroomPlan(null).choices, DEFAULTS);
  assert.deepEqual(buildGroomPlan({ texture: 'x', goal: 'mullet', tool: 'axe', direction: 'up', problem: 'z', scent: 'oud', heritage: 'mars', tone: 'x' }).choices, DEFAULTS);
  assert.equal(buildGroomPlan({ heritage: 'black-american' }).choices.heritage, 'black_american');
});

test('every value of every choice changes the plan or the picture', () => {
  const o = groomOptions();
  for (const [list, field] of Object.entries(FIELDS)) {
    const seen = new Map();
    for (const v of o[list]) {
      const s = shown(buildGroomPlan({ [field]: v.id }));
      assert.ok(!seen.has(s), `${field}=${v.id} looks the same as ${field}=${seen.get(s)}`);
      seen.set(s, v.id);
    }
  }
});

test('beard texture is never set by heritage, and the guides no longer assign textures to communities', () => {
  for (const h of groomOptions().heritages) {
    const p = buildGroomPlan({ heritage: h.id });
    assert.equal(p.texture.id, 'wavy'); assert.equal(p.risk.score, buildGroomPlan({}).risk.score);
    if (h.id !== 'none') assert.ok(p.heritage.rituals.length > 0 || p.heritage.beardTradition);
  }
  for (const t of Object.values(beard.BEARD_BIOLOGY.texture)) assert.ok(!/West African|East Asian|South Asian|Arab|Latina|Black American/.test(t), t);
  for (const c of Object.values(beard.ETHNIC_BEARD_CULTURE)) assert.equal(c.common_concerns, undefined);
  for (const g of Object.values(mens.ETHNIC_MENS_GROOMING_GUIDES)) assert.equal(g.commonConcerns, undefined);
  assert.ok(!/Bevel|Bump Patrol|Amouage|Scotch Porter|COSRX|Laneige|commands respect|very prevalent/.test(text(mens) + text(beard)));
  assert.equal(mens.MENS_GROOMING_STATS, undefined); assert.equal(beard.BEARD_GROOMING_STATS, undefined);
});

test('razor-bump risk rises with coily hair, close shaving, multi-blades and against the grain', () => {
  const base = { texture: 'straight', goal: 'full_beard', tool: 'clipper', direction: 'with', problem: 'none' };
  assert.equal(bumpRisk(base).level, 'low');
  const worst = bumpRisk({ texture: 'coily', goal: 'clean_shave', tool: 'multi_blade', direction: 'against', problem: 'bumps' });
  assert.equal(worst.level, 'high'); assert.equal(worst.score, 10);
  assert.ok(bumpRisk({ ...base, texture: 'coily' }).score > bumpRisk(base).score);
  const p = buildGroomPlan({ texture: 'coily', goal: 'clean_shave', direction: 'against', tool: 'multi_blade' });
  assert.ok(p.warnings.some(w => /Against the grain/.test(w))); assert.ok(p.warnings.some(w => /ingrown/.test(w)));
  assert.equal(p.week.filter(w => w.shave).length, 3, 'high risk spaces shaves three days apart');
  assert.equal(buildGroomPlan({ texture: 'straight', goal: 'clean_shave', problem: 'none', tool: 'electric' }).week.filter(w => w.shave).length, 7);
});

test('beard oil stays dilute and an uncut beard gets no razor', () => {
  for (const s of ['cedarwood', 'sandalwood', 'tea_tree', 'peppermint']) {
    const o = buildGroomPlan({ scent: s }).beard.oil;
    assert.equal(o.carriers.reduce((a, c) => a + c.ml, 0), 30);
    assert.ok(o.essential.drops <= 3, 'at most 3 drops per 30 ml (about 0.5%)');
  }
  const u = buildGroomPlan({ goal: 'uncut' });
  assert.equal(u.shaving, null); assert.ok(u.week.every(w => !w.shave)); assert.ok(u.growth);
  assert.equal(buildGroomPlan({ goal: 'clean_shave' }).beard, null);
  assert.ok(GOALS.length === 8);
});

test('search finds rituals and styles across communities', () => {
  assert.ok(searchGroom('hammam').results.some(r => r.community === 'Arab'));
  assert.ok(searchGroom('moustache').results.some(r => r.kind === 'style'));
  assert.deepEqual(searchGroom('ab').results, []);
});

test('the audited guides keep the corrected facts', () => {
  assert.match(mens.ETHNIC_MENS_GROOMING_GUIDES['south-asian'].beardCare.sikhBeardTradition.religioussignificance, /kesh/);
  assert.match(mens.ETHNIC_MENS_GROOMING_GUIDES['east-african'].traditionalPractices[2].description, /too rough for the face/);
  assert.match(beard.SHAVING_GUIDE.technique.finish, /calm redness/);
  assert.ok(!/tightens pores/.test(text(beard)));
  assert.ok(Array.isArray(beard.getEthnicBeardCulture('nowhere')));
  assert.equal(mens.getMensGroomingGuide('arab').communityId, 'arab');
});
