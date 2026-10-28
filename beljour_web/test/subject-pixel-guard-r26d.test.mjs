import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DRAWN_PAIR, checkedSubjectBoxes } from '../dist/js/layout/subjects/contract.js';
import { SubjectSelection } from '../dist/js/layout/subjects/selection.js';
import { subjectEditDecision } from '../dist/js/layout/subjects/authority.js';
import {
  auditIsolatedSubject,
  composeIsolatedSubject,
  pixelFootprint,
  subjectIsolationPass,
} from '../dist/js/layout/subjects/pixel-guard.js';

function frame(width, height, value = 20, alpha = 255) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < rgba.length; index += 4) {
    rgba[index] = value;
    rgba[index + 1] = value + 2;
    rgba[index + 2] = value + 4;
    rgba[index + 3] = alpha;
  }
  return { width, height, rgba };
}

function ticket(boxes = DRAWN_PAIR, selected = boxes[0].id) {
  const selection = new SubjectSelection();
  selection.begin(1, boxes[0].origin);
  selection.receive(1, boxes);
  if (selection.snapshot.selectedId !== selected) selection.choose(selected);
  const snapshot = selection.snapshot;
  const result = subjectEditDecision(snapshot);
  assert.ok(result.ticket, result.message);
  return { selection, snapshot, edit: result.ticket };
}

function pixel(image, x, y) {
  const position = (y * image.width + x) * 4;
  return Array.from(image.rgba.subarray(position, position + 4));
}

function changedPixelCount(before, after) {
  let changed = 0;
  for (let index = 0; index < before.rgba.length; index += 4) {
    const original = before.rgba.subarray(index, index + 4);
    const updated = after.rgba.subarray(index, index + 4);
    if (original.some((value, channel) => value !== updated[channel])) changed += 1;
  }
  return changed;
}

function compose(original, proposed, state = ticket()) {
  return composeIsolatedSubject(original, proposed, state.edit, state.snapshot);
}

test('fractional face boxes produce half-open inclusive-antialias raster footprints', () => {
  assert.deepEqual(pixelFootprint(DRAWN_PAIR[0], 100, 100), {
    left: 12, top: 22, right: 49, bottom: 76,
  });
  assert.deepEqual(pixelFootprint(DRAWN_PAIR[1], 64, 80), {
    left: 35, top: 20, right: 57, bottom: 60,
  });
  assert.deepEqual(pixelFootprint({
    id: 'edge', x: 0.97, y: 0.98, width: 0.03, height: 0.02, origin: 'drawn',
  }, 10, 10), { left: 9, top: 9, right: 10, bottom: 10 });
});

test('invalid dimensions and regions fail before raster allocation', () => {
  for (const [w, h] of [[0, 5], [-1, 4], [2.5, 4], [4, Infinity], [NaN, 1]]) {
    assert.throws(() => pixelFootprint(DRAWN_PAIR[0], w, h), RangeError);
  }
  assert.throws(() => pixelFootprint({
    id: 'bad', x: -0.1, y: 0.3, width: 0.5, height: 0.4, origin: 'drawn',
  }, 24, 24), RangeError);
});

test('only selected face pixels are ever copied from the proposed edit', () => {
  const original = frame(64, 80);
  const proposed = frame(64, 80, 235);
  const result = compose(original, proposed);
  assert.deepEqual(pixel(result.frame, 18, 34), pixel(proposed, 18, 34));
  assert.deepEqual(pixel(result.frame, 40, 36), pixel(original, 40, 36));
  assert.deepEqual(pixel(result.frame, 4, 5), pixel(original, 4, 5));
  assert.equal(result.metrics.totalPixels, 5120);
  assert.equal(result.metrics.protectedChangedPixels, 0);
  assert.equal(result.metrics.changedAlphaPixels, 0);
  assert.equal(result.metrics.changedPixels, 1100);
  assert.equal(result.metrics.changedPixels, changedPixelCount(original, result.frame));
  assert.equal(result.metrics.protectedPixels + result.metrics.eligiblePixels, 5120);
});

test('switching subject changes the only permitted copied region', () => {
  const original = frame(64, 80);
  const proposed = frame(64, 80, 180);
  const selectedGuest = ticket(DRAWN_PAIR, 'drawn-guest');
  const result = compose(original, proposed, selectedGuest);
  assert.deepEqual(pixel(result.frame, 40, 36), pixel(proposed, 40, 36));
  assert.deepEqual(pixel(result.frame, 18, 34), pixel(original, 18, 34));
  assert.equal(result.metrics.changedPixels, 880);
  assert.equal(result.metrics.visualEvidence, 'synthetic-contract-only');
});

test('a no-op proposed edit leaves the entire image byte-identical', () => {
  const original = frame(64, 80);
  const proposed = frame(64, 80);
  const result = compose(original, proposed);
  assert.deepEqual(result.frame.rgba, original.rgba);
  assert.equal(result.metrics.changedPixels, 0);
  assert.equal(result.metrics.rejectedChanges, 0);
  assert.equal(result.metrics.changedAlphaPixels, 0);
});

test('the source and the proposed pixels are never mutated or aliased to output', () => {
  const original = frame(64, 80);
  const proposed = frame(64, 80, 190);
  const originalBytes = original.rgba.slice();
  const proposedBytes = proposed.rgba.slice();
  const result = compose(original, proposed);
  assert.deepEqual(original.rgba, originalBytes);
  assert.deepEqual(proposed.rgba, proposedBytes);
  assert.notEqual(result.frame.rgba.buffer, original.rgba.buffer);
  assert.notEqual(result.frame.rgba.buffer, proposed.rgba.buffer);
  result.frame.rgba[0] = 90;
  assert.deepEqual(original.rgba, originalBytes);
  assert.deepEqual(proposed.rgba, proposedBytes);
});

test('transparent pixels cannot receive hidden RGB or altered alpha', () => {
  const original = frame(64, 80, 30);
  const proposed = frame(64, 80, 200, 77);
  const clearAt = (34 * original.width + 18) * 4;
  original.rgba[clearAt + 3] = 0;
  const result = compose(original, proposed);
  assert.deepEqual(pixel(result.frame, 18, 34), pixel(original, 18, 34));
  assert.deepEqual(pixel(result.frame, 19, 34), [200, 202, 204, 255]);
  assert.equal(result.metrics.eligiblePixels, 1099);
  assert.equal(result.metrics.changedAlphaPixels, 5120);
  assert.equal(subjectIsolationPass(result.metrics), false);
});

test('audit of unchanged bystanders succeeds and returns only counts', () => {
  const original = frame(64, 80);
  const proposed = frame(64, 80, 180);
  const state = ticket();
  const composed = compose(original, proposed, state);
  const report = auditIsolatedSubject(original, composed.frame, state.edit, state.snapshot);
  assert.equal(report.changedPixels, composed.metrics.changedPixels);
  assert.equal(report.protectedChangedPixels, 0);
  assert.equal(subjectIsolationPass(report), true);
  const json = JSON.stringify(report);
  assert.doesNotMatch(json, /drawn-main|drawn-guest|rgba|filename|sha256|pixels.*\[/);
});

test('audit fails when even a single pixel outside selected box changes', () => {
  const original = frame(64, 80);
  const proposed = frame(64, 80, 180);
  const state = ticket();
  const result = compose(original, proposed, state);
  result.frame.rgba[0] = 120;
  const report = auditIsolatedSubject(original, result.frame, state.edit, state.snapshot);
  assert.ok(report.protectedChangedPixels > 0);
  assert.equal(subjectIsolationPass(report), false);
});

test('audit fails when a protected bystander is modified', () => {
  const original = frame(64, 80);
  const proposed = frame(64, 80, 180);
  const state = ticket();
  const result = compose(original, proposed, state);
  const offset = (35 * 64 + 40) * 4;
  result.frame.rgba[offset] = 250;
  const report = auditIsolatedSubject(original, result.frame, state.edit, state.snapshot);
  assert.ok(report.protectedChangedPixels > 0);
});

test('audit rejects alpha changes inside an otherwise allowed subject box', () => {
  const original = frame(64, 80);
  const proposed = frame(64, 80, 210);
  const state = ticket();
  const result = compose(original, proposed, state);
  result.frame.rgba[(35 * 64 + 18) * 4 + 3] = 22;
  const report = auditIsolatedSubject(original, result.frame, state.edit, state.snapshot);
  assert.equal(subjectIsolationPass(report), false);
  assert.ok(report.changedAlphaPixels > 0);
});

test('overlapping faces preserve the complete bystander intersection', () => {
  const boxes = checkedSubjectBoxes([
    { id: 'main', x: 0.1, y: 0.2, width: 0.55, height: 0.6, origin: 'detected', primary: true },
    { id: 'guest', x: 0.4, y: 0.4, width: 0.5, height: 0.4, origin: 'detected' },
  ]);
  const original = frame(40, 40, 45);
  const proposed = frame(40, 40, 205);
  const result = compose(original, proposed, ticket(boxes));
  assert.deepEqual(pixel(result.frame, 8, 12), pixel(proposed, 8, 12));
  assert.deepEqual(pixel(result.frame, 18, 18), pixel(original, 18, 18));
  assert.deepEqual(pixel(result.frame, 26, 18), pixel(original, 26, 18));
  assert.ok(result.metrics.protectedChangedPixels > 0);
  assert.equal(result.metrics.rejectedChanges > 0, true);
  const state = ticket(boxes);
  const audit = auditIsolatedSubject(original, result.frame, state.edit, state.snapshot);
  assert.equal(audit.protectedChangedPixels, 0);
  assert.equal(subjectIsolationPass(audit), true);
});

test('overlapping bystanders form a union instead of XOR permission holes', () => {
  const boxes = checkedSubjectBoxes([
    { id: 'target', x: 0.1, y: 0.1, width: 0.8, height: 0.8, origin: 'detected', primary: true },
    { id: 'bystander-1', x: 0.2, y: 0.2, width: 0.45, height: 0.6, origin: 'detected' },
    { id: 'bystander-2', x: 0.4, y: 0.3, width: 0.5, height: 0.5, origin: 'detected' },
  ]);
  const original = frame(100, 100);
  const result = compose(original, frame(100, 100, 200), ticket(boxes));
  assert.deepEqual(pixel(result.frame, 46, 41), pixel(original, 46, 41));
  assert.deepEqual(pixel(result.frame, 81, 41), pixel(original, 81, 41));
  assert.deepEqual(pixel(result.frame, 14, 14), [200, 202, 204, 255]);
  assert.equal(result.metrics.protectedChangedPixels > 0, true);
});

test('disjoint nonoverlapping bystander bounding boxes do not steal target pixels', () => {
  const original = frame(64, 80);
  const result = compose(original, frame(64, 80, 180));
  assert.deepEqual(pixel(result.frame, 20, 45), [180, 182, 184, 255]);
  assert.deepEqual(pixel(result.frame, 38, 45), [20, 22, 24, 255]);
  assert.equal(result.metrics.protectedChangedPixels, 0);
});

test('stale photo generation rejects proposed pixels even with matching face IDs', () => {
  const state = ticket();
  state.selection.begin(2, 'drawn');
  state.selection.receive(2, DRAWN_PAIR);
  assert.throws(() => composeIsolatedSubject(
    frame(64, 80), frame(64, 80, 190), state.edit, state.selection.snapshot,
  ), /selection changed/);
});

test('reselection of a different subject rejects the previous ticket', () => {
  const state = ticket();
  assert.equal(state.selection.choose('drawn-guest'), true);
  assert.throws(() => composeIsolatedSubject(
    frame(64, 80), frame(64, 80, 190), state.edit, state.selection.snapshot,
  ), /selection changed/);
});

test('malformed RGBA byte lengths are refused before pixel operations', () => {
  const original = frame(64, 80);
  const state = ticket();
  for (const length of [0, 64 * 80 * 4 - 1, 64 * 80 * 4 + 1]) {
    const malformed = { width: 64, height: 80, rgba: new Uint8ClampedArray(length) };
    assert.throws(() => composeIsolatedSubject(original, malformed, state.edit, state.snapshot), TypeError);
  }
});

test('mismatched dimensions reject even when both RGBA buffers are well formed', () => {
  const state = ticket();
  assert.throws(() => composeIsolatedSubject(
    frame(64, 80), frame(80, 64), state.edit, state.snapshot,
  ), RangeError);
});

test('bounded memory rejects oversized images without allocating them', () => {
  const state = ticket();
  const impossible = { width: 6000, height: 5000, rgba: new Uint8ClampedArray(4) };
  assert.throws(() => composeIsolatedSubject(
    impossible, impossible, state.edit, state.snapshot,
  ), /pixel budget/);
});

test('input dimensions cannot be forged using fractional or unsafe integer values', () => {
  const state = ticket();
  for (const width of [0, -1, 1.7, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    const malformed = { width, height: 3, rgba: new Uint8ClampedArray(20) };
    assert.throws(() => composeIsolatedSubject(
      malformed, malformed, state.edit, state.snapshot,
    ), RangeError);
  }
});

test('pixel guard accepts 1×1 images with a valid tiny fractional subject footprint', () => {
  const boxes = checkedSubjectBoxes([
    { id: 'one', x: 0.1, y: 0.1, width: 0.6, height: 0.6, origin: 'drawn', primary: true },
  ]);
  const output = compose(frame(1, 1), frame(1, 1, 188), ticket(boxes));
  assert.deepEqual(Array.from(output.frame.rgba), [188, 190, 192, 255]);
  assert.equal(output.metrics.eligiblePixels, 1);
});

test('detected subject mode is accepted only when snapshot and ticket agree', () => {
  const boxes = checkedSubjectBoxes([
    { id: 'detected-one', x: 0.2, y: 0.2, width: 0.25, height: 0.5, origin: 'detected' },
  ]);
  const state = ticket(boxes);
  const result = compose(frame(32, 32), frame(32, 32, 166), state);
  assert.equal(result.metrics.changedPixels > 0, true);
  const forged = { ...state.snapshot, source: 'drawn' };
  assert.throws(() => composeIsolatedSubject(
    frame(32, 32), frame(32, 32, 166), state.edit, forged,
  ), /selection changed/);
});

for (const height of [3, 9, 21, 48]) {
  test(`row intervals protect bystanders over ${height} image rows`, () => {
    const original = frame(41, height);
    const proposed = frame(41, height, 191);
    const boxes = checkedSubjectBoxes([
      { id: 'main', x: 0.02, y: 0.02, width: 0.96, height: 0.96, origin: 'drawn', primary: true },
      { id: 'other', x: 0.45, y: 0.15, width: 0.2, height: 0.7, origin: 'drawn' },
    ]);
    const state = ticket(boxes);
    const result = compose(original, proposed, state);
    const audit = auditIsolatedSubject(original, result.frame, state.edit, state.snapshot);
    assert.equal(subjectIsolationPass(audit), true);
    assert.equal(changedPixelCount(original, result.frame), result.metrics.changedPixels);
    assert.ok(result.metrics.changedPixels > 0);
  });
}
