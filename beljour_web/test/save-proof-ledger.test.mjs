/** Aggregation and split-worker replay proof tests; no real photographs. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { ProofLedger, validateLedger, isReplayProof } from "../dist/js/save/proof-ledger.js";
import { proveReplay } from "../dist/js/save/proof.js";

function look() {
  const created = "2026-10-24T10:00:00.000Z";
  return {
    format: "beljour-look-recipe/1",
    id: "look-deadbeef",
    name: "Proof Study",
    created,
    versions: [{ version: 1, created, steps: [
      { tool: "enhance", strength: 20, settings: {}, provider: "local" },
    ] }],
  };
}

function photo(index = 1) {
  const data = new Uint8Array(64);
  for (let i = 0; i < data.length; i++) data[i] = (i * 7 + index * 19) % 256;
  return { width: 4, height: 4, channels: 4, data };
}

const engine = { enhance: (p) => ({ ...p, data: new Uint8Array(p.data) }) };
const good = () => proveReplay(look(), photo(), engine);
const notRun = () => proveReplay(look(), photo(), {});
const bad = () => proveReplay(look(), photo(), {
  enhance(p) {
    const data = new Uint8Array(p.data);
    data[3] = 0;
    return { ...p, data };
  },
});

test("single complete proof is a count-only passing ledger", () => {
  const ledger = new ProofLedger(1);
  ledger.add(0, good());
  const report = ledger.summary();
  assert.equal(report.format, "beljour-save-proof-ledger/1");
  assert.equal(report.status, "PASS");
  assert.equal(report.ready, true);
  assert.deepEqual(report.counts, { total: 1, completed: 1, passed: 1, failed: 0, unproven: 0, missing: 0 });
  for (const count of Object.values(report.checks)) {
    assert.equal(count.passed, 1);
    assert.equal(count.failed, 0);
  }
  assert.deepEqual(validateLedger(report), report);
  assert.equal(ledger.checked(), 1);
});

test("a blank run is UNPROVEN and cannot be called ready", () => {
  const ledger = new ProofLedger(7);
  const report = ledger.summary();
  assert.equal(report.status, "UNPROVEN");
  assert.equal(report.ready, false);
  assert.equal(report.counts.missing, 7);
  assert.equal(report.counts.completed, 0);
  assert.deepEqual(validateLedger(report), report);
});

test("partially completed batch does not inherit the successful slots", () => {
  const ledger = new ProofLedger(7);
  ledger.add(0, good());
  ledger.add(2, good());
  ledger.add(6, good());
  const report = ledger.summary();
  assert.equal(report.status, "UNPROVEN");
  assert.equal(report.counts.passed, 3);
  assert.equal(report.counts.missing, 4);
  assert.equal(report.ready, false);
});

test("one deterministic failure makes the entire batch fail", () => {
  const ledger = new ProofLedger(3);
  ledger.add(0, good());
  ledger.add(1, bad());
  ledger.add(2, good());
  const report = ledger.summary();
  assert.equal(report.status, "FAIL");
  assert.equal(report.counts.failed, 1);
  assert.equal(report.counts.passed, 2);
  assert.equal(report.counts.missing, 0);
  assert.equal(report.checks.alpha_preserved.failed, 1);
});

test("one offline/unavailable step leaves a completed batch unproven", () => {
  const ledger = new ProofLedger(3);
  ledger.add(0, good());
  ledger.add(1, notRun());
  ledger.add(2, good());
  const report = ledger.summary();
  assert.equal(report.status, "UNPROVEN");
  assert.equal(report.counts.unproven, 1);
  assert.equal(report.counts.passed, 2);
  assert.equal(report.counts.failed, 0);
});

test("failed result takes precedence over missing or unproven", () => {
  const ledger = new ProofLedger(6);
  ledger.add(0, good());
  ledger.add(1, notRun());
  ledger.add(4, bad());
  const report = ledger.summary();
  assert.equal(report.status, "FAIL");
  assert.equal(report.counts.missing, 3);
  assert.equal(report.counts.unproven, 1);
  assert.equal(report.counts.failed, 1);
});

test("slot view reveals only integer progress indices and count differences", () => {
  const ledger = new ProofLedger(6);
  assert.equal(ledger.slot(0), null);
  assert.equal(ledger.slot(-1), null);
  assert.equal(ledger.slot(99), null);
  ledger.add(5, bad());
  const slot = ledger.slot(5);
  assert.equal(slot.index, 5);
  assert.equal(slot.status, "FAIL");
  assert.equal(slot.failedChecks, 1);
  assert.equal(slot.unprovenChecks, 0);
  assert(!JSON.stringify(slot).includes("filename"));
});

test("a slot cannot be overwritten with a better result", () => {
  const ledger = new ProofLedger(2);
  ledger.add(0, bad());
  assert.throws(() => ledger.add(0, good()), /already recorded/);
  assert.equal(ledger.summary().counts.failed, 1);
});

test("negative, fractional and outside slot indices are refused", () => {
  const ledger = new ProofLedger(5);
  for (const index of [-1, -0.5, 0.5, 5, 6, Infinity, NaN]) {
    assert.throws(() => ledger.add(index, good()), /out of range/);
  }
  assert.equal(ledger.checked(), 0);
});

for (const size of [0, -1, 100001, 0.5, NaN, Infinity]) {
  test(`invalid planned batch size ${String(size)} is refused`, () => {
    assert.throws(() => new ProofLedger(size), /1 to 100000/);
  });
}

test("100000 possible slots are bounded without preallocating image buffers", () => {
  const ledger = new ProofLedger(100000);
  ledger.add(99999, good());
  assert.equal(ledger.summary().counts.missing, 99999);
  assert.equal(ledger.checked(), 1);
});

test("merging disjoint workers preserves the earlier verdicts", () => {
  const first = new ProofLedger(4);
  const second = new ProofLedger(4);
  first.add(0, good());
  first.add(2, good());
  second.add(1, bad());
  second.add(3, notRun());
  first.merge(second);
  assert.equal(first.checked(), 4);
  assert.deepEqual(first.summary().counts, {
    total: 4,
    completed: 4,
    passed: 2,
    failed: 1,
    unproven: 1,
    missing: 0,
  });
  assert.equal(first.summary().status, "FAIL");
});

test("two workers cannot silently overwrite a shared slot", () => {
  const first = new ProofLedger(3);
  const second = new ProofLedger(3);
  first.add(1, bad());
  second.add(1, good());
  assert.throws(() => first.merge(second), /overlapping/);
  assert.equal(first.summary().counts.failed, 1);
});

test("mismatched worker total refuses merge without partial updates", () => {
  const first = new ProofLedger(3);
  const second = new ProofLedger(4);
  first.add(1, good());
  second.add(2, good());
  assert.throws(() => first.merge(second), /total changed/);
  assert.equal(first.checked(), 1);
});

test("subsequent merge from an already-merged ledger fails on overlapping slots", () => {
  const first = new ProofLedger(3);
  const second = new ProofLedger(3);
  first.add(0, good());
  second.add(2, good());
  first.merge(second);
  assert.throws(() => first.merge(second), /overlapping/);
  assert.equal(first.checked(), 2);
});

test("adding a forged PASS proof must not inflate batch pass counts", () => {
  const ledger = new ProofLedger(2);
  const fake = { ...notRun(), status: "PASS" };
  assert.throws(() => ledger.add(0, fake), /contradicts/);
  assert.equal(ledger.summary().counts.completed, 0);
});

test("photo bytes are refused in proof input", () => {
  const ledger = new ProofLedger(1);
  const fake = { ...good(), data: new Uint8Array(9) };
  assert.throws(() => ledger.add(0, fake), /unregistered fields/);
});

test("summary and JSON method expose the same count-only view", () => {
  const ledger = new ProofLedger(3);
  ledger.add(0, good());
  ledger.add(2, bad());
  assert.deepEqual(ledger.toJSON(), ledger.summary());
  const json = JSON.stringify(ledger);
  assert(!json.includes("data"));
  assert(!json.includes("file"));
  assert(!json.includes("photo"));
  assert(!json.includes("face"));
});

test("serialized aggregate validates without raw per-slot details", () => {
  const ledger = new ProofLedger(3);
  ledger.add(0, good());
  ledger.add(1, good());
  ledger.add(2, good());
  const serialized = JSON.stringify(ledger);
  const parsed = JSON.parse(serialized);
  assert.deepEqual(validateLedger(parsed), ledger.summary());
  assert.equal(parsed.format, "beljour-save-proof-ledger/1");
  assert.equal(Object.keys(parsed.checks).length, 7);
});

test("falsely adding a missing PASS invalidates the report", () => {
  const ledger = new ProofLedger(2);
  ledger.add(0, good());
  const forged = structuredClone(ledger.summary());
  forged.status = "PASS";
  forged.ready = true;
  assert.throws(() => validateLedger(forged), /unsupported/);
});

test("invalid total/count relationships reject success forgery", () => {
  const ledger = new ProofLedger(1);
  ledger.add(0, good());
  const original = ledger.summary();
  for (const change of [
    { completed: 2 },
    { missing: 1 },
    { passed: 2 },
    { failed: 1 },
    { total: 2 },
    { unproven: -1 },
  ]) {
    const forged = structuredClone(original);
    forged.counts = { ...forged.counts, ...change };
    assert.throws(() => validateLedger(forged));
  }
});

test("an absent check cannot be hidden in a count-only report", () => {
  const ledger = new ProofLedger(1);
  ledger.add(0, good());
  const forged = structuredClone(ledger.summary());
  delete forged.checks.alpha_preserved;
  assert.throws(() => validateLedger(forged), /check set differs/);
});

test("a check denominator must equal the entire completed population", () => {
  const ledger = new ProofLedger(2);
  ledger.add(0, good());
  const forged = structuredClone(ledger.summary());
  forged.checks.output_shape.completed = 0;
  assert.throws(() => validateLedger(forged));
});

test("a passing population cannot exceed any individual check PASS count", () => {
  const ledger = new ProofLedger(2);
  ledger.add(0, good());
  ledger.add(1, good());
  const forged = structuredClone(ledger.summary());
  forged.checks.output_shape.passed = 1;
  forged.checks.output_shape.failed = 1;
  assert.throws(() => validateLedger(forged), /exceeds/);
});

test("all check names are required, including input validation", () => {
  const ledger = new ProofLedger(1);
  ledger.add(0, good());
  const forged = structuredClone(ledger.summary());
  forged.checks.extra_check = forged.checks.input_valid;
  assert.throws(() => validateLedger(forged), /check set differs/);
});

test("machine-readable proof indicator accepts only validated records", () => {
  assert.equal(isReplayProof(good()), true);
  assert.equal(isReplayProof({ ...good(), extra: 1 }), false);
  assert.equal(isReplayProof(null), false);
  assert.equal(isReplayProof({ format: "future", status: "PASS" }), false);
});
