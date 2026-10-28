/** R27E annotation controls: native buttons, stage clicks, typed points and a missing list.
 * Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { GAP_MESSAGES, mountPostureAnnotator } from "../dist/js/body/posture-annotator.js";
import { PostureIntake } from "../dist/js/body/posture-intake.js";
import { drawnPhoto } from "./posture-fixtures-r27e.mjs";
import { withFakeDocument } from "./posture-dom-fake.mjs";

test("a full marking session through the controls alone", () => withFakeDocument(async (document, requests) => {
  const photo = drawnPhoto("side");
  const intake = new PostureIntake();
  const errors = [];
  const annotator = mountPostureAnnotator(document.createElement("div"), intake, (message) => errors.push(message));
  const root = annotator.element;
  assert.equal(root.button("Side view, facing right").disabled, true, "no photo yet");
  intake.setSource(photo.digest, photo.pixels);
  root.button("Side view, facing right").click();
  assert.equal(root.button("Side view, facing right").getAttribute("aria-pressed"), "true");
  for (const point of photo.person) annotator.place(point);
  root.button("Finish outline").click();
  root.button("Draw head outline").click();
  for (const point of photo.head) annotator.place(point);
  root.button("Finish outline").click();
  const confirm = root.find((node) => node.type === "checkbox");
  confirm.checked = true;
  confirm.emit("change");
  root.button("Place control points").click();
  const select = root.byTag("select")[0];
  const [x, y] = root.findAll((node) => node.type === "number");
  for (const [name, [px, py]] of Object.entries(photo.points)) {
    select.value = name;
    x.value = String(px);
    y.value = String(py);
    root.button("Set point").click();
  }
  assert.deepEqual(errors, []);
  assert.equal(root.button("Accept markings").disabled, false);
  root.button("Accept markings").click();
  assert.ok(intake.accepted, "markings accepted");
  assert.equal(root.byTag("li").length, 0);
  assert.equal(requests.length, 0);
  annotator.dispose();
}));

test("the missing list names each outstanding marking in plain words", () => withFakeDocument(async (document) => {
  const photo = drawnPhoto("front");
  const intake = new PostureIntake();
  const annotator = mountPostureAnnotator(document.createElement("div"), intake);
  intake.setSource(photo.digest, photo.pixels);
  const items = annotator.element.byTag("li").map((item) => item.textContent);
  assert.deepEqual(items, [GAP_MESSAGES.view_required, GAP_MESSAGES.person_outline_required,
    GAP_MESSAGES.head_outline_required]);
  assert.equal(annotator.element.button("Accept markings").disabled, true);
  annotator.dispose();
}));

test("a crossing outline is refused and reported, and undo removes the last vertex", () => withFakeDocument(async (document) => {
  const photo = drawnPhoto("front");
  const intake = new PostureIntake();
  const errors = [];
  const annotator = mountPostureAnnotator(document.createElement("div"), intake, (message) => errors.push(message));
  intake.setSource(photo.digest, photo.pixels, "front", 0);
  for (const point of [[10, 10], [60, 60], [60, 10], [10, 60]]) annotator.place(point);
  annotator.element.button("Finish outline").click();
  assert.deepEqual(errors, ["self_crossing_outline"]);
  assert.equal(intake.snapshot().person, null);
  for (const point of [[10, 10], [60, 10], [60, 60], [99, 99]]) annotator.place(point);
  annotator.element.button("Undo last outline point").click();
  assert.equal(annotator.draft.length, 3);
  annotator.dispose();
}));

test("stage clicks in points mode place the selected point and advance", () => withFakeDocument(async (document) => {
  const photo = drawnPhoto("front");
  const intake = new PostureIntake();
  const annotator = mountPostureAnnotator(document.createElement("div"), intake);
  intake.setSource(photo.digest, photo.pixels, "front", 0);
  annotator.setMode("points");
  const select = annotator.element.byTag("select")[0];
  assert.equal(select.value, "right_shoulder");
  annotator.place(photo.points.right_shoulder);
  assert.deepEqual(intake.snapshot().points.right_shoulder, photo.points.right_shoulder);
  assert.equal(select.value, "left_shoulder");
  annotator.dispose();
}));
