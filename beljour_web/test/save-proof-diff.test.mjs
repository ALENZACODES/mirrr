/** No-drop diagnostics on count-only, unpaired local replay measurements. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { compareProofBundles, describeComparison } from "../dist/js/save/proof-diff.js";
import { createProofPlan, bindReport } from "../dist/js/save/proof-plan.js";
import { ProofLedger } from "../dist/js/save/proof-ledger.js";
import { proveReplay } from "../dist/js/save/proof.js";

function recipe(strength = 20) {
  const created = "2026-10-24T00:00:00.000Z";
  return {
    format: "beljour-look-recipe/1",
    id: "look-face1234",
    name: "Test Settings",
    created,
    versions: [{ version: 1, created, steps: [
      { tool: "enhance", strength, settings: {}, provider: "local" },
    ] }],
  };
}

function frame(seed) {
  const data = new Uint8Array(4 * 4 * 4);
  for (let index = 0; index < data.length; index++) data[index] = (index + seed * 13) % 256;
  return { width: 4, height: 4, channels: 4, data };
}

const good = { enhance: (p) => ({ ...p, data: new Uint8Array(p.data) }) };
const bad = {
  enhance(p) {
    const bytes = new Uint8Array(p.data);
    bytes[3] ^= 3;
    return { ...p, data: bytes };
  },
};

async function bundle(statuses, strength = 20) {
  const recipeValue = recipe(strength);
  const plan = await createProofPlan(recipeValue, statuses.length);
  const ledger = new ProofLedger(statuses.length);
  statuses.forEach((status, index) => {
    const engine = status === "PASS" ? good : status === "FAIL" ? bad : {};
    ledger.add(index, proveReplay(recipeValue, frame(index), engine));
  });
  return bindReport(plan, ledger.summary());
}

test("unchanged complete counts are not mistaken for paired regression proof", async () => {
  const a = await bundle(["PASS", "PASS", "PASS"]);
  const b = await bundle(["PASS", "PASS", "PASS"]);
  const compared = compareProofBundles(a, b);
  assert.equal(compared.status, "UNPROVEN");
  assert.equal(compared.reason, "unpaired_aggregates");
  assert.equal(compared.delta, 0);
  assert.equal(compared.total, 3);
  assert(compared.checkDifferences.every((entry) => entry.direction === "unchanged"));
  assert.match(describeComparison(compared), /no per-face no-regression/);
});

test("observed drop in passing saved look replays fails", async () => {
  const a = await bundle(["PASS", "PASS", "PASS", "PASS"]);
  const b = await bundle(["PASS", "FAIL", "PASS", "FAIL"]);
  const compared = compareProofBundles(a, b);
  assert.equal(compared.status, "FAIL");
  assert.equal(compared.reason, "observed_decrease");
  assert.equal(compared.delta, -2);
  assert.equal(compared.passedBefore, 4);
  assert.equal(compared.passedAfter, 2);
  assert.match(describeComparison(compared), /fell by 2/);
});

test("an increase is recorded but not called an established release pass", async () => {
  const a = await bundle(["UNPROVEN", "PASS", "UNPROVEN"]);
  const b = await bundle(["PASS", "PASS", "PASS"]);
  const compared = compareProofBundles(a, b);
  assert.equal(compared.status, "UNPROVEN");
  assert.equal(compared.delta, 2);
  assert.match(describeComparison(compared), /\+2/);
});

test("same number of passes with different failing checks stays unproven", async () => {
  const a = await bundle(["PASS", "FAIL"]);
  const b = await bundle(["FAIL", "PASS"]);
  const compared = compareProofBundles(a, b);
  assert.equal(compared.delta, 0);
  assert.equal(compared.status, "UNPROVEN");
});

test("a newly missing tool reduces pass rate and is visible as failure", async () => {
  const a = await bundle(["PASS", "PASS", "PASS"]);
  const b = await bundle(["PASS", "UNPROVEN", "PASS"]);
  const compared = compareProofBundles(a, b);
  assert.equal(compared.status, "FAIL");
  assert.equal(compared.delta, -1);
});

test("a frozen-setting change invalidates a comparison", async () => {
  const a = await bundle(["PASS"], 20);
  const b = await bundle(["PASS"], 21);
  assert.throws(() => compareProofBundles(a, b), /identical/);
});

test("different declared batch sizes cannot be compared", async () => {
  const a = await bundle(["PASS", "PASS"]);
  const b = await bundle(["PASS", "PASS", "PASS"]);
  assert.throws(() => compareProofBundles(a, b), /denominators/);
});

test("a forged PASS status is rejected before comparison", async () => {
  const a = await bundle(["PASS", "PASS"]);
  const b = await bundle(["PASS", "FAIL"]);
  assert.throws(() => compareProofBundles(a, { ...b, status: "PASS" }), /unsupported status/);
});

test("a fake passing check count cannot conceal a regression", async () => {
  const a = await bundle(["PASS", "PASS"]);
  const b = await bundle(["PASS", "FAIL"]);
  const forged = structuredClone(b);
  forged.report.checks.alpha_preserved.passed = 3;
  forged.report.checks.alpha_preserved.failed = 0;
  assert.throws(() => compareProofBundles(a, forged));
});

test("comparison cannot embed per-photo results in its count-only output", async () => {
  const a = await bundle(["PASS", "PASS"]);
  const b = await bundle(["PASS", "FAIL"]);
  const comparison = compareProofBundles(a, b);
  const text = JSON.stringify(comparison);
  assert.equal(comparison.format, "beljour-save-proof-comparison/1");
  assert(!text.includes("filename"));
  assert(!text.includes("landmark"));
  assert(!text.includes("face_id"));
  assert(!text.includes("data"));
  assert(!text.includes("pixel"));
});

test("every registered per-check difference remains in canonical order", async () => {
  const a = await bundle(["PASS", "PASS"]);
  const b = await bundle(["PASS", "FAIL"]);
  const compared = compareProofBundles(a, b);
  assert.deepEqual(compared.checkDifferences.map((entry) => entry.check), [
    "input_valid",
    "source_unchanged",
    "output_shape",
    "output_detached",
    "replay_equal",
    "alpha_preserved",
    "steps_complete",
  ]);
});

test("a single failing check can cause a drop even if the summary is incomplete", async () => {
  const a = await bundle(["PASS", "UNPROVEN", "PASS"]);
  const b = await bundle(["PASS", "FAIL", "PASS"]);
  const compared = compareProofBundles(a, b);
  assert.equal(compared.status, "FAIL");
  assert(compared.checkDifferences.some((entry) => entry.delta < 0));
});

test("comparison supports the 100000-item ledger limit without shipping images", async () => {
  const look = recipe();
  const plan = await createProofPlan(look, 100000);
  const a = new ProofLedger(100000);
  const b = new ProofLedger(100000);
  const before = bindReport(plan, a.summary());
  const after = bindReport(plan, b.summary());
  const comparison = compareProofBundles(before, after);
  assert.equal(comparison.status, "UNPROVEN");
  assert.equal(comparison.total, 100000);
  assert.equal(comparison.passedBefore, 0);
  assert.equal(comparison.passedAfter, 0);
});
