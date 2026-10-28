/** R26E final-pixel inspection and checked export of protected posture results.
 * Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { SIMULATION_LABEL } from "../dist/js/engines/local/posture.js";
import { PostureOutputRefused, exportProtectedPosture, inspectPostureOutput,
  requireInspectedOutput } from "../dist/js/body/posture-output.js";
import { renderProtectedPosture } from "../dist/js/body/posture-safe.js";
import { drawnPostureFrame, echoGuard } from "./posture-dom-fake.mjs";

async function rendered(fix = "uneven_shoulders", view = "front") {
  const frame = await drawnPostureFrame(view);
  return { frame, result: renderProtectedPosture(frame.image, frame.person, frame.head, frame.controls, fix, 5,
    echoGuard(0.99), 5) };
}
const firstHeadPixel = (head) => head.data.findIndex((value) => value >= 0.5);
/** A minimal well-formed JPEG: start, one scan segment, end. */
const jpegEncoder = () => ({ async encode() { return new Uint8Array([255, 216, 255, 218, 0, 2, 0, 7, 255, 217]); } });

test("a protected render passes with zero head and outside-band changes", async () => {
  const { frame, result } = await rendered("slouch", "side");
  const report = inspectPostureOutput(frame.image, result, frame.head);
  assert.equal(report.passed, true, report.reasons.join());
  assert.equal(report.headChanged, 0);
  assert.equal(report.outsideBandChanged, 0);
  assert.ok(report.outsideBandPixels > 0 && report.minJacobian >= 0.2);
  assert.ok(report.movementPx <= report.capPx + 1e-6);
});

test("a changed head pixel and a changed background pixel are both counted", async () => {
  const { frame, result } = await rendered();
  const data = new Uint8Array(result.image.data);
  const head = firstHeadPixel(frame.head) * 3;
  data[head] ^= 255;
  data[0] ^= 255;
  const report = inspectPostureOutput(frame.image, { ...result, image: { ...result.image, data } }, frame.head);
  assert.deepEqual(report.reasons.sort(), ["outside_band_changed", "protected_head_changed"]);
  assert.equal(report.headChanged, 1);
  assert.equal(report.outsideBandChanged, 1);
  assert.throws(() => requireInspectedOutput(frame.image, { ...result, image: { ...result.image, data } }, frame.head),
    PostureOutputRefused);
});

test("wrong label, strength values and fold floor are refused", async () => {
  const { frame, result } = await rendered();
  const label = inspectPostureOutput(frame.image, { ...result, label: "Edited" }, frame.head);
  assert.ok(label.reasons.includes("simulation_label_missing"));
  const level = inspectPostureOutput(frame.image, { ...result, level: 3.25 }, frame.head);
  assert.ok(level.reasons.includes("invalid_strength_values"));
  const lock = inspectPostureOutput(frame.image, { ...result, lockLevel: 2 }, frame.head);
  assert.ok(lock.reasons.includes("invalid_strength_values"));
  const folded = { ...result, guarded: { ...result.guarded,
    outcome: { ...result.guarded.outcome, metrics: { ...result.guarded.outcome.metrics, min_det: 0.1 } } } };
  assert.ok(inspectPostureOutput(frame.image, folded, frame.head).reasons.includes("fold_guard_below_floor"));
});

test("an output of another shape is refused outright", async () => {
  const { frame, result } = await rendered();
  const report = inspectPostureOutput(frame.image, { ...result, image: { ...result.image, width: 10 } }, frame.head);
  assert.deepEqual(report.reasons, ["output_shape_changed"]);
});

test("export needs a passing inspection and keeps the label on by default", async () => {
  const { frame, result } = await rendered();
  const inspection = inspectPostureOutput(frame.image, result, frame.head);
  const saved = await exportProtectedPosture(result, inspection, {}, jpegEncoder());
  assert.equal(saved.label, SIMULATION_LABEL);
  assert.equal(saved.name, "Posture_J11.jpg");
  await assert.rejects(exportProtectedPosture(result, { ...inspection, passed: false, reasons: ["x"] }, {},
    jpegEncoder()), PostureOutputRefused);
});
