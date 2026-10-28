// Lane D r21d: no exception, stack trace, URL or photo reference reaches the UI.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { installDOM } from './helpers/dom.mjs';
import { ClientErrorState, mountErrorNotice } from '../dist/js/ui/shell/client-errors.js';

function makeEvents() {
  const map = new Map();
  return { map,
    addEventListener(name, fn) { const row = map.get(name) ?? new Set(); row.add(fn); map.set(name, row); },
    removeEventListener(name, fn) { map.get(name)?.delete(fn); },
    fire(name, event = {}) { for (const fn of [...(map.get(name) ?? [])]) fn(event); } };
}

test('error-state counts are bounded and dismiss never erases the page', () => {
  const state = new ClientErrorState();
  const updates = [];
  const off = state.subscribe(s => updates.push({ ...s }));
  assert.deepEqual(state.snapshot, { kind: 'view', count: 0, visible: false });
  state.show('view');
  state.show('unhandled');
  assert.equal(state.snapshot.count, 2);
  assert.equal(state.snapshot.kind, 'unhandled');
  state.dismiss();
  assert.equal(state.snapshot.visible, false);
  off();
  state.show('view');
  assert.equal(updates.length, 4);
  state.destroy();
  state.show('view');
  assert.equal(state.snapshot.count, 3);
});

test('unexpected errors display constant safe copy only and can be dismissed', async () => {
  const dom = installDOM();
  try {
    const events = makeEvents();
    let retries = 0;
    const notice = mountErrorNotice(dom.document, events, () => { retries++; });
    dom.root.append(notice.element);
    assert.equal(notice.element.hidden, true);
    const sensitive = {
      get message() { throw new Error('do not inspect'); },
      get stack() { throw new Error('do not inspect'); },
      get filename() { throw new Error('do not inspect'); },
    };
    events.fire('unhandledrejection', { reason: sensitive });
    assert.equal(notice.element.hidden, false);
    assert.equal(notice.state.snapshot.kind, 'unhandled');
    assert.doesNotMatch(notice.element.textContent, /do not inspect/);
    assert.match(notice.element.textContent, /The page encountered an error/);
    assert.equal(notice.element.querySelector('p').getAttribute('role'), 'alert');
    const buttons = notice.element.querySelectorAll('button');
    const retry = buttons.find(b => b.textContent === 'Try this view again');
    await retry.click();
    assert.equal(notice.element.hidden, true);
    assert.equal(retries, 1);
    notice.showViewError();
    assert.equal(notice.state.snapshot.kind, 'view');
    assert.match(notice.element.textContent, /photo and current edits have not been cleared/i);
    const dismiss = buttons.find(b => b.textContent === 'Dismiss message');
    await dismiss.click();
    assert.equal(notice.element.hidden, true);
    notice.destroy();
    assert.equal(events.map.get('unhandledrejection').size, 0);
    assert.equal(events.map.get('error').size, 0);
  } finally { dom.restore(); }
});

test('without a view retry, the error panel still has a route back Home', () => {
  const dom = installDOM();
  try {
    const events = makeEvents();
    const notice = mountErrorNotice(dom.document, events);
    assert.equal(notice.element.querySelector('button').hidden, true);
    assert.equal(notice.element.querySelector('a').href, 'home.html');
    notice.showViewError();
    assert.equal(notice.element.hidden, false);
    notice.destroy();
  } finally { dom.restore(); }
});
