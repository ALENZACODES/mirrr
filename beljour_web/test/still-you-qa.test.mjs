// The editor's Still you check against the Python arena (parity/still-you-qa.json, written by
// api/scripts/make_parity_qa.py), plus its behaviour on the studio's drawn portrait.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as Y from "../dist/js/layout/still-you.js";
import * as C from "../dist/js/layout/editor-chrome.js";
import { Editor } from "../dist/js/ui/shell/controller.js";

const vectors = JSON.parse(readFileSync(new URL("../../parity/still-you-qa.json", import.meta.url), "utf8"));
const image = (b64, w, h) => ({ width: w, height: h, channels: 3, data: new Uint8Array(Buffer.from(b64, "base64")) });
const close = (a, b, tol, what) => {
  if (a === null || b === null) { assert.equal(a, b, what); return; }
  assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b}`);
};

test("marks, retention and skin shift match the Python arena on every vector", () => {
  assert.equal(vectors.format, "beljour-parity-still-you/1");
  assert.ok(vectors.cases.length >= 2);
  for (const c of vectors.cases) {
    const before = image(c.before, c.width, c.height);
    const skin = Y.centralSkin(c.width, c.height);
    const marks = Y.findMarks(before, skin, c.iod);
    assert.equal(marks.length, c.marks.length, `${c.tone}: number of marks`);
    marks.forEach((m, i) => {
      const [x, y, r, con, area] = c.marks[i];
      close(m.x, x, 1e-6, `${c.tone} mark ${i} x`); close(m.y, y, 1e-6, `${c.tone} mark ${i} y`);
      close(m.radius, r, 1e-6, "radius"); close(m.contrast, con, 1e-6, "contrast"); assert.equal(m.area, area);
    });
    for (const a of c.afters) {
      const after = image(a.image, c.width, c.height);
      const kept = Y.retention(marks, after, c.iod);
      assert.deepEqual(kept, { found: a.found, kept: a.kept }, `${c.tone} ${a.name}`);
      const shift = Y.skinShift(before, after, skin);
      close(shift.skinDL, a.skin_dl, 1e-6, `${c.tone} ${a.name} skin dL`);
      close(shift.backgroundDL, a.background_dl, 1e-6, `${c.tone} ${a.name} background dL`);
      assert.equal(shift.lightened, a.lightened, `${c.tone} ${a.name} lightened`);
    }
  }
});

test("the summary says kept, or names what changed", () => {
  const c = vectors.cases[0];
  const before = image(c.before, c.width, c.height);
  const byName = Object.fromEntries(c.afters.map((a) => [a.name, image(a.image, c.width, c.height)]));
  assert.equal(Y.stillYou(before, before, { edited: false }).state, "not checked");
  const same = Y.stillYou(before, byName.untouched, { edited: true });
  assert.equal(same.state, "kept");
  assert.match(same.text, /^Photo checks:/);
  assert.doesNotMatch(same.text, /Still you|identity verified|same person/i);
  assert.match(same.text, /rough face area/);
  const smooth = Y.stillYou(before, byName.smoothed, { edited: true });
  assert.equal(smooth.state, "changed");
  const light = Y.stillYou(before, byName.lightened, { edited: true });
  assert.equal(light.state, "changed");
  assert.match(light.text, /skin lightened/);
  assert.throws(() => Y.stillYou(before, { width: 2, height: 2, channels: 3, data: new Uint8Array(12) }, { edited: true }), RangeError);
});

test("the photo-check badge has a tappable definition and makes no identity claim", () => {
  const html = readFileSync(new URL("../studio.html", import.meta.url), "utf8");
  assert.match(html, /<details class="lg-check-definition"><summary id="lg-still-tag"/);
  assert.match(html, /This does not verify identity/);
  assert.match(html, /rough central area/);
  assert.doesNotMatch(html, />Still you:/);
});

test("helpers: Python-style rounding, IOD from face points, components in scan order", () => {
  assert.equal(Y.roundHalfEven(2.5), 2);
  assert.equal(Y.roundHalfEven(3.5), 4);
  assert.equal(Y.roundHalfEven(2.51), 3);
  const face = Array.from({ length: 478 }, () => [0, 0]);
  face[468] = [40, 50]; face[473] = [70, 50];
  assert.equal(Y.iodOf(200, face), 30);
  assert.equal(Y.iodOf(300), 99);
  const on = new Uint8Array([1, 1, 0, 0, 0, 1, 1, 0, 1]);
  assert.deepEqual(Y.components(on, 3, 3).map((m) => [...m].sort((a, b) => a - b)), [[0, 1], [5, 8], [6]]);
});

test("in the studio, the check uses recorded face points and reacts to edits", () => {
  const editor = new Editor("portrait");
  assert.ok(editor.source.face && editor.source.face.length === 478);
  assert.equal(C.stillYouFor(editor).state, "not checked");
  editor.selectStudio("enhance");
  editor.add("enhance", { mode: "natural" }, 30);
  const gentle = C.stillYouFor(editor);
  assert.notEqual(gentle.state, "not checked");
  assert.ok(gentle.usedFacePoints);
  assert.doesNotMatch(gentle.text, /rough face area/);
  assert.equal(gentle.lightened, false, "the gentle default never lightens skin");
});
