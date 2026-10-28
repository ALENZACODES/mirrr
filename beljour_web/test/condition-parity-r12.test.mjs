// R12 complete-byte Enhance parity, 25 bounded synthetic images. Author: John Khan.
// The Python generator supplies pixels, unrounded diagnostic evidence and SHA-256.
// Both runtimes must preserve exact output bytes, labels, stage selection and alpha;
// only floating reductions use the fixture's explicit small numerical tolerance.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { inflateSync } from "node:zlib";

import { byteImage } from "../dist/js/engines/core/buffer.js";
import { enhance } from "../dist/js/engines/local/enhance.js";
import { measureSafety } from "../dist/js/engines/local/enhance-safety.js";

const FIXTURE = JSON.parse(readFileSync(new URL("../../parity/condition-r12.json", import.meta.url), "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function equivalent(actual, expected, path) {
  if (typeof actual === "number" && typeof expected === "number") {
    assert.ok(Number.isFinite(actual) && Number.isFinite(expected), `${path}: finite diagnostic`);
    const tolerance = FIXTURE.absolute_tolerance + FIXTURE.relative_tolerance * Math.max(Math.abs(actual), Math.abs(expected));
    assert.ok(Math.abs(actual - expected) <= tolerance, `${path}: ${actual} differs from ${expected}`);
  } else if (Array.isArray(actual) && Array.isArray(expected)) {
    assert.equal(actual.length, expected.length, `${path}: length`);
    for (let i = 0; i < actual.length; i++) equivalent(actual[i], expected[i], `${path}[${i}]`);
  } else if (actual && expected && typeof actual === "object" && typeof expected === "object") {
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), `${path}: keys`);
    for (const key of Object.keys(actual)) equivalent(actual[key], expected[key], `${path}.${key}`);
  } else assert.equal(actual, expected, path);
}

test("R12 condition parity fixture has all five classes and RGB/RGBA rescue paths", () => {
  assert.equal(FIXTURE.format, "beljour-condition-r12/1");
  assert.equal(FIXTURE.synthetic_only, true);
  assert.equal(FIXTURE.author, "John Khan");
  assert.equal(FIXTURE.byte_tolerance, 0);
  assert.equal(FIXTURE.cases.length, 25);
  const pairs = new Set(FIXTURE.cases.map((row) => `${row.condition.primary}/${row.shape[2]}`));
  assert.equal(pairs.size, 10);
  for (const label of ["normal", "low_light", "blurry", "noisy", "old"]) {
    for (const channels of [3, 4]) assert.ok(pairs.has(`${label}/${channels}`));
  }
});

for (const vector of FIXTURE.cases) {
  test(`R12 condition parity: ${vector.id} exact output and diagnostic evidence`, () => {
    const [height, width, channels] = vector.shape;
    assert.ok(Math.max(height, width) <= 96 && [3, 4].includes(channels));
    const bytes = new Uint8Array(inflateSync(Buffer.from(vector.input_zlib_base64, "base64")));
    assert.equal(bytes.length, height * width * channels);
    assert.equal(sha256(bytes), vector.input_sha256);
    const source = byteImage(width, height, channels);
    source.data.set(bytes);
    const result = enhance(source, vector.mode);
    assert.deepEqual([result.image.height, result.image.width, result.image.channels], vector.shape);
    assert.equal(sha256(result.image.data), vector.output_sha256, `${vector.id}: every output byte must match Python`);
    assert.equal(sha256(source.data), vector.input_sha256, "the rescue pipeline must not mutate its input");
    for (const field of ["condition", "steps", "before", "after", "safety"]) {
      equivalent(result[field], vector[field], `${vector.id}.${field}`);
    }
    equivalent(measureSafety(source, result.image), vector.raw_safety, `${vector.id}.raw_safety`);
    if (channels === 4) {
      const original = new Uint8Array(height * width), restored = new Uint8Array(height * width);
      for (let i = 0; i < original.length; i++) {
        original[i] = source.data[i * 4 + 3];
        restored[i] = result.image.data[i * 4 + 3];
      }
      assert.ok(original.includes(0) && original.includes(255));
      assert.deepEqual(restored, original, "transparent, partial and opaque alpha are preserved exactly");
      assert.equal(sha256(restored), vector.alpha_sha256);
    }
    if (vector.required_flags.length) assert.notEqual(vector.output_sha256, vector.input_sha256, "rescue case must exercise a changed output");
  });
}
