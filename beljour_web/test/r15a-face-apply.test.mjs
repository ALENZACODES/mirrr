// Group-face safety boundary. Only invented 12x12 RGBA images. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyLookToFaces, faceRect, mergeSelectedPixels } from "../dist/js/save/face-apply.js";
import { BatchRun } from "../dist/js/save/batch.js";
import { LookLibrary } from "../dist/js/save/looks.js";
import { MemoryLookStorage } from "../dist/js/save/storage.js";

const w = 20, h = 15;
const photo = () => ({ width: w, height: h, channels: 4,
  data: Uint8Array.from({ length: w * h * 4 }, (_, i) => i % 4 === 3 ? 255 : (i + 37) % 210) });
const faceA = { id: "left", box: [2, 3, 6, 7] }, faceB = { id: "right", box: [12, 3, 5, 7] };
const engine = { tan: (source, step, dose) => ({ ...source,
  data: source.data.map((value, i) => i % 4 === 0 ? Math.min(255, value + Math.round(step.strength * dose)) : value) }) };
const steps = [{ tool: "tan", strength: 60, provider: "local", settings: {} }];

async function look() { return new LookLibrary(new MemoryLookStorage()).saveLook("Own face only", steps); }

const pixel = (p, x, y, ch = 0) => p.data[(y * w + x) * 4 + ch];

test("chosen right face changes no pixel of unselected left face or background", async () => {
  const original = photo(), saved = await look();
  const result = applyLookToFaces(saved, original, [faceB], engine);
  assert.equal(pixel(result.photo, 15, 6), Math.min(255, pixel(original, 15, 6) + 60));
  assert.equal(pixel(result.photo, 4, 6), pixel(original, 4, 6));
  assert.equal(pixel(result.photo, 9, 0), pixel(original, 9, 0));
  assert.deepEqual(original, photo(), "the uploaded source remains unchanged");
});

test("different adaptive doses affect their chosen faces independently", async () => {
  const original = photo(), saved = await look();
  const result = applyLookToFaces(saved, original, [faceA, faceB], engine,
    { doseFor: (f) => f.id === "left" ? 0.25 : 0.75 });
  assert.equal(pixel(result.photo, 4, 5) - pixel(original, 4, 5), 15);
  assert.equal(pixel(result.photo, 13, 5) - pixel(original, 13, 5), 45);
  assert.deepEqual(result.faceIds, ["left", "right"]);
});

test("face bounds reject negative size, out-of-frame regions and duplicated identity", async () => {
  const source = photo(), saved = await look();
  assert.throws(() => faceRect({ id: "bad", box: [1, 1, 0, 1] }, source), /invalid/);
  assert.throws(() => faceRect({ id: "bad", box: [999, 999, 1, 1] }, source), /outside/);
  assert.throws(() => faceRect({ id: "bad", box: [NaN, 1, 1, 1] }, source), /identity/);
  assert.throws(() => applyLookToFaces(saved, source, [faceA, faceA], engine), /selected twice/);
  assert.throws(() => applyLookToFaces(saved, source, [faceA], engine, { doseFor: () => 12 }), /adaptive dose/);
});

test("merge-selected-pixels rejects shape mismatch and protects the alpha channel", () => {
  const source = photo(), modified = photo();
  for (let i = 0; i < modified.data.length; i += 4) modified.data[i] = 0;
  const outcome = mergeSelectedPixels(source, modified, faceA);
  assert.equal(pixel(outcome, 4, 5), 0);
  assert.equal(pixel(outcome, 11, 5), pixel(source, 11, 5));
  assert.equal(pixel(outcome, 4, 5, 3), 255);
  assert.throws(() => mergeSelectedPixels(source, { ...modified, width: 13 }, faceA), /match a valid/);
});

test("batch review applies only to selected IDs while keeping the other group face original", async () => {
  const saved = await look();
  const source = photo();
  const run = new BatchRun(saved, [{ name: "invented group", photo: source }],
    { engine, findFaces: () => [faceA, faceB] }, ["right"]);
  const progress = await run.run();
  assert.equal(progress.done, 1);
  assert.deepEqual(run.grid()[0].facesEdited, ["right"]);
  assert.equal(pixel(run.grid()[0].after, 4, 5), pixel(source, 4, 5));
});
