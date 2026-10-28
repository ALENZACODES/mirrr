/** Python reference parity for every R20c women's feature variant and masks.
 * Generated synthetic vectors exist only in memory during tests; no portrait
 * data is shipped or uploaded. Author: John Khan.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as Women from '../dist/js/engines/women_styling/index.js';
import * as Palette from '../dist/js/engines/women_styling/palette.js';
const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const candidate = resolve(root, 'api/.venv/bin/python');
const python = process.env.BELJOUR_PYTHON || (existsSync(candidate) ? candidate : 'python3');
const script = resolve(root, 'api/tests/test_women_r20c_vectors.py');
const proc = spawnSync(python, [script, '--emit-vectors'], {
  cwd: root, encoding: 'utf8', maxBuffer: 12 * 1024 * 1024,
  env: { ...process.env, PYTHONPATH: resolve(root, 'api') },
});
assert.equal(proc.status, 0, proc.stderr || String(proc.error));
const data = JSON.parse(proc.stdout);
const decode = text => new Uint8Array(Buffer.from(text, 'base64'));
const asRequest = req => ({
  featureId: req.feature_id,
  variant: req.variant,
  strength: req.strength,
  undertone: req.undertone,
  depth: req.depth,
  outfitRGB: req.outfit_rgb,
  referenceRGB: req.reference_rgb,
  primaryRGB: req.primary_rgb,
  secondaryRGB: req.secondary_rgb,
  mixPercent: req.mix_percent,
  hours: req.hours,
});

test('authored W-series registry, swatches and pass contracts exactly match Python', () => {
  assert.equal(data.format, 'beljour-r20c-women-vectors/1');
  assert.match(data.origin, /not from real faces/);
  assert.equal(data.provider_calls, 0);
  assert.deepEqual(data.features, Women.FEATURE_IDS);
  assert.equal(data.swatches.length, Women.SWATCHES.length);
  for (let i = 0; i < data.swatches.length; i++) {
    const py = data.swatches[i], ts = Women.SWATCHES[i];
    assert.deepEqual(py, ts);
  }
  assert.equal(data.definitions.length, Women.PASS_DEFINITIONS.length);
  for (const py of data.definitions) {
    const ts = Women.PASS_DEFINITIONS.find(d => d.id === py.id);
    assert.deepEqual(ts, py, `pass contract ${py.id}`);
  }
  assert.ok(data.cases.length >= 60);
  assert.equal(new Set(data.cases.map(c => `${c.id}:${c.variant}:${c.scenario}`)).size, data.cases.length);
});

for (const featureId of data.features) {
  test(`${featureId}: Python reference parity for every variant, RGB and RGBA`, () => {
  for (const scenario of data.cases.filter(item => item.id === featureId)) {
    const source = decode(scenario.source), before = Uint8Array.from(source);
    const masks = Object.fromEntries(Object.entries(scenario.masks).map(([name, value]) => [name, decode(value)]));
    const output = Women.applyPreview(source, scenario.width, scenario.height, masks, asRequest(scenario.request));
    const reference = decode(scenario.pixels);
    assert.equal(output.pixels.length, reference.length);
    const stride = source.length / (scenario.width * scenario.height);
    for (let p = 0; p < scenario.width * scenario.height; p++) {
      const authorized = Object.values(masks).some(m => m[p] !== 0);
      for (let channel = 0; channel < stride; channel++) {
        const i = p * stride + channel;
        const error = Math.abs(output.pixels[i] - reference[i]);
        assert.ok(error <= 1, `${scenario.id}/${scenario.variant}/${scenario.scenario}: ${i} got ${output.pixels[i]}, Python ${reference[i]}`);
        if (!authorized || channel === 3) assert.equal(output.pixels[i], source[i], 'outside mask and alpha unchanged');
      }
    }
    assert.deepEqual(source, before, 'source array belongs to caller');
    assert.equal(output.evidence.provider_calls, 0);
    assert.equal(output.evidence.outside_mask_changed, 0);
    assert.equal(output.evidence.changed_alpha_pixels, 0);
    assert.equal(output.evidence.mask_support_pixels, scenario.evidence.mask_support_pixels);
    assert.equal(output.evidence.changed_pixels, scenario.evidence.changed_pixels);
    assert.equal(output.evidence.largest_channel_delta, scenario.evidence.largest_channel_delta);
    assert.equal(output.evidence.disclosure, scenario.evidence.disclosure);
    const evaluation = Women.evaluateFrame(scenario.id, source, output.pixels,
      scenario.width, scenario.height, masks, output.evidence);
    assert.equal(evaluation.accepted, true, JSON.stringify({ scenario: scenario.id, failure: evaluation.failures }));
    assert.equal(evaluation.status, 'SYNTHETIC_ONLY');
  }
  });
}

test('colour mixer and outfit harmony give the same integer arithmetic across runtimes', () => {
  assert.deepEqual(Palette.mixRGB([12, 95, 231], [241, 189, 6], 0), [12, 95, 231]);
  assert.deepEqual(Palette.mixRGB([12, 95, 231], [241, 189, 6], 100), [241, 189, 6]);
  for (let p = 0; p <= 100; p++) {
    const a = Palette.mixRGB([22, 81, 156], [181, 204, 13], p);
    const b = Palette.mixRGB([181, 204, 13], [22, 81, 156], 100 - p);
    assert.deepEqual(a, b);
  }
  for (const family of ['warm', 'cool', 'neutral']) {
    assert.equal(Palette.suggestedPalette(family).length, 4);
    assert.equal(Palette.pickSwatch(family).family, family);
  }
});
