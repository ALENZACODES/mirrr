// Offline smoke contract: drawn sample → apply → undo, no network required.
// This is a Node-driven substitute for a Playwright smoke when Playwright is
// not installed as an npm dependency. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Editor } from "../dist/js/ui/shell/controller.js";
import { pixelsChanged } from "../dist/js/ui/shell/pipeline.js";

function bytes(image) { return Buffer.from(image.data).toString("base64"); }

test("R8 smoke: offline sample → add enhancement → undo → redo → turn off", () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => { calls++; throw new Error("No network is allowed in the shell smoke"); };
  try {
    const editor = new Editor("low-light");
    assert.equal(editor.source.kind, "sample");
    assert.equal(editor.document.layers.length, 0);
    const before = bytes(editor.source.image);
    const layer = editor.add("enhance");
    assert.equal(editor.document.layers.length, 1);
    const after = bytes(editor.preview().image);
    assert.notEqual(after, before);
    assert.ok(pixelsChanged(editor.source.image, editor.preview().image).pixels > 0);
    editor.undo();
    assert.equal(editor.document.layers.length, 0);
    assert.equal(bytes(editor.preview().image), before);
    editor.redo();
    assert.equal(bytes(editor.preview().image), after);
    editor.toggle(layer.id);
    assert.equal(bytes(editor.preview().image), before);
    editor.undo();
    assert.equal(bytes(editor.preview().image), after);
    assert.equal(bytes(editor.source.image), before, "the source pixels never change");
    assert.equal(calls, 0, "neither an API task nor a model file was requested");
  } finally { globalThis.fetch = originalFetch; }
});

test("offline nav switching retains edits but new demo sample clears incompatible layers", () => {
  const editor = new Editor();
  editor.add("enhance");
  editor.selectStudio("hair-fibre");
  assert.equal(editor.canApply, false);
  assert.equal(editor.document.layers.length, 1);
  editor.loadRecommendedSample();
  assert.equal(editor.source.id, "sample:crown");
  assert.equal(editor.history.length, 1);
  assert.equal(editor.document.layers.length, 0);
  assert.equal(editor.canApply, true);
  editor.add();
  assert.ok(editor.preview().effective > 0);
});
