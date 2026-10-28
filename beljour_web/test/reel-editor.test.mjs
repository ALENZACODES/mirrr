// #79 Reels editor on synthetic frame sequences with a hard scene cut: scenes found from the
// brightness histogram, scenes kept or dropped, trims inside a scene, strength keyframes that
// never ramp across a cut, temporal state restarted at each scene, and frames streamed to the
// sink rather than kept. No video file or network. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ReelProject } from '../dist/js/reel/live/editor.js';
import { sequence } from './helpers/frames.mjs';

function spy() {
  const calls = { reset: 0, applied: [] };
  return { calls, effect: { id: 'spy', label: 'spy', reset() { calls.reset++; },
    apply(frame, inputs, strength) { calls.applied.push([frame.t, strength]); return { image: frame.image, changed: true, note: '' }; } } };
}
function project(n = 12, cut = 6) {
  const { frames, inputs } = sequence(n, { cut });
  const p = new ReelProject();
  for (const f of frames) p.scan(f);
  return { p, frames, inputs };
}

test('scenes are found at the cut and every frame belongs to one', () => {
  const { p, frames } = project();
  const scenes = p.findScenes();
  assert.equal(scenes.length, 2);
  assert.equal(scenes[1].start, frames[6].t);
  assert.equal(scenes[0].end, frames[5].t);
  assert.equal(p.keptFrames(), 12);
  assert.throws(() => new ReelProject().findScenes(), /scan the clip/);
});

test('dropping a scene and trimming another changes which frames render, with smoothing restarted per scene', async () => {
  const { p, frames, inputs } = project();
  p.findScenes();
  const { calls, effect } = spy();
  let out = await p.render(frames, effect, (_, i) => inputs[i], () => {});
  assert.deepEqual(out, { frames: 12, scenes: 2 });
  assert.equal(calls.reset, 3);
  p.setKeep(0, false);
  p.trim(1, frames[7].t, frames[10].t);
  const s2 = spy();
  const sunk = [];
  out = await p.render(frames, s2.effect, (_, i) => inputs[i], (o, frame, i) => sunk.push([i, frame.t]));
  assert.deepEqual(out, { frames: 4, scenes: 1 });
  assert.deepEqual(sunk.map((s) => s[1]), [0.7, 0.8, 0.9, 1].map((t) => frames.find((f) => Math.abs(f.t - t) < 1e-9).t));
  assert.throws(() => p.trim(1, frames[2].t, frames[8].t), /inside its scene/);
  assert.throws(() => p.trim(1, frames[9].t, frames[8].t), /inside its scene/);
});

test('strength keyframes interpolate inside a scene and never ramp across the cut', async () => {
  const { p, frames, inputs } = project();
  p.findScenes();
  p.setKeyframes([{ t: 0, strength: 0 }, { t: 0.5, strength: 100 }, { t: 0.6, strength: 20 }, { t: 1.1, strength: 20 }]);
  assert.equal(p.strengthAt(0.25), 50);
  assert.equal(p.strengthAt(0.55), 100, 'held to the end of scene one, not blended with scene two');
  assert.equal(p.strengthAt(0.8), 20);
  const { calls, effect } = spy();
  await p.render(frames, effect, (_, i) => inputs[i], () => {});
  assert.deepEqual(calls.applied.slice(0, 3).map((a) => a[1]), [0, 20, 40]);
  assert.throws(() => p.setKeyframes([]), /at least one/);
  assert.throws(() => p.setKeyframes([{ t: 0, strength: 140 }]), /strength/);
});

test('render needs scenes and rejects frames out of order', async () => {
  const { frames, inputs } = project();
  const fresh = new ReelProject();
  for (const f of frames) fresh.scan(f);
  await assert.rejects(fresh.render(frames, spy().effect, (_, i) => inputs[i], () => {}), /find the scenes/);
  fresh.findScenes();
  await assert.rejects(fresh.render([frames[3], frames[1]], spy().effect, () => inputs[0], () => {}), /increasing time order/);
  assert.throws(() => fresh.scan(frames[0]), /increasing time order/);
});
