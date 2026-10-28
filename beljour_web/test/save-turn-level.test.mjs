import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { renderTurnLevel, requestedYaw, safeYaw, turnLevel } from "../dist/js/save/turn-level.js";
import { project } from "../dist/js/engines/local/turn.js";
import { faceFrame } from "../dist/js/engines/shape/geometry.js";

const mesh = JSON.parse(readFileSync(new URL("../../parity/turn-field.json", import.meta.url), "utf8")).targets[0].mesh;
const width = 220;
const height = 240;
const channels = 4;
const image = { width, height, channels, data: new Uint8ClampedArray(width * height * channels) };
for (let p = 0; p < width * height; p++) {
  image.data[p * 4] = p % 256;
  image.data[p * 4 + 1] = Math.floor(p / width) % 256;
  image.data[p * 4 + 2] = 170;
  image.data[p * 4 + 3] = 203;
}
const selected = new Float32Array(width * height);
const bystander = new Float32Array(width * height);
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const index = y * width + x;
  if (x < width - 28) selected[index] = 1;
  if (x >= width - 30) bystander[index] = 1;
}

test("neutral 1.0 returns identical bytes without losing source or identity lock", () => {
  const before = new Uint8ClampedArray(image.data);
  const outcome = renderTurnLevel(image, mesh, 1, selected, { bystanders: [bystander] });
  assert.equal(outcome.refused, false);
  assert.equal(outcome.identityLock, true);
  assert.equal(outcome.maxMoveIOD, 0);
  assert.deepEqual(outcome.image, before);
  assert.deepEqual(image.data, before);
});

test("all 0.1 levels have deterministic, bounded direction", () => {
  for (let step = 10; step <= 50; step++) {
    const level = step / 10;
    assert.equal(turnLevel(level), level);
    assert.equal(requestedYaw(level, "left"), -requestedYaw(level, "right"));
    assert.ok(Math.abs(requestedYaw(level, "left")) <= 8);
  }
  for (const value of [0, 5.01, 3.05, NaN, Infinity]) {
    assert.throws(() => turnLevel(value));
  }
});

test("observed geometric cap is no looser with lock on", () => {
  const baseline = mesh.map(([x, y]) => [x, y]);
  const iod = faceFrame(baseline).iod;
  const locked = safeYaw(mesh, 8, .02);
  const unlocked = safeYaw(mesh, 8, .065);
  assert.ok(locked > 0 && unlocked > locked);
  const projected = project(mesh, locked, 0, 0, "silhouette").points;
  const movement = Math.max(...projected.map((p, i) => Math.hypot(p[0] - baseline[i][0], p[1] - baseline[i][1])));
  assert.ok(movement / iod <= .020000001);
});

test("invalid meshes and masks refuse without modifying the photo", () => {
  const before = new Uint8ClampedArray(image.data);
  const empty = new Float32Array(width * height);
  assert.equal(renderTurnLevel(image, mesh, 3, empty).refused, true);
  assert.equal(renderTurnLevel(image, mesh, 3, selected, { bystanders: [selected] }).refused, true);
  const bad = new Float32Array(selected);
  bad[11] = NaN;
  assert.equal(renderTurnLevel(image, mesh, 3, bad).refused, true);
  const points = mesh.map((p) => [...p]);
  points[2][0] = Infinity;
  assert.equal(renderTurnLevel(image, points, 3, selected).refused, true);
  assert.deepEqual(image.data, before);
});

test("a non-neutral turn cannot corrupt any bystander or alpha byte", () => {
  const output = renderTurnLevel(image, mesh, 3, selected, { bystanders: [bystander], identityLock: false });
  assert.equal(output.refused, false);
  assert.ok(output.effectiveYaw > 0);
  assert.ok(output.maxMoveIOD <= .065000001);
  for (let y = 0; y < height; y++) for (let x = width - 30; x < width; x++) {
    const index = (y * width + x) * 4;
    assert.deepEqual(output.image.slice(index, index + 4), image.data.slice(index, index + 4));
  }
  for (let p = 0; p < width * height; p++) {
    assert.equal(output.image[p * 4 + 3], image.data[p * 4 + 3]);
  }
});
