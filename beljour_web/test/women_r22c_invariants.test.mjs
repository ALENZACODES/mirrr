/** Browser-only abuse, accessibility-copy and negative-path tests, R22c.
 * Original synthetic rectangles are kept in memory and never transmitted.
 * Author: John Khan.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editTopFive, firstSessionLift } from '../dist/js/engines/women_styling/topFive.js';
import { matchTwoSwatches, proxyLab } from '../dist/js/engines/women_styling/shadeMatch.js';
import { exportSalonPack, verifySalonPack } from '../dist/js/engines/women_styling/salonPack.js';

const makeImage = (width = 17, height = 19) => {
  const image = new Uint8Array(width * height * 4);
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = y * width + x;
    image[p * 4] = (x * 7 + y * 8 + 35) % 256;
    image[p * 4 + 1] = (x * 11 + y * 4 + 79) % 256;
    image[p * 4 + 2] = (x * 5 + y * 13 + 57) % 256;
    image[p * 4 + 3] = p % 3 ? 255 : 93;
    mask[p] = x > 3 && y > 3 && x < width - 3 ? 255 : 0;
  }
  return { image, mask, width, height };
};
const swatches = [
  { code: 'A', rgb: [127, 111, 99] },
  { code: 'B', rgb: [120, 108, 93] },
  { code: 'LIGHT', rgb: [220, 210, 200] },
];
const originalPNG = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10,
  ...Buffer.from('SYNTHETIC ORIGINAL NOT A PHOTO')]);
const previewPNG = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10,
  ...Buffer.from('SYNTHETIC PREVIEW NOT A PHOTO')]);

test('all local edits preserve outside-mask RGB and alpha, even for high strength', () => {
  const { image, mask, width, height } = makeImage();
  const prior = image.slice();
  const requests = [
    { feature: 'W39', strength: 100, rgb: [80, 160, 100] },
    { feature: 'W98', strength: 100, lighting: 'evening' },
    { feature: 'W28', strength: 100, baseDepth: 1,
      strokes: [{ startX: .2, startY: .1, endX: .8, endY: .8, radius: .2 }] },
  ];
  for (const req of requests) {
    const output = editTopFive(image, width, height, mask, req);
    for (let p = 0; p < width * height; p++) {
      for (let channel = 0; channel < 4; channel++) {
        if (!mask[p] || channel === 3) {
          assert.equal(output.pixels[p * 4 + channel], image[p * 4 + channel]);
        }
      }
    }
    assert.equal(output.evidence.still_her_score, 100);
    assert.equal(output.evidence.provider_calls, 0);
    assert.match(output.evidence.disclosure, /simulation/i);
  }
  assert.deepEqual(image, prior);
});

test('strength zero and daylight leave original pixels identical', () => {
  const { image, mask, width, height } = makeImage();
  assert.deepEqual(editTopFive(image, width, height, mask, {
    feature: 'W39', strength: 0,
  }).pixels, image);
  assert.deepEqual(editTopFive(image, width, height, mask, {
    feature: 'W98', strength: 100, lighting: 'daylight',
  }).pixels, image);
});

test('dark-base and colour-history caps cannot be bypassed through repeated strokes', () => {
  assert.equal(firstSessionLift(1, false), 22);
  assert.equal(firstSessionLift(10, false), 30);
  assert.equal(firstSessionLift(10, true), 16);
  const { image, mask, width, height } = makeImage();
  const stroke = { startX: .1, startY: .1, endX: .9, endY: .9, radius: .3 };
  const once = editTopFive(image, width, height, mask, {
    feature: 'W28', strength: 100, baseDepth: 2, strokes: [stroke],
  });
  const many = editTopFive(image, width, height, mask, {
    feature: 'W28', strength: 100, baseDepth: 2, strokes: [stroke, stroke, stroke],
  });
  assert.deepEqual(once.pixels, many.pixels);
  assert.ok(once.evidence.max_channel_delta <= 22);
});

test('all renderers reject missing masks, invalid dimensions and unsafe brushes', () => {
  const { image, mask, width, height } = makeImage();
  assert.throws(() => editTopFive(image, width, height, new Uint8Array(mask.length), {
    feature: 'W39', strength: 50,
  }), /mask/);
  assert.throws(() => editTopFive(image, -1, height, mask, {
    feature: 'W39', strength: 50,
  }), /dimensions/);
  assert.throws(() => editTopFive(image, width, height, mask, {
    feature: 'W39', strength: 101,
  }), /strength/);
  assert.throws(() => editTopFive(image, width, height, mask, {
    feature: 'W28', strength: 70, strokes: [],
  }), /strokes/);
  assert.throws(() => editTopFive(image, width, height, mask, {
    feature: 'W28', strength: 70,
    strokes: [{ startX: Number.NaN, startY: 0, endX: 1, endY: 1, radius: .3 }],
  }), /brush/);
});

test('W6 default refuses; low confidence never guesses or recommends lighter', () => {
  const target = [130, 114, 100];
  assert.equal(matchTwoSwatches(target, swatches).status, 'REFUSE');
  assert.equal(matchTwoSwatches(target, swatches, 'manual', 0).status, 'REFUSE');
  assert.equal(matchTwoSwatches(target, swatches, 'instrument_calibrated', 5).status, 'REFUSE');
  const response = matchTwoSwatches(target, swatches, 'instrument_calibrated', .4);
  assert.equal(response.status, 'TWO_SWATCH_TEST');
  assert.equal(response.swatches.length, 2);
  for (const shade of response.swatches) {
    assert.ok(proxyLab(shade.rgb)[0] <= proxyLab(target)[0] + .01);
  }
  assert.equal(response.provider_calls, 0);
  assert.equal(response.still_her_score, 100);
  assert.match(response.disclosure, /fictional/i);
});

test('W6 malformed swatch codes, channels and duplicates fail closed', () => {
  assert.throws(() => matchTwoSwatches([130, 114, 100], [
    { code: '<html>', rgb: [127, 111, 99] }, swatches[1],
  ]), /code/);
  assert.throws(() => matchTwoSwatches([130, 114, 100], [
    { code: 'A', rgb: [127, 111, 99] }, { code: 'A', rgb: [121, 105, 93] },
  ]), /Duplicate/);
  assert.throws(() => matchTwoSwatches([130, 114, 100], [
    { code: 'A', rgb: [127, 111, 999] }, swatches[1],
  ]), /RGB/);
});

test('W93 image export is opt-in; page order and hash checks prevent silent replacement', async () => {
  const now = '2026-10-24T14:30:00Z';
  const options = { originalMime: 'image/png', previewMime: 'image/png',
    steps: ['Retain the original.'], createdAt: now, userInitiated: true };
  await assert.rejects(exportSalonPack(originalPNG, previewPNG, {
    ...options, userInitiated: false,
  }), /Explicit user/);
  const packet = await exportSalonPack(originalPNG, previewPNG, options);
  assert.equal(packet.pages[0].number, 1);
  assert.equal(packet.pages[1].number, 2);
  assert.equal(await verifySalonPack(packet, now), true);
  assert.equal(await verifySalonPack(packet, '2026-10-25T14:30:00Z'), false);
  const altered = { ...packet, pages: [packet.pages[1], packet.pages[0]] };
  assert.equal(await verifySalonPack(altered, now), false);
  assert.equal(packet.provider_calls, 0);
  assert.equal(packet.still_her_score, 100);
});
