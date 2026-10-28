import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ContinuousDemoState, countApplied, minimumLevel } from '../dist/js/layout/continuous/state.js';
import { TOUR_STEPS, checkedLevel, defaultLevels, stepAt } from '../dist/js/layout/continuous/contract.js';

function ready() {
  const state = new ContinuousDemoState();
  state.chooseDrawnSource(1, 2, 'drawn-main');
  state.setPermission('local', true);
  state.setPermission('hair', true);
  state.setPermission('face', true);
  state.setPermission('mock', true);
  return state;
}

function reach(state, target) {
  for (let attempt = 0; attempt < TOUR_STEPS.length; attempt += 1) {
    if (state.snapshot.step === target) return;
    assert.equal(state.next(true), true);
  }
  assert.fail(`Could not reach ${target}`);
}

test('continuous flow has sixteen ordered, unique public steps', () => {
  assert.equal(TOUR_STEPS.length, 16);
  assert.equal(new Set(TOUR_STEPS.map(s => s.id)).size, 16);
  assert.equal(TOUR_STEPS[0].id, 'source');
  assert.equal(TOUR_STEPS.at(-1).id, 'save');
  for (const [index, row] of TOUR_STEPS.entries()) assert.equal(stepAt(index), row.id);
  assert.throws(() => stepAt(-1), RangeError);
  assert.throws(() => stepAt(16), RangeError);
  assert.throws(() => stepAt(0.4), RangeError);
});

test('identity is on by default and blocks every effect after it is disabled', () => {
  const state = ready();
  assert.equal(state.snapshot.identityLock, true);
  state.setIdentityLock(false);
  for (const effect of Object.keys(defaultLevels())) {
    assert.equal(state.apply(effect), false, `${effect} cannot bypass identity lock`);
  }
  state.setIdentityLock(true);
  assert.equal(state.apply('hair'), true);
  assert.equal(state.snapshot.applied.hair, true);
});

test('every effect intensity accepts decimal 1.0 through 5.0 in 0.1 steps', () => {
  const state = ready();
  for (const effect of Object.keys(defaultLevels())) {
    for (let tick = 10; tick <= 50; tick += 1) {
      const level = tick / 10;
      state.setStrength(effect, level);
      assert.equal(state.snapshot.levels[effect], level);
    }
    assert.throws(() => state.setStrength(effect, 0.9), RangeError);
    assert.throws(() => state.setStrength(effect, 5.1), RangeError);
    assert.throws(() => state.setStrength(effect, 1.05), RangeError);
    assert.throws(() => state.setStrength(effect, Number.NaN), RangeError);
  }
  assert.equal(checkedLevel('2.7'), 2.7);
  assert.throws(() => checkedLevel('unsafe'), RangeError);
  assert.equal(minimumLevel(defaultLevels()), 3);
});

test('face and hair permissions are separate and removing each clears dependent steps', () => {
  const state = ready();
  state.apply('hair');
  state.apply('colour');
  state.apply('concealer');
  state.apply('turn');
  state.setPermission('hair', false);
  assert.equal(state.snapshot.applied.hair, false);
  assert.equal(state.snapshot.applied.colour, false);
  assert.equal(state.snapshot.applied.concealer, true);
  assert.equal(state.apply('hair'), false);
  state.setPermission('face', false);
  assert.equal(state.snapshot.applied.concealer, false);
  assert.equal(state.snapshot.applied.turn, false);
  assert.equal(state.apply('posture'), false);
  state.setPermission('local', false);
  assert.equal(countApplied(state.snapshot.applied), 0);
});

test('source revision moves forward and resets all old proof', () => {
  const state = ready();
  state.apply('hair');
  state.reviewCommand('/CLEANUP');
  state.selectSeason('some_pack');
  state.recordTryon('mock-applied');
  state.recordDownload();
  state.chooseDrawnSource(2, 1, null);
  const copy = state.snapshot;
  assert.equal(copy.sourceLoaded, true);
  assert.equal(copy.sourceRevision, 2);
  assert.equal(copy.faceCount, 1);
  assert.equal(copy.selectedId, null);
  assert.equal(copy.identityLock, true);
  assert.equal(copy.permissions.local, false);
  assert.equal(copy.mockResult, 'not-requested');
  assert.equal(copy.requestedDownload, false);
  assert.deepEqual(copy.proCommandsReviewed, []);
  assert.equal(copy.seasonalId, null);
  assert.equal(countApplied(copy.applied), 0);
  assert.throws(() => state.chooseDrawnSource(2, 1, null), RangeError);
});

test('subject changes preserve the drawing but clear effects and exports', () => {
  const state = ready();
  state.apply('hair');
  state.apply('concealer');
  state.recordDownload();
  assert.equal(state.selectSubject('drawn-guest', true), true);
  assert.equal(state.snapshot.selectedId, 'drawn-guest');
  assert.equal(state.snapshot.applied.hair, false);
  assert.equal(state.snapshot.applied.concealer, false);
  assert.equal(state.snapshot.requestedDownload, false);
  assert.equal(state.selectSubject('invalid', false), false);
  assert.equal(state.snapshot.selectedId, 'drawn-guest');
});

test('cannot claim a step finished merely by opening it', () => {
  const state = new ContinuousDemoState();
  assert.equal(state.snapshot.step, 'source');
  assert.equal(state.readiness().allowed, false);
  assert.equal(state.next(), false);
  state.chooseDrawnSource(1, 2, 'drawn-main');
  assert.equal(state.next(), true);
  assert.equal(state.snapshot.step, 'faces');
  assert.equal(state.snapshot.completed.includes('source'), true);
  reach(state, 'save');
  assert.equal(state.snapshot.requestedDownload, false);
  assert.equal(state.readiness('save').allowed, false);
});

test('skipped and completed remain distinguishable', () => {
  const state = ready();
  assert.equal(state.next(true), true);
  assert.equal(state.snapshot.skipped.includes('source'), true);
  assert.equal(state.snapshot.completed.includes('source'), false);
  assert.equal(state.next(), true);
  assert.equal(state.snapshot.completed.includes('faces'), true);
  assert.equal(state.back(), true);
  assert.equal(state.snapshot.step, 'faces');
});

test('appearance cues never infer anything about the person', () => {
  const state = ready();
  for (const cue of ['none', 'masc', 'fem']) {
    state.setAppearance(cue);
    assert.equal(state.snapshot.appearanceCue, cue);
    assert.equal(state.snapshot.applied.appearance, false);
  }
  assert.throws(() => state.setAppearance('unknown'), RangeError);
});

test('provider-off mode is an explicit recorded refusal, not a successful try-on', () => {
  const state = ready();
  state.chooseMockMode('off');
  state.recordTryon('provider-disabled');
  assert.equal(state.snapshot.mockMode, 'off');
  assert.equal(state.snapshot.mockResult, 'provider-disabled');
  assert.equal(state.readiness('tryon').evidence, 'mock');
  state.chooseMockMode('mock');
  assert.equal(state.snapshot.mockResult, 'not-requested');
  assert.throws(() => state.recordTryon('real-success'), RangeError);
});

test('comparison has exact 0 and 100 boundaries independent of effect sliders', () => {
  const state = ready();
  state.compare(0);
  assert.equal(state.snapshot.comparePercent, 0);
  state.compare(100);
  assert.equal(state.snapshot.comparePercent, 100);
  assert.throws(() => state.compare(-1), RangeError);
  assert.throws(() => state.compare(101), RangeError);
  assert.throws(() => state.compare(4.5), RangeError);
});

test('after disposal no settings may be modified or exported', () => {
  const state = ready();
  state.dispose();
  assert.throws(() => state.apply('hair'), /closed/);
  assert.throws(() => state.snapshot, /closed/);
  assert.throws(() => state.recordDownload(), /closed/);
});
