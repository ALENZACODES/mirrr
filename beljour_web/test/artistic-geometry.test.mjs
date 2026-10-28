// Independent geometric, alpha and direction evidence for the browser. Author: John Khan.
import test from "node:test";
import assert from "node:assert/strict";
import { renderArtistic } from "../dist/js/filters/artistic/index.js";
import { boundField, jacobian, pathDistance, quadratic } from "../dist/js/filters/artistic/geometry.js";
import { crownAnchors } from "../dist/js/filters/artistic/crown.js";
import { expressionField, tearLayers } from "../dist/js/filters/artistic/rain.js";
import { landmarks } from "../dist/js/filters/artistic/types.js";
import { fixture, maximumGap } from "./artistic-helpers.mjs";

test("analytic affine Jacobian is measured rather than accepted as a success flag", () => {
  const w = 12, h = 9, dx = new Float64Array(w * h), dy = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) { dx[y * w + x] = 0.1 * x + 0.05 * y; dy[y * w + x] = -0.02 * x + 0.12 * y; }
  }
  const measured = jacobian(dx, dy, w, h), expected = 0.9 * 0.88 + 0.001;
  for (const v of measured) assert.ok(Math.abs(v - expected) < 1e-12);
});

test("folded field is bounded and its direction is preserved", () => {
  const w = 20, h = 20;
  const dx = Float64Array.from({ length: w * h }, (_, i) => (i % w) * 1.8);
  const dy = Float64Array.from({ length: w * h }, (_, i) => Math.floor(i / w) * 0.4);
  assert.ok(Math.min(...jacobian(dx, dy, w, h)) < 0);
  const bounded = boundField(dx, dy, w, h, 100);
  assert.ok(bounded.scale > 0 && bounded.scale < 1);
  assert.ok(Math.min(...jacobian(bounded.dx, bounded.dy, w, h)) >= 0.75);
  for (let i = 0; i < dx.length; i++) assert.equal(bounded.dx[i], dx[i] * bounded.scale);
});

test("segment projection and quadratic endpoint contracts", () => {
  const curve = quadratic([0, 0], [5, 0], [10, 0], 3);
  assert.deepEqual(curve, [[0, 0], [5, 0], [10, 0]]);
  const measured = pathDistance(10, 4, [[0.5, 0.5], [9.5, 0.5]]);
  assert.equal(measured.distance[2 * 10 + 4], 2);
  assert.ok(Math.abs(measured.progress[2 * 10 + 4] - 4 / 9) < 1e-12);
});

for (const angle of [-0.5, 0.25, 0.8]) {
  test(`crown anchoring follows roll ${angle}, scale and translation`, () => {
    const { image, options } = fixture();
    const points = landmarks(options.landmarks, image.width, image.height);
    const co = Math.cos(angle), si = Math.sin(angle), scale = 1.3;
    const transform = ([x, y]) => [(x * co - y * si) * scale + 7, (x * si + y * co) * scale - 3];
    const original = crownAnchors(points, 7, 1.1, 0.05).map(transform);
    const transformed = crownAnchors(points.map(transform), 7, 1.1, 0.05);
    assert.ok(maximumGap(original.flat(), transformed.flat()) < 1e-7);
  });
}

test("expression can be removed while tears remain; dry expression stays active", () => {
  const { image, options } = fixture();
  const wet = renderArtistic("rain-expression", image, { ...options, params: { expression: 0, adult_confirmed: true } });
  const dry = renderArtistic("rain-expression", image, { ...options, params: { tears: 0, adult_confirmed: true } });
  assert.equal(wet.metrics.maximum_displacement, 0);
  assert.ok(wet.metrics.tear_pixels > 0);
  assert.equal(dry.metrics.tear_pixels, 0);
  assert.ok(dry.metrics.maximum_displacement > 0);
  assert.ok(dry.metrics.min_jacobian >= 0.75);
});

test("asymmetry and phase change real fields rather than only recipe metadata", () => {
  const { image, options } = fixture();
  const points = landmarks(options.landmarks, image.width, image.height);
  const first = expressionField(points, image.width, image.height, { amount: 1, expression: 1, asymmetry: 1, phase: 0.25 });
  const second = expressionField(points, image.width, image.height, { amount: 1, expression: 1, asymmetry: -1, phase: 0.75 });
  assert.ok(maximumGap(first.dx, second.dx) > 0.1);
  assert.ok(maximumGap(first.dy, second.dy) > 0.1);
});

test("water never paints over any positive eye protection coverage", () => {
  const { image, options } = fixture();
  const points = landmarks(options.landmarks, image.width, image.height);
  const water = tearLayers(points, image.width, image.height, { amount: 1, tears: 1, length: 0.65, asymmetry: 1, phase: 0.25 });
  for (let i = 0; i < options.eyeMask.length; i++) {
    if (options.eyeMask[i] > 0) {
      assert.equal(water.water[i], 0);
      assert.equal(water.highlight[i], 0);
      assert.equal(water.rim[i], 0);
    }
  }
});

test("foreground hair is exact and half hair alpha halves crown coverage", () => {
  const { image, options } = fixture();
  const n = image.width * image.height;
  const clear = renderArtistic("meadow-crown", image, { ...options, hairMask: new Float64Array(n), params: { amount: 1 } });
  const half = renderArtistic("meadow-crown", image, { ...options, hairMask: new Float64Array(n).fill(0.5), params: { amount: 1 } });
  const hidden = renderArtistic("meadow-crown", image, { ...options, hairMask: new Float64Array(n).fill(1) });
  assert.deepEqual(hidden.image, image.data);
  assert.equal(hidden.metrics.visible_alpha_sum, 0);
  assert.ok(hidden.warnings.some((s) => s.includes("hidden")));
  for (let i = 0; i < n; i++) assert.equal(half.support[i], clear.support[i] * 0.5);
});
