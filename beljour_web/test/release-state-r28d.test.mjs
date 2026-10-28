import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RELEASE_CHECK_IDS, RELEASE_REFUSALS } from '../dist/js/layout/release/catalogue.js';
import { ReleaseSession } from '../dist/js/layout/release/state.js';

function clock() {
  let current = 100;
  const state = new ReleaseSession(() => current);
  return { state, advance(delta) { current += delta; }, set(value) { current = value; } };
}

function one(session, id) {
  return session.snapshot.rows.find(row => row.id === id);
}

test('initial state contains every release check with no inferred evidence', () => {
  const { state } = clock();
  const snapshot = state.snapshot;
  assert.equal(snapshot.phase, 'not-started');
  assert.equal(snapshot.rows.length, RELEASE_CHECK_IDS.length);
  assert.ok(snapshot.rows.every(row => row.state === 'unobserved'));
  assert.equal(snapshot.independentlyVerified, false);
  assert.equal(snapshot.productionReady, false);
  assert.equal(snapshot.localChecks, 0);
});

test('recording a public route requires starting the rehearsal', () => {
  const { state } = clock();
  assert.throws(() => state.open('local-edit'), /Start/);
  state.start();
  state.open('local-edit');
  assert.equal(one(state, 'local-edit').state, 'opened');
  assert.throws(() => state.start(), /Already/);
});

test('manual review is impossible without an opened route', () => {
  const { state } = clock();
  state.start();
  assert.throws(() => state.review('hair'), /Open the application route/);
  state.open('hair');
  state.review('hair');
  assert.equal(one(state, 'hair').state, 'reviewed');
  assert.equal(state.snapshot.localChecks, 1);
  assert.equal(state.snapshot.independentlyVerified, false);
});

test('opening a route after a review clears the previous manual assertion', () => {
  const { state } = clock();
  state.start();
  state.open('makeup');
  state.review('makeup');
  assert.equal(state.snapshot.localChecks, 1);
  state.open('makeup');
  assert.equal(one(state, 'makeup').state, 'opened');
  assert.equal(state.snapshot.localChecks, 0);
});

test('device or independent checks cannot be manually marked reviewed', () => {
  const { state } = clock();
  state.start();
  for (const id of ['real-face', 'commercial-ip', 'submission', 'performance', 'accessibility']) {
    assert.throws(() => state.review(id), /Only operator checks/);
  }
});

test('an independent release gate cannot be opened by a public route', () => {
  const { state } = clock();
  state.start();
  assert.throws(() => state.open('real-face'), /no public route/);
  assert.throws(() => state.open('performance'), /no public route/);
});

test('every bounded refusal is retained with a reason and cleared later', () => {
  for (const reason of RELEASE_REFUSALS) {
    const { state } = clock();
    state.start();
    state.refuse('hair', reason);
    assert.equal(one(state, 'hair').state, 'refused');
    assert.equal(one(state, 'hair').refusal, reason);
    state.clear('hair');
    assert.deepEqual(one(state, 'hair'), {
      id: 'hair', state: 'unobserved', refusal: null, elapsedMs: null,
    });
  }
});

test('invalid refusal reasons and identifiers never modify state', () => {
  const { state } = clock();
  state.start();
  const before = state.snapshot.revision;
  assert.throws(() => state.refuse('hair', 'raw-photo'), /Invalid refusal/);
  assert.throws(() => state.open('unknown'), /Unknown release check/);
  assert.equal(state.snapshot.revision, before);
});

test('invalidation protects manual evidence when source, subject or consent changes', () => {
  for (const reason of ['source', 'subject', 'consent', 'identity-lock']) {
    const { state } = clock();
    state.start();
    state.open('hair');
    state.review('hair');
    state.open('local-edit');
    state.review('local-edit');
    assert.equal(state.snapshot.localChecks, 2);
    state.invalidate(reason);
    assert.equal(state.snapshot.localChecks, 0);
    assert.ok(state.snapshot.rows.every(row => row.state === 'unobserved'));
  }
});

test('attempt to inject invalid invalidation name does not change history', () => {
  const { state } = clock();
  state.start();
  state.open('hair');
  const before = state.snapshot.revision;
  assert.throws(() => state.invalidate('replace-with-success'), /Invalid/);
  assert.equal(state.snapshot.revision, before);
  assert.equal(one(state, 'hair').state, 'opened');
});

test('elapsed time uses monotonic supplied clock but remains capped', () => {
  const c = clock();
  c.state.start();
  c.advance(1243.7);
  assert.equal(c.state.snapshot.elapsedMs, 1244);
  c.state.stop();
  c.advance(99999);
  assert.equal(c.state.snapshot.elapsedMs, 1244);
  assert.equal(c.state.snapshot.phase, 'stopped');
  assert.ok(c.state.stoppedAt > 100);
});

test('bad clock values are refused without changing the session', () => {
  const c = clock();
  c.set(NaN);
  assert.throws(() => c.state.start(), /Clock/);
  c.set(200);
  assert.equal(c.state.snapshot.phase, 'not-started');
  c.state.start();
  c.set(-1);
  assert.throws(() => c.state.snapshot, /Clock/);
});

test('reset returns to an empty safe session without a stale report', () => {
  const { state } = clock();
  state.start();
  state.open('upload');
  state.review('upload');
  state.stop();
  state.reset();
  assert.equal(state.snapshot.phase, 'not-started');
  assert.equal(state.snapshot.localChecks, 0);
  assert.equal(state.snapshot.elapsedMs, 0);
  assert.equal(state.stoppedAt, null);
  assert.ok(state.snapshot.rows.every(row => row.elapsedMs === null));
});

test('a stopped session cannot take new operator assertions', () => {
  const { state } = clock();
  state.start();
  state.stop();
  assert.throws(() => state.open('upload'), /not running|Start the rehearsal/);
  assert.throws(() => state.clear('upload'), /not running/);
  assert.throws(() => state.stop(), /not running/);
});

test('read-only snapshot cannot silently mutate the source model', () => {
  const { state } = clock();
  state.start();
  const old = state.snapshot;
  old.rows[0].state = 'reviewed';
  assert.equal(state.snapshot.rows[0].state, 'unobserved');
});
