/** R28c browser parity on drawn two-brow observations. Author: John Khan. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  BrowTrialSession,
  PixelGuard,
  checkedLevel,
  safeReport,
} from "../dist/js/engines/brows/brow-trial.js";
import {
  aggregateBrowEvidence,
  auditBrowTrial,
  browSideEvidence,
  safeBrowEvidence,
} from "../dist/js/engines/brows/brow-evidence.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const python = process.env.PYTHON || "python3";
const vectors = JSON.parse(execFileSync(python, ["api/tests/r28c_brow_vectors.py"], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, PYTHONPATH: resolve(root, "api") },
}));

function fromVector(row) {
  const photo = { width: row.width, height: row.height,
    channels: row.channels, data: Uint8ClampedArray.from(row.original) };
  const observation = {
    masks: {
      right_brow: Float64Array.from(row.masks.right_brow),
      left_brow: Float64Array.from(row.masks.left_brow),
    },
    states: { ...row.states },
    protected: row.protected ? Float64Array.from(row.protected) : undefined,
    source: "manual_or_measured",
  };
  return { photo, observation };
}

function gap(a, b) {
  assert.equal(a.length, b.length);
  let maximum = 0;
  for (let i = 0; i < a.length; i++) {
    maximum = Math.max(maximum, Math.abs(a[i] - b[i]));
  }
  return maximum;
}

test("eight Python/TypeScript brow previews have <=1 channel difference", () => {
  assert.equal(vectors.length, 8);
  for (const row of vectors) {
    const { photo, observation } = fromVector(row);
    const session = new BrowTrialSession({ observe: () => observation });
    const result = session.render(photo, [0, 0, 1, 1], {
      mode: row.mode, level: row.level, shade: "neutral",
    });
    assert.ok(gap(result.image, row.rendered) <= 1, `${row.mode}/${row.level}/${row.hidden}`);
    assert.equal(result.status, row.status);
    assert.equal(result.changedPixels, row.changed);
    assert.equal(result.guardCalled, row.guard_called);
    assert.equal(result.limited, row.limited);
    assert.ok(Math.abs(result.similarityProxy - row.similarity) < 1e-10);
    assert.deepEqual(safeReport(result), {
      format: "beljour-brow-trial/1", status: result.status,
      reason: "observed_local_simulation", mode: row.mode, level: row.level,
      visible_brows: row.hidden === null ? 2 : 1,
      changed_pixels: row.changed, guard_called: true,
      limited: row.limited, quality_verdict: "UNPROVEN", simulation: true,
    });
  }
});

test("browser independent pixel audit matches Python reports", () => {
  for (const row of vectors) {
    const { photo, observation } = fromVector(row);
    const session = new BrowTrialSession({ observe: () => observation });
    const result = session.render(photo, [0, 0, 1, 1], { mode: row.mode, level: row.level });
    const report = safeBrowEvidence(auditBrowTrial(photo, result,
      observation.masks, observation.protected));
    for (const key of ["status", "observed_pixels", "changed_pixels", "changed_outside",
      "max_outside_rgb", "alpha_changes", "protected_changes", "guard_missing", "quality_verdict"]) {
      assert.deepEqual(report[key], row.evidence[key], key);
    }
    for (const key of ["texture_correlation", "mean_luma_change"]) {
      const expected = row.evidence[key];
      if (expected === null) assert.equal(report[key], null);
      else assert.ok(Math.abs(report[key] - expected) < 1e-6, key);
    }
  }
});

test("off-grid strength and invalid missing-mask states are rejected", () => {
  for (const input of [0.95, 2.25, 5.1, NaN, true, "2.0"]) {
    assert.throws(() => checkedLevel(input), /level/);
  }
  const { photo, observation } = fromVector(vectors[0]);
  const missing = { ...observation, masks: { ...observation.masks,
    right_brow: new Float64Array(photo.width * photo.height) } };
  const result = new BrowTrialSession({ observe: () => missing }).render(photo, [0, 0, 1, 1]);
  assert.equal(result.reason, "unexplained_missing_brow");
  assert.equal(gap(result.image, photo.data), 0);
});

test("a missing primary face never invokes the mask source", () => {
  const { photo, observation } = fromVector(vectors[0]);
  let calls = 0;
  const source = { observe: () => { calls++; return observation; } };
  const result = new BrowTrialSession(source).render(photo);
  assert.equal(result.status, "no_mesh");
  assert.equal(calls, 0);
  assert.equal(gap(result.image, photo.data), 0);
});

test("five slider changes reuse one annotation until invalidated", () => {
  const { photo, observation } = fromVector(vectors[0]);
  let calls = 0;
  const source = { observe: () => { calls++; return observation; } };
  const session = new BrowTrialSession(source);
  for (const level of [1, 2, 2.5, 3.5, 5]) {
    assert.equal(session.render(photo, [0, 0, 1, 1], { level }).guardCalled, true);
  }
  assert.equal(calls, 1);
  assert.equal(session.maskComputations, 1);
  session.render(photo, [0, 0, 1, 1], { revision: "corrected" });
  assert.equal(calls, 2);
  session.invalidate();
  assert.equal(session.retainedObservations, 0);
});

test("faulty injected guard never modifies pixels outside brow masks", () => {
  const { photo, observation } = fromVector(vectors[1]);
  const guard = { guard: () => ({ image: new Uint8ClampedArray(photo.data.length),
    similarity: 0, limited: true }) };
  const result = new BrowTrialSession({ observe: () => observation }, guard).render(photo, [0, 0, 1, 1]);
  for (let i = 0; i < photo.width * photo.height; i++) {
    if (observation.masks.right_brow[i] >= 0.5 || observation.masks.left_brow[i] >= 0.5) continue;
    for (let channel = 0; channel < photo.channels; channel++) {
      assert.equal(result.image[i * photo.channels + channel], photo.data[i * photo.channels + channel]);
    }
  }
  for (let i = 3; i < result.image.length; i += 4) {
    assert.equal(result.image[i], photo.data[i]);
  }
});

test("count-only reports refuse personal group labels", () => {
  const { photo, observation } = fromVector(vectors[0]);
  const result = new BrowTrialSession({ observe: () => observation }).render(photo, [0, 0, 1, 1]);
  const row = auditBrowTrial(photo, result, observation.masks);
  const counts = aggregateBrowEvidence([row, row], ["tone_a", "tone_b"]);
  assert.equal(counts.observations, 2);
  assert.equal(counts.unproven, 2);
  assert.equal(Object.keys(counts.groups).length, 2);
  assert.throws(() => aggregateBrowEvidence([row], ["private/email@example.com"]), /group/);
});

test("user-lowered lock permits larger change, default is strict", () => {
  const before = Uint8ClampedArray.from({ length: 48 }, () => 220);
  const proposed = new Uint8ClampedArray(48);
  const guard = new PixelGuard(3);
  const strict = guard.guard(before, proposed, 5);
  const relaxed = guard.guard(before, proposed, 2);
  assert.ok(strict.image[0] > relaxed.image[0]);
  assert.equal(strict.image[0], 208);
  assert.equal(relaxed.image[0], 178);
  assert.ok(strict.limited && relaxed.limited);
});

test("invalid identity evidence refuses the render", () => {
  const { photo, observation } = fromVector(vectors[0]);
  const unreliable = { guard: (_, after) => ({ image: after, similarity: Number.NaN, limited: false }) };
  const session = new BrowTrialSession({ observe: () => observation }, unreliable);
  assert.throws(() => session.render(photo, [0, 0, 1, 1]), /guard/);
});

test("distinct buffers never share a mask cache slot", () => {
  const { photo, observation } = fromVector(vectors[0]);
  let called = 0;
  const session = new BrowTrialSession({ observe: () => { called++; return observation; } });
  session.render(photo, [0, 0, 1, 1]);
  const copy = { ...photo, data: new Uint8ClampedArray(photo.data) };
  session.render(copy, [0, 0, 1, 1]);
  assert.equal(called, 2);
  assert.equal(session.retainedObservations, 2);
});

test("ten constructed tones never auto-lighten skin or background", () => {
  for (const tone of [18, 28, 44, 62, 88, 114, 146, 180, 213, 235]) {
    const { photo, observation } = fromVector(vectors[0]);
    const recoloured = new Uint8ClampedArray(photo.data);
    for (let i = 0; i < recoloured.length; i++) recoloured[i] = tone;
    const source = { ...photo, data: recoloured };
    for (const mode of ["tint", "powder", "lamination"]) {
      const result = new BrowTrialSession({ observe: () => observation }).render(
        source, [0, 0, 1, 1], { level: 5, mode },
      );
      for (let i = 0; i < result.image.length; i++) {
        assert.ok(result.image[i] <= source.data[i]);
      }
    }
  }
});

test("every decimal slider change is nondecreasing in colour dose", () => {
  const { photo, observation } = fromVector(vectors[0]);
  const source = { ...photo, data: new Uint8ClampedArray(photo.data.length).fill(220) };
  for (const mode of ["tint", "powder", "lamination"]) {
    const session = new BrowTrialSession({ observe: () => observation });
    let previous = 0;
    for (let tick = 10; tick <= 50; tick++) {
      const result = session.render(source, [0, 0, 1, 1], { level: tick / 10, mode });
      let dose = 0;
      for (let i = 0; i < result.image.length; i++) dose += source.data[i] - result.image[i];
      assert.ok(dose >= previous);
      previous = dose;
    }
    assert.ok(previous > 0);
    assert.equal(session.maskComputations, 1);
  }
});

test("mask provider receives a defensive copy of the input pixels", () => {
  const { photo, observation } = fromVector(vectors[1]);
  const sourceBytes = new Uint8ClampedArray(photo.data);
  const source = {
    observe: (_, incoming) => {
      incoming.data.fill(0);
      return observation;
    },
  };
  const result = new BrowTrialSession(source).render(photo, [0, 0, 1, 1]);
  assert.equal(result.status, "rendered");
  assert.ok(gap(photo.data, sourceBytes) === 0);
});

test("one hidden brow yields independent measured and not-visible side rows", () => {
  const row = vectors.find(candidate => candidate.hidden === "left");
  const { photo, observation } = fromVector(row);
  const result = new BrowTrialSession({ observe: () => observation }).render(photo, [0, 0, 1, 1], {
    mode: row.mode, level: row.level,
  });
  const [right, left] = browSideEvidence(photo, result, observation.masks, observation.states);
  assert.equal(right.status, "MEASURED");
  assert.equal(right.observedPixels, 50);
  assert.ok(right.changedPixels > 0);
  assert.equal(left.status, "DECLARED_NOT_VISIBLE");
  assert.equal(left.observedPixels, 0);
  assert.equal(left.qualityVerdict, "UNPROVEN");
});
