// R28F settings-only local hair recipes in the browser.
// Mirrors api/tests/test_r28f_local_hair_recipe.py; the exported text is identical. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { FORMAT, RecipeError, exportRecipe, importRecipe, makeRecipe } from "../dist/js/commerce/local-hair-recipe.js";

const FIBRE_TEXT = '{"format":"beljour-local-hair-recipe/1","kind":"fibre","level":3.0,"lock_level":5.0,' +
  '"shade_id":null,"zone":"crown"}';
const STYLES = new Set(["local-low-fade"]);
const code = (fn) => { try { fn(); } catch (error) { assert.ok(error instanceof RecipeError); return error.code; } return null; };

test("exports are compact, sorted and the same text as Python", () => {
  const fibre = makeRecipe({ kind: "fibre", level: 3, zone: "crown" });
  assert.equal(exportRecipe(fibre), FIBRE_TEXT);
  for (const input of [{ kind: "palette", level: 4.5, lock_level: 3.2, shade_id: "natural-05-n", allow_lightening: true },
    { kind: "short-sides", level: 1, style_id: "local-low-fade" },
    { kind: "fibre", level: 2.3, zone: "hairline", shade_id: "natural-04-n" }]) {
    const recipe = makeRecipe(input, STYLES);
    assert.deepEqual(importRecipe(exportRecipe(recipe), STYLES), recipe);
  }
});

test("import refusals are coded", () => {
  const cases = [[{ photo: "abc" }, "private_field"], [{ landmarks: [[1, 2]] }, "private_field"], [{ hash: "00" }, "private_field"],
    [{ colour: "red" }, "unknown_key"], [{ level: 3.05 }, "invalid_level"], [{ level: 5.1 }, "invalid_level"],
    [{ level: true }, "invalid_level"], [{ zone: "temple" }, "invalid_value"], [{ shade_id: "brand-123" }, "unknown_id"],
    [{ format: "other/1" }, "wrong_format"], [{ kind: "wig" }, "invalid_value"]];
  for (const [change, want] of cases) {
    assert.equal(code(() => importRecipe(JSON.stringify({ ...JSON.parse(FIBRE_TEXT), ...change }))), want, JSON.stringify(change));
  }
  assert.equal(code(() => importRecipe(" ".repeat(1025))), "too_large");
  assert.equal(code(() => importRecipe("{")), "invalid_json");
  assert.equal(code(() => importRecipe(JSON.stringify({ format: FORMAT, kind: "palette", level: 3 }))), "missing_key");
  assert.equal(code(() => importRecipe(JSON.stringify({ format: FORMAT, kind: "short-sides", level: 3,
    style_id: "no-such-style" }), STYLES)), "unknown_id");
  assert.equal(code(() => importRecipe(JSON.stringify({ format: FORMAT, kind: "palette", level: 3,
    shade_id: "natural-05-n", zone: "crown" }))), "unknown_key");
});

test("an imported recipe holds settings only", () => {
  const recipe = importRecipe(FIBRE_TEXT);
  assert.deepEqual(Object.keys(recipe).sort(), ["format", "kind", "level", "lock_level", "shade_id", "zone"]);
  assert.ok(Object.isFrozen(recipe));
});
