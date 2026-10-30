// Bridal Countdown: options, defaults, every choice matters, and the timing rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBridalPlan, bridalOptions, TIME_LEFT, HAIR_TYPES, STYLES } from '../src/bridal/studio.js';
import { FITZPATRICK, MONK_TONES } from '../src/skin/clinic.js';

const shown = p => { const { choices, ...rest } = p; return JSON.stringify(rest); };
const DEFAULTS = { time: '6m', fitzpatrick: 'V', hairType: '4B', style: 'twist-out-braid-out', community: 'west_african', tone: 'mst7' };

test('options list every choice, with the 9 communities and 10 Monk tones', () => {
  const o = bridalOptions();
  assert.equal(o.communities.length, 9); assert.equal(o.tones.length, 10);
  assert.equal(o.time.length, 7); assert.equal(o.hairTypes.length, 8); assert.equal(o.styles.length, 8);
});

test('the defaults are what an empty request gets, and bad values fall back to them', () => {
  assert.deepEqual(buildBridalPlan({}).choices, DEFAULTS);
  assert.deepEqual(buildBridalPlan({ time: '2y', fitzpatrick: 'VII', hairType: '5A', style: 'mohawk', tone: 'x' }).choices, DEFAULTS);
});

test('every value of every choice changes the plan or the picture', () => {
  const values = {
    time: TIME_LEFT.map(x => x.id), fitzpatrick: FITZPATRICK, hairType: HAIR_TYPES.map(x => x.id), style: STYLES.map(x => x.id),
    community: bridalOptions().communities.map(c => c.id), tone: MONK_TONES.map(t => t.id),
  };
  const base = shown(buildBridalPlan(DEFAULTS));
  for (const [k, list] of Object.entries(values)) {
    for (const v of list) {
      if (v === DEFAULTS[k]) continue;
      assert.notEqual(shown(buildBridalPlan({ ...DEFAULTS, [k]: v })), base, `${k}=${v} changed nothing`);
    }
  }
});

test('lead-time tasks become too late only when the time has passed', () => {
  const late = t => buildBridalPlan({ time: t }).countdown.tooLate.join(' ');
  assert.equal(late('12m'), ''); assert.equal(late('6m'), '');
  assert.match(late('3m'), /6\+ months/); assert.doesNotMatch(late('3m'), /start NOW/);
  assert.match(late('1m'), /laser hair removal, start NOW/);
  assert.match(buildBridalPlan({ time: '1m' }).countdown.catchUp.join(), /Book your bridal MUA/);
});

test('skin plan follows Fitzpatrick type and the time left; the final month has no actives', () => {
  assert.equal(buildBridalPlan({ fitzpatrick: 'VI' }).skin.group, 'Deep Ebony to Deep Brown');
  assert.equal(buildBridalPlan({ fitzpatrick: 'IV' }).skin.group, 'Warm Medium to Brown');
  assert.equal(buildBridalPlan({ fitzpatrick: 'II' }).skin.group, 'Fair to Olive');
  assert.ok(buildBridalPlan({ time: '1w' }).skin.noActives); assert.ok(!buildBridalPlan({ time: '12m' }).skin.noActives);
  assert.deepEqual(buildBridalPlan({ fitzpatrick: 'VI' }).skin.safeLasers, ['Nd:YAG']);
  assert.ok(buildBridalPlan({ fitzpatrick: 'II' }).skin.safeLasers.includes('Alexandrite'));
  const deep = JSON.stringify(buildBridalPlan({ fitzpatrick: 'VI', time: '3m' }).skin);
  assert.doesNotMatch(deep, /IPL \(|12% glycolic|10–15% glycolic/);
});

test('hair style is checked against hair type; extensions always fit', () => {
  assert.equal(buildBridalPlan({ hairType: '3A', style: 'twist-out-braid-out' }).hair.suited, false);
  assert.ok(buildBridalPlan({ hairType: '3A' }).hair.alternatives.includes('Wash-and-Go'));
  assert.equal(buildBridalPlan({ hairType: 'straight', style: 'clip-ins' }).hair.suited, true);
  assert.equal(buildBridalPlan({ hairType: 'straight' }).hair.prep, null);
});

test('community adds traditions only; no bleaching, de-tan or lightening steps anywhere', () => {
  for (const c of bridalOptions().communities) {
    for (const t of TIME_LEFT) {
      const s = JSON.stringify(buildBridalPlan({ community: c.id, time: t.id }));
      assert.doesNotMatch(s, /body bleach|de-tan|lightening treatment|applicableCommunities|"communities":/i, `${c.id}/${t.id}`);
    }
  }
});
