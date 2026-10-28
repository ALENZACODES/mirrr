/** Inspection catches tampered guarded outputs; counts only. Author: John Khan. */

import assert from "node:assert/strict";
import test from "node:test";

import { upscale } from "../../../../dist/js/engines/upscale/index.js";
import { safeUpscale } from "../../../../dist/js/engines/upscale/safe.js";
import { inspectSafeResult } from "../../../../dist/js/engines/upscale/safe-quality.js";

function setup() {
  const width = 36, height = 28, data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = (i * 37) % 256; data[i * 4 + 1] = (i * 11) % 256; data[i * 4 + 2] = (i * 5) % 256;
    data[i * 4 + 3] = 200;
  }
  const mask = new Uint8Array(width * height);
  for (let y = 8; y < 20; y++) for (let x = 10; x < 26; x++) mask[y * width + x] = 255;
  const photo = { width, height, channels: 4, data };
  const selection = { mask, confirmed: true };
  return { photo, selection, result: safeUpscale(photo, selection, { detailLevel: 4.5 }) };
}

function withPixels(result, change) {
  const data = result.photo.data.slice();
  change(data);
  return { ...result, photo: { ...result.photo, data } };
}

test("an untouched result holds every invariant", () => {
  const { photo, selection, result } = setup();
  const report = inspectSafeResult(photo, selection, result);
  assert.equal(report.status, "INVARIANTS_HOLD");
  assert.equal(report.faceOutputPixels, 12 * 16 * 4);
  assert.equal(report.fullLockPixels, report.faceOutputPixels);
  assert.equal(report.realFaceQuality, "NOT_RUN");
  assert.equal(report.identityVerification, "NOT_PERFORMED");
});

test("single-value tampering is attributed to the right invariant", () => {
  const { photo, selection, result } = setup();
  const width = 72;
  const cases = [
    [(30 * width + 30) * 4, "identityLock", "lockMismatches"],
    [0 * 4 + 1, "outsideUnchanged", "outsideMismatches"],
    [(5 * width + 70) * 4 + 3, "alpha", "alphaMismatches"],
  ];
  for (const [index, invariant, counter] of cases) {
    const report = inspectSafeResult(photo, selection, withPixels(result, data => { data[index] ^= 1; }));
    assert.equal(report.status, "INVARIANT_FAILED");
    assert.equal(report.invariants[invariant], false, invariant);
    assert.equal(report[counter], 1);
  }
});

test("size, label, face count and unguarded output are caught", () => {
  const { photo, selection, result } = setup();
  const cropped = { ...result, photo: { ...result.photo, height: result.photo.height - 1,
    data: result.photo.data.subarray(0, result.photo.data.length - 72 * 4) } };
  assert.equal(inspectSafeResult(photo, selection, cropped).invariants.geometry, false);
  assert.equal(inspectSafeResult(photo, selection, { ...result, label: "PASS" }).invariants.evidenceLabel, false);
  assert.equal(inspectSafeResult(photo, selection, { ...result, facePixels: 1 }).invariants.coverage, false);
  const plain = { ...result, photo: upscale(photo, 2, 0.875) };
  const report = inspectSafeResult(photo, selection, plain);
  assert.equal(report.invariants.identityLock, false);
  assert.ok(report.fullLockDeviations > 0);
});

test("reports contain counts and labels only", () => {
  const { photo, selection, result } = setup();
  for (const [key, value] of Object.entries(inspectSafeResult(photo, selection, result))) {
    assert.ok(["number", "string", "object"].includes(typeof value), key);
    if (typeof value === "object") assert.ok(Object.values(value).every(item => typeof item === "boolean"));
  }
});
