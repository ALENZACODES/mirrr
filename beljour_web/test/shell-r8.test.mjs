// R8 editor state, image compositor and R7 engine integration. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as S from "../dist/js/ui/shell/stops.js";
import * as C from "../dist/js/ui/shell/catalogue.js";
import * as L from "../dist/js/ui/shell/layers.js";
import * as H from "../dist/js/ui/shell/history.js";
import * as D from "../dist/js/ui/shell/demo.js";
import * as P from "../dist/js/ui/shell/pipeline.js";
import * as Settings from "../dist/js/ui/shell/settings.js";
import { Editor } from "../dist/js/ui/shell/controller.js";

const imageHash = (img) => Buffer.from(img.data).toString("base64");
const original = () => H.initialState("sample:low-light");
const mk = (id = "x", kind = "enhance") => L.layer(id, kind, kind);

test("the twenty-one-tab catalogue includes the Top 5 tools and production appearance studios", () => {
  assert.equal(C.CATALOGUE.length, 21);
  assert.equal(new Set(C.CATALOGUE.map((c) => c.id)).size, 21);
  assert.equal(C.CATALOGUE.filter((c) => c.source === "planned").length, 0);
  assert.equal(C.tool("filters").category, "Local studio");
  assert.equal(C.readiness("filters", D.makeSample("low-light")).ready, true);
  assert.deepEqual(C.toolsIn("Local studio").map((t) => t.id), ["enhance", "hair-fibre", "beard", "posture", "filters", "portrait", "older", "younger", "gender", "lighting", "recolour", "balayage", "skin", "under-eye", "teeth", "shave", "grey", "studio", "illustration"]);
  assert.deepEqual(C.toolsIn("Planned"), []);
});

test("local preview tools stay offline and blocked future/provider tools never look runnable", () => {
  for (const sample of D.SAMPLE_IDS) {
    const photo = D.makeSample(sample);
    assert.equal(photo.kind, "sample");
    assert.equal(photo.disposable, true);
    assert.match(photo.id, /^sample:/);
  }
  for (const tool of ["makeup", "hair-style"]) {
    assert.equal(C.readiness(tool, D.makeSample("portrait")).ready, false);
  }
  assert.equal(C.readiness("filters", D.makeSample("portrait")).ready, true);
  assert.equal(C.readiness("enhance", D.makeSample("crown")).ready, true);
  assert.equal(C.readiness("hair-fibre", D.makeSample("low-light")).ready, false);
  assert.equal(C.readiness("beard", D.makeSample("low-light")).ready, false);
  assert.equal(C.readiness("posture", D.makeSample("portrait")).ready, false);
  for (const tool of C.CATALOGUE) assert.ok(C.defaultSample(tool.id));
});

test("posture sliders use the R7 3%/6% defaults and the original three ticks", () => {
  assert.equal(Settings.POSTURE_DEFAULTS.bandShare, 0.03);
  assert.equal(Settings.POSTURE_DEFAULTS.capShare, 0.06);
  assert.deepEqual(Settings.postureSettings(), Settings.POSTURE_DEFAULTS);
  assert.deepEqual(Settings.postureSettings({ bandShare: 0.05 }), { bandShare: 0.05, capShare: 0.06 });
  assert.equal(S.POSTURE_STOPS[1].value, 33);
  assert.equal(S.POSTURE_STOPS[2].value, 66);
  assert.equal(S.nearestStop("posture", 67).name, "Normal");
  assert.equal(S.strengthName("posture", 66), "Normal");
  assert.throws(() => Settings.postureSettings({ bandShare: 0 }), /band/i);
  assert.throws(() => Settings.postureSettings({ capShare: 0.21 }), /cap/i);
});

test("strength clamps only finite numbers and named stops are ordered", () => {
  assert.equal(S.clampStrength(-11), 0);
  assert.equal(S.clampStrength(132), 100);
  assert.equal(S.clampStrength(3.145), 3.15);
  assert.throws(() => S.clampStrength(NaN), /finite/);
  assert.throws(() => S.clampStrength(Infinity), /finite/);
  for (const name of ["enhance", "posture", "beard", "hair-fibre"]) {
    const list = S.stopsFor(name);
    assert.equal(list[0].value, 0);
    assert.equal(list.at(-1).value, 100);
    assert.ok(list.every((s, i) => !i || s.value > list[i - 1].value));
  }
});

test("layer builder enforces basic safety and provenance contracts", () => {
  assert.equal(mk().opacity, 1);
  assert.equal(mk().strength, 30, "gentle default (layout v1, women-first rule 1)");
  assert.equal(mk().provenance, "local");
  assert.equal(mk("remote", "styling").provenance, "youcam");
  assert.throws(() => L.layer("not an id", "enhance", "x"), /ID/);
  assert.throws(() => L.layer("x", "enhance", ""), /fields/);
  assert.throws(() => L.layer("x", "enhance", "Test", "sample", { bad: Infinity }), /fields/);
  assert.throws(() => L.layer("x", "enhance", "Test", "sample", { No: 3 }), /fields/);
});

test("stack is ordered, immutable, capped and rejects duplicate IDs", () => {
  const a = mk("a"), b = mk("b", "posture"), c = mk("c", "beard");
  const base = [a, b];
  const inserted = L.appendLayer(base, c);
  assert.deepEqual(inserted.map((l) => l.id), ["a", "b", "c"]);
  assert.deepEqual(base.map((l) => l.id), ["a", "b"]);
  assert.deepEqual(L.moveLayer(inserted, "a", 1).map((l) => l.id), ["b", "a", "c"]);
  assert.deepEqual(L.moveLayer(inserted, "a", -1).map((l) => l.id), ["a", "b", "c"]);
  assert.deepEqual(L.removeLayer(inserted, "b").map((l) => l.id), ["a", "c"]);
  assert.throws(() => L.appendLayer(inserted, a), /duplicated/);
  assert.throws(() => L.removeLayer(inserted, "z"), /not found/);
  assert.throws(() => L.moveLayer(inserted, "z", 1), /not found/);
  assert.throws(() => L.validateStack(Array.from({ length: 33 }, (_, i) => mk(`l-${i}`))), /maximum/);
});

test("opacity/strength edits are bounded and do not mutate the source layer", () => {
  const a = mk("a");
  const changed = L.editLayer([a], "a", { strength: 150, opacity: -3, parameters: { mode: "portrait" } });
  assert.equal(changed[0].strength, 100);
  assert.equal(changed[0].opacity, 0);
  assert.equal(a.strength, 30);
  assert.deepEqual(a.parameters, {});
  assert.throws(() => L.editLayer([a], "missing", {}), /not found/);
  assert.throws(() => L.clampOpacity(NaN), /finite/);
  assert.equal(L.effective(changed).length, 0);
});

test("a disabled or zero-opacity layer has no influence on the effective stack", () => {
  const on = mk("on"), off = { ...mk("off"), enabled: false }, hidden = { ...mk("hidden"), opacity: 0 }, zero = { ...mk("zero"), strength: 0 };
  assert.deepEqual(L.effective([off, on, hidden, zero]).map((l) => l.id), ["on"]);
  assert.deepEqual(L.describeStack([off, on, hidden, zero]), { local: 4, provider: 0, hidden: 1, simulation: false });
});

test("history snapshots are deep copies and don't contain image data", () => {
  const base = original(), history = new H.History(base);
  base.layers.push(mk("external"));
  assert.equal(history.current.layers.length, 0);
  const next = history.current;
  next.layers = [mk("a")]; next.selected = "a";
  assert.equal(history.commit("Add", next), true);
  next.layers[0].parameters.bad = 1;
  assert.deepEqual(history.current.layers[0].parameters, {});
  assert.ok(!JSON.stringify(history.summary()).includes("data"));
  assert.equal(history.commit("No change", history.current), false);
  assert.equal(history.length, 2);
});

test("undo, redo, branching, jumping and reset behave like real editor history", () => {
  const history = new H.History(original());
  history.change("one", (s) => ({ ...s, layers: [mk("a")], selected: "a" }));
  history.change("two", (s) => ({ ...s, layers: [...s.layers, mk("b")], selected: "b" }));
  assert.equal(history.length, 3);
  assert.equal(history.canUndo, true);
  assert.equal(history.undo().layers.length, 1);
  assert.equal(history.redo().layers.length, 2);
  assert.equal(history.jump(0).layers.length, 0);
  history.change("new branch", (s) => ({ ...s, studio: "beard" }));
  assert.equal(history.canRedo, false);
  assert.equal(history.length, 2);
  assert.throws(() => history.jump(8), /does not exist/);
  assert.equal(history.reset(H.initialState("other")).sourceId, "other");
  assert.equal(history.canUndo, false);
  assert.throws(() => history.commit("mismatched", original()), /reset/);
});

test("history truncates to the configured limit without corrupting the active step", () => {
  const journal = new H.History(original(), 7);
  for (let i = 1; i <= 20; i++) journal.change(`zoom-${i}`, (s) => ({ ...s, zoom: 1 + i / 100 }));
  assert.equal(journal.length, 7);
  assert.equal(journal.step, 6);
  assert.equal(journal.current.zoom, 1.2);
  assert.ok(Math.abs(journal.jump(0).zoom - 1.14) < 1e-12);
});

test("reset does not touch the pixels and cannot erase another source's undo history", () => {
  const editor = new Editor();
  const before = imageHash(editor.source.image);
  editor.add(); editor.resetLayers();
  assert.equal(editor.document.layers.length, 0);
  assert.equal(imageHash(editor.source.image), before);
  editor.undo(); assert.equal(editor.document.layers.length, 1);
  editor.loadSample("portrait");
  assert.equal(editor.document.layers.length, 0);
  assert.equal(editor.history.canUndo, false);
  assert.equal(editor.source.id, "sample:portrait");
});

test("opacity blending's 0 and 100 endpoints are exact, intermediate blends are bounded", () => {
  const img = D.makeSample("low-light").image;
  const altered = P.copyRGB(img);
  altered.data.fill(255);
  const a = P.mixOpacity(img, altered, 0), b = P.mixOpacity(img, altered, 1), c = P.mixOpacity(img, altered, 0.5);
  assert.equal(imageHash(a), imageHash(img));
  assert.equal(imageHash(b), imageHash(altered));
  for (let i = 0; i < c.data.length; i++) assert.ok(c.data[i] >= img.data[i] && c.data[i] <= 255);
  assert.throws(() => P.mixOpacity(img, altered, -1), /Opacity/);
  assert.throws(() => P.mixOpacity(img, altered, Infinity), /Opacity/);
});

test("R7 enhance engine changes a synthetic low-light sample and Q1 zero strength is exact", () => {
  const editor = new Editor(); editor.add("enhance");
  const updated = editor.preview().image;
  const original = editor.source.image;
  assert.ok(P.pixelsChanged(original, updated).pixels > 0);
  assert.equal(imageHash(editor.source.image), imageHash(original));
  editor.update(editor.selected.id, { strength: 0 });
  assert.equal(imageHash(editor.preview().image), imageHash(original));
  editor.undo();
  assert.equal(imageHash(editor.preview().image), imageHash(updated));
  editor.update(editor.selected.id, { opacity: 0 });
  assert.equal(imageHash(editor.preview().image), imageHash(original));
});

test("R7 enhancement step toggles affect output, and invalid modes fail closed", () => {
  const editor = new Editor(); const item = editor.add("enhance");
  const full = imageHash(editor.preview().image);
  editor.param(item.id, "denoise", false);
  editor.param(item.id, "deblur", false);
  assert.notEqual(imageHash(editor.preview().image), full);
  editor.param(item.id, "mode", "not-a-real-mode");
  assert.throws(() => editor.preview(), /mode/i);
});

test("R7 fibre renderer changes only a portion of drawn crown and supports undo", () => {
  const editor = new Editor("crown"); editor.selectStudio("hair-fibre");
  const item = editor.add(); const result = editor.preview();
  assert.ok(P.pixelsChanged(editor.source.image, result.image).percent > 1);
  assert.equal(result.metrics[0].product, "fibres");
  editor.param(item.id, "product", "powder");
  assert.equal(editor.preview().metrics[0].product, "powder");
  editor.undo(); assert.equal(editor.preview().metrics[0].product, "fibres");
  assert.equal(editor.source.crown.channels, 1);
});

test("R7 beard renderer uses canonical 478 landmarks and supports density stops", () => {
  const editor = new Editor("portrait"); editor.selectStudio("beard");
  assert.equal(editor.source.face.length, 478);
  const item = editor.add();
  assert.equal(editor.preview().metrics[0].density, 2, "gentle default 30 -> density 2 (layout v1)");
  editor.update(item.id, { strength: 66 });
  assert.equal(editor.preview().metrics[0].density, 3);
  editor.update(item.id, { strength: 100 });
  assert.equal(editor.preview().metrics[0].density, 4);
  editor.param(item.id, "style", "moustache");
  assert.equal(editor.preview().metrics[0].style, "moustache");
  editor.remove(item.id);
  assert.equal(P.pixelsChanged(editor.source.image, editor.preview().image).pixels, 0);
});

test("R7 posture keeps the 3% band and 6% cap, and fold-guard reports used strength", () => {
  const editor = new Editor("body-front"); editor.selectStudio("posture");
  const item = editor.add(); const report = editor.preview();
  assert.ok(P.pixelsChanged(editor.source.image, report.image).percent > 0);
  assert.equal(report.metrics[0].cap_share, 0.06);
  assert.equal(report.metrics[0].band_share, 0.03);
  assert.ok(report.metrics[0].strength_used > 0 && report.metrics[0].strength_used <= 1);
  editor.param(item.id, "band_share", 0.05);
  assert.equal(editor.preview().metrics[0].band_share, 0.05);
  editor.undo(); assert.equal(editor.preview().metrics[0].band_share, 0.03);
  assert.match(report.labels[0], /not medical advice/);
});

test("invalid samples, empty uploaded photos and provider layers cannot be rendered offline", () => {
  assert.throws(() => D.makeSample("not-real"), /Unknown/);
  assert.throws(() => D.uploadedSource(D.makeSample("low-light").image, "bad-token"), /token/);
  assert.throws(() => P.applyLocalLayer(D.makeSample("portrait").image, D.makeSample("portrait"), mk("styling", "styling")), /not an offline/);
  const editor = new Editor("portrait");
  editor.selectStudio("filters"); assert.equal(editor.canApply, true);
  const look = editor.add();
  assert.equal(look.kind, "filters"); assert.equal(look.parameters.recipe, "C08"); assert.equal(look.simulation, false);
  assert.equal(editor.preview().effective, 1);
  editor.selectStudio("makeup"); assert.equal(editor.canApply, false);
});

test("shell HTML and compiled production assets have no external network references", () => {
  const html = readFileSync(new URL("../dist/studio.html", import.meta.url), "utf8");
  assert.match(html, /id="shell-apply"/);
  assert.match(html, /id="shell-layers"/);
  assert.match(html, /id="shell-history"/);
  assert.match(html, /id="shell-export-label"[^>]*checked/);
  assert.match(html, /js\/ui\/shell\/entry.js/);
  assert.doesNotMatch(html, /<script[^>]+https?:/);
  assert.doesNotMatch(html, /<link[^>]+https?:/);
  assert.match(readFileSync(new URL("../dist/shell.css", import.meta.url), "utf8"), /\.shell-layout/);
});
