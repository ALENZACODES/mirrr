// Usability 4.1: face chips at least 44 px with her own face thumbnail.
// Drawn image and points only. Author: John Khan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { byteImage } from '../dist/js/engines/core/buffer.js';
import { faceChipBox, chipThumbnail, CHIP_PX, THUMB_PX } from '../dist/js/layout/face-chip.js';

test('chips are at least 44 px in the stylesheet', () => {
  const css = readFileSync(new URL('../layout.css', import.meta.url), 'utf8');
  const rule = css.match(/\.lg-faces button \{([^}]*)\}/)[1];
  const rem = (name) => Number(rule.match(new RegExp(`${name}:\\s*([0-9.]+)rem`))[1]);
  assert.ok(rem('min-width') * 16 >= CHIP_PX);
  assert.ok(rem('min-height') * 16 >= CHIP_PX);
  assert.equal(CHIP_PX, 44);
});

test('the crop is a padded square around her face points, inside the photo', () => {
  const pts = [[100, 120], [160, 120], [130, 200]];
  const box = faceChipBox(pts, 400, 300);
  assert.equal(box.size, Math.round(80 * 1.5));
  assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.size <= 400 && box.y + box.size <= 300);
  const edge = faceChipBox([[2, 2], [40, 60]], 50, 50);
  assert.ok(edge.x >= 0 && edge.y >= 0 && edge.x + edge.size <= 50 && edge.y + edge.size <= 50);
  assert.equal(faceChipBox([], 10, 10), null);
  assert.equal(faceChipBox([[1, 1], [1, 1]], 10, 10), null);
  assert.equal(faceChipBox([[NaN, 1], [4, 4]], 10, 10), null);
});

test('the thumbnail is her own pixels, averaged', () => {
  const img = byteImage(100, 100, 3);
  for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) {
    const i = (y * 100 + x) * 3;
    img.data[i] = x < 50 ? 200 : 20; img.data[i + 1] = 90; img.data[i + 2] = y < 50 ? 10 : 160;
  }
  const thumb = chipThumbnail(img, { x: 0, y: 0, size: 100 });
  assert.equal(thumb.width, THUMB_PX);
  assert.equal(thumb.channels, 4);
  const at = (x, y) => Array.from(thumb.data.slice((y * THUMB_PX + x) * 4, (y * THUMB_PX + x) * 4 + 4));
  assert.deepEqual(at(0, 0), [200, 90, 10, 255]);
  assert.deepEqual(at(THUMB_PX - 1, THUMB_PX - 1), [20, 90, 160, 255]);
});
