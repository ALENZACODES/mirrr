/** R27E body studio end to end on drawn photos: import, markings, seven fixes, protected
 * head, labelled save, history replay and clean photo replacement. No network. Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { FIXES, SIMULATION_LABEL } from "../dist/js/engines/local/posture.js";
import { mountBodyPostureStudio } from "../dist/js/body/posture-studio.js";
import { annotate, drawnDecoder, drawnPhoto, jpegEncoder, photoBlob } from "./posture-fixtures-r27e.mjs";
import { settle, until, withFakeDocument } from "./posture-dom-fake.mjs";

function headUnchanged(source, image, head) {
  for (let p = 0; p < head.data.length; p++) {
    if (head.data[p] < 0.5) continue;
    for (let c = 0; c < 4; c++) if (source.data[p * 4 + c] !== image.data[p * 4 + c]) return false;
  }
  return true;
}

async function openStudio(document, view = "side", extra = {}) {
  const photo = drawnPhoto(view);
  const frames = [], errors = [];
  const studio = mountBodyPostureStudio(document.createElement("div"), {
    decoder: drawnDecoder(photo), encoder: jpegEncoder(),
    onFrame: (frame) => frames.push(frame), onError: (message) => errors.push(message), ...extra,
  });
  const digest = await studio.openFile(photoBlob(`drawn-${view}`), view, photo.facing);
  return { studio, photo, frames, errors, digest };
}

test("the studio starts with simulation and NOT_RUN copy and no save", () => withFakeDocument(async (document, requests) => {
  const studio = mountBodyPostureStudio(document.createElement("div"));
  const text = studio.element.textContent;
  assert.ok(text.includes(SIMULATION_LABEL));
  assert.ok(text.includes("NOT_RUN"));
  assert.equal(studio.element.button("Save labelled copy").disabled, true);
  assert.equal(studio.readiness.ready, false);
  studio.dispose();
  assert.equal(requests.length, 0);
}));

test("every fix of each view renders with the marked head untouched", () => withFakeDocument(async (document, requests) => {
  for (const view of ["front", "side"]) {
    const { studio, photo, frames, errors } = await openStudio(document, view);
    const accepted = annotate(studio.annotation.intake, photo);
    for (const fix of Object.keys(FIXES).filter((name) => FIXES[name].view === view)) {
      studio.element.button(FIXES[fix].id).click();
      await until(() => frames.some((item) => item.stage === "preview" && item.result.fix === fix));
      const frame = await studio.release();
      assert.ok(frame, `${fix} rendered`);
      assert.equal(frame.result.fix, fix);
      assert.ok(headUnchanged(accepted.image, frame.result.image, accepted.head), fix);
      assert.equal(frame.inspection.outsideBandChanged, 0, fix);
    }
    assert.deepEqual(errors, []);
    const previews = frames.filter((frame) => frame.stage === "preview");
    assert.ok(previews.every((frame) => Math.max(frame.frame.image.width, frame.frame.image.height) <= 512));
    studio.dispose();
  }
  assert.equal(requests.length, 0);
}));

test("save is labelled, metadata-scrubbed and only for the current released edit", () => withFakeDocument(async (document) => {
  const { studio, photo } = await openStudio(document);
  await assert.rejects(studio.export(), /Accept the markings/);
  annotate(studio.annotation.intake, photo);
  studio.element.button("J14").click();
  await studio.release();
  assert.equal(studio.readiness.ready, true);
  const saved = await studio.export();
  assert.equal(saved.name, "Posture_J14.jpg");
  assert.equal(saved.label, SIMULATION_LABEL);
  studio.annotation.intake.setPoint("knee", [photo.points.knee[0] + 1, photo.points.knee[1]]);
  assert.equal(studio.readiness.ready, false, "a corrected marking revokes the release");
  await assert.rejects(studio.export(), /Accept the markings/);
  studio.dispose();
}));

test("undo and redo re-render through the protected pipeline", () => withFakeDocument(async (document) => {
  const { studio, photo, frames } = await openStudio(document);
  annotate(studio.annotation.intake, photo);
  studio.element.button("J14").click();
  await studio.release();
  studio.element.button("J15").click();
  await studio.release();
  assert.equal(studio.history.snapshot.entries, 2);
  const undoButton = studio.element.find((node) => node.getAttribute?.("data-posture-history") === "undo");
  const redoButton = studio.element.find((node) => node.getAttribute?.("data-posture-history") === "redo");
  assert.equal(undoButton.disabled, false);
  const before = frames.length;
  assert.equal(await studio.undo(), true);
  assert.equal(frames.length, before + 1, "undo rendered again");
  assert.equal(frames.at(-1).result.fix, "slouch");
  assert.equal(studio.history.snapshot.cursor, 1);
  assert.equal(await studio.undo(), true);
  assert.equal(studio.history.snapshot.cursor, 0);
  assert.equal(redoButton.disabled, false);
  assert.equal(await studio.redo(), true);
  assert.equal(frames.at(-1).result.fix, "slouch");
  assert.equal(frames.at(-1).inspection.passed, true);
  assert.equal(studio.history.snapshot.entries, 2, "replay never commits new entries");
  studio.dispose();
}));

test("a marking change invalidates history and a new photo replaces everything", () => withFakeDocument(async (document) => {
  const { studio, photo } = await openStudio(document);
  annotate(studio.annotation.intake, photo);
  studio.element.button("J14").click();
  await studio.release();
  assert.equal(studio.history.snapshot.entries, 1);
  studio.annotation.intake.setPoint("knee", [photo.points.knee[0] + 1, photo.points.knee[1]]);
  assert.equal(studio.history.snapshot.entries, 0);
  const oldSource = studio.annotation.intake.source;
  const other = drawnPhoto("front");
  studio.setSource(other.digest, other.pixels, "front", 0);
  assert.ok(oldSource.data.every((value) => value === 0));
  assert.equal(studio.history.snapshot.entries, 0);
  assert.equal(studio.annotation.intake.digest, other.digest);
  assert.equal(studio.element.button("J14").disabled, true);
  studio.dispose();
}));

test("the built-in file control requires an explicit view choice", () => withFakeDocument(async (document) => {
  const photo = drawnPhoto("front");
  const studio = mountBodyPostureStudio(document.createElement("div"), { decoder: drawnDecoder(photo) });
  const input = studio.element.find((node) => node.type === "file");
  input.files = [photoBlob("picked")];
  input.emit("change");
  assert.equal(studio.annotation.intake.digest, null, "nothing opens before a view is chosen");
  studio.element.button("Front view").click();
  await until(() => studio.annotation.intake.digest !== null);
  assert.match(studio.annotation.intake.digest, /^[0-9a-f]{64}$/);
  assert.equal(studio.annotation.intake.snapshot().view, "front");
  studio.dispose();
}));

test("unsupported files are refused with fixed copy", () => withFakeDocument(async (document) => {
  const errors = [];
  const studio = mountBodyPostureStudio(document.createElement("div"), { onError: (message) => errors.push(message) });
  await assert.rejects(studio.openFile(photoBlob("x", "image/gif"), "front"));
  assert.deepEqual(errors, ["Choose a JPEG, PNG or WebP photo."]);
  studio.dispose();
}));

test("face-adjacent drag previews of a large photo keep the head protected at preview size", () =>
  withFakeDocument(async (document) => {
    const photo = drawnPhoto("front", { width: 640, height: 800 });
    const frames = [], errors = [];
    const studio = mountBodyPostureStudio(document.createElement("div"), { decoder: drawnDecoder(photo),
      onFrame: (frame) => frames.push(frame), onError: (message) => errors.push(message) });
    await studio.openFile(photoBlob("large-front"), "front", 0);
    annotate(studio.annotation.intake, photo);
    studio.element.button("J10").click();
    await until(() => frames.length > 0 || errors.length > 0);
    assert.deepEqual(errors, []);
    const preview = frames[0];
    assert.equal(preview.stage, "preview");
    assert.deepEqual([preview.frame.image.width, preview.frame.image.height], [410, 512]);
    assert.equal(preview.result.guarded.similarity, 1);
    assert.equal(preview.inspection.headChanged, 0);
    const release = await studio.release();
    assert.deepEqual([release.result.image.width, release.result.image.height], [640, 800]);
    studio.dispose();
  }));
