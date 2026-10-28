/** Consent, stale callbacks and zero-provider replay boundaries. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DrawnFrameController } from '../dist/js/layout/continuous/frame-controller.js';
import { deferred, drawnState, pixels } from './helpers/local-frame-fixture.mjs';

function controller(options = {}) {
  const state = drawnState();
  let drawn = true;
  const calls = [];
  const render = options.capture ?? (async (id) => {
    calls.push(id);
    return pixels(id);
  });
  const live = new DrawnFrameController({
    current: () => ({ state: state.snapshot, drawn }),
    capture: render,
    changed: options.changed,
  });
  return { state, live, calls, setDrawn(next) { drawn = next; } };
}

test('explicit preparation renders exactly three separate family frames', async () => {
  const { live, calls } = controller();
  const summary = await live.prepare();
  assert.deepEqual(calls, ['hair', 'makeup', 'skin']);
  assert.equal(summary.phase, 'ready');
  assert.equal(summary.available, 3);
  assert.equal(summary.selected, 'hair');
  assert.equal(summary.networkCalls, 0);
  assert.equal(summary.unitsSpent, 0);
  assert.equal(summary.liveVerified, false);
});

test('only user-initiated prepare produces thumbnail captures', () => {
  const { live, calls } = controller();
  assert.equal(live.snapshot.phase, 'empty');
  assert.equal(live.readSelected(), null);
  assert.deepEqual(calls, []);
});

test('selecting a warm family returns a distinct raster from cache', async () => {
  const { live } = controller();
  await live.prepare();
  assert.equal(live.select('skin'), true);
  assert.equal(live.readSelected().id, 'skin');
  assert.equal(live.snapshot.selected, 'skin');
  assert.equal(live.select('untrusted'), false);
});

test('duplicate cache preparation does not retain earlier decoded frames', async () => {
  const { live, calls } = controller();
  await live.prepare();
  await live.prepare();
  assert.equal(calls.length, 6);
  assert.equal(live.snapshot.available, 3);
  assert.ok(live.snapshot.bytes <= 1_048_576);
});

test('mock-off tour can prepare cache without a mock grant', async () => {
  const { state, live } = controller();
  state.chooseMockMode('off');
  state.setPermission('mock', false);
  assert.equal((await live.prepare()).phase, 'ready');
});

for (const key of ['local', 'hair', 'face', 'mock']) {
  test(`withdrawn ${key} permission refuses or invalidates cache`, async () => {
    const { state, live } = controller();
    await live.prepare();
    state.setPermission(key, false);
    assert.equal(live.readSelected(), null);
    assert.equal(live.snapshot.phase, 'stale');
    assert.equal(live.snapshot.available, 0);
    assert.equal((await live.prepare()).phase, 'refused');
  });
}

test('identity lock off destroys all cached frames', async () => {
  const { state, live } = controller();
  await live.prepare();
  state.setIdentityLock(false);
  assert.equal(live.readSelected(), null);
  assert.equal(live.snapshot.available, 0);
});

test('subject switch destroys existing cache before the next read', async () => {
  const { state, live } = controller();
  await live.prepare();
  state.selectSubject('drawn-second', true);
  assert.equal(live.readSelected(), null);
  assert.equal(live.snapshot.selected, null);
});

test('strength change invalidates earlier rendered frame pixels', async () => {
  const { state, live } = controller();
  await live.prepare();
  state.setStrength('hair', 4.2);
  assert.equal(live.readSelected(), null);
  assert.equal(live.snapshot.phase, 'stale');
});

test('an unverified, uploaded source cannot warm local cache', async () => {
  const { live, calls, setDrawn } = controller();
  setDrawn(false);
  assert.equal((await live.prepare()).phase, 'refused');
  assert.equal(calls.length, 0);
});

test('a pending capture cannot repopulate after explicit clear', async () => {
  const first = deferred();
  const { live } = controller({ capture: () => first.promise });
  const running = live.prepare();
  assert.equal(live.snapshot.phase, 'warming');
  live.invalidate();
  first.resolve(pixels());
  await running;
  assert.equal(live.snapshot.phase, 'empty');
  assert.equal(live.snapshot.available, 0);
});

test('pending capture cannot survive subject selection during await', async () => {
  const first = deferred();
  const { state, live } = controller({ capture: () => first.promise });
  const running = live.prepare();
  state.selectSubject('drawn-second', true);
  first.resolve(pixels());
  await running;
  assert.equal(live.snapshot.phase, 'stale');
  assert.equal(live.snapshot.available, 0);
});

test('pending capture cannot survive revoking consent during await', async () => {
  const first = deferred();
  const { state, live } = controller({ capture: () => first.promise });
  const running = live.prepare();
  state.setPermission('hair', false);
  first.resolve(pixels());
  await running;
  assert.equal(live.snapshot.phase, 'stale');
});

test('pending capture cannot survive disposal', async () => {
  const first = deferred();
  const { live } = controller({ capture: () => first.promise });
  const running = live.prepare();
  live.dispose();
  first.resolve(pixels());
  await running;
  assert.equal(live.snapshot.phase, 'disposed');
  assert.equal(live.snapshot.available, 0);
});

test('provider-result-shaped frames are rejected, not cached as vendor evidence', async () => {
  const { live } = controller({ capture: async id => ({ ...pixels(id), providerVerified: true }) });
  assert.equal((await live.prepare()).phase, 'refused');
  assert.equal(live.snapshot.available, 0);
});

test('a failed mid-sequence render clears every earlier cached family', async () => {
  const { live } = controller({ capture: async id => {
    if (id === 'makeup') throw new Error('Simulated local Canvas failure');
    return pixels(id);
  } });
  assert.equal((await live.prepare()).phase, 'refused');
  assert.equal(live.snapshot.available, 0);
  assert.equal(live.readSelected(), null);
});

test('replayed frames cannot make a network call', async () => {
  const { live } = controller();
  await live.prepare();
  for (const id of ['hair', 'makeup', 'skin']) {
    assert.equal(live.select(id), true);
    const frame = live.readSelected();
    assert.equal(frame.unitsSpent, 0);
    assert.equal(frame.providerVerified, false);
    frame.rgba.fill(0);
  }
  assert.equal(live.snapshot.networkCalls, 0);
});

test('ready status callback is not fired after dispose', async () => {
  const first = deferred();
  let changes = 0;
  const { live } = controller({ changed: () => { changes += 1; }, capture: () => first.promise });
  const running = live.prepare();
  const before = changes;
  live.dispose();
  first.resolve(pixels());
  await running;
  assert.equal(changes, before);
});
