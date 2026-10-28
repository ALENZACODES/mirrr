/** Synthetic editor acceptance: hair, colour, strength and mask integrity.
 * Uses the public entry points of two independently shipped local engines.
 * Never supplies a real portrait, model landmarks, provider response or URL.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  DEFAULT_ANCHORS, SIMULATION_LABEL, renderStyle, requireStyle,
  validateAnchors, validatePresets, validateRecipe,
} from "../../dist/js/engines/menshair/index.js";
import {
  applyPreview, checkedRequest, specFor, FEATURE_SPECS,
} from "../../dist/js/engines/women_styling/index.js";

const W = 64;
const H = 72;
const presets = JSON.parse(readFileSync(new URL("../../dist/menshair-presets.json", import.meta.url), "utf8"));

function drawnPixels(channels = 4) {
  const bytes = new Uint8Array(W * H * channels);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * channels;
      bytes[i] = 25 + (x * 5 + y) % 156;
      bytes[i + 1] = 48 + (x + y * 4) % 149;
      bytes[i + 2] = 72 + (x * 3 + y * 2) % 134;
      if (channels === 4) bytes[i + 3] = (x + y) % 8 === 0 ? 101 : 255;
    }
  }
  return bytes;
}

function ellipseMask(left = 11, top = 12, right = 53, bottom = 49) {
  const out = new Uint8Array(W * H);
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const rx = (right - left) / 2;
  const ry = (bottom - top) / 2;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const r = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (r < 0.94) out[y * W + x] = 255;
      else if (r < 1.02) out[y * W + x] = 90;
    }
  }
  return out;
}

function diff(original, after, mask, channels = 4) {
  let changed = 0;
  let outside = 0;
  let alpha = 0;
  for (let pixel = 0; pixel < mask.length; pixel++) {
    let pixelChanged = false;
    for (let channel = 0; channel < 3; channel++) {
      if (original[pixel * channels + channel] !== after[pixel * channels + channel]) {
        pixelChanged = true;
      }
    }
    if (pixelChanged) {
      changed++;
      if (mask[pixel] === 0) outside++;
    }
    if (channels === 4 && original[pixel * channels + 3] !== after[pixel * channels + 3]) alpha++;
  }
  return {changed, outside, alpha};
}

function localHair(style, strength, image = drawnPixels(), mask = ellipseMask()) {
  return renderStyle(image, W, H, mask, DEFAULT_ANCHORS, {...style, strength});
}

function localColour(featureId, variant, strength, image = drawnPixels(), mask = ellipseMask()) {
  const spec = specFor(featureId);
  const masks = Object.fromEntries(spec.regions.map((region) => [region, mask]));
  return applyPreview(image, W, H, masks, {featureId, variant, strength});
}

test("catalogue hair styles are deliberately identified as local tonal simulations", () => {
  validatePresets(presets);
  assert.ok(presets.styles.length >= 12);
  assert.equal(presets.simulation_label, SIMULATION_LABEL);
  assert.ok(presets.styles.every((s) => s.id.startsWith("local-")));
  assert.equal(new Set(presets.styles.map((s) => s.id)).size, presets.styles.length);
  for (const style of presets.styles.slice(0, 18)) {
    assert.equal(requireStyle(presets, style.id).name, style.name);
    assert.doesNotThrow(() => validateRecipe(style));
  }
});

test("every representative masculine hair level preserves input, outside mask and alpha", () => {
  const image = drawnPixels();
  const original = Uint8Array.from(image);
  const mask = ellipseMask();
  const style = presets.styles[0];
  const signatures = [];
  for (const strength of [0, 25, 50, 75, 100]) {
    const result = localHair(style, strength, image, mask);
    const delta = diff(original, result.pixels, mask);
    assert.equal(result.evidence.provider_calls, 0);
    assert.equal(result.evidence.simulation, true);
    assert.equal(result.evidence.label, SIMULATION_LABEL);
    assert.equal(result.evidence.total_pixels, W * H);
    assert.equal(delta.outside, 0);
    assert.equal(delta.alpha, 0);
    assert.equal(result.evidence.mask_support_pixels, mask.filter(Boolean).length);
    if (strength === 0) assert.deepEqual(result.pixels, original);
    if (strength === 100) assert.ok(delta.changed > 0);
    signatures.push(Buffer.from(result.pixels).toString("base64"));
    assert.deepEqual(image, original, "rendering is source-preserving");
  }
  assert.ok(new Set(signatures).size >= 3, "levels must have observable differences");
});

for (const family of ["fade", "taper", "buzz", "crop", "undercut"]) {
  test(`masculine ${family} family remains a pixel-bounded simulation`, () => {
    const style = presets.styles.find((s) => s.family === family);
    assert.ok(style, `catalogue must have a ${family} example`);
    const original = drawnPixels();
    const mask = ellipseMask();
    const result = localHair(style, 80, original, mask);
    const changes = diff(original, result.pixels, mask);
    assert.equal(changes.outside, 0);
    assert.equal(changes.alpha, 0);
    assert.ok(changes.changed > 0);
    assert.equal(result.evidence.provider_calls, 0);
    assert.match(result.evidence.note, /tonal|strand|simulation/i);
  });
}

test("a zero coverage hair mask is exact identity", () => {
  const pixels = drawnPixels();
  const result = localHair(presets.styles[0], 100, pixels, new Uint8Array(W * H));
  assert.deepEqual(result.pixels, pixels);
  assert.equal(result.evidence.affected_pixels, 0);
  assert.equal(result.evidence.mask_support_pixels, 0);
});

test("invalid masculine strength, dimensions, head anchors and masks fail closed", () => {
  const style = presets.styles[0];
  for (const strength of [-1, 101, 0.5, Infinity, NaN]) {
    assert.throws(() => validateRecipe({...style, strength}));
  }
  assert.throws(() => validateRecipe({...style, provider: "remote"}));
  assert.throws(() => validateAnchors({...DEFAULT_ANCHORS, crown: [2, 2]}));
  assert.throws(() => renderStyle(drawnPixels(), W, H, new Uint8Array(3), DEFAULT_ANCHORS, style));
  assert.throws(() => renderStyle(drawnPixels(), W, H, new Float32Array(W * H).fill(2), DEFAULT_ANCHORS, style));
  assert.throws(() => renderStyle(drawnPixels(), W, H, ellipseMask(),
    DEFAULT_ANCHORS, {...style, strength: 120}));
  assert.throws(() => renderStyle(new Uint8Array(5), W, H, ellipseMask(), DEFAULT_ANCHORS, style));
});

test("a pure hair colour edit remains masked, alpha preserving and locally disclosed", () => {
  const pixels = drawnPixels();
  const mask = ellipseMask();
  const result = localColour("W23", "powder", 85, pixels, mask);
  const changes = diff(pixels, result.pixels, mask);
  assert.equal(result.evidence.feature_id, "W23");
  assert.equal(result.evidence.outside_mask_changed, 0);
  assert.equal(result.evidence.changed_alpha_pixels, 0);
  assert.equal(result.evidence.provider_calls, 0);
  assert.equal(result.evidence.source_preserved, true);
  assert.equal(changes.outside, 0);
  assert.equal(changes.alpha, 0);
  assert.ok(changes.changed > 0);
  assert.deepEqual(pixels, drawnPixels());
  assert.match(result.evidence.disclosure, /simulation/i);
});

for (const [feature, variant] of [["W10", "dewy"], ["W23", "powder"], ["W32", "silver"]]) {
  test(`feminine ${feature} colour: 0, 25, 50 and 100 are reversible local levels`, () => {
    const original = drawnPixels();
    const mask = ellipseMask();
    const results = [];
    for (const strength of [0, 25, 50, 100]) {
      const outcome = localColour(feature, variant, strength, original, mask);
      const changes = diff(original, outcome.pixels, mask);
      assert.equal(changes.alpha, 0);
      assert.equal(changes.outside, 0);
      assert.equal(outcome.evidence.outside_mask_changed, 0);
      assert.equal(outcome.evidence.provider_calls, 0);
      if (strength === 0) assert.deepEqual(outcome.pixels, original);
      results.push(Buffer.from(outcome.pixels).toString("base64"));
    }
    assert.ok(new Set(results).size >= 3);
    assert.deepEqual(original, drawnPixels());
  });
}

test("feminine previews reject masks not approved by the public feature specification", () => {
  const image = drawnPixels();
  const raw = {featureId: "W23", variant: "powder", strength: 65};
  assert.throws(() => applyPreview(image, W, H, {}, raw));
  assert.throws(() => applyPreview(image, W, H, {face: ellipseMask()}, raw));
  assert.throws(() => applyPreview(image, W, H, {roots: new Uint8Array(3)}, raw));
  assert.throws(() => applyPreview(image, W, H, {roots: ellipseMask(), danger: ellipseMask()}, raw));
  assert.throws(() => applyPreview(image.subarray(0, 20), W, H,
    {roots: ellipseMask()}, raw));
});

test("feminine request rejects invalid level, swatch, feature or variant", () => {
  const original = {featureId: "W23", variant: "powder", strength: 65};
  assert.equal(checkedRequest(original).request.strength, 65);
  for (const strength of [-1, 101, 1.1, NaN]) {
    assert.throws(() => checkedRequest({...original, strength}));
  }
  assert.equal(checkedRequest({...original, strength: null}).request.strength, 55);
  assert.throws(() => checkedRequest({...original, featureId: "W104"}));
  assert.throws(() => checkedRequest({...original, variant: "external-brand"}));
  assert.throws(() => checkedRequest({...original, primaryRGB: [300, 20, 20]}));
  assert.throws(() => checkedRequest({...original, depth: "invalid"}));
});

test("feminine feature registry is stable and all named regions are registered", () => {
  assert.ok(FEATURE_SPECS.length >= 30);
  const ids = new Set(FEATURE_SPECS.map((s) => s.id));
  assert.equal(ids.size, FEATURE_SPECS.length);
  for (const spec of FEATURE_SPECS) {
    assert.ok(spec.regions.length > 0);
    assert.ok(spec.variants.length > 0);
    assert.match(spec.promise, /./);
    assert.match(spec.nonPromise, /./);
    assert.equal(specFor(spec.id), spec);
  }
});
