// W6 on this device: the view shows the measured shades with their CIEDE2000
// difference, never a lighter-than-measured pick, and a refusal as a plain reason.
// Drawn skin pixels only. Author: John Khan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findFromPixels } from '../dist/js/engines/shade/finder.js';
import { localShadeView, labHex, pixelPoints } from '../dist/js/screens/shade-local.js';

function patch(rgb, n = 400, jitter = 3) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(rgb.map((v, k) => Math.max(0, Math.min(255, v + ((i * (k + 3)) % (2 * jitter + 1)) - jitter))));
  return out;
}

test('a clear reading shows two shades with their colour difference and the label', () => {
  const skin = [176, 128, 98];
  const result = findFromPixels({ cheek_right: patch(skin), cheek_left: patch(skin), forehead: patch(skin) });
  const view = localShadeView(result);
  assert.equal(view.refused, false);
  assert.ok(view.swatches.length >= 1 && view.swatches.length <= 2);
  for (const s of view.swatches) {
    assert.match(s.hex, /^#[0-9a-f]{6}$/);
    assert.match(s.detail, /CIEDE2000\) \d+\.\d/);
  }
  assert.match(view.label, /not tested against real products/i);
  assert.ok(view.lines.some((l) => /Undertone/.test(l)));
  assert.ok(result.never_lighter);
});

test('an unclear reading is refused with a reason, not guessed', () => {
  const result = findFromPixels({ cheek_right: patch([30, 200, 40], 5), cheek_left: [], forehead: [] });
  const view = localShadeView(result);
  assert.equal(view.refused, true);
  assert.equal(view.swatches.length, 0);
  assert.match(view.lines[0], /did not pick a shade/);
});

test('hex and pixel helpers', () => {
  assert.equal(labHex([100, 0, 0]), '#ffffff');
  assert.equal(labHex([0, 0, 0]), '#000000');
  assert.deepEqual(pixelPoints([{ x: 0.5, y: 0.25 }], 200, 400), [[100, 100]]);
  assert.deepEqual(pixelPoints([{ x: 50, y: 25 }], 200, 400), [[50, 25]]);
});
