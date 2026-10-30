// Eco Beauty planner: options, defaults, every choice matters, and the audited guide content.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEcoPlan, ecoOptions, lookupEcoTerm, SWAPS, SEASON_IDS, INGREDIENT_SLUGS, HAIR, FOCUS } from '../src/eco/studio.js';
import { FITZPATRICK, MONK_TONES } from '../src/skin/clinic.js';
import * as ethnic from '../src/eco_sustainable_beauty_ethnic_guide.js';
import * as guide from '../src/eco_beauty_guide.js';
import * as sust from '../src/eco_sustainable_beauty.js';
import * as waterless from '../src/waterless_beauty_ethnic_guide.js';

const shown = p => { const { choices, ...rest } = p; return JSON.stringify(rest); };
const DEFAULTS = { swap: 'shampoo', community: 'west_african', season: 'autumn', ingredient: 'shea-butter', focus: 'plastic', hair: 'type4', fitzpatrick: 'V', tone: 'mst7' };
const text = m => JSON.stringify(Object.fromEntries(Object.entries(m).filter(([, v]) => typeof v !== 'function')));

test('options list every swap, community, season, ingredient, focus, hair type and tone', () => {
  const o = ecoOptions();
  assert.equal(o.swaps.length, 7); assert.equal(o.communities.length, 9); assert.equal(o.seasons.length, 4);
  assert.equal(o.ingredients.length, 32); assert.equal(o.focus.length, 4); assert.equal(o.hair.length, 3);
  assert.equal(o.fitzpatrick.length, 6); assert.equal(o.tones.length, 10);
  assert.ok(o.ingredients.every(i => i.label && !i.label.includes('undefined')));
});

test('the defaults are what an empty request gets, and bad values fall back to them', () => {
  assert.deepEqual(buildEcoPlan({}).choices, DEFAULTS);
  assert.deepEqual(buildEcoPlan({ swap: 'x', community: 'nowhere', season: 'monsoon', ingredient: 'plastic', focus: 9, hair: 'type9', fitzpatrick: 'VII', tone: 'x' }).choices, DEFAULTS);
});

test('every value of every choice changes the plan or the picture', () => {
  const values = {
    swap: SWAPS.map(s => s.id), community: ecoOptions().communities.map(c => c.id), season: SEASON_IDS, ingredient: INGREDIENT_SLUGS,
    focus: FOCUS.map(f => f.id), hair: HAIR.map(h => h.id), fitzpatrick: FITZPATRICK, tone: MONK_TONES.map(t => t.id),
  };
  const base = shown(buildEcoPlan(DEFAULTS));
  for (const [k, list] of Object.entries(values)) {
    for (const v of list) {
      if (v === DEFAULTS[k]) continue;
      assert.notEqual(shown(buildEcoPlan({ ...DEFAULTS, [k]: v })), base, `${k}=${v} changed nothing`);
    }
  }
});

test('every community gets a starter kit, key ingredients and a waterless routine', () => {
  for (const c of ecoOptions().communities) {
    const p = buildEcoPlan({ community: c.id }).community;
    assert.ok(p.kit && p.kit.products.length >= 3, `${c.id} kit`);
    assert.ok(p.ingredients.length >= 2, `${c.id} ingredients`);
    assert.ok(p.waterless.length >= 1, `${c.id} waterless`);
  }
});

test('every ingredient names its communities and at least one use from the guides', () => {
  for (const slug of INGREDIENT_SLUGS) {
    const g = buildEcoPlan({ ingredient: slug }).ingredient;
    assert.ok(g.communities.length >= 1, slug);
    assert.ok(g.uses.some(u => u.notes || u.uses.length), `${slug} has no guide text`);
  }
  const shea = buildEcoPlan({ ingredient: 'shea-butter' }).ingredient;
  assert.ok(shea.sourcing && shea.ethical && shea.climateThreat && shea.deepDive);
  assert.equal(buildEcoPlan({ ingredient: 'moringa' }).ingredient.resilient.rank, 1);
});

test('hair type picks the wash-day technique; Type 4 gets the scalp spritz instead of dry shampoo', () => {
  const four = buildEcoPlan({ hair: 'type4' }).hair; const one = buildEcoPlan({ hair: 'type12' }).hair;
  assert.match(four.extend, /7-14 days/); assert.match(four.dryShampoo.join(' '), /spritz/);
  assert.match(one.extend, /1-2 days/); assert.match(one.dryShampoo.join(' '), /Starch/);
});

test('sunscreen note: deeper types get the white-cast guidance, lighter types do not', () => {
  const v = buildEcoPlan({ fitzpatrick: 'V' }).sun; const i = buildEcoPlan({ fitzpatrick: 'I' }).sun;
  assert.match(v.whiteCastRisk, /Severe/); assert.ok(v.mineral);
  assert.equal(i.whiteCastRisk, 'Low'); assert.equal(i.mineral, null); assert.match(i.forYou, /Type I\b/);
  assert.match(v.reef, /oxybenzone/);
});

test('the eco glossary lookup finds terms and says so when it does not', () => {
  assert.match(lookupEcoTerm('upcycling').entry.definition, /./);
  assert.equal(lookupEcoTerm('zzzz').entry, null);
  assert.equal(lookupEcoTerm('a').entry, null);
});

test('the audit removed the claims it set out to remove', () => {
  const all = [ethnic, guide, sust, waterless].map(text).join(' ');
  for (const bad of [
    /Chanel/, /Laline/, /Dounia/, /Likami/, /Blithe/, /Dr\. Sebi/, /Monoi/, /Pholk/, /Undefined Beauty/, /Ruka\b/, /Michelle Ranavat/,
    /endocrine disruption/, /orders of magnitude/, /nutrient-dense food known/, /zeatin/i, /cytokinin/i, /charcoal toothpaste/, /teeth whitening/,
    /6,000 women|members":6000/, /87,000/, /3,600\+/, /60-80%/, /critically endangered/i, /Turbo Malone/,
    /roots fix nitrogen/, /the Sahara/, /intoxicating/, /decades younger/, /world's oldest/, /richest plant source/, /1\/10th/, /Stretch mark prevention/, /raspberry seed oil/i,
    /ultimate food-waste/, /Japanese beauty philosophy.*more sustainable/, /particular pride/, /Rooibos Act/, /Dhofar/,
  ]) assert.doesNotMatch(all, bad, String(bad));
  assert.match(all, /Vulnerable by the IUCN/);
  assert.match(all, /Richelieu Dennis/);
  assert.match(all, /Priscilla Tsai/);
  assert.match(all, /2017–2018 Cape Town drought/);
});
