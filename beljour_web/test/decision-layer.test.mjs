// Decision layer in the browser: same shade targets, placement, cost, wording and refusals as
// Python on every shared vector. Drawn masks and made-up colours only. Author: John Khan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import * as D from '../dist/js/engines/workflow_w/decision.js';

const vectors = JSON.parse(readFileSync(new URL('../../api/tests/goldens/decision-layer.json', import.meta.url)));
const tol = vectors.float_tolerance;
const [W, H] = vectors.mask_size;

function close(actual, expected, where) {
  if (typeof expected === 'number') {
    assert.equal(typeof actual, 'number', where);
    assert.ok(Math.abs(actual - expected) <= tol * Math.max(1, Math.abs(expected)), `${where}: ${actual} vs ${expected}`);
  } else if (Array.isArray(expected)) {
    assert.ok(Array.isArray(actual), where); assert.equal(actual.length, expected.length, where);
    expected.forEach((v, i) => close(actual[i], v, `${where}[${i}]`));
  } else if (expected && typeof expected === 'object') {
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), where);
    for (const key of Object.keys(expected)) close(actual[key], expected[key], `${where}.${key}`);
  } else assert.equal(actual ?? null, expected, where);
}
function attempt(fn) {
  try { return { result: fn(), refused: null }; } catch (error) {
    if (!(error instanceof D.DecisionError)) throw error;
    assert.ok(error.message.startsWith(D.REFUSALS[error.code]));
    return { result: null, refused: error.code };
  }
}

test('the table and constants match Python', () => {
  assert.equal(vectors.version, D.VERSION);
  assert.deepEqual(JSON.parse(JSON.stringify(D.services())), vectors.table.services);
  const c = vectors.constants;
  assert.deepEqual([D.MAX_PRICE, D.MAX_SESSIONS, D.PAINT_THRESHOLD, D.MIN_HAIR_PIXELS], [c.max_price, c.max_sessions, c.paint_threshold, c.min_hair_pixels]);
  assert.deepEqual({ ...D.UNITS }, c.units);
  assert.deepEqual({ ...D.REFUSALS }, c.refusals);
});

test('cost and longevity match Python for every service, her figures and every refusal', () => {
  assert.ok(vectors.cost.some((c) => c.refused) && vectors.cost.some((c) => c.result?.edited.length));
  for (const [i, c] of vectors.cost.entries()) {
    const { service, sessions, price, lasts, upkeep_price: upkeepPrice } = c.request;
    const out = attempt(() => D.costAndLongevity(service, { sessions, price, lasts, upkeepPrice }));
    assert.equal(out.refused, c.refused, `cost ${i} ${service}`);
    if (c.result) { close(out.result, c.result, `cost ${i}`); assert.deepEqual(D.costLines(out.result), c.lines); }
  }
});

test('hair colour targets match Python, sessions and wording included', () => {
  for (const [i, c] of vectors.hair.entries()) {
    const r = c.request;
    const spec = D.hairSpec(r.target_lab ?? null, { mode: r.mode, baseLevel: r.base_level ?? null, history: r.history,
      targetLevel: r.target_level, toner: r.toner });
    close(spec, c.result, `hair ${i}`);
    assert.deepEqual(D.specLines(spec), c.lines, `hair ${i} lines`);
    assert.deepEqual(D.costLines(D.costAndLongevity(spec.service, { sessions: spec.sessions })), c.cost_lines);
  }
});

test('foundation targets match Python and stay never lighter', () => {
  for (const [i, c] of vectors.makeup.entries()) {
    const out = attempt(() => D.makeupSpec(c.request.skin_lab));
    assert.equal(out.refused, c.refused, `makeup ${i}`);
    if (c.result) { close(out.result, c.result, `makeup ${i}`); assert.deepEqual(D.specLines(out.result), c.lines); }
  }
});

test('placement on drawn masks matches Python', () => {
  for (const [i, c] of vectors.placement.entries()) {
    const paint = c.request.paint === null ? null : vectors.masks.paint[c.request.paint];
    const out = attempt(() => D.placement(vectors.masks.hair[c.request.hair], W, H, paint));
    assert.equal(out.refused, c.refused, `placement ${i}`);
    if (c.result) { close(out.result, c.result, `placement ${i}`); assert.deepEqual(D.placementLines(out.result), c.lines); }
  }
});

test('placement shares are exact on a drawn third and strokes off the hair never count', () => {
  const w = 20, h = 30, mask = new Float32Array(w * h), paint = new Float32Array(w * h);
  for (let y = 3; y < 27; y++) for (let x = 2; x < 18; x++) mask[y * w + x] = 1;
  for (let y = 19; y < 27; y++) for (let x = 2; x < 18; x++) paint[y * w + x] = 0.8;
  for (let x = 0; x < w; x++) paint[x] = 1;
  const place = D.placement(mask, w, h, paint);
  assert.ok(Math.abs(place.coverage - 1 / 3) < 1e-12);
  assert.deepEqual(place.zones, { roots: 0, mid_lengths: 0, ends: 1 });
  assert.throws(() => D.placement(mask, w, h - 1), /match/);
});

test('rounding is half up in both languages', () => {
  assert.equal(D.money(0.5), '$1'); assert.equal(D.money(2.5), '$3'); assert.equal(D.money(1234.4), '$1,234');
  assert.equal(D.percent(0.125), 13); assert.equal(D.oneDecimal(2.25), '2.3');
});
