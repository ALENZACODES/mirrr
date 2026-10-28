// Lane D r22d: isolated Judge Mode state; no real provider or user file.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  JUDGE_STEPS,
  OUTPUT_SIZES,
  SIMULATION_MARK,
  judgeFileName,
  judgeIndex,
  judgeStepAt,
  validateJudgeDimensions,
  validateJudgeUpload,
} from '../dist/js/layout/judge-contract.js';
import { JudgeSession } from '../dist/js/layout/judge-session.js';

function ready() {
  const s = new JudgeSession();
  s.selectSource('sample');
  s.consent('local', true);
  s.consent('hair', true);
  s.consent('face', true);
  s.consent('mock', true);
  return s;
}

test('walkthrough uses eight ordered, unique steps', () => {
  assert.equal(JUDGE_STEPS.length, 8);
  assert.deepEqual(JUDGE_STEPS.map(x => x.id), [
    'source', 'consent', 'hair', 'face', 'tryon', 'compare', 'export', 'plans',
  ]);
  assert.equal(new Set(JUDGE_STEPS.map(x => x.id)).size, JUDGE_STEPS.length);
  assert.equal(judgeIndex('tryon'), 4);
  assert.equal(judgeStepAt(6), 'export');
  assert.throws(() => judgeStepAt(8), RangeError);
  assert.throws(() => judgeStepAt(-1), RangeError);
});

test('starting without a selected image does not advance', () => {
  const s = new JudgeSession();
  assert.match(s.unmet, /Choose/);
  assert.equal(s.next(), false);
  assert.equal(s.snapshot.step, 'source');
  assert.equal(s.progress().number, 1);
});

test('photo selection resets previous edits but not its separate consent choices', () => {
  const s = ready();
  assert.equal(s.setHair('deep-blue'), true);
  assert.equal(s.setFace('warm'), true);
  assert.equal(s.setMock(true), true);
  s.selectSource('upload');
  assert.equal(s.snapshot.source, 'upload');
  assert.equal(s.snapshot.hair, 'none');
  assert.equal(s.snapshot.face, 'none');
  assert.equal(s.snapshot.mock, false);
  assert.equal(s.snapshot.permissions.hair, true);
});

test('consent is denied by default and granted action by action', () => {
  const s = new JudgeSession();
  s.selectSource('sample');
  assert.equal(s.setHair('chestnut'), false);
  assert.equal(s.setFace('cool'), false);
  assert.equal(s.setMock(true), false);
  s.consent('hair', true);
  assert.equal(s.setHair('chestnut'), false, 'local consent is required too');
  s.consent('local', true);
  assert.equal(s.setHair('chestnut'), true);
  assert.equal(s.setFace('cool'), false, 'no automatic face grant');
  assert.equal(s.setMock(true), false, 'no automatic mock grant');
});

test('revoking local permission withdraws every other choice and clears edits', () => {
  const s = ready();
  s.setHair('chestnut');
  s.setFace('warm');
  s.setMock(true);
  s.consent('local', false);
  assert.deepEqual(s.snapshot.permissions, { local: false, hair: false, face: false, mock: false });
  assert.deepEqual([s.snapshot.hair, s.snapshot.face, s.snapshot.mock], ['none', 'none', false]);
});

test('revoking an individual permission clears only the linked edit', () => {
  const s = ready();
  s.setHair('deep-blue');
  s.setFace('cool');
  s.setMock(true);
  s.consent('face', false);
  assert.equal(s.snapshot.face, 'none');
  assert.equal(s.snapshot.hair, 'deep-blue');
  assert.equal(s.snapshot.mock, true);
  s.consent('mock', false);
  assert.equal(s.snapshot.mock, false);
  assert.equal(s.snapshot.hair, 'deep-blue');
});

test('unknown values fail closed without modifying the rendering state', () => {
  const s = ready();
  assert.equal(s.setHair('neon-unreviewed'), false);
  assert.equal(s.setFace('unreviewed'), false);
  assert.equal(s.setExport('application/pdf', 'large'), false);
  assert.equal(s.setExport('image/jpeg', 'enormous'), false);
  assert.deepEqual([s.snapshot.format, s.snapshot.size], ['image/png', 'standard']);
});

test('Continue enforces each required action while Skip remains available', () => {
  const s = ready();
  assert.equal(s.next(), true);
  assert.equal(s.next(), true);
  assert.equal(s.snapshot.step, 'hair');
  assert.equal(s.next(), false);
  assert.match(s.unmet, /hair-colour/);
  assert.equal(s.skip(), true);
  assert.equal(s.snapshot.step, 'face');
  assert.deepEqual(s.snapshot.skipped, ['hair']);
  assert.equal(s.setFace('warm'), true);
  assert.equal(s.next(), true);
  assert.equal(s.snapshot.step, 'tryon');
  assert.equal(s.next(), false);
  assert.equal(s.setMock(true), true);
  assert.equal(s.next(), true);
  assert.equal(s.snapshot.step, 'compare');
});

test('Back changes the visible step but does not grant previously refused consent', () => {
  const s = new JudgeSession();
  assert.equal(s.back(), false);
  s.skip();
  s.skip();
  assert.equal(s.snapshot.step, 'hair');
  s.back();
  assert.equal(s.snapshot.step, 'consent');
  assert.equal(s.snapshot.permissions.local, false);
});

test('progress counts steps and records skipped vs completed distinctly', () => {
  const s = ready();
  assert.deepEqual(s.progress(), { number: 1, total: 8, percent: 13 });
  s.next();
  s.skip();
  assert.deepEqual(s.snapshot.complete, ['source']);
  assert.deepEqual(s.snapshot.skipped, ['consent']);
  assert.equal(s.progress().number, 3);
});

test('comparison range is clamped and rejects non-finite values', () => {
  const s = new JudgeSession();
  s.setComparison(30.8);
  assert.equal(s.snapshot.comparison, 31);
  s.setComparison(200);
  assert.equal(s.snapshot.comparison, 100);
  s.setComparison(-3);
  assert.equal(s.snapshot.comparison, 0);
  s.setComparison(Number.NaN);
  assert.equal(s.snapshot.comparison, 0);
});

test('export choices are strictly PNG/JPEG at one of two bounded sizes', () => {
  const s = new JudgeSession();
  assert.equal(s.setExport('image/jpeg', 'large'), true);
  assert.deepEqual([s.snapshot.format, s.snapshot.size], ['image/jpeg', 'large']);
  assert.equal(judgeFileName('image/png'), 'beljour-illustrative-demo.png');
  assert.equal(judgeFileName('image/jpeg'), 'beljour-illustrative-demo.jpg');
  assert.deepEqual(OUTPUT_SIZES.large, { width: 768, height: 960 });
  assert.match(SIMULATION_MARK, /SIMULATION/);
});

test('reset clears every in-memory option, completion and opt-in', () => {
  const s = ready();
  s.setHair('chestnut');
  s.setFace('warm');
  s.setMock(true);
  s.setExport('image/jpeg', 'large');
  s.next();
  s.reset();
  assert.equal(s.snapshot.step, 'source');
  assert.equal(s.snapshot.source, null);
  assert.equal(s.snapshot.hair, 'none');
  assert.equal(s.snapshot.mock, false);
  assert.equal(s.snapshot.format, 'image/png');
  assert.deepEqual(s.snapshot.complete, []);
  assert.deepEqual(s.snapshot.permissions, { local: false, hair: false, face: false, mock: false });
});

test('upload input validation rejects oversized, empty and unsupported files', () => {
  assert.equal(validateJudgeUpload({ size: 10, type: 'image/webp' }), null);
  assert.match(validateJudgeUpload({ size: 0, type: 'image/png' }), /10 MB/);
  assert.match(validateJudgeUpload({ size: 11 * 1024 * 1024, type: 'image/jpeg' }), /10 MB/);
  assert.match(validateJudgeUpload({ size: 100, type: 'image/svg+xml' }), /JPEG/);
});

test('image dimensions must be finite, plausible and bounded', () => {
  assert.equal(validateJudgeDimensions(512, 640), null);
  assert.match(validateJudgeDimensions(0, 1), /too small/);
  assert.match(validateJudgeDimensions(Number.NaN, 100), /too small/);
  assert.match(validateJudgeDimensions(13_000, 640), /too large/);
  assert.match(validateJudgeDimensions(11_000, 11_000), /too large/);
});
