/** R18 Lane C synthetic browser/Python parity and guard rails.
 * No portrait images, provider traffic, checked-in pixel vectors or asset fetch.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gradedField, gradeDiagnostics } from "../dist/js/engines/menshair/graded.js";
import { renderFibres, colourDeltaE76, regionField } from "../dist/js/engines/menshair/concealer-link.js";
import { renderStyle, validateRecipe } from "../dist/js/engines/menshair/render.js";
const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const venv = resolve(root, "api/.venv/bin/python");
const py = process.env.BELJOUR_PYTHON ?? (existsSync(venv) ? venv : "python3");
const vectorPath = resolve(root, "api/tests/test_menshair_r18c.py");
const generated = spawnSync(py, [vectorPath, "--emit-vectors"], {
  cwd: root, encoding: "utf8", maxBuffer: 4 * 1024 * 1024,
  env: { ...process.env, PYTHONPATH: resolve(root, "api") },
});
assert.equal(generated.status, 0, generated.stderr || String(generated.error));
const vectors = JSON.parse(generated.stdout);
const decode = (base64) => new Uint8Array(Buffer.from(base64, "base64"));
const styles = JSON.parse(readFileSync(resolve(root, "api/plumb_api/engines/menshair/presets.json"), "utf8"));

function assertWithin(expected, actual, tolerance, label) {
  assert.equal(actual.length, expected.length, `${label} array length`);
  let max = 0;
  for (let i = 0; i < expected.length; i += 1) {
    const delta = Math.abs(expected[i] - actual[i]);
    max = Math.max(delta, max);
    assert.ok(delta <= tolerance, `${label}[${i}]: ${actual[i]} vs ${expected[i]}, delta ${delta}`);
  }
  return max;
}

test("R18 clipper grade and fade blend match Python across six shapes and three heights", () => {
  assert.equal(vectors.graded.length, 18);
  for (const row of vectors.graded) {
    const field = gradedField(vectors.width, vectors.height, vectors.anchors, row);
    assertWithin(row.grade, field.grade, 1e-12, `${row.fade_shape}/${row.fade} grade`);
    assertWithin(row.blend, field.blend, 1e-12, `${row.fade_shape}/${row.fade} blend`);
    assert.equal(gradeDiagnostics(field, vectors.width).bottom_is_shorter, true);
    for (const number of [...field.grade, ...field.blend]) assert.ok(Number.isFinite(number));
  }
});

test("R18 fibre compare matches Python bytes and effect metrics for every region", () => {
  const original = decode(vectors.image), hair = decode(vectors.hair), scalp = decode(vectors.scalp);
  for (const scenario of vectors.fibres) {
    const result = renderFibres(original, vectors.width, vectors.height, hair, scalp,
      Float64Array.from(vectors.density), vectors.anchors, scenario.options);
    assertWithin(decode(scenario.after), result.after, 1, `${scenario.region} hair fibre pixels`);
    for (const [name, value] of Object.entries(scenario.metrics)) {
      if (typeof value === "number") {
        assert.ok(Math.abs(result.metrics[name] - value) < 1e-8, `Fibre metric ${scenario.region}/${name}`);
      } else assert.equal(result.metrics[name], value);
    }
    assert.ok(result.metrics.scalp_show_after < result.metrics.scalp_show_before);
    assert.ok(result.metrics.colour_delta_e76 <= 3);
    assert.equal(result.metrics.provider_calls, 0);
    for (let i = 0; i < hair.length; i += 1) {
      if (scalp[i] === 0 || hair[i] === 255) {
        assert.deepEqual(result.after.slice(i * 4, i * 4 + 4), original.slice(i * 4, i * 4 + 4));
      }
      assert.equal(result.after[i * 4 + 3], original[i * 4 + 3]);
    }
  }
  assert.equal(colourDeltaE76([69, 48, 38], [69, 48, 38]), 0);
  assert.ok(regionField(vectors.width, vectors.height, vectors.anchors, "hairline").some((n) => n > 0));
});

test("R18 curated masculine hairstyles remain unique, safely validated and local", () => {
  assert.ok(styles.styles.length >= 346);
  const masculine = styles.styles.filter((style) => style.presentation === "masculine");
  assert.ok(masculine.length >= 150);
  assert.equal(new Set(styles.styles.map((style) => style.id)).size, styles.styles.length);
  for (const item of styles.styles) validateRecipe(item);
  const rgba = decode(vectors.image), hair = decode(vectors.hair), scalp = decode(vectors.scalp);
  const original = rgba.slice();
  for (const id of ["local-low-fade", "local-buzz-zero-low", "local-skin-low-french-crop", "local-burst-mid-twists"]) {
    const item = styles.styles.find((style) => style.id === id);
    assert.ok(item);
    const output = renderStyle(rgba, vectors.width, vectors.height, hair, vectors.anchors, item, scalp);
    assert.equal(output.evidence.provider_calls, 0);
    for (let i = 0; i < hair.length; i += 1) {
      if (hair[i] === 0 && scalp[i] === 0) {
        assert.deepEqual(output.pixels.slice(i * 4, i * 4 + 4), original.slice(i * 4, i * 4 + 4));
      }
      assert.equal(output.pixels[i * 4 + 3], original[i * 4 + 3]);
    }
  }
  assert.deepEqual(rgba, original);
});

test("R18 clipped input and untrusted parameters reject instead of leaking pixels", () => {
  const src = decode(vectors.image), mask = decode(vectors.hair), scalp = decode(vectors.scalp);
  const density = Float64Array.from(vectors.density);
  for (const invalid of [ { strength: NaN }, { seed: -10 }, { hair_rgb: [256, 0, 0] },
    { region: "third-party" }, { density_gain: 1000 } ]) {
    assert.throws(() => renderFibres(src, vectors.width, vectors.height, mask, scalp, density,
      vectors.anchors, invalid));
  }
  assert.throws(() => renderFibres(src, vectors.width, vectors.height, mask, scalp,
    new Float64Array(mask.length - 1), vectors.anchors));
  assert.throws(() => gradedField(30, 40, vectors.anchors, { fade: "low", fade_shape: "skin", side_grade: 1 }));
  assert.throws(() => gradedField(30, 40, vectors.anchors, { fade: "low", side_grade: 4, top_grade: 1 }));
});
