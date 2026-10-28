/** Proof capability preflight covers unavailable/local/provider steps. */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  inspectProofReadiness,
  readinessMessage,
  validateProofReadiness,
} from "../dist/js/save/proof-readiness.js";

function look(steps) {
  const created = "2026-10-24T00:00:00.000Z";
  return {
    format: "beljour-look-recipe/1", id: "look-1234abcd", name: "Synthetic", created,
    versions: [{ version: 1, created, steps }],
  };
}

function step(tool, provider = "local") {
  return { tool, provider, strength: 25, settings: {} };
}

const engine = { enhance: (photo) => photo, beard: (photo) => photo };

test("preflight reports a checked local-only renderer without reading a photo", () => {
  const result = inspectProofReadiness(look([step("enhance")]), engine);
  assert.equal(result.status, "READY");
  assert.equal(result.availableLocal, 1);
  assert.equal(result.reason, "all_local");
  assert.deepEqual(validateProofReadiness(result), result);
  assert.match(readinessMessage(result), /local steps available/);
});

test("missing local renderer remains UNPROVEN, not a free substitute", () => {
  const result = inspectProofReadiness(look([step("enhance"), step("tan")]), engine);
  assert.equal(result.status, "UNPROVEN");
  assert.equal(result.unavailableLocal, 1);
  assert.equal(result.availableLocal, 1);
  assert.equal(result.requiresProvider, 0);
  assert.equal(result.reason, "missing_local_renderer");
  assert.match(readinessMessage(result), /cannot earn a proof PASS/);
});

test("YouCam-required step is never run by local proof engine even if renderer exists", () => {
  const result = inspectProofReadiness(look([step("makeup", "youcam")]), {
    makeup: () => { throw new Error("should not run"); },
  });
  assert.equal(result.status, "UNPROVEN");
  assert.equal(result.availableLocal, 0);
  assert.equal(result.requiresProvider, 1);
  assert.equal(result.reason, "provider_required");
});

test("multiple unavailable categories have distinct aggregate reasons", () => {
  const result = inspectProofReadiness(look([step("enhance"), step("tan"), step("makeup", "youcam")]), engine);
  assert.equal(result.reason, "mixed_unavailable");
  assert.equal(result.totalSteps, 3);
  assert.deepEqual(validateProofReadiness(result), result);
});

test("readiness reports only counts, never tool names or recipe settings", () => {
  const result = inspectProofReadiness(look([step("makeup", "youcam")]), engine);
  const text = JSON.stringify(result);
  assert(!text.includes("makeup"));
  assert(!text.includes("Synthetic"));
  assert.equal(Object.keys(result).length, 7);
});

for (const override of [
  { status: "READY" }, { availableLocal: 30 }, { totalSteps: 3 }, { reason: "all_local" },
  { requiresProvider: -1 }, { unavailableLocal: 1.5 }, { photo: "file.jpg" },
]) {
  test("mutating a readiness report cannot make a missing tool pass", () => {
    const original = inspectProofReadiness(look([step("makeup", "youcam")]), engine);
    assert.throws(() => validateProofReadiness({ ...original, ...override }), TypeError);
  });
}
