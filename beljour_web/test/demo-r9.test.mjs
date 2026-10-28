// R9 demo loader: strict scene schema, one offline scene per compare mode, the tour and deep links.
// Every scene runs with fetch throwing and renders its compare view at 390 px. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DEMO_SCHEMA, SceneError, validateScene } from "../dist/js/demo/schema.js";
import { DEMO_SCENES, scene } from "../dist/js/demo/scenes.js";
import { DemoTour, demoHash, loadScene, parseDemoHash } from "../dist/js/demo/loader.js";
import { Editor } from "../dist/js/ui/shell/controller.js";
import { CompareSession } from "../dist/js/ui/shell/compare-session.js";
import { COMPARE_MODES } from "../dist/js/ui/shell/compare.js";
import { renderCompare } from "../dist/js/ui/shell/compare-render.js";
import { layoutProblems, stageBox } from "../dist/js/ui/shell/compare-layout.js";

const hash = (img) => Buffer.from(img.data).toString("base64");
const good = () => ({ schema: DEMO_SCHEMA, id: "test-scene", title: "Test", line: "A plain line.", sample: "portrait",
  layers: [{ kind: "beard", params: { style: "stubble" }, strength: 50, opacity: 1 }], compare: { mode: "loupe" } });

test("the tour has one valid scene for each of the ten compare modes", () => {
  assert.equal(DEMO_SCENES.length, 10);
  assert.deepEqual(new Set(DEMO_SCENES.map((s) => s.compare.mode)), new Set(COMPARE_MODES));
  assert.equal(new Set(DEMO_SCENES.map((s) => s.id)).size, 10);
  assert.ok(Object.isFrozen(DEMO_SCENES));
  for (const s of DEMO_SCENES) {
    assert.equal(s.schema, DEMO_SCHEMA);
    assert.doesNotMatch(`${s.title} ${s.line}`, /clinic|surgery|patient|French|Paris|perfect|guarantee/i, s.id);
    if (s.layers.some((l) => l.kind === "posture")) assert.match(s.line, /not medical advice/, s.id);
    if (s.layers.some((l) => l.kind === "hair-fibre") && s.compare.mode === "stop-grid") assert.match(s.line, /not a diagnosis/);
  }
  assert.equal(scene("beard-loupe").compare.loupe.zoom, 4);
  assert.throws(() => scene("nope"), /no demo scene/);
});

test("scene validation refuses provider layers, unknown options and the wrong sample", () => {
  assert.equal(validateScene(good()).layers[0].kind, "beard");
  const bad = [
    [{ ...good(), schema: "other/1" }, /schema/],
    [{ ...good(), id: "Bad Id" }, /lowercase/],
    [{ ...good(), extra: 1 }, /unknown field/],
    [{ ...good(), sample: "selfie" }, /drawn samples/],
    [{ ...good(), layers: [] }, /1–6 layers/],
    [{ ...good(), layers: [{ kind: "styling", params: {} }] }, /never use the provider/],
    [{ ...good(), layers: [{ kind: "filters", params: {} }] }, /never use the provider/],
    [{ ...good(), layers: [{ kind: "beard", params: { style: "full_viking" } }] }, /valid beard option/],
    [{ ...good(), layers: [{ kind: "beard", params: { glow: 1 } }] }, /no option "glow"/],
    [{ ...good(), layers: [{ kind: "beard", params: { length: 9 } }] }, /valid beard option/],
    [{ ...good(), layers: [{ kind: "hair-fibre", params: {} }] }, /doesn't run on the portrait/],
    [{ ...good(), sample: "body-front", layers: [{ kind: "posture", params: { fix: "slouch" } }] }, /valid posture option/],
    [{ ...good(), layers: [{ kind: "beard", params: {}, strength: 140 }] }, /strength/],
    [{ ...good(), layers: [{ kind: "beard", params: {}, extra: true }] }, /unknown field/],
    [{ ...good(), select: 3 }, /out of range/],
    [{ ...good(), compare: { mode: "swipe" } }, /Compare: Unknown/],
    [{ ...good(), line: "x".repeat(200) }, /1–160/],
    [null, /object/],
  ];
  for (const [raw, pattern] of bad) assert.throws(() => validateScene(raw), (e) => e instanceof SceneError && pattern.test(e.message), JSON.stringify(raw)?.slice(0, 60));
});

test("every scene loads into the real editor offline and renders its compare view on a phone", () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => { calls++; throw new Error("no network in the demo"); };
  try {
    const { box, phone } = stageBox(390, 844);
    for (const item of DEMO_SCENES) {
      const editor = new Editor(), compare = new CompareSession();
      const result = loadScene(editor, compare, item);
      assert.equal(result.layers, item.layers.length);
      assert.equal(editor.source.id, `sample:${item.sample}`);
      assert.equal(editor.document.layers.length, item.layers.length);
      assert.equal(compare.mode, item.compare.mode);
      assert.equal(editor.document.selected, editor.document.layers[item.select ?? item.layers.length - 1].id);
      editor.document.layers.forEach((l, i) => {
        assert.equal(l.kind, item.layers[i].kind);
        assert.equal(l.strength, item.layers[i].strength);
        for (const [k, v] of Object.entries(item.layers[i].params)) assert.equal(l.parameters[k], v);
      });
      const view = renderCompare(compare.state, editor.frames(compare.mode), { box, phone });
      assert.deepEqual(layoutProblems(view.layout, box), [], item.id);
      assert.ok(editor.preview().effective >= 1, `${item.id} shows a real edit`);
    }
  } finally { globalThis.fetch = original; }
  assert.equal(calls, 0);
});

test("loading a scene is deterministic and every demo step can be undone", () => {
  const a = new Editor(), b = new Editor();
  loadScene(a, new CompareSession(), scene("stack-grid"));
  loadScene(b, new CompareSession(), scene("stack-grid"));
  assert.equal(hash(a.preview().image), hash(b.preview().image));
  while (a.history.canUndo) a.undo();
  assert.equal(a.document.layers.length, 0);
  assert.equal(hash(a.preview().image), hash(a.source.image));
});

test("scene settings reach the compare session: loupe zoom, flicker speed and gain", () => {
  const editor = new Editor(), compare = new CompareSession();
  loadScene(editor, compare, scene("beard-loupe"));
  assert.deepEqual(compare.state.loupe, { x: 0.5, y: 0.78, zoom: 4 });
  loadScene(editor, compare, scene("beard-flicker"));
  assert.equal(compare.state.flickerMs, 800); assert.equal(compare.state.playing, true);
  const still = new CompareSession({}, true);
  loadScene(editor, still, scene("beard-flicker"));
  assert.equal(still.state.playing, false, "reduced motion wins over the scene");
  loadScene(editor, compare, scene("lean-difference"));
  assert.equal(compare.state.differenceGain, 4);
});

test("the tour steps forward and back, wraps, and opens a scene by id", () => {
  const editor = new Editor(), compare = new CompareSession();
  const tour = new DemoTour(editor, compare);
  assert.equal(tour.current, null); assert.match(tour.label(), /not started/);
  assert.equal(tour.next().id, DEMO_SCENES[0].id);
  assert.equal(tour.label(), `Scene 1 of 10: ${DEMO_SCENES[0].title}`);
  assert.equal(tour.previous().id, DEMO_SCENES[9].id, "wraps backwards");
  assert.equal(tour.next().id, DEMO_SCENES[0].id, "wraps forwards");
  assert.equal(tour.open("lean-difference").id, "lean-difference");
  assert.equal(tour.position, DEMO_SCENES.findIndex((s) => s.id === "lean-difference"));
  assert.throws(() => tour.open("missing"), /no demo scene/);
  assert.throws(() => tour.go(1.5), /whole/);
  assert.throws(() => new DemoTour(editor, compare, []), /at least one/);
  assert.equal(new DemoTour(editor, compare).previous().id, DEMO_SCENES[9].id);
});

test("deep links name a real scene or nothing", () => {
  assert.equal(parseDemoHash("#demo=beard-loupe"), "beard-loupe");
  assert.equal(parseDemoHash("demo=fibre-stops"), "fibre-stops");
  assert.equal(parseDemoHash("#x=1&demo=vivid-hold&y=2"), "vivid-hold");
  assert.equal(parseDemoHash("#demo=unknown-scene"), null);
  assert.equal(parseDemoHash("#demo=<script>"), null);
  assert.equal(parseDemoHash(""), null);
  assert.equal(demoHash("stack-grid"), "#demo=stack-grid");
  assert.throws(() => demoHash("nope"), /no demo scene/);
});
