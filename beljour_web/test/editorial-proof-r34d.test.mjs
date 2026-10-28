/** Evidence ledger: draw/mocks never imply external test success. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  proofWallReading,
  renderProofWall,
  validateProofWall,
} from '../dist/js/layout/editorial/proof.js';
import { sequencePage } from './helpers/continuous-sequence-page.mjs';

const input = {
  drawnLoaded: true, subjectChosen: true, localPermission: true,
  editCount: 5, requestedDownload: false, mockTryon: true, cacheFrames: 3,
};

function entry(reading, id) {
  return reading.entries.find(item => item.id === id);
}

test('uses eight fixed evidence entries with independent pending gates', () => {
  const report = proofWallReading(input);
  assert.deepEqual(report.entries.map(item => item.id), [
    'drawn', 'subject', 'local', 'download', 'youcam', 'identity', 'real-face', 'frozen',
  ]);
  assert.equal(entry(report, 'drawn').state, 'observed');
  assert.equal(entry(report, 'local').description, '5 illustrative edit stages in this session');
  assert.equal(entry(report, 'download').state, 'pending');
  assert.equal(entry(report, 'youcam').state, 'mock');
  assert.equal(entry(report, 'real-face').state, 'pending');
  assert.equal(entry(report, 'frozen').state, 'pending');
  assert.equal(report.externalQualityPassed, false);
  assert.equal(report.liveProviderVerified, false);
  assert.equal(report.frozen100kPassed, false);
});

test('provider-off and no edits cannot masquerade as completion', () => {
  const report = proofWallReading({
    drawnLoaded: false, subjectChosen: false, localPermission: false,
    editCount: 0, requestedDownload: false, mockTryon: false, cacheFrames: 0,
  });
  assert.ok(report.entries.every(item => item.state === 'pending'));
  assert.match(entry(report, 'download').description, /No download requested/);
});

test('download requested is not a verified saved file', () => {
  const report = proofWallReading({ ...input, requestedDownload: true });
  assert.equal(entry(report, 'download').state, 'observed');
  assert.match(entry(report, 'download').description, /not independently confirmed/);
});

for (const malformed of [
  { editCount: -1 }, { editCount: 8 }, { cacheFrames: 4 },
  { drawnLoaded: 'yes' }, { mockTryon: 1 },
  { subjectChosen: true, drawnLoaded: false },
  { requestedDownload: true, localPermission: false },
]) {
  test(`bad client source cannot make evidence: ${JSON.stringify(malformed)}`, () => {
    assert.throws(() => proofWallReading({ ...input, ...malformed }));
  });
}

for (const key of ['liveProviderVerified', 'externalQualityPassed', 'frozen100kPassed']) {
  test(`${key}: forged true is rejected`, () => {
    const fake = { ...proofWallReading(input), [key]: true };
    assert.throws(() => validateProofWall(fake), /unverified external results/);
  });
}

test('forged success statuses for real-face and release rows are rejected', () => {
  for (const id of ['identity', 'real-face', 'frozen']) {
    const report = proofWallReading(input);
    const forged = { ...report, entries: report.entries.map(row =>
      row.id === id ? { ...row, state: 'observed' } : row) };
    assert.throws(() => validateProofWall(forged), /unsupported claim/);
  }
});

test('DOM uses table semantics and no hard-coded outcome percentages', () => {
  const page = sequencePage();
  try {
    const panel = renderProofWall(page.document, proofWallReading(input));
    page.host.append(panel);
    assert.equal(panel.getAttribute('aria-label'), 'Proof Wall: observed and pending evidence');
    assert.equal(panel.querySelectorAll('table').length, 1);
    assert.equal(panel.querySelectorAll('th').length, 11);
    assert.equal(panel.querySelectorAll('td').length, 16);
    assert.equal(panel.querySelectorAll('tr').length, 9);
    assert.match(page.host.textContent, /The Proof Wall/);
    assert.match(page.host.textContent, /Mock only/);
    assert.match(page.host.textContent, /Not verified/);
    assert.doesNotMatch(page.host.textContent, /\b(?:96|98|100)%\b/);
    assert.equal(panel.querySelectorAll('img').length, 0);
  } finally { page.cleanup(); }
});
