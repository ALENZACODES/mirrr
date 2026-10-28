import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  JudgeFailureReplay,
  MOCK_FAILURE_CASES,
  validateFailureReplay,
} from '../dist/js/layout/judge-failure-replay.js';

const expectedIds = ['unit-limit', 'offline', 'consent', 'timeout', 'bad-response'];

test('the optional failure simulator defaults to idle and cannot claim a provider result', () => {
  const replay = new JudgeFailureReplay();
  const state = replay.snapshot();
  assert.equal(state.phase, 'idle');
  assert.equal(state.scenario, null);
  assert.equal(state.requestsSent, 0);
  assert.equal(state.providerResultClaimed, false);
  assert.equal(state.preservesOriginal, true);
  assert.equal(validateFailureReplay(state), true);
});

test('every refusal scenario is distinct, deterministic and explicitly fictional', () => {
  assert.deepEqual(MOCK_FAILURE_CASES.map(item => item.id), expectedIds);
  const replay = new JudgeFailureReplay();
  for (const item of MOCK_FAILURE_CASES) {
    assert.equal(replay.simulate(item.id), true);
    const state = replay.snapshot();
    assert.equal(state.phase, 'simulated-refusal');
    assert.equal(state.scenario, item.id);
    assert.equal(state.reason, item.cause);
    assert.equal(state.recovery, item.recovery);
    assert.equal(state.requestsSent, 0);
    assert.equal(state.providerResultClaimed, false);
    assert.equal(validateFailureReplay(state), true);
    assert.ok(state.message.includes('original') || state.message.includes('Local edits')
      || state.message.includes('styling request'));
  }
});

test('unit exhaustion never triggers a paid fallback or automatic retry', () => {
  const replay = new JudgeFailureReplay();
  replay.simulate('unit-limit');
  let state = replay.snapshot();
  assert.match(state.message, /available styling units/);
  assert.match(state.recovery, /only if units become available/);
  assert.equal(state.requestsSent, 0);
  assert.equal(replay.acknowledge(), true);
  state = replay.snapshot();
  assert.equal(state.phase, 'ready-to-retry');
  assert.match(state.message, /manually/);
  assert.equal(state.requestsSent, 0);
});

test('loss of connectivity keeps local editing available and never transfers a photo', () => {
  const replay = new JudgeFailureReplay();
  replay.simulate('offline');
  const state = replay.snapshot();
  assert.match(state.message, /Local edits are still available/);
  assert.match(state.recovery, /fresh permission/);
  assert.equal(state.preservesOriginal, true);
  assert.equal(state.requestsSent, 0);
});

test('withheld consent does not turn into an attestation for real provider use', () => {
  const replay = new JudgeFailureReplay();
  replay.simulate('consent');
  const state = replay.snapshot();
  assert.match(state.message, /without a separate, explicit photo permission/);
  assert.match(state.recovery, /real application's consent step/);
  assert.equal(state.providerResultClaimed, false);
});

test('a timed-out task is not claimed successful or retried automatically', () => {
  const replay = new JudgeFailureReplay();
  replay.simulate('timeout');
  const state = replay.snapshot();
  assert.match(state.message, /No result is available/);
  assert.match(state.recovery, /rather than starting another chargeable request/);
  assert.equal(state.requestsSent, 0);
});

test('an invalid provider-like result cannot display invented pixels', () => {
  const replay = new JudgeFailureReplay();
  replay.simulate('bad-response');
  const state = replay.snapshot();
  assert.match(state.recovery, /never display invented provider pixels/);
  assert.equal(state.providerResultClaimed, false);
});

test('acknowledgement does not work before a refusal or twice in a row', () => {
  const replay = new JudgeFailureReplay();
  assert.equal(replay.acknowledge(), false);
  replay.simulate('offline');
  assert.equal(replay.acknowledge(), true);
  assert.equal(replay.acknowledge(), false);
  assert.equal(replay.snapshot().requestsSent, 0);
});

test('invalid scenarios do not change a previously chosen refusal', () => {
  const replay = new JudgeFailureReplay();
  replay.simulate('consent');
  assert.equal(replay.simulate('secret-provider-code'), false);
  assert.equal(replay.simulate(null), false);
  assert.equal(replay.snapshot().scenario, 'consent');
});

test('reset clears all error text and starts from a non-observation', () => {
  const replay = new JudgeFailureReplay();
  replay.simulate('unit-limit');
  replay.reset();
  assert.equal(replay.snapshot().phase, 'idle');
  assert.equal(replay.snapshot().scenario, null);
  assert.equal(replay.snapshot().reason, '');
  assert.equal(replay.snapshot().recovery, '');
});

test('dispose clears the state and prevents later simulated actions', () => {
  const replay = new JudgeFailureReplay();
  replay.simulate('bad-response');
  replay.dispose();
  assert.equal(replay.snapshot().phase, 'idle');
  assert.equal(replay.simulate('offline'), false);
  assert.equal(replay.acknowledge(), false);
});

test('untrusted fake verdicts cannot pass the safety shape validator', () => {
  const replay = new JudgeFailureReplay();
  replay.simulate('timeout');
  const current = replay.snapshot();
  assert.equal(validateFailureReplay({ ...current, requestsSent: 1 }), false);
  assert.equal(validateFailureReplay({ ...current, providerResultClaimed: true }), false);
  assert.equal(validateFailureReplay({ ...current, preservesOriginal: false }), false);
  assert.equal(validateFailureReplay({ ...current, scenario: 'external' }), false);
});
