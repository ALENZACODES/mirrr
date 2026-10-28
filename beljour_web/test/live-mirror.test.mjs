// #98 Live virtual mirror on a fake camera that serves synthetic frames: the camera opens
// only after explicit camera consent, at most one measurement is in flight, the picture is
// mirrored, only the current frame is held, saving gives the processed (unmirrored) frame,
// and stop() ends every track and drops the frame. No real camera or network. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LiveMirror, mirrored } from '../dist/js/reel/live/mirror.js';
import { LiveArFilter } from '../dist/js/reel/live/ar-filters.js';
import { sequence } from './helpers/frames.mjs';

function camera({ fail = false } = {}) {
  const { frames, inputs } = sequence(8);
  const state = { opened: 0, stopped: 0, painted: [], measures: 0, pending: [], queue: [], cancelled: 0, i: 0, clock: 0 };
  const deps = {
    async getCamera() { if (fail) throw new Error('denied'); state.opened++; return { getTracks: () => [{ stop() { state.stopped++; } }] }; },
    grab() { return frames[Math.min(state.i, frames.length - 1)].image; },
    measure(image) {
      state.measures++;
      const i = frames.findIndex((f) => f.image === image);
      return new Promise((resolve) => state.pending.push(() => resolve(inputs[i])));
    },
    paint(image) { state.painted.push(image); },
    schedule(cb) { state.queue.push(cb); return state.queue.length; },
    cancel() { state.cancelled++; },
    now() { return state.clock; },
  };
  const step = () => { const cb = state.queue.shift(); cb?.(); state.i++; state.clock += 0.1; };
  return { deps, state, step, frames };
}
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const flush = () => new Promise((r) => setTimeout(r, 0));

test('the camera never opens without camera consent', async () => {
  const { deps, state } = camera();
  const mirror = new LiveMirror(deps);
  assert.deepEqual(await mirror.start(false), { started: false, reason: 'camera_consent' });
  assert.deepEqual(await mirror.start(undefined), { started: false, reason: 'camera_consent' });
  assert.equal(state.opened, 0);
  assert.equal(mirror.state, 'off');
  const denied = camera({ fail: true });
  assert.deepEqual(await new LiveMirror(denied.deps).start(true), { started: false, reason: 'camera_unavailable' });
});

test('with consent each tick shows the mirrored processed frame, one measurement at a time, one frame held', async () => {
  const { deps, state, step, frames } = camera();
  const mirror = new LiveMirror(deps, new LiveArFilter('etoiles'), { face: true, person: false }, 100);
  assert.deepEqual(await mirror.start(true), { started: true });
  step(); step(); step();
  assert.equal(state.measures, 1, 'a second measurement started while one was in flight');
  assert.equal(state.painted.length, 3);
  assert.ok(same(state.painted[0].data, mirrored(frames[0].image).data), 'before points arrive the frame passes through, mirrored');
  state.pending.shift()(); await flush();
  step();
  assert.equal(state.measures, 2);
  const shown = state.painted.at(-1), saved = mirror.saveFrame();
  assert.ok(saved.data.some((v, i) => v !== frames[3].image.data[i]), 'filter not applied after points arrived');
  assert.ok(same(mirrored(saved).data, shown.data), 'save gives the unmirrored processed frame');
  assert.equal(mirror.framesHeld(), 1);
  mirror.stop();
  assert.equal(state.stopped, 1);
  assert.equal(mirror.framesHeld(), 0);
  assert.equal(mirror.saveFrame(), null);
  const before = state.painted.length;
  step();
  assert.equal(state.painted.length, before, 'a tick ran after stop');
});

test('a mirror with no effect shows the camera as it is, mirrored', async () => {
  const { deps, state, step, frames } = camera();
  const mirror = new LiveMirror(deps);
  await mirror.start(true);
  step();
  assert.equal(state.measures, 0);
  assert.ok(same(state.painted[0].data, mirrored(frames[0].image).data));
  mirror.stop();
});
