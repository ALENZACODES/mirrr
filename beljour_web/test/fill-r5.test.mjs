// R5 E07 fill in TypeScript: fast marching, PatchMatch-lite, biharmonic, wrapper and engine,
// with Q1 and Q4 seam checks on synthetic images. Author: John Khan.
import assert from "node:assert/strict";
import { test } from "node:test";

import { byteImage, floatImage } from "../dist/js/engines/core/buffer.js";
import { runEngine } from "../dist/js/engines/core/engine.js";
import { biharmonic, laplacian, onionMean } from "../dist/js/engines/fill/biharmonic.js";
import { FillEngine, METHODS, fill } from "../dist/js/engines/fill/fill.js";
import { fastMarching } from "../dist/js/engines/fill/fmm.js";
import { MinHeap } from "../dist/js/engines/fill/heap.js";
import { onionPeel, patchMatch, roundDiv, XorShift32 } from "../dist/js/engines/fill/patchmatch.js";
import { q1OutsideMask, q4Seam } from "../dist/js/quality/metrics.js";
import { defaultRegistry } from "../dist/js/engines/core/worker.js";

function disc(w, h, cx, cy, r) {
  const m = floatImage(w, h, 1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) m.data[y * w + x] = (x - cx) ** 2 + (y - cy) ** 2 <= r * r ? 1 : 0;
  return m;
}

function stripes(w, h, period = 6) {
  const img = byteImage(w, h, 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const phase = (x + 2 * y) % period, p = (y * w + x) * 3;
    img.data[p] = 60 + 25 * phase; img.data[p + 1] = 200 - 20 * phase; img.data[p + 2] = 90 + 10 * (phase % 2);
  }
  return img;
}

function smoothPhoto(w, h) {
  const img = byteImage(w, h, 3);
  const clip = (v) => Math.min(255, Math.max(0, Math.round(v)));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = (y * w + x) * 3;
    img.data[p] = clip(90 + (80 * x) / w + 20 * Math.sin(y / 9));
    img.data[p + 1] = clip(70 + (60 * y) / h);
    img.data[p + 2] = clip(120 + 40 * Math.cos((x + y) / 14));
  }
  return img;
}

function damage(img, hole) {
  const out = { ...img, data: new Uint8Array(img.data) };
  for (let i = 0; i < hole.data.length; i++) if (hole.data[i] > 0) out.data.set([250, 10, 250], i * img.channels);
  return out;
}

test("min-heap orders by key, then by index", () => {
  const heap = new MinHeap();
  for (const [k, i] of [[2, 5], [1, 9], [1, 3], [0.5, 7], [2, 1]]) heap.push(k, i);
  const out = [];
  for (let top = heap.pop(); top; top = heap.pop()) out.push(top);
  assert.deepEqual(out, [[0.5, 7], [1, 3], [1, 9], [2, 1], [2, 5]]);
  assert.equal(heap.pop(), null);
});

test("fast marching reproduces linear ramps and keeps a flat fill flat", () => {
  const w = 30, h = 24, ramp = floatImage(w, h, 2, true);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    ramp.data[(y * w + x) * 2] = 0.2 + 0.01 * x; ramp.data[(y * w + x) * 2 + 1] = 0.7 - 0.02 * y + 0.005 * x;
  }
  const hole = disc(w, h, 14, 12, 6);
  const damaged = floatImage(w, h, 2, true);
  for (let i = 0; i < w * h; i++) for (let c = 0; c < 2; c++) damaged.data[i * 2 + c] = hole.data[i] ? 0 : ramp.data[i * 2 + c];
  const res = fastMarching(damaged, hole, { radius: 4 });
  for (let i = 0; i < ramp.data.length; i++) assert.ok(Math.abs(res.image.data[i] - ramp.data[i]) < 1e-7);
  const flat = floatImage(20, 20, 1, true); flat.data.fill(0.4);
  const small = disc(20, 20, 10, 10, 5);
  const f = fastMarching(flat, small, { gradient: false });
  assert.ok(f.image.data.every((v) => Math.abs(v - 0.4) < 1e-12));
  assert.equal(f.order.length, small.data.reduce((s, v) => s + v, 0));
  assert.equal(f.order[f.order.length - 1], 10 * 20 + 10);
  assert.throws(() => fastMarching(flat, disc(20, 20, 10, 10, 40)), /whole image/);
  assert.throws(() => fastMarching(flat, small, { radius: 0 }), RangeError);
});

test("xorshift, rounding and onion peel", () => {
  const a = new XorShift32(1), b = new XorShift32(1);
  assert.equal(a.next(), b.next());
  assert.equal(new XorShift32(0).state, 0x9e3779b9);
  assert.deepEqual([roundDiv(5, 2), roundDiv(7, 2), roundDiv(7, 3), roundDiv(8, 3)], [2, 4, 2, 3]);
  assert.throws(() => new XorShift32(-1), RangeError);
  const img = byteImage(9, 9, 3); img.data.fill(100);
  const hole = new Uint8Array(81);
  for (let y = 3; y < 6; y++) for (let x = 3; x < 6; x++) hole[y * 9 + x] = 1;
  assert.ok(onionPeel(img, hole).every((v) => v === 100));
});

test("PatchMatch-lite restores a periodic texture exactly and is deterministic", () => {
  const truth = stripes(44, 40), hole = disc(44, 40, 22, 20, 5);
  const res = patchMatch(damage(truth, hole), hole, { patchRadius: 3, iterations: 6, seed: 7 });
  assert.deepEqual(res.image.data, truth.data);
  assert.equal(res.meanDistance[res.meanDistance.length - 1], 0);
  const photo = smoothPhoto(32, 32), small = disc(32, 32, 16, 16, 4);
  const one = patchMatch(photo, small, { seed: 3 }), two = patchMatch(photo, small, { seed: 3 });
  assert.deepEqual(one.image.data, two.image.data);
  assert.throws(() => patchMatch(smoothPhoto(8, 8), disc(8, 8, 4, 4, 2), { patchRadius: 3 }), /no complete source/);
  assert.throws(() => patchMatch(photo, small, { patchRadius: 0 }), RangeError);
});

test("biharmonic fill reproduces cubic surfaces", () => {
  const w = 34, h = 30, surface = floatImage(w, h, 1, true), damaged = floatImage(w, h, 1, true);
  const hole = disc(w, h, 17, 15, 7);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = 0.3 + 0.002 * x * x - 0.001 * x * y + 0.00005 * y ** 3 + 0.01 * y;
    surface.data[y * w + x] = v; damaged.data[y * w + x] = hole.data[y * w + x] ? 0 : v;
  }
  const res = biharmonic(damaged, hole);
  assert.ok(res.converged);
  assert.deepEqual(res.box, [8, 6, 26, 24]);
  for (let i = 0; i < surface.data.length; i++) assert.ok(Math.abs(res.image.data[i] - surface.data[i]) < 1e-7);
  const lap = laplacian(Float64Array.from({ length: 12 }, (_, i) => i * i), 4, 3);
  assert.ok(Math.abs(lap.reduce((s, v) => s + v, 0)) < 1e-9);
  const plane = new Float64Array(25).fill(3), one = new Uint8Array(25); one[12] = 1;
  assert.equal(onionMean(plane, one, 5, 5)[12], 3);
});

test("wrapper: every method changes only the hole and leaves no seam", () => {
  const truth = smoothPhoto(48, 40), hole = disc(48, 40, 24, 20, 6), damaged = damage(truth, hole);
  for (const method of METHODS) {
    const out = fill(damaged, hole, method);
    assert.equal(out.holePixels, hole.data.reduce((s, v) => s + v, 0));
    assert.ok(q1OutsideMask(damaged, out.image, hole, { dilatePx: 0 }).passed, method);
    const seam = q4Seam(truth, out.image, hole);
    assert.ok(seam.passed, `${method} ${JSON.stringify(seam.measured)}`);
    let err = 0, n = 0;
    for (let i = 0; i < hole.data.length; i++) if (hole.data[i]) for (let c = 0; c < 3; c++) { err += Math.abs(out.image.data[i * 3 + c] - truth.data[i * 3 + c]); n++; }
    assert.ok(err / n < 12, `${method} mean error ${err / n}`);
  }
  assert.ok(fill(damaged, hole, "fast-marching", { grow: 2 }).holePixels > hole.data.reduce((s, v) => s + v, 0));
  assert.throws(() => fill(damaged, hole, "lama"), RangeError);
  assert.throws(() => fill(damaged, hole, "biharmonic", { grow: -1 }), RangeError);
});

test("fill engine through contract 13 and the worker registry", () => {
  const truth = smoothPhoto(40, 32), hole = disc(40, 32, 20, 16, 5), damaged = damage(truth, hole);
  for (const method of METHODS) {
    const res = runEngine(new FillEngine(), damaged, null, { hole }, { method }, 5);
    assert.equal(res.pipelineVersion, "fill-1.0.0");
    assert.equal(res.metrics.hole_pixels, hole.data.reduce((s, v) => s + v, 0));
  }
  assert.throws(() => runEngine(new FillEngine(), damaged, null, {}, { method: "biharmonic" }), /was not given/);
  assert.ok(defaultRegistry().names().includes("fill"));
});
