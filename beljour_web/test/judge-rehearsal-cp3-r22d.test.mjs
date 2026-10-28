// Lane D r22d-cp3: bounded, pausable judge timing with no telemetry.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  JUDGE_TARGET_MS,
  JudgeRehearsal,
  formatRehearsalTime,
  observeRehearsalVisibility,
  rehearsalBudgetLabel,
} from '../dist/js/layout/judge-rehearsal.js';
import { clockHarness, eventSource } from './judge-fixtures-cp3-r22d.mjs';

test('target is exactly three minutes, not a fabricated measured duration', () => {
  assert.equal(JUDGE_TARGET_MS, 180_000);
  assert.equal(formatRehearsalTime(JUDGE_TARGET_MS), '3:00');
});

test('formatting clamps negative inputs and keeps padded seconds', () => {
  assert.equal(formatRehearsalTime(-400), '0:00');
  assert.equal(formatRehearsalTime(500), '0:00');
  assert.equal(formatRehearsalTime(999), '0:00');
  assert.equal(formatRehearsalTime(1000), '0:01');
  assert.equal(formatRehearsalTime(59000), '0:59');
  assert.equal(formatRehearsalTime(60000), '1:00');
  assert.equal(formatRehearsalTime(63000), '1:03');
  assert.equal(formatRehearsalTime(12 * 60000), '12:00');
});

test('formatting cannot expose NaN, infinity or giant number strings', () => {
  assert.equal(formatRehearsalTime(NaN), '0:00');
  assert.equal(formatRehearsalTime(Infinity), '0:00');
  assert.equal(formatRehearsalTime(-Infinity), '0:00');
  assert.equal(formatRehearsalTime(86400 * 1000 * 100), '1440:00');
});

test('budget speaks in remaining or past, not in a pass/fail claim', () => {
  assert.match(rehearsalBudgetLabel(1), /2:59.*remaining/);
  assert.match(rehearsalBudgetLabel(180_000), /0:00.*remaining/);
  assert.match(rehearsalBudgetLabel(181_000), /0:01.*past/);
  assert.equal(rehearsalBudgetLabel(NaN), 'Timing unavailable');
  assert.equal(rehearsalBudgetLabel(-1), 'Timing unavailable');
  assert.equal(rehearsalBudgetLabel(4, 0), 'No timing target set');
});

test('rehearsal starts in zero state and advances only from injected clock', () => {
  const clock = clockHarness();
  const timer = new JudgeRehearsal(clock.port);
  assert.equal(timer.snapshot().hasStarted, false);
  assert.equal(timer.snapshot().display, '0:00');
  assert.equal(timer.start(), true);
  assert.equal(timer.start(), false);
  clock.advance(72_000);
  const snapshot = timer.snapshot();
  assert.equal(snapshot.elapsedMs, 72_000);
  assert.equal(snapshot.display, '1:12');
  assert.equal(snapshot.running, true);
  assert.equal(snapshot.withinTarget, true);
});

test('pause excludes hidden time and resumes without resetting the clock', () => {
  const clock = clockHarness(9000);
  const timer = new JudgeRehearsal(clock.port);
  timer.start();
  clock.advance(20_000);
  assert.equal(timer.pause(), true);
  clock.advance(55_000);
  assert.equal(timer.elapsedMs(), 20_000);
  assert.equal(timer.pause(), false);
  assert.equal(timer.resume(), true);
  clock.advance(21_000);
  assert.equal(timer.elapsedMs(), 41_000);
  assert.equal(timer.snapshot().display, '0:41');
});

test('stop is idempotent and a stopped session cannot quietly restart', () => {
  const clock = clockHarness();
  const timer = new JudgeRehearsal(clock.port);
  timer.start();
  clock.advance(123_000);
  assert.equal(timer.stop(), 123_000);
  clock.advance(10_000);
  assert.equal(timer.stop(), 123_000);
  assert.equal(timer.start(), false);
  assert.equal(timer.resume(), false);
  assert.equal(timer.elapsedMs(), 123_000);
});

test('unstarted stop is a safe, zero-duration no-op', () => {
  const timer = new JudgeRehearsal(clockHarness().port);
  assert.equal(timer.stop(), 0);
  assert.equal(timer.snapshot().hasStarted, false);
});

test('backward clock does not create negative or decreasing elapsed time', () => {
  const clock = clockHarness(10000);
  const timer = new JudgeRehearsal(clock.port);
  timer.start();
  clock.advance(6000);
  const initial = timer.elapsedMs();
  clock.rewind(4000);
  assert.equal(timer.elapsedMs(), initial);
  clock.advance(5000);
  assert.equal(timer.elapsedMs(), 7000);
});

test('nonfinite and throwing clock values do not contaminate the display', () => {
  let now = 900;
  let throwing = false;
  const timer = new JudgeRehearsal({ now: () => {
    if (throwing) throw new Error('clock unavailable');
    return now;
  } });
  timer.start();
  now = Number.NaN;
  assert.equal(timer.elapsedMs(), 0);
  throwing = true;
  assert.equal(timer.snapshot().display, '0:00');
  throwing = false;
  now = 5900;
  assert.equal(timer.elapsedMs(), 5000);
});

test('reset clears run state without keeping historical timings', () => {
  const clock = clockHarness();
  const timer = new JudgeRehearsal(clock.port);
  timer.start();
  clock.advance(200000);
  assert.equal(timer.snapshot().withinTarget, false);
  timer.reset();
  assert.equal(timer.snapshot().elapsedMs, 0);
  assert.equal(timer.snapshot().running, false);
  assert.equal(timer.snapshot().hasStarted, false);
  assert.equal(timer.start(), true);
});

test('visibility observer pauses and resumes, then removes its sole listener', () => {
  const source = eventSource();
  source.hidden = false;
  const clock = clockHarness();
  const timer = new JudgeRehearsal(clock.port);
  timer.start();
  const detach = observeRehearsalVisibility(timer, source);
  assert.equal(source.count('visibilitychange'), 1);
  clock.advance(45000);
  source.hidden = true;
  source.fire('visibilitychange');
  clock.advance(200000);
  assert.equal(timer.elapsedMs(), 45000);
  source.hidden = false;
  source.fire('visibilitychange');
  clock.advance(5000);
  assert.equal(timer.elapsedMs(), 50000);
  detach();
  assert.equal(source.count('visibilitychange'), 0);
});

test('already-hidden document pauses immediately instead of accumulating seconds', () => {
  const source = eventSource();
  source.hidden = true;
  const clock = clockHarness();
  const timer = new JudgeRehearsal(clock.port);
  timer.start();
  const detach = observeRehearsalVisibility(timer, source);
  clock.advance(80000);
  assert.equal(timer.elapsedMs(), 0);
  detach();
});
