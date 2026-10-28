/** Python/TypeScript parity for every R17B engine family. Author: John Khan. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { renderGenderLook } from "../dist/js/engines/gender_look/index.js";
import { renderHair } from "../dist/js/engines/hair_women/index.js";
import { renderMakeup } from "../dist/js/engines/makeup_w/index.js";
import { renderShave } from "../dist/js/engines/shave/index.js";
import { upscale } from "../dist/js/engines/upscale/index.js";
import { runWorkflow } from "../dist/js/engines/workflow_w/index.js";

const root = new URL("../..", import.meta.url);
const run = spawnSync(
  "python3",
  ["api/scripts/r17b_parity_probe.py"],
  { cwd: root, encoding: "utf8", env: { ...process.env, PYTHONPATH: "api" }, maxBuffer: 8 * 1024 * 1024 },
);
assert.equal(run.status, 0, run.stderr);
const py = JSON.parse(run.stdout);
assert.equal(py.format, "beljour-r17b-parity-probe/1");
assert.equal(py.author, "John Khan");

const photo = {
  width: py.width,
  height: py.height,
  channels: 4,
  data: Uint8ClampedArray.from(py.source),
};
const hair = Float32Array.from(py.hair_mask);
const scalp = Float32Array.from(py.scalp_mask);
const masks = Object.fromEntries(
  Object.entries(py.masks).map(([name, values]) => [name, Float32Array.from(values)]),
);
const geometry = py.geometry;

function maxByteDifference(actual, expected) {
  assert.equal(actual.length, expected.length);
  let maximum = 0;
  for (let index = 0; index < actual.length; index++) {
    maximum = Math.max(maximum, Math.abs(actual[index] - expected[index]));
  }
  return maximum;
}

function maxFloatDifference(actual, expected) {
  assert.equal(actual.length, expected.length);
  let maximum = 0;
  for (let index = 0; index < actual.length; index++) {
    maximum = Math.max(maximum, Math.abs(actual[index] - expected[index]));
  }
  return maximum;
}

function hairOptions(feature) {
  return {
    feature,
    amount: 0.61,
    colour: [92, 58, 40],
    accent: [176, 122, 78],
    length_ratio: 0.45,
    volume: 0.42,
    grey_share: 0.38,
    month: 12,
    curl_strength: 0.64,
    heat_shape: 0.55,
    humidity: 55,
    seed: 17,
  };
}

function makeupOptions(feature) {
  return {
    feature,
    amount: 0.59,
    shade: [117, 67, 62],
    accent: [156, 91, 80],
    finish: feature === "W9" ? "cream" : "satin",
    face_shape: "balanced",
    undertone: "olive",
    oxidation_delta: -6,
    season_shift: 0.22,
    look: "gallery_glow",
    metadata: { issue: "redness", outfit_colour: [72, 88, 112] },
  };
}

test("hair Python/TS active vectors are within 1/255 for every algorithm branch", () => {
  for (const feature of Object.keys(py.hair)) {
    const actual = renderHair(photo, hair, scalp, geometry, hairOptions(feature));
    const expected = py.hair[feature];
    assert.ok(maxByteDifference(actual.data, expected.pixels) <= 1, feature);
    assert.ok(maxFloatDifference(actual.coverage, expected.coverage) <= 1e-6, `${feature} coverage`);
  }
});

test("makeup Python/TS active vectors are within 1/255 for every render branch", () => {
  for (const feature of Object.keys(py.makeup)) {
    const actual = renderMakeup(photo, masks, makeupOptions(feature));
    const expected = py.makeup[feature];
    assert.ok(maxByteDifference(actual.data, expected.pixels) <= 1, feature);
    assert.ok(maxFloatDifference(actual.coverage, expected.coverage) <= 1e-6, `${feature} coverage`);
  }
});

test("workflow Python/TS parity is canonical for all four W rows", () => {
  const requests = {
    W94: { feature: "W94", city: "Local", service: "Example", price_low: 80, price_high: 140, sessions: 1, maintenance_weeks: 8 },
    W96: { feature: "W96", occasion: "evening", look_id: "gallery_glow" },
    W99: { feature: "W99", start_date: "2026-10-24", maintenance_weeks: 8 },
    W100: { feature: "W100", depth: 42, undertone: "olive", hair_base: "medium brown", allergens: ["fragrance"], measured_on: "2026-10-24" },
  };
  for (const [feature, request] of Object.entries(requests)) {
    const actual = runWorkflow(request);
    const expected = py.workflow[feature];
    if (feature === "W100") {
      const actualEnvelope = JSON.parse(actual.export);
      const expectedEnvelope = JSON.parse(expected.export);
      assert.deepEqual(actualEnvelope.payload, expectedEnvelope.payload, feature);
      assert.equal(actualEnvelope.sha256, expectedEnvelope.sha256, `${feature} integrity hash`);
      assert.deepEqual({ ...actual, export: undefined }, { ...expected, export: undefined }, feature);
    } else {
      assert.deepEqual(actual, expected, feature);
    }
  }
});

test("2x classical upscale Python/TS bytes are within 1/255", () => {
  const actual = upscale(photo, 2, 0.55);
  assert.deepEqual([actual.height, actual.width, actual.channels], py.upscale2.shape);
  assert.ok(maxByteDifference(actual.data, py.upscale2.pixels) <= 1);
});

test("gender-look Python/TS active bytes are within 1/255 and geometry remains pinned", () => {
  const actual = renderGenderLook(photo, masks, { direction: "masculine", level: "hyper", amount: 0.65 });
  assert.ok(maxByteDifference(actual.data, py.gender.pixels) <= 1);
  assert.equal(actual.report.identity_geometry_changed, false);
  assert.equal(py.gender.report.identity_geometry_changed, false);
});

test("clean-shave Python/TS active bytes are within 1/255 and estimate labels agree", () => {
  const actual = renderShave(photo, masks.beard, masks.cheek, 0.8);
  assert.ok(maxByteDifference(actual.data, py.shave.pixels) <= 1);
  assert.match(String(actual.report.label), /estimate/i);
  assert.match(String(py.shave.report.label), /estimate/i);
});
