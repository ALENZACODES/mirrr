import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JUDGE_STEPS } from '../dist/js/layout/judge-contract.js';
import { JudgeSession } from '../dist/js/layout/judge-session.js';
import { JudgeEvidenceLedger } from '../dist/js/layout/judge-evidence-ledger.js';
import { evaluateJudgeWitness } from '../dist/js/layout/judge-proof-policy.js';
import {
  JUDGE_CUES,
  judgeRunbook,
  validateJudgeCuePlan,
} from '../dist/js/layout/judge-runbook.js';

function makeBook(step = 'source', elapsed = 0) {
  const session = new JudgeSession();
  while (session.snapshot.step !== step) session.skip();
  const ledger = new JudgeEvidenceLedger();
  const witness = evaluateJudgeWitness(session.snapshot, ledger.snapshot());
  return judgeRunbook(session.snapshot, witness, elapsed);
}

test('the authored guided path covers eight distinct steps in the same order', () => {
  assert.deepEqual(JUDGE_CUES.map(cue => cue.step), JUDGE_STEPS.map(step => step.id));
  assert.equal(JUDGE_CUES.length, 8);
  assert.equal(new Set(JUDGE_CUES.map(cue => cue.step)).size, 8);
  assert.deepEqual(validateJudgeCuePlan(), []);
});

test('the suggested target totals exactly three minutes without pretending to measure it', () => {
  assert.equal(JUDGE_CUES.reduce((sum, cue) => sum + cue.targetSeconds, 0), 180);
  const plan = makeBook();
  assert.equal(plan.targetMs, 180_000);
  assert.equal(plan.totalMinutes, '3:00');
  assert.equal(plan.actualMs, 0);
  assert.equal(plan.isMobileBenchmark, false);
});

test('cumulative targets are monotone and end at 180 seconds', () => {
  const book = makeBook();
  assert.deepEqual(book.rows.map(row => row.deadlineMs), [
    15000, 40000, 65000, 90000, 115000, 135000, 165000, 180000,
  ]);
  assert.equal(book.rows.at(-1).targetLabel, '3:00');
  for (let index = 1; index < book.rows.length; index += 1) {
    assert.ok(book.rows[index].deadlineMs > book.rows[index - 1].deadlineMs);
  }
});

test('each cue contains an actual action and honest explanatory copy', () => {
  for (const cue of JUDGE_CUES) {
    assert.ok(cue.instruction.length >= 20, cue.step);
    assert.ok(cue.narration.length >= 20, cue.step);
    assert.ok(cue.honestBoundary.length >= 20, cue.step);
    assert.ok(cue.recovery.length >= 20, cue.step);
    assert.ok(cue.keyboard.length >= 20, cue.step);
    assert.ok(cue.targetSeconds >= 15, cue.step);
  }
});

test('current step selects its matching talk track without changing the session', () => {
  for (const step of JUDGE_STEPS) {
    const book = makeBook(step.id);
    assert.equal(book.active.step, step.id);
    assert.equal(book.active.number, JUDGE_STEPS.indexOf(step) + 1);
  }
});

test('rehearsal status changes only at the elapsed-time threshold', () => {
  const under = makeBook('source', 179999);
  const equal = makeBook('source', 180000);
  const over = makeBook('source', 180001);
  assert.equal(under.timeStatus, 'within-rehearsal-target');
  assert.equal(equal.timeStatus, 'within-rehearsal-target');
  assert.equal(over.timeStatus, 'over-rehearsal-target');
});

test('elapsed time is not passed off as a hardware performance benchmark', () => {
  const book = makeBook('export', 75000);
  assert.equal(book.isMobileBenchmark, false);
  assert.equal(book.actualMs, 75000);
  assert.match(book.active.honestBoundary, /download/i);
  assert.match(book.active.recovery, /fails/i);
});

test('invalid elapsed times reject early rather than create fake results', () => {
  const session = new JudgeSession();
  const evidence = evaluateJudgeWitness(session.snapshot, new JudgeEvidenceLedger().snapshot());
  for (const ms of [-1, NaN, Infinity, -Infinity]) {
    assert.throws(() => judgeRunbook(session.snapshot, evidence, ms), RangeError);
  }
});

test('the mock cue explicitly says no provider request', () => {
  const cue = makeBook('tryon').active;
  assert.match(cue.narration, /does not call/);
  assert.match(cue.honestBoundary, /real API/);
  assert.doesNotMatch(cue.narration, /successful YouCam output/i);
});

test('the illustrative hair and face cues reject clinical or realism inference', () => {
  const hair = makeBook('hair').active;
  const face = makeBook('face').active;
  assert.match(hair.honestBoundary, /transformation quality/);
  assert.match(face.honestBoundary, /skin inference/);
  assert.match(face.narration, /not a skin condition/);
});

test('consent is described as scope-specific without granting provider permissions', () => {
  const cue = makeBook('consent').active;
  assert.match(cue.narration, /not permit a real provider upload/);
  assert.match(cue.honestBoundary, /No YouCam consent/);
});

test('export cue separates download request from saved-file confirmation', () => {
  const cue = makeBook('export').active;
  assert.match(cue.narration, /painted into the export/);
  assert.match(cue.honestBoundary, /distinct from verifying a saved file/);
  assert.match(cue.recovery, /switch format or size/);
});

test('keyboard guidance uses accessible native controls and never capture keys', () => {
  const values = JUDGE_CUES.map(row => row.keyboard);
  assert.match(values[0], /Tab/);
  assert.match(values[1], /Space/);
  assert.match(values[5], /arrow keys/);
  assert.match(values[7], /Escape/);
  for (const row of values) {
    assert.doesNotMatch(row, /capture|log keys|tracking/i);
  }
});

test('fallback notes do not fabricate successful image edits', () => {
  for (const cue of JUDGE_CUES) {
    assert.match(cue.recovery, /if|skip|fails|Exit|retry/i);
  }
});

test('a skipped step cannot appear observed in its talk-track timeline', () => {
  const book = makeBook('plans', 3000);
  assert.equal(book.rows[0].observed, false);
  assert.equal(book.rows[6].observed, false);
  assert.equal(book.active.observed, false);
});

test('talk track will not silently change if the 8-step contract is extended', () => {
  assert.equal(JUDGE_STEPS.length, 8);
  assert.deepEqual(validateJudgeCuePlan(), []);
  assert.deepEqual(JUDGE_CUES.map(cue => cue.targetSeconds), [15, 25, 25, 25, 25, 20, 30, 15]);
});
