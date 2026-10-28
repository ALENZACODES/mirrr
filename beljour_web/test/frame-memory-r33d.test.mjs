/** Bounded in-memory image cache, mutation and expiry. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LocalFrameMemory } from '../dist/js/layout/continuous/frame-memory.js';
import { pixels } from './helpers/local-frame-fixture.mjs';

function memory(opts = {}) {
  const clock = { now: 5000 };
  const cache = new LocalFrameMemory(() => clock.now, opts.budget, opts.ttl);
  return { clock, cache };
}

test('cache refuses unsafe memory size and lifetime', () => {
  for (const budget of [0, -1, 120000, 1048577, Infinity]) {
    assert.throws(() => new LocalFrameMemory(() => 0, budget));
  }
  for (const ttl of [0, 999, 180001, NaN]) {
    assert.throws(() => new LocalFrameMemory(() => 0, undefined, ttl));
  }
});

test('no frame can be stored without an active authority', () => {
  const { cache } = memory();
  assert.equal(cache.write('x', pixels()), false);
  assert.equal(cache.read('x', 'hair'), null);
  assert.equal(cache.misses, 1);
});

test('write and read do not share mutable typed arrays with caller', () => {
  const { cache } = memory();
  cache.useAuthority('first');
  const original = pixels();
  assert.equal(cache.write('first', original), true);
  original.rgba.fill(0);
  const one = cache.read('first', 'hair');
  assert.equal(one.rgba[0], 71);
  one.rgba.fill(9);
  assert.equal(cache.read('first', 'hair').rgba[0], 71);
  assert.equal(cache.hits, 2);
});

test('a changed authority discards earlier images and rejects stale reads', () => {
  const { cache } = memory();
  cache.useAuthority('one');
  cache.write('one', pixels());
  assert.equal(cache.size, 1);
  cache.useAuthority('two');
  assert.equal(cache.size, 0);
  assert.equal(cache.read('one', 'hair'), null);
  assert.equal(cache.write('one', pixels()), false);
});

test('expired entries cannot be resurrected through a previous read', () => {
  const { clock, cache } = memory({ ttl: 1000 });
  cache.useAuthority('expires');
  cache.write('expires', pixels());
  clock.now += 1000;
  assert.equal(cache.size, 0);
  assert.equal(cache.read('expires', 'hair'), null);
  assert.equal(cache.bytes, 0);
});

test('re-reading does not bypass expiry deadline', () => {
  const { clock, cache } = memory({ ttl: 1000 });
  cache.useAuthority('expires');
  cache.write('expires', pixels());
  clock.now += 999;
  assert.ok(cache.read('expires', 'hair'));
  clock.now += 1;
  assert.equal(cache.read('expires', 'hair'), null);
});

test('cache evicts LRU image when budget cannot fit all three', () => {
  const { cache } = memory({ budget: 256000 });
  cache.useAuthority('bounded');
  cache.write('bounded', pixels('hair', 11));
  cache.write('bounded', pixels('makeup', 22));
  assert.ok(cache.read('bounded', 'hair'));
  cache.write('bounded', pixels('skin', 33));
  assert.equal(cache.size, 2);
  assert.equal(cache.read('bounded', 'makeup'), null);
  assert.equal(cache.read('bounded', 'hair').rgba[0], 11);
});

test('replacing a frame does not double count memory', () => {
  const { cache } = memory();
  cache.useAuthority('replace');
  cache.write('replace', pixels('hair', 1));
  const bytes = cache.bytes;
  cache.write('replace', pixels('hair', 2));
  assert.equal(cache.bytes, bytes);
  assert.equal(cache.read('replace', 'hair').rgba[0], 2);
});

test('disposal prevents subsequent writes and removes all stored pixels', () => {
  const { cache } = memory();
  cache.useAuthority('discard');
  cache.write('discard', pixels());
  cache.dispose();
  assert.equal(cache.bytes, 0);
  assert.equal(cache.write('discard', pixels()), false);
  assert.equal(cache.read('discard', 'hair'), null);
  cache.dispose();
});

test('invalid clock or malformed frame cannot be used to store thumbnails', () => {
  const cache = new LocalFrameMemory(() => NaN);
  cache.useAuthority('x');
  assert.throws(() => cache.write('x', pixels()));
  const { cache: safe } = memory();
  safe.useAuthority('x');
  assert.equal(safe.write('x', { ...pixels(), width: 1 }), false);
  assert.equal(safe.size, 0);
});
