/** Synthetic soft-mask boundaries, strand detail and two-language behaviour.
 * No model inference, photographs or provider calls are involved.
 * Author: John Khan.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { paint } from "../dist/js/engines/haircolour/balayage.js";
import { recolourHair } from "../dist/js/engines/haircolour/recolour.js";

function scene(mean, depth, kind) {
  const width = 128;
  const height = 128;
  const channels = 3;
  const data = new Uint8ClampedArray(width * height * channels);
  const mask = new Float64Array(width * height);
  const period = { straight: 7, wavy: 10, curly: 13, coily: 5 }[kind];
  const movement = { straight: 0, wavy: 2, curly: 5, coily: 2 }[kind];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const inside = y >= 15 && y < 95 && x >= 15 && x < 110;
      mask[i] = !inside ? 0 : x < 19 ? 0.2 : x < 23 ? 0.75 : 1;
      const phase = 2 * Math.PI * (x + movement * Math.sin(y / 11)) / period;
      const lum = mean + depth * Math.sin(phase) + depth * 0.2 * Math.sin(y / 11);
      for (let c = 0; c < 3; c++) {
        const colour = inside ? lum * (1 - c * 0.05) : [175, 176, 180][c];
        data[i * 3 + c] = Math.min(255, Math.max(0, Math.round(colour)));
      }
    }
  }
  return { image: { width, height, channels, data }, mask };
}

function unchangedOutside(original, output, mask) {
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] >= 0.5) continue;
    for (let c = 0; c < 3; c++) {
      assert.equal(output[i * 3 + c], original[i * 3 + c]);
    }
  }
}

function changedInside(original, output, mask) {
  let edits = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] < 0.5) continue;
    for (let c = 0; c < 3; c++) {
      if (original[i * 3 + c] !== output[i * 3 + c]) edits++;
    }
  }
  assert.ok(edits > 0, "some user-masked colour should actually change");
}

function hairCorrelation(original, output, mask) {
  let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] <= 0.5) continue;
    let x = 0, y = 0;
    for (let c = 0; c < 3; c++) {
      x += original[i * 3 + c] / 3;
      y += output[i * 3 + c] / 3;
    }
    n++;
    sx += x;
    sy += y;
    sxx += x * x;
    syy += y * y;
    sxy += x * y;
  }
  const cov = sxy - sx * sy / n;
  return cov / Math.sqrt((sxx - sx * sx / n) * (syy - sy * sy / n));
}

for (const texture of ["straight", "wavy", "curly", "coily"]) {
  test(`W39 preserves synthetic ${texture} highlight details with soft support`, () => {
    const { image, mask } = scene(85, 45, texture);
    const before = Uint8ClampedArray.from(image.data);
    for (const target of [[34, 6, 8], [58, 20, 24], [55, 2, -4]]) {
      const result = recolourHair(image, mask, target, { strength: 0.6 });
      unchangedOutside(before, result.image, mask);
      changedInside(before, result.image, mask);
      assert.ok(result.alpha.every((v, i) => mask[i] >= 0.5 || v === 0));
      assert.ok(hairCorrelation(before, result.image, mask) >= 0.9);
    }
    assert.deepEqual(image.data, before, "the image input must remain unchanged");
  });

  test(`W28 respects the same ${texture} observed hair boundary`, () => {
    const { image, mask } = scene(85, 55, texture);
    const strokes = Float64Array.from(mask, (_, i) => {
      const y = Math.floor(i / 128), x = i % 128;
      return (2 * x + y) % 37 < 12 ? mask[i] : 0;
    });
    const original = Uint8ClampedArray.from(image.data);
    const result = paint(image, mask, strokes, {
      targetLevel: 7,
      baseLevel: 5,
      softness: 2,
    });
    unchangedOutside(original, result.image, mask);
    changedInside(original, result.image, mask);
    assert.ok(result.lift.every((v, i) => mask[i] >= 0.5 || v === 0));
    assert.ok(hairCorrelation(original, result.image, mask) >= 0.9);
    assert.deepEqual(image.data, original);
  });
}

test("No hair support cannot become a paid or unmasked fallback", () => {
  const { image } = scene(70, 35, "coily");
  const missing = new Float64Array(128 * 128);
  assert.throws(() => recolourHair(image, missing, [55, 2, -4]), /not enough hair/);
  assert.throws(() => paint(image, missing, missing, {
    targetLevel: 7,
    baseLevel: 5,
  }), /no painted hair/);
});
