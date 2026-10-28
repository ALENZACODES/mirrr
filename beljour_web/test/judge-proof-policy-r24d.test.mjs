import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JudgeSession } from '../dist/js/layout/judge-session.js';
import { JudgeEvidenceLedger } from '../dist/js/layout/judge-evidence-ledger.js';
import {
  evaluateJudgeWitness,
  judgeWitnessHeadline,
  judgeWitnessLabel,
} from '../dist/js/layout/judge-proof-policy.js';

function evidenceFor(session, ledger) {
  return evaluateJudgeWitness(session.snapshot, ledger.snapshot());
}

function sessionAt(step) {
  const session = new JudgeSession();
  const ledger = new JudgeEvidenceLedger();
  if (step === 'source') return { session, ledger };
  session.selectSource('sample');
  ledger.record('source-selected', 10);
  session.next();
  if (step === 'consent') return { session, ledger };
  for (const action of ['local', 'hair', 'face', 'mock']) session.consent(action, true);
  ledger.record('local-consent', 20);
  session.next();
  if (step === 'hair') return { session, ledger };
  session.setHair('chestnut');
  ledger.record('hair-applied', 30);
  session.next();
  if (step === 'face') return { session, ledger };
  session.setFace('warm');
  ledger.record('face-applied', 40);
  session.next();
  if (step === 'tryon') return { session, ledger };
  session.setMock(true);
  ledger.record('mock-opened', 50);
  session.next();
  if (step === 'compare') return { session, ledger };
  session.setComparison(55);
  ledger.record('comparison-moved', 60);
  session.next();
  if (step === 'export') return { session, ledger };
  ledger.record('export-attempted', 70);
  ledger.record('download-requested', 71);
  session.next();
  ledger.record('plans-visited', 80);
  return { session, ledger };
}

test('initial local rehearsal cannot report any action as observed', () => {
  const { session, ledger } = sessionAt('source');
  const summary = evidenceFor(session, ledger);
  assert.equal(summary.observed, 0);
  assert.equal(summary.notObserved, 8);
  assert.equal(summary.skipped, 0);
  assert.equal(summary.visited, 0);
  assert.equal(summary.allDemoActionsObserved, false);
  assert.equal(summary.canProveLiveProvider, false);
  assert.equal(summary.canProveImageDownload, false);
  assert.equal(summary.evidenceVersion, 'beljour-judge-rehearsal/1');
});

test('one source selection is an observed local action, not a processed face', () => {
  const { session, ledger } = sessionAt('consent');
  const summary = evidenceFor(session, ledger);
  assert.equal(summary.observed, 1);
  assert.equal(summary.rows[0].status, 'observed');
  assert.match(summary.rows[0].reason, /locally chosen image/);
  assert.equal(summary.rows[1].status, 'not-observed');
  assert.equal(summary.rows[7].status, 'not-observed');
});

test('source state alone cannot supply matching evidence without ledger record', () => {
  const session = new JudgeSession();
  session.selectSource('sample');
  const summary = evaluateJudgeWitness(session.snapshot, new JudgeEvidenceLedger().snapshot());
  assert.equal(summary.rows[0].status, 'not-observed');
  assert.equal(summary.observed, 0);
});

test('consent must be local opt-in and observed, not inferred from navigation', () => {
  const { session, ledger } = sessionAt('hair');
  let summary = evidenceFor(session, ledger);
  assert.equal(summary.rows[1].status, 'observed');
  ledger.withdraw('local');
  summary = evidenceFor(session, ledger);
  assert.equal(summary.rows[1].status, 'visited');
  assert.equal(summary.visited, 1);
});

test('hair observation requires the hair permission and an actual choice', () => {
  const { session, ledger } = sessionAt('face');
  assert.equal(evidenceFor(session, ledger).rows[2].status, 'observed');
  session.consent('hair', false);
  ledger.withdraw('hair');
  assert.equal(evidenceFor(session, ledger).rows[2].status, 'visited');
});

test('face observation is distinct from local hair consent', () => {
  const { session, ledger } = sessionAt('tryon');
  assert.equal(evidenceFor(session, ledger).rows[3].status, 'observed');
  session.consent('face', false);
  ledger.withdraw('face');
  assert.equal(evidenceFor(session, ledger).rows[3].status, 'visited');
  assert.equal(evidenceFor(session, ledger).rows[2].status, 'observed');
});

test('mock action never becomes real YouCam proof', () => {
  const { session, ledger } = sessionAt('compare');
  const summary = evidenceFor(session, ledger);
  assert.equal(summary.rows[4].status, 'observed');
  assert.match(summary.rows[4].reason, /without an API call/);
  assert.equal(summary.canProveLiveProvider, false);
  assert.equal(summary.canProveImageDownload, false);
});

test('comparison must be manipulated; merely showing the slider is not evidence', () => {
  const { session, ledger } = sessionAt('compare');
  assert.equal(evidenceFor(session, ledger).rows[5].status, 'not-observed');
  session.setComparison(70);
  assert.equal(evidenceFor(session, ledger).rows[5].status, 'not-observed');
  ledger.record('comparison-moved', 60);
  assert.equal(evidenceFor(session, ledger).rows[5].status, 'observed');
});

test('export screen completed without Save remains visited only', () => {
  const { session, ledger } = sessionAt('export');
  assert.equal(session.next(), true);
  ledger.record('plans-visited', 90);
  const summary = evidenceFor(session, ledger);
  assert.equal(summary.rows[6].status, 'visited');
  assert.equal(summary.allDemoActionsObserved, false);
  assert.match(summary.rows[6].reason, /not observed/);
});

test('an unsuccessful export attempt is not equivalent to a requested file', () => {
  const { session, ledger } = sessionAt('export');
  ledger.record('export-attempted', 70);
  session.next();
  ledger.record('plans-visited', 80);
  const summary = evidenceFor(session, ledger);
  assert.equal(summary.rows[6].status, 'visited');
  assert.equal(summary.observed, 7);
  assert.equal(summary.canProveImageDownload, false);
});

test('a successful request still never certifies saved-file arrival', () => {
  const { session, ledger } = sessionAt('plans');
  const summary = evidenceFor(session, ledger);
  assert.equal(summary.rows[6].status, 'observed');
  assert.match(summary.rows[6].reason, /File arrival is not verified/);
  assert.equal(summary.canProveImageDownload, false);
});

test('eight locally observed actions still do not verify an API or real-photo test', () => {
  const { session, ledger } = sessionAt('plans');
  const summary = evidenceFor(session, ledger);
  assert.equal(summary.observed, 8);
  assert.equal(summary.allDemoActionsObserved, true);
  assert.equal(summary.notObserved, 0);
  assert.equal(summary.visited, 0);
  assert.equal(summary.skipped, 0);
  assert.match(judgeWitnessHeadline(summary), /live APIs are not verified/);
  assert.equal(summary.canProveLiveProvider, false);
});

test('skips do not count as observed even if later state would be ready', () => {
  const session = new JudgeSession();
  const ledger = new JudgeEvidenceLedger();
  session.skip();
  ledger.record('source-selected', 10);
  const summary = evidenceFor(session, ledger);
  assert.equal(summary.rows[0].status, 'skipped');
  assert.equal(summary.skipped, 1);
  assert.equal(summary.observed, 0);
  assert.match(judgeWitnessHeadline(summary), /skipped/);
});

test('skipping all seven early screens leaves only plans visible', () => {
  const session = new JudgeSession();
  const ledger = new JudgeEvidenceLedger();
  for (let index = 0; index < 7; index += 1) session.skip();
  ledger.record('plans-visited', 1);
  const summary = evidenceFor(session, ledger);
  assert.equal(summary.skipped, 7);
  assert.equal(summary.observed, 1);
  assert.equal(summary.visited, 0);
  assert.equal(summary.notObserved, 0);
  assert.equal(summary.allDemoActionsObserved, false);
});

test('going backward to change source invalidates the export request', () => {
  const { session, ledger } = sessionAt('plans');
  for (let index = 0; index < 7; index += 1) session.back();
  session.selectSource('upload');
  ledger.reset();
  ledger.record('source-selected', 0);
  const summary = evidenceFor(session, ledger);
  assert.equal(summary.rows[0].status, 'observed');
  assert.equal(summary.rows[6].status, 'not-observed');
  assert.equal(summary.observed, 1);
});

test('status vocabulary is plain English and safe to show in live regions', () => {
  assert.equal(judgeWitnessLabel('observed'), 'Observed locally');
  assert.equal(judgeWitnessLabel('visited'), 'Screen visited only');
  assert.equal(judgeWitnessLabel('skipped'), 'Skipped');
  assert.equal(judgeWitnessLabel('not-observed'), 'Not observed');
});

test('headline differentiates skipped, visited and incomplete observations', () => {
  const base = evidenceFor(...Object.values(sessionAt('source')));
  assert.match(judgeWitnessHeadline(base), /in progress/);
  assert.match(judgeWitnessHeadline({ ...base, skipped: 1 }), /skipped/);
  assert.match(judgeWitnessHeadline({ ...base, visited: 1 }), /not observed/);
});

test('observation rows preserve the ordered eight-step contract and reasons', () => {
  const { session, ledger } = sessionAt('plans');
  const rows = evidenceFor(session, ledger).rows;
  assert.deepEqual(rows.map(row => row.id), [
    'source', 'consent', 'hair', 'face', 'tryon', 'compare', 'export', 'plans',
  ]);
  assert.deepEqual(rows.map(row => row.observation), [
    'source-selected', 'local-consent', 'hair-applied', 'face-applied',
    'mock-opened', 'comparison-moved', 'download-requested', 'plans-visited',
  ]);
  for (const row of rows) {
    assert.ok(row.title.length > 0);
    assert.ok(row.reason.length > 15);
  }
});
