/** Runtime cross-language contour parity: every new preset × 2 RGB shapes. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import * as Engine from '../dist/js/engines/menshair/render.js';
import * as Detail from '../dist/js/engines/menshair/detailing.js';

const root = resolve(new URL('../..', import.meta.url).pathname);
const py = process.env.BELJOUR_PYTHON || (existsSync(resolve(root, 'api/.venv/bin/python')) ?
  resolve(root, 'api/.venv/bin/python') : 'python3');
const script = resolve(root, 'api/tests/test_menshair_r19c_detail.py');
const run = spawnSync(py, [script, '--emit-vectors'], {
  cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
  env: { ...process.env, PYTHONPATH: resolve(root, 'api') },
});
assert.equal(run.status, 0, run.stderr || String(run.error));
const vectors = JSON.parse(run.stdout);
const presets = JSON.parse(readFileSync(resolve(root, 'api/plumb_api/engines/menshair/presets.json'), 'utf8'));
const byId = new Map(presets.styles.map(p => [p.id, p]));
function scene(shift, rgba) {
  const w = 37, h = 44, n = w * h, channels = rgba ? 4 : 3;
  const image = new Uint8Array(n * channels), hair = new Uint8Array(n), scalp = new Uint8Array(n);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = y * w + x, off = p * channels;
    image[off] = (x * 7 + y * 11 + 43 + shift) % 256;
    image[off + 1] = (x * 13 + y * 5 + 67 + shift) % 256;
    image[off + 2] = (x * 17 + y * 3 + 131 + shift) % 256;
    if (rgba) image[off + 3] = (x + y) % 6 === 0 ? 125 : 255;
    const disk = ((x + .5 - w * .5) / (w * .35)) ** 2 + ((y + .5 - h * .31) / (h * .27)) ** 2;
    hair[p] = disk < .9 ? 255 : (disk < 1.15 ? 100 : 0);
    scalp[p] = disk < 1.18 && (x + y) % 3 !== 0 ? 120 : 0;
  }
  return { image, hair, scalp, channels };
}

test('all newly authored detailing controls validate and use no implicit network', () => {
  assert.equal(vectors.format, 'beljour-r19c-detail-vectors/1');
  assert.equal(vectors.provider_calls, 0);
  assert.match(vectors.origin, /no real faces/);
  assert.equal(vectors.scenarios.length, 110);
  for (const scenario of vectors.scenarios) {
    const preset = byId.get(scenario.id);
    assert.ok(preset && preset.detail, `${scenario.id} is an authored renderer preset`);
    assert.doesNotThrow(() => Engine.validateRecipe(preset));
    assert.ok(Detail.activeDetail(preset.detail));
  }
  assert.throws(() => Detail.validateDetail({ edge: 'random' }));
  assert.throws(() => Detail.validateDetail({ fringe_drop: 101 }));
  assert.throws(() => Detail.validateDetail({ direction: NaN }));
});

test('every R19 contour render matches Python within one RGB channel value, mask and alpha exact', () => {
  for (const row of vectors.scenarios) {
    const preset = byId.get(row.id), img = scene(row.shift, row.shift === 0);
    const original = new Uint8Array(img.image);
    const result = Engine.renderStyle(img.image, vectors.width, vectors.height, img.hair,
      vectors.anchors, preset, img.scalp);
    const expected = Buffer.from(row.pixels, 'base64');
    assert.equal(result.pixels.length, expected.length);
    assert.equal(result.evidence.provider_calls, 0);
    assert.equal(result.evidence.affected_pixels, row.affected);
    assert.equal(result.evidence.mask_support_pixels, row.support);
    for (let i = 0; i < img.hair.length; i++) {
      for (let k = 0; k < img.channels; k++) {
        const index = i * img.channels + k;
        const diff = Math.abs(result.pixels[index] - expected[index]);
        assert.ok(diff <= 1, `${row.id}: pixel ${index}: got ${result.pixels[index]}, python ${expected[index]}`);
        if (img.channels === 4 && k === 3 || (img.hair[i] === 0 && img.scalp[i] === 0)) {
          assert.equal(result.pixels[index], original[index]);
        }
      }
    }
    assert.deepEqual(img.image, original, 'caller owned image remains unchanged');
  }
});
