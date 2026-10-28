// R8 manual crown and R7 posture fixture integration; no local image upload or network.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { AnnotationDraft, pointFromScreen, drawMarks } from "../dist/js/ui/shell/annotations.js";
import { makeSample, uploadedSource } from "../dist/js/ui/shell/demo.js";
import { Editor } from "../dist/js/ui/shell/controller.js";
import { pixelsChanged } from "../dist/js/ui/shell/pipeline.js";
import { coverage } from "../dist/js/engines/core/mask.js";
import { frontFigure, sideFigure } from "../dist/js/engines/local/figures.js";
import { FRONT, SIDE } from "../dist/js/engines/local/posture.js";

const rect = { left: 120, top: 50, width: 440, height: 360 };
const imgW = 220, imgH = 180;
const point = (x, y) => pointFromScreen(rect, imgW, imgH, x, y);

function bodyDraft(figure, view, facing = 1) {
  const { image, controls } = figure;
  const draft = new AnnotationDraft("body", image.width, image.height, view, facing);
  const names = view === "front" ? FRONT : SIDE;
  for (const name of names) draft.add(controls.points[name]);
  return draft;
}

test("pointer mapping is stable after CSS scale and stage scroll", () => {
  assert.deepEqual(point(120, 50), [0, 0]);
  assert.deepEqual(point(560, 410), [219, 179]);
  assert.deepEqual(point(340, 230), [109.5, 89.5]);
  const p = point(230, 140);
  assert.equal(p[0], 219 / 4);
  assert.equal(p[1], 179 / 4);
  assert.throws(() => point(110, 140), /inside/);
  assert.throws(() => point(230, 450), /inside/);
  assert.throws(() => pointFromScreen({ ...rect, width: 0 }, imgW, imgH, 150, 120), /ready/);
  assert.throws(() => pointFromScreen(rect, imgW, imgH, NaN, 60), /ready/);
  assert.throws(() => pointFromScreen(rect, 0, imgH, 140, 80), /ready/);
});

test("marking constructor verifies dimensions, kind and side direction", () => {
  assert.throws(() => new AnnotationDraft("crown", 4, 190), /pixels/);
  assert.throws(() => new AnnotationDraft("crown", 4096, 4096), /pixels/);
  assert.throws(() => new AnnotationDraft("unknown", 120, 120), /type/);
  assert.throws(() => new AnnotationDraft("body", 120, 120, "unknown"), /view/);
  assert.throws(() => new AnnotationDraft("body", 120, 120, "front", 0), /facing/);
});

test("crown marking needs both corners; undo, clear and restart do not leak state", () => {
  const draft = new AnnotationDraft("crown", 224, 224);
  assert.deepEqual(draft.names, ["Crown top-left", "Crown bottom-right"]);
  assert.equal(draft.next, "Crown top-left");
  assert.match(draft.instructions, /upper-left/);
  assert.equal(draft.ready, false);
  assert.throws(() => draft.seal(), /more/);
  assert.throws(() => draft.add([NaN, 30]), /outside/);
  assert.throws(() => draft.add([224, 30]), /outside/);
  draft.add([33, 20]);
  assert.match(draft.instructions, /lower-right/);
  draft.add([175, 183]);
  assert.equal(draft.ready, true);
  assert.equal(draft.progress, draft.required);
  assert.throws(() => draft.add([50, 50]), /already/);
  const readOnly = draft.points;
  readOnly[0][0] = 999;
  assert.deepEqual(draft.points[0], [33, 20]);
  assert.equal(draft.seal().kind, "crown");
  assert.ok(draft.seal().areaPercent > 10);
  assert.ok(draft.seal().areaPercent < 65);
  assert.deepEqual(draft.undo(), [175, 183]);
  assert.equal(draft.ready, false);
  draft.add([180, 190]);
  draft.clear();
  assert.equal(draft.progress, 0);
  const restarted = draft.restart();
  assert.equal(restarted.progress, 0);
  assert.equal(restarted.kind, "crown");
});

test("small crowns and disproportionate full-photo areas are rejected", () => {
  const small = new AnnotationDraft("crown", 224, 224);
  small.add([14, 14]); small.add([19, 19]);
  assert.throws(() => small.seal(), /at least 12/);
  const huge = new AnnotationDraft("crown", 224, 224);
  huge.add([1, 1]); huge.add([222, 222]);
  assert.throws(() => huge.seal(), /broad/);
  const reversed = new AnnotationDraft("crown", 224, 224);
  reversed.add([160, 180]); reversed.add([40, 30]);
  const seal = reversed.seal();
  assert.ok(Math.abs(coverage(seal.mask) * 100 - seal.areaPercent) < 1e-9);
  assert.equal(seal.mask.width, 224);
  assert.equal(seal.mask.height, 224);
});

test("manual crown mask unlocks R7 fibres on uploaded source without sending data", () => {
  const editor = new Editor();
  const crown = makeSample("crown");
  editor.load(uploadedSource(crown.image, "upload:crown-one"), "hair-fibre");
  assert.equal(editor.canApply, false);
  assert.match(editor.blockedReason, /Select the crown/);
  const draft = new AnnotationDraft("crown", crown.image.width, crown.image.height);
  draft.add([50, 35]); draft.add([175, 185]);
  editor.mark(draft.seal());
  assert.equal(editor.source.kind, "uploaded");
  assert.equal(editor.document.studio, "hair-fibre");
  assert.equal(editor.canApply, true);
  assert.equal(editor.history.length, 1);
  editor.add();
  assert.equal(editor.selected.kind, "hair-fibre");
  const changed = pixelsChanged(editor.source.image, editor.preview().image);
  assert.ok(changed.pixels > 0);
  editor.undo();
  assert.equal(pixelsChanged(editor.source.image, editor.preview().image).pixels, 0);
});

test("six front body points are canonical R7 manual controls and produce an approximate person mask", () => {
  const figure = frontFigure({ width: 200, height: 260, lean: 5, shoulderDrop: 7, seed: 4 });
  const draft = bodyDraft(figure, "front");
  assert.deepEqual(draft.names, FRONT);
  assert.equal(draft.ready, true);
  const seal = draft.seal();
  assert.equal(seal.kind, "body");
  assert.equal(seal.controls.view, "front");
  assert.deepEqual(seal.controls.manual, FRONT);
  assert.equal(seal.controls.estimated.length, 0);
  assert.equal(seal.controls.facing, 0);
  assert.ok(seal.areaPercent > 1 && seal.areaPercent < 80);
  const editor = new Editor();
  editor.load(uploadedSource(figure.image, "upload:front"), "posture");
  assert.equal(editor.canApply, false);
  editor.mark(seal);
  assert.equal(editor.canApply, true);
  const layer = editor.add();
  assert.equal(layer.parameters.fix, "lean");
  const result = editor.preview();
  assert.equal(result.metrics.length, 1);
  assert.equal(result.metrics[0].band_share, 0.03);
  assert.equal(result.metrics[0].cap_share, 0.06);
  assert.ok(pixelsChanged(editor.source.image, result.image).pixels > 0);
  editor.undo();
  assert.equal(editor.preview().effective, 0);
});

test("manual side profile needs a facing direction and respects R7 point ordering", () => {
  const figure = sideFigure({ facing: -1, width: 200, height: 260, headForward: 8 });
  const draft = bodyDraft(figure, "side", -1);
  assert.deepEqual(draft.names, SIDE);
  const seal = draft.seal();
  assert.equal(seal.kind, "body");
  assert.equal(seal.controls.view, "side");
  assert.equal(seal.controls.facing, -1);
  assert.equal(seal.controls.manual.length, 6);
  const editor = new Editor();
  editor.load(uploadedSource(figure.image, "upload:side"), "posture");
  editor.mark(seal);
  const layer = editor.add();
  assert.equal(layer.parameters.fix, "forward_head");
  assert.equal(editor.preview().metrics[0].fix, "forward_head");
  assert.equal(editor.source.image.width, 200);
  assert.throws(() => bodyDraft(figure, "front").seal(), /outside|above|points/);
});

test("invalid body geometry is rejected by the R7 validator, not silently repaired", () => {
  const draft = new AnnotationDraft("body", 220, 240, "front");
  for (const p of [[10, 150], [160, 151], [12, 40], [160, 45], [80, 95], [80, 120]]) draft.add(p);
  assert.throws(() => draft.seal(), /shoulders.*above/i);
  draft.clear();
  assert.throws(() => draft.seal(), /more/);
  const partial = new AnnotationDraft("body", 220, 240, "side", 1);
  partial.add([100, 15]);
  assert.equal(partial.progress, 1);
  assert.equal(partial.undo()[0], 100);
  assert.equal(partial.progress, 0);
});

test("marking never rewrites the image, and old masks/layers are not reused after remarking", () => {
  const sample = makeSample("crown");
  const editor = new Editor();
  editor.load(uploadedSource(sample.image, "upload:reannotate"));
  const original = new Uint8Array(editor.source.image.data);
  const one = new AnnotationDraft("crown", sample.image.width, sample.image.height);
  one.add([40, 40]); one.add([160, 160]);
  editor.mark(one.seal()); editor.add();
  const old = editor.source.crown;
  const two = new AnnotationDraft("crown", sample.image.width, sample.image.height);
  two.add([50, 40]); two.add([182, 190]);
  editor.mark(two.seal());
  assert.equal(editor.history.length, 1);
  assert.equal(editor.document.layers.length, 0);
  assert.notStrictEqual(editor.source.crown, old);
  assert.deepEqual(editor.source.image.data, original);
  assert.throws(() => editor.mark({ kind: "crown", mask: { width: 7, height: 8, channels: 1, data: new Float64Array(56) }, areaPercent: 1 }), /dimensions/);
});

test("markup overlay is only rendered to the preview canvas when requested", () => {
  const calls = [];
  const ctx = new Proxy({ save() {}, restore() {}, setLineDash() {}, beginPath() {}, ellipse() {}, stroke() {},
    arc() {}, fill() {}, moveTo() {}, lineTo() {}, fillText() {} }, { set(target, key, value) { calls.push([key, value]); target[key] = value; return true; } });
  const canvas = { width: 224, height: 224, getContext: (type) => type === "2d" ? ctx : null };
  const draft = new AnnotationDraft("crown", 224, 224);
  draft.add([20, 30]); draft.add([180, 190]);
  drawMarks(canvas, draft);
  assert.ok(calls.some(([key]) => key === "strokeStyle"));
  assert.ok(calls.some(([key]) => key === "font"));
  assert.throws(() => drawMarks({ ...canvas, getContext: () => null }, draft), /Canvas/);
});

test("hold-for-before is a transient display toggle, not two undo edits", () => {
  const editor = new Editor();
  editor.add("enhance");
  const after = editor.preview().image;
  const history = editor.history.length;
  editor.setShowBefore(true);
  assert.equal(editor.preview().image, editor.source.image);
  editor.setShowBefore(false);
  assert.equal(editor.preview().image, after);
  assert.equal(editor.history.length, history);
  editor.undo();
  assert.equal(editor.preview().effective, 0);
});
