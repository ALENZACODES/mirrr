// Usability 4.2: every strength slider shows its number with a word ("30 · Subtle")
// and gives one haptic tick when it crosses 33, 66 or 100. No device needed.
// Author: John Khan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { strengthLabel, crossedTicks, hapticTick, HAPTIC_TICKS } from '../dist/js/ui/shell/stops.js';

test('number and word together', () => {
  assert.equal(strengthLabel('enhance', 30), '30 · Subtle');
  assert.equal(strengthLabel('enhance', 0), '0 · Off');
  assert.equal(strengthLabel('enhance', 50), '50 · Natural');
  assert.equal(strengthLabel('enhance', 100), '100 · Full');
  assert.equal(strengthLabel('posture', 66.6), '67 · Normal');
  assert.match(strengthLabel('filters', 12.4), /^12 · /);
  assert.throws(() => strengthLabel('enhance', NaN), /finite/);
});

test('ticks at 33, 66 and 100 in either direction', () => {
  assert.deepEqual(HAPTIC_TICKS, [33, 66, 100]);
  assert.deepEqual(crossedTicks(30, 40), [33]);
  assert.deepEqual(crossedTicks(0, 100), [33, 66, 100]);
  assert.deepEqual(crossedTicks(70, 60), [66]);
  assert.deepEqual(crossedTicks(33, 34), []);
  assert.deepEqual(crossedTicks(40, 40), []);
});

test('vibrates once per crossing where supported, never throws without support', () => {
  const calls = [];
  const device = { vibrate: (ms) => { calls.push(ms); return true; } };
  assert.equal(hapticTick(10, 50, device), true);
  assert.equal(hapticTick(50, 55, device), false);
  assert.deepEqual(calls, [10]);
  assert.equal(hapticTick(10, 50, {}), false);
  assert.equal(hapticTick(10, 50, undefined), false);
});
