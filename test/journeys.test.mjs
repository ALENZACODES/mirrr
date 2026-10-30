// Natural Hair Journeys (src/hairlab/journeys.js): timelines built from the hair guides' own figures.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildJourney, journeyOptions, longevityWeeks, installHours, CM_PER_MONTH, MIN_BREAK_WEEKS, JOURNEYS, SCALP, STRANDS, LOC_METHODS, INSTALL_HOURS,
} from '../src/hairlab/journeys.js';
import { HAIR_GROWTH_SCIENCE } from '../src/hair_growth_guide.js';
import { LOCS_GUIDE, getLocsStageByMonth } from '../src/protective_styles_extended.js';

const shown = p => { const { choices, ...rest } = p; return JSON.stringify(rest); };
const base = { journey: 'protective_rotation', community: 'west_african', texture: 'type_4a', installHours: 4, months: 0, edges: 'full', scalp: 'none', locMethod: 'starter', strand: 'medium', relaxedCm: 15, goalCm: 10 };

test('durations are parsed from the guides, not typed in', () => {
  assert.equal(CM_PER_MONTH, 1.27);
  assert.ok(HAIR_GROWTH_SCIENCE.growth_rate.scalp_hair.includes(`${CM_PER_MONTH}cm`));
  assert.equal(MIN_BREAK_WEEKS, 2);
  assert.equal(longevityWeeks('6–8 weeks properly maintained; remove by week 8–10 at maximum'), 8);
  assert.equal(longevityWeeks('1–3 weeks as twists; can be unravelled into a twist-out'), 3);
  assert.equal(longevityWeeks('2–3 months'), 12);
  assert.equal(longevityWeeks(''), null);
  assert.deepEqual(installHours('4–8 hours (size dependent)'), { min: 4, max: 8 });
});

test('rotation: styles match the exact curl type and the hours you can sit', () => {
  const at = (texture, h) => buildJourney({ ...base, texture, installHours: h }).styles.map(s => s.name);
  assert.deepEqual(at('type_4a', 2), ['Cornrows', 'Two-Strand Twists', 'Flat Twists']);
  assert.deepEqual(at('type_4a', 5), ['Box Braids', 'Senegalese Twists', 'Marley Twists']);
  assert.ok(!at('type_4c', 2).includes('Flat Twists'), 'flat twists are not listed for 4C');
  assert.deepEqual(at('type_3b', 2), ['Flat Twists']);
  const straight = buildJourney({ ...base, texture: 'type_1a' });
  assert.equal(straight.styles.length, 0);
  assert.match(straight.noStyles, /wig over flat cornrows/);
  for (const h of INSTALL_HOURS) for (const s of buildJourney({ ...base, installHours: h }).styles) assert.ok(installHours(s.install).min <= h, `${s.name} installs within ${h}h`);
});

test('rotation: a break of at least the guide minimum after every install', () => {
  const p = buildJourney(base);
  const t = p.timeline;
  for (let i = 0; i < t.length; i++) {
    if (i) assert.equal(t[i].from, t[i - 1].to, 'segments are back to back');
    if (t[i].kind === 'style') { assert.equal(t[i + 1].kind, 'break'); assert.ok(t[i + 1].to - t[i + 1].from >= MIN_BREAK_WEEKS); }
  }
  assert.equal(p.total, t.at(-1).to);
  const later = buildJourney({ ...base, months: 3 });
  assert.equal(later.now, 13);
  assert.ok(later.now >= later.current.from && later.now < later.current.to);
  assert.equal(later.timeline[later.currentIndex], later.current, 'exactly one segment is marked current');
});

test('thinning edges: tension-free break first, no braids, warnings', () => {
  const p = buildJourney({ ...base, edges: 'thinning', installHours: 5 });
  assert.equal(p.timeline[0].label, 'Tension-free break');
  assert.ok(p.styles.every(s => !/braid|cornrow/i.test(s.name)));
  assert.ok(p.excluded.includes('Box Braids'));
  assert.ok(p.warnings.some(w => /Stop tight styles/.test(w.text)));
  assert.ok(p.warnings.some(w => /Lace adhesives/.test(w.text)));
  assert.equal(buildJourney(base).warnings.length, 0);
});

test('locs: months map to the guide stages and the next one', () => {
  for (const [months, stage] of [[0, 'Starter'], [6, 'Budding'], [8, 'Budding'], [13, 'Teen'], [20, 'Mature'], [30, 'Rooted']]) {
    const p = buildJourney({ ...base, journey: 'locs', months });
    assert.equal(p.current.label, stage, `${months} months`);
  }
  assert.equal(getLocsStageByMonth(0).stage, 'Starter', 'the guide helper no longer reads month 0 as missing');
  assert.equal(getLocsStageByMonth(30).stage, 'Rooted');
  const p = buildJourney({ ...base, journey: 'locs', months: 8 });
  assert.deepEqual(p.next, { label: 'Teen', inMonths: 4 });
  assert.equal(p.timeline.length, LOCS_GUIDE.stages.length);
  const names = new Set(LOC_METHODS.map(m => buildJourney({ ...base, journey: 'locs', locMethod: m.id }).method.name));
  assert.equal(names.size, LOC_METHODS.length);
});

test('relaxed to natural: months to grow out at 1.27 cm a month', () => {
  const p = buildJourney({ ...base, journey: 'transition', relaxedCm: 15, months: 6 });
  assert.equal(p.monthsToAllNatural, 12); // 15 / 1.27 = 11.8
  assert.equal(p.grownCm, 7.6);
  assert.equal(p.remainingMonths, 6);
  assert.equal(buildJourney({ ...base, journey: 'transition', relaxedCm: 30, months: 24 }).remainingMonths, 0);
  assert.ok(p.actions.some(a => /big chop/i.test(a)));
});

test('silk press: the heat ceiling follows the strand', () => {
  const temp = strand => buildJourney({ ...base, journey: 'silk_press', strand }).temperatures.yours;
  assert.match(temp('medium'), /^180-200°C/);
  assert.match(temp('fine'), /^Fine hair: max 150°C/);
  assert.match(temp('bleached'), /^Bleached hair: max 180°C/);
  const p = buildJourney({ ...base, journey: 'silk_press' });
  assert.equal(p.unit, 'steps');
  assert.equal(p.now, null, 'no invented schedule for a press');
});

test('keeping length: months to the goal', () => {
  assert.equal(buildJourney({ ...base, journey: 'length_retention', goalCm: 10 }).monthsToGoal, 8);
  assert.equal(buildJourney({ ...base, journey: 'length_retention', goalCm: 30 }).monthsToGoal, 24);
});

test('scalp: each concern has its own guidance; three send you to a doctor', () => {
  const plans = SCALP.map(s => buildJourney({ ...base, scalp: s.id }));
  assert.equal(new Set(plans.map(p => p.scalp.title)).size, SCALP.length);
  assert.deepEqual(SCALP.filter((s, i) => plans[i].scalp.seeDoctor).map(s => s.id), ['thick_scale', 'patches', 'scaly_patch_broken']);
  for (const p of plans) assert.ok(p.scalp.points.length >= 3 && p.scalp.points.every(x => typeof x === 'string' && x.length >= 8));
  assert.equal(plans.find(p => p.scalp.seeDoctor).warnings[0].why, 'See a doctor first');
});

test('every option the view shows changes what the journey shows', () => {
  const o = journeyOptions();
  const controls = {
    protective_rotation: { texture: ['type_3b', 'type_4a', 'type_4c', 'type_1a'], installHours: INSTALL_HOURS, months: [0, 1, 2, 3, 4, 5, 6] },
    locs: { locMethod: LOC_METHODS.map(m => m.id), months: [0, 3, 6, 9, 12, 18, 24, 30] },
    transition: { relaxedCm: [5, 10, 15, 20, 30], months: [0, 3, 6, 9, 12, 18, 24] },
    silk_press: { strand: STRANDS.map(s => s.id) },
    length_retention: { goalCm: [5, 10, 15, 20, 30], months: [0, 3, 6, 9, 12, 18, 24] },
  };
  for (const j of JOURNEYS) {
    const every = { ...controls[j.id], community: o.communities.map(c => c.id), edges: o.edges, scalp: o.scalp.map(s => s.id) };
    for (const [k, values] of Object.entries(every)) {
      const seen = new Set(values.map(v => shown(buildJourney({ ...base, journey: j.id, [k]: v }))));
      assert.equal(seen.size, values.length, `${j.id}: each ${k} gives its own journey`);
    }
  }
});

test('junk input falls back to safe defaults', () => {
  const p = buildJourney({ journey: 'x', texture: 'nope', months: 'lots', installHours: 99, edges: 1, scalp: {}, strand: null, relaxedCm: -4 });
  assert.equal(p.choices.journey, 'protective_rotation');
  assert.equal(p.choices.texture, 'type_4a');
  assert.equal(p.choices.months, 0);
  assert.equal(p.choices.installHours, 4);
  assert.equal(p.choices.relaxedCm, 1);
  assert.equal(buildJourney().community.id, 'west_african');
});
