/** R31E posture studio history: branches, original-photo undo, fresh re-renders,
 * photo binding and settings-only recovery into a new studio. Drawn photos only.
 * Author: John Khan.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { mountBodyPostureStudio } from "../dist/js/body/posture-studio.js";
import { restorePostureHistory, savePostureHistory } from "../dist/js/body/posture-history-storage.js";
import { annotate, drawnDecoder, drawnPhoto, photoBlob } from "./posture-fixtures-r27e.mjs";
import { withFakeDocument } from "./posture-dom-fake.mjs";

async function studioWith(document, photo, name = "drawn-side") {
  const frames = [], errors = [];
  const studio = mountBodyPostureStudio(document.createElement("div"), {
    decoder: drawnDecoder(photo),
    onFrame: (frame) => frames.push(frame), onError: (message) => errors.push(message),
  });
  const digest = await studio.openFile(photoBlob(name), photo.facing === 0 ? "front" : "side", photo.facing);
  annotate(studio.annotation.intake, photo);
  return { studio, frames, errors, digest };
}

async function released(studio, fix, level, lockLevel) {
  studio.screen.panel.show(fix, level, lockLevel);
  const frame = await studio.release();
  assert.ok(frame, `${fix} at ${level} released`);
  return frame;
}

function memoryStore() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test("history records the released settings, not pixels", () => withFakeDocument(async (document) => {
  const { studio, digest } = await studioWith(document, drawnPhoto("side"));
  await released(studio, "slouch", 2.4, 4);
  await released(studio, "swayback", 4.1, 5);
  const settings = studio.history.exportSettings(digest);
  assert.deepEqual(settings, {
    entries: [
      { fix: "slouch", view: "side", level: 2.4, lockLevel: 4 },
      { fix: "swayback", view: "side", level: 4.1, lockLevel: 5 },
    ],
    cursor: 2,
  });
  studio.dispose();
}));

test("a new release after undo drops the redo branch and disables redo", () => withFakeDocument(async (document) => {
  const { studio, digest } = await studioWith(document, drawnPhoto("side"));
  await released(studio, "slouch", 3, 5);
  await released(studio, "swayback", 3, 5);
  assert.equal(await studio.undo(), true);
  await released(studio, "pelvic_tilt", 2, 5);
  const redo = studio.element.find((node) => node.getAttribute?.("data-posture-history") === "redo");
  assert.equal(studio.history.snapshot.canRedo, false);
  assert.equal(redo.disabled, true);
  assert.deepEqual(studio.history.exportSettings(digest).entries.map((entry) => entry.fix),
    ["slouch", "pelvic_tilt"]);
  studio.dispose();
}));

test("undo to the original photo renders nothing; redo renders a fresh frame", () =>
  withFakeDocument(async (document) => {
    const { studio, frames } = await studioWith(document, drawnPhoto("side"));
    const first = await released(studio, "slouch", 3.5, 5);
    const count = frames.length;
    assert.equal(await studio.undo(), true);
    assert.equal(studio.history.snapshot.selected, null);
    assert.equal(frames.length, count, "the original photo needs no render");
    assert.equal(studio.readiness.ready, false, "nothing released is shown");
    assert.equal(await studio.redo(), true);
    const again = frames.at(-1);
    assert.equal(again.stage, "release");
    assert.notEqual(again.result.image.data, first.result.image.data, "a new buffer, not a cached one");
    assert.deepEqual(again.result.image.data, first.result.image.data, "the same protected render");
    assert.equal(again.inspection.passed, true);
    assert.equal(await studio.redo(), false, "nothing further to redo");
    studio.dispose();
  }));

test("opening another photo starts an empty history bound to that photo", () =>
  withFakeDocument(async (document) => {
    const side = drawnPhoto("side");
    const { studio, digest } = await studioWith(document, side);
    await released(studio, "slouch", 3, 5);
    const front = drawnPhoto("front");
    studio.setSource(front.digest, front.pixels, "front", 0);
    assert.equal(studio.history.snapshot.entries, 0);
    assert.equal(await studio.undo(), false);
    assert.throws(() => studio.history.exportSettings(digest), /different photo/);
    assert.deepEqual(studio.history.exportSettings(front.digest), { entries: [], cursor: 0 });
    studio.dispose();
    assert.equal(studio.history.snapshot.open, false);
  }));

test("saved settings replay into a new studio for the same photo only", () => withFakeDocument(async (document) => {
  const photo = drawnPhoto("side");
  const store = memoryStore();
  const first = await studioWith(document, photo);
  const original = await released(first.studio, "slouch", 2.7, 4.5);
  await released(first.studio, "swayback", 3.3, 5);
  await first.studio.undo();
  await savePostureHistory(store, first.digest, first.studio.history);
  first.studio.dispose();

  const second = await studioWith(document, photo);
  assert.equal(second.digest, first.digest);
  assert.equal(await restorePostureHistory(store, second.digest, second.studio.history), true);
  assert.deepEqual(second.studio.history.snapshot.selected,
    { fix: "slouch", view: "side", level: 2.7, lockLevel: 4.5 });
  // Recovery holds settings only, so the shown photo is re-rendered through the pipeline.
  assert.equal(await second.studio.undo(), true);
  assert.equal(await second.studio.redo(), true);
  const replayed = second.frames.at(-1);
  assert.equal(replayed.result.fix, "slouch");
  assert.deepEqual(replayed.result.image.data, original.result.image.data);
  assert.equal(await second.studio.redo(), true);
  assert.equal(second.frames.at(-1).result.fix, "swayback");
  second.studio.dispose();

  const other = drawnPhoto("front");
  const third = await studioWith(document, other, "drawn-front");
  await assert.rejects(restorePostureHistory(store, third.digest, third.studio.history), /different photo/);
  assert.equal(third.studio.history.snapshot.entries, 0);
  third.studio.dispose();
}));
