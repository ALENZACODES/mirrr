// Taste Leap: options, defaults, every choice matters, taste is load-bearing, caching, honest source badges.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLeapPlan, leapOptions, tastePath, DESTINATIONS, STRENGTHS, PROFILES, _clearLeapCache } from '../src/leap/studio.js';
import { MONK_TONES } from '../src/skin/clinic.js';

const shown = p => { const { choices, ...rest } = p; return JSON.stringify(rest); };
const DEFAULTS = { profile: 'afrobeats', dest1: 'lagos', dest2: 'seoul', dest3: 'dubai', strength: 'half', tone: 'mst7', focus: '0' };
const noQloo = () => { throw new Error('pipeline must not be called'); };

test('options: demo profiles plus your own taste, twelve cities with looks, three strengths, ten tones', () => {
  const o = leapOptions();
  assert.equal(o.profiles.length, 8); assert.ok(o.profiles.some(p => p.id === 'mine'));
  assert.equal(o.destinations.length, 12); for (const d of o.destinations) assert.ok(d.looks >= 1, d.id);
  assert.equal(o.strengths.length, 3); assert.equal(o.tones.length, 10);
});

test('defaults, and bad values fall back to them without calling Qloo', async () => {
  assert.deepEqual((await buildLeapPlan({}, { pipeline: noQloo })).choices, DEFAULTS);
  assert.deepEqual((await buildLeapPlan({ profile: 'x', dest1: 'paris', dest2: 1, dest3: null, strength: 'max', tone: 'x', focus: '9' }, { pipeline: noQloo })).choices, DEFAULTS);
});

test('every value of every choice changes the plan or the picture', async () => {
  const b = shown(await buildLeapPlan({}, { pipeline: noQloo }));
  const values = {
    profile: PROFILES.map(p => p.id).filter(id => id !== 'mine'), dest1: DESTINATIONS.map(d => d.id), dest2: DESTINATIONS.map(d => d.id), dest3: DESTINATIONS.map(d => d.id),
    strength: STRENGTHS.map(s => s.id), tone: MONK_TONES.map(t => t.id), focus: ['0', '1', '2'],
  };
  for (const [k, list] of Object.entries(values)) for (const v of list) {
    if (v === DEFAULTS[k]) continue;
    assert.notEqual(shown(await buildLeapPlan({ ...DEFAULTS, [k]: v }, { pipeline: noQloo })), b, `${k}=${v} changed nothing`);
  }
  const mine = await buildLeapPlan({ ...DEFAULTS, profile: 'mine' }, { pipeline: noQloo });
  assert.equal(mine.choices.profile, 'mine'); assert.match(mine.note, /Taste page/);
});

test('taste is load-bearing: the same cities give different looks and palettes for different tastes', async () => {
  const a = await buildLeapPlan({ profile: 'afrobeats' }, { pipeline: noQloo });
  const k = await buildLeapPlan({ profile: 'kbeauty' }, { pipeline: noQloo });
  assert.notDeepEqual(a.taste.vector, k.taste.vector);
  assert.notDeepEqual(a.leaps.map(l => [l.look.id, l.palette.lid.map(x => x.name)]), k.leaps.map(l => [l.look.id, l.palette.lid.map(x => x.name)]));
  for (const L of a.leaps) { assert.ok(L.because.length >= 1); assert.equal(L.dims.length, 4); }
  assert.ok(a.taste.path.some(p => p.tag === 'afrobeats'));
});

test('the leap moves from your vector toward the city by the strength you pick', async () => {
  for (const s of STRENGTHS) {
    const p = await buildLeapPlan({ strength: s.id }, { pipeline: noQloo });
    const seoul = DESTINATIONS.find(d => d.id === 'seoul');
    const L = p.leaps[1];
    for (const d of L.dims) assert.ok(Math.abs(d.leap - (d.you * (1 - s.s) + seoul.vector[d.id] * s.s)) < 0.02, `${s.id} ${d.id}`);
  }
});

test('your own inputs go through the pipeline once, then come from the cache; the source badge stays honest', async () => {
  _clearLeapCache();
  let calls = 0;
  const pipe = async () => { calls++; return { tags: [{ name: 'k-pop', affinity: 0.9 }, { name: 'glass skin', affinity: 0.3 }], meta: { taste_source: 'qloo', qloo_powered: true } }; };
  const p1 = await buildLeapPlan({ profile: 'mine', inputs: ['BLACKPINK', 'Seoul'] }, { pipeline: pipe });
  const p2 = await buildLeapPlan({ profile: 'mine', inputs: ['seoul', 'blackpink'], dest1: 'tokyo' }, { pipeline: pipe });
  assert.equal(calls, 1); assert.equal(p1.taste.source, 'qloo'); assert.equal(p2.taste.cached, true); assert.match(p1.taste.badge, /Qloo/);
  assert.equal(p1.taste.path[0].tag, 'k-pop'); assert.ok(p1.taste.path[0].weight > p1.taste.path[1].weight);
  const local = async () => ({ tags: ['afrobeats', 'lagos'], meta: { taste_source: 'local_artist_map', qloo_powered: false } });
  const p3 = await buildLeapPlan({ profile: 'mine', inputs: ['Somebody'] }, { pipeline: local });
  assert.equal(p3.taste.source, 'local_artist_map'); assert.match(p3.taste.badge, /not|Built-in/);
  const demo = await buildLeapPlan({}, { pipeline: noQloo });
  assert.match(demo.taste.badge, /not live Qloo/);
});

test('tastePath reads affinity-weighted pushes on each dimension', () => {
  const p = tastePath([{ name: 'afrobeats', affinity: 2 }, { name: 'minimalist', affinity: 1 }]);
  assert.equal(p[0].tag, 'afrobeats'); assert.ok(p[0].pushes.some(x => x.dim === 'intensity' && x.dir === 1));
  assert.ok(p[1].pushes.some(x => x.dim === 'intensity' && x.dir === -1));
});
