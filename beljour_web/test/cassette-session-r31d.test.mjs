/** Disposable cassette session and explicit acknowledgement. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CassetteSession } from '../dist/js/layout/continuous/cassette-session.js';
import { ContinuousDemoState } from '../dist/js/layout/continuous/state.js';

function fixture(flag = false) {
  const state = new ContinuousDemoState();
  state.chooseDrawnSource(3, 2, 'drawn-main');
  for (const key of ['local', 'hair', 'face', 'mock']) state.setPermission(key, true);
  const cassette = new CassetteSession(flag);
  cassette.warm(state.snapshot, true);
  return { state, cassette };
}

test('a new offline session begins with zero observations or billable actions', () => {
  const { state, cassette } = fixture();
  assert.deepEqual(cassette.snapshot.observed, []);
  assert.equal(cassette.snapshot.selectedId, null);
  assert.equal(cassette.snapshot.lastResult, null);
  assert.equal(cassette.snapshot.providerCalls, 0);
  assert.equal(cassette.snapshot.unitsSpent, 0);
  assert.equal(cassette.snapshot.imageUploaded, false);
  assert.equal(cassette.snapshot.bag.items.length, 0);
  cassette.dispose();
  state.dispose();
});

test('the first cached result is recorded as illustration-only', () => {
  const { state, cassette } = fixture();
  const result = cassette.choose('drawn-hair', state.snapshot, true);
  assert.equal(result.status, 'ready');
  assert.equal(result.liveVerified, false);
  assert.equal(cassette.snapshot.selectedId, 'drawn-hair');
  assert.deepEqual(cassette.snapshot.observed, ['drawn-hair']);
  assert.match(cassette.explanation(state.snapshot, true), /Zero provider/);
  cassette.dispose();
  state.dispose();
});

test('reviewed examples are counted once across repeated clicks', () => {
  const { state, cassette } = fixture();
  for (let i = 0; i < 6; i += 1) cassette.choose('drawn-hair', state.snapshot, true);
  assert.deepEqual(cassette.snapshot.observed, ['drawn-hair']);
  cassette.dispose();
  state.dispose();
});

test('a cache miss is visible and never becomes a provider request', () => {
  const { state, cassette } = fixture();
  state.chooseDrawnSource(4, 2, 'drawn-main');
  const result = cassette.choose('drawn-hair', state.snapshot, true);
  assert.equal(result.status, 'invalid-source');
  assert.equal(cassette.snapshot.providerCalls, 0);
  assert.equal(cassette.snapshot.observed.length, 0);
  cassette.dispose();
  state.dispose();
});

test('a missing permission prevents adding a fabricated sample bag item', () => {
  const { state, cassette } = fixture();
  state.setPermission('hair', false);
  cassette.choose('drawn-hair', state.snapshot, true);
  assert.equal(cassette.addToBag(state.snapshot, true), false);
  assert.equal(cassette.snapshot.bag.items.length, 0);
  cassette.dispose();
  state.dispose();
});

test('an eligible local card creates one sample bag entry without a checkout', () => {
  const { state, cassette } = fixture();
  cassette.choose('drawn-hair', state.snapshot, true);
  assert.equal(cassette.addToBag(state.snapshot, true), true);
  assert.deepEqual(cassette.snapshot.bag.items.map(item => item.id), ['drawn-hair']);
  assert.equal(cassette.snapshot.bag.hasPayment, false);
  cassette.dispose();
  state.dispose();
});

test('clearing a subject resets all observations and bag examples', () => {
  const { state, cassette } = fixture();
  cassette.choose('drawn-hair', state.snapshot, true);
  cassette.addToBag(state.snapshot, true);
  state.selectSubject('drawn-second', true);
  cassette.warm(state.snapshot, true);
  assert.equal(cassette.snapshot.lastResult, null);
  assert.equal(cassette.snapshot.observed.length, 0);
  assert.equal(cassette.snapshot.bag.items.length, 0);
  assert.equal(cassette.canRead('drawn-hair', state.snapshot, true), true);
  cassette.dispose();
  state.dispose();
});

test('consent withdrawal wipes the sample bag on the next rebind', () => {
  const { state, cassette } = fixture();
  cassette.choose('drawn-makeup', state.snapshot, true);
  cassette.addToBag(state.snapshot, true);
  state.setPermission('face', false);
  cassette.warm(state.snapshot, true);
  assert.equal(cassette.snapshot.bag.items.length, 0);
  assert.equal(cassette.canRead('drawn-makeup', state.snapshot, true), false);
  cassette.dispose();
  state.dispose();
});

test('provider-off remains a valid local cassette route, not a live response', () => {
  const { state, cassette } = fixture();
  state.chooseMockMode('off');
  const answer = cassette.choose('drawn-skin', state.snapshot, true);
  assert.equal(answer.providerMode, 'off');
  assert.equal(answer.status, 'ready');
  assert.equal(answer.liveVerified, false);
  cassette.dispose();
  state.dispose();
});

test('a disabled feature flag always hides production destinations', () => {
  const { state, cassette } = fixture(false);
  cassette.choose('drawn-hair', state.snapshot, true);
  cassette.acknowledge(true);
  assert.equal(cassette.route(state.snapshot, true).available, false);
  assert.equal(cassette.route(state.snapshot, true).href, null);
  cassette.dispose();
  state.dispose();
});

test('enabled screen links still require a separate explicit acknowledgement', () => {
  const { state, cassette } = fixture(true);
  cassette.choose('drawn-makeup', state.snapshot, true);
  assert.equal(cassette.route(state.snapshot, true).available, false);
  cassette.acknowledge(true);
  assert.equal(cassette.route(state.snapshot, true).available, true);
  cassette.acknowledge(false);
  assert.equal(cassette.route(state.snapshot, true).available, false);
  cassette.dispose();
  state.dispose();
});

test('session closure clears every observation, permission and sample item', () => {
  const { state, cassette } = fixture(true);
  cassette.choose('drawn-hair', state.snapshot, true);
  cassette.addToBag(state.snapshot, true);
  cassette.acknowledge(true);
  cassette.dispose();
  assert.deepEqual(cassette.snapshot.observed, []);
  assert.equal(cassette.snapshot.bag.items.length, 0);
  assert.equal(cassette.snapshot.acknowledged, false);
  assert.equal(cassette.choose('drawn-hair', state.snapshot, true), null);
  state.dispose();
});

test('invalid ids never create a new catalogue or route', () => {
  const { state, cassette } = fixture(true);
  assert.equal(cassette.choose('not-registered', state.snapshot, true), null);
  assert.equal(cassette.snapshot.observed.length, 0);
  assert.equal(cassette.route(state.snapshot, true), null);
  cassette.dispose();
  state.dispose();
});
