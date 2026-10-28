// Re-applying a saved look to a new photo: the studio's own renderers, skips with reasons, the
// original untouched, and saved face points only ever reused on the photo they came from.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as R from "../dist/js/save/reapply.js";
import { LookLibrary } from "../dist/js/save/looks.js";
import { MemoryLookStorage } from "../dist/js/save/storage.js";
import { upgradeMyLook } from "../dist/js/save/validate.js";
import { applyLocalLayer } from "../dist/js/ui/shell/pipeline.js";
import { makeSample } from "../dist/js/ui/shell/demo.js";
import { defaultFilterParams } from "../dist/js/filters/runtime/layer.js";

const steps = [
  { tool: "filters", strength: 40, settings: defaultFilterParams("C02"), provider: "local" },
  { tool: "enhance", strength: 30, settings: { mode: "natural" }, provider: "local" },
  { tool: "portrait", strength: 30, settings: { look: "PL01" }, provider: "local" },
  { tool: "makeup", strength: 50, settings: {}, provider: "youcam" },
  { tool: "nose", strength: 20, settings: {}, provider: "local" },
];
const save = (s = steps) => new LookLibrary(new MemoryLookStorage(), () => new Date("2026-10-28T10:00:00Z")).saveLook("Evening", s);
const rgbaOf = (img) => {
  const data = new Uint8Array(img.width * img.height * 4);
  for (let p = 0; p < img.width * img.height; p++) {
    for (let c = 0; c < 3; c++) data[p * 4 + c] = img.data[p * 3 + c];
    data[p * 4 + 3] = (p * 7) % 256;
  }
  return { ...img, channels: 4, data };
};

test("on a photo with its own face points, every local step runs through the studio renderer", async () => {
  const look = await save();
  const photo = makeSample("portrait");
  const before = Uint8Array.from(photo.image.data);
  const out = R.reapply(look, photo);
  assert.deepEqual(out.applied, ["filters", "enhance", "portrait"]);
  assert.deepEqual(out.skipped.map((s) => s.tool), ["makeup", "nose"]);
  assert.match(out.skipped[0].reason, /YouCam, which re-applying on this device never calls/);
  assert.match(out.skipped[1].reason, /can't be re-applied on this device yet/);
  assert.equal(out.face, "this-photo");
  let expected = photo.image;
  steps.slice(0, 3).forEach((step, i) => { expected = applyLocalLayer(expected, { ...photo, image: expected }, R.layerFor(step, 1, i)).image; });
  assert.deepEqual(Array.from(out.photo.data), Array.from(expected.data), "the same bytes as the editor's own layers");
  assert.deepEqual(Array.from(photo.image.data), Array.from(before), "the photo she gave is never changed");
  assert.deepEqual(Array.from(R.reapply(look, photo).photo.data), Array.from(out.photo.data), "deterministic");
});

test("a new photo without face points gets the steps that don't need a face; face steps say why", async () => {
  const look = await save();
  const photo = makeSample("low-light");
  const out = R.reapply(look, photo);
  assert.deepEqual(out.applied, ["filters", "enhance"]);
  const portrait = out.skipped.find((s) => s.tool === "portrait");
  assert.match(portrait.reason, /face points/i);
  assert.equal(out.face, "none");
  assert.deepEqual(out.plan.map((p) => p.runs), [true, true, false, false, false]);
});

test("saved face points are reused only on the same file; any other photo has to read its own", async () => {
  const look = await save(steps.slice(2, 3));
  const sample = makeSample("portrait");
  const mesh = sample.face.map((p) => [p[0], p[1], 0]);
  const saved = { mesh, identity: { reference: "abc123", model: "local-mesh", dimensions: [sample.image.width, sample.image.height] },
    strengths: {}, settings: {}, activeVersion: 1 };
  const same = { ...sample, face: undefined, fileSha256: "abc123" };
  const reused = R.reapply(look, same, { savedFace: saved });
  assert.equal(reused.face, "saved-for-this-photo"); assert.deepEqual(reused.applied, ["portrait"]);
  const other = R.reapply(look, { ...same, fileSha256: "different" }, { savedFace: saved });
  assert.equal(other.face, "none"); assert.deepEqual(other.applied, []);
  const resized = { ...saved, identity: { ...saved.identity, dimensions: [10, 10] } };
  assert.equal(R.savedFaceFor(resized, same), null, "same digest but another size is not the same photo");
  assert.equal(R.savedFaceFor(saved, { ...same, fileSha256: undefined }), null, "no digest, no reuse");
  assert.equal(R.reapply(look, sample, { savedFace: { ...saved, identity: { ...saved.identity, reference: "x" } } }).face, "this-photo");
});

test("an RGBA photo keeps its alpha; dose 0 leaves the photo as it was", async () => {
  const look = await save(steps.slice(0, 2));
  const photo = makeSample("low-light");
  const rgba = { ...photo, image: rgbaOf(photo.image) };
  const out = R.reapply(look, rgba);
  assert.equal(out.photo.channels, 4);
  for (let p = 0; p < photo.image.width * photo.image.height; p++) assert.equal(out.photo.data[p * 4 + 3], rgba.image.data[p * 4 + 3]);
  assert.notDeepEqual(Array.from(out.photo.data), Array.from(rgba.image.data));
  assert.deepEqual(Array.from(R.reapply(look, rgba, { dose: 0 }).photo.data), Array.from(rgba.image.data));
});

test("a step its renderer refuses is skipped with the renderer's reason; the others still run", async () => {
  const look = await save([{ tool: "filters", strength: 40, settings: { recipe: "C999" }, provider: "local" }, steps[1]]);
  const out = R.reapply(look, makeSample("low-light"));
  assert.deepEqual(out.applied, ["enhance"]);
  assert.equal(out.skipped.length, 1); assert.equal(out.skipped[0].tool, "filters");
  assert.ok(out.skipped[0].reason.length > 0);
});

test("a Home My Look file re-applies through the same path, older versions too", async () => {
  const myLook = { format: "beljour-my-look/1", id: "look-1234abcd", name: "Soft day", created: "2026-10-20T10:00:00.000Z",
    steps: [{ kind: "enhance", strength: 25, params: { mode: "natural" } }] };
  const out = R.reapply(upgradeMyLook(myLook), makeSample("low-light"));
  assert.deepEqual(out.applied, ["enhance"]);
  const library = new LookLibrary(new MemoryLookStorage(), () => new Date("2026-10-28T10:00:00Z"));
  const v1 = await library.saveLook("Two versions", [steps[1]]);
  const v2 = await library.updateLook(v1.id, [steps[0], steps[1]]);
  assert.deepEqual(R.reapply(v2, makeSample("low-light"), { version: 1 }).applied, ["enhance"]);
  assert.deepEqual(R.reapply(v2, makeSample("low-light")).applied, ["filters", "enhance"]);
});
