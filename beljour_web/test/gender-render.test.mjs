// R13 gender render path: Python parity and same rules for both directions.
// Drawn heads with hard-edged backgrounds only; no network. Pass: region scales,
// failed rules and targets match Python; the final render breaks no rule.
// Author: John Khan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { byteImage } from '../dist/js/engines/core/buffer.js';
import { renderGenderTargets, triangleRatios, TRIANGLE_RATIO_MIN, SEAM_LIMIT, SEAM_MARGIN } from '../dist/js/engines/shape/gender-render.js';
import { layout } from '../dist/js/engines/warp/mesh.js';

const vectors = JSON.parse(readFileSync(new URL('../../parity/gender-render.json', import.meta.url)));
const tol = vectors.float_tolerance;

function photo(c) {
  const img = byteImage(c.width, c.height, 3);
  img.data.set(c.image);
  return img;
}

test('fixture is synthetic and authored by John Khan', () => {
  assert.equal(vectors.format, 'beljour-gender-render-r13/1');
  assert.equal(vectors.author, 'John Khan');
  assert.equal(vectors.synthetic, true);
  assert.equal(vectors.cases.length, 2);
});

for (const c of vectors.cases) test(`render path matches Python: slider ${c.slider}`, () => {
  const result = renderGenderTargets(photo(c), c.points, c.slider);
  assert.deepEqual(result.failed, c.failed);
  assert.deepEqual(result.regionsTried, c.regions_tried);
  for (const [name, value] of Object.entries(c.region_scales)) assert.equal(result.regionScales[name], value, name);
  result.points.forEach((p, i) => {
    assert.ok(Math.abs(p[0] - c.targets[i][0]) <= tol, `x ${i}`);
    assert.ok(Math.abs(p[1] - c.targets[i][1]) <= tol, `y ${i}`);
  });
  assert.ok(Math.abs(result.seamRatio - c.seam_ratio) <= 1e-6);
  assert.ok(result.seamRatio <= SEAM_MARGIN * SEAM_LIMIT);
  assert.ok(result.triangleMin >= TRIANGLE_RATIO_MIN);
  assert.ok(result.effectRetention > 0 && result.effectRetention <= 1);
});

test('zero slider is the identity and bad factors are refused', () => {
  const c = vectors.cases[0];
  const zero = renderGenderTargets(photo(c), c.points, 0);
  zero.points.forEach((p, i) => { assert.equal(p[0], c.points[i][0]); assert.equal(p[1], c.points[i][1]); });
  assert.throws(() => renderGenderTargets(photo(c), c.points, 33, { regionStrengths: { jaw: 2 } }), /factor/);
  assert.throws(() => renderGenderTargets(photo(c), c.points, 33, { regionStrengths: { ears: 1 } }), /region/);
});

test('triangle ratios are 1 for the identity', () => {
  const c = vectors.cases[1];
  const lay = layout(c.points, c.width, c.height);
  for (const r of triangleRatios(lay, c.points)) assert.equal(r, 1);
});
