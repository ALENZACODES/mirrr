// Independent numerical brush, compositing and evidence-cleanup tests. Author: John Khan.
import assert from "node:assert/strict";
import { test } from "node:test";
import { bezier, combine, filled, paint, randomValues, restoreTraceBackground, segmentDistance, smoothstep, stroke } from "../dist/js/engines/eyes/raster.js";

test("finite segment distance clamps projection to each endpoint", () => {
  assert.equal(segmentDistance(-1, 0, [0, 0], [4, 0]), 1);
  assert.equal(segmentDistance(1, 3, [0, 0], [4, 0]), 3);
  assert.equal(segmentDistance(5, 0, [0, 0], [4, 0]), 1);
  assert.equal(segmentDistance(3, 4, [0, 0], [0, 0]), 5);
});

test("quadratic brush curve has exact endpoints and known midpoint", () => {
  const points = bezier([0, 0], [2, 4], [4, 0], 4);
  assert.deepEqual(points[0], [0, 0]);
  assert.deepEqual(points[2], [2, 2]);
  assert.deepEqual(points.at(-1), [4, 0]);
  assert.equal(points.length, 5);
  assert.throws(() => bezier([0, 0], [1, 1], [2, 0], 65), /steps/);
});

test("paint uses explicit half-up rounding, immutable input and unchanged alpha", () => {
  const photo = { width: 2, height: 1, channels: 4, data: new Uint8ClampedArray([100, 101, 103, 173, 50, 50, 50, 0]) };
  const before = photo.data.slice(), output = paint(photo, new Float64Array([.5, 1]), [51, 52, 54]);
  assert.deepEqual(Array.from(output.slice(0, 4)), [76, 77, 79, 173]);
  assert.deepEqual(Array.from(output.slice(4)), [50, 50, 50, 0]);
  assert.deepEqual(photo.data, before);
});

test("paint reads a different pigment at each pixel and leaves zero coverage exact", () => {
  const photo = { width: 3, height: 2, channels: 3, data: new Uint8ClampedArray(18).fill(80) };
  const field = new Float64Array(18);
  field.set([200, 100, 50], 0);
  field.set([50, 150, 250], 15);
  const mask = new Float64Array([.25, 0, 0, 0, 0, 1]);
  const output = paint(photo, mask, field);
  assert.deepEqual(Array.from(output.slice(0, 3)), [110, 85, 73]);
  assert.deepEqual(Array.from(output.slice(15, 18)), [50, 150, 250]);
  assert.deepEqual(output.slice(3, 15), photo.data.slice(3, 15));
});

for (const invalid of [NaN, -.1, 1.1, Infinity]) {
  test(`paint rejects out-of-contract alpha ${String(invalid)}`, () => {
    const photo = { width: 1, height: 1, channels: 3, data: new Uint8ClampedArray(3) };
    assert.throws(() => paint(photo, new Float64Array([invalid]), [0, 0, 0]), /0..1/);
  });
}

test("coverage union agrees with inclusion-exclusion and is commutative", () => {
  const a = new Float64Array([0, .25, 1]), b = new Float64Array([.3, .5, .2]);
  const actual = combine(a, b);
  assert.ok(Math.abs(actual[0] - .3) < 1e-12);
  assert.equal(actual[1], .625);
  assert.equal(actual[2], 1);
  assert.deepEqual(actual, combine(b, a));
  assert.deepEqual(Array.from(a), [0, .25, 1]);
  assert.throws(() => combine(a, new Float64Array(2)), /mismatch/);
});

test("the shared polygon kernel produces exact full and half-pixel rectangles", () => {
  const mask = filled(4, 5, [[1, 1], [4, 1], [4, 3], [1, 3]]);
  assert.equal(mask.reduce((sum, value) => sum + value, 0), 6);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 5; x++) assert.equal(mask[y * 5 + x], y >= 1 && y < 3 && x >= 1 && x < 4 ? 1 : 0);
  const shifted = filled(4, 5, [[1.5, 1], [4, 1], [4, 3], [1.5, 3]]);
  assert.equal(shifted[6], .5);
  assert.equal(shifted[11], .5);
  assert.equal(shifted.reduce((sum, value) => sum + value, 0), 5);
});

test("stroke translation retains coverage and near-edge brushes do not wrap", () => {
  const one = stroke(20, 20, [[4, 5], [9, 7]], 1), two = stroke(20, 20, [[6, 8], [11, 10]], 1);
  for (let y = 0; y < 17; y++) for (let x = 0; x < 18; x++) assert.ok(Math.abs(one[y * 20 + x] - two[(y + 3) * 20 + x + 2]) < 1e-12);
  const edge = stroke(20, 20, [[-3, 3], [2, 5]], 1);
  assert.ok(edge.some(v => v > 0));
  for (let y = 0; y < 20; y++) for (let x = 15; x < 20; x++) assert.equal(edge[y * 20 + x], 0);
});

test("taper reduces the tip cross section without moving the root", () => {
  const path = [[5, 10], [8, 10], [11, 10], [14, 10]];
  const plain = stroke(20, 20, path, 1.5), tapered = stroke(20, 20, path, 1.5, true);
  assert.ok(tapered.every((v, i) => v <= plain[i] + 1e-12));
  assert.ok(tapered.reduce((sum, v) => sum + v, 0) < plain.reduce((sum, v) => sum + v, 0));
  assert.ok(tapered[10 * 20 + 5] > 0);
});

test("stroke rejects nonfinite geometry, invalid radius and oversized softness", () => {
  assert.throws(() => stroke(10, 10, [[1, 1]], 1), /two points/);
  assert.throws(() => stroke(10, 10, [[1, 1], [2, 2]], 0), /radius/);
  assert.throws(() => stroke(10, 10, [[1, 1], [NaN, 2]], 1), /finite/);
  assert.throws(() => stroke(10, 10, [[1, 1], [2, 2]], 1, false, Infinity), /softness/);
});

test("smoothstep endpoints, midpoint and saturation agree with the cubic", () => {
  assert.deepEqual([-2, 0, .5, 1, 3].map(x => smoothstep(0, 1, x)), [0, 0, .5, 1, 1]);
  assert.equal(smoothstep(0, 1, .25), .15625);
});

test("lash variation RNG agrees with a hand-computed unsigned first state", () => {
  const first = ((1664525 * 17 + 1013904223) % (2 ** 32)) / (2 ** 32);
  const values = randomValues(17, 20);
  assert.equal(values[0], first);
  assert.deepEqual(values, randomValues(17, 20));
  assert.notDeepEqual(values, randomValues(18, 20));
  assert.ok(values.every(v => v >= 0 && v < 1));
});

test("observed trace background repair changes only supplied support and preserves the eyeball", () => {
  const photo = { width: 9, height: 9, channels: 3, data: new Uint8ClampedArray(9 * 9 * 3).fill(170) };
  const index = 4 * 9 + 4;
  photo.data.set([20, 20, 20], index * 3);
  const mask = new Float64Array(81), protectedMask = new Float64Array(81);
  mask[index] = 1;
  const actual = restoreTraceBackground(photo, mask, protectedMask);
  assert.deepEqual(Array.from(actual.image.slice(index * 3, index * 3 + 3)), [170, 170, 170]);
  assert.equal(actual.unreliable, 0);
  for (let i = 0; i < photo.data.length; i++) if (Math.floor(i / 3) !== index) assert.equal(actual.image[i], photo.data[i]);
  protectedMask[index] = 1;
  assert.deepEqual(restoreTraceBackground(photo, mask, protectedMask).image, photo.data);
});

test("cleanup with no background samples leaves pixels intact and reports every remnant", () => {
  const photo = { width: 3, height: 3, channels: 3, data: new Uint8ClampedArray(27).fill(50) };
  const result = restoreTraceBackground(photo, new Float64Array(9).fill(1), new Float64Array(9));
  assert.equal(result.unreliable, 9);
  assert.deepEqual(result.image, photo.data);
});
