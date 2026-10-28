/** BELJOUR Proof Wall reproducibility and honest timing scope.
 * Quality readings use code-drawn faces; performance uses the Node filter runtime.
 * Created by John Khan.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { catalogue } from "../dist/js/filters/recipe/registry.js";
import { benchmark, fixture, percentile, webSourceHash } from "./r36b-filter-latency.mjs";

const base = new URL("../../docs/artistic/proof_wall/", import.meta.url);
const load = (name) => JSON.parse(readFileSync(new URL(name, base), "utf8"));
const sha = (value) => createHash("sha256").update(value).digest("hex");
const built = catalogue().recipes;
const manifest = sha(JSON.stringify(built.map((r) => [r.id, r.version, r.rank])));

function validateRows(proof) {
  assert.equal(proof.product, "BELJOUR");
  assert.equal(proof.format, "beljour-proof-wall-v1");
  assert.equal(proof.summary.fixture, "synthetic");
  assert.equal(proof.summary.filters, 61);
  assert.equal(proof.summary.evaluated, 366);
  assert.equal(proof.summary.passes, 366);
  assert.equal(proof.summary.realFacesEvaluated, 0);
  assert.equal(proof.summary.complete, true);
  assert.equal(proof.recipeManifestSha256, manifest);
  assert.equal(proof.webSourceSha256, webSourceHash());
  assert.deepEqual(proof.grades.map((r) => r.id), built.map((r) => r.id));
  assert.deepEqual(proof.latency.map((r) => r.id), built.map((r) => r.id));
}

test("synthetic fixture dimensions, skin and person mask are deterministic", () => {
  const a = fixture();
  const b = fixture();
  assert.equal(a.image.data.length, 80 * 96 * 3);
  assert.deepEqual(a.image.data, b.image.data);
  assert.deepEqual(a.masks.skin.data, b.masks.skin.data);
  assert.ok(a.masks.skin.data.some((value) => value === 1));
  assert.ok(a.masks.skin.data.some((value) => value === 0));
  assert.deepEqual(a.centre, [40, 51]);
});

test("benchmark percentiles interpolate from measured samples", () => {
  assert.equal(percentile([1, 2, 3, 4, 5], 0.5), 3);
  assert.equal(percentile([1, 2, 3, 4, 5], 0.95), 4.8);
  assert.equal(percentile([2, 4], 0.5), 3);
  assert.throws(() => percentile([], 0.5));
  assert.throws(() => percentile([2, NaN], 0.5));
  assert.throws(() => percentile([2, 4], 1.5));
});

test("live tiny Node render benchmark retains exact output hashes", () => {
  const run = benchmark({ ids: [built[0].id, built[1].id], repeats: 3 });
  assert.equal(run.filters.length, 2);
  assert.equal(run.recipeManifestSha256, manifest);
  assert.equal(run.webSourceSha256, webSourceHash());
  assert.equal(run.realFacesEvaluated, 0);
  assert.equal(run.mobileOrBrowserBudgetVerified, false);
  assert.equal(run.runtime, "node_v8_web_filter_engine");
  assert.deepEqual(run.filters.map((r) => r.id), [built[0].id, built[1].id]);
  for (const row of run.filters) {
    assert.equal(row.warmSamplesMs.length, 3);
    assert.ok(row.coldMs > 0);
    assert.ok(row.warmP50Ms > 0);
    assert.ok(row.warmP95Ms > 0);
    assert.equal(row.outputSha256.length, 64);
    assert.ok(row.warmSamplesMs.every((value) => Number.isFinite(value) && value > 0));
  }
});

test("benchmark options reject missing or duplicated requested filters", () => {
  assert.throws(() => benchmark({ ids: [], repeats: 3 }), RangeError);
  assert.throws(() => benchmark({ ids: [built[0].id, built[0].id], repeats: 3 }), RangeError);
  assert.throws(() => benchmark({ ids: ["not-built"], repeats: 3 }), RangeError);
  assert.throws(() => benchmark({ repeats: 0 }), RangeError);
  assert.throws(() => benchmark({ repeats: 2.5 }), RangeError);
});

test("Proof Wall grades match every registered version and editorial assignment", () => {
  const proof = load("BELJOUR_PROOF_WALL.json");
  validateRows(proof);
  for (let i = 0; i < built.length; i++) {
    const row = proof.grades[i];
    const recipe = built[i];
    assert.equal(row.rank, recipe.rank);
    assert.equal(row.recipeVersion, recipe.version);
    assert.equal(row.family, recipe.editorial.family);
    assert.equal(row.light, recipe.editorial.light);
    assert.equal(row.syntheticGrade, "S6/6");
    assert.equal(row.tonesPassed, 6);
    assert.equal(row.tonesTested, 6);
    assert.equal(row.realFacesEvaluated, 0);
    assert.ok(row.identityDriftMax >= 0);
    assert.ok(row.textureAlignmentMin >= 0 && row.textureAlignmentMin <= 1);
  }
});

test("each per-filter timing row has seven unaltered measured samples", () => {
  const proof = load("BELJOUR_PROOF_WALL.json");
  const raw = load("BELJOUR_NODE_RENDER_SAMPLES.json");
  assert.equal(raw.filters.length, 61);
  assert.equal(raw.timing.repetitions, 7);
  assert.equal(raw.recipeManifestSha256, manifest);
  assert.equal(raw.webSourceSha256, webSourceHash());
  assert.equal(raw.mobileOrBrowserBudgetVerified, false);
  assert.equal(raw.realFacesEvaluated, 0);
  assert.equal(raw.fixture.width * raw.fixture.height, 80 * 96);
  for (let index = 0; index < raw.filters.length; index++) {
    const measured = raw.filters[index];
    const presented = proof.latency[index];
    assert.equal(measured.id, presented.id);
    assert.equal(measured.rank, presented.rank);
    assert.equal(measured.warmSamplesMs.length, 7);
    assert.ok(Math.abs(percentile(measured.warmSamplesMs, 0.5) - measured.warmP50Ms) < 0.00001);
    assert.ok(Math.abs(percentile(measured.warmSamplesMs, 0.95) - measured.warmP95Ms) < 0.00001);
    assert.ok(Math.abs(presented.warmP50Ms - measured.warmP50Ms) < 0.0005);
    assert.ok(Math.abs(presented.warmP95Ms - measured.warmP95Ms) < 0.0005);
    assert.ok(measured.coldMs > 0);
    assert.equal(measured.outputSha256.length, 64);
  }
});

test("full 366-row Cover Test ledger contains no missing or duplicated tone", () => {
  const proof = load("BELJOUR_PROOF_WALL.json");
  const readings = proof.coverLedger.results;
  assert.equal(readings.length, 366);
  assert.equal(proof.coverLedger.passes, 366);
  assert.equal(proof.coverLedger.realFacesEvaluated, 0);
  assert.deepEqual(proof.coverLedger.coverageFailures, []);
  const observed = new Set();
  for (const row of readings) {
    assert.equal(row.passed, true);
    assert.deepEqual(row.problems, []);
    const key = `${row.id}/${row.tone}`;
    assert.ok(!observed.has(key), key);
    observed.add(key);
    for (const value of Object.values(row.metrics)) {
      assert.ok(Number.isFinite(value));
    }
  }
  assert.equal(observed.size, 366);
});

test("Proof Wall labels Node measurements as non-mobile evidence", () => {
  const proof = load("BELJOUR_PROOF_WALL.json");
  const text = readFileSync(new URL("BELJOUR_PROOF_WALL.md", base), "utf8");
  assert.match(text, /not a browser or mobile-performance claim/);
  assert.match(text, /100,000-face gate UNVERIFIED/);
  assert.match(proof.claims.latency, /not browser or mobile/);
  assert.equal(proof.latencyRun.mobileOrBrowserBudgetVerified, false);
  assert.equal(proof.latencyRun.runtime, "node_v8_web_filter_engine");
});
