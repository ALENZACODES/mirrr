// R31F tinted fibre workflow in the browser, on the drawn hair block.
// The literal values are shared with api/tests/test_r31f_tinted_workflow.py. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { TintedFibreWorkflow, planTint } from "../dist/js/commerce/colour-workflow.js";
import { HEAD, SWATCH, readings, scene } from "./helpers/r31f-fibre-scene.mjs";

if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });

test("agreeing readings choose the swatch; disagreeing or uncorrected ones refuse", async () => {
  const plan = planTint(readings());
  assert.deepEqual([plan.refused, plan.swatch_id, plan.rgb], [false, SWATCH, [63, 44, 38]]);
  for (const [rows, code] of [[readings([-0.3, 0.3], "none"), "uncorrected_lighting"],
    [readings([0, 12]), "unstable_swatch"], [readings([0, 30]), "mixed_lighting"]]) {
    const refused = planTint(rows);
    assert.deepEqual([refused.code, refused.swatch_id], [code, null]);
    const { image, region, scalp } = scene();
    const receipt = await new TintedFibreWorkflow().render(refused, image, region, scalp, { landmarks: HEAD });
    assert.deepEqual([receipt.status, receipt.code, receipt.changed_pixels], ["refused", code, 0]);
  }
});

test("five levels share one prepared zone, spend nothing and match Python", async () => {
  const { image, region, scalp } = scene();
  const workflow = new TintedFibreWorkflow();
  const receipts = await workflow.renderLevels(planTint(readings()), image, region, scalp, { landmarks: HEAD });
  assert.equal(workflow.session.zoneGridCalls, 1);
  assert.deepEqual(receipts.map((r) => r.status), ["unchanged", "rendered_closer", "rendered_closer",
    "rendered_closer", "rendered_closer"]);
  assert.deepEqual(receipts.map((r) => r.changed_pixels), [0, 820, 820, 820, 820]);
  assert.deepEqual(receipts.map((r) => r.evidence?.after_delta_e ?? null), [null, 34.6777, 26.0886, 25.0257, 25.0391]);
  assert.ok(receipts.every((r) => r.provider_calls === 0));
});

test("moving frames are preview-only; missing landmarks and bad levels refuse", async () => {
  const { image, region, scalp } = scene();
  const workflow = new TintedFibreWorkflow();
  const moving = await workflow.render(planTint(readings()), image, region, scalp,
    { landmarks: HEAD, level: 4.2, phase: "moving" });
  assert.deepEqual([moving.status, moving.evidence, moving.changed_pixels], ["preview_only", null, 820]);
  assert.equal((await workflow.render(planTint(readings()), image, region, scalp, { landmarks: null })).code, "no_mesh");
  await assert.rejects(workflow.render(planTint(readings()), image, region, scalp, { landmarks: HEAD, level: 5.5 }));
});

test("the primary box limits the audited region", async () => {
  const { image, region, scalp } = scene();
  const receipt = await new TintedFibreWorkflow().render(planTint(readings()), image, region, scalp,
    { landmarks: HEAD, level: 3, primaryBox: [22, 12, 48, 62] });
  assert.equal(receipt.status, "rendered_closer");
  assert.deepEqual([receipt.evidence.region_pixels, receipt.changed_pixels], [400, 400]);
});

test("receipts carry no photo, mask, landmark or hash", async () => {
  const { image, region, scalp } = scene();
  const text = JSON.stringify(await new TintedFibreWorkflow().render(planTint(readings()), image, region, scalp,
    { landmarks: HEAD }));
  for (const word of ["hash", "mask", "landmark", "image", "points", "temple"]) assert.ok(!text.includes(word), word);
  assert.ok(text.length < 1200);
});
