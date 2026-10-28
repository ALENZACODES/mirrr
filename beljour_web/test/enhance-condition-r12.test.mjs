// R12 preregistered synthetic condition/rescue contracts. Author: John Khan.
// Face set: ten labelled Monk colour swatches, five drawn condition fixtures.
// Pass: exact class routing, no normal edit, gain <=1.65, mean <=25 levels,
// clipping <=0.02, alpha/source preserved. No model, network, or real face data.
import test from "node:test";
import assert from "node:assert/strict";
import { byteImage, decode, roundHalfEven } from "../dist/js/engines/core/buffer.js";
import * as E from "../dist/js/engines/local/enhance.js";
import * as C from "../dist/js/engines/local/photo-condition.js";
import * as S from "../dist/js/engines/local/enhance-safety.js";

const MONK = [
  [246, 237, 228], [243, 231, 219], [247, 234, 208], [234, 218, 186], [215, 189, 150],
  [160, 126, 86], [130, 92, 67], [96, 65, 52], [58, 49, 42], [41, 36, 32],
];

function faded(image) {
  const result = byteImage(image.width, image.height, 3);
  for (let i = 0; i < image.width * image.height; i++) {
    const p = i * image.channels;
    const y = 0.299 * image.data[p] + 0.587 * image.data[p + 1] + 0.114 * image.data[p + 2];
    for (let c = 0; c < 3; c++) result.data[i * 3 + c] = Math.max(0, Math.min(255,
      roundHalfEven(125 + 0.4 * (y - 80) + 0.12 * (image.data[p + c] - y))));
  }
  return result;
}

function specimens(width = 96, height = 80) {
  const clean = E.scene(width, height);
  return { normal: clean, low_light: E.lowLight(clean, 0.4), blurry: E.blur(clean, 2),
    noisy: E.addNoise(clean, 16, 3), old: faded(clean) };
}

function swatch(tone, width = 96, height = 80) {
  const result = byteImage(width, height, 3);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const oval = ((x - width * 0.5) / (width * 0.34)) ** 2 + ((y - height * 0.52) / (height * 0.46)) ** 2 < 1;
    let colour = oval ? MONK[tone - 1] : [170, 190, 210];
    if (oval && y < height * 0.25) colour = [24, 20, 18];
    for (const cx of [width * 0.37, width * 0.63]) {
      if ((x - cx) ** 2 + (y - height * 0.48) ** 2 < (height * 0.035) ** 2) colour = [14, 15, 16];
    }
    if (oval && (x * 13 + y * 7) % 149 === 0 && y > height * 0.48) colour = MONK[tone - 1].map((value) => Math.max(0, value - 15));
    result.data.set(colour, (y * width + x) * 3);
  }
  return result;
}

function solid(width, height, colour) {
  const result = byteImage(width, height, 3);
  for (let i = 0; i < width * height; i++) result.data.set(colour, i * 3);
  return result;
}

function finiteEvidence(condition) {
  for (const value of Object.values(condition.evidence)) assert.ok(Number.isFinite(value));
  assert.equal(condition.version, C.CONDITION_VERSION);
  assert.ok(condition.reasons.length > 0);
}

for (const name of C.CLASSES) {
  test(`R12 scene condition: ${name} is independently routed`, () => {
    const source = specimens()[name], result = E.classifyPhoto(source);
    assert.equal(result.primary, name);
    finiteEvidence(result);
  });

  test(`R12 ${name}: strength zero and disabled steps are exact`, () => {
    const source = specimens()[name];
    const zero = E.enhance(source, "low_light", { strength: 0 });
    const off = E.enhance(source, "portrait", { steps: Object.fromEntries(E.STEPS.map((s) => [s, false])) });
    assert.deepEqual(zero.image.data, source.data);
    assert.deepEqual(off.image.data, source.data);
    assert.equal(zero.steps.unchanged, true);
    assert.equal(zero.steps.tone_applied, false);
    for (const key of ["exposure", "denoise", "deblur", "fade"]) assert.equal(off.safety.plan[key], false);
  });

  test(`R12 ${name}: alpha, input ownership and safety reports`, () => {
    const rgb = specimens()[name], source = byteImage(rgb.width, rgb.height, 4);
    for (let i = 0; i < rgb.width * rgb.height; i++) {
      source.data.set(rgb.data.subarray(i * 3, i * 3 + 3), i * 4);
      source.data[i * 4 + 3] = i % 256;
    }
    const pristine = new Uint8Array(source.data), result = E.enhance(source);
    assert.equal(result.image.channels, 4);
    for (let i = 0; i < rgb.width * rgb.height; i++) assert.equal(result.image.data[i * 4 + 3], source.data[i * 4 + 3]);
    assert.deepEqual(source.data, pristine);
    assert.ok(S.withinLimits(S.measureSafety(source, result.image)));
    assert.deepEqual(Object.keys(result.safety.limits).sort(), ["clip_increase", "exposure_gain", "mean_abs_change"]);
    assert.ok(!("image" in result.safety));
    result.image.data[0] = 255;
    assert.deepEqual(source.data, pristine);
  });
}

for (const mode of Object.keys(E.MODES)) {
  test(`R12 normal photo is byte-identical in ${mode}`, () => {
    const source = specimens().normal, result = E.enhance(source, mode);
    assert.deepEqual(result.image.data, source.data);
    assert.equal(result.steps.exposure_applied, false);
    assert.equal(result.steps.tone_applied, false);
    assert.equal(result.steps.normal_preserved, true);
    assert.equal(result.steps.effective_mode, "preserve");
    assert.ok(!("denoise" in result.steps) && !("deblur" in result.steps));
  });
}

for (let tone = 1; tone <= 10; tone++) {
  test(`R12 Monk ${tone}: lighting is scene evidence, not subject colour`, () => {
    const normal = swatch(tone), result = E.enhance(normal, "low_light");
    assert.equal(result.condition.primary, "normal", JSON.stringify(result.condition));
    assert.equal(result.steps.exposure_applied, false);
    assert.deepEqual(result.image.data, normal.data);
    const dim = E.lowLight(normal, 0.12), rescue = E.enhance(dim, "low_light");
    assert.equal(rescue.condition.low_light, true, JSON.stringify(rescue.condition));
    assert.equal(rescue.steps.exposure_applied, true);
    assert.ok(rescue.steps.exposure_gain > 1 && rescue.steps.exposure_gain <= S.MAX_EXPOSURE_GAIN);
    assert.ok(rescue.after.mean_luminance > rescue.before.mean_luminance);
    assert.ok(S.withinLimits(S.measureSafety(dim, rescue.image)));
  });
}

for (const name of ["blurry", "noisy", "old"]) {
  test(`R12 low_light preference cannot add exposure to ${name}`, () => {
    const source = specimens()[name], result = E.enhance(source, "low_light");
    assert.equal(result.steps.exposure_applied, false);
    assert.equal(result.steps.effective_mode, "natural");
    assert.equal(result.steps.unchanged, false);
    assert.ok(({ blurry: "deblur", noisy: "denoise", old: "fade_contrast" })[name] in result.steps);
    assert.equal(result.condition.primary, name);
  });
}

test("R12 old is a declared faded-scan proxy and conserves channel differences", () => {
  const source = specimens().old, result = E.enhance(source);
  assert.match(result.condition.old_note, /not photo dating or subject age/);
  assert.match(result.condition.method, /not calibrated probability/);
  for (let i = 0; i < source.width * source.height; i++) for (const c of [1, 2]) {
    const before = source.data[i * 3] - source.data[i * 3 + c];
    const after = result.image.data[i * 3] - result.image.data[i * 3 + c];
    assert.ok(Math.abs(before - after) <= 1);
  }
  assert.ok(result.after.laplacian_variance >= result.before.laplacian_variance);
  assert.ok(result.safety.metrics.mean_abs_change < 5);
});

test("R12 flat frames do not invent optical blur or photo age", () => {
  for (const level of [0, 18, 128, 220, 255]) {
    const condition = E.classifyPhoto(solid(16, 16, [level, level, level]));
    assert.equal(condition.blurry, false);
    assert.equal(condition.old, false);
    assert.equal(condition.evidence.edge_energy_255, 0);
    assert.equal(condition.primary, level < 30 ? "low_light" : "normal");
  }
});

test("R12 lit backdrop prevents automatic lightening of a dark centre", () => {
  const source = solid(96, 80, [20, 15, 12]);
  for (let y = 0; y < 80; y++) for (let x = 0; x < 96; x++) {
    if (x < 18 || x >= 78) source.data.set([210, 215, 220], (y * 96 + x) * 3);
  }
  const result = E.enhance(source, "low_light");
  assert.equal(result.condition.low_light, false);
  assert.equal(result.steps.exposure_applied, false);
  assert.deepEqual(result.image.data, source.data);
});

test("R12 a small lamp stays clipped as before while a dim scene is lifted", () => {
  const source = E.lowLight(E.scene(96, 80), 0.18);
  for (let y = 3; y < 5; y++) for (let x = 3; x < 5; x++) source.data.set([255, 255, 255], (y * 96 + x) * 3);
  const result = E.enhance(source, "low_light");
  assert.equal(result.condition.low_light, true);
  assert.ok(result.steps.highlight_pixels_protected >= 4);
  for (let y = 3; y < 5; y++) for (let x = 3; x < 5; x++) {
    assert.deepEqual([...result.image.data.subarray((y * 96 + x) * 3, (y * 96 + x) * 3 + 3)], [255, 255, 255]);
  }
});

test("R12 odd image sizes keep all sixteen spatial tiles", () => {
  for (const [w, h] of [[17, 19], [95, 81], [192, 160]]) {
    const e = E.classifyPhoto(E.scene(w, h)).evidence;
    assert.equal(e.tile_count, 16);
    assert.ok(e.dark_tile_share >= 0 && e.dark_tile_share <= 1);
    assert.ok(e.p05_linear <= e.median_linear && e.median_linear <= e.p95_linear);
  }
});

test("R12 invalid strengths, switches, methods, and shapes refuse", () => {
  const source = specimens().normal;
  for (const strength of [-0.1, 1.1, NaN, Infinity, true]) assert.throws(() => E.enhance(source, "natural", { strength }), /strength/);
  for (const steps of [{ glow: true }, { exposure: 1 }, { denoise: null }]) assert.throws(() => E.enhance(source, "natural", { steps }));
  assert.throws(() => E.enhance(source, "natural", { method: "median" }), /method/);
  assert.throws(() => E.classifyPhoto(byteImage(3, 3, 3)), /too small/);
  assert.throws(() => E.classifyPhoto(byteImage(8, 8, 2)), /RGB/);
  assert.throws(() => S.boundedExposure(source, 0), /target/);
  assert.throws(() => S.boundedExposure(source, 1, 1.1), /weight/);
  assert.throws(() => S.restoreFadedContrast(source, -1), /strength/);
});

test("R12 bounded exposure has a linear cap and a highlight shoulder", () => {
  const source = solid(30, 30, [32, 25, 20]);
  for (let i = 0; i < 180; i++) source.data.set(i < 60 ? [251, 246, 240] : i < 120 ? [255, 30, 20] : [255, 255, 255], i * 3);
  const result = S.boundedExposure(source, 1, 1);
  assert.ok(result.applied_gain <= 1.65 && result.max_pixel_gain <= 1.65);
  assert.ok(result.rolled_off_pixels >= 180);
  assert.deepEqual(result.image.data.subarray(180, 540), source.data.subarray(180, 540));
  assert.ok(S.withinLimits(S.measureSafety(source, result.image)));
});

test("R12 safety guard reduces an excessive proposal and reports the actual mix", () => {
  const source = solid(24, 24, [100, 100, 100]), proposed = solid(24, 24, [255, 255, 255]);
  const safe = S.guardOutput(source, proposed);
  assert.equal(safe.reduced, true);
  assert.ok(safe.applied_mix > 0 && safe.applied_mix < 1);
  assert.equal(safe.proposals_checked, S.GUARD_STEPS + 1);
  assert.ok(safe.image.data.every((value) => value === 125));
  assert.equal(S.withinLimits(safe.metrics), true);
  assert.equal(safe.metrics.mean_abs_change, 25);
});

test("R12 per-channel clipping cannot hide behind low luminance", () => {
  const source = solid(24, 24, [245, 15, 15]), candidate = solid(24, 24, [245, 15, 15]);
  for (let i = 0; i < 288; i++) candidate.data[i * 3] = 255;
  const measured = S.measureSafety(source, candidate);
  assert.equal(measured.luma_clip_increase, 0);
  assert.equal(measured.channel_clip_increase, 0.5);
  assert.equal(S.withinLimits(measured), false);
  const safe = S.guardOutput(source, candidate);
  assert.equal(safe.reduced, true);
  assert.ok(safe.metrics.channel_clip_increase <= 0.02);
});

test("R12 crushed shadows also engage the output guard", () => {
  const safe = S.guardOutput(solid(12, 12, [10, 10, 10]), solid(12, 12, [0, 0, 0]));
  assert.equal(safe.reduced, true);
  assert.ok(safe.metrics.dark_clip_increase <= 0.02);
  assert.ok(safe.image.data.every((value) => value > 2));
});

test("R12 mixed noise and low light retain both stages without incidental sharpening", () => {
  const source = E.addNoise(E.lowLight(E.scene(96, 80), 0.2), 9, 11), result = E.enhance(source, "low_light");
  assert.ok(result.condition.noisy && result.condition.low_light);
  assert.ok("denoise" in result.steps && result.steps.exposure_applied);
  assert.ok(!("sharpen" in result.steps));
  assert.ok(result.after.noise_sigma < result.before.noise_sigma);
});

test("R12 low-light strength is monotone and chromaticity is preserved", () => {
  const source = specimens().low_light, outputs = [0, 0.25, 0.5, 0.75, 1].map((strength) => E.enhance(source, "low_light", { strength }));
  const means = outputs.map((result) => result.after.mean_luminance);
  assert.deepEqual(means, [...means].sort((a, b) => a - b));
  assert.ok(means.at(-1) > means[0]);
  const before = decode(source), after = decode(outputs.at(-1).image);
  for (let i = 0; i < source.width * source.height; i++) {
    const p = i * 3, sumA = before.data[p] + before.data[p + 1] + before.data[p + 2], sumB = after.data[p] + after.data[p + 1] + after.data[p + 2];
    for (let c = 0; c < 3; c++) assert.ok(Math.abs(before.data[p + c] / sumA - after.data[p + c] / sumB) < 0.015);
  }
});

test("R12 a true switch cannot bypass missing defect evidence", () => {
  const source = specimens().normal;
  const out = E.enhance(source, "low_light", { method: "nlm", steps: Object.fromEntries(E.STEPS.map((step) => [step, true])) });
  assert.deepEqual(out.image.data, source.data);
  assert.equal(out.steps.unchanged, true);
});

test("R12 reports and output are deterministic", () => {
  for (const source of Object.values(specimens())) {
    const a = E.enhance(source), b = E.enhance(source);
    assert.deepEqual(a.image.data, b.image.data);
    assert.deepEqual(a.safety, b.safety);
    assert.deepEqual(a.condition, b.condition);
  }
});
