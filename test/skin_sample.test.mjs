import test from 'node:test';
import assert from 'node:assert/strict';
import { measureSkin } from '../public/skin-sample.js';
import { portrait } from './harness/portrait.mjs';
import { MONK_LAB } from '../src/skin_gamut.js';
import { rgbToLab, deltaE2000 } from '../public/photo-engine.js';

test('daylight portraits: every Monk tone is measured within ΔE2000 1.5, with confidence and patches', () => {
  for (const [id, lab] of Object.entries(MONK_LAB)) {
    const m = measureSkin(portrait(lab, { seed: 5 }));
    assert.ok(m, `${id}: no reading`);
    const e = deltaE2000(rgbToLab(m.rgb.r, m.rgb.g, m.rgb.b), lab);
    assert.ok(e <= 1.5, `${id}: ΔE ${e.toFixed(2)}`);
    assert.ok(m.confidence > 0 && m.confidence <= 1 && m.patches.length >= 3);
  }
});

test('deep skin is not floored or trimmed away (Monk 10, L* 14.6)', () => {
  const m = measureSkin(portrait(MONK_LAB.mst10, { seed: 9 }));
  const L = rgbToLab(m.rgb.r, m.rgb.g, m.rgb.b)[0];
  assert.ok(Math.abs(L - 14.6) < 2, `L* ${L.toFixed(1)}`);
});

test('a strong colour cast is reported and reduced; clipped light skin still gives a flagged reading', () => {
  const m = measureSkin(portrait(MONK_LAB.mst7, { light: 'tungsten', seed: 3 }));
  assert.ok(m.flags.some(f => /cast corrected/.test(f)));
  const raw = measureSkin(portrait(MONK_LAB.mst7, { light: 'tungsten', seed: 3 }), { whiteBalance: false });
  const e = l => deltaE2000(rgbToLab(l.rgb.r, l.rgb.g, l.rgb.b), MONK_LAB.mst7);
  assert.ok(e(m) < e(raw), `corrected ${e(m).toFixed(2)} vs raw ${e(raw).toFixed(2)}`);
  const light = measureSkin(portrait(MONK_LAB.mst2, { light: 'tungsten', seed: 3 }));
  assert.ok(light, 'no null reading on clipped light skin');
});
