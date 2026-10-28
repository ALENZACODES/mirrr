/** Local iris photo-scoping, mask reuse and independently measured invariants.
 * Author: John Khan.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  IrisTrialEngine, checkedLevel, legacyStrength, safeTrialReport,
} from "../dist/js/engines/eyes/iris-trial.js";
import {
  aggregateIrisAudits, auditIrisTrial, safeIrisAuditReport,
} from "../dist/js/engines/eyes/iris-evidence.js";

const WIDTH = 80;
const HEIGHT = 48;

function synthetic(channels = 3) {
  const data = new Uint8ClampedArray(WIDTH * HEIGHT * channels);
  const right = new Float64Array(WIDTH * HEIGHT);
  const left = new Float64Array(WIDTH * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const index = y * WIDTH + x;
      const r = (x - 21) ** 2 + (y - 20) ** 2 < 49;
      const l = (x - 59) ** 2 + (y - 20) ** 2 < 49;
      const values = r ? [43, 36, 32] : l ? [68, 58, 49] : [93, 85, 97];
      for (let c = 0; c < 3; c++) data[index * channels + c] = values[c];
      if (channels === 4) data[index * channels + 3] = 187;
      if (r) right[index] = 1;
      if (l) left[index] = 1;
    }
  }
  const a = (17 * WIDTH + 20) * channels;
  const b = (17 * WIDTH + 58) * channels;
  for (let c = 0; c < 3; c++) {
    data[a + c] = 252;
    data[b + c] = 252;
  }
  const photo = { width: WIDTH, height: HEIGHT, channels, data };
  const observed = {
    masks: { right_iris: right, left_iris: left },
    states: { right_iris: "visible", left_iris: "visible" },
    source: "manual_or_measured",
  };
  return { photo, observed };
}

function observedProvider(observed) {
  let calls = 0;
  return {
    get calls() { return calls; },
    observe() { calls++; return observed; },
  };
}

const BOX = [0, 0, 1, 1];

for (const level of [1, 1.1, 1.2, 2, 3.5, 4.9, 5]) {
  test(`A decimal iris level of ${level} is valid`, () => {
    assert.equal(checkedLevel(level), level);
    assert.equal(legacyStrength(level), (level - 1) * 25);
  });
}

for (const invalid of [0, 0.95, 1.05, 2.25, 5.1, -1, Infinity, NaN]) {
  test(`Invalid strength ${String(invalid)} fails closed`, () => {
    assert.throws(() => checkedLevel(invalid), /level/);
  });
}

test("Missing primary geometry refuses before loading any observed masks", () => {
  const { photo, observed } = synthetic();
  const provider = observedProvider(observed);
  const engine = new IrisTrialEngine(provider);
  const result = engine.render(photo, "drawn", { primaryBox: null });
  assert.equal(result.status, "no_mesh");
  assert.equal(result.changedPixels, 0);
  assert.equal(result.guardCalled, false);
  assert.equal(provider.calls, 0);
  assert.deepEqual(result.image, photo.data);
});

test("Default on guard is invoked at the neutral level and on every edit", () => {
  const { photo, observed } = synthetic();
  const provider = observedProvider(observed);
  let calls = 0;
  const guard = {
    guard(_before, after) {
      calls++;
      return { image: Uint8ClampedArray.from(after), similarity: 0.99, blendedBack: false };
    },
  };
  const engine = new IrisTrialEngine(provider, guard);
  const neutral = engine.render(photo, "drawn", { primaryBox: BOX, level: 1 });
  const edited = engine.render(photo, "drawn", { primaryBox: BOX, level: 5 });
  assert.equal(neutral.status, "neutral");
  assert.equal(edited.status, "rendered");
  assert.deepEqual(neutral.image, photo.data);
  assert.ok(edited.changedPixels > 0);
  assert.equal(calls, 2);
  assert.equal(provider.calls, 1);
});

test("Mask observations are reused across five slider levels", () => {
  const { photo, observed } = synthetic();
  const provider = observedProvider(observed);
  const engine = new IrisTrialEngine(provider);
  for (const level of [1, 2, 2.5, 3.5, 5]) {
    const result = engine.render(photo, "drawn", { primaryBox: BOX, level });
    assert.equal(result.guardCalled, true);
  }
  assert.equal(engine.maskComputations, 1);
  assert.equal(provider.calls, 1);
  assert.equal(engine.retainedObservations, 1);
});

test("Corrected masks are used after an explicit revision or invalidation", () => {
  const { photo, observed } = synthetic();
  const provider = observedProvider(observed);
  const engine = new IrisTrialEngine(provider);
  const first = engine.render(photo, "drawn", { primaryBox: BOX });
  observed.masks.right_iris.fill(0);
  observed.states.right_iris = "not_visible:closed";
  const stale = engine.render(photo, "drawn", { primaryBox: BOX });
  assert.equal(stale.visibleIrises, 2);
  assert.equal(provider.calls, 1);
  const refreshed = engine.render(photo, "drawn", {
    primaryBox: BOX, maskRevision: "corrected_one",
  });
  assert.equal(refreshed.visibleIrises, 1);
  assert.ok(refreshed.changedPixels < first.changedPixels);
  assert.equal(provider.calls, 2);
  engine.invalidate("drawn");
  engine.render(photo, "drawn", { primaryBox: BOX, maskRevision: "corrected_one" });
  assert.equal(provider.calls, 3);
});

test("A reused photo key cannot incorrectly reuse a different photo's masks", () => {
  const { photo, observed } = synthetic();
  const provider = observedProvider(observed);
  const engine = new IrisTrialEngine(provider);
  engine.render(photo, "drawn", { primaryBox: BOX });
  const replacement = { ...photo, data: Uint8ClampedArray.from(photo.data) };
  replacement.data[0] = 12;
  engine.render(replacement, "drawn", { primaryBox: BOX });
  assert.equal(engine.maskComputations, 2);
});

test("Iris previews shrink output only; full-quality render remains independent", () => {
  const { photo, observed } = synthetic();
  const engine = new IrisTrialEngine(observedProvider(observed));
  const preview = engine.render(photo, "drawn", { primaryBox: BOX, previewEdge: 24 });
  const full = engine.render(photo, "drawn", { primaryBox: BOX });
  assert.equal(preview.width, 24);
  assert.ok(preview.height < photo.height);
  assert.equal(preview.changedPixels, full.changedPixels);
  assert.equal(full.image.length, photo.data.length);
  assert.equal(engine.maskComputations, 1);
});

test("An iris mask observed on another person's face refuses the whole edit", () => {
  const { photo, observed } = synthetic();
  const engine = new IrisTrialEngine(observedProvider(observed));
  const result = engine.render(photo, "drawn", { primaryBox: [0.05, 0.01, 0.51, 0.99] });
  assert.equal(result.status, "refused");
  assert.equal(result.reason, "iris_outside_primary_face");
  assert.deepEqual(result.image, photo.data);
});

test("A hostile guard cannot edit background, alpha or original catchlights", () => {
  const { photo, observed } = synthetic(4);
  const engine = new IrisTrialEngine(observedProvider(observed), {
    guard(_before, after) {
      return {
        image: Uint8ClampedArray.from(after, () => 255),
        similarity: 0.99, blendedBack: false,
      };
    },
  });
  const output = engine.render(photo, "drawn", { primaryBox: BOX, level: 5 });
  assert.equal(output.guardCalled, true);
  const audit = auditIrisTrial(photo, output, observed.masks, BOX);
  assert.equal(audit.changedAlpha, 0);
  assert.equal(audit.changedOutside, 0);
  assert.equal(audit.changedCatchlights, 0);
  assert.equal(audit.verdict, "UNPROVEN");
  assert.deepEqual(output.image.slice(0, 4), photo.data.slice(0, 4));
});

test("The independent auditor catches an edit outside annotated support", () => {
  const { photo, observed } = synthetic();
  const engine = new IrisTrialEngine(observedProvider(observed));
  const result = engine.render(photo, "drawn", { primaryBox: BOX });
  const tampered = { ...result, image: Uint8ClampedArray.from(result.image) };
  tampered.image[0] ^= 1;
  const audit = auditIrisTrial(photo, tampered, observed.masks, BOX);
  assert.equal(audit.verdict, "FAIL");
  assert.equal(audit.changedOutside, 1);
  assert.equal(audit.offMaskMaxRgb, 1);
});

test("Count-only reports retain no image, pixel hash or individual identifier", () => {
  const { photo, observed } = synthetic();
  const trial = new IrisTrialEngine(observedProvider(observed)).render(photo, "drawn", {
    primaryBox: BOX,
  });
  const good = auditIrisTrial(photo, trial, observed.masks, BOX);
  const corrupted = { ...trial, guardCalled: false };
  const bad = auditIrisTrial(photo, corrupted, observed.masks, BOX);
  const counts = aggregateIrisAudits([good, bad], ["group_one", "group_two"]);
  assert.equal(counts.observations, 2);
  assert.equal(counts.failures, 1);
  assert.equal(counts.unproven, 1);
  const reports = [safeIrisAuditReport(counts), safeTrialReport(trial)];
  const payload = JSON.stringify(reports);
  for (const forbidden of ["image", "photo_hash", "face_box", "landmarks", "person_id"]) {
    assert.equal(payload.includes(`"${forbidden}"`), false);
  }
  assert.ok(payload.includes("UNPROVEN"));
});

test("Bad array dimensions, invalid group names and missing group rows are refused", () => {
  const { photo, observed } = synthetic();
  const engine = new IrisTrialEngine(observedProvider(observed));
  const result = engine.render(photo, "drawn", { primaryBox: BOX });
  assert.throws(() => auditIrisTrial(photo, { ...result, image: new Uint8ClampedArray(3) },
    observed.masks, BOX), /full-resolution/);
  const measured = auditIrisTrial(photo, result, observed.masks, BOX);
  assert.throws(() => aggregateIrisAudits([measured], []), /group\/observation/);
  assert.throws(() => aggregateIrisAudits([measured], ["../unsafe"]), /group/);
});

test("A supplied off-centre pupil is preserved even if an external guard is hostile", () => {
  const { photo, observed } = synthetic();
  const pupils = {
    right_iris: new Float64Array(WIDTH * HEIGHT),
    left_iris: new Float64Array(WIDTH * HEIGHT),
  };
  pupils.right_iris[20 * WIDTH + 16] = 1;
  pupils.left_iris[20 * WIDTH + 54] = 1;
  observed.pupils = pupils;
  const trial = new IrisTrialEngine(observedProvider(observed), {
    guard(_before, after) {
      return { image: Uint8ClampedArray.from(after, () => 255), similarity: 0.98,
        blendedBack: false };
    },
  });
  const result = trial.render(photo, "drawn", { primaryBox: BOX, level: 5 });
  for (const x of [16, 54]) {
    const offset = (20 * WIDTH + x) * 3;
    assert.deepEqual(result.image.slice(offset, offset + 3), photo.data.slice(offset, offset + 3));
  }
  assert.ok(result.changedPixels > 0);
});

test("An off-iris pupil annotation cannot enable an unmasked edit", () => {
  const { photo, observed } = synthetic();
  observed.pupils = {
    right_iris: new Float64Array(WIDTH * HEIGHT),
    left_iris: new Float64Array(WIDTH * HEIGHT),
  };
  observed.pupils.right_iris[0] = 1;
  const trial = new IrisTrialEngine(observedProvider(observed));
  assert.throws(() => trial.render(photo, "drawn", { primaryBox: BOX }), /pupil/);
});
