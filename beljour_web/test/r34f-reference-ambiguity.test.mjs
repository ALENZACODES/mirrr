/** Nearby-reference inspection in the browser: existing tolerances, refusals stay refused.
 * In-house references and drawn colours only. Author: John Khan.
 */
import assert from "node:assert/strict";
import test from "node:test";
import * as A from "../dist/js/engines/shade/reference-ambiguity.js";
import { findFromPixels, NO_WHITE } from "../dist/js/engines/shade/finder.js";
import { shadeById } from "../dist/js/engines/shade/loaders.js";
import { BASES, caseReading } from "./r34f-scene.mjs";

test("the limit is the existing full-confidence match distance", () => {
  assert.equal(A.nearbyLimit(), 2.5);
});

test("alternatives are near, never lighter and never the selection", () => {
  const seen = { clear: 0, ambiguous: 0 };
  for (const [, base] of BASES) {
    const [result] = caseReading(base, "daylight");
    const d = A.inspectReferenceAmbiguity(result);
    seen[d.status] += 1;
    assert.equal(d.selected_id, result.best.id);
    assert.equal(d.confidence, result.confidence.overall);
    for (const alt of d.alternatives) {
      assert.notEqual(alt.record.id, d.selected_id);
      assert.ok(alt.delta_e <= 2.5 && alt.lighter_by <= 1 && alt.delta_e >= d.selected_delta_e);
    }
    for (const alt of A.publicAmbiguity(d).alternatives) assert.equal(shadeById(alt.id, "reference").name, alt.name);
  }
  assert.ok(seen.clear > 0 && seen.ambiguous > 0);
});

test("refused readings and foreign selections get no alternatives", () => {
  const refused = A.inspectReferenceAmbiguity(findFromPixels({}, NO_WHITE));
  assert.deepEqual([refused.status, refused.code, refused.alternatives.length], ["refused", "reading_refused", 0]);
  const [result] = caseReading(BASES[5][1], "daylight");
  const moved = A.inspectReferenceAmbiguity({ ...result, best: { ...result.best, id: "LG-01C" } });
  assert.deepEqual([moved.status, moved.code], ["refused", "incompatible_baseline"]);
});
