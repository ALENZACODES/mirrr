import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { mountProPanel } from "../../../dist/js/pro/panel.js";

const html = readFileSync(new URL("../../../recorder.html", import.meta.url), "utf8");

test("panel: incomplete DOM fails immediately and safely", () => {
  assert.throws(() => mountProPanel({ querySelector: () => null }), /Pro control preset is missing/);
});

test("panel: HTML wiring exposes all supported controls, status and standalone script", () => {
  const controls = ["file", "curve-master", "curve-red", "curve-green", "curve-blue", "crop-x",
    "crop-y", "crop-width", "crop-height", "aspect", "rotate", "preset", "label",
    "reset", "undo", "redo", "export", "preview", "status"];
  for (const id of controls) assert.ok(html.includes(`id="pro-${id}"`), id);
  assert.match(html, /js\/pro\/boot\.js/);
  assert.match(html, /data-pro-studio/);
  assert.match(html, /id="pro-label"[^>]*checked/);
  assert.match(html, /aria-live="polite"/);
});

test("panel: tool scope remains local and has no direct network or storage dependency", () => {
  const source = readFileSync(new URL("../panel.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|indexedDB/);
  assert.doesNotMatch(source, /third.party|data:image\/jpeg;base64/);
  assert.match(source, /createImageBitmap/);
  assert.match(source, /revokeObjectURL/);
});


test("panel: masks and split controls are local, explicit and separately undoable", () => {
  const ids = ["mask-kind", "mask-x", "mask-y", "mask-size", "mask-feather",
    "mask-opacity", "mask-add", "mask-clear", "split-enable", "split-position"];
  for (const id of ids) assert.ok(html.includes(`id="pro-${id}"`), id);
  const source = readFileSync(new URL("../panel.ts", import.meta.url), "utf8");
  assert.match(source, /cropMaskMapping\(/);
  assert.match(source, /setPointerCapture/);
  assert.match(source, /onPointerMove/);
  assert.match(source, /drawSplitView\(/);
  assert.match(source, /activeMasks = \[\]/);
  assert.match(source, /history\.reset\(\)/);
  assert.match(source, /onReset\(\)/);
  assert.doesNotMatch(html, /id="pro-split-enable"[^>]*checked/);
});
