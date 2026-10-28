import { encodedBlob } from "./encoded-fixtures.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { performance } from "node:perf_hooks";
import { applyCurvePixels, defaultRecipe, drawLabel, exportPhotoPro,
  makeCurveLuts, previewPhoto, threePointCurve } from "../../../dist/js/pro/index.js";

const source = { image: { synthetic: true }, width: 1200, height: 800 };

function fakeFactory(store, encodeDelayMs = 0) {
  return (width, height) => ({
    canvas: null,
    draw(input, geometry, tables, label, matte) {
      store.push({ width, height, input, geometry, label, matte, neutral: tables.neutral });
    },
    async encode(mime) {
      if (encodeDelayMs) await new Promise((resolve) => setTimeout(resolve, encodeDelayMs));
      return encodedBlob(mime);
    },
  });
}

test("render: real public preview passes bounded geometry and default label", () => {
  const observations = [];
  const out = previewPhoto(source, defaultRecipe(), fakeFactory(observations));
  assert.equal(out.width, 640);
  assert.equal(out.height, 426);
  assert.equal(observations.length, 1);
  assert.equal(observations[0].label, "Simulation");
  assert.equal(observations[0].matte, false);
  assert.equal(observations[0].neutral, true);
  assert.equal(observations[0].input, source);
  assert.equal(out.overBudget, false);
});

test("render: image export chooses MIME, matte, label and downloaded filename", async () => {
  const observations = [];
  const jpg = await exportPhotoPro(source, defaultRecipe(), "User photo", fakeFactory(observations));
  assert.equal(jpg.name, "User-photo.jpg");
  assert.equal(jpg.label, "Simulation");
  assert.equal(jpg.mime, "image/jpeg");
  assert.equal(observations[0].matte, true);
  assert.equal(jpg.blob.size, 10);
  const png = await exportPhotoPro(source, { ...defaultRecipe(), export: "lossless" },
    "User photo", fakeFactory(observations));
  assert.equal(png.mime, "image/png");
  assert.equal(png.label, "Simulation");
  assert.equal(observations[1].matte, false);
});

test("render: measured overruns are reported, not falsely described as passing", async () => {
  const values = [0, 101];
  const preview = previewPhoto(source, defaultRecipe(), fakeFactory([]), () => values.shift());
  assert.equal(preview.overBudget, true);
  const delayed = [0, 2500];
  const exported = await exportPhotoPro(source, defaultRecipe(), "x", fakeFactory([]), () => delayed.shift());
  assert.equal(exported.overBudget, true);
});

test("render: corrupt image dimensions reject before any canvas allocation", async () => {
  let created = false;
  const factory = () => {
    created = true;
    throw new Error("unexpected call");
  };
  assert.throws(() => previewPhoto({ ...source, width: 4000, height: 4000 }, defaultRecipe(), factory));
  await assert.rejects(exportPhotoPro({ ...source, height: 0 }, defaultRecipe(), "x", factory));
  assert.equal(created, false);
});

test("render: label drawing uses legible original fill and explicit text", () => {
  const calls = [];
  const ctx = {
    save() { calls.push("save"); },
    restore() { calls.push("restore"); },
    measureText(text) { calls.push(text); return { width: 65 }; },
    fillRect(x, y, width, height) { calls.push([x, y, width, height]); },
    fillText(text, x, y) { calls.push([text, x, y]); },
  };
  drawLabel(ctx, "Simulation", 640, 480);
  assert.ok(calls.includes("Simulation"));
  assert.ok(calls.some((call) => Array.isArray(call) && call[0] === "Simulation"));
  assert.equal(calls[0], "save");
  assert.equal(calls.at(-1), "restore");
});

test("timing: 12 MP curve pass plus export-surface pipeline under 2 s on test CPU", async () => {
  // Measures full RGBA tone transform and the export call; fake encoder excludes JPEG/PNG codec.
  const width = 3000;
  const height = 4000;
  const rgba = new Uint8ClampedArray(width * height * 4);
  rgba.fill(150);
  const recipe = { ...defaultRecipe(), curves: { ...defaultRecipe().curves,
    master: threePointCurve(0.63), red: threePointCurve(0.45) } };
  const tables = makeCurveLuts(recipe.curves);
  const syntheticSource = { image: {}, width, height };
  const fastFactory = () => ({
    canvas: null,
    draw(_source, geometry, outputTables, label) {
      assert.equal(geometry.width * geometry.height, width * height);
      assert.equal(label, "Simulation");
      assert.equal(outputTables.red[128], tables.red[128]);
      applyCurvePixels(rgba, outputTables);
    },
    async encode() {
      return encodedBlob("image/jpeg");
    },
  });
  const start = performance.now();
  const result = await exportPhotoPro(syntheticSource, recipe, "synthetic", fastFactory);
  const elapsedMs = performance.now() - start;
  assert.ok(rgba[0] !== 150);
  assert.ok(elapsedMs < 2_000, `12 MP CPU transform and export interface ${elapsedMs.toFixed(1)} ms`);
  assert.equal(result.overBudget, false);
});
