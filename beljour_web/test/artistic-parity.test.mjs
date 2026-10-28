// All four effects: cross-language byte, mask, metadata and scalar evidence. Author: John Khan.
import test from "node:test";
import assert from "node:assert/strict";
import { renderArtistic } from "../dist/js/filters/artistic/index.js";
import { hashNoise } from "../dist/js/filters/artistic/types.js";
import { vectors, fixture, bytes, maximumGap } from "./artistic-helpers.mjs";

for (const [index, c] of vectors.cases.entries()) {
  test(`artistic Python parity ${c.effect} scenario ${index}`, () => {
    const { image, options } = fixture(c.input);
    const output = renderArtistic(c.effect, image, { ...options, params: c.params });
    assert.ok(maximumGap(output.image, bytes(c.image)) <= vectors.tolerance.byte, "pixel rounding tolerance");
    assert.ok(maximumGap(output.support, c.support) <= vectors.tolerance.support, "support alpha");
    assert.equal(output.label, c.label);
    assert.deepEqual(output.warnings, c.warnings);
    for (const [name, expected] of Object.entries(c.metrics)) {
      const actual = output.metrics[name];
      if (typeof expected === "number") {
        assert.ok(Math.abs(actual - expected) <= vectors.tolerance.metric, `${name}: ${actual} vs ${expected}`);
      } else assert.equal(actual, expected, name);
    }
  });
}

test("unsigned coordinate noise matches Python including largest seed", () => {
  for (const c of vectors.hashes) assert.equal(hashNoise(c.x, c.y, c.seed), c.value);
});
