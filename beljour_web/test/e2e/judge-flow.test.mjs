/** R22G synthetic judge path through shipped local editor and compare entry points.
 * No browser photograph, online call, provider credentials or proprietary assets.
 * Node runs the exact compiled renderer; actual device/decoder is a separate gate.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { Editor } from "../../dist/js/ui/shell/controller.js";
import { makeSample, uploadedSource } from "../../dist/js/ui/shell/demo.js";
import { CompareSession } from "../../dist/js/ui/shell/compare-session.js";
import { renderCompare } from "../../dist/js/ui/shell/compare-render.js";
import { COMPARE_MODES } from "../../dist/js/ui/shell/compare.js";
import { stageBox, layoutProblems } from "../../dist/js/ui/shell/compare-layout.js";
import { downloadCanvas } from "../../dist/js/ui/shell/canvas.js";

function hash(image) {
  return Buffer.from(image.data).toString("base64");
}

function guardNetwork(fn) {
  const before = globalThis.fetch;
  const original = globalThis.XMLHttpRequest;
  let outbound = 0;
  globalThis.fetch = () => { outbound++; throw new Error("judge E2E cannot use network"); };
  globalThis.XMLHttpRequest = class {
    constructor() { outbound++; throw new Error("judge E2E cannot use XHR"); }
  };
  try { return fn(); }
  finally {
    globalThis.fetch = before;
    globalThis.XMLHttpRequest = original;
    assert.equal(outbound, 0, "no network call in the local judge path");
  }
}

function editorOn(sample) {
  const editor = new Editor(sample);
  assert.equal(editor.summary().sample, true);
  assert.equal(editor.summary().localOnly, true);
  assert.equal(editor.document.layers.length, 0);
  return editor;
}

function renderAt(editor, mode, width, height) {
  const options = stageBox(width, height);
  const comparison = new CompareSession({ mode, position: 0.47 });
  const frames = editor.frames(mode);
  const view = renderCompare(comparison.state, frames, { box: options.box, phone: options.phone });
  assert.deepEqual(layoutProblems(view.layout, options.box), []);
  assert.equal(view.image.width, view.layout.width);
  assert.equal(view.image.height, view.layout.height);
  assert.ok(view.description.length > 15);
  return { view, frames, comparison };
}

test("upload-adoption analogue preserves geometric source and does not enable cloud styling", () => guardNetwork(() => {
  const base = makeSample("crown");
  const original = hash(base.image);
  const editor = editorOn("low-light");
  const source = uploadedSource(base.image, "upload:geometric-case-1");
  assert.equal(source.kind, "uploaded");
  assert.equal(source.id, "upload:geometric-case-1");
  editor.load(source, "enhance");
  assert.equal(editor.source.id, source.id);
  assert.equal(hash(editor.source.image), original);
  assert.equal(editor.summary().sample, false);
  assert.equal(editor.summary().count, 0);
  editor.add("enhance");
  assert.equal(hash(editor.source.image), original, "preview must not overwrite upload");
  assert.equal(editor.summary().localOnly, true);
  editor.dispose();
}));

test("portrait: age and appearance stops modify the edited image, never the drawn input", () => guardNetwork(() => {
  const editor = editorOn("portrait");
  const source = hash(editor.source.image);
  for (const kind of ["older", "younger", "gender"]) {
    assert.ok(editor.source.face?.length === 478);
    const layer = editor.add(kind, {}, 55);
    assert.equal(layer.kind, kind);
    assert.equal(layer.provenance, "local");
    assert.equal(layer.simulation, true);
    const view = editor.preview();
    assert.ok(view.effective > 0);
    assert.equal(view.image.data.length, editor.source.image.data.length);
    assert.notEqual(hash(view.image), source, `${kind} must visibly change the preview`);
    assert.equal(hash(editor.source.image), source, `${kind} must preserve source pixels`);
    editor.remove(layer.id);
  }
  assert.equal(editor.document.layers.length, 0);
  assert.equal(hash(editor.preview().image), source);
  editor.dispose();
}));

test("strength zero is the original, increasing gender strength changes the preview", () => guardNetwork(() => {
  const editor = editorOn("portrait");
  const source = hash(editor.source.image);
  const layer = editor.add("gender", {}, 0);
  assert.equal(hash(editor.preview().image), source);
  const hashes = [source];
  for (const strength of [25, 50, 75, 100]) {
    editor.update(layer.id, { strength });
    hashes.push(hash(editor.preview().image));
    assert.equal(editor.selected.strength, strength);
    assert.equal(hash(editor.source.image), source);
  }
  assert.ok(new Set(hashes).size >= 3);
  editor.dispose();
}));

test("hair studio: drawn crown recolour is local, masked and reversible", () => guardNetwork(() => {
  const editor = editorOn("crown");
  const before = hash(editor.source.image);
  assert.ok(editor.source.hair);
  editor.selectStudio("recolour");
  const layer = editor.add("recolour");
  assert.equal(layer.provenance, "local");
  assert.equal(layer.simulation, true);
  const after = editor.preview();
  assert.equal(after.image.width, editor.source.image.width);
  assert.equal(hash(editor.source.image), before);
  assert.notEqual(hash(after.image), before, "colour adjustment needs a visible result");
  editor.setShowBefore(true);
  assert.equal(hash(editor.preview().image), before);
  editor.setShowBefore(false);
  assert.equal(hash(editor.preview().image), hash(after.image));
  editor.undo();
  assert.equal(editor.document.layers.length, 0);
  assert.equal(hash(editor.preview().image), before);
  editor.redo();
  assert.equal(editor.document.layers.length, 1);
  assert.equal(hash(editor.preview().image), hash(after.image));
  editor.dispose();
}));

test("posture scenario: front-body drawing, local strength and saved comparison", () => guardNetwork(() => {
  const editor = editorOn("body-front");
  const before = hash(editor.source.image);
  assert.ok(editor.source.body, "drawn body fixture has its own control points");
  assert.ok(editor.source.person, "drawn body fixture has a person mask");
  const layer = editor.add("posture", {}, 40);
  assert.equal(layer.provenance, "local");
  assert.equal(layer.simulation, true);
  assert.notEqual(hash(editor.preview().image), before);
  const first = renderAt(editor, "split-vertical", 390, 844);
  assert.equal(first.frames[0].simulation, false);
  assert.equal(first.frames[1].simulation, true);
  assert.equal(first.view.simulation, true);
  assert.match(first.view.description, /Split view/);
  const frameHash = hash(first.view.image);
  assert.equal(frameHash, hash(renderAt(editor, "split-vertical", 390, 844).view.image));
  editor.update(layer.id, { strength: 0 });
  assert.equal(hash(editor.preview().image), before);
  assert.equal(editor.summary().localOnly, true);
  editor.dispose();
}));

test("compare holds do not mutate the document, source, or undo cursor", () => guardNetwork(() => {
  const editor = editorOn("low-light");
  const layer = editor.add("enhance");
  const source = hash(editor.source.image);
  const current = hash(editor.preview().image);
  const cursor = editor.history.step;
  const compare = new CompareSession();
  compare.hold(true);
  editor.setShowBefore(true);
  assert.equal(hash(editor.preview().image), source);
  assert.equal(compare.showing(), "before");
  compare.hold(false);
  editor.setShowBefore(false);
  assert.equal(hash(editor.preview().image), current);
  assert.equal(compare.showing(), "after");
  compare.setMode("split-vertical");
  compare.key({ key: "Home" });
  assert.equal(compare.state.position, 0);
  compare.key({ key: "End" });
  assert.equal(compare.state.position, 1);
  assert.equal(editor.history.step, cursor);
  assert.equal(editor.selected.id, layer.id);
  assert.equal(hash(editor.source.image), source);
  editor.dispose();
}));

for (const viewport of [[390, 844], [1280, 800]]) {
  test(`compare-export composition supports all ten modes at ${viewport[0]}px`, () => guardNetwork(() => {
    const editor = editorOn("crown");
    editor.add("hair-fibre", {}, 40);
    const original = hash(editor.source.image);
    for (const mode of COMPARE_MODES) {
      const { view } = renderAt(editor, mode, ...viewport);
      assert.ok(view.image.data.length > 0, `${mode} must yield exportable pixels`);
      assert.ok(view.image.data.every(Number.isFinite));
      assert.ok(view.layout.width >= 1 && view.layout.height >= 1);
      if (mode === "stop-grid") assert.ok(view.captions.length >= 3);
    }
    assert.equal(hash(editor.source.image), original);
    editor.dispose();
  }));
}

test("different photo invalidates all old compare and history frames", () => guardNetwork(() => {
  const editor = editorOn("crown");
  editor.add("hair-fibre");
  const old = editor.frames("split-horizontal");
  assert.equal(old[1].effective, 1);
  editor.loadSample("body-front", "posture");
  assert.equal(editor.summary().count, 0);
  assert.equal(editor.history.length, 1);
  assert.equal(editor.history.canUndo, false);
  const fresh = editor.frames("split-horizontal");
  assert.equal(fresh[1].effective, 0);
  assert.equal(hash(fresh[0].image), hash(editor.source.image));
  assert.notEqual(hash(fresh[0].image), hash(old[0].image));
  assert.equal(editor.summary().localOnly, true);
  editor.dispose();
}));

test("download uses a local PNG Blob and revokes its object URL after clicking", async () => {
  const originalURL = globalThis.URL;
  const originalDoc = globalThis.document;
  const originalFetch = globalThis.fetch;
  const actions = [];
  const png = new Blob([Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10)], { type: "image/png" });
  globalThis.fetch = () => { throw Error("export attempted network"); };
  globalThis.URL = {
    createObjectURL(blob) { assert.equal(blob, png); actions.push("object"); return "blob:synthetic"; },
    revokeObjectURL(url) { assert.equal(url, "blob:synthetic"); actions.push("revoke"); },
  };
  globalThis.document = {
    body: { append(anchor) { actions.push("append"); assert.equal(anchor.download, "judge-sample.png"); } },
    createElement(tag) {
      assert.equal(tag, "a");
      return { click() { actions.push("click"); }, remove() { actions.push("remove"); } };
    },
  };
  try {
    const canvas = { toBlob(done, type) { assert.equal(type, "image/png"); done(png); } };
    await downloadCanvas(canvas, "judge-sample.png");
    assert.deepEqual(actions, ["object", "append", "click", "remove", "revoke"]);
  } finally {
    globalThis.URL = originalURL;
    globalThis.document = originalDoc;
    globalThis.fetch = originalFetch;
  }
});

test("failed PNG encoding never creates a link or claims a completed export", async () => {
  const canvas = { toBlob(done, type) { assert.equal(type, "image/png"); done(null); } };
  await assert.rejects(downloadCanvas(canvas), /Couldn't export/);
});
