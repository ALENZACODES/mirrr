/** Source-of-truth settings fingerprint and count-only proof bundle tests. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import {
  bindReport,
  canonical,
  createProofPlan,
  describeProof,
  hashSettings,
  proofAvailability,
  verifyProofBundle,
} from "../dist/js/save/proof-plan.js";
import { ProofLedger } from "../dist/js/save/proof-ledger.js";
import { proveReplay } from "../dist/js/save/proof.js";

function recipe() {
  const created = "2026-10-24T00:00:00.000Z";
  return {
    format: "beljour-look-recipe/1",
    id: "look-99887766",
    name: "Morning Look",
    created,
    versions: [{ version: 1, created, steps: [
      { tool: "enhance", strength: 33, settings: { tint: "neutral", noise: 1 }, provider: "local" },
      { tool: "skin", strength: 25, settings: { opacity: 0.3 }, provider: "local" },
    ] }],
  };
}

function image() {
  const data = new Uint8Array(3 * 3 * 4);
  for (let index = 0; index < data.length; index++) data[index] = (index * 3 + 7) % 256;
  return { width: 3, height: 3, channels: 4, data };
}

const transforms = {
  enhance: (p) => ({ ...p, data: new Uint8Array(p.data) }),
  skin: (p) => ({ ...p, data: new Uint8Array(p.data) }),
};

function makeReport(total, status = "PASS") {
  const ledger = new ProofLedger(total);
  for (let index = 0; index < total; index++) {
    const proof = status === "PASS"
      ? proveReplay(recipe(), image(), transforms)
      : proveReplay(recipe(), image(), {});
    ledger.add(index, proof);
  }
  return ledger.summary();
}

test("canonical JSON is independent of settings key insertion order", () => {
  const first = { name: "a", settings: { b: 3, a: { z: true, y: 1 } } };
  const second = { settings: { a: { y: 1, z: true }, b: 3 }, name: "a" };
  assert.equal(canonical(first), canonical(second));
  assert.equal(canonical([1, "x", false, null]), '[1,"x",false,null]');
});

test("canonical JSON does not reorder recipe arrays", () => {
  assert.notEqual(canonical(["enhance", "skin"]), canonical(["skin", "enhance"]));
  assert.notEqual(canonical({ a: 10 }), canonical({ a: 11 }));
});

test("canonical serializing NaN and Infinity is forbidden", () => {
  assert.throws(() => canonical({ setting: NaN }), /non-finite/);
  assert.throws(() => canonical({ setting: Infinity }), /non-finite/);
  assert.throws(() => canonical({ setting: undefined }), /undefined/);
  assert.throws(() => canonical(() => 3), /unsupported/);
});

test("SHA-256 equals an independent Node cryptographic reference", async () => {
  const text = "offline settings review; no face bytes";
  const expected = createHash("sha256").update(text).digest("hex");
  assert.equal(await hashSettings(text), expected);
  assert.match(expected, /^[0-9a-f]{64}$/);
});

test("the plan includes only validated recipe digest and declared checks", async () => {
  const plan = await createProofPlan(recipe(), 3);
  assert.equal(plan.format, "beljour-save-proof-plan/1");
  assert.equal(plan.declaredItems, 3);
  assert.equal(plan.criteria.length, 7);
  assert.equal(plan.method, "local-deterministic-replay");
  assert.match(plan.recipeDigest, /^[0-9a-f]{64}$/);
  assert(!JSON.stringify(plan).includes("Morning Look"));
  assert(!JSON.stringify(plan).includes("filename"));
  assert(!JSON.stringify(plan).includes("face"));
});

test("different settings create different plan identities", async () => {
  const first = recipe();
  const second = recipe();
  second.versions[0].steps[0].strength += 1;
  const a = await createProofPlan(first, 1);
  const b = await createProofPlan(second, 1);
  assert.notEqual(a.recipeDigest, b.recipeDigest);
});

test("different saved versions generate different plan identities", async () => {
  const first = recipe();
  const second = recipe();
  second.versions.push({
    version: 2,
    created: "2026-10-24T01:00:00.000Z",
    steps: [{ tool: "enhance", strength: 1, settings: {}, provider: "local" }],
  });
  const a = await createProofPlan(first, 1);
  const b = await createProofPlan(second, 1);
  assert.notEqual(a.recipeDigest, b.recipeDigest);
});

test("a complete passing ledger can bind a plan", async () => {
  const plan = await createProofPlan(recipe(), 2);
  const report = makeReport(2);
  const bundle = bindReport(plan, report);
  assert.equal(bundle.status, "PASS");
  assert.equal(bundle.report.counts.passed, 2);
  assert.deepEqual(await verifyProofBundle(bundle, recipe()), bundle);
  assert.match(describeProof(bundle), /not a real-face, identity, realism or fairness/i);
});

test("an incomplete ledger binds but never becomes PASS", async () => {
  const plan = await createProofPlan(recipe(), 3);
  const ledger = new ProofLedger(3);
  ledger.add(0, proveReplay(recipe(), image(), transforms));
  const bundle = bindReport(plan, ledger.summary());
  assert.equal(bundle.status, "UNPROVEN");
  assert.equal(bundle.report.counts.missing, 2);
  assert.equal(bundle.report.ready, false);
  assert.deepEqual(await verifyProofBundle(bundle, recipe()), bundle);
});

test("unavailable tool is still UNPROVEN after cryptographic binding", async () => {
  const plan = await createProofPlan(recipe(), 1);
  const bundle = bindReport(plan, makeReport(1, "UNPROVEN"));
  assert.equal(bundle.status, "UNPROVEN");
  assert.match(describeProof(bundle), /UNPROVEN/);
});

test("tampering with recipe after a proof invalidates the bundle", async () => {
  const base = recipe();
  const plan = await createProofPlan(base, 1);
  const bundle = bindReport(plan, makeReport(1));
  const changed = recipe();
  changed.versions[0].steps[0].settings.tint = "warmer";
  await assert.rejects(verifyProofBundle(bundle, changed), /changed since/);
});

test("tampering with recipe order invalidates the bundle", async () => {
  const base = recipe();
  const plan = await createProofPlan(base, 1);
  const bundle = bindReport(plan, makeReport(1));
  const changed = recipe();
  changed.versions[0].steps.reverse();
  await assert.rejects(verifyProofBundle(bundle, changed), /changed since/);
});

test("a forged status cannot change the measurements", async () => {
  const plan = await createProofPlan(recipe(), 1);
  const original = bindReport(plan, makeReport(1, "UNPROVEN"));
  const forged = { ...original, status: "PASS" };
  await assert.rejects(verifyProofBundle(forged, recipe()), /differs/);
});

test("a forged plan hash fails local validation", async () => {
  const plan = await createProofPlan(recipe(), 1);
  const forged = { ...plan, recipeDigest: "a".repeat(64) };
  const bundle = bindReport(forged, makeReport(1));
  await assert.rejects(verifyProofBundle(bundle, recipe()), /changed since/);
});

test("invalid planned data sizes are refused", async () => {
  for (const count of [0, -1, 100001, 1.1, NaN, Infinity]) {
    await assert.rejects(createProofPlan(recipe(), count), /declared/);
  }
});

test("invalid recipes cannot be sealed into a plan", async () => {
  const base = recipe();
  base.versions[0].steps[0].settings.somePixel = { data: [1, 2, 3] };
  await assert.rejects(createProofPlan(base, 1));
});

test("plan and report denominators must match", async () => {
  const plan = await createProofPlan(recipe(), 3);
  assert.throws(() => bindReport(plan, makeReport(2)), /different/);
});

test("only the preregistered check order is accepted", async () => {
  const plan = await createProofPlan(recipe(), 1);
  const changed = structuredClone(plan);
  changed.criteria.reverse();
  assert.throws(() => bindReport(changed, makeReport(1)), /altered/);
});

test("unknown plan fields are rejected", async () => {
  const plan = await createProofPlan(recipe(), 1);
  assert.throws(() => bindReport({ ...plan, photoId: "private-123" }, makeReport(1)), /fields/);
});

test("an incorrect method label cannot silently redefine the quality gate", async () => {
  const plan = await createProofPlan(recipe(), 1);
  assert.throws(() => bindReport({ ...plan, method: "real-face-quality-pass" }, makeReport(1)), /format/);
});

test("a corrupted receipt is not accepted on reimport", async () => {
  const plan = await createProofPlan(recipe(), 1);
  const bundle = bindReport(plan, makeReport(1));
  const forged = { ...bundle, note: "all faces passed" };
  await assert.rejects(verifyProofBundle(forged, recipe()), /unknown fields/);
});

test("a raw unknown bundle cannot pass", async () => {
  await assert.rejects(verifyProofBundle(null, recipe()), /invalid/);
  await assert.rejects(verifyProofBundle({ format: "future" }, recipe()), /unknown fields/);
});

test("proof availability never promises identity verification", () => {
  assert.deepEqual(proofAvailability(null), { status: "UNPROVEN", provenance: "not_measured" });
  const measured = proveReplay(recipe(), image(), transforms);
  assert.deepEqual(proofAvailability(measured), {
    status: "PASS",
    provenance: "synthetic_or_local_mechanical_checks_only",
  });
  assert.equal(proofAvailability({ ...measured, format: "future" }).status, "UNPROVEN");
});

test("a serialized receipt remains small and uses no source photo bytes", async () => {
  const plan = await createProofPlan(recipe(), 5);
  const bundle = bindReport(plan, makeReport(5));
  const text = JSON.stringify(bundle);
  assert(text.length < 8192);
  assert(!text.includes("input.png"));
  assert(!text.includes("GPS"));
  assert(!text.includes("patient"));
  assert(!text.includes("blob:"));
  assert.deepEqual(await verifyProofBundle(JSON.parse(text), recipe()), bundle);
});
