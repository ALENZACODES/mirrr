// Full-buffer Python/browser parity for all eye features and styles. Author: John Khan.
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderEyes, FEATURES } from "../dist/js/engines/eyes/index.js";
import { frames } from "../dist/js/engines/eyes/geometry.js";
import { corpus, fixture, numericDifference } from "./eyes-fixtures.mjs";

test("eyes parity contains every feature, every anatomy and nonzero moving angles", () => {
  assert.equal(corpus.format, "eyes-r15b-parity/1");
  assert.equal(corpus.fixture_kind, "drawn mathematical fixtures");
  assert.deepEqual([...new Set(corpus.cases.map(c => c.request.feature))].sort(), [...FEATURES].sort());
  const anatomies = new Set(corpus.cases.flatMap(c => Object.values(c.request.anatomy)));
  assert.deepEqual([...anatomies].sort(), ["deep_set", "hooded", "monolid", "open"]);
  const angles = new Set(corpus.cases.filter(c => c.request.feature === "W67").map(c => c.request.angle));
  assert.ok(angles.has(-65) && angles.has(65));
});

for (const source of corpus.fixtures) {
  test(`eyes measured geometry agrees across languages on drawn fixture ${source.id}`, () => {
    const measured = frames(source.landmarks, source.width, source.height).map(frame => frame.asDict());
    assert.ok(numericDifference(measured, source.frames) <= 1e-9);
  });
}

for (let number = 0; number < corpus.cases.length; number++) {
  const vector = corpus.cases[number];
  test(`eyes full output parity ${number}: ${vector.request.feature}/${vector.request.style}/fixture${vector.fixture}`, () => {
    const { image, mesh } = fixture(vector.fixture);
    const before = image.data.slice(), points = structuredClone(mesh);
    const actual = renderEyes(image, mesh, vector.request);
    const expected = before.slice(), mask = new Float64Array(image.width * image.height);
    for (const [index, ...channels] of vector.pixels) expected.set(channels, index * image.channels);
    for (const [index, value] of vector.coverage) mask[index] = value;
    let maximumPixelDifference = 0, maximumCoverageDifference = 0;
    for (let i = 0; i < expected.length; i++) maximumPixelDifference = Math.max(maximumPixelDifference, Math.abs(expected[i] - actual.image[i]));
    for (let i = 0; i < mask.length; i++) maximumCoverageDifference = Math.max(maximumCoverageDifference, Math.abs(mask[i] - actual.coverage[i]));
    assert.ok(maximumPixelDifference <= corpus.pixel_tolerance, `pixel error ${maximumPixelDifference}`);
    assert.ok(maximumCoverageDifference <= corpus.coverage_tolerance, `coverage error ${maximumCoverageDifference}`);
    assert.ok(numericDifference(actual.report, vector.report) <= 1e-7);
    assert.deepEqual(image.data, before);
    assert.deepEqual(mesh, points);
  });
}

test("eyes parity detects changed colour output rather than comparing only schema", () => {
  const vector = corpus.cases.find(v => v.request.feature === "W67"), { image, mesh } = fixture(vector.fixture);
  const actual = renderEyes(image, mesh, vector.request);
  const changed = vector.pixels[0];
  const damaged = [...changed];
  damaged[1] = (damaged[1] + 70) % 256;
  assert.ok(Math.abs(damaged[1] - actual.image[damaged[0] * image.channels]) > corpus.pixel_tolerance);
});
