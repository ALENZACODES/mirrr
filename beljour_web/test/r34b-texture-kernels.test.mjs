/** Original finishing kernel parity and deterministic numeric contracts.
 * All pixels are synthetic and kept on the device. Created by John Khan.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { op } from "../dist/js/filters/colour/ops.js";
import { toBytes } from "../dist/js/filters/colour/lut.js";
import { checkParams, checkStage } from "../dist/js/filters/recipe/schema.js";
import { grain, grainNoise, MAX_GRAIN, GRAIN_SEED } from "../dist/js/filters/spatial/grain.js";
import { structure, structureRadius, MAX_DELTA } from "../dist/js/filters/spatial/structure.js";

const data = JSON.parse(readFileSync(new URL("../../parity/filters-fx2-texture.json", import.meta.url), "utf8"));
const kinds = ["spatial.grain", "spatial.structure"];
const fixture = (w, h, value = 0.5) => ({ width: w, height: h,
  data: new Float64Array(w * h * 3).fill(value) });
const frame = (w, h, x0 = 0, y0 = 0) => ({ width: w, height: h, x0, y0 });
const grainParams = (amount = 1, seed = GRAIN_SEED) => ({ amount, seed });
const structureParams = (amount = 1, radius = 0.012, threshold = 0.015) => ({ amount, radius, threshold });
const apply = (name, block, params, where) => name === "spatial.grain"
  ? grain(block, params, where) : structure(block, params, where);

function bytesEqual(a, b, why) {
  assert.deepEqual(Buffer.from(a), Buffer.from(b), why);
}

function makePattern(width, height) {
  const input = new Float64Array(width * height * 3);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 3;
    input[i] = ((x * 23 + y * 17 + 49) % 256) / 255;
    input[i + 1] = ((x * 31 + y * 7 + 79) % 256) / 255;
    input[i + 2] = ((x * 13 + y * 41 + 107) % 256) / 255;
  }
  return { width, height, data: input };
}

test("Python-generated texture parity has six scenes per original engine", () => {
  assert.equal(data.format, "beljour-original-texture-parity/1");
  assert.equal(data.source, "synthetic-only");
  assert.equal(data.encoding, "rgb-u8-base64");
  assert.equal(data.real_faces, 0);
  assert.equal(data.author, "John Khan");
  assert.equal(data.vectors.length, 12);
  for (const name of kinds) {
    const records = data.vectors.filter((v) => v.op === name);
    assert.equal(records.length, 6);
    assert.equal(new Set(records.map((v) => v.case)).size, 6);
    assert.ok(records.some((v) => v.frame.x0 > 0));
    assert.ok(records.some((v) => v.params.amount === 0));
  }
});

for (const v of data.vectors) {
  test(`byte-exact Python/TypeScript texture vector ${v.op}: ${v.case}`, () => {
    const block = { width: v.width, height: v.height,
      data: Float64Array.from(Buffer.from(v.input_b64, "base64"), (value) => value / 255) };
    const before = Float64Array.from(block.data);
    const expected = Buffer.from(v.output_b64, "base64");
    const actual = apply(v.op, block, v.params, v.frame);
    assert.equal(actual.data.length, v.width * v.height * 3);
    assert.equal(expected.length, actual.data.length);
    bytesEqual(toBytes(actual.data), expected, `${v.op}/${v.case}`);
    assert.deepEqual(block.data, before, "source is not mutated");
    assert.ok(actual.data.every((value) => Number.isFinite(value) && value >= 0 && value <= 1));
  });
}

test("new kernel names and limits are real registered ops", () => {
  for (const name of kinds) {
    const registered = op(name);
    assert.equal(registered.family, "spatial");
    assert.equal(registered.skinHue, false);
    assert.equal(checkStage({ op: name }, name).length, 0);
    assert.ok(typeof registered.image === "function");
  }
  assert.throws(() => op("spatial.fakeGrain"), /unknown/);
});

test("grain parameter validation rejects nonintegral and oversized seeds", () => {
  const registered = op("spatial.grain");
  for (const valid of [0, 1, 104729, 0xffffffff]) {
    assert.deepEqual(checkParams(registered, { seed: valid }, "seed"), []);
  }
  for (const bad of [-1, 0xffffffff + 1, NaN, Infinity, -Infinity, 0.9, 1.5]) {
    assert.ok(checkParams(registered, { seed: bad }, "seed").length > 0);
  }
  for (const bad of [-1, 0xffffffff + 1, NaN, 1.25]) {
    assert.throws(() => grainNoise(2, 3, frame(2, 3), bad), /seed/);
  }
});

test("structure stage bounds are checked before render", () => {
  const registered = op("spatial.structure");
  for (const [param, values] of Object.entries({
    amount: [-0.1, 1.1, NaN, Infinity],
    radius: [-0.02, 0.0, 0.5, NaN],
    threshold: [-0.1, 0.10, Infinity],
  })) {
    for (const value of values) {
      assert.ok(checkParams(registered, { [param]: value }, "structure").length > 0);
    }
  }
});

test("zero amount leaves each input byte and floating channel untouched", () => {
  const block = makePattern(41, 27);
  for (const name of kinds) {
    const p = name === "spatial.grain" ? grainParams(0) : structureParams(0);
    const result = apply(name, block, p, frame(41, 27));
    assert.notEqual(result.data, block.data);
    assert.deepEqual(result.data, block.data);
  }
});

test("clean black and white cards are bitwise stable", () => {
  const source = fixture(43, 29);
  for (let y = 0; y < 29; y++) for (let x = 0; x < 43; x++) {
    const i = (y * 43 + x) * 3;
    if (x < 9) source.data.fill(0, i, i + 3);
    if (x >= 34) source.data.fill(1, i, i + 3);
  }
  for (const name of kinds) {
    const p = name === "spatial.grain" ? grainParams(1) : structureParams(1);
    const edited = apply(name, source, p, frame(43, 29));
    for (let y = 0; y < 29; y++) for (let x = 0; x < 43; x++) {
      if (x >= 9 && x < 34) continue;
      const i = (y * 43 + x) * 3;
      assert.deepEqual(Array.from(edited.data.subarray(i, i + 3)),
        Array.from(source.data.subarray(i, i + 3)));
    }
  }
});

test("grain is repeatable after intervening operations", () => {
  const block = makePattern(29, 23);
  const where = frame(29, 23);
  const p = grainParams(0.82, 876231);
  const first = grain(block, p, where);
  structure(block, structureParams(0.73), where);
  grain(block, grainParams(1, 987), where);
  const again = grain(block, p, where);
  assert.deepEqual(first.data, again.data);
});

test("grain field stays tied to global coordinates when cut into tiles", () => {
  const photo = frame(321, 247);
  const whole = new Float64Array(105 * 75);
  for (let y = 0; y < 75; y++) for (let x = 0; x < 105; x++) {
    whole[y * 105 + x] = grainNoise(x, y, photo, 21);
  }
  for (const [x, y, w, h] of [[0, 0, 12, 15], [21, 28, 19, 22], [70, 40, 35, 35]]) {
    const tile = frame(321, 247, x, y);
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) {
      const local = grainNoise(x + dx, y + dy, tile, 21);
      const original = whole[(y + dy) * 105 + x + dx];
      assert.equal(local, original);
    }
  }
});

test("full-photo dimensions participate in grain key, not frame offset alone", () => {
  const a = grainNoise(15, 18, frame(120, 140), 22);
  const b = grainNoise(15, 18, frame(120, 141), 22);
  const c = grainNoise(15, 18, frame(120, 140), 23);
  assert.notEqual(a, b);
  assert.notEqual(a, c);
});

test("grain never introduces chromatic noise into monochrome light", () => {
  const b = fixture(59, 43);
  const result = grain(b, grainParams(1), frame(59, 43));
  let changed = 0;
  for (let i = 0; i < result.data.length; i += 3) {
    assert.equal(result.data[i], result.data[i + 1]);
    assert.equal(result.data[i + 1], result.data[i + 2]);
    if (result.data[i] !== 0.5) changed++;
  }
  assert.ok(changed > 500);
});

test("grain amount limits maximum pixel movement", () => {
  const b = makePattern(53, 45);
  for (const amount of [0.01, 0.10, 0.25, 0.5, 0.8, 1]) {
    const out = grain(b, grainParams(amount), frame(53, 45));
    for (let i = 0; i < out.data.length; i++) {
      assert.ok(Math.abs(out.data[i] - b.data[i]) <= MAX_GRAIN * amount + 1e-12);
    }
  }
});

test("structure has finite output and a conservative delta budget", () => {
  const b = makePattern(49, 56);
  for (const amount of [0.01, 0.1, 0.33, 0.57, 0.9, 1.0]) {
    const out = structure(b, structureParams(amount), frame(49, 56));
    for (let i = 0; i < out.data.length; i++) {
      assert.ok(Number.isFinite(out.data[i]));
      assert.ok(out.data[i] >= 0 && out.data[i] <= 1);
      assert.ok(Math.abs(out.data[i] - b.data[i]) <= MAX_DELTA + 1e-12);
    }
  }
});

test("structure preserves a solid neutral area exactly", () => {
  for (const shade of [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1]) {
    const b = fixture(31, 37, shade);
    const out = structure(b, structureParams(1), frame(31, 37));
    for (let i = 0; i < b.data.length; i++) {
      assert.ok(Math.abs(out.data[i] - shade) <= 1e-14);
    }
  }
});

test("structure enhances a strong mark rather than blurring it away", () => {
  const b = fixture(53, 51);
  const i = (25 * 53 + 26) * 3;
  b.data.fill(0.72, i, i + 3);
  const out = structure(b, structureParams(0.84), frame(53, 51));
  assert.ok(out.data[i] > b.data[i]);
  assert.ok(out.data[i - 3] < b.data[i - 3]);
});

test("structure radius increases at a predictable whole-photo scale", () => {
  const sizes = [20, 50, 100, 300, 1000, 4000];
  let previous = 0;
  for (const side of sizes) {
    const value = structureRadius(0.018, frame(side * 2, side));
    assert.ok(value >= previous);
    previous = value;
  }
  assert.equal(structureRadius(0.018, frame(1000, 400)),
    structureRadius(0.018, frame(1000, 400, 20, 30)));
});

test("computed neutral grey and white stay channel neutral", () => {
  for (const name of kinds) {
    const b = fixture(44, 35, 0.55);
    for (let p = 0; p < b.width * b.height; p++) {
      const v = p % 7 === 0 ? 1 : p % 11 === 0 ? 0 : 0.55;
      b.data.fill(v, p * 3, p * 3 + 3);
    }
    const out = apply(name, b,
      name === "spatial.grain" ? grainParams(0.6) : structureParams(0.6),
      frame(b.width, b.height));
    for (let i = 0; i < out.data.length; i += 3) {
      assert.equal(out.data[i], out.data[i + 1]);
      assert.equal(out.data[i + 1], out.data[i + 2]);
    }
  }
});
