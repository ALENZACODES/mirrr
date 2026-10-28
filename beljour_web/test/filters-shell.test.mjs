// FX1 filters inside the layout v1 shell: the filter layer kind on the R8 stack, the ranked strip
// (R9 thumbnails, cached), the inspector controls, evidence, compare frames and the A6 timing
// report on the drawn portrait. No fork of the shell: the same stack, history and worker.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Editor } from "../dist/js/ui/shell/controller.js";
import * as Th from "../dist/js/ui/shell/thumbnails.js";
import { renderLayers } from "../dist/js/ui/shell/pipeline.js";
import { layer } from "../dist/js/ui/shell/layers.js";
import { documentEvidence } from "../dist/js/ui/shell/evidence.js";
import { compareFrames } from "../dist/js/ui/shell/compare-frames.js";
import { makeSample } from "../dist/js/ui/shell/demo.js";
import { effect } from "../dist/js/layout/effects.js";
import { filterControls, TOGGLE_LABELS } from "../dist/js/filters/runtime/controls.js";
import { THUMBS, applyFilterLayer, defaultFilterParams, filterOptions, renderFilterTile, settingsFor } from "../dist/js/filters/runtime/layer.js";
import { catalogue } from "../dist/js/filters/recipe/registry.js";
import { scaleSource } from "../dist/js/ui/shell/scale.js";

const portrait = makeSample("portrait");

test("a filter layer is a local, on-device look on the same stack, undoable", () => {
  const editor = new Editor("portrait");
  editor.selectStudio("filters");
  assert.equal(editor.canApply, true);
  const look = editor.add();
  assert.deepEqual(look.parameters, defaultFilterParams("C08"));
  assert.equal(look.strength, 30);
  assert.equal(look.simulation, false);
  const preview = editor.preview();
  assert.equal(preview.effective, 1);
  assert.match(preview.labels[0], /Look · Èze/);
  assert.notDeepEqual(Array.from(preview.image.data.slice(0, 600)), Array.from(portrait.image.data.slice(0, 600)));
  const picked = editor.applyOption("filters", defaultFilterParams("C30"), "Périgord");
  assert.equal(picked.id, look.id, "a strip pick changes the selected filter layer");
  assert.equal(picked.parameters.recipe, "C30");
  editor.undo();
  assert.equal(editor.selected.parameters.recipe, "C08");
  editor.param(look.id, "guard", false);
  assert.equal(editor.selected.parameters.guard, false);
  editor.update(look.id, { strength: 0 });
  assert.equal(editor.preview().effective, 0);
});

test("settings read from the layer, with recipe defaults when a toggle is unset", () => {
  const s = settingsFor({ parameters: { recipe: "C39", guard: true, protect: true, background: false, addon_fade: 140, preset: "" }, strength: 55 });
  assert.deepEqual(s, { strength: 55, identityLock: true, guard: true, protectSkin: true,
    backgroundOnly: false, preset: null, addons: { fade: 100 } });
  const bare = settingsFor({ parameters: { recipe: "C39" }, strength: 30 });
  assert.equal(bare.protectSkin, undefined);
  assert.throws(() => applyFilterLayer(portrait.image, portrait, layer("x", "filters", "Filters", "sample", { recipe: "nope" })), /Pick a look/);
});

test("the strip ranks every look and renders one page at a time, cached", () => {
  THUMBS.clear();
  const options = Th.optionsFor("filters", portrait);
  assert.equal(options.length, catalogue().recipes.length);
  assert.deepEqual(options.slice(0, 3).map((o) => o.params.recipe), ["C01", "C02", "C03"]);
  assert.ok(options.every((o) => o.strength === 30 && o.kind === "filters"));
  const page = Th.renderStripPage("filters", portrait, { page: 0 });
  assert.equal(page.tiles.length, Th.STRIP_PAGE);
  assert.equal(page.pages, Math.ceil(options.length / Th.STRIP_PAGE));
  assert.ok(page.more);
  assert.ok(page.tiles.every((t) => t.status === "ready" && t.image && t.image.width <= Th.THUMB_SIDE && !t.simulation));
  const hits = THUMBS.stats.hits;
  Th.renderStripPage("filters", portrait, { page: 0 });
  assert.equal(THUMBS.stats.hits, hits + Th.STRIP_PAGE, "the second visit comes from the cache");
  const last = Th.renderStripPage("filters", portrait, { page: page.pages - 1 });
  assert.equal(last.more, false);
});

test("a photo with no outline still gets every look except Background only ones, which say why", () => {
  const plain = makeSample("low-light");
  const tiles = Th.renderStrip("filters", plain);
  const blocked = tiles.filter((t) => t.status === "blocked");
  assert.deepEqual(blocked.map((t) => t.option.params.recipe), ["C28"]);
  assert.match(blocked[0].reason, /person outline/);
  assert.ok(tiles.filter((t) => t.status === "ready").length === catalogue().recipes.length - 1);
});

test("a strip tile equals the layer render on the same small copy", () => {
  const small = scaleSource(portrait, Th.THUMB_SIDE);
  const option = filterOptions().find((o) => o.recipe === "C40");
  const tile = renderFilterTile(small, option);
  const direct = renderLayers(small, [{ ...layer("t", "filters", "Filters", "sample", option.params), strength: option.strength }]);
  assert.deepEqual(Array.from(tile.data), Array.from(direct.image.data));
});

test("the inspector controls: ranked look list, variants, toggles with defaults, honest hint", () => {
  const c = filterControls({ parameters: defaultFilterParams("C40") });
  assert.equal(c.recipe, "C40");
  assert.equal(c.looks.length, catalogue().recipes.length);
  assert.match(c.looks[0].label, /Deauville · Contrast/);
  assert.deepEqual(c.presets.map((p) => p.value), ["", "Framed"]);
  assert.deepEqual(c.toggles.map((t) => [t.key, t.value]), [["guard", true], ["protect", false], ["background", false]]);
  assert.match(c.hint, /skin guard holds/);
  const pending = filterControls({ parameters: defaultFilterParams("C93") });
  assert.match(pending.hint, /Pending visual review: Grain/);
  const off = filterControls({ parameters: { ...defaultFilterParams("C08"), guard: false } });
  assert.match(off.hint, /Skin guard off/);
  assert.equal(TOGGLE_LABELS.guard.includes("skin tone"), true);
  assert.deepEqual(c.paramsFor("C28").background, true);
  assert.equal(c.labelFor("C28"), "Fontainebleau");
  for (const r of catalogue().recipes) assert.doesNotMatch(filterControls({ parameters: defaultFilterParams(r.id) }).hint, /flaw|fix your/i);
});

test("evidence calls a filter layer a local look; compare frames study it at nine strengths", () => {
  const item = { ...layer("look", "filters", "Filters", "sample", defaultFilterParams("C01")) };
  const info = documentEvidence(portrait, [item]);
  assert.equal(info.localCount, 1);
  assert.equal(info.simulationCount, 0);
  assert.equal(info.layers[0].display, "Local look");
  assert.equal(info.flow, "stays on this device");
  const frames = compareFrames(portrait, [item], "look", "stop-grid");
  assert.equal(frames.length, 9);
  assert.ok(frames.every((f) => f.image.width > 0));
});

test("the layout's Filters effect is built and starts gentle", () => {
  const fx = effect("filters");
  assert.equal(fx.built, true);
  assert.equal(fx.defaultValue, 30);
  assert.equal(fx.simulation, false);
  assert.equal(fx.studio, "filters");
});

test("A6 timing on this machine: 128 px strip tiles and the full drawn portrait (reported, budgets ASSUMED)", () => {
  THUMBS.clear();
  const small = scaleSource(portrait, Th.THUMB_SIDE);
  const cold = [], warm = [];
  for (const o of filterOptions().slice(0, 12)) {
    let t = performance.now(); renderFilterTile(small, o); cold.push(performance.now() - t);
    THUMBS.clear();
    t = performance.now(); renderFilterTile(small, o); warm.push(performance.now() - t);
  }
  const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  const editor = new Editor("portrait"); editor.selectStudio("filters"); editor.add();
  const t = performance.now(); editor.preview(); const full = performance.now() - t;
  console.log(`# filters A6: 128 px tile median ${median(cold).toFixed(1)} ms with bake, ${median(warm).toFixed(1)} ms with the LUT cached; `
    + `${portrait.image.width}x${portrait.image.height} preview ${full.toFixed(1)} ms`);
  assert.ok(median(warm) < 400 && full < 3000, "generous ceilings so CI noise can't fail the round; budgets are reported");
});
