/** R17B detailed browser feature-model tests. Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clipInPlan,
  integrationPlan,
  topperPlan,
  wigPlan,
  rootDepth,
  moneyPiece,
  foilMap,
  ombreCurve,
  splitPartition,
  peekabooRegion,
  curlDefinition,
  heatStyle,
  humidityResponse,
  greyTimeline,
  greyMonotone,
} from "../dist/js/engines/hair_women/feature_models/plans.js";
import {
  undertoneAnchor,
  rankShades,
  balancedPalette,
  deepSkinGuard,
  concealerPlan,
  correctionPlan,
  blushPlan,
  contourPlan,
  finishPlan,
  oxidationTimeline,
  seasonalMix,
  ORIGINAL_EVENT_LOOKS,
  eventRecipe,
} from "../dist/js/engines/makeup_w/feature_models/plans.js";
import {
  planTiles,
  memoryBudget,
  recommendedTileSide,
  upscaleTiled,
  runUpscale,
} from "../dist/js/engines/upscale/pipeline.js";
import {
  SHADE_PASSPORT_SCHEMA,
  parseShadePassport,
  passportPayload,
  canonicalPassport,
  roundTripPassport,
  redactedPassportSummary,
} from "../dist/js/engines/workflow_w/shade_passport.js";
import {
  SIGNAL_PRESETS,
  signalPreset,
  levelsAreMonotone,
  signalDisclosure,
} from "../dist/js/engines/gender_look/presets.js";
import {
  assessShave,
  shaveAmountCap,
  shaveDisclosure,
} from "../dist/js/engines/shave/assessment.js";
import { fixture } from "../dist/js/ui/r17b/fixture.js";

test("clip-in plan distinguishes stretched and worn length", () => {
  const result = clipInPlan(0.7, 1.9, 0.45, 0.8, 0.13);
  assert.ok(result.wornRatio < result.stretchedRatio);
  assert.ok(result.attachmentY > 0.1);
});

test("clip-in plan warns for very long previews", () => {
  const result = clipInPlan(0.7, 2.0, 0.45, 0.5, 0.13);
  assert.ok(result.warnings.some(value => /Long extension/.test(value)));
});

test("integration plans distinguish tape from sew-in", () => {
  const base = clipInPlan(0.6, 1.6, 0.4, 0.5, 0.13);
  const tape = integrationPlan("tape", base);
  const sew = integrationPlan("sew_in", base);
  assert.ok(sew.attachmentY > tape.attachmentY);
  assert.ok(sew.blendRatio <= tape.blendRatio);
});

test("topper plan stays crown-bound", () => {
  const result = topperPlan(0.7, 0.6, [0.5, 0.13]);
  assert.ok(result.centreX >= 0.2 && result.centreX <= 0.8);
  assert.match(result.label, /in-person/);
});

test("wig plan is explicit simulation", () => {
  const result = wigPlan(0.7, 0.5, [0.27, 0.33], [0.73, 0.33], 0.13);
  assert.equal(result.simulation, true);
  assert.match(result.label, /fit/);
});

test("root opacity grows with amount", () => {
  assert.ok(rootDepth(0.2).opacity < rootDepth(0.8).opacity);
});

test("money pieces are symmetric", () => {
  const [left, right] = moneyPiece(0.8);
  assert.equal(left.weight, right.weight);
  assert.ok(Math.abs((left.end - left.start) - (right.end - right.start)) < 1e-9);
});

for (const style of ["babylights", "lowlights", "balanced", "chunky", "lived_in"]) {
  test(`foil map ${style} is deterministic and bounded`, () => {
    const a = foilMap(style, 0.7, 31);
    const b = foilMap(style, 0.7, 31);
    assert.deepEqual(a, b);
    assert.ok(a.every(row => row.start >= 0 && row.end <= 1 && row.start < row.end));
  });
}

test("babylights use more bands than chunky placement", () => {
  assert.ok(foilMap("babylights", 0.8).length > foilMap("chunky", 0.8).length);
});

test("ombre curve is monotone", () => {
  const rows = ombreCurve(0.5, 0.12, 31);
  for (let i = 1; i < rows.length; i++) assert.ok(rows[i] >= rows[i - 1]);
});

test("split partition leaves a feathered centre", () => {
  const row = splitPartition(0.5, 0.03);
  assert.ok(row.leftEnd < row.partX && row.partX < row.rightStart);
});

for (const side of ["left", "right", "both"]) {
  test(`peekaboo ${side} remains lower-hair bounded`, () => {
    const row = peekabooRegion(side, 0.7);
    assert.equal(row.side, side);
    assert.ok(row.lowerStart >= 0.4 && row.lowerStart <= 0.52);
  });
}

test("curl definition has a texture floor", () => {
  const row = curlDefinition(0.8, 0.9);
  assert.ok(row.textureFloor >= 0.72);
});

test("heat style carries a heat warning", () => {
  const row = heatStyle(0.7, 0.8, 0.8);
  assert.match(row.warning, /heat/i);
  assert.ok(row.textureFloor >= 0.68);
});

test("humidity risk rises with user-entered humidity", () => {
  const low = humidityResponse(20, 0.7);
  const high = humidityResponse(90, 0.7);
  assert.ok(high.humidityRisk > low.humidityRisk);
  assert.ok(high.definition < low.definition);
});

test("grey timeline is monotone", () => {
  const rows = greyTimeline(0.3, 18);
  assert.equal(greyMonotone(rows), true);
  assert.equal(rows.at(-1).naturalFraction, 1);
});

test("undertone anchors preserve olive as first-class", () => {
  assert.equal(undertoneAnchor("olive"), 92);
  assert.equal(undertoneAnchor("cool"), 345);
});

test("ranked shades are sorted best-first", () => {
  const rows = rankShades([[130, 60, 70], [105, 86, 55], [82, 68, 76]], "olive", "lip");
  for (let i = 1; i < rows.length; i++) assert.ok(rows[i - 1].score >= rows[i].score);
});

test("balanced palette returns four local candidates", () => {
  const rows = balancedPalette([120, 70, 65], "warm");
  assert.equal(rows.length, 4);
  assert.ok(rows.every(row => row.rationale.includes("Lab/LCh")));
});

test("deep-skin guard cannot exceed lightness budget", () => {
  const result = deepSkinGuard(31, 48, 1);
  assert.equal(result.passes, true);
  assert.ok(result.corrected <= 32);
});

test("concealer plan is symmetric", () => {
  const [left, right] = concealerPlan(0.7);
  assert.ok(Math.abs(left.centre[0] - (1 - right.centre[0])) < 1e-9);
});

test("redness correction says cosmetic", () => {
  const rows = correctionPlan("redness", 0.5);
  assert.ok(rows.every(row => /cosmetic/.test(row.instruction)));
});

for (const shape of ["balanced", "round", "oval", "square", "heart", "long"]) {
  test(`blush plan supports ${shape} without beauty scoring`, () => {
    const rows = blushPlan(shape, 0.6);
    assert.equal(rows.length, 2);
    assert.ok(rows.every(row => /optional/.test(row.instruction)));
  });
}

test("contour plan explicitly says no slimming", () => {
  const rows = contourPlan("round", 0.7);
  assert.ok(rows.filter(row => row.name.includes("bronze")).every(row => /no slimming/.test(row.instruction)));
});

for (const finish of ["cream", "powder", "dewy", "matte", "skin_tint"]) {
  test(`${finish} finish has texture floor`, () => {
    const row = finishPlan(finish, 0.8);
    assert.ok(row.textureFloor >= 0.7 && row.textureFloor <= 1);
  });
}

test("oxidation timeline starts at zero", () => {
  const rows = oxidationTimeline(-8, 3, 8);
  assert.equal(rows[0].deltaLEstimate, 0);
  assert.match(rows.at(-1).label, /user-entered/);
});

test("seasonal mixing ratios sum to one", () => {
  const row = seasonalMix(0.4, 0.3);
  assert.ok(Math.abs(row.lighterRatio + row.deeperRatio - 1) < 1e-9);
});

test("event looks use only original generic names", () => {
  assert.deepEqual(Object.keys(ORIGINAL_EVENT_LOOKS).sort(), ["city_lights", "copper_hour", "gallery_evening", "soft_velvet"]);
  assert.match(eventRecipe("gallery_evening").source, /original BELJOUR/);
});

test("tile planner covers image core exactly once", () => {
  const width = 513;
  const height = 401;
  const coverage = new Uint8Array(width * height);
  for (const tile of planTiles(width, height, 128, 12)) {
    for (let y = tile.y0; y < tile.y1; y++) {
      for (let x = tile.x0; x < tile.x1; x++) coverage[y * width + x]++;
    }
  }
  assert.ok(coverage.every(value => value === 1));
});

test("4x memory budget exceeds 2x budget", () => {
  assert.ok(memoryBudget(256, 12, 4).peakBytesEstimate > memoryBudget(256, 12, 2).peakBytesEstimate);
});

test("recommended tile side shrinks under tighter budget", () => {
  assert.ok(recommendedTileSide(1800, 1400, 4, 32) <= recommendedTileSide(1800, 1400, 4, 160));
});

test("tiled upscale preserves dimensions", () => {
  const f = fixture(64, 64);
  const result = upscaleTiled(f.photo, 2, 0.55, 64, 12);
  assert.equal(result.width, 128);
  assert.equal(result.height, 128);
});

test("upscale pipeline reports classical local mode", () => {
  const f = fixture(64, 64);
  const result = runUpscale(f.photo, 2, 0.55, 1_000_000);
  assert.equal(result.report.mode, "full");
  assert.match(result.report.label, /no neural weights/);
});

test("Shade Passport parser keeps olive and local fields", () => {
  const value = parseShadePassport({ depth: 42, undertone: "olive", hair_base: "brown", allergens: ["nickel"], measured_on: "2026-10-24", notes: "local" });
  assert.equal(value.undertone, "olive");
  assert.equal(value.depth, 42);
});

test("Shade Passport canonical payload is stable", () => {
  const value = parseShadePassport({ depth: 42, undertone: "olive", allergens: [] });
  assert.equal(canonicalPassport(value), canonicalPassport(value));
  assert.equal(passportPayload(value).schema, SHADE_PASSPORT_SCHEMA);
});

test("Shade Passport JSON round trips without network", () => {
  const value = parseShadePassport({ depth: 42, undertone: "olive", allergens: [] });
  const restored = roundTripPassport(JSON.stringify(passportPayload(value)));
  assert.deepEqual(restored, value);
});

test("Shade Passport redacted summary excludes free text", () => {
  const value = parseShadePassport({ depth: 42, undertone: "olive", hair_base: "private note", allergens: ["nickel"], notes: "private" });
  const text = JSON.stringify(redactedPassportSummary(value));
  assert.doesNotMatch(text, /private/);
  assert.match(text, /allergen_count/);
});

test("gender signal levels are monotone", () => {
  assert.equal(levelsAreMonotone(), true);
  assert.ok(SIGNAL_PRESETS.normal.stubbleSignal < SIGNAL_PRESETS.hyper.stubbleSignal);
});

test("gender signal amount never moves geometry", () => {
  const value = signalPreset("hyper", 0.8);
  assert.equal(value.geometryChange, 0);
});

test("gender disclosure separates presentation signals from identity", () => {
  const text = signalDisclosure("feminine", "extra").join(" ");
  assert.match(text, /identity/);
  assert.match(text, /geometry/);
});

test("shave assessment accepts stubble", () => {
  const value = assessShave(0.12, 1.5, 0.9);
  assert.equal(value.accepted, true);
  assert.equal(value.scope, "stubble");
});

test("shave assessment refuses long beard", () => {
  const value = assessShave(0.3, 12, 0.9);
  assert.equal(value.accepted, false);
  assert.equal(value.scope, "long_beard");
});

test("shave cap is lower for short beard", () => {
  assert.ok(shaveAmountCap("short_beard") < shaveAmountCap("stubble"));
});

test("shave disclosure has no geometry or medical claim", () => {
  const value = shaveDisclosure(assessShave(0.12, 1.5, 0.9));
  assert.equal(value.identity_geometry_changed, false);
  assert.equal(value.medical_advice, false);
});
