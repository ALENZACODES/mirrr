/** Defensive runtime gate and direct provenance checks for original W engines.
 * Tests use no browser storage, fixtures, purchased units or real faces.
 * Author: John Khan.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as Women from '../dist/js/engines/women_styling/index.js';
const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));

const width = 9, height = 12;
function sample(channels = 4) {
  const source = new Uint8Array(width * height * channels);
  for (let p = 0; p < width * height; p++) {
    for (let c = 0; c < channels; c++) source[p * channels + c] = (p * 19 + c * 53 + 18) % 256;
  }
  return source;
}
function maskFor(region) {
  const mask = new Uint8Array(width * height);
  for (let p = 0; p < width * height; p++) {
    const x = p % width, y = Math.floor(p / width);
    if (x >= 2 && x < 8 && y >= 2 && y <= 9) mask[p] = 180;
  }
  return { [region]: mask };
}

test('unexpected input, prohibited W3 and W14 and arbitrary string keys fail closed', () => {
  const source = sample(), mask = maskFor('cheek_left');
  const request = { featureId: 'W4', variant: 'cool' };
  for (const invalid of [
    { ...request, featureId: 'W3' }, { ...request, featureId: 'W14' },
    { ...request, featureId: 'W74' }, { ...request, featureId: 'W88' }, { ...request, variant: 'premium_cloud' },
    { ...request, strength: -1 }, { ...request, strength: 101 },
    { ...request, strength: NaN }, { ...request, hours: 15 },
    { ...request, mixPercent: 201 }, { ...request, depth: 'auto_detector' },
    { ...request, outfitRGB: [0, 256, 2] }, { ...request, referenceRGB: [0, 2] },
    { ...request, primaryRGB: ['0', 0, 0] },
  ]) {
    assert.throws(() => Women.applyPreview(source, width, height, mask, invalid));
  }
  assert.throws(() => Women.applyPreview(source, width, height, { torso: new Uint8Array(width * height) }, request));
  assert.throws(() => Women.applyPreview(source, width, height, {}, request));
  assert.throws(() => Women.applyPreview(source, width, height, { cheek_left: new Uint8Array(3) }, request));
  assert.throws(() => Women.applyPreview(source, width, height, maskFor('lips'), request));
  assert.throws(() => Women.applyPreview(source, width, 0, mask, request));
  assert.throws(() => Women.applyPreview(source, width + 1, height, mask, request));
  assert.throws(() => Women.applyPreview(source.subarray(0, source.length - 1), width, height, mask, request));
  assert.throws(() => Women.applyPreview(source, 16384, height, mask, request));
});

test('every feature masks its pixels and preserves the exact original alpha', () => {
  const source = sample(4), before = Uint8Array.from(source);
  for (const spec of Women.FEATURE_SPECS) {
    const regions = maskFor(spec.regions[0]);
    const req = { featureId: spec.id, variant: spec.variants[0], strength: 97 };
    const result = Women.applyPreview(source, width, height, regions, req);
    assert.equal(result.evidence.provider_calls, 0);
    assert.equal(result.evidence.outside_mask_changed, 0);
    assert.equal(result.evidence.changed_alpha_pixels, 0);
    assert.ok(result.evidence.largest_channel_delta <= spec.maxChannelDelta);
    assert.equal(result.evidence.mask_support_pixels, 6 * 8);
    assert.equal(result.evidence.valid_mask, true);
    assert.equal(result.evidence.simulated, true);
    for (let p = 0; p < width * height; p++) {
      if (regions[spec.regions[0]][p] === 0) {
        assert.deepEqual(result.pixels.subarray(p * 4, p * 4 + 4),
          source.subarray(p * 4, p * 4 + 4));
      }
      assert.equal(result.pixels[p * 4 + 3], source[p * 4 + 3]);
    }
  }
  assert.deepEqual(source, before);
});

test('all W-series preregistered contracts detect mask leaks and alpha corruption', () => {
  const source = sample(4);
  for (const spec of Women.FEATURE_SPECS) {
    const masks = maskFor(spec.regions[0]);
    const result = Women.applyPreview(source, width, height, masks, { featureId: spec.id, variant: spec.variants[0] });
    const good = Women.evaluateFrame(spec.id, source, result.pixels, width, height, masks, result.evidence);
    assert.equal(good.accepted, true, `${spec.id} ${JSON.stringify(good.failures)}`);
    const badAlpha = Uint8Array.from(result.pixels);
    badAlpha[3] ^= 1;
    assert.ok(Women.evaluateFrame(spec.id, source, badAlpha, width, height, masks).failures.includes('ALPHA_MODIFIED'));
    const badMask = Uint8Array.from(result.pixels);
    badMask[0] ^= 7;
    assert.ok(Women.evaluateFrame(spec.id, source, badMask, width, height, masks).failures.includes('OUTSIDE_MASK_EDIT'));
    assert.equal(good.status, 'SYNTHETIC_ONLY');
  }
});

test('only owned, local, network-free, brand-free and label-safe scripts are imported', () => {
  const engineDir = resolve(root, 'web/src/engines/women_styling');
  const scripts = readdirSync(engineDir).filter(name => name.endsWith('.ts'));
  assert.ok(scripts.length >= 8);
  for (const name of scripts) {
    const source = readFileSync(join(engineDir, name), 'utf8');
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|https?:\/\//);
    assert.doesNotMatch(source, /\b(localStorage|sessionStorage|indexedDB)\b\s*[.\[]/);
    assert.doesNotMatch(source, /\b(import|require)\b[^\n]*\b(makeup_w|hair_women|gender_look|upscale)\b/);
    assert.doesNotMatch(source, /API_KEY|PRIVATE_KEY|Bearer\s+[a-z0-9]{10,}/i);
  }
  assert.equal(Women.PASS_DEFINITIONS.length, Women.FEATURE_IDS.length);
  for (const d of Women.PASS_DEFINITIONS) {
    assert.ok(d.must_not_change.includes('alpha'));
    assert.ok(d.real_face_status.startsWith('UNPROVEN'));
    assert.equal(d.outside_mask_changed_limit, 0);
    assert.equal(d.provider_call_limit, 0);
  }
});
