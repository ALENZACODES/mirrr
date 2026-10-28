// R3: explicit endpoint metadata on recorded results, in the badge and the API client.
// Author: John Khan.
import assert from "node:assert/strict";
import { test } from "node:test";

import { RETIRED_ENDPOINTS, ROUTE_ENDPOINTS, badgeModel, fromLegacyMeta, isRetired, provenanceOf, withEndpoint } from "../dist/js/ui/provenance.js";

test("legacy replies use the top-level endpoint and lifecycle", () => {
  const p = fromLegacyMeta({ source: "demo", units_spent: 0, endpoint: "aging", lifecycle: "being_replaced" });
  assert.equal(p.endpoint, "aging");
  assert.equal(p.provider, "retired");
  assert.equal(badgeModel(p).label, "Unavailable saved result");
  const kept = fromLegacyMeta({ source: "demo", units_spent: 0, endpoint: "makeup-vto", lifecycle: "active" });
  assert.equal(kept.provider, "youcam");
  assert.equal(badgeModel(kept).label, "Recorded API example");
});

test("a route hint fills in the endpoint for replies older than round 3", () => {
  const meta = { source: "demo", units_spent: 0, synthetic: false };
  assert.equal(provenanceOf(meta).endpoint, null);
  const hinted = provenanceOf(meta, "/api/skin/analyze");
  assert.equal(hinted.endpoint, "skin-analysis");
  assert.equal(badgeModel(hinted).label, "Unavailable saved result");
  assert.equal(provenanceOf(meta, "/api/makeup/try").provider, "youcam");
  assert.equal(provenanceOf(meta, "/api/unknown").endpoint, null);
});

test("withEndpoint only fills gaps", () => {
  const old = { source: "demo", units_spent: 0 };
  assert.equal(withEndpoint("/api/transform/aging", old).endpoint, "aging");
  assert.equal(withEndpoint("/api/transform/aging?x=1", old).endpoint, "aging");
  const named = { source: "demo", units_spent: 0, endpoint: "makeup-vto" };
  assert.equal(withEndpoint("/api/transform/aging", named), named);
  const plain = { status: "done" };
  assert.equal(withEndpoint("/api/transform/aging", plain), plain, "not a result reply");
  assert.equal(withEndpoint("/api/session", old), old);
  assert.equal(withEndpoint("/api/skin/analyze", null), null);
});

test("retired endpoints match the server list and only recorded results are retired", () => {
  assert.deepEqual([...RETIRED_ENDPOINTS].sort(), ["aging", "face-attr-analysis", "face-lift", "face-reshape",
    "skin-analysis", "skin-simulation", "skin-tone-analysis", "teeth-whiten"]);
  for (const endpoint of Object.values(ROUTE_ENDPOINTS)) assert.equal(typeof endpoint, "string");
  const base = { source: "recorded", provider: "youcam", endpoint: "teeth-whiten", endpoint_version: null, pipeline_version: "",
    units: 0, cache_hit: false, synthetic: false, created: null, badge: "", simulation: false };
  assert.equal(isRetired(base), true);
  assert.equal(isRetired({ ...base, source: "local", provider: "local" }), false);
  assert.equal(isRetired({ ...base, endpoint: "makeup-vto+face-lift" }), true);
  assert.equal(isRetired({ ...base, endpoint: "makeup-vto", provider: "retired" }), true);
});
