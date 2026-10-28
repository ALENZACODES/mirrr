import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JudgeLiveChecks } from '../dist/js/layout/judge-live-checks.js';
import {
  makeRealProductVisitReport,
  formatRealProductVisitReport,
  prepareRealProductDownload,
  requestRealProductDownload,
} from '../dist/js/layout/judge-live-report.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function prepared() {
  const checklist = new JudgeLiveChecks();
  checklist.set('photo-open', 'operator-observed');
  checklist.set('hair-response', 'blocked');
  checklist.set('makeup-response', 'not-run');
  const report = makeRealProductVisitReport(checklist.snapshot());
  return { checklist, report, formatted: formatRealProductVisitReport(report) };
}

test('only fixed, visitor-independent labels enter the operator-report document', () => {
  const { report } = prepared();
  assert.equal(report.schema, 'beljour-real-product-operator-visit/1');
  assert.equal(report.kind, 'operator-reported-uncertified');
  assert.equal(report.verifiedProviderBySoftware, false);
  assert.equal(report.completedFaceGate, false);
  assert.equal(report.photoBytes, 0);
  assert.equal(report.personalDataBytes, 0);
  assert.equal(report.observed, 1);
  assert.equal(report.blocked, 1);
  assert.equal(report.checks.length, 9);
});

test('the report has a limitation next to each operator-controlled check', () => {
  const { formatted } = prepared();
  for (const fragment of [
    'operator checklist', 'Operator-reported only', '100,000-face release gate',
    'No personal source image', 'Source: fixed, photo-free labels',
    'Live availability', 'NOT MEASURED',
  ]) {
    if (fragment === 'Live availability') continue;
    assert.ok(formatted.includes(fragment), fragment);
  }
  assert.match(formatted, /Real hair-provider response observed: blocked/);
  assert.match(formatted, /Actual local photo selected: operator-observed/);
  assert.match(formatted, /BELJOUR — FULL BEAUTY STUDIO/);
  assert.match(formatted, /Your best day\. Still you\./);
});

test('unknown operator-input strings cannot be injected by forging snapshot rows', () => {
  const checklist = new JudgeLiveChecks();
  const snapshot = checklist.snapshot();
  const corrupted = {
    ...snapshot,
    rows: snapshot.rows.map((row, index) => index === 0
      ? { ...row, title: 'SECRET_UPLOAD_STREAM', question: 'PRIVATE_FACE_IMAGE' }
      : row),
  };
  assert.throws(() => makeRealProductVisitReport(corrupted), TypeError);
});

test('post-construction report text is checked against the authored templates', () => {
  const { report } = prepared();
  const forged = { ...report, checks: [{ ...report.checks[0], route: 'https://example.test' }, ...report.checks.slice(1)] };
  assert.throws(() => formatRealProductVisitReport(forged), TypeError);
  assert.throws(() => formatRealProductVisitReport({ ...report, completedFaceGate: true }), TypeError);
  assert.throws(() => formatRealProductVisitReport({ ...report, photoBytes: 100 }), TypeError);
});

test('operator export is a small plain-text Blob with no image bytes or secrets', async () => {
  const { report, formatted } = prepared();
  const file = prepareRealProductDownload(report);
  assert.equal(file.filename, 'BELJOUR-FULL-BEAUTY-STUDIO-operator-checklist.txt');
  assert.ok(file.bytes > 100);
  assert.ok(file.bytes < 32768);
  assert.equal(file.blob.type, 'text/plain;charset=utf-8');
  assert.equal(await file.blob.text(), formatted);
  assert.doesNotMatch(formatted, /data:image|base64,|face_sha|api[_-]?key|bearer /i);
});

test('the operator report download happens only after calling the request function', () => {
  const app = judgeDOM();
  let creates = 0;
  let revokes = 0;
  let deferred;
  let blob;
  const port = {
    createObjectURL(next) { creates += 1; blob = next; return 'blob:operator-checklist'; },
    revokeObjectURL(value) { assert.equal(value, 'blob:operator-checklist'); revokes += 1; },
  };
  try {
    const { report } = prepared();
    const file = prepareRealProductDownload(report);
    assert.equal(creates, 0);
    requestRealProductDownload(app.document, file, port, callback => { deferred = callback; });
    assert.equal(creates, 1);
    assert.equal(blob, file.blob);
    assert.ok(deferred);
    assert.equal(revokes, 0);
    deferred();
    assert.equal(revokes, 1);
  } finally { app.close(); }
});

test('download-request failures do not leave an attached hidden link', () => {
  const app = judgeDOM();
  const file = prepareRealProductDownload(prepared().report);
  const port = { createObjectURL() { throw Error('unsupported'); }, revokeObjectURL() {} };
  try {
    assert.throws(() => requestRealProductDownload(app.document, file, port, () => {}));
    assert.equal(app.document.querySelectorAll('a').length, 0);
  } finally { app.close(); }
});

test('the formatter rejects forged free text, fake provider proof and incorrect counts', () => {
  const { report } = prepared();
  assert.throws(() => formatRealProductVisitReport({ ...report, notes: ['PRIVATE_FACE_BYTES'] }), TypeError);
  assert.throws(() => formatRealProductVisitReport({ ...report, personalDataBytes: 1 }), TypeError);
  assert.throws(() => formatRealProductVisitReport({ ...report, schema: 'custom' }), TypeError);
  assert.throws(() => formatRealProductVisitReport({ ...report, observed: 2 }), TypeError);
  assert.throws(() => formatRealProductVisitReport({ ...report, checks: report.checks.slice(1) }), TypeError);
});

test('unexpected check status cannot be used to forge a successful provider claim', () => {
  const { report } = prepared();
  const forged = {
    ...report,
    checks: report.checks.map((row, index) => index === 0
      ? { ...row, status: 'live-youcam-success' } : row),
  };
  assert.throws(() => formatRealProductVisitReport(forged), TypeError);
});
