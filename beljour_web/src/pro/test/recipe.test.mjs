import assert from "node:assert/strict";
import test from "node:test";
import { cloneRecipe, defaultRecipe, parseRecipe, RECIPE_FORMAT,
  serializeRecipe, threePointCurve } from "../../../dist/js/pro/index.js";

test("recipe: complete validated schema round trips without image data", () => {
  const recipe = { ...defaultRecipe(), curves: {
    ...defaultRecipe().curves, master: threePointCurve(0.61), blue: threePointCurve(0.41),
  }, crop: { ...defaultRecipe().crop, x: 0.15, y: 0.25, width: 0.6, height: 0.5,
    aspect: "portrait", rotation: 12.75 }, export: "lossless" };
  const json = serializeRecipe(recipe);
  const parsed = parseRecipe(json);
  assert.deepEqual(parsed, recipe);
  assert.equal(JSON.parse(json).format, RECIPE_FORMAT);
  assert.doesNotMatch(json, /data:image|photo_id|landmark|base64|imageBytes/);
});

test("recipe: deep cloning prevents external mutation of history/contract", () => {
  const original = defaultRecipe();
  const copy = cloneRecipe(original);
  copy.curves.master[0].y = 0.2;
  assert.equal(original.curves.master[0].y, 0);
});

test("recipe: reject malformed data, unknown schema and surprising fields", () => {
  assert.throws(() => parseRecipe("not json"));
  assert.throws(() => parseRecipe("{"));
  assert.throws(() => parseRecipe("[]"));
  assert.throws(() => parseRecipe("x".repeat(8_193)));
  const original = JSON.parse(serializeRecipe(defaultRecipe()));
  assert.throws(() => parseRecipe(JSON.stringify({ ...original, format: "different/1" })));
  assert.throws(() => parseRecipe(JSON.stringify({ ...original, extra: "unexpected" })));
  assert.throws(() => parseRecipe(JSON.stringify({ ...original, recipe: { ...original.recipe, image: [1, 2] } })));
});

test("recipe: reject out-of-bounds crop and curve, unknown output", () => {
  const base = JSON.parse(serializeRecipe(defaultRecipe()));
  const invalid = structuredClone(base);
  invalid.recipe.crop.x = 0.6;
  invalid.recipe.crop.width = 0.8;
  assert.throws(() => parseRecipe(JSON.stringify(invalid)));
  const invalidCurve = structuredClone(base);
  invalidCurve.recipe.curves.red[0].y = 1;
  invalidCurve.recipe.curves.red[1].y = 0;
  assert.throws(() => parseRecipe(JSON.stringify(invalidCurve)));
  const invalidLabel = structuredClone(base);
  invalidLabel.recipe.simulationLabel = "yes";
  assert.throws(() => parseRecipe(JSON.stringify(invalidLabel)));
  const invalidExport = structuredClone(base);
  invalidExport.recipe.export = "remote-provider";
  assert.throws(() => parseRecipe(JSON.stringify(invalidExport)));
});

test("recipe: reject prototype fields, very large control point sets", () => {
  const base = JSON.parse(serializeRecipe(defaultRecipe()));
  const malicious = structuredClone(base);
  malicious.recipe.crop.__proto__ = { evil: "value" };
  assert.deepEqual(parseRecipe(JSON.stringify(malicious)), defaultRecipe());
  const tooMany = structuredClone(base);
  tooMany.recipe.curves.red = Array.from({ length: 25 }, (_, i) => ({ x: i / 24, y: i / 24 }));
  assert.throws(() => parseRecipe(JSON.stringify(tooMany)));
});
