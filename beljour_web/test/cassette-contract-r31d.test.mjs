/** Drawn-only catalogue contract and consent boundaries. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CASSETTE_CARDS, cassetteAuthority, cassetteById, cassettePermission,
  checkedCassetteCard, statusCopy,
} from '../dist/js/layout/continuous/cassette-contract.js';
import { ContinuousDemoState } from '../dist/js/layout/continuous/state.js';

function prepared() {
  const state = new ContinuousDemoState();
  state.chooseDrawnSource(7, 2, 'drawn-main');
  state.setPermission('local', true);
  state.setPermission('hair', true);
  state.setPermission('face', true);
  state.setPermission('mock', true);
  return state;
}

test('only three authored, distinct, originally drawn examples are eligible', () => {
  assert.deepEqual(CASSETTE_CARDS.map(item => item.id),
    ['drawn-hair', 'drawn-makeup', 'drawn-skin']);
  assert.deepEqual(CASSETTE_CARDS.map(item => item.family),
    ['hair', 'makeup', 'skin']);
  assert.ok(CASSETTE_CARDS.every(item => Object.isFrozen(item)));
  assert.ok(CASSETTE_CARDS.every(item => item.scene === 'drawn-pair'));
  assert.ok(CASSETTE_CARDS.every(item => item.provenance === 'local-drawn'));
  assert.ok(CASSETTE_CARDS.every(item => item.label.includes('NOT A PROVIDER RESULT')));
});

test('no authored example contains an image, verified face claim or provider charge', () => {
  for (const card of CASSETTE_CARDS) {
    assert.equal(card.providerCalls, 0);
    assert.equal(card.unitsSpent, 0);
    assert.equal(card.containsPhoto, false);
    assert.equal(card.testedOnRealFaces, false);
    assert.ok(card.explanation.length > 20);
    assert.doesNotMatch(JSON.stringify(card), /https?:|data:image|base64,|access_token|api_key/i);
  }
});

test('every card is linked to a reviewed public route but never an invented SKU', () => {
  assert.deepEqual(CASSETTE_CARDS.map(item => item.route), ['hair', 'makeup', 'shade']);
  assert.deepEqual(CASSETTE_CARDS.map(item => item.relatedPermission), ['hair', 'face', 'face']);
  assert.ok(CASSETTE_CARDS.every(item => item.productType.length > 5));
  assert.ok(CASSETTE_CARDS.every(item => !Object.hasOwn(item, 'sku')));
  assert.ok(CASSETTE_CARDS.every(item => !Object.hasOwn(item, 'price')));
});

test('catalogue resolver refuses unknown, non-string and inherited ids', () => {
  assert.equal(cassetteById('drawn-hair'), CASSETTE_CARDS[0]);
  for (const input of ['hair', 'drawn-hair/../makeup', 'toString', '', null, {}, []]) {
    assert.equal(cassetteById(input), null);
  }
});

test('checked card requires the exact immutable authored record', () => {
  assert.equal(checkedCassetteCard({ ...CASSETTE_CARDS[0] }), CASSETTE_CARDS[0]);
  for (const modified of [
    { ...CASSETTE_CARDS[0], providerCalls: 1 },
    { ...CASSETTE_CARDS[0], unitsSpent: 1 },
    { ...CASSETTE_CARDS[0], testedOnRealFaces: true },
    { ...CASSETTE_CARDS[0], label: 'live verified' },
    { ...CASSETTE_CARDS[0], title: 'different name' },
    { ...CASSETTE_CARDS[0], cookie: 'private' },
  ]) {
    assert.throws(() => checkedCassetteCard(modified), /fields|entry/);
  }
  assert.throws(() => checkedCassetteCard(null), /Invalid/);
  assert.throws(() => checkedCassetteCard([]), /Invalid/);
});

test('a valid drawn authority consists only of the approved sample subject', () => {
  const state = prepared();
  assert.deepEqual(cassetteAuthority(state.snapshot), {
    sourceRevision: 7, subjectId: 'drawn-main', scene: 'drawn-pair',
  });
  state.selectSubject('drawn-second', true);
  assert.equal(cassetteAuthority(state.snapshot)?.subjectId, 'drawn-second');
  state.dispose();
});

test('an unselected, uploaded or invalid revision cannot become a drawn authority', () => {
  const state = prepared();
  const valid = state.snapshot;
  for (const modified of [
    { ...valid, selectedId: null },
    { ...valid, selectedId: 'some-uploaded-person' },
    { ...valid, sourceRevision: -1 },
    { ...valid, sourceRevision: 0 },
    { ...valid, sourceRevision: 1.5 },
    { ...valid, sourceLoaded: false },
  ]) {
    assert.equal(cassetteAuthority(modified), null);
  }
  state.dispose();
});

test('independent hair, face, local and mock consent are enforced', () => {
  const state = prepared();
  assert.ok(CASSETTE_CARDS.every(card => cassettePermission(state.snapshot, card) === 'ready'));
  state.setPermission('hair', false);
  assert.equal(cassettePermission(state.snapshot, CASSETTE_CARDS[0]), 'consent-required');
  assert.equal(cassettePermission(state.snapshot, CASSETTE_CARDS[1]), 'ready');
  state.setPermission('face', false);
  assert.equal(cassettePermission(state.snapshot, CASSETTE_CARDS[1]), 'consent-required');
  assert.equal(cassettePermission(state.snapshot, CASSETTE_CARDS[2]), 'consent-required');
  state.dispose();
});

test('removing local or mock consent blocks every cached example', () => {
  for (const scope of ['local', 'mock']) {
    const state = prepared();
    state.setPermission(scope, false);
    assert.ok(CASSETTE_CARDS.every(card => cassettePermission(state.snapshot, card) !== 'ready'));
    state.dispose();
  }
});

test('identity-lock refusal is separate from scope refusal', () => {
  const state = prepared();
  state.setIdentityLock(false);
  assert.equal(cassettePermission(state.snapshot, CASSETTE_CARDS[0]), 'identity-lock-required');
  assert.equal(cassettePermission(state.snapshot, CASSETTE_CARDS[1]), 'identity-lock-required');
  state.dispose();
});

test('all status captions are a bounded fixed vocabulary', () => {
  const codes = ['ready', 'no-source', 'consent-required', 'identity-lock-required',
    'invalid-source', 'cache-miss', 'disposed'];
  assert.equal(new Set(codes.map(statusCopy)).size, codes.length);
  for (const code of codes) {
    assert.ok(statusCopy(code).length > 15);
    assert.ok(statusCopy(code).length < 150);
  }
  assert.match(statusCopy('cache-miss'), /never falls back to a live request/);
});
