// Look Book studio: options, defaults, every choice matters, no skin-type filtering, safety notes and the audited guides.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLookPlan, looksOptions, searchLooks, lipColour, coloursIn, CATEGORIES, TIMES, SKILLS, SEASONS } from '../src/looks/studio.js';
import { MONK_TONES } from '../src/skin/clinic.js';
import * as looks from '../src/look_styles.js';
import * as tutorials from '../src/beauty_tutorials.js';

const shown = p => { const { choices, ...rest } = p; return JSON.stringify(rest); };
const DEFAULTS = { community: 'west_african', category: 'any', time: 'any', skill: '5', season: 'any', tone: 'mst7', look: 'asoebi_glam', lip: '0', practise: 'cut_crease_tutorial' };
const text = m => JSON.stringify(Object.fromEntries(Object.entries(m).filter(([, v]) => typeof v !== 'function')));

test('options list every community, category, time, level, season, tone and look', () => {
  const o = looksOptions();
  assert.equal(o.communities.length, 9); assert.equal(o.categories.length, 11); assert.equal(o.times.length, 6);
  assert.equal(o.skills.length, 5); assert.equal(o.seasons.length, 5); assert.equal(o.tones.length, 10); assert.equal(o.looks.length, 38);
});

test('the defaults are what an empty request gets, and bad values fall back to them', () => {
  assert.deepEqual(buildLookPlan({}).choices, DEFAULTS);
  assert.deepEqual(buildLookPlan({ community: 'nowhere', category: 'goth', time: '7', skill: '9', season: 'monsoon', tone: 'x', look: 'nope', lip: '42', practise: 'x' }).choices, DEFAULTS);
  assert.deepEqual(buildLookPlan(null).choices, DEFAULTS);
});

test('every value of every choice changes the plan or the picture', () => {
  const base = buildLookPlan({}); const b = shown(base);
  const values = {
    community: looksOptions().communities.map(c => c.id), category: CATEGORIES.map(c => c.id), time: TIMES.map(t => t.id),
    skill: SKILLS.map(s => s.id), season: SEASONS.map(s => s.id), tone: MONK_TONES.map(t => t.id),
    look: base.matches.map(m => m.id), lip: base.look.lips.map(l => l.id), practise: base.related.map(r => r.id),
  };
  for (const [k, list] of Object.entries(values)) {
    for (const v of list) {
      if (v === DEFAULTS[k]) continue;
      assert.notEqual(shown(buildLookPlan({ ...DEFAULTS, [k]: v })), b, `${k}=${v} changed nothing`);
    }
  }
  // and on another look: every lip and every tutorial changes something
  const k = buildLookPlan({ community: 'south_asian', look: 'bollywood_bridal' });
  for (const l of k.look.lips) for (const r of k.related) assert.ok(buildLookPlan({ community: 'south_asian', look: 'bollywood_bridal', lip: l.id, practise: r.id }).picture.lip);
  const seen = new Set(k.look.lips.map(l => shown(buildLookPlan({ community: 'south_asian', look: 'bollywood_bridal', lip: l.id }))));
  assert.equal(seen.size, k.look.lips.length);
});

test('looks are never filtered by skin type or undertone', () => {
  const L = Object.values(looks.LOOK_STYLES);
  for (const l of L) {
    assert.deepEqual(l.undertones, ['all'], l.id);
    if (!['melanin_glow_universal', 'black_girl_magic'].includes(l.id)) assert.equal(l.fitzpatrickFit.length, 6, l.id);
  }
  for (const t of MONK_TONES) assert.equal(buildLookPlan({ community: 'east_asian', tone: t.id }).matches.length, buildLookPlan({ community: 'east_asian' }).matches.length);
  assert.equal(looks.getLooksByUndertone, undefined);
});

test('a filter that nothing meets shows the closest looks and says why', () => {
  const p = buildLookPlan({ community: 'east_african', category: 'vintage', time: '15' });
  assert.equal(p.fits, false); assert.ok(p.matches.length >= 1); assert.ok(p.misses.length >= 1);
  assert.match(p.message, /No East African look fits every filter/);
  const q = buildLookPlan({ community: 'latina', time: '15', skill: '1' });
  assert.equal(q.fits, true); assert.ok(q.matches.every(m => m.minutes <= 15 && m.difficulty <= 1));
});

test('order of application: eyes first for fallout-heavy eyes, base first for soft ones', () => {
  const a = buildLookPlan({ look: 'asoebi_glam' }); assert.equal(a.order.eyesFirst, true); assert.equal(a.order.steps[0].zone, 'eyes');
  const n = buildLookPlan({ look: 'no_makeup_makeup' }); assert.equal(n.order.eyesFirst, false); assert.equal(n.order.steps[0].zone, 'base');
  for (const l of Object.values(looks.LOOK_STYLES)) assert.equal(buildLookPlan({ community: l.community === 'all' ? 'west_african' : l.community.replace(/-/g, '_'), look: l.id }).order.steps.length, 6, l.id);
});

test('safety notes come from the look itself', () => {
  const ids = l => buildLookPlan({ community: l[0], look: l[1] }).safety.map(s => s.id);
  assert.ok(ids(['south_asian', 'bollywood_bridal']).includes('kohl'));
  assert.ok(ids(['caribbean', 'carnival_queen']).includes('gems'));
  assert.ok(ids(['caribbean', 'carnival_queen']).includes('glitter'));
  assert.ok(ids(['west_african', 'afrobeats_festival']).includes('brow-bleach'));
  assert.ok(ids(['south_asian', 'mehndi_look']).includes('henna'));
  assert.deepEqual(ids(['west_african', 'no_makeup_makeup']), []);
  assert.match(buildLookPlan({ community: 'south_asian', look: 'mehndi_look' }).safety.find(s => s.id === 'henna').text, /PPD/);
});

test('your tone changes the swatches, the shade notes and the deep-skin tutorial, never the looks', () => {
  assert.notEqual(lipColour('warm nude', '#f6ede4').hex, lipColour('warm nude', '#292420').hex);
  assert.equal(lipColour('classic red', '#f6ede4').hex, lipColour('classic red', '#292420').hex);
  assert.deepEqual(coloursIn('turquoise + fuchsia + gold'), ['#1fb5b0', '#d1246f', '#d4a937']);
  const deep = buildLookPlan({ tone: 'mst9' }); const light = buildLookPlan({ tone: 'mst2' });
  assert.ok(deep.related.some(r => r.id === 'foundation_deep_skin')); assert.ok(!light.related.some(r => r.id === 'foundation_deep_skin'));
  assert.ok(deep.shadeNotes.some(n => /ashy/.test(n.text)));
  assert.deepEqual(deep.matches, light.matches);
});

test('tutorials to practise follow the look', () => {
  const b = buildLookPlan({ community: 'south_asian', look: 'bollywood_bridal' }).related.map(r => r.id);
  assert.ok(b.includes('kohl_eye_tutorial') && b.includes('ubtan_face_mask') && b.includes('dark_skin_bold_lip'));
  const m = buildLookPlan({ community: 'south_asian', look: 'mehndi_look' }).related.map(r => r.id);
  assert.ok(m.includes('mehndi_basic_tutorial'));
  const p = buildLookPlan({ community: 'south_asian', look: 'bollywood_bridal', practise: 'kohl_eye_tutorial' }).practise;
  assert.equal(p.steps.length, 6); assert.ok(p.warnings.some(w => /lead/.test(w)));
});

test('search finds looks by word', () => {
  assert.equal(searchLooks('bridal').results.length, 4);
  assert.ok(searchLooks('eid').results.some(r => r.id === 'eid_festive'));
  assert.deepEqual(searchLooks('ab').results, []);
});

test('the audit holds: no brand lists, no attached celebrities, no invented ages or medical claims', () => {
  const L = text(looks); const T = text(tutorials);
  for (const bad of ['120+', 'porcelain', 'fair complexion', 'inspoArtists', '"products"', 'quintessential', 'globally recognised for beauty', 'globally unique', 'Timiral', 'qimem']) assert.ok(!L.includes(bad), bad);
  for (const bad of ['3,000 years', '4,000', 'eczema relief', 'acne treatment', 'push impurities', 'antibacterial boost', 'purging', 'scalp health, hair growth', 'opens the hair cuticle', 'Water stops the oxidation', 'every day for the 2 weeks', 'banana or translucent']) assert.ok(!T.includes(bad), bad);
  assert.equal(looks.LOOK_STYLES.amapiano_beat.community, 'south-african');
  assert.ok(tutorials.TUTORIALS.kohl_eye_tutorial.warnings.some(w => /lead/.test(w)));
  assert.ok(tutorials.TUTORIALS.mehndi_basic_tutorial.warnings.some(w => /PPD/.test(w)));
  assert.equal(looks.getSimilarLooks('asoebi_glam', 'x').length, 4);
});
