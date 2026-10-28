import assert from "node:assert/strict";
import test from "node:test";
import { performance } from "node:perf_hooks";
import { applyCurvePixels, curveLut, curveValue, makeCurveLuts, threePointCurve,
  validateCurve } from "../../../dist/js/pro/index.js";
import { defaultCurves } from "../../../dist/js/pro/types.js";

const identity = [ { x: 0, y: 0 }, { x: 1, y: 1 } ];

test("curves: neutral 256-entry LUT preserves every byte and alpha", () => {
  assert.deepEqual([...curveLut(identity)], Array.from({ length: 256 }, (_, n) => n));
  const rgba = new Uint8ClampedArray([0, 75, 255, 0, 120, 220, 80, 127, 255, 100, 30, 255]);
  const saved = new Uint8ClampedArray(rgba);
  const tables = makeCurveLuts(defaultCurves());
  assert.equal(tables.neutral, true);
  applyCurvePixels(rgba, tables);
  assert.deepEqual(rgba, saved);
});

test("curves: monotone interpolation has no bounce at segments or endpoints", () => {
  const points = [{ x: 0, y: 0.07 }, { x: 0.25, y: 0.15 },
    { x: 0.51, y: 0.82 }, { x: 0.7, y: 0.82 }, { x: 1, y: 0.98 }];
  const table = curveLut(points);
  assert.equal(table[0], Math.round(0.07 * 255));
  assert.equal(table[255], Math.round(0.98 * 255));
  for (let i = 1; i < table.length; i++) assert.ok(table[i] >= table[i - 1]);
  assert.ok(curveValue(points, 0.45) >= 0.15);
  assert.ok(curveValue(points, 0.45) <= 0.82);
  assert.equal(curveValue(points, 1.2), 0.98);
});

test("curves: invalid, unordered and non-finite points fail closed", () => {
  assert.throws(() => validateCurve([]));
  assert.throws(() => validateCurve([{ x: 0, y: 0 }, { x: 0.5, y: 0.9 }, { x: 1, y: 0.3 }]));
  assert.throws(() => validateCurve([{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }]));
  assert.throws(() => validateCurve([{ x: 0, y: NaN }, { x: 1, y: 1 }]));
  assert.throws(() => threePointCurve(2));
  assert.throws(() => curveValue(identity, Infinity));
  assert.throws(() => applyCurvePixels(new Uint8Array(7), makeCurveLuts(defaultCurves())));
});

test("curves: composite master then red curve, leave green/blue/alpha unchanged", () => {
  const red = threePointCurve(0.75);
  const tables = makeCurveLuts({ ...defaultCurves(), red });
  const pixels = new Uint8Array([60, 60, 60, 10, 128, 200, 220, 245]);
  applyCurvePixels(pixels, tables);
  assert.ok(pixels[0] > 60);
  assert.ok(pixels[4] > 128);
  assert.deepEqual([pixels[1], pixels[2], pixels[3], pixels[5], pixels[6], pixels[7]],
    [60, 60, 10, 200, 220, 245]);
});

test("curves: hidden fully transparent pixels are not mutated", () => {
  const red = threePointCurve(0.75);
  const tables = makeCurveLuts({ ...defaultCurves(), red });
  const pixels = new Uint8Array([100, 30, 90, 0, 100, 30, 90, 255]);
  applyCurvePixels(pixels, tables);
  assert.deepEqual([...pixels.subarray(0, 4)], [100, 30, 90, 0]);
  assert.ok(pixels[4] !== 100);
});

test("timing: 640-edge preview curve edit stays under 100 ms", () => {
  const width = 360;
  const height = 640;
  const pixels = new Uint8ClampedArray(width * height * 4);
  pixels.fill(101);
  const tables = makeCurveLuts({ ...defaultCurves(), master: threePointCurve(0.64) });
  for (let n = 0; n < 5; n++) applyCurvePixels(pixels, tables);
  const start = performance.now();
  applyCurvePixels(pixels, tables);
  const elapsed = performance.now() - start;
  assert.ok(elapsed < 100, `640-edge CPU curve-only preview ${elapsed.toFixed(1)} ms`);
});

