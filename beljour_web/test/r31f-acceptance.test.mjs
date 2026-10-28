// R31F aggregate acceptance in the browser. Mirrors api/tests/test_r31f_acceptance.py
// with the same receipts and counts. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { summarizeColourAcceptance } from "../dist/js/commerce/colour-acceptance.js";
import { TintedFibreWorkflow, planTint } from "../dist/js/commerce/colour-workflow.js";
import { HEAD, readings, scene } from "./helpers/r31f-fibre-scene.mjs";

if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });

async function receipts() {
  const { image, region, scalp } = scene();
  const workflow = new TintedFibreWorkflow();
  const plan = planTint(readings());
  const rows = await workflow.renderLevels(plan, image, region, scalp, { landmarks: HEAD });
  rows.push(await workflow.render(plan, image, region, scalp, { landmarks: HEAD, phase: "moving", level: 2.5 }));
  rows.push(await workflow.render(planTint(readings([-0.3, 0.3], "none")), image, region, scalp, { landmarks: HEAD }));
  return rows;
}

test("every attempt stays in the denominator", async () => {
  const report = summarizeColourAcceptance(await receipts());
  assert.deepEqual([report.attempted, report.released], [7, 6]);
  assert.deepEqual(report.counts, { rendered_closer: 4, adverse_shift: 0, unchanged: 1, refused: 1, preview_only: 1 });
  assert.ok(Math.abs(report.closer_rate - 4 / 7) < 1e-6);
  assert.equal(report.worst_after_delta_e, 34.6777);
});

test("release_pass needs external evidence and all closer", async () => {
  const rows = await receipts();
  assert.equal(summarizeColourAcceptance(rows).release_pass, false);
  assert.equal(summarizeColourAcceptance(rows, { externalEvidence: true }).release_pass, false);
  const closer = rows.filter((r) => r.status === "rendered_closer");
  assert.equal(summarizeColourAcceptance(closer).release_pass, false);
  assert.equal(summarizeColourAcceptance(closer, { externalEvidence: true }).release_pass, true);
  assert.equal(summarizeColourAcceptance([], { externalEvidence: true }).release_pass, false);
});

test("bad receipts are refused and the report has counts only", async () => {
  assert.throws(() => summarizeColourAcceptance([{ status: "approved" }]), RangeError);
  assert.throws(() => summarizeColourAcceptance([{ status: "preview_only", phase: "release" }]), RangeError);
  const out = summarizeColourAcceptance(await receipts());
  assert.ok(!JSON.stringify(out).includes("natural"));
  assert.equal(out.evidence, "synthetic_local");
});
