// R9 FS7 thumbnails on the user's own photo, option picks and source scaling. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "../dist/js/ui/shell/thumbnails.js";
import * as S from "../dist/js/ui/shell/scale.js";
import { renderLayers } from "../dist/js/ui/shell/pipeline.js";
import { makeSample, uploadedSource } from "../dist/js/ui/shell/demo.js";
import { Editor } from "../dist/js/ui/shell/controller.js";
import { coverage, ellipse } from "../dist/js/engines/core/mask.js";
import { MODES, addNoise, classifyPhoto, lowLight, scene } from "../dist/js/engines/local/enhance.js";
import { STYLES } from "../dist/js/engines/local/beard.js";
import { fixesFor } from "../dist/js/engines/local/posture.js";

const hash = (img) => Buffer.from(img.data).toString("base64");

test("each local tool's strip lists its own options, on this photo", () => {
  assert.deepEqual(T.optionsFor("enhance", makeSample("low-light")).map((o) => o.params.mode), Object.keys(MODES));
  assert.deepEqual(T.optionsFor("beard", makeSample("portrait")).map((o) => o.params.style), Object.keys(STYLES));
  assert.deepEqual(T.optionsFor("hair-fibre", makeSample("crown")).map((o) => o.params.product), ["fibres", "spray", "powder"]);
  assert.deepEqual(T.optionsFor("posture", makeSample("body-front")).map((o) => o.params.fix), fixesFor("front"));
  assert.deepEqual(T.optionsFor("posture", makeSample("body-side")).map((o) => o.params.fix), fixesFor("side"));
  assert.deepEqual(T.optionsFor("posture", makeSample("low-light")), [], "no body points, no posture options");
  const beard = T.optionsFor("beard", makeSample("portrait"))[1];
  assert.equal(beard.label, "Short boxed");
  assert.equal(beard.params.colour, "#3B2A22", "other parameters keep their defaults");
  assert.equal(beard.strength, T.DEFAULT_STRENGTH);
});

test("rendered strips are 128 px personal previews timed against the budget", () => {
  for (const [sample, studio, count] of [["low-light", "enhance", 5], ["portrait", "beard", 3], ["crown", "hair-fibre", 3], ["body-front", "posture", 2]]) {
    const tiles = T.renderStrip(studio, makeSample(sample));
    assert.equal(tiles.length, count, studio);
    for (const tile of tiles) {
      assert.equal(tile.status, "ready", `${studio} ${tile.label}: ${tile.reason ?? ""}`);
      assert.equal(Math.max(tile.image.width, tile.image.height), T.THUMB_SIDE);
      assert.ok(tile.ms >= 0);
      assert.equal(tile.overBudget, tile.ms > T.THUMB_BUDGET_MS);
      assert.equal(tile.simulation, studio !== "enhance");
    }
    // R12: a rescue gate preserves normal photos and skips unnecessary steps. Enhance
    // modes may therefore share real pixels; the condition-specific tests below cover it.
    if (studio !== "enhance") assert.equal(new Set(tiles.map((t) => hash(t.image))).size, tiles.length, `${studio} options look different`);
  }
});

test("R12 normal Enhance thumbnails are exact no-ops with visible unchanged notes", () => {
  const source = uploadedSource(scene(128, 104), "upload:normal-preview");
  assert.equal(classifyPhoto(source.image).primary, "normal");
  const pristine = new Uint8Array(source.image.data), tiles = T.renderStrip("enhance", source);
  assert.equal(tiles.length, Object.keys(MODES).length);
  for (const tile of tiles) {
    assert.equal(tile.status, "ready");
    assert.deepEqual(tile.image.data, pristine, tile.label);
    assert.deepEqual(tile.enhance, { condition: "normal", effectiveMode: "preserve", exposureApplied: false, unchanged: true });
    assert.match(tile.note, /No rescue needed\. Preview unchanged\./);
  }
  assert.deepEqual(source.image.data, pristine, "previews cannot mutate the original");
});

test("R12 low-light-only previews describe actual equivalent modes without cosmetic changes", () => {
  const source = uploadedSource(lowLight(scene(128, 104), 0.4), "upload:dim-preview");
  const condition = classifyPhoto(source.image);
  assert.equal(condition.primary, "low_light");
  assert.equal(condition.noisy, false);
  const tiles = T.renderStrip("enhance", source), byMode = Object.fromEntries(tiles.map((tile) => [tile.option.params.mode, tile]));
  assert.equal(new Set(tiles.map((tile) => hash(tile.image))).size, 3);
  for (const tile of tiles) {
    assert.equal(tile.enhance.exposureApplied, true);
    assert.equal(tile.enhance.unchanged, false);
    assert.notEqual(hash(tile.image), hash(source.image), "a requested necessary rescue actually changes pixels");
  }
  for (const mode of ["portrait", "vivid"]) {
    assert.deepEqual(byMode[mode].image.data, byMode.natural.image.data);
    assert.equal(byMode[mode].note, "Same preview as Natural.");
  }
  for (const mode of ["natural", "low_light", "backlit"]) assert.equal(byMode[mode].note, undefined);
});

test("R12 noisy low-light thumbnails retain five condition-appropriate distinct results", () => {
  // Noise is added at the preview resolution deliberately; shrinking a larger noisy
  // chart can remove the evidence and must not force an unnecessary denoise pass.
  const source = uploadedSource(addNoise(lowLight(scene(128, 104), 0.4), 12, 3), "upload:noisy-dim-preview");
  const condition = classifyPhoto(source.image);
  assert.equal(condition.primary, "low_light");
  assert.equal(condition.noisy, true);
  const tiles = T.renderStrip("enhance", source);
  assert.equal(new Set(tiles.map((tile) => hash(tile.image))).size, Object.keys(MODES).length);
  assert.ok(tiles.every((tile) => tile.enhance.exposureApplied && !tile.enhance.unchanged && tile.note === undefined));
});

test("R12 Enhance thumbnails use the real compositor output and preserve its rescue metadata", () => {
  for (const image of [scene(128, 104), lowLight(scene(128, 104), 0.4), addNoise(scene(128, 104), 12, 3)]) {
    const source = uploadedSource(image, "upload:real-compositor");
    for (const tile of T.renderStrip("enhance", source)) {
      const actual = renderLayers(source, [T.optionLayer(tile.option, "photo")]), metric = actual.metrics[0];
      assert.deepEqual(tile.image.data, actual.image.data);
      assert.equal(tile.enhance.condition, metric.condition);
      assert.equal(tile.enhance.effectiveMode, metric.effective_mode);
      assert.equal(tile.enhance.exposureApplied, metric.exposure_applied);
      assert.equal(tile.enhance.unchanged, metric.unchanged);
      if (classifyPhoto(image).primary !== "low_light") assert.equal(metric.exposure_applied, false);
    }
  }
});

test("R12 equivalent preview notes remain accurate when ranked pages are joined", () => {
  const source = uploadedSource(lowLight(scene(128, 104), 0.4), "upload:joined-preview");
  const pages = [0, 1, 2].flatMap((page) => T.renderStripPage("enhance", source, { page, pageSize: 2 }).tiles);
  const joined = T.annotateEnhancePreviews(pages);
  assert.equal(joined[4].note, "Same preview as Natural.");
  assert.equal(pages[4].note, undefined, "annotation must not mutate a cached page");
  assert.equal(joined[4].image, pages[4].image, "annotation cannot manufacture different pixels");
});

test("blocked, provider and planned tools get honest tiles and no pixels", () => {
  const blocked = T.renderStrip("beard", makeSample("low-light"));
  assert.equal(blocked.length, 1); assert.equal(blocked[0].status, "blocked"); assert.match(blocked[0].reason, /Read face points on this device, load matching recorded points/);
  for (const id of ["makeup", "hair-style"]) {
    const [tile] = T.renderStrip(id, makeSample("portrait"));
    assert.equal(tile.status, "provider"); assert.equal(tile.image, undefined);
    assert.match(tile.reason, /never sends your photo/);
  }
  // R11: the filter strip is built: every look is a ready tile, ranked, none labelled a simulation.
  const looks = T.planStrip("filters", makeSample("portrait"));
  assert.ok(looks.length >= 61 && looks.every((t) => t.status === "ready" && !t.simulation));
  assert.equal(looks[0].option.params.recipe, "C01");
});

test("an uploaded photo gets enhance previews of itself; marked crowns get fibre previews", () => {
  const photo = uploadedSource(makeSample("crown").image, "upload:abc123");
  assert.equal(T.renderStrip("hair-fibre", photo)[0].status, "blocked", "no crown marked yet");
  const enhance = T.renderStrip("enhance", photo);
  assert.equal(enhance.length, 5);
  const marked = { ...photo, crown: ellipse(224, 224, 112, 100, 70, 60) };
  const fibre = T.renderStrip("hair-fibre", marked);
  assert.ok(fibre.every((t) => t.status === "ready"));
});

test("scaling keeps masks' coverage, points in place and body controls valid", () => {
  const crown = makeSample("crown");
  const small = S.scaleSource(crown, 112);
  assert.equal(small.image.width, 112); assert.equal(small.crown.width, 112);
  assert.ok(Math.abs(coverage(small.crown) - coverage(crown.crown)) < 0.01);
  assert.match(small.id, /#112x112$/);
  const portrait = makeSample("portrait"), sp = S.scaleSource(portrait, 168);
  const k = sp.image.width / portrait.image.width;
  assert.ok(Math.abs((sp.face[1][0] + 0.5) - (portrait.face[1][0] + 0.5) * k) < 1e-9);
  const body = makeSample("body-side"), sb = S.scaleSource(body, 130);
  assert.equal(sb.body.width, sb.image.width); assert.equal(sb.body.view, "side");
  assert.equal(S.scaleSource(crown, 1024), crown, "no upscaling: the same source comes back");
  assert.throws(() => S.scaledSize(10, 10, 4), /16–4096/);
  assert.throws(() => S.resizeMask(crown.crown, 500, 500), /shrink/);
  assert.deepEqual(Array.from(S.resizeMask(crown.crown, 224, 224).data), Array.from(crown.crown.data));
});

test("the strip cache keys by source, tool and geometry, and evicts the oldest", () => {
  const cache = new T.StripCache(2);
  const a = makeSample("crown"), b = makeSample("portrait");
  cache.set(a, "hair-fibre", []); cache.set(b, "beard", []);
  assert.ok(cache.get(a, "hair-fibre"));
  cache.set(b, "enhance", []);
  assert.equal(cache.size, 2);
  assert.equal(cache.get(a, "hair-fibre"), undefined);
  assert.notEqual(cache.key(a, "enhance"), cache.key({ ...a, crown: undefined }, "enhance"));
});

test("picking a thumbnail edits the selected layer of that tool in one undo step, or adds one", () => {
  const editor = new Editor("portrait");
  const first = editor.applyOption("beard", { style: "moustache" }, "Moustache");
  assert.equal(editor.document.layers.length, 1);
  assert.equal(first.parameters.style, "moustache");
  const steps = editor.history.length;
  editor.applyOption("beard", { style: "short_boxed" }, "Short boxed");
  assert.equal(editor.document.layers.length, 1, "the same layer changes");
  assert.equal(editor.selected.parameters.style, "short_boxed");
  assert.equal(editor.history.length, steps + 1);
  editor.undo();
  assert.equal(editor.selected.parameters.style, "moustache");
  const tiles = T.renderStrip("beard", editor.source);
  assert.equal(T.activeOption(tiles, editor.selected), "beard:style:moustache");
  editor.applyOption("enhance", { mode: "vivid" }, "Vivid");
  assert.equal(editor.document.layers.length, 2, "another tool adds its own layer");
  assert.equal(T.activeOption(tiles, null), null);
});

test("ranked pages: a large catalogue renders one page at a time, in rank order", () => {
  const base = T.optionsFor("enhance", makeSample("low-light"));
  assert.deepEqual(base.map((o) => o.rank), [1, 2, 3, 4, 5]);
  const shuffled = [{ ...base[0], id: "z", rank: 2 }, { ...base[1], id: "b", rank: 1 }, { ...base[2], id: "a", rank: 2 }];
  assert.deepEqual(T.rankOptions(shuffled).map((o) => o.id), ["b", "a", "z"], "rank first, then id, never shuffled");
  assert.throws(() => T.rankOptions([{ ...base[0], rank: 0 }]), /rank/);
  const many = Array.from({ length: 30 }, (_, i) => i);
  assert.deepEqual(T.pageOf(many, 0, 12), { items: many.slice(0, 12), page: 0, pages: 3, total: 30, more: true });
  assert.deepEqual(T.pageOf(many, 2, 12).items, many.slice(24));
  assert.equal(T.pageOf(many, 2, 12).more, false);
  assert.equal(T.pageOf([], 0, 12).pages, 1);
  assert.throws(() => T.pageOf(many, 3, 12), /Page must be/);
  assert.throws(() => T.pageOf(many, 0, 0), /1–200/);
  const page = T.renderStripPage("enhance", makeSample("low-light"), { page: 1, pageSize: 2 });
  assert.deepEqual([page.page, page.pages, page.total, page.more], [1, 3, 5, true]);
  assert.deepEqual(page.tiles.map((t) => t.option.rank), [3, 4], "only this page is rendered");
  assert.ok(page.tiles.every((t) => t.image));
  const blocked = T.renderStripPage("beard", makeSample("low-light"));
  assert.deepEqual([blocked.total, blocked.more], [0, false]);
  assert.equal(T.STRIP_PAGE, 12);
});
