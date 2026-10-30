// Skin Clinic (src/skin/clinic.js): plans for marks, melasma, sun, breakouts, barrier, eczema, rosacea.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSkinPlan, skinClinicOptions, ingredientLabel, ingredientTiers, parseDurations, CONCERNS, FITZPATRICK, ACNE_LEVELS,
} from '../src/skin/clinic.js';
import { getTreatmentTimeline } from '../src/hyperpigmentation_ethnic_guide.js';

const shown = p => { const { choices, ...rest } = p; return JSON.stringify(rest); };
const base = { concern: 'marks', fitzpatrick: 'V', community: 'west_african', acneLevel: 'step1', tone: 'mst8' };

test('guide durations become weeks', () => {
  assert.deepEqual(parseDurations('4–8 weeks for initial improvement. 3–4 months for significant fading.').map(d => [d.from, d.to]), [[4, 8], [13, 17]]);
  assert.deepEqual(parseDurations('12–24 months').map(d => [d.from, d.to]), [[52, 104]]);
  assert.deepEqual(parseDurations('8-12 weeks to see results'), [{ from: 8, to: 12, text: '8-12 weeks' }]);
  assert.deepEqual(parseDurations('Ongoing'), []);
});

test('the community timeline is used when the guide has one, the general one otherwise', () => {
  const wa = buildSkinPlan(base);
  assert.equal(wa.timeline.source, 'community');
  assert.equal(wa.timeline.text, getTreatmentTimeline('west-african').mild_pih);
  assert.deepEqual(wa.timeline.points.map(p => p.text), ['4–8 weeks', '3–4 months']);
  const ea = buildSkinPlan({ ...base, community: 'east_asian' });
  assert.equal(ea.timeline.source, 'general');
  assert.match(ea.timeline.text, /^Epidermal PIH/);
  const none = buildSkinPlan({ ...base, concern: 'sun_damage' });
  assert.equal(none.timeline.text, null, 'no timeline is invented when the guide has none');
  assert.equal(none.timeline.points.length, 0);
});

test('ingredient tiers follow the Fitzpatrick type', () => {
  assert.equal(ingredientLabel('mandelic-acid-5-10-pct'), 'Mandelic acid 5–10%');
  assert.equal(ingredientLabel('vitamin-c-l-ascorbic-acid'), 'Vitamin C (L-ascorbic acid)');
  const light = ingredientTiers('II'); const deep = ingredientTiers('VI');
  assert.ok(!light.some(t => t.tier === 'expert'), 'types I–III have no expert-only tier in the guide');
  assert.ok(deep.find(t => t.tier === 'expert').items.includes('Hydroquinone'));
  assert.ok(deep.find(t => t.tier === 'avoid').items.includes('IPL (intense pulsed light)'));
  assert.ok(!light.find(t => t.tier === 'avoid').items.includes('IPL (intense pulsed light)'));
  for (const f of FITZPATRICK) assert.ok(ingredientTiers(f).find(t => t.tier === 'safe').items.includes('Niacinamide'));
});

test('deeper skin: hydroquinone and white-cast warnings; melasma gets iron-oxide SPF', () => {
  const v = buildSkinPlan(base);
  assert.equal(v.warnings[0].why, 'Hydroquinone on deeper skin');
  assert.match(v.warnings[0].text, /Ochronosis/);
  assert.ok(v.spf.whiteCast);
  const ii = buildSkinPlan({ ...base, fitzpatrick: 'II' });
  assert.ok(!ii.warnings.some(w => /Hydroquinone/.test(w.why)));
  assert.equal(ii.spf.whiteCast, null);
  const mel = buildSkinPlan({ ...base, concern: 'melasma' });
  assert.match(mel.spf.visibleLight, /iron oxides/);
  assert.ok(mel.routine.am.some(x => /iron oxides/.test(x)));
});

test('acne follows the treatment ladder; barrier stops actives first', () => {
  const steps = ACNE_LEVELS.map(l => buildSkinPlan({ ...base, concern: 'acne', acneLevel: l.id }));
  assert.equal(new Set(steps.map(p => p.title)).size, 3);
  assert.ok(steps[0].routine.am.some(x => /Salicylic acid/.test(x)));
  assert.ok(steps[2].routine.am.some(x => /Oral antibiotics/.test(x)));
  assert.ok(steps[0].seeDerm.some(x => /cystic/i.test(x)));
  const b = buildSkinPlan({ ...base, concern: 'barrier' });
  assert.equal(b.warnings[0].why, 'Stop actives first');
  assert.ok(!b.routine.am.some(x => /acid|retin/i.test(x)));
});

test('every option the view shows changes what the plan shows', () => {
  const o = skinClinicOptions();
  assert.equal(o.tones.length, 10);
  assert.equal(o.communities.length, 9);
  const every = {
    concern: CONCERNS.map(c => c.id), fitzpatrick: FITZPATRICK, community: o.communities.map(c => c.id), tone: o.tones.map(t => t.id),
  };
  for (const [k, values] of Object.entries(every)) {
    const seen = new Set(values.map(v => shown(buildSkinPlan({ ...base, [k]: v }))));
    assert.equal(seen.size, values.length, `each ${k} gives its own plan`);
  }
  const acne = new Set(ACNE_LEVELS.map(l => shown(buildSkinPlan({ ...base, concern: 'acne', acneLevel: l.id }))));
  assert.equal(acne.size, ACNE_LEVELS.length);
});

test('no plan carries an undefined or an [object Object]', () => {
  const o = skinClinicOptions();
  for (const c of o.communities) for (const k of CONCERNS) for (const f of FITZPATRICK) {
    const s = JSON.stringify(buildSkinPlan({ community: c.id, concern: k.id, fitzpatrick: f }));
    assert.ok(!s.includes('[object'), `${c.id}/${k.id}/${f}`);
  }
  for (const k of CONCERNS) { const p = buildSkinPlan({ concern: k.id }); assert.ok(p.routine.am.length >= 3 && p.routine.pm.length >= 2, k.id); }
});

test('junk input falls back to safe defaults', () => {
  const p = buildSkinPlan({ concern: 'x', fitzpatrick: 9, acneLevel: {}, tone: 'nope' });
  assert.deepEqual(p.choices, { concern: 'marks', fitzpatrick: 'V', community: 'west_african', acneLevel: 'step1', tone: 'mst8' });
});
