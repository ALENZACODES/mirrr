// Nails & Scent Studio (src/nails/studio.js): manicure and fragrance from the nail and fragrance guides.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildNailScentPlan, nailScentOptions, nailColours, UNDERTONES, SHAPES, FINISHES, WEAR, NAIL_OCCASIONS, FAMILIES, SCENT_OCCASIONS, CLIMATES,
} from '../src/nails/studio.js';
import { FITZPATRICK, MONK_TONES } from '../src/skin/clinic.js';

const shown = p => { const { choices, ...rest } = p; return JSON.stringify(rest); };
const DEFAULTS = { fitzpatrick: 'V', undertone: 'warm', shape: 'oval', finish: 'creme', wear: 'natural', nailOccasion: 'minimal', family: 'woody', scentOccasion: 'office', climate: 'hot_humid', community: 'west_african', tone: 'mst7' };

test('options list every choice, with the 9 communities and 10 Monk tones', () => {
  const o = nailScentOptions();
  assert.equal(o.communities.length, 9); assert.equal(o.tones.length, 10);
  assert.deepEqual(o.shapes.map(s => s.id), ['coffin', 'almond', 'square', 'oval', 'stiletto', 'flare']);
  assert.equal(o.finishes.length, 9); assert.equal(o.wear.length, 6); assert.equal(o.families.length, 6);
  assert.ok(o.nailOccasions.length >= 5 && o.nailOccasions.every(x => typeof x.label === 'string'));
});

test('the defaults are what an empty request gets, and bad values fall back to them', () => {
  assert.deepEqual(buildNailScentPlan({}).choices, DEFAULTS);
  assert.deepEqual(buildNailScentPlan({ shape: 'heart', finish: 1, wear: 'glue', family: null, climate: 'mars', scentOccasion: {} }).choices, DEFAULTS);
});

test('every value of every choice changes the plan or the picture', () => {
  const values = {
    fitzpatrick: FITZPATRICK, undertone: UNDERTONES.map(x => x.id), shape: SHAPES.map(x => x.id), finish: FINISHES.map(x => x.id),
    wear: WEAR.map(x => x.id), nailOccasion: NAIL_OCCASIONS.map(x => x.id), family: FAMILIES.map(x => x.id),
    scentOccasion: SCENT_OCCASIONS.map(x => x.id), climate: CLIMATES.map(x => x.id),
    community: nailScentOptions().communities.map(c => c.id), tone: MONK_TONES.map(t => t.id),
  };
  const base = shown(buildNailScentPlan(DEFAULTS));
  for (const [k, list] of Object.entries(values)) {
    for (const v of list) {
      if (v === DEFAULTS[k]) continue;
      assert.notEqual(shown(buildNailScentPlan({ ...DEFAULTS, [k]: v })), base, `${k}=${v} changed nothing`);
    }
  }
});

test('nail colours follow depth and leave out what the undertone skips', () => {
  const fair = nailColours('I', 'neutral'); const deep = nailColours('VI', 'neutral');
  assert.match(fair.skin, /I-II/); assert.match(deep.skin, /V-VI/);
  assert.notDeepEqual(fair.everyday.map(c => c.word), deep.everyday.map(c => c.word));
  const warm = nailColours('I', 'warm');
  for (const g of ['everyday', 'statement', 'dark', 'flattering']) assert.ok(!warm[g].some(c => /^(cool|icy|baby blue|lilac|lavender|mint)/.test(c.word)));
  assert.ok(warm.skipped.length > 0);
  const cool = nailColours('V', 'cool');
  for (const g of ['everyday', 'statement', 'dark', 'flattering']) assert.ok(!cool[g].some(c => /^(warm|orange|coral|peach|mustard|bronze|copper|gold)/.test(c.word)));
  assert.ok(warm.everyday.every(c => /^#[0-9a-f]{6}$/.test(c.hex) && c.line));
});

test('long shapes on natural nails warn about length; enhancements and short shapes do not', () => {
  assert.match(buildNailScentPlan({ shape: 'stiletto', wear: 'natural' }).nails.wear.lengthWarning, /length/);
  assert.equal(buildNailScentPlan({ shape: 'stiletto', wear: 'acrylic' }).nails.wear.lengthWarning, null);
  assert.equal(buildNailScentPlan({ shape: 'square', wear: 'natural' }).nails.wear.lengthWarning, null);
});

test('every enhancement has a way to take it off safely', () => {
  for (const wear of ['soft_gel', 'acrylic', 'dip_powder', 'press_ons']) assert.ok(buildNailScentPlan({ wear }).nails.wear.removal.steps.length > 0, wear);
  assert.match(buildNailScentPlan({ wear: 'hard_gel' }).nails.wear.hardGelRemoval, /file/i);
  assert.equal(buildNailScentPlan({ wear: 'natural' }).nails.wear.removal, null);
});

test('dark streaks: normal note plus the doctor list for everyone; deep-skin cuticle note only for IV-VI', () => {
  const p = buildNailScentPlan({ fitzpatrick: 'II' }).nails;
  assert.ok(p.streaks.seeADoctor.some(s => /Hutchinson/.test(s)));
  assert.equal(p.cuticles.deepSkin, null);
  assert.ok(buildNailScentPlan({ fitzpatrick: 'VI' }).nails.cuticles.deepSkin);
});

test('scent: occasion sets concentration, climate sets amount, family sets pyramid notes', () => {
  assert.match(buildNailScentPlan({ scentOccasion: 'religious' }).scent.concentration.name, /Attar/);
  assert.equal(buildNailScentPlan({ scentOccasion: 'religious' }).scent.concentration.alcoholFree, true);
  assert.match(buildNailScentPlan({ scentOccasion: 'wedding' }).scent.concentration.name, /Parfum/);
  assert.match(buildNailScentPlan({ climate: 'hot_humid' }).scent.amount, /less/);
  assert.match(buildNailScentPlan({ climate: 'cold' }).scent.amount, /more/);
  const citrus = buildNailScentPlan({ family: 'citrus' }).scent;
  assert.ok(citrus.pyramid[0].mine.length > 0, 'citrus notes sit at the top');
  assert.ok(buildNailScentPlan({ family: 'oriental' }).scent.pyramid[2].mine.length > 0, 'amber notes sit at the base');
});

test('community adds traditions only; it never changes colours, shape or scent', () => {
  const a = buildNailScentPlan({ community: 'arab' }); const b = buildNailScentPlan({ community: 'east_asian' });
  assert.deepEqual(a.nails.colours, b.nails.colours); assert.deepEqual(a.scent, b.scent);
  assert.ok(a.communityNotes.gifting && a.communityNotes.gifting.gifts.length > 0);
  assert.ok(buildNailScentPlan({ community: 'south_asian', nailOccasion: 'bridal' }).nails.art.fromYourCommunity);
});
