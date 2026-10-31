import test from 'node:test';
import assert from 'node:assert/strict';
import { slimRun, isCompletedRun, readCompletedRun, thinkSteps, SIXTY_LAST_RUN_KEY, SIXTY_REPLAY_LABEL } from '../public/sixty-core.js';

const run = { meta: { qloo_powered: true, tags_from_qloo: 14, provenance: { entities: [{ input: 'Burna Boy', name: 'Burna Boy', type: 'x' }], unresolved: [], tags_received: 50, received: { music: 25, media: 25 }, tags_used: 14, dropped: { blocked: 9, irrelevant: 26, duplicates: 1 }, used: [{ name: 'afrobeats', kind: 'music genre', affinity: 1 }], calls: 4, latency_ms: 703 } },
  looks: [{ look: { id: 'afrobeats_concert', name: 'Afrobeats Concert', description: 'd' }, score: 0.58, evidenceTags: ['afrobeats'] }] };

test('the replay label is exact', () => assert.equal(SIXTY_REPLAY_LABEL, 'A completed run · live runs call Qloo now.'));

test('no cache, or a partial or failed run, means no completed run (the button stays hidden)', () => {
  const store = m => ({ getItem: k => m[k] ?? null });
  assert.equal(readCompletedRun(store({})), null);
  assert.equal(readCompletedRun(undefined), null);
  assert.equal(readCompletedRun(store({ [SIXTY_LAST_RUN_KEY]: '{bad' })), null);
  const c = { v: 1, outcome: { failed: false, live: true }, run: slimRun(run), shades: [{ name: 'Garnet', code: 'D40' }], shadeIdx: 0, plan: { stages: [{ title: 'Skin' }] }, modelFace: { id: 'f', label: 'West African' }, before: 'data:image/jpeg;base64,x', after: 'data:image/jpeg;base64,y' };
  assert.ok(isCompletedRun(c));
  assert.ok(readCompletedRun(store({ [SIXTY_LAST_RUN_KEY]: JSON.stringify(c) })));
  assert.equal(isCompletedRun({ ...c, outcome: { failed: true, live: false } }), false);
  assert.equal(isCompletedRun({ ...c, after: undefined }), false);
});

test('WATCH MIRRR THINK uses only the run data, in order, and drops steps with no data', () => {
  const all = thinkSteps({ run: slimRun(run), shade: { name: 'Garnet', code: 'D40' }, plan: { target: { name: 'Afrobeats Concert' }, stages: [{ title: 'Skin' }] }, modelFace: { label: 'West African' } });
  assert.deepEqual(all.map(s => s.id), ['resolved', 'received', 'filtered', 'ranked', 'shade', 'plan', 'model']);
  assert.match(all[2].text, /14 used, 36 filtered out: 9 unsafe, 26 not about beauty, 1 repeats/);
  assert.deepEqual(thinkSteps({ shade: { name: 'Garnet', code: 'D40' } }).map(s => s.id), ['shade']);
  assert.deepEqual(thinkSteps({}), []);
});
