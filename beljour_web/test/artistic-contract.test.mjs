// Browser boundary, non-mutation, alpha and support conditions. Author: John Khan.
import test from "node:test";
import assert from "node:assert/strict";
import { EFFECTS, EffectUnavailable, renderArtistic } from "../dist/js/filters/artistic/index.js";
import { byteRound, photo, landmarks, mask, number, integer } from "../dist/js/filters/artistic/types.js";
import { fixture } from "./artistic-helpers.mjs";

for (const effect of Object.keys(EFFECTS)) {
  test(`${effect}: zero is exact, inputs and alpha are preserved`, () => {
    const { image, options } = fixture();
    const params = effect === "rain-expression" ? { adult_confirmed: true } : {};
    const input = image.data.slice(), hair = options.hairMask.slice(), mesh = structuredClone(options.landmarks);
    const neutral = renderArtistic(effect, image, { ...options, params: { ...params, amount: 0 } });
    assert.deepEqual(neutral.image, image.data);
    assert.notEqual(neutral.image, image.data);
    const output = renderArtistic(effect, image, { ...options, params });
    assert.ok(output.metrics.changed_pixels > 0);
    assert.deepEqual(image.data, input);
    assert.deepEqual(options.hairMask, hair);
    assert.deepEqual(options.landmarks, mesh);
    const repeated = renderArtistic(effect, image, { ...options, params });
    assert.deepEqual(repeated.image, output.image);
    for (let i = 0; i < output.support.length; i++) {
      const o = i * image.channels;
      assert.equal(output.image[o + 3], input[o + 3]);
      if (output.support[i] === 0 || input[o + 3] === 0) {
        for (let c = 0; c < 3; c++) assert.equal(output.image[o + c], input[o + c]);
      }
    }
    assert.match(output.label, /simulation/);
    assert.equal(output.metrics.outside_max_error, 0);
  });
}

test("unsafe numeric values and fractional counts are rejected", () => {
  for (const value of [true, false, "0.5", NaN, Infinity, -0.01, 1.1, null]) {
    assert.throws(() => number(value, "amount", 0, 1), RangeError);
  }
  assert.throws(() => integer(2.5, "flowers", 2, 10), /integer/);
});

test("byte rounding contract includes midpoint and clipping cases", () => {
  assert.deepEqual([-1, 0.49, 0.5, 1.5, 2.5, 254.5, 260].map(byteRound), [0, 0, 1, 2, 3, 255, 255]);
});

test("missing observation is explicit even at amount zero", () => {
  const { image, options } = fixture();
  assert.throws(() => renderArtistic("ink-study", image, { eyeMask: options.eyeMask }),
    (e) => e instanceof EffectUnavailable && e.code === "missing_hair_mask");
  assert.throws(() => renderArtistic("meadow-crown", image, { landmarks: options.landmarks, params: { amount: 0 } }), /hair mask/);
  assert.throws(() => renderArtistic("rain-expression", image, { params: { adult_confirmed: true } }), /confirmed face mesh/);
});

test("expression needs explicit adult confirmation including neutral strength", () => {
  const { image, options } = fixture();
  for (const params of [{}, { adult_confirmed: false }, { adult_confirmed: false, amount: 0 }]) {
    assert.throws(() => renderArtistic("rain-expression", image, { ...options, params }),
      (e) => e.code === "adult_confirmation_required");
  }
  for (const adult_confirmed of ["true", 1, null, [], NaN]) {
    assert.throws(() => renderArtistic("rain-expression", image, { ...options, params: { adult_confirmed } }), /explicit boolean/);
  }
});

test("frame, array lengths and unknown params do not pass runtime typing", () => {
  const { image } = fixture();
  assert.throws(() => photo({ ...image, data: [] }), /uint8/);
  assert.throws(() => photo({ ...image, width: 1 }), /size/);
  assert.throws(() => photo({ ...image, width: 40.5 }), /size/);
  assert.throws(() => photo({ ...image, channels: 1 }), /RGB/);
  assert.throws(() => renderArtistic("not-a-filter", image), /unknown/);
  assert.throws(() => renderArtistic("pigment-oil", image, { params: { apiKey: "ignored" } }), /unknown/);
});

test("non-finite, out-of-range and sparse malformed masks fail", () => {
  assert.throws(() => mask([0, 0, NaN, 1], 4, "hair_mask"), /finite/);
  assert.throws(() => mask([0, 0, 2, 1], 4, "hair_mask"), /finite/);
  assert.throws(() => mask([0, 0], 4, "hair_mask"), /match/);
  assert.throws(() => mask(new Array(4), 4, "hair_mask"), /finite/);
});

test("bad mesh or degenerate eyes are refused without clamping", () => {
  const { options } = fixture();
  assert.throws(() => landmarks(options.landmarks.slice(1), 100, 120), /478/);
  const bad = structuredClone(options.landmarks);
  bad[0][0] = 9;
  assert.throws(() => landmarks(bad, 100, 120), /finite normalized/);
  bad[0][0] = 0.5;
  bad[473] = bad[468];
  assert.throws(() => landmarks(bad, 100, 120), (e) => e.code === "mesh_too_small");
});
