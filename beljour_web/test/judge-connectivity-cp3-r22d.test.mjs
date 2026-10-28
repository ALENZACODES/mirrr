// Lane D r22d-cp3: offline is local-only, never an invented provider state.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  judgeConnectionState,
  observeJudgeConnection,
  readJudgeOnline,
} from '../dist/js/mobile/judge-connectivity.js';
import { eventSource } from './judge-fixtures-cp3-r22d.mjs';

test('offline message explains local demo availability without a provider claim', () => {
  const state = judgeConnectionState(false);
  assert.equal(state.online, false);
  assert.equal(state.localDemoAvailable, true);
  assert.equal(state.liveProviderAvailable, 'not-checked');
  assert.match(state.message, /Offline/);
  assert.match(state.message, /local illustration/);
});

test('online does not mean the live provider has been contacted or validated', () => {
  const state = judgeConnectionState(true);
  assert.equal(state.online, true);
  assert.equal(state.liveProviderAvailable, 'not-checked');
  assert.match(state.message, /not tested/);
});

test('unknown browser status remains a safe, local-only explanation', () => {
  const state = judgeConnectionState(null);
  assert.equal(state.online, null);
  assert.equal(state.liveProviderAvailable, 'not-checked');
  assert.match(state.message, /status unavailable/);
});

test('browser navigator not reporting onLine is unknown, not assumed online', () => {
  assert.equal(readJudgeOnline(eventSource()), null);
  assert.equal(readJudgeOnline({ navigator: { onLine: 1 } }), null);
  assert.equal(readJudgeOnline({ navigator: { onLine: true } }), true);
  assert.equal(readJudgeOnline({ navigator: { onLine: false } }), false);
});

test('connectivity observer emits initial state then updates on offline and online', () => {
  const source = eventSource();
  source.navigator = { onLine: true };
  const states = [];
  const stop = observeJudgeConnection(source, (value) => states.push(value));
  assert.equal(source.count('online'), 1);
  assert.equal(source.count('offline'), 1);
  assert.deepEqual(states.map(row => row.online), [true]);
  source.navigator.onLine = false;
  source.fire('offline');
  assert.deepEqual(states.map(row => row.online), [true, false]);
  source.navigator.onLine = true;
  source.fire('online');
  assert.deepEqual(states.map(row => row.online), [true, false, true]);
  stop();
});

test('listener cleanup prevents stale callback after route exit or page hide', () => {
  const source = eventSource();
  source.navigator = { onLine: true };
  const states = [];
  const stop = observeJudgeConnection(source, state => states.push(state));
  stop();
  stop();
  assert.equal(source.count('online'), 0);
  assert.equal(source.count('offline'), 0);
  source.fire('offline');
  assert.equal(states.length, 1);
});

test('local connection states contain no personal or private image information', () => {
  for (const connected of [true, false, null]) {
    const state = judgeConnectionState(connected);
    const text = JSON.stringify(state);
    assert.doesNotMatch(text, /data:image|photo bytes|skin score|verified provider/i);
    assert.match(text, /localDemoAvailable/);
  }
});
