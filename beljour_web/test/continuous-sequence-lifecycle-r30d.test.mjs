/** Race, interruption and failure boundaries for drawn-only local replay. */
/** Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ContinuousDemoState } from '../dist/js/layout/continuous/state.js';
import { LocalEditSequence } from '../dist/js/layout/continuous/sequence-runner.js';
import {
  sequenceAuthority,
  safeSequenceElapsed,
  sameSequenceAuthority,
  sequenceStep,
  sequenceReadableStatus,
} from '../dist/js/layout/continuous/sequence-contract.js';

function readyState() {
  const state = new ContinuousDemoState();
  state.chooseDrawnSource(1, 2, 'drawn-main');
  for (let step = 0; step < 3; step += 1) state.next();
  state.setPermission('local', true);
  state.setPermission('hair', true);
  state.setPermission('face', true);
  state.next();
  return state;
}

function harness(options = {}) {
  const state = options.state ?? readyState();
  const pending = new Map();
  const clock = { current: 100, hidden: false, motion: false, source: true };
  let nextHandle = 0;
  const times = [];
  const timer = {
    schedule(callback, interval) {
      if (options.throwOnSchedule) throw new Error('timers unavailable');
      const handle = ++nextHandle;
      pending.set(handle, callback);
      times.push(interval);
      return handle;
    },
    cancel(id) { pending.delete(id); },
  };
  const runner = new LocalEditSequence({ state, environment: {
    clock: () => clock.current,
    scheduler: timer,
    drawnSource: () => clock.source,
    hidden: () => clock.hidden,
    reducedMotion: () => clock.motion,
    onUpdate() {},
    intervalMs: options.intervalMs ?? 650,
  } });
  const fire = (amount = 650) => {
    clock.current += amount;
    const first = pending.entries().next().value;
    if (!first) return false;
    pending.delete(first[0]);
    first[1]();
    return true;
  };
  return { state, runner, pending, timer, times, clock, fire };
}

test('start refuses every missing permission individually', () => {
  for (const permission of ['local', 'hair', 'face']) {
    const s = readyState();
    s.setPermission(permission, false);
    const h = harness({ state: s });
    assert.equal(h.runner.snapshot.canStart, false);
    assert.equal(h.runner.play(), false);
    assert.equal(h.runner.snapshot.phase, 'refused');
    assert.equal(h.runner.snapshot.completed.length, 0);
    assert.equal(h.pending.size, 0);
    h.runner.dispose();
  }
});

test('identity lock must be enabled on entry, not merely before export', () => {
  const s = readyState();
  s.setIdentityLock(false);
  const h = harness({ state: s });
  assert.equal(h.runner.snapshot.canStart, false);
  assert.equal(h.runner.play(), false);
  assert.equal(h.state.snapshot.applied.hair, false);
  h.runner.dispose();
});

test('no checked drawn source, no local edit', () => {
  const h = harness();
  h.clock.source = false;
  assert.equal(h.runner.play(), false);
  assert.equal(h.runner.snapshot.completed.length, 0);
  assert.equal(h.pending.size, 0);
  h.runner.dispose();
});

test('a changed source revision with the same selected ID invalidates replay', () => {
  const h = harness();
  h.runner.play();
  assert.equal(h.state.snapshot.applied.hair, true);
  h.state.chooseDrawnSource(2, 2, 'drawn-main');
  h.fire();
  assert.equal(h.runner.snapshot.reason, 'source-changed');
  assert.equal(h.runner.snapshot.phase, 'refused');
  assert.equal(h.runner.snapshot.completed.length, 1);
  h.runner.dispose();
});

test('scheduling failure cannot silently start a background edit', () => {
  const h = harness({ throwOnSchedule: true });
  assert.equal(h.runner.play(), false);
  assert.equal(h.runner.snapshot.phase, 'refused');
  assert.equal(h.runner.snapshot.reason, 'edit-refused');
  assert.equal(h.state.snapshot.step, 'colour');
  assert.equal(h.pending.size, 0);
  h.runner.dispose();
});

test('even an over-eager scheduler callback cannot replay one effect twice', () => {
  const h = harness();
  h.runner.play();
  const firstCallback = [...h.pending.values()][0];
  h.fire();
  const secondStep = h.state.snapshot.step;
  firstCallback();
  assert.equal(h.state.snapshot.step, secondStep);
  assert.equal(h.runner.snapshot.completed.length, 2);
  h.runner.dispose();
});

test('stopping while waiting invalidates a callback held by an old closure', () => {
  const h = harness();
  h.runner.play();
  const callback = [...h.pending.values()][0];
  h.runner.stop('manual-stop');
  callback();
  assert.equal(h.runner.snapshot.completed.length, 1);
  assert.equal(h.state.snapshot.step, 'colour');
  assert.equal(h.pending.size, 0);
  assert.match(sequenceReadableStatus(h.runner.snapshot), /stopped by the visitor/);
  h.runner.dispose();
});

test('clear resets rehearsal observation but does not pretend to undo applied pixels', () => {
  const h = harness();
  h.runner.play();
  h.runner.clear();
  assert.equal(h.runner.snapshot.completed.length, 0);
  assert.equal(h.runner.snapshot.phase, 'idle');
  assert.equal(h.state.snapshot.applied.hair, true);
  assert.equal(h.state.snapshot.step, 'colour');
  assert.equal(h.runner.snapshot.canStart, false);
  h.runner.dispose();
});

test('the visitor may restart a new drawn session explicitly after stopping', () => {
  const h = harness();
  h.runner.play();
  h.runner.stop();
  h.runner.clear();
  h.state.reset();
  h.state.chooseDrawnSource(3, 2, 'drawn-main');
  for (let index = 0; index < 3; index += 1) h.state.next();
  h.state.setPermission('local', true);
  h.state.setPermission('hair', true);
  h.state.setPermission('face', true);
  h.state.next();
  assert.equal(h.runner.snapshot.canStart, true);
  assert.equal(h.runner.play(), true);
  assert.equal(h.runner.snapshot.completed.length, 1);
  h.runner.dispose();
});

test('a hidden page needs a conscious resume, never automatic continuation', () => {
  const h = harness();
  h.runner.play();
  h.clock.hidden = true;
  h.runner.visibilityChanged();
  assert.equal(h.runner.snapshot.phase, 'paused');
  h.clock.hidden = false;
  h.clock.current += 1000;
  assert.equal(h.runner.snapshot.phase, 'paused');
  assert.equal(h.pending.size, 0);
  assert.equal(h.runner.resume(), true);
  assert.equal(h.pending.size, 1);
  h.runner.dispose();
});

test('unreliable clocks cannot create negative, infinite or projected performance proof', () => {
  for (const [start, end] of [[-1, 2], [NaN, 2], [3, 2], [0, Infinity], [0, 300_001]]) {
    assert.equal(safeSequenceElapsed(start, end), null);
  }
  assert.equal(safeSequenceElapsed(10, 10), 0);
  assert.equal(safeSequenceElapsed(10, 12.15), 2.2);
});

test('authority deliberately excludes filenames and other person-identifying material', () => {
  const h = harness();
  const authority = sequenceAuthority(h.state.snapshot);
  assert.ok(authority);
  assert.equal(authority.revision, 1);
  assert.equal(authority.levels.length, 7);
  assert.equal(Object.hasOwn(authority, 'filename'), false);
  assert.equal(Object.hasOwn(authority, 'portrait'), false);
  assert.equal(sameSequenceAuthority(authority, authority), true);
  assert.equal(sameSequenceAuthority(authority, null), false);
  h.runner.dispose();
});

test('manual edit levels must be finite and in 0.1 increments to enter replay', () => {
  const h = harness();
  const normal = sequenceAuthority(h.state.snapshot);
  assert.ok(normal);
  h.state.setStrength('hair', 2.6);
  const changed = sequenceAuthority(h.state.snapshot);
  assert.ok(changed);
  assert.equal(sameSequenceAuthority(normal, changed), false);
  assert.equal(sameSequenceAuthority(changed, changed), true);
  h.runner.dispose();
});

test('sequenceStep rejects negative, fractional and past-end indexes', () => {
  assert.equal(sequenceStep(-1), null);
  assert.equal(sequenceStep(7), null);
  assert.equal(sequenceStep(2.1), null);
  assert.equal(sequenceStep(Infinity), null);
  assert.equal(sequenceStep(0).effect, 'hair');
  assert.equal(sequenceStep(6).effect, 'posture');
});

test('a completed local sequence cannot be mistaken for a network or file receipt', () => {
  const h = harness();
  h.runner.play();
  while (h.fire()) {}
  const status = h.runner.snapshot;
  assert.equal(status.phase, 'complete');
  assert.equal(status.providerCalls, 0);
  assert.equal(status.imageSent, false);
  assert.equal(status.downloadRequested, false);
  assert.equal(status.liveEvidence, false);
  assert.equal(h.state.snapshot.mockResult, 'not-requested');
  assert.equal(h.state.snapshot.requestedDownload, false);
  h.runner.dispose();
});
