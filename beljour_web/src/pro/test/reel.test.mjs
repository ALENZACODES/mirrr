import assert from "node:assert/strict";
import test from "node:test";
import { CLIP_PRESETS, drawClipLabel, resolveClipPreset } from "../../../dist/js/reel/index.js";

test("short clips: each preset is vertical, bounded and simulation-labelled by default", () => {
  assert.deepEqual(Object.keys(CLIP_PRESETS), ["quick", "social", "high"]);
  for (const entry of Object.values(CLIP_PRESETS)) {
    assert.ok(entry.width < entry.height);
    assert.ok(entry.fps >= 24 && entry.fps <= 30);
    assert.ok(entry.maxDurationSeconds <= 60);
    assert.equal(entry.label, true);
  }
});

test("short clips: choose only supported local encoders", () => {
  const webm = resolveClipPreset("quick", 10, (mime) => mime === "video/webm");
  assert.equal(webm.mime, "video/webm");
  assert.equal(webm.extension, "webm");
  const mp4 = resolveClipPreset("high", 60, (mime) => mime.startsWith("video/mp4"));
  assert.equal(mp4.mime, "video/mp4");
  assert.equal(mp4.extension, "mp4");
  assert.throws(() => resolveClipPreset("quick", 16, () => true));
  assert.throws(() => resolveClipPreset("social", NaN, () => true));
  assert.throws(() => resolveClipPreset("social", 3, () => false));
});

test("short clips: overlay uses same visible disclosure on final frame", () => {
  const operations = [];
  const ctx = {
    save() { operations.push("save"); },
    restore() { operations.push("restore"); },
    measureText(text) { operations.push(text); return { width: 80 }; },
    fillRect() { operations.push("fillRect"); },
    fillText(text) { operations.push(text); },
  };
  drawClipLabel(ctx, 720, 1280);
  assert.ok(operations.includes("Simulation"));
  assert.equal(operations[0], "save");
  assert.equal(operations.at(-1), "restore");
  assert.throws(() => drawClipLabel(ctx, -1, 4));
  const count = operations.length;
  drawClipLabel(ctx, 720, 1280, false);
  assert.equal(operations.length, count);
});
