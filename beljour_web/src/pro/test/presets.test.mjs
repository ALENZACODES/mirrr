import assert from "node:assert/strict";
import test from "node:test";
import { defaultRecipe, EXPORT_PRESETS, planProExport,
  safeStem, simulationText } from "../../../dist/js/pro/index.js";

test("export presets: available sizes and valid MIME/quality", () => {
  assert.deepEqual(Object.keys(EXPORT_PRESETS), ["original", "web", "portrait", "story", "lossless"]);
  for (const preset of Object.values(EXPORT_PRESETS)) {
    assert.ok(preset.maxEdge >= 1 && preset.maxEdge <= 16384);
    assert.ok(preset.quality > 0 && preset.quality <= 1);
    assert.ok(["image/jpeg", "image/png"].includes(preset.mime));
  }
});

test("export presets: default Simulation label is included", () => {
  const recipe = defaultRecipe();
  const plan = planProExport(3000, 4000, recipe, "Été / styled");
  assert.equal(plan.filename, "Ete-styled.jpg");
  assert.equal(plan.label, "Simulation");
  assert.deepEqual([plan.geometry.width, plan.geometry.height], [3000, 4000]);
  assert.equal(simulationText(recipe), "Simulation");
});

test("export presets: explicit opt-out, authentic-only result, PNG transparency", () => {
  const recipe = defaultRecipe();
  const disabled = { ...recipe, simulationLabel: false, export: "lossless" };
  const plan = planProExport(1000, 1000, disabled, "look");
  assert.equal(plan.label, null);
  assert.equal(plan.preset.mime, "image/png");
  assert.equal(plan.filename, "look.png");
  assert.equal(simulationText({ simulation: false, simulationLabel: true }), null);
});

test("export presets: safe filesystem names, no path traversal", () => {
  assert.equal(safeStem("../\\?\u0000"), "look");
  assert.equal(safeStem("summer look 01"), "summer-look-01");
  assert.ok(safeStem("Very".repeat(200)).length <= 48);
  assert.throws(() => safeStem(null));
  assert.throws(() => planProExport(100, 100, { ...defaultRecipe(), export: "not-real" }, "x"));
});

test("export presets: 12 MP pixel cap and no oversized accidental allocations", () => {
  const full = planProExport(3000, 4000, defaultRecipe(), "sample");
  assert.equal(full.geometry.width * full.geometry.height, 12_000_000);
  const web = planProExport(3000, 4000, { ...defaultRecipe(), export: "web" }, "sample");
  assert.equal(web.geometry.height, 1600);
  assert.throws(() => planProExport(4000, 4000, defaultRecipe(), "sample"));
});
