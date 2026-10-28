// A layer that moves the face hands its points on: tools stacked after a gender or age reshape
// edit the face where it now is, in the editor's stack and in a re-applied recipe alike.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyLocalLayer, nextFace, renderLayers } from "../dist/js/ui/shell/pipeline.js";
import { makeSample } from "../dist/js/ui/shell/demo.js";
import { SKIN_DEFAULTS } from "../dist/js/ui/shell/skin-layer.js";
import { regionMask } from "../dist/js/data/regions/index.js";
import { reapply } from "../dist/js/save/reapply.js";
import { LookLibrary } from "../dist/js/save/looks.js";
import { MemoryLookStorage } from "../dist/js/save/storage.js";

const layer = (kind, strength, parameters, opacity = 1) => ({ id: kind, kind, name: kind, enabled: true, opacity, strength,
  parameters, provenance: "local", simulation: true, origin: "photo" });
const skinOf = (photo, face) => regionMask("skin", face, photo.image.width, photo.image.height, { normalized: false, supersample: 2 });
const changedAt = (a, b, mask, pick) => {
  let n = 0;
  for (let q = 0; q < mask.length; q++) if (pick(q) && [0, 1, 2].some((c) => a.data[q * 3 + c] !== b.data[q * 3 + c])) n++;
  return n;
};

for (const slider of [-100, 100]) {
  test(`after a gender reshape (${slider}) the skin tool edits no pixel that is no longer skin`, () => {
    const photo = makeSample("portrait");
    const gender = applyLocalLayer(photo.image, photo, layer("gender", 100, { slider }));
    assert.equal(gender.face.length, 478);
    assert.ok(gender.face.some((p, i) => Math.hypot(p[0] - photo.face[i][0], p[1] - photo.face[i][1]) > 2), "the face really moved");
    const stack = renderLayers(photo, [layer("gender", 100, { slider }), layer("skin", 100, { ...SKIN_DEFAULTS })]);
    assert.deepEqual(stack.face, gender.face, "the stack reports where the face ended up");
    const oldSkin = skinOf(photo, photo.face).data, newSkin = skinOf(photo, gender.face).data;
    const formerSkin = changedAt(stack.image, gender.image, oldSkin, (q) => oldSkin[q] > 0.5 && newSkin[q] === 0);
    assert.equal(formerSkin, 0, "nothing toned where the skin used to be");
    const nowSkin = changedAt(stack.image, gender.image, newSkin, (q) => newSkin[q] > 0.5 && oldSkin[q] === 0);
    assert.ok(nowSkin > 0, "the skin that moved into place is reached");
  });
}

test("a face tool on its own, or after a layer that moves nothing, sees the photo's own points", () => {
  const photo = makeSample("portrait");
  assert.equal(renderLayers(photo, [layer("enhance", 50, { mode: "natural" })]).face, photo.face);
  assert.equal(renderLayers(makeSample("low-light"), [layer("enhance", 50, { mode: "natural" })]).face, undefined);
  const older = applyLocalLayer(photo.image, photo, layer("older", 100, { stop: 5 }));
  assert.equal(older.face.length, 478, "the age reshape reports its points too");
});

test("a half-mixed reshape moves the points half way; the re-apply path chains them like the stack", async () => {
  const photo = makeSample("portrait");
  const full = applyLocalLayer(photo.image, photo, layer("gender", 100, { slider: 100 })).face;
  const half = renderLayers(photo, [layer("gender", 100, { slider: 100 }, 0.5)]).face;
  for (const i of [10, 152, 234]) {
    assert.ok(Math.abs(half[i][0] - (photo.face[i][0] + full[i][0]) / 2) < 1e-9 && Math.abs(half[i][1] - (photo.face[i][1] + full[i][1]) / 2) < 1e-9);
  }
  assert.equal(nextFace(undefined, full, 1), undefined, "no points are invented");
  const look = await new LookLibrary(new MemoryLookStorage(), () => new Date("2026-10-28T10:00:00Z")).saveLook("Reshape then tone", [
    { tool: "gender", strength: 100, settings: { slider: 100 }, provider: "local" },
    { tool: "skin", strength: 100, settings: { ...SKIN_DEFAULTS }, provider: "local" }]);
  const out = reapply(look, photo);
  const stack = renderLayers(photo, [layer("gender", 100, { slider: 100 }), layer("skin", 100, { ...SKIN_DEFAULTS })]);
  assert.deepEqual(out.applied, ["gender", "skin"]);
  assert.deepEqual(Array.from(out.photo.data), Array.from(stack.image.data), "same bytes as the editor's stack");
});
