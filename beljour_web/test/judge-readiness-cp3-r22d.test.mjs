// Lane D r22d-cp3: not a gate score; skipped work cannot be counted as proof.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  judgeEvidencePlainText,
  safeEvidenceNote,
  stepEvidence,
  summarizeJudgeEvidence,
} from '../dist/js/layout/judge-readiness.js';
import { JUDGE_STEPS } from '../dist/js/layout/judge-contract.js';
import { availableSession } from './judge-fixtures-cp3-r22d.mjs';
import { JudgeSession } from '../dist/js/layout/judge-session.js';

test('every contracted step has one honest evidence row', () => {
  const state = new JudgeSession().snapshot;
  const summary = summarizeJudgeEvidence(state);
  assert.equal(summary.rows.length, JUDGE_STEPS.length);
  assert.deepEqual(summary.rows.map(row => row.step), JUDGE_STEPS.map(step => step.id));
  assert.equal(summary.total, 8);
});

test('empty session reports no completed steps and no implied provider success', () => {
  const summary = summarizeJudgeEvidence(new JudgeSession().snapshot);
  assert.equal(summary.done, 0);
  assert.equal(summary.skipped, 0);
  assert.equal(summary.hasSelectedImage, false);
  assert.equal(summary.realProviderVerified, false);
  assert.equal(summary.exportIsLabelled, true);
  assert.ok(summary.actionNeeded > 0);
});

test('an unselected source is action-needed rather than done', () => {
  const state = new JudgeSession().snapshot;
  assert.equal(stepEvidence(state, 'source').status, 'action-needed');
  assert.match(stepEvidence(state, 'source').note, /runtime-drawn sample/);
});

test('selection alone does not grant local consent', () => {
  const session = new JudgeSession();
  session.selectSource('sample');
  const source = stepEvidence(session.snapshot, 'source');
  const consent = stepEvidence(session.snapshot, 'consent');
  assert.equal(source.status, 'ready');
  assert.equal(consent.status, 'action-needed');
});

test('a checked local option does not assert hair or face work occurred', () => {
  const session = new JudgeSession();
  session.selectSource('sample');
  session.consent('local', true);
  session.consent('hair', true);
  session.consent('face', true);
  assert.equal(stepEvidence(session.snapshot, 'consent').status, 'ready');
  assert.equal(stepEvidence(session.snapshot, 'hair').status, 'action-needed');
  assert.equal(stepEvidence(session.snapshot, 'face').status, 'action-needed');
});

test('selected overlays and mock are recorded only as local readiness', () => {
  const session = availableSession();
  assert.equal(stepEvidence(session.snapshot, 'hair').status, 'ready');
  assert.equal(stepEvidence(session.snapshot, 'face').status, 'ready');
  assert.equal(stepEvidence(session.snapshot, 'tryon').status, 'ready');
  assert.match(stepEvidence(session.snapshot, 'tryon').note, /zero YouCam units/);
});

test('skip never masquerades as complete even when editing permissions are true', () => {
  const session = availableSession();
  session.skip();
  assert.equal(stepEvidence(session.snapshot, 'source').status, 'skipped');
  assert.equal(summarizeJudgeEvidence(session.snapshot).done, 0);
  assert.equal(summarizeJudgeEvidence(session.snapshot).skipped, 1);
});

test('completed source advances progress without guessing export success', () => {
  const session = availableSession();
  assert.equal(session.next(), true);
  assert.equal(stepEvidence(session.snapshot, 'source').status, 'done');
  assert.notEqual(stepEvidence(session.snapshot, 'export').status, 'done');
  assert.equal(summarizeJudgeEvidence(session.snapshot).done, 1);
});

test('skipping the entire route records seven skipped items and no source', () => {
  const session = new JudgeSession();
  for (let index = 0; index < 7; index += 1) assert.equal(session.skip(), true);
  assert.equal(session.snapshot.step, 'plans');
  assert.equal(summarizeJudgeEvidence(session.snapshot).skipped, 7);
  assert.equal(summarizeJudgeEvidence(session.snapshot).done, 0);
  assert.equal(summarizeJudgeEvidence(session.snapshot).realProviderVerified, false);
});

test('revoked face choice does not stay ready', () => {
  const session = availableSession();
  assert.equal(stepEvidence(session.snapshot, 'face').status, 'ready');
  session.consent('face', false);
  assert.equal(stepEvidence(session.snapshot, 'face').status, 'action-needed');
});

test('the export step requires a selected image, not an external permission', () => {
  const session = new JudgeSession();
  assert.equal(stepEvidence(session.snapshot, 'export').status, 'action-needed');
  session.selectSource('upload');
  assert.equal(stepEvidence(session.snapshot, 'export').status, 'ready');
});

test('plain-text report does not contain personal photos, metrics or a success claim', () => {
  const report = judgeEvidencePlainText(availableSession().snapshot);
  assert.match(report, /illustrative browser demo only/);
  assert.match(report, /not demonstrated by this walkthrough/);
  assert.match(report, /permanent label required/);
  assert.match(report, /No photos, names, device identifiers or timings included/);
  assert.doesNotMatch(report, /passed fairness|provider succeeded|quality score/i);
});

test('evidence note distinguishes no image, skipped and fully selected paths', () => {
  const blank = new JudgeSession();
  assert.match(safeEvidenceNote(blank.snapshot), /No image/);
  blank.selectSource('sample');
  assert.match(safeEvidenceNote(blank.snapshot), /local illustration/);
  blank.skip();
  assert.match(safeEvidenceNote(blank.snapshot), /skipped/);
});

test('step descriptions use plain copy rather than vendor or clinical results', () => {
  const blank = new JudgeSession().snapshot;
  for (const step of JUDGE_STEPS) {
    const item = stepEvidence(blank, step.id);
    assert.ok(item.note.length > 15);
    assert.doesNotMatch(item.note, /100% accurate|clinical diagnosis|guarantee/i);
    assert.ok(['ready', 'done', 'skipped', 'action-needed'].includes(item.status));
  }
});
