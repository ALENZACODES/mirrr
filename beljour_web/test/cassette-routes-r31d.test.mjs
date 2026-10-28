/** No-network navigation to provider-aware entry points. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CASSETTE_CARDS } from '../dist/js/layout/continuous/cassette-contract.js';
import { safeProviderRoute } from '../dist/js/layout/continuous/cassette-routes.js';
import { ContinuousDemoState } from '../dist/js/layout/continuous/state.js';

const disabled = { providerScreensEnabled: false, acknowledgementRequired: true };
const enabled = { providerScreensEnabled: true, acknowledgementRequired: true };

function prepared() {
  const state = new ContinuousDemoState();
  state.chooseDrawnSource(9, 2, 'drawn-main');
  for (const scope of ['local', 'hair', 'face', 'mock']) state.setPermission(scope, true);
  return state;
}

test('a disabled feature flag hides all provider-aware destinations', () => {
  const state = prepared();
  for (const card of CASSETTE_CARDS) {
    const link = safeProviderRoute(card, state.snapshot, disabled, true);
    assert.equal(link.available, false);
    assert.equal(link.href, null);
    assert.match(link.explanation, /feature flag/);
  }
  state.dispose();
});

test('the feature flag alone never opens a provider screen', () => {
  const state = prepared();
  for (const card of CASSETTE_CARDS) {
    const link = safeProviderRoute(card, state.snapshot, enabled, false);
    assert.equal(link.available, false);
    assert.equal(link.href, null);
    assert.match(link.explanation, /own consent/);
  }
  state.dispose();
});

test('no permission means no link even when the separate-page acknowledgement is set', () => {
  const state = prepared();
  state.setPermission('mock', false);
  for (const card of CASSETTE_CARDS) {
    const link = safeProviderRoute(card, state.snapshot, enabled, true);
    assert.equal(link.available, false);
    assert.equal(link.href, null);
  }
  state.dispose();
});

test('the explicitly confirmed link can only reach a fixed local HTML page', () => {
  const state = prepared();
  for (const card of CASSETTE_CARDS) {
    const link = safeProviderRoute(card, state.snapshot, enabled, true);
    assert.equal(link.available, true);
    assert.match(link.href, /^[a-z][\w-]*\.html(?:#[\w=/.-]+)?$/);
    assert.doesNotMatch(link.href, /https?:|\.\.|\/\/|\?|photo=|token=/i);
    assert.equal(link.startsProviderTask, false);
    assert.equal(link.carriesPhoto, false);
    assert.equal(link.carriesConsent, false);
    assert.match(link.explanation, /separate page/);
  }
  state.dispose();
});

test('turning identity lock off prevents entering any public provider-aware route', () => {
  const state = prepared();
  state.setIdentityLock(false);
  for (const card of CASSETTE_CARDS) {
    assert.equal(safeProviderRoute(card, state.snapshot, enabled, true).available, false);
  }
  state.dispose();
});

test('no route transmits local mock permission, chosen person or a generated source', () => {
  const state = prepared();
  state.selectSubject('drawn-second', true);
  for (const card of CASSETTE_CARDS) {
    const link = safeProviderRoute(card, state.snapshot, enabled, true);
    assert.doesNotMatch(link.href ?? '', /drawn|source|consent|hash|sample/i);
    assert.deepEqual([link.carriesPhoto, link.carriesConsent, link.startsProviderTask],
      [false, false, false]);
  }
  state.dispose();
});

test('all routes remain disabled with no dedicated public capability', () => {
  const state = prepared();
  const noCapability = { ...disabled, providerScreensEnabled: undefined };
  for (const card of CASSETTE_CARDS) {
    assert.equal(safeProviderRoute(card, state.snapshot, noCapability, true).available, false);
  }
  state.dispose();
});
