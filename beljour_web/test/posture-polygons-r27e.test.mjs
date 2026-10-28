/** R27E manual outline validation, rasterisation and head-inside-person rule. Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { MAX_OUTLINE_POINTS, OutlineRefused, checkedOutline, coveredShare, outlineArea, outlineMask,
  requireHeadInsidePerson, segmentsIntersect } from "../dist/js/body/posture-polygons.js";

const refused = (code) => (error) => error instanceof OutlineRefused && error.code === code;
const square = (x, y, size) => [[x, y], [x + size, y], [x + size, y + size], [x, y + size]];

test("a simple outline is accepted as an owned copy", () => {
  const points = square(10, 10, 20);
  const copy = checkedOutline(points, 100, 100);
  assert.deepEqual(copy, points);
  copy[0][0] = 99;
  assert.equal(points[0][0], 10);
  assert.equal(outlineArea(points), 400);
});

test("too few, too many, out-of-photo and non-finite points are refused", () => {
  assert.throws(() => checkedOutline([[1, 1], [2, 2]], 100, 100), refused("too_few_points"));
  const many = Array.from({ length: MAX_OUTLINE_POINTS + 1 }, (_, i) => [50 + 40 * Math.cos(i), 50 + 40 * Math.sin(i)]);
  assert.throws(() => checkedOutline(many, 100, 100), refused("too_many_points"));
  assert.throws(() => checkedOutline(square(90, 90, 20), 100, 100), refused("point_outside_photo"));
  assert.throws(() => checkedOutline([[1, 1], [Number.NaN, 5], [9, 9]], 100, 100), refused("point_outside_photo"));
});

test("crossing outlines and repeated vertices are refused", () => {
  const bowtie = [[10, 10], [40, 40], [40, 10], [10, 40]];
  assert.throws(() => checkedOutline(bowtie, 100, 100), refused("self_crossing_outline"));
  assert.throws(() => checkedOutline([[10, 10], [40, 10], [40, 10], [10, 40]], 100, 100), refused("self_crossing_outline"));
  assert.equal(segmentsIntersect([0, 0], [10, 10], [0, 10], [10, 0]), true);
  assert.equal(segmentsIntersect([0, 0], [1, 0], [2, 0], [3, 0]), false);
});

test("tiny outlines cannot hold a protected head", () => {
  assert.throws(() => checkedOutline(square(5, 5, 7), 100, 100), refused("outline_too_small"));
  checkedOutline(square(5, 5, 8), 100, 100);
});

test("rasterised coverage and the head-inside-person rule", () => {
  const person = outlineMask(square(10, 10, 60), 100, 100);
  const inside = outlineMask(square(30, 12, 20), 100, 100);
  const outside = outlineMask(square(60, 60, 30), 100, 100);
  assert.equal(coveredShare(inside, person), 1);
  assert.ok(coveredShare(outside, person) < 0.2);
  assert.equal(requireHeadInsidePerson(inside, person), 1);
  assert.throws(() => requireHeadInsidePerson(outside, person), refused("head_outside_person"));
});
