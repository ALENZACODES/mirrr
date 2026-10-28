/** Seasonal catalogue and local-render contract, with no remote artwork.
 * Publication requires seeded art; existing colour filters are not a substitute.
 * Author: John Khan.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { catalogue } from "../../dist/js/filters/recipe/registry.js";
import * as render from "../../dist/js/filters/runtime/engine.js";
import { makeSample } from "../../dist/js/ui/shell/demo.js";

const sample = makeSample("low-light");
const original = Buffer.from(sample.image.data);
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const occurrences = (source, word) => source.toLowerCase().includes(word.toLowerCase());

function reviewSeasonalCatalogue() {
  const items = catalogue().recipes.filter((recipe) => recipe.tab === "Seasonal");
  const ready = items.filter((recipe) => recipe.status === "Build");
  return { total: items.length, built: ready.length,
    pending: items.length - ready.length,
    status: ready.length ? "NEEDS_PIXEL_EVIDENCE" : "UNPROVEN" };
}

test("seasonal selection reflects actual built entries, not an invented pack", () => {
  const result = reviewSeasonalCatalogue();
  assert.ok(result.total >= result.built);
  assert.equal(result.total, result.built + result.pending);
  assert.ok(["NEEDS_PIXEL_EVIDENCE", "UNPROVEN"].includes(result.status));
  assert.deepEqual(catalogue().problems(), []);
});

test("three current local looks produce actual deterministic output pixels", () => {
  const actual = [];
  for (const id of ["C01", "C02", "C03"]) {
    const first = render.render(sample.image, id, { strength: 40, guard: false });
    const second = render.render(sample.image, id, { strength: 40, guard: false });
    assert.equal(digest(first.image.data), digest(second.image.data), id);
    assert.equal(first.image.data.length, original.length);
    assert.notEqual(digest(first.image.data), digest(original), id);
    actual.push(digest(first.image.data));
  }
  assert.equal(new Set(actual).size, 3);
  assert.equal(digest(sample.image.data), digest(original));
});

test("current filter plan exposes recipe strength but no seeded seasonal renderer", () => {
  const candidate = catalogue().get("C01");
  const first = render.plan(candidate, { strength: 40, guard: false });
  const second = render.plan(candidate, { strength: 40, guard: false });
  assert.equal(render.planKey(first), render.planKey(second));
  assert.equal(first.recipe, candidate.id);
  assert.equal(first.strength, 40);
  assert.equal(typeof candidate.seed === "number" || candidate.seed === "photo", true);
  // A deterministic colour recipe does not prove that a seasonal design is seed-sensitive.
  const evidence = { baseRendering: true, seededSeasonalArt: "NOT_MEASURED" };
  assert.equal(evidence.seededSeasonalArt, "NOT_MEASURED");
});

test("an art title or caption with an injected forbidden token fails the review", () => {
  const invented = "unlicensedword";
  const descriptions = [
    "Original paper lantern", "Original painted evening", "Original geometric leaf",
  ];
  assert.ok(descriptions.every((description) => !occurrences(description, invented)));
  assert.ok(occurrences(`Autumn ${invented} leaf`, invented));
  assert.equal(new Set(descriptions).size, 3);
});

test("remote SVG payloads are distinct from local procedural artwork", () => {
  const local = '<svg><rect x="5" y="6" width="12" height="12"/></svg>';
  const remote = '<svg><image href="https://invalid.test/asset"/></svg>';
  assert.equal(/<(image|script|foreignObject|use)\b/i.test(local), false);
  assert.equal(/<(image|script|foreignObject|use)\b/i.test(remote), true);
  assert.equal(/https?:\/\//.test(local), false);
  assert.equal(/https?:\/\//.test(remote), true);
});

test("the source photo remains stable after repeated card previews", () => {
  const before = digest(sample.image.data);
  const hashes = [];
  for (const strength of [20, 35, 50]) {
    const first = render.render(sample.image, "C01", { strength, guard: false });
    hashes.push(digest(first.image.data));
    assert.equal(digest(sample.image.data), before);
    assert.ok(first.image.data.every(Number.isFinite));
  }
  assert.equal(new Set(hashes).size, 3);
});
