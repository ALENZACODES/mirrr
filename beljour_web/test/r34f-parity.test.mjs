/** The browser r34f reviews against the 144 Python cases in parity/skin-sensitivity-r34f.json.
 * Synthetic drawn colours under integer casts. Author: John Khan.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { auditIlluminationSensitivity } from "../dist/js/engines/shade/illumination-sensitivity.js";
import { inspectReferenceAmbiguity } from "../dist/js/engines/shade/reference-ambiguity.js";
import { assessShadeSafety } from "../dist/js/engines/shade/shade-safety.js";
import { P, caseReading } from "./r34f-scene.mjs";

const near = (a, b, what) => assert.ok(Math.abs(a - b) <= P.tolerance, `${what}: ${a} vs ${b}`);

test("all 144 cases agree with Python", () => {
  assert.equal(P.cases.length, 144);
  for (const c of P.cases) {
    const where = `${c.reference}/${c.cast}`;
    const [result, sample, estimates] = caseReading(c.base, c.cast);
    assert.equal(result.refused, c.refused, where);
    assert.equal(result.best?.id ?? null, c.best, where);
    near(result.confidence.overall, c.confidence, `${where} confidence`);
    estimates.slice(0, 2).forEach((e, i) => e.gains.forEach((g, k) =>
      near(g, c.gains[["neutral", "grey_world"][i]][k], `${where} gains`)));
    if (c.measured_lab !== null) result.measured_lab.forEach((v, i) => near(v, c.measured_lab[i], `${where} lab`));
    const sens = auditIlluminationSensitivity(result, sample, estimates);
    assert.deepEqual([sens.status, sens.code], [c.sensitivity.status, c.sensitivity.code], where);
    sens.outcomes.forEach((o, i) => {
      const py = c.sensitivity.outcomes[i];
      assert.deepEqual([o.mode, o.nearest_id, o.within_limits], [py.mode, py.nearest, py.within_limits], where);
      near(o.delta_e, py.delta_e, `${where} delta_e`);
      o.lab.forEach((v, k) => near(v, py.lab[k], `${where} outcome lab`));
    });
    const amb = inspectReferenceAmbiguity(result);
    assert.deepEqual([amb.status, amb.code, amb.alternatives.map((m) => m.record.id)],
      [c.ambiguity.status, c.ambiguity.code, c.ambiguity.alternatives], where);
    const safety = assessShadeSafety(result, sens, amb);
    assert.deepEqual([safety.status, [...safety.reasons]], [c.safety.status, c.safety.reasons], where);
  }
});
