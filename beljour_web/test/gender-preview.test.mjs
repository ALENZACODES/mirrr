// R14 exact sparse-Q4 search regression. Acceptance is defined before execution:
// sparse maps and sampled bytes equal the canonical piecewise/remap operations;
// final scales/targets/pixels equal the full reference search, Q4 within 1e-12;
// every returned image is full size and a rejected full guard restarts the full
// search. Timing runs separately in scripts/check-gender-speed.mjs, after other
// CPU suites, with cold 512px stops and the unchanged 1.5-second product budget.
// Synthetic coordinates and pixels only; no network. Author: John Khan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { byteImage, floatImage, remap } from '../dist/js/engines/core/buffer.js';
import { dilate } from '../dist/js/engines/core/mask.js';
import { apply } from '../dist/js/engines/warp/field.js';
import { layout, meshWarp } from '../dist/js/engines/warp/mesh.js';
import { piecewiseAffine } from '../dist/js/engines/warp/piecewise.js';
import { q4Seam } from '../dist/js/quality/metrics.js';
import { genderTargets, prepareGenderTargets, REGIONS, IDENTITY_PINS } from '../dist/js/engines/local/gender.js';
import { PreparedNeighbourGraph, regularizeTargets } from '../dist/js/engines/warp/regularize.js';
import { regulariseTargets, EDGE_STRAIN_SHARE } from '../dist/js/engines/warp/turn-field.js';
import { faceFrame } from '../dist/js/engines/shape/geometry.js';
import { SparseSeam, sampleSeamPixels, onePixelBand } from '../dist/js/engines/shape/gender-preview.js';
import { renderGenderTargets, renderGenderTargetsReference, REGION_BISECTIONS,
  TRIANGLE_RATIO_MIN, SEAM_LIMIT, SEAM_MARGIN } from '../dist/js/engines/shape/gender-render.js';
import { drawnGenderHead } from './helpers/gender-drawn.mjs';

function pixels(width, height, channels = 3) {
  const image = byteImage(width, height, channels);
  for (let i = 0; i < image.data.length; i++) image.data[i] = (i * 61 + (i % 13) * 17 + 29) % 256;
  if (channels === 4) for (let i = 0; i < width * height; i += 7) image.data[i * 4 + 3] = 0;
  return image;
}
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) <= 1e-12, `${actual} != ${expected}`);
function sameRender(actual, expected) {
  assert.deepEqual(actual.points, expected.points);
  assert.deepEqual(actual.image, expected.image);
  assert.deepEqual(actual.regionScales, expected.regionScales);
  assert.deepEqual(actual.failed, expected.failed);
  assert.deepEqual(actual.regionsTried, expected.regionsTried);
  assert.deepEqual(actual.report, expected.report);
  near(actual.seamRatio, expected.seamRatio);
  near(actual.effectRetention, expected.effectRetention);
  near(actual.triangleMin, expected.triangleMin);
  near(actual.triangleMax, expected.triangleMax);
  assert.equal(actual.fullResolutionChecked, true);
}

for (const channels of [3, 4]) test(`selected ${channels}-channel pixels equal canonical linear-alpha remap`, () => {
  const image = pixels(27, 31, channels), x = new Float64Array(504), y = new Float64Array(504);
  for (let i = 0; i < 500; i++) { x[i] = (i * 7.731 % 40) - 6; y[i] = (i * 11.173 % 42) - 5; }
  x.set([0, 26, 0, 26], 500); y.set([0, 30, 30, 0], 500);
  const mx = { width: x.length, height: 1, channels: 1, data: x };
  const my = { ...mx, data: y };
  assert.deepEqual(sampleSeamPixels(image, x, y), remap(image, mx, my).data);
  assert.throws(() => sampleSeamPixels(image, Float64Array.of(NaN), Float64Array.of(0)), /finite/);
  assert.throws(() => sampleSeamPixels(image, Float64Array.of(0), new Float64Array()), /match/);
  assert.equal(sampleSeamPixels(image, new Float64Array(), new Float64Array()).length, 0);
});

for (const [width, height] of [[2, 2], [9, 17], [33, 17], [101, 64]]) test(`one-pixel band equals radius-one Euclidean dilation at ${width}×${height}`, () => {
  const edge = Uint8Array.from({ length: width * height }, (_, i) => Number((i * 23 + 7) % 19 < 3));
  const mask = floatImage(width, height, 1); mask.data.set(edge);
  assert.deepEqual(onePixelBand(edge, width, height), Uint8Array.from(dilate(mask, 1).data, value => Number(value > 0)));
  assert.deepEqual(onePixelBand(new Uint8Array(edge.length), width, height), new Uint8Array(edge.length));
  assert.deepEqual(onePixelBand(new Uint8Array(edge.length).fill(1), width, height), new Uint8Array(edge.length).fill(1));
});

test('sparse ownership equals canonical triangles at shared edges, overlaps, degenerate triangles and unclaimed pixels', () => {
  const image = pixels(33, 17), mask = floatImage(33, 17, 1);
  for (let y = 0; y < 17; y++) for (let x = 0; x < 33; x++) mask.data[y * 33 + x] = (x + y) % 2;
  const source = [[1, 1], [29, 1], [1, 14], [29, 14], [2, 2], [3, 3], [4, 4], [-20, -20], [-19, -20], [-20, -19]];
  const targets = source.map(point => [...point]);
  targets[0] = [2, 1]; targets[1] = [30, 2]; targets[2] = [1, 15];
  const triangles = [[4, 5, 6], [0, 1, 2], [1, 3, 2], [3, 1, 0], [7, 8, 9]];
  const lay = { points: source, meshCount: source.length, triangles };
  const sparse = new SparseSeam(image, mask), mapped = sparse.maps(lay, targets);
  const full = piecewiseAffine(33, 17, source, targets, triangles);
  for (let i = 0; i < sparse.sampleCount; i++) {
    const p = sparse.y[i] * 33 + sparse.x[i];
    assert.equal(mapped.x[i], full.field.mapX.data[p]);
    assert.equal(mapped.y[i], full.field.mapY.data[p]);
  }
  assert.throws(() => sparse.maps(lay, targets.slice(1)), /match/);
  assert.ok(full.owner.some(owner => owner === -1));
});

for (const channels of [3, 4]) test(`sparse and full-confirmed Q4 equal canonical Q4 on ${channels}-channel drawn pixels`, () => {
  const fixture = drawnGenderHead(2, 204, 220);
  const image = channels === 3 ? fixture.image : pixels(204, 220, 4);
  if (channels === 4) for (let i = 0; i < 204 * 220; i++) {
    for (let c = 0; c < 3; c++) image.data[i * 4 + c] = fixture.image.data[i * 3 + c];
  }
  const lay = layout(fixture.points, image.width, image.height), target = genderTargets(fixture.points, -66);
  const destination = lay.points.map((point, i) => i < lay.meshCount ? target.points[i] : point);
  const raw = piecewiseAffine(image.width, image.height, lay.points, destination, lay.triangles);
  const output = apply(image, raw.field), sparse = new SparseSeam(image, fixture.oval);
  const maps = sparse.maps(lay, target.points);
  for (let i = 0; i < sparse.sampleCount; i++) {
    const p = sparse.y[i] * image.width + sparse.x[i];
    assert.equal(maps.x[i], raw.field.mapX.data[p]); assert.equal(maps.y[i], raw.field.mapY.data[p]);
  }
  const expected = q4Seam(image, output, fixture.oval).measured.ratio;
  near(sparse.ratio(lay, target.points), expected); near(sparse.fullRatio(output), expected);
  assert.ok(sparse.sampleCount < image.width * image.height / 4);
});

for (const kind of ['empty', 'full', 'border']) test(`Q4 ${kind} contour and clipped gradients keep their exact meaning`, () => {
  const image = pixels(33, 17), output = pixels(33, 17), mask = floatImage(33, 17, 1);
  for (let y = 0; y < 17; y++) for (let x = 0; x < 33; x++) {
    const inside = y < 8 && x < 18;
    mask.data[y * 33 + x] = kind === 'full' ? 1 : Number(kind === 'border' && inside);
    if (inside) for (let c = 0; c < 3; c++) output.data[(y * 33 + x) * 3 + c] = 110;
  }
  const sparse = new SparseSeam(image, mask), canonical = q4Seam(image, output, mask).measured.ratio;
  near(sparse.fullRatio(output), canonical);
  if (kind !== 'border') { assert.equal(sparse.sampleCount, 0); assert.equal(canonical, 0); }
  assert.throws(() => sparse.fullRatio(pixels(2, 2)), /same size/);
  assert.throws(() => sparse.fullRatio(pixels(33, 17, 4)), /channels/);
  assert.throws(() => sparse.fullRatio({ ...output, data: output.data.slice(1) }), /size/);
});

for (const [seed, stop, size] of [[2, -66, 220], [5, -100, 214], [9, 66, 204]]) test(`sparse search matches the complete reference for drawn seed ${seed}, stop ${stop}`, () => {
  const { image, points } = drawnGenderHead(seed, size);
  const fast = renderGenderTargets(image, points, stop), reference = renderGenderTargetsReference(image, points, stop);
  sameRender(fast, reference);
  assert.equal(fast.searchMethod, 'sparse-seam-full-confirm');
  assert.equal(fast.fullRasterEvaluations, 1); assert.equal(fast.sparseFallback, false);
  assert.equal(fast.failed.length, 0);
});

test('failed full raster confirmation restarts the original guarded search and returns its full image', () => {
  const { image, points } = drawnGenderHead(3, 204), expected = renderGenderTargetsReference(image, points, 33);
  const calls = [];
  const warp = (...args) => {
    const value = meshWarp(...args); calls.push([args[0], args[1]]);
    return calls.length === 1 ? { ...value, strengthUsed: .5, reduced: true, guardReason: 'raster_q3' } : value;
  };
  const actual = renderGenderTargets(image, points, 33, {}, { warp });
  sameRender(actual, expected);
  assert.equal(actual.sparseFallback, true); assert.equal(actual.searchMethod, 'full-raster');
  assert.equal(actual.fullRasterEvaluations, calls.length); assert.ok(calls.length >= 2);
  assert.ok(calls.every(([width, height]) => width === 204 && height === 204));
});

test('zero, disabled regions and invocation ownership preserve original pixels and targets', () => {
  const { image, points } = drawnGenderHead(8, 204, 214), original = new Uint8Array(image.data);
  for (const [stop, options] of [[0, {}], [-100, { regionStrengths: Object.fromEntries(REGIONS.map(r => [r, 0])) }]]) {
    const result = renderGenderTargets(image, points, stop, options);
    assert.deepEqual(result.points, points); assert.deepEqual(result.image.data, original);
    assert.equal(result.effectRetention, 1); assert.equal(result.fullResolutionChecked, true);
    result.image.data.fill(0); result.points[0] = [0, 0];
    const again = renderGenderTargets(image, points, stop, options);
    assert.deepEqual(again.image.data, original); assert.deepEqual(again.points, points);
  }
  assert.deepEqual(image.data, original);
});

test('prepared source graph preserves both regularizers and refuses a changed mesh or scale', () => {
  const { points } = drawnGenderHead(1, 204), scale = faceFrame(points).iod;
  const proposed = points.map(([x, y], i) => [x + Math.sin(i / 7), y + Math.cos(i / 11)]);
  const graph = new PreparedNeighbourGraph(points, scale);
  assert.deepEqual(regularizeTargets(points, proposed, scale, IDENTITY_PINS, graph),
    regularizeTargets(points, proposed, scale, IDENTITY_PINS));
  assert.deepEqual(regulariseTargets(points, proposed, scale, EDGE_STRAIN_SHARE, IDENTITY_PINS, true, graph),
    regulariseTargets(points, proposed, scale, EDGE_STRAIN_SHARE, IDENTITY_PINS, true));
  const changed = points.map(point => [...point]); changed[0][0] += .01;
  assert.throws(() => regularizeTargets(changed, proposed, scale, [], graph), /another mesh or scale/);
  assert.throws(() => regulariseTargets(points, proposed, scale * 1.01, EDGE_STRAIN_SHARE, [], true, graph), /another mesh or scale/);
});

test('invocation-owned starter and graph reuse match independent targets without exposing cached points', () => {
  const { points } = drawnGenderHead(4, 214), snapshot = points.map(point => [...point]);
  const prepared = prepareGenderTargets(points, -66);
  const choices = [{}, { regionStrengths: { brows: .4, eyes: .7 } },
    { regionStrengths: { chin: .125, forehead: .0625, nose: .3 } }, { scope: 'keep_my_hair' }];
  for (const options of choices) {
    const expected = genderTargets(snapshot, -66, options), actual = prepared(options);
    assert.deepEqual(actual, expected);
    actual.points[0] = [0, 0]; actual.report.regions.chin = 0;
    assert.deepEqual(prepared(options), expected);
  }
  points[0][0] += 100;
  assert.deepEqual(prepared(), genderTargets(snapshot, -66));
});

test('small previews retain full search and every existing quality threshold stays fixed', () => {
  const { image, points } = drawnGenderHead(2, 120);
  const result = renderGenderTargets(image, points, 33);
  sameRender(result, renderGenderTargetsReference(image, points, 33));
  assert.equal(result.searchMethod, 'full-raster'); assert.equal(result.fullResolutionChecked, true);
  assert.equal(SEAM_LIMIT, 1.5); assert.equal(SEAM_MARGIN, .95);
  assert.equal(TRIANGLE_RATIO_MIN, .35); assert.equal(REGION_BISECTIONS, 4);
});
