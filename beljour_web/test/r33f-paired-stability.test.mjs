// R33F two-capture repeatability in the browser, on drawn scenes only.
// Mirrors api/tests/test_r33f_paired_stability.py with the same literal values.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { clearsLimits, compareShadeCaptures, publicPair } from "../dist/js/engines/shade/paired-stability.js";
import { assessSkinPhoto } from "../dist/js/engines/shade/skin-accuracy.js";
import { COOL, NEXT_SKIN, POINTS, WARM, ZONES, card, paint, scene } from "./helpers/r33f-scenes.mjs";

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test("two lit photos with a checked card agree", () => {
  const found = compareShadeCaptures({ image: scene({ cast: WARM }), points: POINTS, neutralMask: card() },
    { image: scene({ cast: COOL }), points: POINTS, neutralMask: card() });
  assert.equal(found.suggested, true);
  assert.deepEqual([found.referenceId, found.firstReferenceId, found.secondReferenceId], ["LG-07N", "LG-07N", "LG-07N"]);
  near(found.readingDistance, 0.189, 1e-3);
  found.confidences.forEach((c) => near(c, 1, 1e-9));
});

test("the same photo twice is not a second reading", () => {
  const found = compareShadeCaptures({ image: scene(), points: POINTS }, { image: scene(), points: POINTS });
  assert.deepEqual([found.suggested, found.reason, found.readingDistance], [false, "same_photo", null]);
});

test("different references are not suggested", () => {
  const found = compareShadeCaptures({ image: scene(), points: POINTS },
    { image: scene({ skin: NEXT_SKIN }), points: POINTS });
  assert.deepEqual([found.reason, found.referenceId, found.firstReferenceId, found.secondReferenceId],
    ["references_differ", null, "LG-07N", "LG-08N"]);
  near(found.readingDistance, 2.587, 1e-3);
});

test("a refused reading and unreadable captures block the pair", () => {
  const refused = scene();
  paint(refused.data, ZONES.cheek_left, [43, 13.29, 17.64]);
  const found = compareShadeCaptures({ image: scene(), points: POINTS }, { image: refused, points: POINTS });
  assert.deepEqual([found.reason, found.firstReferenceId, found.secondReferenceId], ["second_refused", "LG-07N", null]);
  assert.equal(compareShadeCaptures({ image: scene(), points: POINTS.slice(0, 10) },
    { image: scene({ cast: WARM }), points: POINTS }).reason, "first_invalid");
  assert.equal(compareShadeCaptures({ image: scene(), points: POINTS },
    { image: scene({ cast: WARM }), points: POINTS.slice(0, 10) }).reason, "second_invalid");
});

test("the public report has labels and measurements only", () => {
  const out = publicPair(compareShadeCaptures({ image: scene({ cast: WARM }), points: POINTS, neutralMask: card() },
    { image: scene({ cast: COOL }), points: POINTS, neutralMask: card() }));
  assert.deepEqual(Object.keys(out).sort(), ["confidences", "first_reference_id", "note", "reading_distance",
    "reason", "reference_id", "second_reference_id", "suggested", "tested_against_real_products"]);
  assert.ok(JSON.stringify(out).length < 600);
});

test("limits are the existing W6 limits", () => {
  const reading = assessSkinPhoto(scene(), POINTS).reading;
  assert.equal(clearsLimits(reading), true);
  assert.equal(clearsLimits({ ...reading, refused: true }), false);
  assert.equal(clearsLimits({ ...reading, best: { ...reading.best, lighter_by: 1.5 } }), false);
  assert.equal(clearsLimits({ ...reading, confidence: { ...reading.confidence, overall: 0.4 } }), false);
});
