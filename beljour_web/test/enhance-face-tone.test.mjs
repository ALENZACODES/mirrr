// Pass contract: supplied masks meter luminance, every covered output pixel has
// <=2.5 CIE L* rise, old safety limits still apply, no mask means no skin claim,
// alpha/input bytes are retained, and Python/TS synthetic output hashes agree.
// Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { byteImage, decode } from '../dist/js/engines/core/buffer.js';
import { rgbToLab } from '../dist/js/engines/core/colour.js';
import { analyse, tone, enhance, scene, lowLight } from '../dist/js/engines/local/enhance.js';
import { boundedExposure, guardOutput, measureSafety, withinLimits } from '../dist/js/engines/local/enhance-safety.js';
import { FaceToneMeter, faceWeights, faceToneReport, meteredLuminance } from '../dist/js/engines/local/face-tone.js';
import { applyLocalLayer } from '../dist/js/ui/shell/pipeline.js';
import { makeSample } from '../dist/js/ui/shell/demo.js';

const fullMask = (width, height, value = 1) => ({ width, height, channels: 1, data: new Float64Array(width * height).fill(value) });
function solid(width, height, colour) {
  const out = byteImage(width, height, 3);
  for (let i = 0; i < width * height; i++) out.data.set(colour, i * 3);
  return out;
}
function patchScene(background = 0) {
  const image = solid(16, 16, [background, background, background]), mask = fullMask(16, 16, 0);
  for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) {
    image.data.set([90, 72, 55], (y * 16 + x) * 3); mask.data[y * 16 + x] = y === 4 ? .25 : 1;
  }
  return { image, mask };
}
function independentRise(source, changed, mask) {
  let maximum = 0;
  for (let i = 0; i < mask.data.length; i++) if (mask.data[i] > 0) {
    const a = source.data.slice(i * source.channels, i * source.channels + 3);
    const b = changed.data.slice(i * changed.channels, i * changed.channels + 3);
    maximum = Math.max(maximum, rgbToLab(b)[0] - rgbToLab(a)[0]);
  }
  return maximum;
}
const toneOptions = mask => ({ wbWeight: 0, whiteBalance: false, exposureTarget: .18, exposureWeight: .9, faceMask: mask });

for (const [name, mask] of [
  ['empty', fullMask(16, 16, 0)], ['negative', fullMask(16, 16, -.01)],
  ['above one', fullMask(16, 16, 1.01)], ['NaN', fullMask(16, 16, NaN)],
  ['Infinity', fullMask(16, 16, Infinity)], ['wrong dimensions', fullMask(15, 16)],
  ['truncated array', { ...fullMask(16, 16), data: new Float64Array(5) }],
]) test(`explicit ${name} mask refuses without fallback to a skin claim`, () => {
  const image = solid(16, 16, [50, 40, 30]);
  assert.throws(() => faceWeights(mask, 16, 16), RangeError);
  assert.throws(() => enhance(image, 'natural', { faceMask: mask }), RangeError);
  assert.throws(() => tone(image, analyse(image), toneOptions(mask)), RangeError);
});

test('weights and measurement history do not alias caller masks or later photos', () => {
  const { image, mask } = patchScene(), weights = faceWeights(mask, 16, 16);
  const meter = new FaceToneMeter(image, weights), initial = meter.measure(image);
  mask.data.fill(0); image.data.fill(255);
  assert.equal(weights.data[6 * 16 + 6], 1);
  assert.equal(meter.measure(image).before_lstar, initial.before_lstar);
  assert.ok(meter.measure(image).max_rise > 2.5);
});

test('the covered face exposure request is independent of background brightness', () => {
  const dark = patchScene(0), bright = patchScene(255);
  const a = boundedExposure(dark.image, .18, .9, dark.mask), b = boundedExposure(bright.image, .18, .9, bright.mask);
  assert.equal(a.requested_gain, b.requested_gain);
  assert.equal(a.applied_gain, b.applied_gain);
  for (let i = 0; i < dark.mask.data.length; i++) if (dark.mask.data[i] > 0) {
    assert.deepEqual(a.image.data.slice(i * 3, i * 3 + 3), b.image.data.slice(i * 3, i * 3 + 3));
  }
  assert.notEqual(boundedExposure(dark.image).requested_gain, boundedExposure(bright.image).requested_gain);
});

test('fractional weights meter continuously and CIE low-light branch agrees', () => {
  const image = { width: 2, height: 1, channels: 3, data: Uint8Array.from([15, 35, 55, 210, 180, 140]) };
  const weights = { width: 2, height: 1, channels: 1, data: Float64Array.from([1, .1]) }, linear = decode(image);
  const lum = i => .2126 * linear.data[i * 3] + .7152 * linear.data[i * 3 + 1] + .0722 * linear.data[i * 3 + 2];
  assert.ok(Math.abs(meteredLuminance(linear, weights) - (lum(0) + .1 * lum(1)) / 1.1) < 1e-15);
  for (const colour of [[0, 0, 0], [10, 10, 10], [11, 11, 11], [20, 12, 8], [255, 255, 255]]) {
    const sample = solid(3, 2, colour), measured = new FaceToneMeter(sample, fullMask(3, 2)).measure(sample);
    assert.ok(Math.abs(measured.before_lstar - rgbToLab(colour)[0]) < 1e-12);
    assert.equal(measured.max_rise, 0);
  }
});

test('tone checks quantized output across six synthetic swatches and preserves originals', () => {
  for (const colour of [[15, 10, 8], [40, 30, 22], [80, 55, 38], [128, 95, 65], [180, 145, 115], [225, 200, 170]]) {
    const image = solid(16, 16, colour), original = image.data.slice(), mask = fullMask(16, 16);
    const result = tone(image, analyse(image), { ...toneOptions(mask), exposureTarget: 1, exposureWeight: 1 });
    assert.ok(independentRise(image, result, mask) <= 2.5);
    assert.ok(withinLimits(measureSafety(image, result)));
    assert.deepEqual(image.data, original);
  }
});

test('even a tiny positive mask weight protects an output pixel instead of averaging it away', () => {
  const source = solid(8, 8, [50, 50, 50]), candidate = solid(8, 8, [50, 50, 50]), mask = fullMask(8, 8);
  candidate.data.set([90, 90, 90], 0); mask.data[0] = 1e-8;
  const result = guardOutput(source, candidate, mask);
  assert.equal(result.reduced, true);
  assert.ok(result.face_tone.max_rise <= 2.5);
  assert.ok(independentRise(source, result.image, mask) <= 2.5);
  assert.ok(result.image.data.some((v, i) => v !== source.data[i]));
});

test('every Enhance mode measures its final bytes against the original face', () => {
  const source = lowLight(scene(48, 40), .22), mask = fullMask(48, 40, 0);
  for (let y = 8; y < 32; y++) for (let x = 8; x < 40; x++) mask.data[y * 48 + x] = 1;
  for (const mode of ['natural', 'portrait', 'low_light', 'backlit', 'vivid']) {
    const result = enhance(source, mode, { faceMask: mask });
    assert.equal(result.condition.low_light, true);
    assert.equal(result.steps.face_metering, 'supplied_face_mask');
    assert.equal(result.safety.face_tone.evidence, 'supplied_face_mask');
    assert.ok(independentRise(source, result.image, mask) <= 2.5);
    assert.ok(withinLimits(measureSafety(source, result.image)));
  }
});

test('no mask makes no skin claim; normal and zero-strength bytes including alpha stay original', () => {
  const source = scene(48, 40), mask = fullMask(48, 40), rgba = byteImage(48, 40, 4);
  for (let i = 0; i < 48 * 40; i++) { rgba.data.set(source.data.subarray(i * 3, i * 3 + 3), i * 4); rgba.data[i * 4 + 3] = i % 256; }
  const unmeasured = enhance(lowLight(source, .3), 'low_light');
  assert.equal('face_tone' in unmeasured.safety, false);
  assert.equal('face_metering' in unmeasured.steps, false);
  for (const [image, strength] of [[rgba, 1], [lowLight(source, .3), 0]]) {
    const result = enhance(image, 'low_light', { strength, faceMask: mask });
    assert.deepEqual(result.image.data, image.data);
    assert.equal(result.safety.face_tone.max_rise, 0);
  }
});

test('shell uses a known mesh and marks absent or invalid geometry as unmeasured', () => {
  const source = makeSample('portrait');
  const layer = { id: 'enhance', kind: 'enhance', name: 'Enhance', enabled: true, opacity: 1, strength: 100,
    parameters: { mode: 'natural' }, provenance: 'local', simulation: false, origin: 'sample' };
  const measured = applyLocalLayer(source.image, source, layer);
  assert.equal(measured.metrics.face_metering, 'supplied_face_mask');
  assert.ok(measured.metrics.skin_lstar_max_rise <= 2.5);
  for (const face of [undefined, [], Array.from({ length: 478 }, () => [NaN, 0])]) {
    const result = applyLocalLayer(source.image, { ...source, face }, layer);
    assert.equal(result.metrics.face_metering, 'unmeasured');
    assert.equal('skin_lstar_max_rise' in result.metrics, false);
  }
});

test('new Python-generated vectors match exact browser bytes and numeric reports', () => {
  const vectors = JSON.parse(readFileSync(new URL('../../api/tests/goldens/enhance-face-tone.json', import.meta.url), 'utf8'));
  assert.equal(vectors.format, 'beljour-enhance-face-tone/1');
  for (const vector of vectors.cases) {
    const { image, mask } = patchScene(vector.background), result = tone(image, analyse(image), toneOptions(mask));
    assert.equal(createHash('sha256').update(result.data).digest('hex'), vector.sha256);
    const actual = faceToneReport(new FaceToneMeter(image, mask).measure(result));
    for (const [key, expected] of Object.entries(vector.face_tone)) {
      if (typeof expected === 'number') assert.ok(Math.abs(actual[key] - expected) <= 1e-8, `${key}: ${actual[key]} vs ${expected}`);
      else assert.equal(actual[key], expected);
    }
  }
});
