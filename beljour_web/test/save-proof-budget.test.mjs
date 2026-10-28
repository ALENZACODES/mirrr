/** Bounded-resource Save proof on drawn frames; no device performance claim. */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BudgetedProofSource, DEFAULT_PROOF_LIMITS, validateProofBudget,
} from "../dist/js/save/proof-budget.js";
import { arrayBatchSource, auditScheduledBatch } from "../dist/js/save/proof-scheduler.js";

function source(width = 4, height = 5, channels = 4, encoded = 0) {
  return { pixels: { width, height, channels, data: new Uint8Array(width * height * channels) },
    ...(encoded ? { encoded: new Uint8Array(encoded) } : {}) };
}

function recipe() {
  const created = "2026-10-24T00:00:00.000Z";
  return { format: "beljour-look-recipe/1", id: "look-11111111", name: "Local", created,
    versions: [{ version: 1, created, steps: [{ tool: "enhance", strength: 30, settings: {}, provider: "local" }] }] };
}

const engine = { enhance: (photo) => ({ ...photo, data: new Uint8Array(photo.data) }) };

test("counted input bytes include only current frame and encoded output sizes", async () => {
  const budget = new BudgetedProofSource(arrayBatchSource([source(4, 5, 4, 7), source(4, 5, 3, 3)], 2));
  await budget.read(0);
  await budget.read(1);
  const row = budget.report();
  assert.equal(row.inspected, 2);
  assert.equal(row.bytesRead, 80 + 7 + 60 + 3);
  assert.equal(row.largestFrameBytes, 80);
  assert.equal(row.largestExportBytes, 7);
  assert.equal(row.status, "within_inputs");
  assert.deepEqual(validateProofBudget(row), row);
  assert(!JSON.stringify(row).includes('"data"'));
});

test("no reading cannot be presented as a measured device budget", () => {
  const budget = new BudgetedProofSource(arrayBatchSource([source()], 1));
  const row = budget.report();
  assert.equal(row.inspected, 0);
  assert.equal(row.status, "unmeasured_device_peak");
});

test("per-frame memory guard refuses oversized image without calling renderer", async () => {
  const budget = new BudgetedProofSource(arrayBatchSource([source(8, 8)], 1),
    { frameBytes: 32, totalReadBytes: 1000, encodedBytes: 100 });
  await assert.rejects(budget.read(0), /input byte budget/);
  assert.equal(budget.report().inspected, 0);
});

test("cumulative byte budget prevents unbounded repeated decoding", async () => {
  const budget = new BudgetedProofSource(arrayBatchSource([source(), source()], 2),
    { frameBytes: 90, totalReadBytes: 100, encodedBytes: 40 });
  await budget.read(0);
  await assert.rejects(budget.read(1), /input byte budget/);
  assert.equal(budget.report().inspected, 1);
});

test("encoded export bytes have an independent local limit", async () => {
  const budget = new BudgetedProofSource(arrayBatchSource([source(4, 5, 4, 55)], 1),
    { frameBytes: 90, totalReadBytes: 250, encodedBytes: 50 });
  await assert.rejects(budget.read(0), /input byte budget/);
});

test("invalid canvas shape is refused before audit read count increases", async () => {
  const image = source();
  image.pixels.data = new Uint8Array(4);
  const budget = new BudgetedProofSource(arrayBatchSource([image], 1));
  await assert.rejects(budget.read(0), /invalid photo buffer/);
  assert.equal(budget.report().inspected, 0);
});

test("unsupported encoded buffer fails closed", async () => {
  const image = source();
  image.encoded = "not bytes";
  const budget = new BudgetedProofSource(arrayBatchSource([image], 1));
  await assert.rejects(budget.read(0), /unsupported/);
});

test("budget guard may wrap an actual mechanical proof run without changing the gate", async () => {
  const budget = new BudgetedProofSource(arrayBatchSource([source()], 1));
  const run = await auditScheduledBatch(recipe(), budget, engine);
  assert.equal(run.audit.status, "UNPROVEN");
  assert.equal(run.audit.replay.report.counts.passed, 1);
  assert.equal(budget.report().inspected, 1);
  assert.equal(budget.report().bytesRead, 80);
});

test("default limits support one 12 MP frame but do not claim a speed or heap pass", () => {
  assert(DEFAULT_PROOF_LIMITS.frameBytes >= 12_000_000 * 4);
  assert.equal(DEFAULT_PROOF_LIMITS.encodedBytes, 64 * 1024 * 1024);
});

for (const bad of [
  { frameBytes: 0, totalReadBytes: 100, encodedBytes: 30 },
  { frameBytes: 10, totalReadBytes: 9, encodedBytes: 30 },
  { frameBytes: 10, totalReadBytes: 100, encodedBytes: 0 },
  { frameBytes: Infinity, totalReadBytes: 100, encodedBytes: 30 },
]) {
  test("invalid resource limit configuration is rejected", () => {
    assert.throws(() => new BudgetedProofSource(arrayBatchSource([source()], 1), bad), /limits/);
  });
}

for (const forgery of [
  { format: "different" }, { status: "device_pass" }, { inspected: -1 },
  { bytesRead: 0 }, { filename: "person.jpg" },
]) {
  test("a budget report cannot be forged into a device pass", async () => {
    const budget = new BudgetedProofSource(arrayBatchSource([source()], 1));
    await budget.read(0);
    assert.throws(() => validateProofBudget({ ...budget.report(), ...forgery }), TypeError);
  });
}

test("resource wrapper preserves caller-owned original bytes across reads", async () => {
  const input = source();
  const before = new Uint8Array(input.pixels.data);
  const budget = new BudgetedProofSource(arrayBatchSource([input], 1));
  await budget.read(0);
  assert.deepEqual(input.pixels.data, before);
  assert.equal(budget.report().inspected, 1);
});

test("invalid proof slot fails without loading any new source image", async () => {
  let calls = 0;
  const budget = new BudgetedProofSource({
    declared: 1, available: 1,
    read() { calls++; return source(); },
  });
  await assert.rejects(budget.read(9), /outside declared source/);
  assert.equal(calls, 0);
  assert.equal(budget.report().bytesRead, 0);
});
