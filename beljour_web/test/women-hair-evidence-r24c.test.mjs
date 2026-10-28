/** W28/W39 CIELAB evidence comparison with Python runtime vectors.
 * No image file or generated JSON is committed. Author: John Khan.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { resolve } from 'node:path';
import { measureHairChange } from '../dist/js/engines/women_styling/hairEvidence.js';

const root = resolve(import.meta.dirname, '../..');
const python = process.env.BELJOUR_PYTHON || 'python3';
const result = spawnSync(python, ['api/tests/test_women_hair_evidence_r24c.py'], {
  cwd: root, encoding: 'utf8', env: { ...process.env, PYTHONPATH: resolve(root, 'api') },
});
assert.equal(result.status, 0, result.stderr);
const records = JSON.parse(result.stdout);

test('W28 and W39 Lab evidence matches the Python reference', () => {
  assert.deepEqual(records.map(r => r.feature), ['W28', 'W39']);
  for (const row of records) {
    const got = measureHairChange(row.source, row.after, row.mask,
      row.width, row.height, row.channels, row.feature);
    assert.equal(got.hair_pixels, row.width * row.height);
    assert.equal(got.status, 'UNPROVEN');
    assert.equal(got.maximum_channel_delta, row.evidence.maximum_channel_delta);
    assert.ok(Math.abs(got.lightness_delta_lstar - row.evidence.lightness_delta_lstar) < .001);
    assert.ok(Math.abs(got.chroma_delta_de76 - row.evidence.chroma_delta_de76) < .001);
    for (let i = 0; i < 3; i++) {
      assert.ok(Math.abs(got.mean_rgb_delta[i] - row.evidence.mean_rgb_delta[i]) < .0001);
    }
  }
});

test('missing or too-small region is refused, not marked quality passed', () => {
  const frame = new Uint8Array(5 * 6 * 4);
  assert.throws(() => measureHairChange(frame, frame, new Uint8Array(30), 6, 5, 4, 'W28'));
  assert.throws(() => measureHairChange(frame, frame, new Uint8Array(1), 6, 5, 4, 'W39'));
});
