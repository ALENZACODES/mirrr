/** R16B browser acceptance-contract depth tests. Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CONTRACTS,
  auditCatalogue,
  contract,
  evidenceStatus,
  evaluate,
  grouped,
  metricGate,
  prerequisites,
  releaseSummary,
} from "../dist/js/engines/r16b_acceptance.js";

const cases = [
  {
    feature: "W45",
    group: "lips",
    testId: "W45_TEST_ANATOMICAL_CAP",
    adult: true,
    region: false,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["locality", "zero_identity", "geometry_cap", "real_face_review"],
  },
  {
    feature: "W46",
    group: "lips",
    testId: "W46_TEST_EDGE_FOLLOW",
    adult: false,
    region: false,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["locality", "edge_alignment", "daylight_review"],
  },
  {
    feature: "W47",
    group: "lips",
    testId: "W47_TEST_FADE_ORDER",
    adult: true,
    region: false,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["fade_order", "copy_review", "deep_lip_review"],
  },
  {
    feature: "W48",
    group: "lips",
    testId: "W48_TEST_UPPER_LIP_BOUND",
    adult: true,
    region: false,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["geometry_cap", "locality", "copy_review"],
  },
  {
    feature: "W49",
    group: "lips",
    testId: "W49_TEST_STYLE_NOT_DOSE",
    adult: true,
    region: false,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["geometry_cap", "copy_review", "real_face_review"],
  },
  {
    feature: "W50",
    group: "smile",
    testId: "W50_TEST_CHECKED_GUM_ONLY",
    adult: true,
    region: true,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["annotation_provenance", "locality", "copy_review"],
  },
  {
    feature: "W51",
    group: "smile",
    testId: "W51_TEST_CHECKED_TEETH_ONLY",
    adult: true,
    region: true,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["annotation_provenance", "shade_review", "irreversibility_copy"],
  },
  {
    feature: "W52",
    group: "smile",
    testId: "W52_TEST_KEEP_FIRST_CLASS",
    adult: true,
    region: true,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["annotation_provenance", "midline_check", "copy_review"],
  },
  {
    feature: "W53",
    group: "smile",
    testId: "W53_TEST_GUM_GUIDE_DISCLOSURE",
    adult: true,
    region: true,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["annotation_provenance", "gum_line_check", "copy_review"],
  },
  {
    feature: "W54",
    group: "lips",
    testId: "W54_TEST_TEETH_UNCHANGED",
    adult: false,
    region: false,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["protected_teeth", "locality", "copy_review"],
  },
  {
    feature: "W55",
    group: "lips",
    testId: "W55_TEST_TEXTURE_RETENTION",
    adult: false,
    region: false,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["texture_retention", "alpha_identity", "locality"],
  },
  {
    feature: "W56",
    group: "lips",
    testId: "W56_TEST_DETERMINISTIC_WEAR",
    adult: false,
    region: false,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["determinism", "wear_order", "copy_review"],
  },
  {
    feature: "W57",
    group: "lips",
    testId: "W57_TEST_PIGMENT_PRESERVATION",
    adult: false,
    region: false,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["locality", "pigmentation_review", "copy_review"],
  },
  {
    feature: "W58",
    group: "smile",
    testId: "W58_TEST_CHECKED_FRAME_STABILITY",
    adult: true,
    region: false,
    sequence: true,
    health: false,
    cultural: false,
    evidence: ["frame_provenance", "temporal_stability", "real_sequence_review"],
  },
  {
    feature: "W77",
    group: "skin_more",
    testId: "W77_TEST_TEXTURE_FIRST_TINT",
    adult: false,
    region: false,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["texture_retention", "zero_identity", "fairness_slice"],
  },
  {
    feature: "W78",
    group: "skin_more",
    testId: "W78_TEST_DRY_ZONE_BOUND",
    adult: false,
    region: false,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["locality", "dry_zone_review", "copy_review"],
  },
  {
    feature: "W79",
    group: "skin_more",
    testId: "W79_TEST_DELTA_REDUCTION",
    adult: false,
    region: true,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["region_delta", "locality", "fairness_slice"],
  },
  {
    feature: "W80",
    group: "skin_more",
    testId: "W80_TEST_NO_EFFICACY_CLAIM",
    adult: false,
    region: true,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["locality", "cast_order", "copy_review"],
  },
  {
    feature: "W81",
    group: "skin_more",
    testId: "W81_TEST_USER_MARKED_ONLY",
    adult: false,
    region: true,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["locality", "corrector_bound", "fairness_slice"],
  },
  {
    feature: "W82",
    group: "skin_more",
    testId: "W82_TEST_NO_DIAGNOSIS",
    adult: false,
    region: true,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["locality", "corrector_bound", "copy_review"],
  },
  {
    feature: "W83",
    group: "skin_more",
    testId: "W83_TEST_CONSENT_NO_PREDICTION",
    adult: false,
    region: false,
    sequence: false,
    health: true,
    cultural: false,
    evidence: ["consent", "local_storage_review", "copy_review"],
  },
  {
    feature: "W84",
    group: "skin_more",
    testId: "W84_TEST_ZERO_LINE_BLUR",
    adult: false,
    region: false,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["texture_retention", "line_blur_zero", "copy_review"],
  },
  {
    feature: "W85",
    group: "skin_more",
    testId: "W85_TEST_CHECKED_PLACEMENT",
    adult: false,
    region: true,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["placement", "locality", "calibration_copy"],
  },
  {
    feature: "W86",
    group: "skin_more",
    testId: "W86_TEST_CHECKED_FRAME_FIT",
    adult: false,
    region: true,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["placement", "symmetry", "protected_regions"],
  },
  {
    feature: "W87",
    group: "skin_more",
    testId: "W87_TEST_MANUAL_NAIL_REGION",
    adult: false,
    region: true,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["annotation_provenance", "locality", "alpha_identity"],
  },
  {
    feature: "W88",
    group: "skin_more",
    testId: "W88_TEST_HAIR_PROTECTION",
    adult: false,
    region: true,
    sequence: false,
    health: false,
    cultural: true,
    evidence: ["locality", "hair_protection", "cultural_review"],
  },
  {
    feature: "W89",
    group: "skin_more",
    testId: "W89_TEST_EDITABLE_BUNDLE",
    adult: false,
    region: false,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["editability", "copy_review", "zero_identity"],
  },
  {
    feature: "W90",
    group: "skin_more",
    testId: "W90_TEST_PRESERVE_FIRST_CLASS",
    adult: false,
    region: true,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["preserve_identity", "determinism", "locality"],
  },
  {
    feature: "W91",
    group: "skin_more",
    testId: "W91_TEST_LIGHTING_CAVEAT",
    adult: false,
    region: true,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["region_delta", "locality", "lighting_caveat"],
  },
  {
    feature: "W92",
    group: "skin_more",
    testId: "W92_TEST_TEXTURE_PRESERVATION",
    adult: false,
    region: false,
    sequence: false,
    health: false,
    cultural: false,
    evidence: ["texture_retention", "copy_review", "fairness_slice"],
  },
];

for (const row of cases) {
  test(`${row.feature}: browser acceptance contract matches binding matrix`, () => {
    const actual = contract(row.feature);
    assert.equal(actual.group, row.group);
    assert.equal(actual.testId, row.testId);
    assert.equal(actual.requiresAdult, row.adult);
    assert.equal(actual.requiresCheckedRegion, row.region);
    assert.equal(actual.requiresCheckedSequence, row.sequence);
    assert.equal(actual.requiresHealthConsent, row.health);
    assert.equal(actual.requiresCulturalReview, row.cultural);
    assert.deepEqual(actual.releaseEvidence, row.evidence);
    assert.ok(actual.passDefinition.length > 20);
  });

  test(`${row.feature}: complete prerequisites pass`, () => {
    const result = prerequisites(row.feature, {
      adultConfirmed: true,
      checkedRegions: 2,
      checkedFrames: 3,
      healthConsent: true,
      culturalReview: true,
    });
    assert.equal(result.passed, true);
    assert.deepEqual(result.reasons, []);
  });

  test(`${row.feature}: exact release evidence is required`, () => {
    const complete = evidenceStatus(row.feature, row.evidence);
    assert.equal(complete.passed, true);
    assert.deepEqual(complete.missing, []);
    const partial = evidenceStatus(row.feature, row.evidence.slice(0, -1));
    assert.equal(partial.passed, false);
    assert.deepEqual(partial.missing, [row.evidence.at(-1)]);
  });
}

function goodMetrics(feature) {
  const metrics = {
    outside_error: 0,
    alpha_identity: true,
    zero_identity: true,
  };
  if (["W55", "W77", "W84", "W92"].includes(feature)) {
    metrics.texture_retention = 0.95;
  }
  if (feature === "W54") {
    metrics.protected_teeth_unchanged = true;
  }
  if (["W56", "W90"].includes(feature)) {
    metrics.deterministic = true;
  }
  if (feature === "W58") {
    metrics.checked_frames = 3;
    metrics.automatic_tracking = false;
  }
  if (feature === "W83") {
    metrics.prediction = false;
  }
  if (feature === "W88") {
    metrics.protected_hair_unchanged = true;
  }
  return metrics;
}

for (const row of cases) {
  test(`${row.feature}: complete browser metrics pass`, () => {
    const gate = metricGate(row.feature, goodMetrics(row.feature));
    assert.equal(gate.passed, true, gate.reasons.join("; "));
    assert.deepEqual(gate.reasons, []);
  });

  test(`${row.feature}: missing metric cannot pass silently`, () => {
    const metrics = goodMetrics(row.feature);
    delete metrics.outside_error;
    const gate = metricGate(row.feature, metrics);
    assert.equal(gate.passed, false);
    assert.ok(gate.reasons.includes("outside_error metric missing"));
  });

  test(`${row.feature}: no box evidence remains not tested`, () => {
    const result = evaluate(
      row.feature,
      goodMetrics(row.feature),
      false,
      {
        adultConfirmed: true,
        checkedRegions: 2,
        checkedFrames: 3,
        healthConsent: true,
        culturalReview: true,
      },
    );
    assert.equal(result.status, "not_tested");
    assert.equal(result.passed, false);
    assert.ok(result.reasons.includes("real-face evidence not supplied"));
  });
}

test("browser catalogue covers exactly 30 R16B features", () => {
  const audit = auditCatalogue();
  assert.equal(audit.rows, 30);
  assert.equal(audit.uniqueFeatures, true);
  assert.equal(audit.uniqueTestIds, true);
  assert.deepEqual(audit.groups, {
    lips: 9,
    smile: 5,
    skin_more: 16,
  });
  assert.equal(audit.adultRows, 9);
  assert.equal(audit.checkedRegionRows, 14);
  assert.equal(audit.checkedSequenceRows, 1);
  assert.equal(audit.healthConsentRows, 1);
  assert.equal(audit.culturalReviewRows, 1);
});

test("grouped browser acceptance rows are unique", () => {
  const groups = grouped();
  const ids = [
    ...groups.lips,
    ...groups.smile,
    ...groups.skin_more,
  ].map((row) => row.feature);
  assert.equal(ids.length, 30);
  assert.equal(new Set(ids).size, 30);
  assert.deepEqual([...ids].sort(), CONTRACTS.map((row) => row.feature).sort());
});

test("release summary refuses partial evidence", () => {
  const one = evaluate("W46", goodMetrics("W46"), true);
  const summary = releaseSummary([one]);
  assert.equal(summary.complete, false);
  assert.equal(summary.releaseReady, false);
  assert.equal(summary.missingFeatures.length, 29);
});

test("release summary refuses a complete not-tested set", () => {
  const results = cases.map((row) => evaluate(row.feature, goodMetrics(row.feature), false));
  const summary = releaseSummary(results);
  assert.equal(summary.complete, true);
  assert.equal(summary.counts.not_tested, 30);
  assert.equal(summary.releaseReady, false);
});

test("release summary is ready only when all measured rows pass", () => {
  const results = cases.map((row) => evaluate(
    row.feature,
    goodMetrics(row.feature),
    true,
    {
      adultConfirmed: true,
      checkedRegions: 2,
      checkedFrames: 3,
      healthConsent: true,
      culturalReview: true,
    },
  ));
  const summary = releaseSummary(results);
  assert.equal(summary.complete, true);
  assert.deepEqual(summary.counts, {
    passed: 30,
    failed: 0,
    not_tested: 0,
  });
  assert.equal(summary.releaseReady, true);
});

test("unknown browser contract fails closed", () => {
  assert.throws(() => contract("W999"), /unsupported/);
});
