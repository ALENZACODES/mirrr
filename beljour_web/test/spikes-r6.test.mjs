// R6 LS1 turn, LS2 gender and LS3 age unit tests, with synthetic 478-point inputs.
// No model weights, paid endpoints, file access or remote requests. Author: John Khan.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { byteImage, floatImage } from '../dist/js/engines/core/buffer.js';
import { checkXYZ, project, rollFromEyes, normalisedXYZ, straighten, renderTurn,
  YAW_LIMIT, PITCH_LIMIT } from '../dist/js/engines/local/turn.js';
import { bands, genderTargets, validateOptions, STOPS, REGIONS, SCOPES, LABEL as GENDER_LABEL } from '../dist/js/engines/local/gender.js';
import { renderAge, ageStrength, random32, curvePoints, creasePlan, checkLayers,
  OLDER_STOPS, YOUNGER_STOPS, LABEL as AGE_LABEL } from '../dist/js/engines/local/age.js';
import { displacement } from '../dist/js/engines/shape/geometry.js';
const data = JSON.parse(readFileSync(new URL('../../parity/face-spikes-r6.json', import.meta.url)));
const mesh = data.faces[0].xyz;
const xy = mesh.map((p) => p.slice(0, 2));
const near = (a, b, tol = 1e-8) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);
function image() {
  const img = byteImage(180, 200, 3);
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    const p = (y * img.width + x) * 3;
    img.data[p] = 62 + Math.floor(x * .5);
    img.data[p + 1] = 95 + Math.floor(y * .3);
    img.data[p + 2] = 134 + ((x / 9 | 0) + (y / 9 | 0)) % 2 * 12;
  }
  return img;
}

test('LS1 bounded projection is an identity at zero and moves a 3D mesh at nonzero stops', () => {
  assert.equal(YAW_LIMIT, 8); assert.equal(PITCH_LIMIT, 6);
  checkXYZ(mesh);
  for (let i = 0; i < xy.length; i++) for (let j = 0; j < 2; j++) near(project(mesh).points[i][j], xy[i][j], 1e-10);
  for (const [yaw, pitch, roll] of [[-8, 0, 0], [8, 0, 0], [0, -6, 0], [0, 6, 0], [4, -3, 2]]) {
    const p = project(mesh, yaw, pitch, roll);
    assert.equal(p.points.length, 478);
    assert.ok(p.depth.every(Number.isFinite));
    assert.ok(displacement(xy, p.points).max_iod_percent > .01);
    assert.ok(p.points.every((v) => v.every(Number.isFinite)));
  }
});

test('LS1 rejects huge poses, malformed coordinates and invalid normalized data', () => {
  for (const yaw of [-8.1, 8.1, Number.NaN, Infinity]) {
    assert.throws(() => project(mesh, yaw), /LS1/);
  }
  for (const pitch of [-6.1, 6.1, Infinity]) assert.throws(() => project(mesh, 0, pitch), /LS1/);
  assert.throws(() => project(mesh, 0, 0, 25.01), /LS1/);
  assert.throws(() => checkXYZ(mesh.slice(1)), /478 finite/);
  assert.throws(() => checkXYZ(mesh.map((p, i) => i === 4 ? [0, 0, NaN] : p)), /478 finite/);
  assert.throws(() => normalisedXYZ(mesh, 0, 100), /positive image/);
  assert.throws(() => normalisedXYZ(mesh.slice(1), 100, 100), /478 triples/);
});

test('LS1 normalized recorder positions convert back to pixel XYZ and roll fallback is stable', () => {
  const normalized = mesh.map(([x, y, z]) => [x / 180, y / 200, z / 180]);
  const actual = normalisedXYZ(normalized, 180, 200);
  for (let i = 0; i < mesh.length; i++) for (let j = 0; j < 3; j++) near(actual[i][j], mesh[i][j], 1e-9);
  const angle = rollFromEyes(mesh);
  assert.ok(angle >= -25 && angle <= 25);
  const straight = straighten(image(), mesh);
  assert.equal(straight.image.data.length, 180 * 200 * 3);
  assert.match(straight.label, /straighten/i);
  assert.ok(straight.metrics.min_det === 1);
});

test('LS1 raster turn reuses R5 fold guard and preserves outside corner pixels', () => {
  const img = image();
  const result = renderTurn(img, mesh, {yaw: 4, pitch: 0, fillStrip: false});
  assert.match(result.label, /simulation/);
  assert.ok(result.metrics.strength_used > 0 && result.metrics.strength_used <= 1);
  assert.equal(result.editMask.width, 180);
  assert.equal(result.image.width, 180);
  assert.deepEqual([...result.image.data.slice(0, 3)], [...img.data.slice(0, 3)]);
  assert.deepEqual([...result.image.data.slice(-3)], [...img.data.slice(-3)]);
});

test('LS2 stops, scopes and regions have expected shape and plain simulation wording', () => {
  assert.deepEqual(STOPS, [-100, -66, -33, 0, 33, 66, 100]);
  assert.equal(SCOPES.length, 3);
  assert.equal(REGIONS.length, 9);
  assert.match(GENDER_LABEL, /simulation/i);
  for (const stop of STOPS) {
    const actual = bands(stop), out = genderTargets(xy, stop);
    assert.ok(Object.values(actual).every(Number.isFinite));
    assert.equal(out.points.length, 478);
    assert.deepEqual(out.report.requested_bands, actual);
    assert.equal(out.report.slider, stop);
    assert.equal(out.report.validated_on_released_photos, false);
    assert.ok(out.report.max_iod_percent <= 12.0000001);
  }
  assert.deepEqual(genderTargets(xy, 0).points, xy);
});

test('LS2 recipes interpolate at arbitrary slider values instead of cross-fading images', () => {
  for (const sign of [-1, 1]) {
    const a = bands(sign * 33), b = bands(sign * 66), mid = bands(sign * 49.5);
    for (const k of Object.keys(a)) near(mid[k], (a[k] + b[k]) / 2, 1e-10);
  }
  const out = genderTargets(xy, -46.5);
  assert.equal(out.report.stop, 'Custom');
  assert.ok(out.points.some((p, i) => p[0] !== xy[i][0] || p[1] !== xy[i][1]));
});

test('LS2 region zero disables that contribution, and stylings stay pending', () => {
  const defaultEdit = genderTargets(xy, 66);
  const noEdit = genderTargets(xy, 66, {regionStrengths: Object.fromEntries(REGIONS.map((r) => [r, 0]))});
  assert.ok(displacement(xy, defaultEdit.points).max_iod_percent > 0);
  assert.deepEqual(noEdit.points, xy);
  for (const scope of SCOPES) {
    const out = genderTargets(xy, 33, {scope});
    assert.equal(out.report.styling_pending, scope !== 'face_only');
  }
});

test('LS2 invalid amounts, scopes and region factors fail closed', () => {
  for (const bad of [-101, 101, NaN, Infinity]) assert.throws(() => bands(bad), /slider/);
  assert.throws(() => validateOptions({scope: 'unknown'}), /scope/);
  assert.throws(() => validateOptions({regionStrengths: {alien: .2}}), /unknown gender/);
  for (const bad of [-.01, 1.51, Infinity, NaN]) assert.throws(() => validateOptions({regionStrengths: {eyes: bad}}), /unknown gender/);
});

test('LS3 older five and younger three strengths remain bounded and reproducible', () => {
  assert.deepEqual(OLDER_STOPS, [1, 2, 3, 4, 5]);
  assert.deepEqual(YOUNGER_STOPS, [-1, -2, -3]);
  assert.match(AGE_LABEL, /not a prediction/i);
  for (const stop of [...OLDER_STOPS, ...YOUNGER_STOPS]) {
    const p = ageStrength(stop);
    assert.equal(p.older, stop > 0);
    assert.ok(p.fraction > 0 && p.fraction <= 1);
    assert.equal(p.raw, stop);
  }
  for (const stop of [-4, 0, 6, 1.5]) assert.throws(() => ageStrength(stop), /stop/);
  for (const strength of [-.01, 1.01, NaN]) assert.throws(() => ageStrength(3, strength), /strength/);
});

test('LS3 RNG and procedural curves are deterministic, and source geometry is not modified', () => {
  const p = ageStrength(3).fraction;
  const rng = random32(42);
  const vals = Array.from({length: 12}, rng);
  assert.deepEqual(Array.from({length: 12}, random32(42)), vals);
  assert.ok(vals.every((v) => v >= 0 && v < 1));
  assert.throws(() => random32(-1), /seed/);
  const curves = creasePlan(xy, p);
  assert.ok(curves.length >= 10);
  for (const curve of curves) {
    const points = curvePoints(curve.curve, 20);
    assert.equal(points.length, 21);
    near(points[0][0], curve.curve[0][0]);
    near(points.at(-1)[1], curve.curve[2][1]);
  }
});

test('LS3 layers are controllable, bounded, and explicitly optional hair masking', () => {
  assert.equal(Object.keys(checkLayers({})).length, 8);
  assert.equal(checkLayers({hair: 0}).hair, 0);
  assert.throws(() => checkLayers({alien: 1}), /invalid age layer/);
  assert.throws(() => checkLayers({texture: 1.1}), /invalid age layer/);
  const hair = floatImage(180, 200, 1);
  hair.data.fill(0); hair.data.fill(1, 3000, 4800);
  const img = image();
  const zero = renderAge(img, xy, {stop: 5, strength: 0});
  assert.deepEqual(zero.image.data, img.data);
  assert.equal(zero.metrics.strength_used, 0);
  const old = renderAge(img, xy, {stop: 3, seed: 14, hairMask: hair});
  const without = renderAge(img, xy, {stop: 3, seed: 14, hairMask: hair, layers: {hair: 0}});
  assert.ok(old.metrics.grey_pixels > 0);
  assert.equal(without.metrics.grey_pixels, 0);
  assert.deepEqual(img.data.slice(0, 3), old.image.data.slice(0, 3));
  assert.throws(() => renderAge(img, xy, {stop: 3, hairMask: floatImage(5, 5, 1)}), /mask/);
});

test('LS3 with a fixed seed matches exactly and reports simulation strength', () => {
  const img = image();
  const a = renderAge(img, xy, {stop: 3, seed: 500});
  const b = renderAge(img, xy, {stop: 3, seed: 500});
  assert.deepEqual(a.image.data, b.image.data);
  assert.deepEqual(a.editMask.data, b.editMask.data);
  assert.deepEqual(a.metrics, b.metrics);
  assert.ok(a.metrics.strength_used > 0 && a.metrics.strength_used <= 1);
  assert.ok(a.editMask.data.some((v) => v > 0));
  assert.equal(a.adultOnly, true);
  assert.match(a.label, /Age-look simulation/);
});
