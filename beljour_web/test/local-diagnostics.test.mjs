// No user payload is accepted by the local diagnostic recorder. Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LocalDiagnostics } from '../dist/js/diagnostics/errors.js';

test('bounded diagnostics retain newest fixed codes and return copies', () => {
  const log = new LocalDiagnostics(3);
  for (let i = 0; i < 8; i++) log.record('render_refused', 'editor', i + .8);
  assert.deepEqual(log.snapshot().map(row => row.sequence), [6, 7, 8]);
  assert.deepEqual(log.snapshot().map(row => row.durationMs), [6, 7, 8]);
  const copy = log.snapshot(); copy[0].code = 'secret'; assert.equal(log.snapshot()[0].code, 'render_refused');
  log.clear(); assert.deepEqual(log.snapshot(), []);
});
test('untrusted strings, nonfinite durations and arbitrary objects are never serialized', () => {
  const log = new LocalDiagnostics();
  assert.equal(log.record('https://private/photo', 'editor'), false);
  assert.equal(log.record('script_error', 'person@example.test'), false);
  const hostile = { get toString() { throw new Error('must not inspect'); } };
  assert.equal(log.record(hostile, hostile, hostile), false);
  for (const value of [NaN, Infinity, -1, hostile]) log.record('script_error', 'application', value);
  assert.ok(log.snapshot().every(row => !('durationMs' in row)));
  log.record('script_error', 'application', 999999); assert.equal(log.snapshot().at(-1).durationMs, 60000);
  assert.doesNotMatch(log.exportText(), /private|example|stack|filename|message|image/);
});
test('error listeners ignore every event field and detach idempotently', () => {
  const events = new Map(), log = new LocalDiagnostics();
  const target = { addEventListener(type, listener) { events.set(type, listener); }, removeEventListener(type, listener) { assert.equal(events.get(type), listener); events.delete(type); } };
  const stop = log.listen(target);
  const payload = new Proxy({}, { get() { throw new Error('reading event payload leaks information'); } });
  events.get('error')(payload); events.get('unhandledrejection')(payload);
  assert.deepEqual(log.snapshot().map(row => row.code), ['script_error', 'unhandled_rejection']);
  stop(); stop(); assert.equal(events.size, 0);
});
test('diagnostic subscriptions cannot break rendering and do not survive teardown', () => {
  const log = new LocalDiagnostics(); let calls = 0;
  log.subscribe(() => { throw new Error('optional panel'); });
  const stop = log.subscribe(() => calls++); log.record('context_lost', 'gpu'); assert.equal(calls, 1);
  stop(); log.clear(); assert.equal(calls, 1);
  for (const capacity of [0, 101, 2.5, NaN]) assert.throws(() => new LocalDiagnostics(capacity), RangeError);
});
test('recording and exporting never invoke a network transport or persist a dump', () => {
  const previous = globalThis.fetch; let calls = 0;
  globalThis.fetch = () => { calls++; throw new Error('no network'); };
  try { const log = new LocalDiagnostics(); log.record('storage_denied', 'storage'); assert.match(log.exportText(), /this page only/); }
  finally { globalThis.fetch = previous; }
  assert.equal(calls, 0);
});
