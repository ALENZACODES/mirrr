/** Drawn replay contract and timer tests. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ContinuousDemoState } from '../dist/js/layout/continuous/state.js';
import { LOCAL_EDIT_SEQUENCE } from '../dist/js/layout/continuous/sequence-contract.js';
import { LocalEditSequence } from '../dist/js/layout/continuous/sequence-runner.js';

function fixture(options = {}) {
  const state = new ContinuousDemoState();
  const timers = new Map();
  const emitted = [];
  const measurements = { time: 400, hidden: false, reduced: false, drawn: true };
  let nextHandle = 0;
  const scheduler = {
    schedule(fn, milliseconds) {
      assert.ok(milliseconds >= 250 && milliseconds <= 2000);
      const handle = ++nextHandle;
      timers.set(handle, fn);
      return handle;
    },
    cancel(handle) { timers.delete(handle); },
  };
  const runner = new LocalEditSequence({
    state,
    environment: {
      clock: () => measurements.time,
      scheduler,
      drawnSource: () => measurements.drawn,
      hidden: () => measurements.hidden,
      reducedMotion: () => measurements.reduced,
      onUpdate() { emitted.push(runner.snapshot.phase); },
      intervalMs: options.intervalMs ?? 650,
    },
  });
  const prepare = () => {
    state.chooseDrawnSource(1, 2, 'drawn-main');
    state.next();
    state.next();
    state.next();
    state.setPermission('local', true);
    state.setPermission('hair', true);
    state.setPermission('face', true);
    state.next();
    assert.equal(state.snapshot.step, 'hair');
  };
  const tick = (delta = 650) => {
    measurements.time += delta;
    const [id, fn] = timers.entries().next().value ?? [];
    if (!id) return false;
    timers.delete(id);
    fn();
    return true;
  };
  return { state, runner, timers, emitted, measurements, prepare, tick };
}

test('the ordered public contract contains seven distinct local operations', () => {
  const names = LOCAL_EDIT_SEQUENCE.map(row => row.effect);
  assert.deepEqual(names, ['hair', 'colour', 'concealer', 'appearance', 'ratio', 'turn', 'posture']);
  assert.equal(new Set(names).size, 7);
  assert.ok(LOCAL_EDIT_SEQUENCE.every(row => row.title.length > 3 && row.caption.length > 12));
});

test('one user click advances the first local edit and schedules only the next one', () => {
  const f = fixture();
  f.prepare();
  assert.equal(f.runner.snapshot.canStart, true);
  assert.equal(f.runner.play(), true);
  assert.equal(f.state.snapshot.step, 'colour');
  assert.equal(f.state.snapshot.applied.hair, true);
  assert.equal(f.runner.snapshot.phase, 'running');
  assert.equal(f.runner.snapshot.completed.length, 1);
  assert.equal(f.timers.size, 1);
  assert.equal(f.runner.snapshot.providerCalls, 0);
  assert.equal(f.runner.snapshot.imageSent, false);
  assert.equal(f.runner.snapshot.downloadRequested, false);
  f.runner.dispose();
});

test('full replay stops before Pro Commands and never reaches export or provider', () => {
  const f = fixture();
  f.prepare();
  assert.equal(f.runner.play(), true);
  for (let n = 0; n < 6; n += 1) assert.equal(f.tick(), true);
  assert.equal(f.runner.snapshot.phase, 'complete');
  assert.equal(f.state.snapshot.step, 'pro');
  assert.equal(f.runner.snapshot.completed.length, 7);
  assert.equal(f.runner.snapshot.remaining, 0);
  assert.deepEqual(f.runner.snapshot.completed.map(row => row.effect),
    LOCAL_EDIT_SEQUENCE.map(row => row.effect));
  assert.ok(f.runner.snapshot.completed.every(row => row.kind === 'drawn'));
  assert.equal(f.state.snapshot.mockResult, 'not-requested');
  assert.equal(f.state.snapshot.requestedDownload, false);
  assert.deepEqual(f.state.snapshot.proCommandsReviewed, []);
  assert.equal(f.timers.size, 0);
  assert.equal(f.runner.play(), false);
  assert.equal(f.runner.snapshot.liveEvidence, false);
  f.runner.dispose();
});

test('a manual visitor can advance exactly one edit per explicit click', () => {
  const f = fixture();
  f.prepare();
  for (let i = 0; i < 7; i += 1) {
    assert.equal(f.runner.advance(), true);
    assert.equal(f.runner.snapshot.completed.length, i + 1);
    assert.equal(f.timers.size, 0);
    assert.equal(f.runner.snapshot.phase, i === 6 ? 'complete' : 'paused');
  }
  assert.equal(f.state.snapshot.step, 'pro');
  f.runner.dispose();
});

test('paused local replay cancels the pending callback and resumes later', () => {
  const f = fixture();
  f.prepare();
  f.runner.play();
  f.runner.pause();
  assert.equal(f.runner.snapshot.phase, 'paused');
  assert.equal(f.timers.size, 0);
  assert.equal(f.tick(), false);
  assert.equal(f.state.snapshot.step, 'colour');
  assert.equal(f.runner.resume(), true);
  assert.equal(f.timers.size, 1);
  f.tick();
  assert.equal(f.state.snapshot.step, 'concealer');
  f.runner.dispose();
});

test('a hidden tab immediately pauses and does not progress while hidden', () => {
  const f = fixture();
  f.prepare();
  f.runner.play();
  f.measurements.hidden = true;
  f.runner.visibilityChanged();
  assert.equal(f.runner.snapshot.phase, 'paused');
  assert.equal(f.runner.snapshot.reason, 'hidden');
  assert.equal(f.timers.size, 0);
  assert.equal(f.runner.resume(), false);
  f.measurements.hidden = false;
  assert.equal(f.runner.resume(), true);
  assert.equal(f.tick(), true);
  assert.equal(f.state.snapshot.step, 'concealer');
  f.runner.dispose();
});

test('a delayed timer notices hidden state even without visibility event', () => {
  const f = fixture();
  f.prepare();
  f.runner.play();
  f.measurements.hidden = true;
  f.tick();
  assert.equal(f.runner.snapshot.phase, 'paused');
  assert.equal(f.runner.snapshot.reason, 'hidden');
  assert.equal(f.state.snapshot.step, 'colour');
  assert.equal(f.timers.size, 0);
  f.runner.dispose();
});

test('reduced-motion preference prevents autoplay while allowing single edits', () => {
  const f = fixture();
  f.prepare();
  f.measurements.reduced = true;
  assert.equal(f.runner.play(), false);
  assert.equal(f.runner.snapshot.phase, 'paused');
  assert.equal(f.runner.snapshot.reason, 'reduced-motion');
  assert.equal(f.runner.snapshot.canAdvance, true);
  assert.equal(f.timers.size, 0);
  assert.equal(f.runner.advance(), true);
  assert.equal(f.state.snapshot.step, 'colour');
  assert.equal(f.runner.resume(), false);
  f.runner.dispose();
});

test('setting reduced motion while running pauses before the next edit', () => {
  const f = fixture();
  f.prepare();
  f.runner.play();
  f.measurements.reduced = true;
  f.tick();
  assert.equal(f.state.snapshot.step, 'colour');
  assert.equal(f.runner.snapshot.phase, 'paused');
  assert.equal(f.runner.snapshot.reason, 'reduced-motion');
  assert.equal(f.runner.snapshot.canAdvance, true);
  f.runner.dispose();
});

test('changing the selected subject cancels replay and preserves prior applied edit', () => {
  const f = fixture();
  f.prepare();
  f.runner.play();
  f.state.selectSubject('drawn-other', true);
  f.tick();
  assert.equal(f.runner.snapshot.phase, 'refused');
  assert.equal(f.runner.snapshot.reason, 'source-changed');
  assert.equal(f.runner.snapshot.completed.length, 1);
  assert.equal(f.timers.size, 0);
  assert.equal(f.state.snapshot.selectedId, 'drawn-other');
  f.runner.dispose();
});

test('local permission withdrawal prevents any additional step', () => {
  const f = fixture();
  f.prepare();
  f.runner.play();
  f.state.setPermission('local', false);
  f.tick();
  assert.equal(f.runner.snapshot.phase, 'refused');
  assert.equal(f.state.snapshot.step, 'colour');
  assert.equal(f.timers.size, 0);
  f.runner.dispose();
});

test('hair permission withdrawal also prevents the next local step', () => {
  const f = fixture();
  f.prepare();
  f.runner.play();
  f.state.setPermission('hair', false);
  f.tick();
  assert.equal(f.runner.snapshot.phase, 'refused');
  assert.equal(f.timers.size, 0);
  f.runner.dispose();
});

test('identity lock being turned off refuses further editing', () => {
  const f = fixture();
  f.prepare();
  f.runner.play();
  f.state.setIdentityLock(false);
  f.tick();
  assert.equal(f.runner.snapshot.phase, 'refused');
  assert.equal(f.runner.snapshot.completed.length, 1);
  assert.equal(f.timers.size, 0);
  f.runner.dispose();
});

test('a strength setting change while running invalidates the captured authority', () => {
  const f = fixture();
  f.prepare();
  f.runner.play();
  f.state.setStrength('colour', 3.1);
  f.tick();
  assert.equal(f.runner.snapshot.phase, 'refused');
  assert.equal(f.runner.snapshot.reason, 'source-changed');
  assert.equal(f.runner.snapshot.completed.length, 1);
  f.runner.dispose();
});

test('manually navigating away cancels the pending replay', () => {
  const f = fixture();
  f.prepare();
  f.runner.play();
  f.state.back();
  f.tick();
  assert.equal(f.runner.snapshot.phase, 'refused');
  assert.equal(f.runner.snapshot.reason, 'step-changed');
  f.runner.dispose();
});

test('drawn-source authority fails closed if sample ownership disappears', () => {
  const f = fixture();
  f.prepare();
  f.measurements.drawn = false;
  assert.equal(f.runner.play(), false);
  assert.equal(f.runner.snapshot.phase, 'refused');
  assert.equal(f.runner.snapshot.completed.length, 0);
  f.runner.dispose();
});

test('a new subject image clears previous replay capability', () => {
  const f = fixture();
  f.prepare();
  f.runner.play();
  f.state.chooseDrawnSource(2, 2, 'drawn-main');
  f.tick();
  assert.equal(f.runner.snapshot.phase, 'refused');
  assert.equal(f.runner.snapshot.reason, 'source-changed');
  f.runner.dispose();
});

test('rapid stop and clear invalidates previously scheduled timers', () => {
  const f = fixture();
  f.prepare();
  f.runner.play();
  const stale = [...f.timers.values()][0];
  f.runner.stop();
  assert.equal(f.timers.size, 0);
  assert.equal(f.runner.snapshot.phase, 'refused');
  f.runner.clear();
  stale();
  assert.equal(f.runner.snapshot.completed.length, 0);
  assert.equal(f.state.snapshot.step, 'colour');
  f.runner.dispose();
});

test('replay disposal rejects subsequent user actions and cancels timers', () => {
  const f = fixture();
  f.prepare();
  f.runner.play();
  const pending = [...f.timers.values()][0];
  f.runner.dispose();
  pending();
  assert.equal(f.timers.size, 0);
  assert.throws(() => f.runner.play(), /disposed/);
  assert.throws(() => f.runner.advance(), /disposed/);
  assert.equal(f.state.snapshot.step, 'colour');
});

test('bad interval values refuse to instantiate a replay', () => {
  for (const intervalMs of [-100, 0, 249, 2001, Infinity, NaN, 250.5]) {
    const f = fixture();
    f.runner.dispose();
    assert.throws(() => new LocalEditSequence({
      state: f.state,
      environment: {
        clock: () => 1,
        scheduler: { schedule: () => 1, cancel() {} },
        drawnSource: () => true, hidden: () => false, reducedMotion: () => false,
        onUpdate() {}, intervalMs,
      },
    }), /interval/);
  }
});

test('a nonfinite start clock cannot claim a recorded local edit', () => {
  const f = fixture();
  f.prepare();
  f.measurements.time = Infinity;
  assert.equal(f.runner.play(), false);
  assert.equal(f.runner.snapshot.reason, 'invalid-clock');
  assert.equal(f.runner.snapshot.completed.length, 0);
  f.runner.dispose();
});

test('non-monotonic completion clock refuses the run rather than report negative time', () => {
  let tick = 0;
  const f = fixture();
  f.prepare();
  const original = f.runner;
  original.dispose();
  const runner = new LocalEditSequence({ state: f.state, environment: {
    clock() { tick += 1; return tick === 1 ? 50 : 40; },
    scheduler: { schedule: () => 1, cancel() {} },
    drawnSource: () => true, hidden: () => false, reducedMotion: () => false,
    onUpdate() {},
  } });
  assert.equal(runner.play(), false);
  assert.equal(runner.snapshot.reason, 'invalid-clock');
  assert.equal(runner.snapshot.completed.length, 0);
  runner.dispose();
});

test('replay status is metadata-only and contains no subject identifier', () => {
  const f = fixture();
  f.prepare();
  f.runner.play();
  const data = JSON.stringify(f.runner.snapshot);
  assert.doesNotMatch(data, /drawn-main|original|pixels|filename|apiKey/i);
  assert.equal(f.runner.snapshot.providerCalls, 0);
  assert.equal(f.runner.snapshot.liveEvidence, false);
  f.runner.dispose();
});
