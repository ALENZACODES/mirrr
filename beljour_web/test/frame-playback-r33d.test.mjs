/** No-unit scheduler for previously rendered, fully local thumbnails. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CachedFramePlayback } from '../dist/js/layout/continuous/frame-playback.js';

function fixture(opts = {}) {
  const timers = new Map();
  const selected = [];
  let id = 0;
  let hidden = Boolean(opts.hidden);
  let reduced = Boolean(opts.reduced);
  let status = opts.status ?? 'ready';
  let available = opts.available ?? 3;
  let updates = 0;
  const scheduler = {
    schedule(callback, delay) {
      assert.equal(delay, 650);
      timers.set(++id, callback);
      return id;
    },
    cancel(token) { timers.delete(token); },
  };
  const show = new CachedFramePlayback({
    cache: () => ({ phase: status, available, networkCalls: 0, unitsSpent: 0 }),
    select(frame) {
      if (opts.block === frame) return false;
      selected.push(frame);
      return true;
    },
    scheduler,
    hidden: () => hidden,
    reducedMotion: () => reduced,
    changed: () => { updates += 1; },
    stepMs: opts.delay,
  });
  const tick = () => {
    const entry = timers.entries().next().value;
    if (!entry) return false;
    timers.delete(entry[0]);
    entry[1]();
    return true;
  };
  return {
    show, timers, selected, tick,
    setHidden(next) { hidden = next; },
    setReduced(next) { reduced = next; },
    setStatus(next) { status = next; },
    setAvailable(next) { available = next; },
    get updates() { return updates; },
  };
}

test('play visits each cached family once and stops after the third', () => {
  const x = fixture();
  assert.equal(x.show.start(), true);
  assert.deepEqual(x.selected, ['hair']);
  assert.equal(x.show.snapshot.phase, 'playing');
  assert.equal(x.tick(), true);
  assert.deepEqual(x.selected, ['hair', 'makeup']);
  assert.equal(x.tick(), true);
  assert.deepEqual(x.selected, ['hair', 'makeup', 'skin']);
  assert.equal(x.show.snapshot.phase, 'complete');
  assert.equal(x.show.snapshot.observed, 3);
  assert.equal(x.tick(), false);
});

test('no automatic network calls or downloads can appear in snapshot', () => {
  const x = fixture();
  x.show.start();
  x.tick();
  const result = x.show.snapshot;
  assert.equal(result.providerRequests, 0);
  assert.equal(result.unitsSpent, 0);
  assert.equal(result.automaticDownload, false);
});

test('play refuses empty and partial image caches', () => {
  for (const available of [0, 1, 2]) {
    const x = fixture({ available });
    assert.equal(x.show.start(), false);
    assert.equal(x.show.snapshot.phase, 'refused');
    assert.deepEqual(x.selected, []);
  }
});

test('reduced-motion setting disallows autoplay but permits manual advance', () => {
  const x = fixture({ reduced: true });
  assert.equal(x.show.start(), false);
  assert.equal(x.timers.size, 0);
  assert.equal(x.show.advance(), true);
  assert.deepEqual(x.selected, ['hair']);
  assert.equal(x.show.snapshot.phase, 'paused');
});

test('hidden page forbids both autoplay and manual selection', () => {
  const x = fixture({ hidden: true });
  assert.equal(x.show.start(), false);
  assert.equal(x.show.advance(), false);
  assert.equal(x.selected.length, 0);
});

test('pause cancels pending timer and resume schedules one', () => {
  const x = fixture();
  x.show.start();
  x.show.pause();
  assert.equal(x.timers.size, 0);
  assert.equal(x.show.snapshot.phase, 'paused');
  assert.equal(x.show.resume(), true);
  assert.equal(x.timers.size, 1);
  x.tick();
  assert.equal(x.show.snapshot.selected, 'makeup');
});

test('manual next moves exactly one frame and never leaves a timer', () => {
  const x = fixture();
  x.show.start();
  assert.equal(x.show.advance(), true);
  assert.deepEqual(x.selected, ['hair', 'makeup']);
  assert.equal(x.timers.size, 0);
  assert.equal(x.show.snapshot.phase, 'paused');
});

test('manual stepping through all three finishes without new render work', () => {
  const x = fixture();
  for (let i = 0; i < 3; i += 1) assert.equal(x.show.advance(), true);
  assert.deepEqual(x.selected, ['hair', 'makeup', 'skin']);
  assert.equal(x.show.snapshot.phase, 'complete');
  assert.equal(x.show.advance(), false);
});

test('cache invalidation prevents the next tick from displaying another frame', () => {
  const x = fixture();
  x.show.start();
  x.setStatus('stale');
  assert.equal(x.tick(), true);
  assert.deepEqual(x.selected, ['hair']);
  assert.equal(x.show.snapshot.phase, 'refused');
  assert.equal(x.timers.size, 0);
});

test('revoking a cached frame after pause prevents resume', () => {
  const x = fixture();
  x.show.start();
  x.show.pause();
  x.setAvailable(0);
  assert.equal(x.show.resume(), false);
  assert.equal(x.show.snapshot.phase, 'refused');
});

test('visibilitychange pauses playback and never resumes automatically', () => {
  const x = fixture();
  x.show.start();
  x.setHidden(true);
  x.show.visibilityChanged();
  assert.equal(x.show.snapshot.phase, 'paused');
  assert.equal(x.timers.size, 0);
  x.setHidden(false);
  x.show.visibilityChanged();
  assert.equal(x.show.snapshot.phase, 'paused');
});

test('reduced motion switched on during pause blocks resume', () => {
  const x = fixture();
  x.show.start();
  x.show.pause();
  x.setReduced(true);
  assert.equal(x.show.resume(), false);
});

test('explicit stop removes all timer references', () => {
  const x = fixture();
  x.show.start();
  x.show.stop();
  assert.equal(x.timers.size, 0);
  assert.equal(x.show.snapshot.index, -1);
  assert.equal(x.show.snapshot.observed, 0);
  assert.equal(x.show.snapshot.phase, 'idle');
});

test('silent stop does not create extra view refreshes', () => {
  const x = fixture();
  x.show.start();
  const before = x.updates;
  x.show.stop('idle', false);
  assert.equal(x.updates, before);
});

test('disposal is idempotent and blocks every new operation', () => {
  const x = fixture();
  x.show.start();
  x.show.dispose();
  x.show.dispose();
  assert.equal(x.show.snapshot.phase, 'disposed');
  assert.equal(x.show.start(), false);
  assert.equal(x.show.advance(), false);
  assert.equal(x.timers.size, 0);
});

test('negative control: a failed read cannot be reported as frame observed', () => {
  const x = fixture({ block: 'makeup' });
  x.show.start();
  x.tick();
  assert.equal(x.show.snapshot.phase, 'refused');
  assert.deepEqual(x.selected, ['hair']);
  assert.equal(x.show.snapshot.observed, 0);
});

for (const delay of [-1, 249, 2001, Infinity, NaN]) {
  test(`reject unsafe scheduled autoplay delay ${delay}`, () => {
    assert.throws(() => fixture({ delay }));
  });
}
