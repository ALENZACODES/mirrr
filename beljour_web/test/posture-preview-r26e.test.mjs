/** R26E preview preparation: a 1 MP source gives a 512-pixel drag frame; release stays full.
 * Durations printed here are CPU smoke numbers, not device frame timing. Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { byteImage, floatImage } from "../dist/js/engines/core/buffer.js";
import { makeControls } from "../dist/js/engines/local/posture.js";
import { preparePostureFrame, scaleControls, shrinkMask } from "../dist/js/body/posture-preview.js";
import { drawnPostureFrame } from "./posture-dom-fake.mjs";

function megapixelFrame() {
  const width = 1000, height = 1000;
  const image = byteImage(width, height);
  image.data.fill(120);
  const person = floatImage(width, height);
  const head = floatImage(width, height);
  for (let y = 0; y < height; y++) for (let x = 300; x < 700; x++) person.data[y * width + x] = 1;
  for (let y = 100; y < 220; y++) for (let x = 440; x < 560; x++) head.data[y * width + x] = 1;
  const controls = makeControls("front", { right_shoulder: [380, 300], left_shoulder: [620, 310],
    right_hip: [420, 620], left_hip: [580, 620], mid_chest: [500, 400], navel: [500, 540] }, width, height);
  return { image, person, head, controls };
}

test("a one-megapixel source prepares a 512x512 drag frame", () => {
  const frame = megapixelFrame();
  const started = performance.now();
  const preview = preparePostureFrame(frame, false);
  const elapsed = performance.now() - started;
  assert.equal(preview.stage, "preview");
  assert.deepEqual([preview.image.width, preview.image.height], [512, 512]);
  assert.deepEqual([preview.person.width, preview.head.width, preview.controls.width], [512, 512, 512]);
  assert.ok(elapsed < 5000, `preparation took ${elapsed} ms`);
});

test("release keeps full size and owns copies of every input", async () => {
  const frame = await drawnPostureFrame("front");
  const released = preparePostureFrame(frame, true);
  assert.equal(released.stage, "release");
  assert.equal(released.image.width, frame.image.width);
  released.image.data[0] ^= 1;
  released.head.data[0] = 0.25;
  assert.notEqual(frame.image.data[0], released.image.data[0]);
  assert.notEqual(frame.head.data[0], 0.25);
});

test("scaled control points follow pixel centres and stay inside the frame", () => {
  const frame = megapixelFrame();
  const scaled = scaleControls(frame.controls, 512, 512);
  const [x, y] = scaled.points.right_shoulder;
  assert.ok(Math.abs(x - ((380 + 0.5) * 0.512 - 0.5)) < 1e-9);
  assert.ok(Math.abs(y - ((300 + 0.5) * 0.512 - 0.5)) < 1e-9);
  assert.equal(scaled.view, "front");
});

test("mask shrinking preserves area and stays in 0..1", () => {
  const mask = floatImage(8, 8);
  mask.data.fill(1, 0, 32);
  const half = shrinkMask(mask, 4, 4);
  assert.equal(half.data.reduce((sum, value) => sum + value, 0), 8);
  assert.ok(half.data.every((value) => value >= 0 && value <= 1));
  assert.throws(() => shrinkMask(mask, 16, 16), /only shrinks/);
});

test("frames whose masks or points belong to another size are refused", () => {
  const frame = megapixelFrame();
  assert.throws(() => preparePostureFrame({ ...frame, person: floatImage(10, 10) }, false), /person mask/);
  const otherPoints = makeControls("front", { right_shoulder: [38, 30], left_shoulder: [62, 31], right_hip: [42, 62],
    left_hip: [58, 62], mid_chest: [50, 40], navel: [50, 54] }, 100, 100);
  assert.throws(() => preparePostureFrame({ ...frame, controls: otherPoints }, false), /another size/);
});
