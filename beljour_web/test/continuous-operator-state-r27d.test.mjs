import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  OPERATOR_ROUTE_IDS,
  OPERATOR_REFUSALS,
  operatorRoutes,
} from '../dist/js/layout/continuous/operator-contract.js';
import { OperatorRehearsal } from '../dist/js/layout/continuous/operator-state.js';
import { operatorGaps, operatorScript, scriptTimingTotal } from '../dist/js/layout/continuous/operator-script.js';

function fixture() {
  let now = 0;
  return { state: new OperatorRehearsal(() => now), advance: (ms) => { now += ms; } };
}

test('real-product entries are grounded and remain same-origin with no user data', () => {
  const routes = operatorRoutes();
  assert.deepEqual(routes.map(row => row.id), OPERATOR_ROUTE_IDS);
  assert.equal(routes.length, 7);
  assert.equal(new Set(routes.map(row => row.href)).size, 7);
  for (const row of routes) {
    assert.match(row.href, /^[a-z][a-z-]*\.html/);
    assert.doesNotMatch(row.href, /:|\/\/|\.\.|\?|@/);
    assert.ok(row.confirmation.length);
    assert.ok(row.fallback.length);
    assert.ok(row.prerequisite.length);
  }
});

test('seven runbook steps cover actual destinations with keyboard hints', () => {
  const script = operatorScript();
  assert.deepEqual(script.map(row => row.id), OPERATOR_ROUTE_IDS);
  assert.deepEqual(script.map(row => row.number), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(scriptTimingTotal(), 180);
  assert.equal(script.reduce((sum, row) => sum + row.expectedSeconds, 0), 180);
  for (const stage of script) {
    assert.ok(stage.caption.length > 15);
    assert.ok(stage.accessibleHint.length > 20);
    assert.ok(stage.failure.length > 20);
  }
  assert.equal(script.find(row => row.id === 'hair').providerRequiresConsent, true);
  assert.equal(script.find(row => row.id === 'makeup').providerRequiresConsent, true);
  assert.equal(script.find(row => row.id === 'studio').providerRequiresConsent, false);
});

test('opening a public page is not evidence that the page worked', () => {
  const { state, advance } = fixture();
  assert.equal(state.open('studio'), false);
  state.start();
  advance(120);
  assert.equal(state.open('studio'), true);
  assert.equal(state.snapshot.rows.find(row => row.id === 'studio').result, 'opened');
  assert.equal(state.snapshot.counts.opened, 1);
  assert.equal(state.snapshot.counts.selfReported, 0);
  assert.equal(state.snapshot.counts.providerProved, false);
  assert.equal(state.snapshot.counts.realFaceProved, false);
  assert.equal(state.snapshot.counts.releaseProved, false);
  state.dispose();
});

test('operator must explicitly acknowledge after opening; refusal is distinct', () => {
  const { state } = fixture();
  state.start();
  assert.equal(state.acknowledge('hair'), false);
  state.open('hair');
  assert.equal(state.acknowledge('hair'), true);
  assert.equal(state.snapshot.counts.selfReported, 1);
  assert.equal(state.snapshot.rows.find(row => row.id === 'hair').liveVerified, false);
  assert.equal(state.open('hair'), false);
  state.refuse('makeup', 'no-consent');
  assert.equal(state.snapshot.rows.find(row => row.id === 'makeup').refusal, 'no-consent');
  assert.equal(state.snapshot.counts.refused, 1);
  assert.throws(() => state.refuse('makeup', 'false-result'), RangeError);
  for (const code of OPERATOR_REFUSALS) assert.equal(typeof code, 'string');
  state.dispose();
});

test('replacing the source resets all manual markings and the timer', () => {
  const { state, advance } = fixture();
  state.reset(1);
  state.start();
  advance(3000);
  state.open('makeup');
  state.acknowledge('makeup');
  state.refuse('hair', 'offline');
  state.reset(2);
  assert.equal(state.snapshot.sourceRevision, 2);
  assert.equal(state.snapshot.counts.notStarted, 7);
  assert.equal(state.snapshot.clock.activeMs, 0);
  assert.equal(state.snapshot.clock.status, 'idle');
  assert.equal(state.snapshot.counts.selfReported, 0);
  assert.equal(state.snapshot.counts.refused, 0);
  state.dispose();
});

test('clear mark invalidates a prior manual acknowledgement', () => {
  const { state } = fixture();
  state.start();
  state.open('commerce');
  state.acknowledge('commerce');
  state.clear('commerce');
  assert.equal(state.snapshot.rows.find(row => row.id === 'commerce').result, 'not-started');
  assert.equal(state.snapshot.counts.selfReported, 0);
});

test('operator script gaps never certify provider or release gates', () => {
  const { state } = fixture();
  state.start();
  for (const id of OPERATOR_ROUTE_IDS) {
    state.open(id);
    state.acknowledge(id);
  }
  const result = operatorGaps(state.snapshot);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.refused, []);
  assert.equal(result.completeHumanChecklist, true);
  assert.equal(result.verifiedProvider, false);
  assert.equal(result.acceptedForRelease, false);
  assert.match(result.advice.join(' '), /separate evidence/i);
  state.dispose();
});

test('refusals and time overrun survive as visible operator gaps', () => {
  const { state, advance } = fixture();
  state.start();
  advance(200000);
  state.refuse('hair', 'unavailable');
  const gaps = operatorGaps(state.snapshot);
  assert.ok(gaps.refused.includes('hair'));
  assert.ok(gaps.missing.includes('studio'));
  assert.ok(gaps.advice.some(message => message.includes('three-minute')));
  state.dispose();
});

test('closed operator session discards statuses and refuses further operations', () => {
  const { state } = fixture();
  state.start();
  state.open('photo');
  state.dispose();
  assert.throws(() => state.open('photo'), /ended|closed/);
  assert.throws(() => state.snapshot, /ended/);
  assert.throws(() => state.reset(2), /ended/);
});
