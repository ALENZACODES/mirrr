import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ReleaseSession } from '../dist/js/layout/release/state.js';
import { commandReadiness } from '../dist/js/layout/release/commands.js';
import { evaluateReleaseReadiness } from '../dist/js/layout/release/readiness.js';
import {
  safeReleaseReport, validateSafeReleaseReport, serializeReleaseReport,
  saveReleaseReport, reportContainsUnsafeFields,
} from '../dist/js/layout/release/report.js';

function fixture() {
  let now = 1000;
  const state = new ReleaseSession(() => now);
  const commands = commandReadiness(null);
  const environment = { online: true, canvasAvailable: true, encodingAvailable: true,
    secureContext: true, reducedMotion: false, screenWidth: 390, pixelRatio: 2 };
  state.start();
  const make = () => {
    const snapshot = state.snapshot;
    const readiness = evaluateReleaseReadiness(snapshot, commands, environment, null);
    return safeReleaseReport(snapshot, readiness, commands, environment, null);
  };
  return { state, make, advance: delta => { now += delta; } };
}

test('photo-free report uses only a narrow set of predetermined fields', () => {
  const { make } = fixture();
  const report = make();
  assert.equal(report.format, 'beljour-release-rehearsal/1');
  assert.equal(report.status, 'operator-rehearsal');
  assert.equal(report.rows.length, 16);
  assert.equal(report.productionReady, false);
  assert.equal(report.realFaceVerified, false);
  assert.equal(report.providerVerified, false);
  assert.equal(report.independentVerified, false);
  assert.equal(report.uploaded, false);
  assert.equal(report.hasPhotographs, false);
  assert.equal(validateSafeReleaseReport(report), true);
});

test('reviewed status remains operator evidence, even on a successful checklist', () => {
  const f = fixture();
  for (const id of ['upload', 'local-edit', 'hair', 'makeup', 'compare', 'download']) {
    f.state.open(id);
    f.state.review(id);
  }
  const report = f.make();
  assert.equal(report.reviewed, 6);
  assert.equal(report.rows.filter(row => row.state === 'reviewed').length, 6);
  assert.equal(report.providerVerified, false);
  assert.equal(report.realFaceVerified, false);
});

test('serialized report cannot contain visitor input, face data or API values', () => {
  const f = fixture();
  f.state.refuse('hair', 'consent-required');
  f.advance(2999);
  const text = serializeReleaseReport(f.make());
  assert.equal(reportContainsUnsafeFields(text), false);
  assert.doesNotMatch(text, /https?:|data:image|api.key|Bearer|password|email/i);
  assert.match(text, /"providerVerified": false/);
  assert.deepEqual(JSON.parse(text), f.make());
});

test('extra fields and forged external acceptance always fail validation', () => {
  const original = fixture().make();
  for (const update of [{ productionReady: true }, { providerVerified: true },
    { hasPhotographs: true }, { externallySigned: true }, { format: 'custom' },
    { status: 'passed' }, { uploaded: true }, { reviewed: 19 }]) {
    assert.equal(validateSafeReleaseReport({ ...original, ...update }), false);
    assert.throws(() => serializeReleaseReport({ ...original, ...update }));
  }
});

test('attacker-added photo metadata inside report rows is refused', () => {
  const original = fixture().make();
  for (const field of ['photo', 'filename', 'landmarks', 'faceEmbedding', 'freeText']) {
    const rows = original.rows.map(row => ({ ...row }));
    rows[0][field] = 'private';
    assert.equal(validateSafeReleaseReport({ ...original, rows }), false);
  }
});

test('missing, duplicated, invalid and out-of-order row members are rejected', () => {
  const original = fixture().make();
  assert.equal(validateSafeReleaseReport({ ...original, rows: original.rows.slice(1) }), false);
  assert.equal(validateSafeReleaseReport({ ...original, rows: [original.rows[0], ...original.rows.slice(0, -1)] }), false);
  const rows = original.rows.map(row => ({ ...row }));
  rows[1].id = 'not-a-real-check';
  assert.equal(validateSafeReleaseReport({ ...original, rows }), false);
  rows[1].id = original.rows[1].id;
  rows[1].state = 'certified';
  assert.equal(validateSafeReleaseReport({ ...original, rows }), false);
});

test('refusal must be internally consistent', () => {
  const original = fixture().make();
  const rows = original.rows.map(row => ({ ...row }));
  rows[0].state = 'refused';
  assert.equal(validateSafeReleaseReport({ ...original, rows }), false);
  rows[0].refusal = 'offline';
  assert.equal(validateSafeReleaseReport({ ...original, rows }), true);
  rows[0].refusal = 'private-note';
  assert.equal(validateSafeReleaseReport({ ...original, rows }), false);
});

test('timing is bounded and cannot be a forged device result', () => {
  const original = fixture().make();
  assert.equal(validateSafeReleaseReport({ ...original, elapsedMs: Infinity }), false);
  assert.equal(validateSafeReleaseReport({ ...original, elapsedMs: -3 }), false);
  assert.equal(validateSafeReleaseReport({ ...original, syntheticTiming: {
    samples: 0, medianMs: 0, p95Ms: 0,
  } }), false);
  assert.equal(validateSafeReleaseReport({ ...original, syntheticTiming: {
    samples: 5, medianMs: NaN, p95Ms: 6,
  } }), false);
});

test('download uses a bounded local Blob and always revokes its URL', () => {
  const report = fixture().make();
  const blobs = [];
  const events = [];
  const anchor = { href: '', download: '', click() { events.push('click'); } };
  saveReleaseReport(report, {
    createObjectURL(blob) { blobs.push(blob); return 'blob:rehearsal'; },
    revokeObjectURL(url) { events.push(url); },
    createAnchor() { return anchor; },
  });
  assert.equal(anchor.href, 'blob:rehearsal');
  assert.equal(anchor.download, 'BELJOUR-FULL-BEAUTY-STUDIO-release-rehearsal.json');
  assert.deepEqual(events, ['click', 'blob:rehearsal']);
  assert.equal(blobs[0].type, 'application/json');
});

test('a rejected or throwing browser download still releases its URL', () => {
  const report = fixture().make();
  let revoked = 0;
  assert.throws(() => saveReleaseReport(report, {
    createObjectURL: () => 'blob:error',
    revokeObjectURL: () => { revoked += 1; },
    createAnchor: () => ({ click() { throw Error('blocked'); } }),
  }), /blocked/);
  assert.equal(revoked, 1);
});

test('null and array reports never pass the runtime validation boundary', () => {
  for (const value of [undefined, null, [], 'text', true, 0, {}]) {
    assert.equal(validateSafeReleaseReport(value), false);
  }
});


test('external-gate rows cannot be forged as manually reviewed in imported reports', () => {
  const original = fixture().make();
  for (const id of ['real-face', 'commercial-ip', 'submission', 'performance', 'accessibility']) {
    const rows = original.rows.map(row => ({ ...row }));
    const target = rows.find(row => row.id === id);
    target.state = 'reviewed';
    target.elapsedMs = 100;
    assert.equal(validateSafeReleaseReport({ ...original, rows, reviewed: 1 }), false);
    target.state = 'opened';
    assert.equal(validateSafeReleaseReport({ ...original, rows, reviewed: 0 }), false);
  }
});
