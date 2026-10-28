/** Local frame reports contain only fixed metadata and no provider claims. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  downloadFrameReport, frameEvidence, frameReportBlob, verifiedFrameReport,
} from '../dist/js/layout/continuous/frame-report.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

const base = Object.freeze({
  phase: 'ready', available: 3, bytes: 384000, hits: 3, misses: 0,
  selected: 'makeup', networkCalls: 0, unitsSpent: 0, liveVerified: false,
});

test('report contains no pixels or authority identifiers', () => {
  const report = frameEvidence(base);
  assert.deepEqual(verifiedFrameReport(report), report);
  assert.equal(report.cachedFrames, 3);
  assert.equal(report.requestedFamily, 'makeup');
  const json = JSON.stringify(report);
  assert.doesNotMatch(json, /drawn-main|sha256|sourceRevision|selectedId|rgba|credentials|person-/i);
  assert.equal(report.liveVerified, false);
  assert.equal(report.realFaceVerified, false);
  assert.equal(report.frozenGatePassed, false);
});

test('a refused session is never reported as complete', () => {
  const report = frameEvidence({ ...base, phase: 'refused', available: 0, selected: null });
  assert.equal(report.sessionStatus, 'unavailable');
  assert.equal(report.cachedFrames, 0);
});

test('report serialization is small and type-limited', async () => {
  const blob = frameReportBlob(base);
  assert.ok(blob.size < 2048);
  assert.equal(blob.type, 'application/json');
  assert.deepEqual(JSON.parse(await blob.text()), frameEvidence(base));
});

for (const key of ['networkCalls', 'unitsSpent', 'liveVerified', 'realFaceVerified', 'frozenGatePassed']) {
  test(`forged positive ${key} cannot pass local-report validation`, () => {
    const candidate = { ...frameEvidence(base), [key]: 1 };
    assert.throws(() => verifiedFrameReport(candidate));
  });
}

test('invalid families, counts and extra keys are rejected', () => {
  const report = frameEvidence(base);
  for (const row of [
    { ...report, cachedFrames: 4 },
    { ...report, cachedFrames: -1 },
    { ...report, requestedFamily: 'injected-caption' },
    { ...report, trace: 'photo image data' },
    { ...report, format: 'different-format' },
  ]) assert.throws(() => verifiedFrameReport(row));
});

test('invalid live evidence from a callback cannot be made into a downloadable report', () => {
  assert.throws(() => frameEvidence({ ...base, networkCalls: 1 }));
  assert.throws(() => frameEvidence({ ...base, liveVerified: true }));
});

test('report download is user-initiated and revokes temporary URL', () => {
  const { document, close } = judgeDOM();
  const saved = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  const urls = [];
  URL.createObjectURL = () => 'blob:local-json-review';
  URL.revokeObjectURL = url => urls.push(url);
  try {
    downloadFrameReport(document, base);
    assert.deepEqual(urls, ['blob:local-json-review']);
  } finally {
    URL.createObjectURL = saved.create;
    URL.revokeObjectURL = saved.revoke;
    close();
  }
});
