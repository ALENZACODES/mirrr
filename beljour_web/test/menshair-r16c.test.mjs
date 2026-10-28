/** Python->TypeScript short-sides parity and boundary tests.
 * Synthetic pixel arrays only; not real portraits or an inferred haircut result.
 * Author: John Khan.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as H from "../dist/js/engines/menshair/render.js";

const PARITY = JSON.parse(readFileSync(new URL("../../parity/menshair-r16c.json", import.meta.url), "utf8"));
const SOURCE = JSON.parse(readFileSync(new URL("../dist/menshair-presets.json", import.meta.url), "utf8"));
const bytes = (encoded) => new Uint8Array(Buffer.from(encoded, "base64"));

function compare(actual, wanted, allowed, name) {
  assert.equal(actual.length, wanted.length, `${name} pixel count`);
  let max = 0;
  for (let i = 0; i < actual.length; i += 1) {
    max = Math.max(max, Math.abs(actual[i] - wanted[i]));
    assert.ok(Math.abs(actual[i] - wanted[i]) <= allowed,
      `${name} byte ${i}: browser ${actual[i]}, Python ${wanted[i]}`);
  }
  return max;
}

test("18 authored recipes validate and contain no verified provider template IDs", () => {
  assert.equal(PARITY.format, "beljour-menshair-parity/1");
  assert.equal(SOURCE.author, "John Khan");
  assert.ok(SOURCE.styles.length >= 18);
  assert.doesNotThrow(() => H.validatePresets(SOURCE));
  assert.deepEqual([...new Set(SOURCE.styles.slice(0, 18).map((style) => style.family))].sort(),
    ["fade", "taper", "undercut", "crew", "side-part", "crop", "buzz"].sort());
  assert.ok(SOURCE.styles.every((style) => !Object.hasOwn(style, "template_id") && style.id.startsWith("local-")));
  assert.match(SOURCE.simulation_label, /simulation/);
  const item = H.requireStyle(SOURCE, "local-low-fade");
  assert.equal(item.fade, "low");
  assert.throws(() => H.requireStyle(SOURCE, "unlisted"));
  assert.throws(() => H.validatePresets({ ...SOURCE, styles: SOURCE.styles.concat(SOURCE.styles[0]) }), /Duplicate/);
});

test("low ≤ mid ≤ high fade coverage for every pixel over three head sizes", () => {
  for (const [w, h] of [[16, 16], [32, 25], [101, 71]]) {
    const low = H.fadeCoverage(w, h, H.DEFAULT_ANCHORS, "low");
    const mid = H.fadeCoverage(w, h, H.DEFAULT_ANCHORS, "mid");
    const high = H.fadeCoverage(w, h, H.DEFAULT_ANCHORS, "high");
    let a = 0; let b = 0; let c = 0;
    for (let i = 0; i < low.length; i += 1) {
      assert.ok(low[i] <= mid[i] + 1e-13, `low > mid at ${i}`);
      assert.ok(mid[i] <= high[i] + 1e-13, `mid > high at ${i}`);
      a += low[i]; b += mid[i]; c += high[i];
    }
    assert.ok(a < b && b < c);
  }
});

test("54 complete original-synthetic images agree with the Python mirror within one byte", () => {
  let comparisons = 0;
  for (const vector of PARITY.examples) {
    const image = bytes(vector.image), hair = bytes(vector.hair_mask);
    const scalp = vector.scalp_mask ? bytes(vector.scalp_mask) : null;
    for (const scenario of vector.scenarios) {
      const style = H.requireStyle(SOURCE, scenario.style_id);
      const output = H.renderStyle(image, vector.width, vector.height, hair,
        vector.anchors, style, scalp);
      const pixels = output.pixels;
      compare(pixels, bytes(scenario.expected), PARITY.tolerance_byte, scenario.style_id);
      assert.equal(output.evidence.affected_pixels, scenario.affected_pixels);
      assert.equal(output.evidence.mask_support_pixels, scenario.mask_support_pixels);
      assert.equal(output.evidence.provider_calls, 0);
      assert.equal(output.evidence.source, "local");
      assert.equal(output.evidence.simulation, true);
      for (let pixel = 0; pixel < vector.width * vector.height; pixel += 1) {
        if (hair[pixel] === 0 && (!scalp || scalp[pixel] === 0)) {
          for (let channel = 0; channel < vector.channels; channel += 1) {
            assert.equal(pixels[pixel * vector.channels + channel], image[pixel * vector.channels + channel],
              `outside-mask mutation at pixel ${pixel}`);
          }
        }
        if (vector.channels === 4) {
          assert.equal(pixels[pixel * 4 + 3], image[pixel * 4 + 3], "alpha changed");
        }
      }
      comparisons += 1;
    }
  }
  assert.equal(comparisons, 54);
});

test("an empty hair/scalp mask is pixel-neutral and no inputs are mutated", () => {
  const v = PARITY.examples[0];
  const image = bytes(v.image), before = image.slice();
  const empty = new Uint8Array(v.width * v.height);
  const result = H.renderStyle(image, v.width, v.height, empty, v.anchors, SOURCE.styles[0]);
  assert.deepEqual(result.pixels, before);
  assert.deepEqual(image, before);
  assert.equal(result.evidence.affected_pixels, 0);
});

test("malicious and invalid landmarks, recipes, masks and enormous inputs fail closed", () => {
  const v = PARITY.examples[0], style = SOURCE.styles[0];
  assert.throws(() => H.renderStyle(bytes(v.image), v.width, v.height,
    new Float64Array(v.width * v.height).fill(Number.NaN), v.anchors, style));
  assert.throws(() => H.renderStyle(bytes(v.image), v.width, v.height,
    new Uint8Array(10), v.anchors, style));
  assert.throws(() => H.renderStyle(bytes(v.image), v.width, v.height,
    bytes(v.hair_mask), { ...v.anchors, crown: [2, .3] }, style));
  assert.throws(() => H.validateRecipe({ ...style, family: "an external proprietary haircut" }));
  assert.throws(() => H.validateRecipe({ ...style, strength: Number.NaN }));
  assert.throws(() => H.validateDimensions(8000, 4000));
});
