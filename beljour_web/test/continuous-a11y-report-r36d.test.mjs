/** Strict accessibility report boundaries; no photos or fabricated release success. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  checkedAuditReport, downloadAuditReport, makeAuditReport,
  parseAuditReport, serializeAuditReport,
} from '../dist/js/layout/continuous/accessibility-report.js';

const valid = () => ({
  format: 'beljour-tour-accessibility/1',
  scope: 'single-local-tour-screen',
  evidence: 'operator-local-observation',
  inspected: 12, controls: 12, measuredButtons: 8,
  findings: ['unnamed-button'],
  screenReader: 'not-tested', physicalDevice: 'not-tested',
  realFace: 'not-tested', provider: 'not-tested',
});

const observed = () => ({
  format: 'beljour-tour-accessibility/1',
  controls: 12, inspected: 12, measuredButtons: 8,
  findings: ['unnamed-button'], note: 'local-observation-only',
});

test('verified observation becomes an explicitly limited review report', () => {
  const report = makeAuditReport(observed());
  assert.deepEqual(report, valid());
  assert.equal(report.screenReader, 'not-tested');
  assert.equal(report.provider, 'not-tested');
  assert.equal(report.realFace, 'not-tested');
  assert.equal(report.physicalDevice, 'not-tested');
});

test('canonical serialization round-trips in a fixed, metadata-only shape', () => {
  const json = serializeAuditReport(makeAuditReport(observed()));
  assert.deepEqual(parseAuditReport(json), valid());
  assert.equal(json.charAt(json.length - 1), '\n');
  assert.doesNotMatch(json, /image\/png|data:image|faceId|requestKey|apiKey/i);
  assert.ok(json.length < 1024);
});

test('a forged certified screen reader verdict is rejected', () => {
  assert.throws(() => checkedAuditReport({ ...valid(), screenReader: 'passed' }), Error);
  assert.throws(() => checkedAuditReport({ ...valid(), physicalDevice: 'passed' }), Error);
  assert.throws(() => checkedAuditReport({ ...valid(), realFace: 'passed' }), Error);
  assert.throws(() => checkedAuditReport({ ...valid(), provider: 'passed' }), Error);
});

test('unknown report names or scope cannot be upgraded by a caller', () => {
  assert.throws(() => checkedAuditReport({ ...valid(),
    format: 'beljour-tour-accessibility/2' }), Error);
  assert.throws(() => checkedAuditReport({ ...valid(),
    scope: 'entire-application' }), Error);
  assert.throws(() => checkedAuditReport({ ...valid(),
    evidence: 'independently-verified' }), Error);
});

test('counts must be bounded, integers and internally consistent', () => {
  const countNames = ['inspected', 'controls', 'measuredButtons'];
  for (const field of countNames) {
    for (const value of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 5]) {
      assert.throws(() => checkedAuditReport({ ...valid(), [field]: value }), RangeError);
    }
  }
  assert.throws(() => checkedAuditReport({ ...valid(), inspected: 13 }), RangeError);
  assert.throws(() => checkedAuditReport({ ...valid(), measuredButtons: 13 }), RangeError);
  assert.equal(checkedAuditReport({ ...valid(), controls: 320 }).controls, 320);
});

test('report rejects unknown, duplicated, or excessive finding keys', () => {
  assert.throws(() => checkedAuditReport({ ...valid(), findings: ['face-quality-pass'] }), Error);
  assert.throws(() => checkedAuditReport({ ...valid(),
    findings: ['unnamed-button', 'unnamed-button'] }), Error);
  assert.throws(() => checkedAuditReport({ ...valid(), findings: null }), RangeError);
  assert.throws(() => checkedAuditReport({ ...valid(), findings: 'valid' }), RangeError);
  assert.throws(() => checkedAuditReport({ ...valid(), findings: Array(15).fill('x') }), RangeError);
});

test('a forged photo payload is refused during strict JSON import', () => {
  const value = { ...valid(), image: 'data:image/png;base64,private' };
  assert.throws(() => parseAuditReport(JSON.stringify(value)), Error);
  assert.throws(() => parseAuditReport(JSON.stringify({ ...valid(), photoSha256: 'abc' })), Error);
  assert.throws(() => parseAuditReport(JSON.stringify({ ...valid(), userName: 'PERSON' })), Error);
  assert.throws(() => parseAuditReport(JSON.stringify({ ...valid(), authToken: 'secret' })), Error);
});

test('an import cannot omit any fixed evidence disclaimer', () => {
  for (const field of Object.keys(valid())) {
    const report = valid();
    delete report[field];
    assert.throws(() => parseAuditReport(JSON.stringify(report)), Error);
  }
});

test('invalid JSON structures or oversized payloads are refused', () => {
  for (const payload of ['', 'null', '[]', 'false', '123', '"caption"', '{oops', ' '.repeat(5000)]) {
    assert.throws(() => parseAuditReport(payload));
  }
  assert.throws(() => parseAuditReport({}), RangeError);
});

test('canonicalization strips additional in-memory keys without serializing them', () => {
  const dangerous = { ...valid(), photo: 'secret-image-content' };
  const raw = serializeAuditReport(dangerous);
  assert.doesNotMatch(raw, /secret-image-content|"photo"/);
  assert.deepEqual(parseAuditReport(raw), valid());
});

test('observation cannot pass under an unknown evidence provenance', () => {
  assert.throws(() => makeAuditReport({ ...observed(),
    note: 'real-world-certified' }), Error);
  assert.throws(() => makeAuditReport({ ...observed(),
    format: 'foreign-format/1' }), Error);
});

test('download requests a same-process metadata file and revokes its object URL', () => {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const urls = [];
  const revoked = [];
  const anchors = [];
  URL.createObjectURL = file => {
    urls.push(file);
    return 'blob:beljour-audit-local';
  };
  URL.revokeObjectURL = url => revoked.push(url);
  try {
    const doc = { createElement: () => {
      const anchor = { click() { this.clicked = true; } };
      anchors.push(anchor);
      return anchor;
    } };
    downloadAuditReport(doc, valid());
    assert.equal(anchors.length, 1);
    assert.equal(anchors[0].clicked, true);
    assert.equal(anchors[0].href, 'blob:beljour-audit-local');
    assert.equal(anchors[0].download, 'beljour-tour-accessibility.json');
    assert.equal(urls[0].type, 'application/json');
    assert.deepEqual(revoked, ['blob:beljour-audit-local']);
  } finally {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  }
});

test('object URL is revoked even if browser rejects the local download click', () => {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const revoked = [];
  URL.createObjectURL = () => 'blob:blocked';
  URL.revokeObjectURL = url => revoked.push(url);
  try {
    const doc = { createElement: () => ({
      click() { throw new Error('User agent denied download'); },
    }) };
    assert.throws(() => downloadAuditReport(doc, valid()), /User agent denied/);
    assert.deepEqual(revoked, ['blob:blocked']);
  } finally {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  }
});

test('extended ARIA and landmark findings round-trip as fixed schema categories', () => {
  const report = {
    ...valid(), findings: [
      'broken-aria-reference', 'missing-canvas-description',
      'multiple-main-landmarks', 'missing-status-region',
    ],
  };
  const parsed = parseAuditReport(serializeAuditReport(report));
  assert.deepEqual(parsed.findings, report.findings);
  assert.equal(parsed.screenReader, 'not-tested');
});
