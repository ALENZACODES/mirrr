/** R17 Lane C cross-runtime haircut simulation acceptance.
 * Exactly the same deterministic synthetic arrays feed Python and TypeScript.
 * No face assets, hair model, provider calls or inferred demographics.
 * Author: John Khan.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import * as H from "../dist/js/engines/menshair/render.js";
import * as A from "../dist/js/engines/menshair/advanced.js";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(new URL("../..", import.meta.url).pathname);
const venv = resolve(root, "api/.venv/bin/python");
const python = process.env.BELJOUR_PYTHON || (existsSync(venv) ? venv : "python3");
const vectorScript = resolve(root, "api/tests/test_menshair_r17c.py");
// Build tiny geometric cases at test time; never commit an enormous pixel dump.
const processResult = spawnSync(python, [vectorScript, "--emit-vectors"], {
  cwd: root, env: { ...process.env, PYTHONPATH: resolve(root, "api") },
  encoding: "utf8", maxBuffer: 12 * 1024 * 1024,
});
assert.equal(processResult.status, 0, processResult.stderr || String(processResult.error));
const PARITY = JSON.parse(processResult.stdout);
const SOURCE_FILE = readFileSync(new URL("../../api/plumb_api/engines/menshair/presets.json", import.meta.url));
const SOURCE = JSON.parse(SOURCE_FILE.toString("utf8"));
const bytes = (text) => new Uint8Array(Buffer.from(text, "base64"));
const byId = new Map(SOURCE.styles.map((style) => [style.id, style]));
const hash = (buf) => createHash("sha256").update(buf).digest("hex");

function compare(expected, found, label, tolerance = 1) {
  assert.equal(found.length, expected.length, "byte count for " + label);
  let worst = 0;
  for (let index = 0; index < found.length; index += 1) {
    const diff = Math.abs(expected[index] - found[index]);
    if (diff > worst) worst = diff;
    assert.ok(diff <= tolerance, `${label} mismatch at byte ${index}: ${found[index]} vs ${expected[index]}`);
  }
  return worst;
}

test("all authored presets retain author and simulation provenance", () => {
  assert.ok(SOURCE.styles.length >= 346);
  assert.equal(SOURCE.author, "John Khan");
  assert.match(SOURCE.simulation_label, /simulation/i);
  assert.doesNotThrow(() => H.validatePresets(SOURCE));
  assert.equal(byId.size, SOURCE.styles.length);
  assert.equal(PARITY.catalogue_sha256, hash(SOURCE_FILE));
  assert.equal(PARITY.fixture_kind, "deterministic geometric colour grid, not a face");
  assert.equal(PARITY.no_network_calls, true);
  assert.equal(PARITY.examples.length, 3);
  assert.ok(SOURCE.styles.every((style) => style.id.startsWith("local-") && !("template_id" in style)));
  assert.ok(SOURCE.styles.filter((style) => style.presentation === "feminine").length >= 50);
  assert.ok(SOURCE.styles.filter((style) => style.presentation === "masculine").length >= 25);
  assert.ok(SOURCE.styles.filter((style) => A.EXTENDED_FAMILIES.includes(style.family)).length >= 80);
});

test("all generated image cases match the Python output to within one byte", () => {
  let comparisons = 0;
  let worst = 0;
  for (const scene of PARITY.examples) {
    const image = bytes(scene.image);
    const hair = bytes(scene.hair_mask);
    const scalp = bytes(scene.scalp_mask);
    const originalImage = image.slice();
    for (const scenario of scene.scenarios) {
      const recipe = byId.get(scenario.style_id);
      assert.ok(recipe, `Unknown style ${scenario.style_id}`);
      const after = H.renderStyle(image, scene.width, scene.height, hair, scene.landmarks, recipe, scalp);
      worst = Math.max(worst, compare(bytes(scenario.pixels), after.pixels, scenario.style_id,
        PARITY.maximum_channel_difference));
      assert.equal(after.evidence.style_id, recipe.id);
      assert.equal(after.evidence.simulation, true);
      assert.equal(after.evidence.provider_calls, 0);
      assert.equal(after.evidence.affected_pixels, scenario.affected_pixels);
      assert.equal(after.evidence.mask_support_pixels, scenario.mask_support_pixels);
      const channels = scene.channels;
      for (let pixel = 0; pixel < hair.length; pixel += 1) {
        if (hair[pixel] === 0 && scalp[pixel] === 0) {
          for (let ch = 0; ch < channels; ch += 1) {
            assert.equal(after.pixels[pixel * channels + ch], image[pixel * channels + ch],
              `outside mask changed: ${recipe.id} pixel ${pixel}`);
          }
        }
        if (channels === 4) assert.equal(after.pixels[pixel * channels + 3], image[pixel * channels + 3]);
      }
      comparisons += 1;
    }
    assert.deepEqual(image, originalImage, "input pixels mutated during style preview");
  }
  assert.equal(comparisons, SOURCE.styles.length * PARITY.examples.length);
  assert.ok(worst <= 1);
});

test("every new local family and declared texture pattern is implemented", () => {
  const families = new Set(SOURCE.styles.map((row) => row.family));
  const patterns = new Set(SOURCE.styles.map((row) => row.pattern));
  for (const family of A.EXTENDED_FAMILIES) assert.ok(families.has(family), family);
  for (const pattern of A.PATTERNS) assert.ok(patterns.has(pattern), pattern);
  for (const presentation of A.PRESENTATIONS) {
    assert.ok(SOURCE.styles.some((row) => (row.presentation ?? "unisex") === presentation));
  }
  for (const recipe of SOURCE.styles) assert.doesNotThrow(() => H.validateRecipe(recipe));
});

test("optional parameter boundaries are identical in JS and Python", () => {
  const example = byId.get("local-pixie-undercut");
  for (const [key, values] of [
    ["top_bias", [-1, 101, 0.4, true, "20"]],
    ["side_bias", [Number.NaN, Infinity, -0.5, 110]],
    ["fringe", [-1, 123, null]],
    ["flow", [-101, 101, 12.5, null]],
    ["length", [-3, 130, Number.NaN]],
    ["definition", [-1, 101, false]],
    ["pattern", ["third-party", null, 15]],
    ["presentation", ["sex-detection", null, -2]],
  ]) {
    for (const value of values) assert.throws(() => H.validateRecipe({ ...example, [key]: value }), key);
  }
  assert.throws(() => H.validateRecipe({ ...example, model_url: "https://invalid/" }));
  assert.throws(() => H.validateRecipe({ ...example, family: "imaginary-branded-hairstyle" }));
  assert.throws(() => H.validatePresets({ ...SOURCE, styles: SOURCE.styles.concat(SOURCE.styles[0]) }));
});

test("new fade controls preserve monotonic low to mid to high ordering", () => {
  const base = byId.get("local-shadow-fade");
  for (const scene of PARITY.examples) {
    const low = H.effectField(scene.width, scene.height, scene.landmarks, { ...base, fade: "low" });
    const mid = H.effectField(scene.width, scene.height, scene.landmarks, { ...base, fade: "mid" });
    const high = H.effectField(scene.width, scene.height, scene.landmarks, { ...base, fade: "high" });
    for (let index = 0; index < low.length; index += 1) {
      assert.ok(low[index] <= mid[index] + 1e-13);
      assert.ok(mid[index] <= high[index] + 1e-13);
    }
  }
});

test("zero hair mask and zero strength are exactly neutral for every new style", () => {
  const scene = PARITY.examples[0];
  const image = bytes(scene.image);
  const empty = new Uint8Array(scene.width * scene.height);
  const hair = bytes(scene.hair_mask);
  const scalp = bytes(scene.scalp_mask);
  for (const recipe of SOURCE.styles.slice(18)) {
    assert.deepEqual(H.renderStyle(image, scene.width, scene.height, empty, scene.landmarks, recipe).pixels,
      image, recipe.id + " maskless neutral");
    assert.deepEqual(H.renderStyle(image, scene.width, scene.height, hair, scene.landmarks,
      { ...recipe, strength: 0 }, scalp).pixels, image, recipe.id + " strength neutral");
  }
});
