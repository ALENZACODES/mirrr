/** Demonstration-only product categories with no checkout. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { OfflineSampleBag, checkedBagSnapshot } from '../dist/js/layout/continuous/cassette-bag.js';
import { DrawnCassetteCache } from '../dist/js/layout/continuous/cassette-cache.js';
import { ContinuousDemoState } from '../dist/js/layout/continuous/state.js';

function fixture() {
  const state = new ContinuousDemoState();
  state.chooseDrawnSource(4, 2, 'drawn-main');
  for (const scope of ['local', 'hair', 'face', 'mock']) state.setPermission(scope, true);
  const cache = new DrawnCassetteCache();
  cache.warm(state.snapshot, true);
  return { state, cache, bag: new OfflineSampleBag() };
}

test('empty demo bag has no charge, checkout, photo or payment capability', () => {
  const bag = new OfflineSampleBag();
  const snapshot = bag.snapshot;
  assert.equal(snapshot.format, 'beljour-sample-bag/1');
  assert.equal(snapshot.items.length, 0);
  assert.equal(snapshot.totalPrice, null);
  assert.equal(snapshot.hasCheckout, false);
  assert.equal(snapshot.hasPayment, false);
  assert.equal(snapshot.keepsPhotos, false);
});

test('only a ready cached illustration can be added', () => {
  const { state, cache, bag } = fixture();
  const result = cache.read('drawn-hair', state.snapshot, true);
  assert.equal(bag.add(result), true);
  assert.equal(bag.snapshot.items.length, 1);
  assert.equal(bag.snapshot.items[0].id, 'drawn-hair');
  assert.equal(bag.snapshot.items[0].priceKnown, false);
  state.dispose();
});

test('one example from each category may be added, but nothing is purchased', () => {
  const { state, cache, bag } = fixture();
  for (const id of ['drawn-hair', 'drawn-makeup', 'drawn-skin']) {
    assert.equal(bag.add(cache.read(id, state.snapshot, true)), true);
  }
  assert.deepEqual(bag.snapshot.items.map(item => item.id),
    ['drawn-hair', 'drawn-makeup', 'drawn-skin']);
  assert.equal(bag.snapshot.totalPrice, null);
  assert.equal(bag.snapshot.hasCheckout, false);
  state.dispose();
});

test('duplicate sample selection does not increase quantity or totals', () => {
  const { state, cache, bag } = fixture();
  const result = cache.read('drawn-hair', state.snapshot, true);
  for (let i = 0; i < 5; i += 1) assert.equal(bag.add(result), true);
  assert.equal(bag.snapshot.items.length, 1);
  assert.equal(bag.snapshot.items[0].purchaseAvailable, false);
  state.dispose();
});

test('a missing, refused or forged remote outcome cannot enter the demo bag', () => {
  const { state, cache, bag } = fixture();
  const ready = cache.read('drawn-hair', state.snapshot, true);
  assert.equal(bag.add(null), false);
  assert.equal(bag.add({ ...ready, providerCalls: 1 }), false);
  assert.equal(bag.add({ ...ready, unitsSpent: 1 }), false);
  assert.equal(bag.add({ ...ready, imageSent: true }), false);
  assert.equal(bag.add({ ...ready, status: 'consent-required' }), false);
  assert.equal(bag.add({ ...ready, isCached: false }), false);
  assert.equal(bag.snapshot.items.length, 0);
  state.dispose();
});

test('forged local card fields cannot enter a demonstration bag', () => {
  const { state, cache, bag } = fixture();
  const ready = cache.read('drawn-hair', state.snapshot, true);
  assert.equal(bag.add({ ...ready, card: { ...ready.card } }), false);
  assert.equal(bag.add({ ...ready, card: { ...ready.card, title: 'live provider' } }), false);
  assert.equal(bag.snapshot.items.length, 0);
  state.dispose();
});

test('a manually removed example does not disturb other categories', () => {
  const { state, cache, bag } = fixture();
  for (const id of ['drawn-hair', 'drawn-skin']) bag.add(cache.read(id, state.snapshot, true));
  bag.remove('drawn-hair');
  assert.deepEqual(bag.snapshot.items.map(item => item.id), ['drawn-skin']);
  state.dispose();
});

test('all bags can be cleared on permission withdrawal', () => {
  const { state, cache, bag } = fixture();
  bag.add(cache.read('drawn-skin', state.snapshot, true));
  bag.clear();
  assert.equal(bag.snapshot.items.length, 0);
  state.dispose();
});

test('closed demo bag refuses new additions', () => {
  const { state, cache, bag } = fixture();
  const ready = cache.read('drawn-hair', state.snapshot, true);
  bag.dispose();
  assert.equal(bag.add(ready), false);
  assert.equal(bag.snapshot.items.length, 0);
  state.dispose();
});

test('checked bag rejects fabricated prices, purchases and duplicates', () => {
  const { state, cache, bag } = fixture();
  bag.add(cache.read('drawn-hair', state.snapshot, true));
  const good = bag.snapshot;
  assert.equal(checkedBagSnapshot(good), good);
  for (const modified of [
    { ...good, totalPrice: 5.99 },
    { ...good, hasPayment: true },
    { ...good, hasCheckout: true },
    { ...good, keepsPhotos: true },
    { ...good, items: [...good.items, good.items[0]] },
    { ...good, items: [{ ...good.items[0], priceKnown: true }] },
    { ...good, items: [{ ...good.items[0], purchaseAvailable: true }] },
  ]) {
    assert.throws(() => checkedBagSnapshot(modified), /bag|item/);
  }
  state.dispose();
});
