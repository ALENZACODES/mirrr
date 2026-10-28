/** R19 colour and fibre comparison parity; all vectors computed in Python at test time. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import * as P from '../dist/js/engines/menshair/palette.js';

const root = resolve(new URL('../..', import.meta.url).pathname);
const py = process.env.BELJOUR_PYTHON || (existsSync(resolve(root,'api/.venv/bin/python')) ?
  resolve(root,'api/.venv/bin/python') : 'python3');
const run = spawnSync(py, [resolve(root,'api/tests/test_menshair_r19c_palette.py'), '--emit-vectors'], {
  cwd: root, encoding: 'utf8', maxBuffer: 14 * 1024 * 1024,
  env: { ...process.env, PYTHONPATH: resolve(root,'api') },
});
assert.equal(run.status, 0, run.stderr || String(run.error));
const data = JSON.parse(run.stdout);
const decode = v => new Uint8Array(Buffer.from(v, 'base64'));
const image = decode(data.image), hair = decode(data.hair), scalp = decode(data.scalp);

function within(bytes, actual, context) {
  assert.equal(actual.length, bytes.length, `${context} size`);
  for (let i = 0; i < bytes.length; i++) {
    assert.ok(Math.abs(bytes[i] - actual[i]) <= 1,
      `${context} byte ${i}: Python ${bytes[i]}, TS ${actual[i]}`);
  }
}
test('22 original fictional swatches have the same IDs, group and literal pigments', () => {
  assert.equal(data.provider_calls, 0);
  assert.equal(data.synthetic_only, true);
  assert.equal(P.SWATCHES.length, 22);
  assert.deepEqual(P.SWATCHES.map(s => ({id:s.id,rgb:s.rgb,family:s.family,name:s.name})), data.swatches);
  for (const row of data.swatches) {
    assert.equal(P.rankSwatches(row.rgb, null, 22)[0].swatch.id, row.id);
    assert.equal(P.rankSwatches(row.rgb, null, 22)[0].delta_e76, 0);
  }
  assert.throws(() => P.validateColourOptions({swatch_id:'external-company'}));
  assert.throws(() => P.validateColourOptions({swatch_id:'local-cocoa',seed:-1}));
  assert.throws(() => P.renderColour(image, data.width, data.height, hair, data.anchors,
    {swatch_id:'local-cocoa', strength:201}));
});
test('all 88 tint swatch/region pairs preserve outside-mask and alpha; Python-TS parity', () => {
  assert.equal(data.renders.length, 88);
  for (const row of data.renders) {
    const outcome = P.renderColour(image, data.width, data.height, hair, data.anchors,
      {swatch_id:row.swatch, strength:82,preserve_highlights:45,region:row.region,feather:38,seed:101});
    within(decode(row.pixels), outcome.after, `${row.swatch}/${row.region}`);
    assert.deepEqual(outcome.metrics.sampled_reference, row.reference);
    assert.equal(outcome.metrics.sample_count, row.sample_count);
    assert.equal(outcome.metrics.edited_pixels, row.edited);
    assert.equal(outcome.metrics.mask_support_pixels, row.support);
    assert.ok(Math.abs(outcome.metrics.undertone_delta_e76 - row.delta_e76) < 1e-9);
    assert.equal(outcome.metrics.provider_calls, 0);
    for (let p = 0; p < hair.length; p++) {
      if (!hair[p]) assert.deepEqual(outcome.after.slice(p*4,p*4+4), image.slice(p*4,p*4+4));
      assert.equal(outcome.after[p*4+3], image[p*4+3]);
    }
  }
});
test('22 user-selected fibre pigments link to previous topical engine and reduce scalp-show metric', () => {
  assert.equal(data.fibres.length, P.SWATCHES.length);
  for (const row of data.fibres) {
    const result = P.renderPaletteFibres(image, data.width, data.height, hair, scalp,
      Float64Array.from(data.density), data.anchors,
      {swatch_id:row.swatch,strength:93,density_gain:88});
    within(decode(row.pixels), result.after, `fibre:${row.swatch}`);
    assert.ok(Math.abs(result.metrics.scalp_show_before - row.show_before) < 1e-10);
    assert.ok(Math.abs(result.metrics.scalp_show_after - row.show_after) < 1e-10);
    assert.ok(result.metrics.scalp_show_after < result.metrics.scalp_show_before);
    assert.equal(result.metrics.colour_delta_e76, 0);
    assert.equal(result.metrics.provider_calls, 0);
  }
});
