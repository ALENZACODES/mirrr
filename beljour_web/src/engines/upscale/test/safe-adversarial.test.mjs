/** Synthetic negative controls for the guarded browser upscale. Author: John Khan. */

import assert from "node:assert/strict";
import test from "node:test";

import { safeUpscale } from "../../../../dist/js/engines/upscale/safe.js";
import { admit } from "../../../../dist/js/engines/upscale/safe-tile-policy.js";
import { UpscalePreviewSession } from "../../../../dist/js/engines/upscale/preview-session.js";

const width = 24, height = 24;
const photo = { width, height, channels: 4, data: new Uint8ClampedArray(width * height * 4).fill(120) };
const mask = new Uint8Array(width * height);
for (let i = 150; i < 400; i++) mask[i] = 255;
const selection = { mask, confirmed: true };

test("malformed photos are refused", () => {
  const bad = [
    null, { ...photo, channels: 2 }, { ...photo, data: new Uint8Array(photo.data) },
    { ...photo, data: photo.data.subarray(4) }, { ...photo, width: 24.5 },
    { width: 4, height: 4, channels: 4, data: new Uint8ClampedArray(64) },
  ];
  for (const value of bad) assert.throws(() => safeUpscale(value, { mask: new Uint8Array(value?.width * value?.height || 1), confirmed: true }));
});

test("hostile levels are refused for detail and lock", () => {
  for (const level of [0.9, 5.1, 2.25, Number.NaN, Infinity, true, "3", null]) {
    assert.throws(() => safeUpscale(photo, selection, { detailLevel: level }), /strength/);
    assert.throws(() => safeUpscale(photo, selection, { lockLevel: level }), /strength/);
  }
});

test("hostile scales and release flags are refused", () => {
  for (const scale of [1, 3, 8, "2", true]) assert.throws(() => safeUpscale(photo, selection, { scale }), /scale/);
  assert.throws(() => safeUpscale(photo, selection, { release: 1 }), /release/);
});

test("truthy non-boolean confirmations and declarations are refused", () => {
  for (const confirmed of [1, "yes", {}, []]) {
    assert.throws(() => safeUpscale(photo, { mask, confirmed }), /confirmed/);
  }
  assert.throws(() => safeUpscale(photo, { mask: new Uint8Array(width * height), confirmed: true, noFace: 1 }),
    /no-face/);
});

test("mask type tricks are refused", () => {
  for (const value of [Array.from(mask), new Uint16Array(mask), new Uint8ClampedArray(mask), mask.subarray(1)]) {
    assert.throws(() => safeUpscale(photo, { mask: value, confirmed: true }), /mask/);
  }
});

test("hostile budgets and geometry are refused", () => {
  for (const budgetBytes of [0, -1, 2 ** 70, 1.5, Number.NaN, "64"]) {
    assert.throws(() => admit(100, 100, { budgetBytes }), /budget/);
  }
  for (const [w, h] of [[7, 100], [100, 7], [16385, 10], [10.5, 10]]) assert.throws(() => admit(w, h), /limits/);
});

test("ticket forgery is not accepted", () => {
  const session = new UpscalePreviewSession();
  session.open("d".repeat(64), 100, 100);
  const real = session.release();
  assert.equal(session.accepts({ ...real }), true);
  assert.equal(session.accepts({ ...real, sequence: real.sequence + 1 }), false);
  assert.equal(session.accepts({ ...real, revision: real.revision - 1 }), false);
  assert.equal(session.exportable({ ...real, kind: "preview", fullResolution: true }), false);
  assert.equal(session.exportable({ ...session.preview(), fullResolution: true }), false);
});
