/** Revision- and subject-bound local cassette. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DrawnCassetteCache } from '../dist/js/layout/continuous/cassette-cache.js';
import { CASSETTE_CARDS } from '../dist/js/layout/continuous/cassette-contract.js';
import { ContinuousDemoState } from '../dist/js/layout/continuous/state.js';

function stateWithConsent() {
  const state = new ContinuousDemoState();
  state.chooseDrawnSource(21, 2, 'drawn-main');
  for (const scope of ['local', 'hair', 'face', 'mock']) state.setPermission(scope, true);
  return state;
}

test('the catalogue is absent until a known drawn source is warmed', () => {
  const cache = new DrawnCassetteCache();
  const state = stateWithConsent();
  assert.equal(cache.snapshot.loaded, false);
  assert.equal(cache.read('drawn-hair', state.snapshot, true).status, 'invalid-source');
  assert.equal(cache.warm(state.snapshot, false), false);
  assert.equal(cache.snapshot.keys.length, 0);
  assert.equal(cache.warm(state.snapshot, true), true);
  assert.equal(cache.snapshot.keys.length, 3);
  state.dispose();
});

test('cache replay uses only local metadata and zero provider units', () => {
  const cache = new DrawnCassetteCache();
  const state = stateWithConsent();
  cache.warm(state.snapshot, true);
  for (const card of CASSETTE_CARDS) {
    const result = cache.read(card.id, state.snapshot, true);
    assert.equal(result.status, 'ready');
    assert.equal(result.card, card);
    assert.equal(result.isCached, true);
    assert.equal(result.providerCalls, 0);
    assert.equal(result.unitsSpent, 0);
    assert.equal(result.imageSent, false);
    assert.equal(result.liveVerified, false);
  }
  assert.equal(cache.snapshot.hits, 3);
  assert.equal(cache.snapshot.networkRequests, 0);
  assert.equal(cache.snapshot.imageUploads, 0);
  state.dispose();
});

test('provider switched off still permits the cached drawn illustration', () => {
  const cache = new DrawnCassetteCache();
  const state = stateWithConsent();
  state.chooseMockMode('off');
  cache.warm(state.snapshot, true);
  const result = cache.read('drawn-skin', state.snapshot, true);
  assert.equal(result.status, 'ready');
  assert.equal(result.providerMode, 'off');
  assert.equal(result.providerCalls, 0);
  assert.equal(result.unitsSpent, 0);
  state.dispose();
});

test('permission withdrawal refuses future reads, even while data was cached', () => {
  const state = stateWithConsent();
  const cache = new DrawnCassetteCache();
  cache.warm(state.snapshot, true);
  state.setPermission('mock', false);
  assert.equal(cache.read('drawn-hair', state.snapshot, true).status, 'consent-required');
  assert.equal(cache.snapshot.hits, 0);
  assert.equal(cache.snapshot.misses, 1);
  state.dispose();
});

test('face consent cannot borrow hair consent or vice versa', () => {
  const state = stateWithConsent();
  const cache = new DrawnCassetteCache();
  cache.warm(state.snapshot, true);
  state.setPermission('hair', false);
  assert.equal(cache.peek('drawn-hair', state.snapshot, true), 'consent-required');
  assert.equal(cache.peek('drawn-makeup', state.snapshot, true), 'ready');
  state.setPermission('hair', true);
  state.setPermission('face', false);
  assert.equal(cache.peek('drawn-hair', state.snapshot, true), 'ready');
  assert.equal(cache.peek('drawn-makeup', state.snapshot, true), 'consent-required');
  assert.equal(cache.peek('drawn-skin', state.snapshot, true), 'consent-required');
  state.dispose();
});

test('identity lock cannot be switched off while a cached result is replayed', () => {
  const state = stateWithConsent();
  const cache = new DrawnCassetteCache();
  cache.warm(state.snapshot, true);
  state.setIdentityLock(false);
  assert.equal(cache.peek('drawn-hair', state.snapshot, true), 'identity-lock-required');
  assert.equal(cache.peek('drawn-makeup', state.snapshot, true), 'identity-lock-required');
  assert.equal(cache.snapshot.networkRequests, 0);
  state.dispose();
});

test('a new selected person invalidates every previous subject-bound cache entry', () => {
  const state = stateWithConsent();
  const cache = new DrawnCassetteCache();
  cache.warm(state.snapshot, true);
  assert.equal(cache.peek('drawn-hair', state.snapshot, true), 'ready');
  state.selectSubject('drawn-second', true);
  assert.equal(cache.peek('drawn-hair', state.snapshot, true), 'invalid-source');
  assert.equal(cache.peek('drawn-makeup', state.snapshot, true), 'invalid-source');
  assert.equal(cache.read('drawn-skin', state.snapshot, true).isCached, false);
  cache.warm(state.snapshot, true);
  assert.equal(cache.peek('drawn-skin', state.snapshot, true), 'ready');
  state.dispose();
});

test('a replaced image revision cannot reuse prior entries', () => {
  const state = stateWithConsent();
  const cache = new DrawnCassetteCache();
  cache.warm(state.snapshot, true);
  state.chooseDrawnSource(31, 2, 'drawn-main');
  assert.equal(cache.peek('drawn-hair', state.snapshot, true), 'invalid-source');
  assert.equal(cache.read('drawn-hair', state.snapshot, true).status, 'invalid-source');
  state.dispose();
});

test('missing entry refuses without live fallback and keeps counters truthful', () => {
  const state = stateWithConsent();
  const cache = new DrawnCassetteCache();
  assert.equal(cache.warm(state.snapshot, true), true);
  cache.reset();
  assert.equal(cache.snapshot.loaded, false);
  assert.equal(cache.peek('drawn-hair', state.snapshot, true), 'invalid-source');
  assert.equal(cache.snapshot.hits, 0);
  assert.equal(cache.snapshot.networkRequests, 0);
  state.dispose();
});

test('invalid input and closed cache cannot become a provider operation', () => {
  const cache = new DrawnCassetteCache();
  const state = stateWithConsent();
  cache.warm(state.snapshot, true);
  assert.equal(cache.read('unknown', state.snapshot, true), null);
  cache.dispose();
  assert.equal(cache.warm(state.snapshot, true), false);
  assert.equal(cache.read('drawn-hair', state.snapshot, true), null);
  assert.equal(cache.peek('drawn-hair', state.snapshot, true), 'disposed');
  assert.equal(cache.snapshot.keys.length, 0);
  state.dispose();
});

test('all cassette snapshots report zero image and provider traffic', () => {
  const cache = new DrawnCassetteCache();
  const state = stateWithConsent();
  for (let i = 0; i < 10; i += 1) {
    cache.warm(state.snapshot, true);
    cache.read('drawn-hair', state.snapshot, true);
    assert.equal(cache.snapshot.networkRequests, 0);
    assert.equal(cache.snapshot.imageUploads, 0);
    assert.equal(cache.snapshot.providerUnits, 0);
  }
  state.dispose();
});
