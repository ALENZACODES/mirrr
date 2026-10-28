// Output inspection uses pixels and an independent output mesh. Author: John Khan.
import test from "node:test";
import assert from "node:assert/strict";
import { renderArtistic } from "../dist/js/filters/artistic/index.js";
import { alphaEdges, geometryObservation, inspectOutput, protectedPixels, textureObservation } from "../dist/js/filters/artistic/inspection.js";
import { fixture } from "./artistic-helpers.mjs";

test("uniform size, translation and roll do not count as altered proportions", () => {
  const { image, options } = fixture();
  const { width: w, height: h } = image, angle = 0.15, co = Math.cos(angle), si = Math.sin(angle);
  const transformed = options.landmarks.map(([x, y]) => {
    const px = x * w - w / 2, py = y * h - h / 2;
    return [((px * co - py * si) * 0.8 + w / 2) / w, ((px * si + py * co) * 0.8 + h / 2) / h];
  });
  const observation = geometryObservation(options.landmarks, transformed, w, h);
  assert.equal(observation.status, "passed");
  assert.ok(observation.metrics.aligned_rms_iod < 1e-12);
  assert.ok(Math.abs(observation.metrics.global_scale_ratio - 0.8) < 1e-12);
});

test("face height and mouth width distortions cannot hide in alignment", () => {
  const { image, options } = fixture();
  const stretched = options.landmarks.map(([x, y]) => [x, (y - 0.5) * 1.2 + 0.5]);
  const height = geometryObservation(options.landmarks, stretched, image.width, image.height);
  assert.equal(height.status, "failed");
  assert.ok(height.failures.includes("face_height_relative_change"));
  const mouth = structuredClone(options.landmarks);
  mouth[61][0] -= 0.03; mouth[291][0] += 0.03;
  const width = geometryObservation(options.landmarks, mouth, image.width, image.height);
  assert.ok(width.failures.includes("mouth_width_relative_change"));
});

test("missing output mesh and empty masks are unproven or unobserved", () => {
  const { image, options } = fixture();
  assert.equal(geometryObservation(options.landmarks, undefined, image.width, image.height).status, "unproven");
  const empty = protectedPixels(image, image, new Float64Array(image.width * image.height));
  assert.equal(empty.observed, false); assert.equal(empty.exact, false);
  const all = inspectOutput(image, image);
  for (const key of ["hair", "eyes", "detail", "geometry"]) assert.equal(all[key].status, "unproven");
});

test("actual pixel change overrides a stale renderer protection flag", () => {
  const { image, options } = fixture(0);
  const output = renderArtistic("ink-study", image, options);
  output.image[0] = image.data[0] + 1;
  assert.equal(output.metrics.hair_max_error, 0);
  const inspected = protectedPixels(image, { ...image, data: output.image }, options.hairMask);
  assert.equal(inspected.max_error, 1); assert.equal(inspected.exact, false);
});

test("alpha and invisible RGB corruption are measured independently", () => {
  const { image } = fixture();
  const after = { ...image, data: image.data.slice() };
  after.data[0] += 2; after.data[4 * 4 + 3] += 1;
  const result = alphaEdges(image, after);
  assert.equal(result.alpha_max_error, 1);
  assert.equal(result.transparent_rgb_max_error, 2);
  assert.ok(result.fractional_alpha_pixels > 0);
});

test("detail energy reports smoothing without making beauty or quality claims", () => {
  const width = 20, height = 20, data = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = (x + y) % 2 ? 170 : 70;
      data.set([v, v, v], (y * width + x) * 3);
    }
  }
  const source = { width, height, channels: 3, data }, flat = { ...source, data: new Uint8Array(data.length).fill(120) };
  const result = textureObservation(source, flat, new Float64Array(width * height).fill(1));
  assert.equal(result.status, "measured");
  assert.ok(result.source_laplacian_energy > 0);
  assert.equal(result.output_laplacian_energy, 0);
  assert.equal(result.energy_ratio, 0);
  assert.equal("score" in result, false);
});
