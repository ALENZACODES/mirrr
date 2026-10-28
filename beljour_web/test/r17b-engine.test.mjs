/** R17B browser-engine acceptance tests. Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { FEATURES as HAIR_FEATURES } from "../dist/js/engines/hair_women/contracts.js";
import { renderHair } from "../dist/js/engines/hair_women/engine.js";
import { hairMetrics } from "../dist/js/engines/hair_women/evaluation.js";
import { FEATURES as MAKEUP_FEATURES } from "../dist/js/engines/makeup_w/contracts.js";
import { renderMakeup } from "../dist/js/engines/makeup_w/engine.js";
import { makeupMetrics } from "../dist/js/engines/makeup_w/evaluation.js";
import { runWorkflow, encodePassport, decodePassport } from "../dist/js/engines/workflow_w/index.js";
import { upscale } from "../dist/js/engines/upscale/index.js";
import { renderGenderLook } from "../dist/js/engines/gender_look/index.js";
import { renderShave } from "../dist/js/engines/shave/index.js";
import { fixture } from "../dist/js/ui/r17b/fixture.js";

function hairOptions(feature, amount = 0.6) {
  return {
    feature,
    amount,
    colour: [92, 58, 40],
    accent: [176, 122, 78],
    length_ratio: 0.45,
    volume: 0.42,
    grey_share: 0.38,
    month: 12,
    curl_strength: 0.64,
    heat_shape: 0.55,
    humidity: 55,
    scalp_sensitivity: feature === "W42",
    seed: 17,
    metadata: { heat_style: "wave" },
  };
}

function makeupOptions(feature, amount = 0.6) {
  return {
    feature,
    amount,
    shade: [117, 67, 62],
    accent: [156, 91, 80],
    finish: feature === "W9" ? "cream" : feature === "W10" ? "matte" : "satin",
    face_shape: "balanced",
    undertone: "olive",
    oxidation_delta: -6,
    season_shift: 0.22,
    look: "gallery_glow",
    seed: 17,
    metadata: { issue: "redness", outfit_colour: [72, 88, 112] },
  };
}

function changedOutside(photo, after, coverage) {
  let changed = 0;
  let count = 0;
  for (let i = 0; i < coverage.length; i++) {
    if (coverage[i] > 0.01) continue;
    count++;
    const offset = i * photo.channels;
    let delta = 0;
    for (let channel = 0; channel < 3; channel++) {
      delta = Math.max(delta, Math.abs(after[offset + channel] - photo.data[offset + channel]));
    }
    if (delta > 1) changed++;
  }
  return count ? changed / count : 0;
}

function alphaExact(photo, after) {
  if (photo.channels !== 4) return true;
  for (let i = 3; i < photo.data.length; i += 4) {
    if (photo.data[i] !== after[i]) return false;
  }
  return true;
}

for (const feature of HAIR_FEATURES) {
  test(`${feature}: hair mirror preserves identity at zero strength`, () => {
    const f = fixture();
    const result = renderHair(f.photo, f.hair, f.scalp, f.geometry, hairOptions(feature, 0));
    assert.deepEqual(result.data, f.photo.data);
    assert.equal(result.report.feature, feature);
  });

  test(`${feature}: hair mirror keeps alpha exact`, () => {
    const f = fixture();
    const result = renderHair(f.photo, f.hair, f.scalp, f.geometry, hairOptions(feature));
    assert.equal(alphaExact(f.photo, result.data), true);
  });

  test(`${feature}: hair mirror confines changes to declared coverage`, () => {
    const f = fixture();
    const result = renderHair(f.photo, f.hair, f.scalp, f.geometry, hairOptions(feature));
    const error = changedOutside(f.photo, result.data, result.coverage);
    assert.ok(error <= 0.005, `${feature} outside error ${error}`);
  });

  test(`${feature}: hair metrics remain finite`, () => {
    const f = fixture();
    const result = renderHair(f.photo, f.hair, f.scalp, f.geometry, hairOptions(feature));
    const metrics = hairMetrics(f.photo, result.data, result.coverage);
    for (const value of Object.values(metrics)) {
      assert.equal(Number.isFinite(value), true);
    }
  });
}

for (const feature of MAKEUP_FEATURES) {
  test(`${feature}: makeup mirror preserves identity at zero strength`, () => {
    const f = fixture();
    const result = renderMakeup(f.photo, f.masks, makeupOptions(feature, 0));
    assert.deepEqual(result.data, f.photo.data);
    assert.equal(result.report.feature, feature);
  });

  test(`${feature}: makeup mirror keeps alpha exact`, () => {
    const f = fixture();
    const result = renderMakeup(f.photo, f.masks, makeupOptions(feature));
    assert.equal(alphaExact(f.photo, result.data), true);
  });

  test(`${feature}: makeup mirror confines pixel changes`, () => {
    const f = fixture();
    const result = renderMakeup(f.photo, f.masks, makeupOptions(feature));
    const error = changedOutside(f.photo, result.data, result.coverage);
    assert.ok(error <= 0.005, `${feature} outside error ${error}`);
  });

  test(`${feature}: makeup metrics remain finite`, () => {
    const f = fixture();
    const result = renderMakeup(f.photo, f.masks, makeupOptions(feature));
    const metrics = makeupMetrics(f.photo, result.data, result.coverage);
    for (const value of Object.values(metrics)) {
      assert.equal(Number.isFinite(value), true);
    }
  });
}

test("W33: grey timeline is monotone", () => {
  const f = fixture();
  const result = renderHair(f.photo, f.hair, f.scalp, f.geometry, hairOptions("W33"));
  const timeline = result.report.timeline;
  assert.ok(Array.isArray(timeline));
  for (let i = 1; i < timeline.length; i++) {
    assert.ok(timeline[i].natural_share >= timeline[i - 1].natural_share);
  }
});

test("W40: curl pattern preservation is explicitly reported", () => {
  const f = fixture();
  const result = renderHair(f.photo, f.hair, f.scalp, f.geometry, hairOptions("W40"));
  assert.equal(result.report.curl_pattern_preserved, true);
});

test("W42: calm sensitive mode uses equal-option language", () => {
  const f = fixture();
  const result = renderHair(f.photo, f.hair, f.scalp, f.geometry, hairOptions("W42", 1));
  assert.equal(result.report.mode, "calm_sensitive");
  assert.match(String(result.report.copy), /equal option/i);
  assert.equal(result.report.medical_advice, false);
});

test("W44: humidity output is labelled forecast input", () => {
  const f = fixture();
  const result = renderHair(f.photo, f.hair, f.scalp, f.geometry, { ...hairOptions("W44"), humidity: 85 });
  assert.equal(typeof result.report.forecast, "object");
});

test("W12: contour mirror never reports geometry change", () => {
  const f = fixture();
  const result = renderMakeup(f.photo, f.masks, makeupOptions("W12"));
  assert.equal(result.report.geometry_change, false);
});

test("W13: browser recreation uses checked local regions", () => {
  const f = fixture();
  const result = renderMakeup(f.photo, f.masks, makeupOptions("W13"));
  assert.equal(result.report.reference_source, "user_checked");
});

test("W14: browser generic look contains no third-party names", () => {
  const f = fixture();
  const result = renderMakeup(f.photo, f.masks, makeupOptions("W14"));
  assert.equal(result.report.third_party_names, false);
  assert.equal(result.report.look, "gallery_glow");
});

test("W17: oxidation mirror returns an estimate timeline", () => {
  const f = fixture();
  const result = renderMakeup(f.photo, f.masks, makeupOptions("W17"));
  const timeline = result.report.timeline;
  assert.ok(Array.isArray(timeline));
  assert.match(String(timeline.at(-1).label), /estimate/i);
});

test("W18: seasonal mixing ratios sum to one", () => {
  const f = fixture();
  const result = renderMakeup(f.photo, f.masks, makeupOptions("W18"));
  const mix = result.report.mix;
  assert.ok(Math.abs(mix.lighter_ratio + mix.deeper_ratio - 1) < 1e-9);
});

test("W94: price bands are explicitly estimates", () => {
  const result = runWorkflow({ feature: "W94", price_low: 80, price_high: 140, sessions: 1, maintenance_weeks: 8 });
  assert.match(String(result.label), /ESTIMATE/);
  assert.equal(result.initial_low, 80);
  assert.equal(result.initial_high, 140);
});

test("W96: occasion recipe is local and network false", () => {
  const result = runWorkflow({ feature: "W96", occasion: "evening", look_id: "gallery_glow" });
  assert.equal(result.network, false);
  assert.equal(result.storage, "local recipe reference");
});

test("W99: maintenance calendar is deterministic", () => {
  const options = { feature: "W99", start_date: "2026-10-24", maintenance_weeks: 8 };
  assert.deepEqual(runWorkflow(options), runWorkflow(options));
});

test("W100: basic passport helper round trips", () => {
  const payload = { schema: "beljour.shade-passport.v1", depth: 42, undertone: "olive" };
  const encoded = encodePassport(payload);
  const decoded = decodePassport(encoded);
  assert.equal(decoded.schema, payload.schema);
  assert.equal(decoded.depth, payload.depth);
});

test("upscale 2x changes dimensions exactly", () => {
  const f = fixture();
  const result = upscale(f.photo, 2, 0.55);
  assert.equal(result.width, f.photo.width * 2);
  assert.equal(result.height, f.photo.height * 2);
  assert.equal(result.data.length, f.photo.data.length * 4);
});

test("upscale 4x changes dimensions exactly", () => {
  const f = fixture();
  const result = upscale(f.photo, 4, 0.55);
  assert.equal(result.width, f.photo.width * 4);
  assert.equal(result.height, f.photo.height * 4);
  assert.equal(result.data.length, f.photo.data.length * 16);
});

test("gender neutral at amount zero is identity", () => {
  const f = fixture();
  const result = renderGenderLook(f.photo, f.masks, { direction: "neutral", level: "normal", amount: 0 });
  assert.deepEqual(result.data, f.photo.data);
  assert.equal(result.report.identity_geometry_changed, false);
});

test("gender hyper never changes alpha", () => {
  const f = fixture();
  const result = renderGenderLook(f.photo, f.masks, { direction: "masculine", level: "hyper", amount: 1 });
  assert.equal(alphaExact(f.photo, result.data), true);
  assert.equal(result.report.identity_geometry_changed, false);
});

test("clean shave is labelled estimate and alpha exact", () => {
  const f = fixture();
  const result = renderShave(f.photo, f.masks.beard, f.masks.cheek, 0.8);
  assert.match(String(result.report.label), /estimate/i);
  assert.equal(alphaExact(f.photo, result.data), true);
});
