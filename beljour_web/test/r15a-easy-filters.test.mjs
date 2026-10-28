// Independent TypeScript mirrors checked against actual Python rendering bytes.
// All fixtures drawn; no model, network or identifiable photograph. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { whiten } from "../dist/js/engines/teeth/whiten.js";
import { irisColour } from "../dist/js/engines/eyes/iris-colour.js";
import { glowTan } from "../dist/js/engines/skin/glow-tan.js";
import { srgbToLab } from "../dist/js/engines/shade/colourspace.js";

const cases = JSON.parse(readFileSync(new URL("../../parity/r15a-easy-filters.json", import.meta.url))).cases;
const bytes = (text) => Uint8Array.from(Buffer.from(text, "base64"));
const photograph = (c) => ({ width: c.width, height: c.height, channels: 3, data: bytes(c.image) });

function result(c) {
  const photo = photograph(c), mask = bytes(c.mask), p = c.params;
  if (c.kind === "teeth") return whiten(photo, mask, p.strength);
  if (c.kind === "iris") return irisColour(photo, mask, p.shade, p.strength);
  if (c.kind === "tan") return glowTan(photo, mask, p.undertone, p.strength, p.freckles, p.seed);
  throw new Error("unknown case");
}

for (const c of cases) {
  test(`Python/TS pixel parity: ${c.kind} ${JSON.stringify(c.params)}`, () => {
    const got = result(c).image, expected = bytes(c.out);
    assert.equal(got.length, expected.length);
    let max = 0, diff = 0;
    for (let i = 0; i < got.length; i++) { max = Math.max(max, Math.abs(got[i] - expected[i])); diff += got[i] !== expected[i] ? 1 : 0; }
    assert.ok(max <= 1, `Python/TS max-channel error ${max}, ${diff} mismatched bytes`);
    const source = bytes(c.image), region = bytes(c.mask);
    for (let i = 0; i < region.length; i++) {
      if (region[i] === 0) for (let channel = 0; channel < 3; channel++) {
        assert.equal(got[i * 3 + channel], source[i * 3 + channel], `outside mask at ${i}`);
      }
    }
  });
}

test("closed-mouth and unobserved iris return photograph unchanged", () => {
  const c = cases[0], photo = photograph(c), empty = new Uint8Array(c.width * c.height);
  assert.deepEqual(whiten(photo, empty).image, Uint8ClampedArray.from(photo.data));
  assert.deepEqual(irisColour(photo, empty).image, Uint8ClampedArray.from(photo.data));
});

test("synthetic freckles seeded deterministically independent of instance", () => {
  const c = cases.find((c) => c.kind === "tan" && c.params.freckles);
  assert.deepEqual(result(c).image, result(c).image);
  const base = result({ ...c, params: { ...c.params, freckles: false } });
  assert.notDeepEqual(result(c).image, base.image);
});

test("tan lightness never rises and optical teeth keep non-blue warmth", () => {
  for (const c of cases) {
    if (c.kind !== "tan" && c.kind !== "teeth") continue;
    const before = bytes(c.image), after = result(c).image, mask = bytes(c.mask);
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      const a = srgbToLab([before[i * 3], before[i * 3 + 1], before[i * 3 + 2]]);
      const b = srgbToLab([after[i * 3], after[i * 3 + 1], after[i * 3 + 2]]);
      if (c.kind === "tan") assert.ok(b[0] <= a[0] + 1e-6);
      if (c.kind === "teeth" && b[0] > a[0] + 0.5) assert.ok(b[2] >= 3.7);
    }
  }
});

test("invalid masks, parameter values, and unknown original shade are rejected", () => {
  const c = cases[0], photo = photograph(c);
  assert.throws(() => whiten(photo, [], 100), /mask dimensions/);
  assert.throws(() => whiten(photo, bytes(c.mask), 101), /strength/);
  assert.throws(() => irisColour(photo, bytes(c.mask), "unknown"), /unknown original/);
  assert.throws(() => glowTan(photo, bytes(c.mask), "unknown"), /undertone/);
  assert.throws(() => glowTan(photo, bytes(c.mask), "olive", 40, true, -1), /uint32/);
});
