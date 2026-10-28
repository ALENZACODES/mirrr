// R31F two-tone parity: the browser recomputes the 30 Python cases in
// parity/colour-sim-r31f.json (written by api/plumb_api/engines/concealer/colour_parity.py).
// RGB, shares, levels and codes must match exactly; CIEDE2000 within 1e-6. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fibreReading } from "../dist/js/commerce/shade-support.js";
import { planTwoTone } from "../dist/js/commerce/two-tone.js";

const PARITY = JSON.parse(readFileSync(new URL("../../parity/colour-sim-r31f.json", import.meta.url), "utf8"));

test("all 30 cases match the Python plan", () => {
  assert.equal(PARITY.cases.length, 30);
  assert.equal(PARITY.synthetic, true);
  for (const c of PARITY.cases) {
    const plan = planTwoTone(fibreReading(c.reading_lab, "neutral"), c.first_id, c.second_id,
      { approveLighter: c.approve_lighter });
    assert.equal(plan.code, c.code, c.id);
    assert.equal(plan.reading_level, c.reading_level, c.id);
    if (c.code !== null) { assert.equal(plan.best, null, c.id); continue; }
    assert.equal(plan.best.percent, c.second_percent, c.id);
    assert.deepEqual([...plan.best.rgb], c.rgb, c.id);
    assert.equal(plan.best.level, c.level, c.id);
    assert.ok(Math.abs(plan.best.delta_e - c.delta_e) <= PARITY.tolerance_delta_e, `${c.id} delta_e`);
    plan.best.lab.forEach((v, i) => assert.ok(Math.abs(v - c.lab[i]) <= 1e-6, `${c.id} lab ${i}`));
  }
});

test("the cases include refusals and an opt-in", () => {
  const codes = new Set(PARITY.cases.map((c) => c.code));
  assert.ok(codes.has("too_far") && codes.has("too_light") && codes.has(null));
  assert.ok(PARITY.cases.some((c) => c.approve_lighter));
});
