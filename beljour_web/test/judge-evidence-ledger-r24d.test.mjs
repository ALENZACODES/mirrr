import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  JUDGE_MILESTONES,
  JudgeEvidenceLedger,
  isSafeJudgeSnapshot,
} from '../dist/js/layout/judge-evidence-ledger.js';

function recorded(ledger) {
  return ledger.snapshot().entries.map(row => row.code);
}

function advanceLedger() {
  const ledger = new JudgeEvidenceLedger();
  const events = [
    'source-selected', 'local-consent', 'hair-applied', 'face-applied',
    'mock-opened', 'comparison-moved', 'export-attempted',
    'download-requested', 'plans-visited',
  ];
  for (const [index, event] of events.entries()) {
    ledger.record(event, (index + 1) * 1000);
  }
  return ledger;
}

test('rehearsal begins with zero evidence and explicitly unknown saved-file receipt', () => {
  const ledger = new JudgeEvidenceLedger();
  const snapshot = ledger.snapshot();
  assert.deepEqual(snapshot.entries, []);
  assert.equal(snapshot.exportAttempts, 0);
  assert.equal(snapshot.requestMade, false);
  assert.equal(snapshot.exportedImageConfirmed, false);
  assert.equal(snapshot.liveProviderCalls, 0);
  assert.equal(snapshot.networkImageUploads, 0);
  assert.equal(isSafeJudgeSnapshot(snapshot), true);
  assert.equal(ledger.isDisposed, false);
});

test('fixed action vocabulary contains precisely the nine client observations', () => {
  assert.deepEqual(JUDGE_MILESTONES, [
    'source-selected', 'local-consent', 'hair-applied', 'face-applied',
    'mock-opened', 'comparison-moved', 'export-attempted',
    'download-requested', 'plans-visited',
  ]);
  assert.equal(new Set(JUDGE_MILESTONES).size, 9);
});

test('events have bounded relative times rather than wall-clock timestamps', () => {
  const ledger = new JudgeEvidenceLedger();
  assert.equal(ledger.record('source-selected', 1450.9), true);
  assert.equal(ledger.observedAt('source-selected'), 1450);
  assert.equal(ledger.record('local-consent', 1100), true);
  assert.equal(ledger.observedAt('local-consent'), 1450);
  assert.equal(ledger.record('hair-applied', 50_000_000_000), true);
  assert.equal(ledger.observedAt('hair-applied'), 86_400_000);
  assert.ok(isSafeJudgeSnapshot(ledger.snapshot()));
});

test('negative, NaN and infinite values are rejected before mutation', () => {
  const ledger = new JudgeEvidenceLedger();
  for (const value of [-1, Number.NaN, Infinity, -Infinity]) {
    assert.throws(() => ledger.record('source-selected', value), RangeError);
    assert.deepEqual(ledger.snapshot().entries, []);
  }
});

test('an unknown code is refused without storing an arbitrary string', () => {
  const ledger = new JudgeEvidenceLedger();
  assert.throws(() => ledger.record('photo-name:alice.png', 0), RangeError);
  assert.equal(ledger.snapshot().entries.length, 0);
});

test('repeated observations are bounded and preserve one row per code', () => {
  const ledger = new JudgeEvidenceLedger();
  for (let index = 0; index < 1100; index += 1) {
    ledger.record('hair-applied', index);
  }
  const rows = ledger.snapshot().entries;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].occurrence, 999);
  assert.equal(rows[0].elapsedMs, 1099);
  assert.equal(isSafeJudgeSnapshot(ledger.snapshot()), true);
});

test('entry order follows elapsed time even when the user moves backwards', () => {
  const ledger = new JudgeEvidenceLedger();
  ledger.record('comparison-moved', 4500);
  ledger.record('local-consent', 6700);
  ledger.record('source-selected', 6600);
  assert.deepEqual(recorded(ledger), [
    'comparison-moved', 'source-selected', 'local-consent',
  ]);
  assert.equal(isSafeJudgeSnapshot(ledger.snapshot()), true);
});

test('the export request flag appears only after a browser activation', () => {
  const ledger = new JudgeEvidenceLedger();
  ledger.record('export-attempted', 400);
  assert.equal(ledger.snapshot().requestMade, false);
  assert.equal(ledger.snapshot().exportAttempts, 1);
  ledger.record('download-requested', 500);
  assert.equal(ledger.snapshot().requestMade, true);
  assert.equal(ledger.snapshot().exportedImageConfirmed, false);
});

test('revising a photo clears prior observations and export request', () => {
  const ledger = advanceLedger();
  assert.equal(ledger.snapshot().entries.length, 9);
  ledger.reset();
  assert.equal(ledger.snapshot().entries.length, 0);
  assert.equal(ledger.observedAt('source-selected'), null);
  assert.equal(ledger.snapshot().requestMade, false);
  assert.equal(ledger.snapshot().exportAttempts, 0);
  ledger.record('source-selected', 0);
  assert.deepEqual(recorded(ledger), ['source-selected']);
});

test('withdrawing local permission clears edit, comparison and export observations', () => {
  const ledger = advanceLedger();
  ledger.withdraw('local');
  assert.deepEqual(recorded(ledger), ['source-selected', 'plans-visited']);
  assert.equal(ledger.snapshot().exportAttempts, 0);
  assert.equal(ledger.snapshot().requestMade, false);
});

test('withdrawing hair keeps independent face/mock activity but clears derived export', () => {
  const ledger = advanceLedger();
  ledger.withdraw('hair');
  assert.equal(ledger.has('hair-applied'), false);
  assert.equal(ledger.has('face-applied'), true);
  assert.equal(ledger.has('mock-opened'), true);
  assert.equal(ledger.has('comparison-moved'), false);
  assert.equal(ledger.has('download-requested'), false);
});

test('withdrawing face preserves hair while invalidating comparison/export', () => {
  const ledger = advanceLedger();
  ledger.withdraw('face');
  assert.equal(ledger.has('face-applied'), false);
  assert.equal(ledger.has('hair-applied'), true);
  assert.equal(ledger.has('mock-opened'), true);
  assert.equal(ledger.has('download-requested'), false);
});

test('withdrawing mock does not retrospectively erase local edits', () => {
  const ledger = advanceLedger();
  ledger.withdraw('mock');
  assert.equal(ledger.has('mock-opened'), false);
  assert.equal(ledger.has('hair-applied'), true);
  assert.equal(ledger.has('face-applied'), true);
  assert.equal(ledger.has('download-requested'), false);
});

test('adjusting an edit forces comparison and file request to be checked again', () => {
  const ledger = advanceLedger();
  ledger.changedEdit();
  assert.equal(ledger.has('hair-applied'), true);
  assert.equal(ledger.has('face-applied'), true);
  assert.equal(ledger.has('comparison-moved'), false);
  assert.equal(ledger.has('export-attempted'), false);
  assert.equal(ledger.has('download-requested'), false);
  assert.equal(ledger.snapshot().exportAttempts, 0);
});

test('snapshot copies cannot mutate private evidence or change the request flag', () => {
  const ledger = advanceLedger();
  const old = ledger.snapshot();
  old.entries[0].code = 'source-hijack';
  assert.equal(ledger.has('source-selected'), true);
  assert.equal(ledger.snapshot().entries[0].code, 'source-selected');
  old.entries.push({ code: 'unknown', elapsedMs: 0, occurrence: 1 });
  assert.equal(ledger.snapshot().entries.length, 9);
});

test('safe snapshot validation rejects forged provider success and photo byte counts', () => {
  const valid = advanceLedger().snapshot();
  assert.equal(isSafeJudgeSnapshot(valid), true);
  assert.equal(isSafeJudgeSnapshot({ ...valid, liveProviderCalls: 1 }), false);
  assert.equal(isSafeJudgeSnapshot({ ...valid, networkImageUploads: 1024 }), false);
  assert.equal(isSafeJudgeSnapshot({ ...valid, exportedImageConfirmed: true }), false);
  assert.equal(isSafeJudgeSnapshot({ ...valid, requestMade: false }), false);
});

test('safe validation rejects an unknown or duplicated action', () => {
  const valid = advanceLedger().snapshot();
  const forged = [
    { code: 'uploaded-photo-id', elapsedMs: 1, occurrence: 1 },
    { code: 'source-selected', elapsedMs: 1, occurrence: 1 },
  ];
  assert.equal(isSafeJudgeSnapshot({ ...valid, entries: [...valid.entries, ...forged] }), false);
  assert.equal(isSafeJudgeSnapshot({ ...valid, entries: [...valid.entries, valid.entries[0]] }), false);
});

test('safe validation rejects negative time, fractional occurrences and reordered samples', () => {
  const valid = advanceLedger().snapshot();
  const base = valid.entries;
  assert.equal(isSafeJudgeSnapshot({
    ...valid, entries: [{ ...base[0], elapsedMs: -1 }, ...base.slice(1)],
  }), false);
  assert.equal(isSafeJudgeSnapshot({
    ...valid, entries: [{ ...base[0], occurrence: 1.5 }, ...base.slice(1)],
  }), false);
  assert.equal(isSafeJudgeSnapshot({ ...valid, entries: [...base].reverse() }), false);
});

test('dispose erases observations and rejects any late completion', () => {
  const ledger = advanceLedger();
  ledger.dispose();
  assert.equal(ledger.isDisposed, true);
  assert.deepEqual(ledger.snapshot().entries, []);
  assert.equal(ledger.snapshot().requestMade, false);
  assert.equal(ledger.record('download-requested', 9000), false);
  ledger.withdraw('local');
  ledger.changedEdit();
  ledger.reset();
  ledger.dispose();
  assert.equal(ledger.snapshot().entries.length, 0);
});

test('changing only output format invalidates its request but preserves comparison evidence', () => {
  const ledger = advanceLedger();
  ledger.changedExport();
  assert.equal(ledger.has('comparison-moved'), true);
  assert.equal(ledger.has('hair-applied'), true);
  assert.equal(ledger.has('face-applied'), true);
  assert.equal(ledger.has('export-attempted'), false);
  assert.equal(ledger.has('download-requested'), false);
  assert.equal(ledger.snapshot().exportAttempts, 0);
});
