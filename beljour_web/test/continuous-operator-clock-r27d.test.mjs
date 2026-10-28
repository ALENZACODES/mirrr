import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  OPERATOR_TARGET_MS,
  OperatorClock,
  checkedClockTime,
  operatorClockCaption,
} from '../dist/js/layout/continuous/operator-timer.js';

function fakeClock() {
  let time = 100;
  return {
    now: () => time,
    advance: (ms) => { time += ms; },
    rewind: (ms) => { time -= ms; },
  };
}

test('three minute budget starts idle and advances in foreground only', () => {
  const source = fakeClock();
  const clock = new OperatorClock(source.now);
  assert.equal(OPERATOR_TARGET_MS, 180000);
  assert.equal(clock.snapshot().status, 'idle');
  assert.equal(clock.snapshot().activeMs, 0);
  clock.start();
  source.advance(23450);
  assert.equal(clock.snapshot().activeMs, 23450);
  assert.equal(clock.snapshot().remainingMs, 156550);
  assert.equal(clock.snapshot().percent, 13);
  assert.equal(clock.snapshot().exceeded, false);
  clock.dispose();
});

test('paused time is excluded, wall time is retained, and pause is idempotent', () => {
  const source = fakeClock();
  const clock = new OperatorClock(source.now);
  clock.start();
  source.advance(30000);
  assert.equal(clock.pause(), true);
  assert.equal(clock.pause(), false);
  source.advance(90000);
  assert.equal(clock.snapshot().activeMs, 30000);
  assert.equal(clock.snapshot().wallMs, 120000);
  assert.equal(clock.resume(), true);
  assert.equal(clock.resume(), false);
  source.advance(150000);
  assert.equal(clock.snapshot().activeMs, 180000);
  assert.equal(clock.snapshot().exceeded, false);
  source.advance(1);
  assert.equal(clock.snapshot().exceeded, true);
  clock.stop();
  source.advance(100000);
  assert.equal(clock.snapshot().activeMs, 180001);
  assert.equal(clock.snapshot().wallMs, 270001);
  assert.equal(clock.snapshot().status, 'stopped');
});

test('repeated starts and a backward clock are refused', () => {
  const source = fakeClock();
  const clock = new OperatorClock(source.now);
  clock.start();
  assert.throws(() => clock.start(), /already started/);
  source.advance(2);
  clock.snapshot();
  source.rewind(3);
  assert.throws(() => clock.snapshot(), /backward/);
});

test('reset discards the earlier timing ticket', () => {
  const source = fakeClock();
  const clock = new OperatorClock(source.now);
  clock.start();
  source.advance(29000);
  clock.reset();
  assert.equal(clock.snapshot().activeMs, 0);
  assert.equal(clock.snapshot().wallMs, 0);
  assert.equal(clock.snapshot().status, 'idle');
  clock.start();
  source.advance(5);
  assert.equal(clock.snapshot().activeMs, 5);
  clock.dispose();
  assert.throws(() => clock.snapshot(), /closed/);
});

test('clock readings are bounded and reject invalid values', () => {
  for (const value of [-1, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => checkedClockTime(value), RangeError);
  }
  assert.equal(checkedClockTime(0), 0);
  assert.equal(checkedClockTime(2500), 2500);
});

test('clock captions explicitly separate rehearsal timing from device measurement', () => {
  const source = fakeClock();
  const clock = new OperatorClock(source.now);
  assert.match(operatorClockCaption(clock.snapshot()), /not started/);
  clock.start();
  source.advance(230);
  assert.match(operatorClockCaption(clock.snapshot()), /0\.2s active/);
  assert.match(operatorClockCaption(clock.snapshot()), /Actual device performance is separate/);
  source.advance(180000);
  assert.match(operatorClockCaption(clock.snapshot()), /Target exceeded/);
});
