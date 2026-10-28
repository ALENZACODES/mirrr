// Tiled export has the same pixels, with bounded scratch and cancellation. Author: John Khan.
import test from "node:test";
import assert from "node:assert/strict";
import { renderArtistic } from "../dist/js/filters/artistic/index.js";
import { MAX_EXPORT_PIXELS, RenderCancelled, renderTiled, tiles } from "../dist/js/filters/artistic/tiling.js";
import { paintTexture } from "../dist/js/filters/artistic/oil.js";
import { fixture } from "./artistic-helpers.mjs";

for (const effect of ["ink-study", "pigment-oil"]) {
  for (const tileSize of [32, 41, 512]) {
    test(`${effect} tile ${tileSize}: exact full-frame pixels and alpha`, () => {
      const { image, options } = fixture(1);
      const params = effect === "pigment-oil" ? { radius: 12, texture: 1, seed: 99, brush_angle: 0.7 } : { ink: 1 };
      const full = renderArtistic(effect, image, { ...options, params });
      const tiled = renderTiled(effect, image, { ...options, params, tileSize });
      assert.deepEqual(tiled.image, full.image);
      assert.equal(tiled.metrics.changed_pixels, full.metrics.changed_pixels);
      assert.equal(tiled.metrics.alpha_unchanged, true);
      assert.equal(tiled.metrics.outside_max_error, 0);
      const halo = effect === "ink-study" ? 1 : 12;
      assert.ok(tiled.metrics.maximum_working_pixels <= (tileSize + 2 * halo) ** 2);
    });
  }
}

test("tile interiors partition a non-square frame exactly once", () => {
  const w = 197, h = 103, count = new Uint8Array(w * h), plan = tiles(w, h, 64, 12);
  for (const tile of plan) {
    assert.equal(tile.cropLeft, Math.max(0, tile.left - 12));
    assert.equal(tile.cropBottom, Math.min(h, tile.bottom + 12));
    for (let y = tile.top; y < tile.bottom; y++) {
      for (let x = tile.left; x < tile.right; x++) count[y * w + x]++;
    }
  }
  assert.equal(plan.length, 8);
  assert.ok(count.every((v) => v === 1));
  assert.equal(MAX_EXPORT_PIXELS, 16_777_216);
});

test("global texture phase survives crop origin changes", () => {
  const full = paintTexture(130, 150, 212, 0.3, 1.8);
  const patch = paintTexture(30, 40, 212, 0.3, 1.8, 71, 38);
  for (let y = 0; y < 40; y++) {
    for (let x = 0; x < 30; x++) assert.equal(patch[y * 30 + x], full[(y + 38) * 130 + x + 71]);
  }
});

test("cancel during progress discards partial image and keeps source", () => {
  const { image } = fixture(2), original = image.data.slice(), progress = [];
  assert.throws(() => renderTiled("pigment-oil", image, { tileSize: 32,
    cancelled: () => progress.length >= 2, progress: (done, total) => progress.push([done, total]) }), RenderCancelled);
  assert.equal(progress.length, 2);
  assert.deepEqual(image.data, original);
});

test("cancellation at final callback also invalidates the result", () => {
  const { image } = fixture();
  let done = false;
  assert.throws(() => renderTiled("pigment-oil", image, { tileSize: 512,
    cancelled: () => done, progress: () => { done = true; } }), RenderCancelled);
});

test("unsupported geometry and missing or invalid masks do not fall through", () => {
  const { image, options } = fixture();
  assert.throws(() => renderTiled("rain-expression", image), (e) => e.code === "not_tileable");
  assert.throws(() => renderTiled("ink-study", image), (e) => e.code === "missing_hair_mask");
  const hair = options.hairMask.slice(); hair[hair.length - 1] = NaN;
  assert.throws(() => renderTiled("ink-study", image, { ...options, hairMask: hair }), /finite/);
  assert.throws(() => tiles(8192, 8192, 512, 1), /16 MP/);
  for (const side of [0, 31, 32.5, 1025]) assert.throws(() => tiles(80, 90, side, 1), RangeError);
});

for (const palette of ["rose", "ivory", "violet"]) {
  test(`crown ${palette}: tiles keep global anchors and hair occlusion`, () => {
    const { image, options } = fixture(2);
    const params = { palette, flowers: 9, size: 1.3, height: -0.07 };
    const whole = renderArtistic("meadow-crown", image, { ...options, params });
    const tiled = renderTiled("meadow-crown", image, { ...options, params, tileSize: 32 });
    assert.deepEqual(tiled.image, whole.image);
    assert.ok(Math.abs(tiled.metrics.visible_alpha_sum - whole.metrics.visible_alpha_sum) < 1e-8);
    assert.deepEqual(tiled.warnings, whole.warnings);
  });
}

test("empty individual art tiles do not claim a visible whole crown is hidden", () => {
  const { image, options } = fixture(2);
  const visible = renderTiled("meadow-crown", image, { ...options, hairMask: new Float64Array(image.width * image.height), tileSize: 32 });
  assert.equal(visible.warnings.some((s) => s.includes("hidden")), false);
  const hidden = renderTiled("meadow-crown", image, { ...options, hairMask: new Float64Array(image.width * image.height).fill(1), tileSize: 32 });
  assert.equal(hidden.warnings.some((s) => s.includes("hidden")), true);
  assert.deepEqual(hidden.image, image.data);
});
