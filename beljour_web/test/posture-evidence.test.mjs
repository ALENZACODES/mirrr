/** Posture metrics are synthetic-only; no release vote is manufactured. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import * as Po from "../dist/js/engines/local/posture.js";
import * as Evidence from "../dist/js/body/posture-evidence.js";

const P = JSON.parse(readFileSync(new URL("../../parity/posture-levels-r25e.json", import.meta.url), "utf8"));
const controls = (c) => Po.makeControls(c.view, c.points, c.width, c.height, c.facing, c.estimated, c.manual);

test("one numerical audit row per synthetic vector, no quality-release PASS", () => {
  assert.equal(P.cases.length, 7);
  for (const sample of P.cases) {
    const c = controls(sample.controls);
    for (const variant of sample.plans) {
      const p = Po.postureLevelPlan(c, sample.fix, variant.level);
      const row = Evidence.auditPosturePlan(p, variant.level);
      assert.equal(row.fix, sample.fix);
      assert.equal(row.level, variant.level);
      assert.equal(row.evidence_class, "synthetic_or_unrated");
      assert.equal(row.release_status, "NOT_RUN");
      assert.ok(!JSON.stringify(row).includes("face_sha256"));
      assert.equal(typeof row.checks_ok, "boolean");
    }
  }
});

test("full-level reports meet the preregistered synthetic geometry floor", () => {
  for (const sample of P.cases) {
    const p = Po.postureLevelPlan(controls(sample.controls), sample.fix, 5);
    const row = Evidence.auditPosturePlan(p, 5);
    assert.equal(row.checks_ok, true, `${sample.fix}: ${row.reasons}`);
    assert.equal(row.reasons.length, 0);
    assert.ok(row.reduction >= Evidence.MIN_REDUCTION_AT_FULL);
    assert.ok(row.move_px <= row.cap_px + 1e-6);
  }
});

test("tampered caps and excessive deviations fail instead of being hidden", () => {
  const first = P.cases.find((e) => e.fix === "lean");
  const p = Po.postureLevelPlan(controls(first.controls), first.fix, 5);
  const tamperedCap = { ...p, capPx: 0.001 };
  const cap = Evidence.auditPosturePlan(tamperedCap, 5);
  assert.equal(cap.checks_ok, false);
  assert.ok(cap.reasons.includes("movement_over_cap"));
  const worse = Evidence.auditPosturePlan({ ...p, measureAfter: 3 * p.measureBefore }, 5);
  assert.equal(worse.checks_ok, false);
  assert.ok(worse.reasons.includes("deviation_increased"));
});

test("simulation label never pretends an edited photo is a physical correction", () => {
  assert.equal(Evidence.postureEvidenceExportLabel(), Po.SIMULATION_LABEL);
  assert.match(Evidence.postureEvidenceExportLabel(), /not medical advice/);
});
