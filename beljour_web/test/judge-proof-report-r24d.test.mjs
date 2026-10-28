import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JudgeSession } from '../dist/js/layout/judge-session.js';
import { JudgeEvidenceLedger } from '../dist/js/layout/judge-evidence-ledger.js';
import { evaluateJudgeWitness } from '../dist/js/layout/judge-proof-policy.js';
import { judgeRunbook } from '../dist/js/layout/judge-runbook.js';
import {
  formatJudgeSafeReport,
  makeJudgeSafeReport,
  prepareJudgeReportDownload,
  requestJudgeReportDownload,
} from '../dist/js/layout/judge-proof-report.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function reportFixture(final = false) {
  const session = new JudgeSession();
  const ledger = new JudgeEvidenceLedger();
  if (final) {
    session.selectSource('sample');
    ledger.record('source-selected', 100);
    session.next();
    for (const key of ['local', 'hair', 'face', 'mock']) session.consent(key, true);
    ledger.record('local-consent', 110);
    session.next();
    session.setHair('chestnut');
    ledger.record('hair-applied', 120);
    session.next();
    session.setFace('warm');
    ledger.record('face-applied', 130);
    session.next();
    session.setMock(true);
    ledger.record('mock-opened', 140);
    session.next();
    session.setComparison(80);
    ledger.record('comparison-moved', 150);
    session.next();
    ledger.record('export-attempted', 160);
    ledger.record('download-requested', 170);
    session.next();
    ledger.record('plans-visited', 180);
  }
  const evidence = ledger.snapshot();
  const witness = evaluateJudgeWitness(session.snapshot, evidence);
  const book = judgeRunbook(session.snapshot, witness, 52_000);
  const report = makeJudgeSafeReport(witness, evidence, book);
  return { session, ledger, evidence, witness, book, report };
}

test('safe report format is versioned and explicitly illustrative', () => {
  const { report } = reportFixture();
  assert.equal(report.schema, 'beljour-judge-rehearsal/1');
  assert.equal(report.platform, 'browser-local');
  assert.equal(report.demoKind, 'illustrative-only');
  assert.match(report.label, /SIMULATION/);
  assert.equal(report.localDemoProviderCalls, 0);
  assert.equal(report.providerCallsMeasured, 'not-measured');
});

test('unfinished guide reports eight missing actions without claiming success', () => {
  const { report } = reportFixture();
  assert.equal(report.observed, 0);
  assert.equal(report.missing, 8);
  assert.equal(report.skipped, 0);
  assert.equal(report.visitedOnly, 0);
  assert.equal(report.downloadRequestRecorded, false);
  assert.equal(report.downloadArrivalVerified, false);
});

test('complete local run reports eight actions without upgrading real-provider status', () => {
  const { report } = reportFixture(true);
  assert.equal(report.observed, 8);
  assert.equal(report.missing, 0);
  assert.equal(report.skipped, 0);
  assert.equal(report.downloadRequestRecorded, true);
  assert.equal(report.downloadArrivalVerified, false);
  assert.equal(report.realFaceQuality, 'not-tested');
  assert.equal(report.realDeviceAccessibility, 'not-tested');
});

test('exported text visibly states local-only and unverified API claims', () => {
  const output = formatJudgeSafeReport(reportFixture(true).report);
  assert.match(output, /local Judge Mode rehearsal/);
  assert.match(output, /not a verified live YouCam API result/);
  assert.match(output, /Real YouCam API availability and result: NOT MEASURED/);
  assert.match(output, /Download arrival and saved-file integrity: NOT VERIFIED/);
  assert.match(output, /Physical device accessibility and speed: NOT TESTED/);
  assert.match(output, /Real-face fairness and quality: NOT TESTED/);
});

test('safe report has only stable, allow-listed keys', () => {
  const { report } = reportFixture(true);
  const keys = Object.keys(report).sort();
  assert.deepEqual(keys, [
    'demoKind', 'downloadArrivalVerified', 'downloadRequestRecorded',
    'elapsedLabel', 'label', 'liveProviderCalls', 'localDemoProviderCalls',
    'missing', 'observed', 'photoBytesInReport', 'platform',
    'providerCallsMeasured', 'realDeviceAccessibility', 'realFaceQuality',
    'schema', 'skipped', 'steps', 'visitedOnly', 'withinRehearsalTarget',
  ].filter(key => key !== 'liveProviderCalls'));
});

test('report never includes a selected file name or photo ID from unrelated session fields', () => {
  const data = reportFixture(true);
  const modified = { ...data.session.snapshot, filename: 'customer-secret.jpg', photoId: 'private-image-id' };
  const witness = evaluateJudgeWitness(modified, data.evidence);
  const book = judgeRunbook(modified, witness, 1200);
  const content = formatJudgeSafeReport(makeJudgeSafeReport(witness, data.evidence, book));
  assert.doesNotMatch(content, /customer-secret|private-image-id/);
  assert.equal(content.includes('No source image, filename, identity'), true);
});

test('report does not embed consent values, edit names or source pixels', () => {
  const { report } = reportFixture(true);
  const content = JSON.stringify(report);
  assert.doesNotMatch(content, /"permissions"|"face":"warm"|"hair":"chestnut"/);
  assert.doesNotMatch(content, /base64|data:image|imageData|objectUrl|pixels/i);
  assert.equal(report.photoBytesInReport, 0);
});

test('fixed eight rows have stable names, statuses and ordered step IDs', () => {
  const { report } = reportFixture(true);
  assert.equal(report.steps.length, 8);
  assert.deepEqual(report.steps.map(row => row.id), [
    'source', 'consent', 'hair', 'face', 'tryon', 'compare', 'export', 'plans',
  ]);
  assert.ok(report.steps.every(row => row.status === 'Observed locally'));
  assert.ok(report.steps.every(row => row.note.length > 10));
});

test('downloadable report is plain text, not an image or a live provider payload', async () => {
  const download = prepareJudgeReportDownload(reportFixture(true).report);
  assert.equal(download.filename, 'BELJOUR-FULL-BEAUTY-STUDIO-judge-rehearsal.txt');
  assert.match(download.blob.type, /text\/plain/);
  assert.equal(download.bytes, download.blob.size);
  assert.ok(download.bytes > 500);
  const contents = await download.blob.text();
  assert.match(contents, /STEP-BY-STEP LOCAL OBSERVATIONS/);
  assert.doesNotMatch(contents, /access_token|Bearer |api_key|data:image/);
});

test('report note starts no download by merely being constructed', () => {
  const calls = [];
  const port = {
    createObjectURL: () => { calls.push('create'); return 'blob:fake'; },
    revokeObjectURL: () => { calls.push('revoke'); },
  };
  const file = prepareJudgeReportDownload(reportFixture().report);
  assert.equal(file.filename.endsWith('.txt'), true);
  assert.deepEqual(calls, []);
  assert.equal(typeof port.createObjectURL, 'function');
});

test('a user-initiated report request activates the link and eventually releases its URL', () => {
  const page = judgeDOM();
  const calls = [];
  const port = {
    createObjectURL: blob => { calls.push(['created', blob.type]); return 'blob:local'; },
    revokeObjectURL: url => { calls.push(['revoked', url]); },
  };
  let deferred;
  try {
    const download = prepareJudgeReportDownload(reportFixture(true).report);
    requestJudgeReportDownload(page.document, download, port, task => { deferred = task; });
    assert.deepEqual(calls, [['created', 'text/plain;charset=utf-8']]);
    assert.equal(page.root.querySelector('a'), null);
    deferred();
    assert.deepEqual(calls[1], ['revoked', 'blob:local']);
  } finally { page.close(); }
});

test('a thrown anchor activation still revokes the temporary object URL', () => {
  const doc = {
    body: { append() {} },
    createElement: () => ({ hidden: false, click() { throw Error('blocked'); }, remove() {} }),
  };
  const urls = { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} };
  let revoked = false;
  urls.revokeObjectURL = url => { revoked = url === 'blob:test'; };
  const download = prepareJudgeReportDownload(reportFixture().report);
  assert.throws(() => requestJudgeReportDownload(doc, download, urls, task => task()), /blocked/);
  assert.equal(revoked, true);
});

test('invalid or forged provider-evidence snapshot blocks report serialization', () => {
  const data = reportFixture(true);
  const invalid = { ...data.evidence, liveProviderCalls: 1 };
  assert.throws(() => makeJudgeSafeReport(data.witness, invalid, data.book), TypeError);
});

test('partial summaries cannot be mislabeled a complete transcript', () => {
  const data = reportFixture(true);
  assert.throws(() => makeJudgeSafeReport({ ...data.witness, rows: [] }, data.evidence, data.book), TypeError);
});

test('measured rehearsal time remains foreground elapsed, not network timing', () => {
  const data = reportFixture(true);
  assert.equal(data.report.elapsedLabel, '0:52');
  assert.equal(data.report.withinRehearsalTarget, true);
  const after = judgeRunbook(data.session.snapshot, data.witness, 190000);
  const report = makeJudgeSafeReport(data.witness, data.evidence, after);
  assert.equal(report.elapsedLabel, '3:10');
  assert.equal(report.withinRehearsalTarget, false);
});

test('the final transcript names every step but never claims a real-face win', () => {
  const output = formatJudgeSafeReport(reportFixture(true).report);
  const heading = output.indexOf('STEP-BY-STEP LOCAL OBSERVATIONS');
  assert.ok(heading >= 0);
  const section = output.slice(heading);
  for (const word of ['Image', 'Consent', 'Hair', 'Face', 'Mock', 'Compare', 'Export', 'Plans']) {
    assert.match(section, new RegExp(word + ': Observed locally'));
  }
  assert.doesNotMatch(output, /face quality passed|100,000-face gate passed/i);
});
