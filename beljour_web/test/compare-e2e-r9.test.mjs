// R9 compare end to end, offline: drawn sample → real R7 layer → every compare mode → a composed
// board laid out for a 390 px phone and a 1280 px desktop. Node stands in for the browser here
// (Playwright isn't a repo dependency); fetch throws if anything tries the network. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Editor } from "../dist/js/ui/shell/controller.js";
import * as C from "../dist/js/ui/shell/compare.js";
import * as L from "../dist/js/ui/shell/compare-layout.js";
import * as F from "../dist/js/ui/shell/compare-frames.js";
import { CompareSession } from "../dist/js/ui/shell/compare-session.js";
import { renderCompare } from "../dist/js/ui/shell/compare-render.js";
import { scaleSource } from "../dist/js/ui/shell/scale.js";

const hash = (img) => Buffer.from(img.data).toString("base64");

function offline(fn) {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => { calls++; throw new Error("network is not allowed in the compare e2e"); };
  try { fn(); } finally { globalThis.fetch = original; }
  assert.equal(calls, 0, "no request was made");
}

test("pair frames reuse the editor preview and keep the source untouched", () => offline(() => {
  const editor = new Editor("low-light");
  const source = hash(editor.source.image);
  editor.add("enhance");
  const frames = editor.frames("split-vertical");
  assert.equal(frames.length, 2);
  assert.equal(hash(frames[0].image), source);
  assert.equal(hash(frames[1].image), hash(editor.preview().image));
  assert.equal(frames[1].simulation, false, "enhance is a correction, not a simulation");
  assert.equal(hash(editor.source.image), source);
  assert.equal(editor.history.length, 2, "comparing never adds a history step");
}));

test("2×2 frames: original, all edits, target alone, all edits without it", () => offline(() => {
  const editor = new Editor("portrait");
  const beard = editor.add("beard");
  editor.add("enhance");
  editor.choose(beard.id);
  const frames = editor.frames("grid-2x2");
  assert.deepEqual(frames.map((f) => f.id), ["original", "edited", "alone", "without"]);
  assert.deepEqual(frames.map((f) => f.caption), ["Original", "All edits", "Beard alone", "All edits without Beard"]);
  assert.ok(frames.every((f) => Math.max(f.image.width, f.image.height) <= F.QUAD_SIDE));
  assert.equal(frames[0].effective, 0); assert.equal(frames[1].effective, 2);
  assert.equal(frames[2].effective, 1); assert.equal(frames[3].effective, 1);
  assert.equal(frames[2].simulation, true); assert.equal(frames[3].simulation, false);
  assert.notEqual(hash(frames[2].image), hash(frames[3].image));
}));

test("the stop grid renders the target at nine strengths with the rest of the stack unchanged", () => offline(() => {
  const editor = new Editor("crown");
  const fibre = editor.add("hair-fibre");
  const frames = editor.frames("stop-grid");
  assert.equal(frames.length, 9);
  assert.equal(frames[0].caption, "Hair fibres · Off");
  assert.equal(frames[4].caption, "Hair fibres · Natural");
  assert.equal(frames[1].caption, "Hair fibres · 12.5%");
  assert.equal(frames[0].effective, 0, "strength 0 is the original");
  const small = scaleSource(editor.source, F.STOP_SIDE);
  assert.equal(hash(frames[0].image), hash(small.image));
  assert.ok(frames.slice(1).every((f) => f.effective === 1));
  assert.equal(new Set(frames.map((f) => hash(f.image))).size, 9, "each strength looks different");
  assert.equal(editor.document.layers.find((l) => l.id === fibre.id).strength, 30, "the real layer keeps its (gentle default) strength");
}));

test("the stop grid explains itself when there is no local layer", () => {
  const editor = new Editor("low-light");
  assert.throws(() => editor.frames("stop-grid"), /Add or select a local layer/);
  const quad = editor.frames("grid-2x2");
  assert.match(quad[2].caption, /Add a local layer/);
});

test("frames are cached: asking twice renders once, and a new photo clears the cache", () => offline(() => {
  const editor = new Editor("portrait");
  editor.add("beard");
  const t0 = performance.now(); const first = editor.frames("stop-grid"); const cold = performance.now() - t0;
  const t1 = performance.now(); const second = editor.frames("stop-grid"); const warm = performance.now() - t1;
  assert.deepEqual(second.map((f) => hash(f.image)), first.map((f) => hash(f.image)));
  assert.ok(warm < cold, `warm ${warm.toFixed(1)} ms should beat cold ${cold.toFixed(1)} ms`);
  assert.strictEqual(second[3], first[3], "the very same frame object comes back");
  editor.loadSample("crown");
  assert.throws(() => editor.frames("stop-grid"), /local layer/);
}));

for (const [vw, vh] of [[390, 844], [1280, 800]]) {
  test(`all ten modes render and lay out on a ${vw} px screen`, () => offline(() => {
    const { box, phone } = L.stageBox(vw, vh);
    const cases = [["low-light", "enhance"], ["portrait", "beard"], ["body-front", "posture"], ["crown", "hair-fibre"]];
    for (const [sample, kind] of cases) {
      const editor = new Editor(sample);
      editor.add(kind);
      for (const mode of C.COMPARE_MODES) {
        const session = new CompareSession({ mode, position: 0.4, loupe: { x: 0.5, y: 0.45, zoom: 3 } });
        const frames = editor.frames(mode);
        const view = renderCompare(session.state, frames, { box, phone });
        assert.deepEqual(L.layoutProblems(view.layout, box), [], `${sample}/${mode}`);
        assert.equal(view.image.width, view.layout.width, `${sample}/${mode} width`);
        assert.equal(view.image.height, view.layout.height, `${sample}/${mode} height`);
        assert.ok(view.image.width * view.layout.displayScale <= box.width + 0.5, `${sample}/${mode} fits`);
        assert.ok(view.description.length > 10);
        assert.equal(view.captions.length, view.layout.panes.filter((p) => p.caption.some(Boolean)).length);
        if (C.MODE_INFO[mode].inputs === "pair" && mode !== "side-by-side" && mode !== "loupe") {
          assert.equal(view.image.width, editor.source.image.width, "single-pane modes keep the photo's own pixels");
        }
      }
    }
  }));
}

test("hold and flicker show exactly the original or the edit, never a blend", () => offline(() => {
  const editor = new Editor("portrait");
  editor.add("beard");
  const frames = editor.frames("hold");
  const box = { width: 600, height: 500 };
  const held = renderCompare({ ...new CompareSession({ mode: "hold", held: true }).state }, frames, { box, phone: false });
  assert.equal(hash(held.image), hash(frames[0].image));
  const free = renderCompare(new CompareSession({ mode: "hold" }).state, frames, { box, phone: false });
  assert.equal(hash(free.image), hash(frames[1].image));
  const flick = new CompareSession({ mode: "flicker", playing: true }).state;
  assert.equal(hash(renderCompare(flick, frames, { box, phone: false, elapsedMs: 0 }).image), hash(frames[0].image));
  assert.equal(hash(renderCompare(flick, frames, { box, phone: false, elapsedMs: 900 }).image), hash(frames[1].image));
  assert.equal(held.simulation, false, "the original alone needs no simulation label");
  assert.equal(free.simulation, true, "the beard edit is labelled as a simulation");
}));

test("the difference view reports what changed for the status line", () => offline(() => {
  const editor = new Editor("portrait");
  editor.add("beard");
  const view = renderCompare(new CompareSession({ mode: "difference" }).state, editor.frames("difference"),
    { box: { width: 600, height: 500 }, phone: false });
  assert.ok(view.stats.changed > 0);
  assert.ok(view.stats.percent > 0 && view.stats.percent < 100);
  assert.match(view.status, /% of pixels changed/);
}));
