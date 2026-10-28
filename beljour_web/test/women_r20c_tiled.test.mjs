/** Browser-side proof of byte-identical halo/stripe rendering per W feature.
 * Author: John Khan. Every scene is algebraically drawn and discarded.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyPreview, applyPreviewTiled, FEATURE_SPECS } from '../dist/js/engines/women_styling/index.js';
function syntheticScene(width, height, channels = 4) {
  const image = new Uint8Array(width * height * channels);
  const masks = {};
  const regions = [
    ['face', .5, .47, .33, .37],
    ['cheek_left', .32, .54, .13, .11], ['cheek_right', .68, .54, .13, .11],
    ['under_eye_left', .34, .43, .10, .06], ['under_eye_right', .66, .43, .10, .06],
    ['eyelid_left', .34, .35, .10, .04], ['eyelid_right', .66, .35, .10, .04],
    ['lips', .5, .69, .12, .055], ['jaw', .5, .73, .24, .11],
    ['neck', .5, .93, .17, .08],
    ['hair', .5, .30, .40, .31],
    ['roots', .5, .15, .27, .09],
    ['tips', .5, .54, .36, .11],
    ['crown', .5, .12, .19, .085],
    ['hair_left', .19, .42, .14, .25],
    ['hair_right', .81, .42, .14, .25],
    ['scalp', .5, .19, .15, .08],
    ['hairline', .5, .26, .27, .045],
    ['fringe', .51, .33, .21, .08],
    ['lash_left', .35, .35, .12, .068],
    ['lash_right', .65, .35, .12, .068],
    ['lid_left', .35, .37, .14, .095],
    ['lid_right', .65, .37, .14, .095],
    ['liner_left', .35, .34, .13, .062],
    ['liner_right', .65, .34, .13, .062],
    ['iris_left', .35, .41, .09, .07],
    ['iris_right', .65, .41, .09, .07],
    ['brow_left', .35, .28, .14, .07],
    ['brow_right', .65, .28, .14, .07],
  ];
  for (const [region] of regions) masks[region] = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = y * width + x, nx = (x + .5) / width, ny = (y + .5) / height;
    image[p * channels] = (x * 9 + y * 5 + 88) % 256;
    image[p * channels + 1] = (x * 3 + y * 11 + 61) % 256;
    image[p * channels + 2] = (x * 7 + y * 13 + 113) % 256;
    if (channels === 4) image[p * channels + 3] = (x * 3 + y) % 7 === 0 ? 91 : 255;
    for (const [region, cx, cy, rx, ry] of regions) {
      const distance = ((nx - cx) / rx) ** 2 + ((ny - cy) / ry) ** 2;
      masks[region][p] = distance < 0.7 ? 255 : distance < 1.0 ? 145 : 0;
    }
  }
  return { image, masks };
}

test('all registered W-series plans produce identical full and 1/2/3/7/31-row stripes, including effects', () => {
  const width = 39, height = 35, channels = 4;
  const { image, masks } = syntheticScene(width, height, channels);
  const snapshot = Uint8Array.from(image);
  for (const spec of FEATURE_SPECS) {
    const request = { featureId: spec.id, variant: spec.variants[0], strength: 87, hours: 9 };
    const whole = applyPreview(image, width, height, masks, request);
    assert.ok(whole.evidence.changed_pixels > 0);
    for (const rows of [1, 2, 3, 7, 11, 31, 64]) {
      const tiled = applyPreviewTiled(image, width, height, masks, request, rows);
      assert.deepEqual(tiled.pixels, whole.pixels, `${spec.id}: stripe=${rows}`);
      assert.deepEqual(tiled.evidence, whole.evidence, `${spec.id}: evidence stripe=${rows}`);
    }
    assert.deepEqual(image, snapshot, `tiled ${spec.id} must preserve caller image`);
  }
});

test('a one-pixel-high painted area never becomes a full-frame fallback', () => {
  const width = 35, height = 72;
  const { image } = syntheticScene(width, height);
  for (const spec of FEATURE_SPECS) {
    const mask = new Uint8Array(width * height);
    for (let x = 5; x < 18; x++) mask[31 * width + x] = 255;
    const masks = { [spec.regions[0]]: mask };
    const req = { featureId: spec.id, variant: spec.variants[0], strength: 100 };
    const full = applyPreview(image, width, height, masks, req);
    const tile = applyPreviewTiled(image, width, height, masks, req, 3);
    assert.deepEqual(tile.pixels, full.pixels);
    for (let y = 0; y < height; y++) {
      if (y === 31) continue;
      assert.deepEqual(tile.pixels.subarray(y * width * 4, (y + 1) * width * 4),
        image.subarray(y * width * 4, (y + 1) * width * 4));
    }
    assert.equal(tile.evidence.outside_mask_changed, 0);
  }
});

test('sparse mask and all transparency levels do not create tile join artifacts', () => {
  const width = 15, height = 129;
  const { image, masks } = syntheticScene(width, height);
  for (let y = 0; y < height; y++) masks.face[y * width + 7] = y * 2 % 255;
  const req = { featureId: 'W9', variant: 'powder', strength: 100 };
  const expected = applyPreview(image, width, height, masks, req);
  for (const rows of [1, 2, 3, 17, 64, 255]) {
    const actual = applyPreviewTiled(image, width, height, masks, req, rows);
    assert.deepEqual(actual.pixels, expected.pixels);
    assert.deepEqual(actual.evidence, expected.evidence);
  }
});

test('invalid row limits and missing masks are rejected without side effects', () => {
  const width = 35, height = 72;
  const { image, masks } = syntheticScene(width, height);
  const snapshot = Uint8Array.from(image);
  const req = { featureId: 'W10', variant: 'dewy' };
  for (const rows of [-1, 0, 1025, 1.2, NaN, Infinity, false]) {
    assert.throws(() => applyPreviewTiled(image, width, height, masks, req, rows));
  }
  assert.throws(() => applyPreviewTiled(image, width, height, {}, req));
  assert.deepEqual(image, snapshot);
});
