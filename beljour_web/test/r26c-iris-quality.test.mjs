/** Independent iris tone and texture audit on synthetic pixels.
 * Author: John Khan.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { irisToneQuality, safeIrisToneReport } from "../dist/js/engines/eyes/iris-quality.js";
import { IrisTrialEngine } from "../dist/js/engines/eyes/iris-trial.js";

const WIDTH = 80;
const HEIGHT = 48;
const BOX = [0, 0, 1, 1];

function scene(hidden = null, channels = 3) {
  const data = new Uint8ClampedArray(WIDTH * HEIGHT * channels);
  const right = new Float64Array(WIDTH * HEIGHT);
  const left = new Float64Array(WIDTH * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const i = y * WIDTH + x;
      const r = (x - 21) ** 2 + (y - 20) ** 2 < 49;
      const l = (x - 59) ** 2 + (y - 20) ** 2 < 49;
      const colour = r ? [43, 36, 32] : l ? [68, 58, 49] : [93, 85, 97];
      for (let c = 0; c < 3; c++) data[i * channels + c] = colour[c];
      if (channels === 4) data[i * channels + 3] = 191;
      if (r) right[i] = 1;
      if (l) left[i] = 1;
    }
  }
  for (const x of [20, 58]) {
    for (let c = 0; c < 3; c++) data[(17 * WIDTH + x) * channels + c] = 252;
  }
  const states = { right_iris: "visible", left_iris: "visible" };
  if (hidden) {
    (hidden === "left" ? left : right).fill(0);
    states[`${hidden}_iris`] = "not_visible:closed";
  }
  return {
    photo: { width: WIDTH, height: HEIGHT, channels, data },
    observed: {
      masks: { right_iris: right, left_iris: left }, states,
      source: "manual_or_measured",
    },
  };
}

test("Normal iris rendering retains original tone structure and catchlights", () => {
  const { photo, observed } = scene();
  const engine = new IrisTrialEngine({ observe() { return observed; } });
  const result = engine.render(photo, "scene", { primaryBox: BOX, level: 5 });
  const output = { ...photo, data: result.image };
  const quality = irisToneQuality(photo, output, observed.masks);
  assert.equal(quality.verdict, "UNPROVEN");
  assert.equal(quality.outsideMaxAbsDiff, 0);
  assert.equal(quality.alphaChanges, 0);
  for (const side of [quality.right, quality.left]) {
    assert.equal(side.status, "MEASURED");
    assert.ok(side.changedPixels > 0);
    assert.ok(side.observedPixels > 12);
    assert.equal(side.catchlightChanges, 0);
    if (side.textureCorrelation !== null) assert.ok(side.textureCorrelation >= 0.9);
  }
  const payload = JSON.stringify(safeIrisToneReport(quality));
  assert.ok(payload.includes("UNPROVEN"));
  for (const privateKey of ["photo_hash", "image", "person_id", "landmarks"]) {
    assert.equal(payload.includes(`"${privateKey}"`), false);
  }
});

for (const hidden of ["right", "left"]) {
  test(`${hidden} unobserved iris produces no fabricated quality measurement`, () => {
    const { photo, observed } = scene(hidden);
    const trial = new IrisTrialEngine({ observe() { return observed; } });
    const result = trial.render(photo, "drawn", { primaryBox: BOX });
    const quality = irisToneQuality(photo, { ...photo, data: result.image }, observed.masks);
    assert.equal(quality[hidden].status, "NOT_MEASURED");
    assert.equal(quality[hidden].meanRgbShift, null);
    assert.equal(quality[hidden].textureCorrelation, null);
    const other = hidden === "right" ? "left" : "right";
    assert.equal(quality[other].status, "MEASURED");
  });
}

test("Independent pupil annotations detect a single forbidden edit", () => {
  const { photo, observed } = scene();
  const changed = { ...photo, data: Uint8ClampedArray.from(photo.data) };
  changed.data[(20 * WIDTH + 21) * 3]++;
  const pupils = {
    right_iris: new Float64Array(WIDTH * HEIGHT),
    left_iris: new Float64Array(WIDTH * HEIGHT),
  };
  pupils.right_iris[20 * WIDTH + 21] = 1;
  const measured = irisToneQuality(photo, changed, observed.masks, pupils);
  assert.equal(measured.right.pupilChanges, 1);
  assert.equal(measured.verdict, "FAIL");
});

test("Masked input outside changes and alpha changes are detected", () => {
  const { photo, observed } = scene(null, 4);
  const changed = { ...photo, data: Uint8ClampedArray.from(photo.data) };
  changed.data[2]++;
  changed.data[3] = 0;
  const measured = irisToneQuality(photo, changed, observed.masks);
  assert.equal(measured.outsideMaxAbsDiff, 1);
  assert.equal(measured.alphaChanges, 1);
  assert.equal(measured.verdict, "FAIL");
});

test("Malformed pupil and iris masks cannot be silently accepted", () => {
  const { photo, observed } = scene();
  const pupils = { ...observed.masks, left_iris: new Float64Array(5) };
  assert.throws(() => irisToneQuality(photo, photo, observed.masks, pupils), /mask/);
  observed.masks.right_iris[0] = NaN;
  assert.throws(() => irisToneQuality(photo, photo, observed.masks), /mask/);
});

test("Python and browser texture diagnostics agree on the same artificial eyes", () => {
  const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
  const code = [
    "import json",
    "from plumb_api.engines.eyes.iris_trial import IrisTrialEngine",
    "from plumb_api.engines.eyes.iris_quality import iris_tone_quality",
    "from r26c_iris_cases import scene, Observed",
    "image, observed = scene(93)",
    "render = IrisTrialEngine(Observed(observed)).render(image, box=(0,0,1,1), level=5)",
    "report = iris_tone_quality(image, render.image, observed.masks)",
    "print(json.dumps(report.safe_counts()))",
  ].join("\n");
  const expected = JSON.parse(execFileSync("python3", ["-c", code], {
    cwd: ROOT, env: { ...process.env, PYTHONPATH: "api:api/tests" }, encoding: "utf8",
  }));
  const { photo, observed } = scene();
  const engine = new IrisTrialEngine({ observe() { return observed; } });
  const result = engine.render(photo, "drawn", { primaryBox: BOX, level: 5 });
  const actual = irisToneQuality(photo, { ...photo, data: result.image }, observed.masks);
  assert.equal(actual.outsideMaxAbsDiff, expected.outside_max_abs_diff);
  assert.equal(actual.alphaChanges, expected.alpha_changes);
  assert.equal(actual.verdict, expected.quality_verdict);
  for (const side of ["right", "left"]) {
    assert.equal(actual[side].observedPixels, expected[side].observed_pixels);
    assert.ok(Math.abs(actual[side].meanRgbShift - expected[side].mean_rgb_shift) < 0.025);
    const gap = Math.abs(actual[side].textureCorrelation - expected[side].texture_correlation);
    assert.ok(gap < 0.015);
  }
});

test("Frozen iris-row field mapping never invents missing geometry evidence", async () => {
  const { measuredGateRow } = await import("../dist/js/engines/eyes/iris-quality.js");
  const { photo, observed } = scene("right");
  const result = new IrisTrialEngine({ observe() { return observed; } }).render(
    photo, "drawn", { primaryBox: BOX },
  );
  const measured = irisToneQuality(photo, { ...photo, data: result.image }, observed.masks);
  const unknown = measuredGateRow(measured, {
    visibleIrises: result.visibleIrises, undeclaredMissing: result.undeclaredMissing,
    shapeObserved: null, guardCalled: result.guardCalled,
  });
  assert.equal(unknown.shape_ok, null);
  assert.equal(unknown.visible_irises, 1);
  assert.equal(unknown.outside_unchanged, true);
  assert.equal(unknown.catchlight_unchanged, true);
  assert.equal(unknown.quality_verdict, "UNPROVEN");
  assert.throws(() => measuredGateRow(measured, {
    visibleIrises: 3, undeclaredMissing: [], shapeObserved: true, guardCalled: true,
  }), /visible iris count/);
});
