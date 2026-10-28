import assert from "node:assert/strict";
import test from "node:test";
import { applyCurvePixels, blendMaskedPixels, cropMaskMapping, defaultRecipe,
  makeCropGeometry, makeCurveLuts, parseRecipe, rasterMask, serializeRecipe,
  sourceMaskMapping, threePointCurve, validateMasks } from "../../../dist/js/pro/index.js";

const add = { mode: "add", opacity: 1 };
const radial = { ...add, kind: "radial", center: { x: 0.5, y: 0.5 },
  radiusX: 0.45, radiusY: 0.45, feather: 0.5 };
const linear = { ...add, kind: "linear", start: { x: 0.1, y: 0.5 },
  end: { x: 0.9, y: 0.5 }, feather: 1 };
const brush = { ...add, kind: "brush", points: [{ x: 0.25, y: 0.5 },
  { x: 0.75, y: 0.5 }], radius: 0.11, hardness: 0.65 };

function sample(bytes, width, x, y) {
  return bytes[y * width + x];
}

test("mask validation rejects empty strokes, unknown operations and nonfinite inputs", () => {
  assert.throws(() => validateMasks([{ ...brush, points: [] }]), /1 to 48/);
  assert.throws(() => validateMasks([{ ...brush, points: Array(49).fill({ x: 0, y: 0 }) }]), /1 to 48/);
  assert.throws(() => validateMasks([{ ...brush, radius: Infinity }]), /radius/);
  assert.throws(() => validateMasks([{ ...brush, hardness: -0.1 }]), /hardness/);
  assert.throws(() => validateMasks([{ ...radial, radiusX: 0 }]), /radial width/);
  assert.throws(() => validateMasks([{ ...radial, feather: NaN }]), /feather/);
  assert.throws(() => validateMasks([{ ...linear, start: linear.end }]), /distinct points/);
  assert.throws(() => validateMasks([{ ...linear, mode: "multiply" }]), /operation/);
  assert.throws(() => validateMasks([{ ...radial, center: { x: -0.1, y: 0.5 } }]), /x/);
  assert.throws(() => validateMasks(Array(17).fill(radial)), /sixteen/);
  assert.throws(() => validateMasks([{}]), /operation/);
});

test("source mapping and empty masks preserve whole-image curve behavior", () => {
  assert.equal(sourceMaskMapping(100, 200).xx, 0.01);
  assert.equal(sourceMaskMapping(100, 200).yy, 0.005);
  assert.deepEqual([...rasterMask([], 2, 2)], [255, 255, 255, 255]);
  assert.throws(() => rasterMask([], 0, 5), /dimensions/);
});

test("radial mask feathering moves smoothly from centre to outer edge", () => {
  const image = rasterMask([radial], 101, 101);
  assert.equal(sample(image, 101, 50, 50), 255);
  const half = sample(image, 101, 82, 50);
  assert.ok(half > 0 && half < 255, `feather at 82=${half}`);
  assert.equal(sample(image, 101, 0, 0), 0);
  assert.ok(sample(image, 101, 80, 50) < sample(image, 101, 65, 50));
});

test("linear feather and hard boundary follow gradient vector", () => {
  const pixels = rasterMask([linear], 100, 5);
  assert.equal(sample(pixels, 100, 0, 2), 0);
  assert.equal(sample(pixels, 100, 99, 2), 255);
  assert.ok(Math.abs(sample(pixels, 100, 50, 2) - 128) <= 3);
  const hard = rasterMask([{ ...linear, feather: 0 }], 100, 5);
  assert.equal(sample(hard, 100, 0, 2), 0);
  assert.equal(sample(hard, 100, 99, 2), 255);
  assert.ok(new Set([...hard]).size <= 2);
});

test("brush paints continuous stroke, feathered edge, and no distant pixels", () => {
  const pixels = rasterMask([brush], 100, 100);
  assert.equal(sample(pixels, 100, 50, 50), 255);
  assert.equal(sample(pixels, 100, 8, 15), 0);
  assert.ok(sample(pixels, 100, 50, 59) > 0);
  assert.ok(sample(pixels, 100, 50, 59) < 255);
  const stamp = rasterMask([{ ...brush, points: [brush.points[0]] }], 100, 100);
  assert.equal(sample(stamp, 100, 25, 50), 255);
  assert.equal(sample(stamp, 100, 75, 50), 0);
});

test("ordered union and subtraction work at byte opacity precision", () => {
  const full = { ...radial, radiusX: 1, radiusY: 1, feather: 0 };
  const erase = { ...radial, mode: "subtract", radiusX: 0.15, radiusY: 0.15, feather: 0 };
  const pixels = rasterMask([full, erase], 100, 100);
  assert.equal(sample(pixels, 100, 50, 50), 0);
  assert.equal(sample(pixels, 100, 50, 10), 255);
  assert.equal(sample(rasterMask([{ ...full, opacity: 0.4 }], 100, 100), 100, 50, 50), 102);
  const halfErase = { ...erase, opacity: 0.5 };
  assert.ok(Math.abs(sample(rasterMask([full, halfErase], 100, 100), 100, 50, 50) - 127) <= 1);
});

test("masked curve edits RGB only in coverage, leaving unmasked pixels and alpha intact", () => {
  const curves = { ...defaultRecipe().curves, master: threePointCurve(0.8) };
  const luts = makeCurveLuts(curves);
  const pixels = new Uint8ClampedArray([75, 80, 90, 255, 75, 80, 90, 255,
    75, 80, 90, 0, 75, 80, 90, 66]);
  const coverage = Uint8Array.from([255, 128, 255, 0]);
  blendMaskedPixels(pixels, luts.red, luts.green, luts.blue, coverage);
  assert.equal(pixels[0], luts.red[75]);
  assert.ok(pixels[4] > 75 && pixels[4] < luts.red[75]);
  assert.deepEqual([...pixels.slice(8, 12)], [75, 80, 90, 0]);
  assert.deepEqual([...pixels.slice(12, 16)], [75, 80, 90, 66]);
  assert.throws(() => blendMaskedPixels(pixels, luts.red, luts.green, luts.blue,
    new Uint8Array(3)), /different dimensions/);
});

test("crop/rotation mapping follows the source, not the display rectangle", () => {
  const crop = { x: 0.1, y: 0.1, width: 0.8, height: 0.8, aspect: "free", rotation: 90 };
  const geometry = makeCropGeometry(100, 100, crop);
  const mapping = cropMaskMapping(geometry, 100, 100);
  const mask = rasterMask([{ ...radial, center: { x: 0.2, y: 0.5 },
    radiusX: 0.06, radiusY: 0.06, feather: 0 }], geometry.width, geometry.height, mapping);
  assert.equal(sample(mask, geometry.width, Math.floor(geometry.width / 2), Math.floor(geometry.height / 2)), 0);
  const max = Math.max(...mask);
  assert.equal(max, 255);
});

test("recipe round trip retains masks and older recipes remain loadable", () => {
  const recipe = { ...defaultRecipe(), masks: [brush, linear, radial] };
  const data = serializeRecipe(recipe);
  assert.deepEqual(parseRecipe(data), recipe);
  const old = JSON.parse(data);
  delete old.recipe.masks;
  assert.deepEqual(parseRecipe(JSON.stringify(old)).masks, []);
  const invalid = JSON.parse(data);
  invalid.recipe.masks[0].points[0].z = 5;
  assert.throws(() => parseRecipe(JSON.stringify(invalid)), /unrecognized fields/);
  invalid.recipe.masks[0].points[0].z = undefined;
  invalid.recipe.masks[0].radius = 7;
  assert.throws(() => parseRecipe(JSON.stringify(invalid)), /radius/);
});

test("timing: 1 MP masked curve preview on test CPU, transform-only <100 ms", () => {
  // Measures 1024x1024 synthetic raster plus RGBA LUT blending. Not browser decode,
  // Canvas getImageData/putImageData, layout, rendering, encoding or mid-range phone speed.
  const width = 1024;
  const height = 1024;
  const src = new Uint8ClampedArray(width * height * 4);
  src.fill(120);
  const tables = makeCurveLuts({ ...defaultRecipe().curves, master: threePointCurve(0.68) });
  function run() {
    const begin = performance.now();
    const mask = rasterMask([radial], width, height);
    blendMaskedPixels(src, tables.red, tables.green, tables.blue, mask);
    return performance.now() - begin;
  }
  run();
  const results = Array.from({ length: 5 }, () => run()).sort((a, b) => a - b);
  const median = results[2];
  assert.ok(median < 100, `1 MP raster+masked LUT median ${median.toFixed(1)}ms, ${results.join(", ")}`);
  assert.notEqual(src[(512 * width + 512) * 4], 120);
});
