// Runtime recipe validation for stored and imported looks (free-library plan §4B, P0).
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as V from "../dist/js/save/validate.js";
import { RECIPE_FORMAT, MAX_STEPS, MAX_VERSIONS, autoName } from "../dist/js/save/recipe.js";

const good = () => ({
  format: RECIPE_FORMAT, id: "look-0a1b2c3d", name: "Date Night", created: "2026-10-23T10:00:00.000Z",
  versions: [{ version: 1, created: "2026-10-23T10:00:00.000Z", steps: [
    { tool: "feminine", strength: 40, settings: { mode: "soft" }, provider: "local" },
    { tool: "makeup", strength: 30, settings: { lip: "rose" }, provider: "youcam" },
  ] }],
});

test("a valid recipe round-trips and comes back clean", () => {
  const r = V.validateRecipe(good());
  assert.deepEqual(r, good());
  assert.notEqual(r.versions[0].steps, good().versions[0].steps);
  assert.equal(V.parseRecipeText(JSON.stringify(good())).name, "Date Night");
});

test("missing provider takes the tool's own; a wrong provider is refused", () => {
  const raw = good(); delete raw.versions[0].steps[1].provider;
  assert.equal(V.validateRecipe(raw).versions[0].steps[1].provider, "youcam");
  const bad = good(); bad.versions[0].steps[0].provider = "youcam";
  assert.throws(() => V.validateRecipe(bad), /provider: must be "local"/);
});

const cases = [
  ["wrong format", (r) => { r.format = "x"; }, /format/],
  ["unknown top field", (r) => { r.extra = 1; }, /unknown field "extra"/],
  ["damaged id", (r) => { r.id = "look-zz"; }, /id/],
  ["empty name", (r) => { r.name = "  "; }, /name/],
  ["script in name", (r) => { r.name = "<script>"; }, /name/],
  ["no versions", (r) => { r.versions = []; }, /versions/],
  ["versions out of order", (r) => { r.versions[0].version = 2; }, /must be 1/],
  ["unknown tool", (r) => { r.versions[0].steps[0].tool = "face-swap"; }, /tool this app/],
  ["strength over 100", (r) => { r.versions[0].steps[0].strength = 101; }, /0 to 100/],
  ["NaN strength", (r) => { r.versions[0].steps[0].strength = Number.NaN; }, /0 to 100/],
  ["photo in settings", (r) => { r.versions[0].steps[0].settings.photo = "x"; }, /never holds photos/],
  ["landmarks in settings", (r) => { r.versions[0].steps[0].settings.landmarks = 1; }, /never holds/],
  ["gps in settings", (r) => { r.versions[0].steps[0].settings.gps = "43,-79"; }, /never holds/],
  ["data url value", (r) => { r.versions[0].steps[0].settings.mode = "data:image/png;base64,AAA"; }, /embedded files/],
  ["link value", (r) => { r.versions[0].steps[0].settings.mode = "https://x.example"; }, /links/],
  ["object value", (r) => { r.versions[0].steps[0].settings.mode = { a: 1 }; }, /text, a number/],
  ["unknown step field", (r) => { r.versions[0].steps[0].mask = [1]; }, /unknown field "mask"/],
  ["bad date", (r) => { r.created = "yesterday"; }, /date/],
  ["too many steps", (r) => { r.versions[0].steps = Array.from({ length: MAX_STEPS + 1 }, () => ({ tool: "tan", strength: 1 })); }, /steps/],
  ["too many versions", (r) => { r.versions = Array.from({ length: MAX_VERSIONS + 1 }, (_, i) => ({ ...r.versions[0], version: i + 1 })); }, /versions/],
];
for (const [label, mutate, pattern] of cases) {
  test(`refused: ${label}`, () => {
    const raw = good(); mutate(raw);
    assert.throws(() => V.validateRecipe(raw), (e) => e instanceof V.RecipeError && pattern.test(e.message));
  });
}

test("old My Look files upgrade to a one-version recipe", () => {
  const old = { format: "beljour-my-look/1", id: "look-12345678", name: "Office", created: "2026-10-22T09:00:00Z",
    steps: [{ kind: "enhance", strength: 30, params: { mode: "natural" } }] };
  const r = V.upgradeMyLook(old);
  assert.equal(r.format, RECIPE_FORMAT);
  assert.equal(r.versions.length, 1);
  assert.deepEqual(r.versions[0].steps, [{ tool: "enhance", strength: 30, settings: { mode: "natural" }, provider: "local" }]);
  assert.throws(() => V.upgradeMyLook({ format: "nope" }), /not a BELJOUR look/);
});

test("shared text is size-capped and must be JSON", () => {
  assert.throws(() => V.parseRecipeText("{not json"), /not a saved look/);
  assert.throws(() => V.parseRecipeText("x".repeat(70000)), /too large/);
});

test("auto names come from the tools, as in John's example", () => {
  assert.equal(autoName([{ tool: "feminine", strength: 40 }, { tool: "nose", strength: 25 }, { tool: "tan", strength: 30 }, { tool: "skin", strength: 20 }]),
    "Feminine 40 → Nose 25 → Tan 30");
  assert.equal(autoName([]), "My look");
});
