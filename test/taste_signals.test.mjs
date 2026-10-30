import test from 'node:test';
import assert from 'node:assert/strict';
import { filterTags, qlooTaste, provenance, isBlocked } from '../src/taste_signals.js';
import { recommendLooks } from '../src/look_engine.js';
import { buildAestheticVector, ARCHETYPE_KEYWORDS } from '../src/aesthetic.js';

const T = (name, affinity = 0.9) => ({ name, affinity });

test('unsafe and off-topic Qloo tags never reach the UI; beauty-relevant ones do', () => {
  const { kept, dropped } = filterTags([T('drug dealer'), T('violence'), T('murder'), T('interracial romance'), T('afrobeats'), T('Dancehall'), T('supernatural power'), T('friendship'), T('k pop'), T('K-Pop')]);
  assert.deepEqual(kept.map(t => t.name).sort(), ['Dancehall', 'afrobeats', 'k pop'].sort());
  assert.equal(dropped.blocked, 4); assert.ok(dropped.irrelevant >= 2); assert.equal(dropped.duplicates, 1);
  assert.ok(isBlocked('Drug Dealer') && !isBlocked('Afrobeats'));
});

const fakeClient = (tagsFor) => ({
  _apiKey: 'x',
  resolveName: async (n) => ({ id: `id-${n}`, name: n, type: 'urn:entity:artist' }),
  insightTagsOfType: async (ids, type) => (type.includes('music') ? tagsFor(ids[0]) : [T('violence', 1)]),
});

test('changing the artist changes the looks, through Qloo evidence', async () => {
  const tags = { 'id-Burna Boy': [T('afrobeats', 0.95), T('Africa', 1), T('Dancehall', 0.9)], 'id-BLACKPINK': [T('k pop', 1), T('Korean Pop', 0.99), T('girl group', 0.99)] };
  const run = async (name) => {
    const q = await qlooTaste([name], { client: fakeClient(id => tags[id]) });
    assert.equal(q.qloo_powered, true); assert.equal(provenance(q).dropped.blocked, 1);
    return recommendLooks(buildAestheticVector(q.kept), { topN: 3, evidence: q.kept, archetypeKeywords: ARCHETYPE_KEYWORDS });
  };
  const a = await run('Burna Boy'), b = await run('BLACKPINK');
  assert.notDeepEqual(a.map(r => r.look.id), b.map(r => r.look.id));
  assert.ok(a.every(r => r.qlooEvidence > 0 && r.evidenceTags.length), 'every look says which Qloo tags put it there');
  assert.ok(a.concat(b).every(r => r.score < 1), 'no clamped 100% scores');
});

test('Qloo unreachable is reported, not hidden', async () => {
  const down = { _apiKey: 'x', resolveName: async () => { const e = new Error('Qloo GET /v2/search returned 401: {secret body}'); e.status = 401; throw e; } };
  const q = await qlooTaste(['Burna Boy'], { client: down });
  assert.equal(q.qloo_powered, false); assert.equal(q.unreachable, true);
  assert.match(provenance(q).error, /refused/); assert.doesNotMatch(provenance(q).error, /secret/);
  const none = await qlooTaste(['x'], { client: { _apiKey: '' } });
  assert.equal(none.unreachable, true);
});

import { SHADE_SPECTRUM, findShades } from '../src/shade_finder.js';
import { validateSpectrum } from '../src/skin_gamut.js';

test('the shade spectrum is real skin: valid hex, L* >= 13, in gamut, every Monk tone within ΔE2000 3', () => {
  const v = validateSpectrum(SHADE_SPECTRUM);
  assert.deepEqual(v.problems, []);
  assert.equal(v.stats.belowL13, 0); assert.ok(v.stats.inBand13to32 >= 13);
});

test('Rich Deep + Warm returns six real named shades', () => {
  const r = findShades({ depthTarget: 48, undertone: 'warm', topN: 6 });
  assert.equal(r.length, 6);
  for (const x of r) { assert.ok(x.shade.name && x.name === x.shade.name); assert.match(x.hex, /^#[0-9A-F]{6}$/i); }
  assert.ok(r.filter(x => x.undertoneMatch).length >= 5);
});

import { spawn } from 'node:child_process';
test('diagnostics are off by default: /api/qloo/diag is 404 and /api/health shows no key field', async () => {
  const port = 4300 + Math.floor(Math.random() * 500);
  const env = { ...process.env, PORT: String(port) }; delete env.MIRRR_DIAG;
  const child = spawn(process.execPath, ['src/server.js'], { env, stdio: 'ignore' });
  try {
    let h = null;
    for (let i = 0; i < 50 && !h; i++) { await new Promise(r => setTimeout(r, 100)); h = await fetch(`http://127.0.0.1:${port}/api/health`).then(r => r.json()).catch(() => null); }
    assert.ok(h && h.status === 'ok'); assert.ok(!('qloo_key_set' in h));
    const d = await fetch(`http://127.0.0.1:${port}/api/qloo/diag`);
    assert.equal(d.status, 404);
  } finally { child.kill(); }
});
