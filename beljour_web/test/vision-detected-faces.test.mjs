import assert from "node:assert/strict";
import { test } from "node:test";

import { fromDetection } from "../dist/js/vision/detected-faces.js";

function mesh(cx, cy = .5, rx = .11) {
  return Array.from({ length: 478 }, (_, i) => ({
    x: cx + rx * Math.cos(2 * Math.PI * i / 478),
    y: cy + .12 * Math.sin(2 * Math.PI * i / 478), z: 0,
  }));
}
function box(cx, score = .96) {
  return { x: cx * 400 - 45, y: 100, width: 90, height: 100, score };
}
function result(faces = [], boxes = []) {
  return { detector: "yunet", faces, boxes, blendshapes: [], attempts: [], usedFallback: false };
}

test("every verified mesh maps to one interactive face choice", () => {
  const data = result([mesh(.75), mesh(.35)], [box(.35), box(.75)]);
  const discovered = fromDetection(data, 400, 300);
  assert.equal(discovered.counts().visibleFaces, 2);
  assert.deepEqual(discovered.meshIndices, [0, 1]);
  assert.equal(discovered.tap(.75, .5).code, "selected_by_user");
  assert.deepEqual(discovered.mesh(discovered.tap(.75, .5)), data.faces[0]);
});

test("proposal with no measured mesh is not selectable", () => {
  const discovered = fromDetection(result([mesh(.32)], [box(.32), box(.78)]), 400, 300);
  assert.equal(discovered.counts().visibleFaces, 1);
  assert.equal(discovered.tap(.78, .5).code, "no_face_at_point");
});

test("missing box with measured full-frame mesh remains selectable", () => {
  const discovered = fromDetection(result([mesh(.45)]), 400, 300);
  assert.equal(discovered.picker.primary.code, "selected_primary");
  assert.ok(discovered.mesh(discovered.picker.primary));
});

test("no mesh cannot turn a detector proposal into a successful edit", () => {
  const discovered = fromDetection(result([], [box(.45)]), 400, 300);
  assert.equal(discovered.picker.primary.code, "no_face_found");
  assert.equal(discovered.mesh(discovered.picker.primary), null);
});

test("invalid, untrusted and low confidence proposals fail closed", () => {
  const broken = mesh(.45); broken[23].z = NaN;
  assert.equal(fromDetection(result([broken]), 400, 300).counts().visibleFaces, 0);
  assert.equal(fromDetection(result([mesh(.45)], [box(.45, .4)]), 400, 300).counts().visibleFaces, 0);
  assert.throws(() => fromDetection(result(), 0, 300), /source photo/);
});

test("returned mesh is a safe copy, not the detector source", () => {
  const discovered = fromDetection(result([mesh(.5)]), 400, 300);
  const observed = discovered.mesh(discovered.picker.primary);
  observed[0].x = 99;
  assert.ok(discovered.mesh(discovered.picker.primary)[0].x < 1);
});

test("a single proposal can match only one measured mesh", () => {
  const discovered = fromDetection(result([mesh(.45), mesh(.47)], [box(.46)]), 400, 300);
  assert.equal(discovered.counts().visibleFaces, 1);
});
