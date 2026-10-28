// Lane D r21d: connection state is conservative, non-destructive and local.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Element, installDOM } from './helpers/dom.mjs';
import {
  ConnectionTracker, connectivityCopy, mountConnectionNotice,
} from '../dist/js/ui/shell/connectivity.js';

function promisePair() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}
function host(online = true) {
  const callbacks = new Map();
  return { navigator: { onLine: online }, callbacks,
    addEventListener(type, fn) { const list = callbacks.get(type) ?? new Set(); list.add(fn); callbacks.set(type, list); },
    removeEventListener(type, fn) { callbacks.get(type)?.delete(fn); },
    emit(type) { for (const fn of [...(callbacks.get(type) ?? [])]) fn({ type }); } };
}

test('connected, offline, retrying and unavailable copy makes no data-loss claim', () => {
  const states = [
    { kind: 'checking', online: true, busy: false },
    { kind: 'available', online: true, busy: false },
    { kind: 'offline', online: false, busy: false },
    { kind: 'unavailable', online: true, busy: false },
    { kind: 'unavailable', online: true, busy: true },
  ];
  for (const state of states) {
    const copy = connectivityCopy(state);
    assert.ok(copy.heading);
    assert.ok(copy.message);
    assert.doesNotMatch(copy.message, /lost your photo|deleted your edits|automatically sent/i);
  }
  assert.match(connectivityCopy(states[2]).message, /Your photo stays in this tab/);
  assert.equal(connectivityCopy(states[2]).retryLabel, null);
  assert.equal(connectivityCopy(states[3]).retryLabel, 'Check service again');
  assert.equal(connectivityCopy(states[4]).retryLabel, null);
});

test('online event never claims the server is available until a health check passes', () => {
  const tracker = new ConnectionTracker(false);
  assert.equal(tracker.snapshot.kind, 'offline');
  const seen = [];
  const unsubscribe = tracker.subscribe(s => seen.push({ ...s }));
  tracker.setOnline(true);
  assert.equal(tracker.snapshot.kind, 'checking');
  tracker.setService(false);
  assert.equal(tracker.snapshot.kind, 'unavailable');
  tracker.setService(true);
  assert.equal(tracker.snapshot.kind, 'available');
  tracker.setOnline(false);
  assert.equal(tracker.snapshot.kind, 'offline');
  tracker.setService(true);
  assert.equal(tracker.snapshot.kind, 'offline');
  unsubscribe();
  tracker.destroy();
  assert.deepEqual(seen.map(s => s.kind), ['offline', 'checking', 'unavailable', 'available', 'offline']);
});

test('an obsolete async health check cannot overwrite offline status', async () => {
  const tracker = new ConnectionTracker();
  const deferred = promisePair();
  const result = tracker.check(() => deferred.promise);
  assert.equal(tracker.snapshot.busy, true);
  const duplicate = await tracker.check(async () => true);
  assert.equal(duplicate.busy, true, 'duplicate retries do not overlap');
  tracker.setOnline(false);
  deferred.resolve(true);
  await result;
  assert.equal(tracker.snapshot.kind, 'offline');
  assert.equal(tracker.snapshot.busy, false);
  assert.equal(tracker.snapshot.online, false);
  tracker.destroy();
});

test('a rejected retry becomes an unavailable status without throwing', async () => {
  const tracker = new ConnectionTracker();
  assert.equal((await tracker.check(async () => { throw new Error('private detail'); })).kind, 'unavailable');
  assert.equal((await tracker.check(async () => true)).kind, 'available');
  tracker.destroy();
});

test('all changes after destroy are ignored, including promises resolved late', async () => {
  const tracker = new ConnectionTracker();
  const deferred = promisePair();
  const promise = tracker.check(() => deferred.promise);
  tracker.destroy();
  deferred.resolve(false);
  await promise;
  assert.equal(tracker.snapshot.busy, true, 'disposed state is not republished');
  tracker.setOnline(false);
  tracker.setService(false);
  assert.equal(tracker.snapshot.kind, 'checking');
});

test('status notice is polite and does not install an automatic upload/reload', async () => {
  const dom = installDOM();
  try {
    const browser = host(false);
    const notice = mountConnectionNotice(dom.document, browser);
    dom.root.append(notice.element);
    assert.equal(notice.tracker.snapshot.kind, 'offline');
    assert.equal(notice.element.hidden, false);
    assert.match(notice.element.textContent, /Connection appears offline/);
    assert.equal(notice.element.querySelector('p').getAttribute('aria-live'), 'polite');
    const retry = notice.element.querySelector('button');
    assert.equal(retry.hidden, true);
    browser.emit('online');
    assert.equal(notice.element.hidden, true, 'unchecked server not presented as a failure without health callback');
    browser.emit('offline');
    assert.equal(notice.element.hidden, false);
    notice.destroy();
    assert.equal(browser.callbacks.get('offline').size, 0);
    assert.equal(browser.callbacks.get('online').size, 0);
  } finally { dom.restore(); }
});

test('retry button asks only the injected health function to check service state', async () => {
  const dom = installDOM();
  try {
    const browser = host(true);
    let attempts = 0;
    const notice = mountConnectionNotice(dom.document, browser, async () => { attempts++; return attempts > 1; });
    dom.root.append(notice.element);
    const retry = notice.element.querySelector('button');
    assert.equal(retry.hidden, false);
    await retry.click();
    assert.equal(attempts, 1);
    assert.equal(notice.tracker.snapshot.kind, 'unavailable');
    assert.equal(retry.hidden, false);
    await retry.click();
    assert.equal(attempts, 2);
    assert.equal(notice.tracker.snapshot.kind, 'available');
    assert.equal(notice.element.hidden, true);
    notice.destroy();
  } finally { dom.restore(); }
});
