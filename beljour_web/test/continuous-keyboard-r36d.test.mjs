/** Only scoped, non-printable shortcuts may affect the local demo. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ContinuousKeyboardSession, editableKeyboardTarget, keyboardDecision } from
  '../dist/js/layout/continuous/keyboard-session.js';
import { ContinuousFocusSession } from
  '../dist/js/layout/continuous/focus-session.js';

function gesture(key, options = {}) {
  let prevented = 0;
  return {
    key, ...options,
    preventDefault() { prevented += 1; },
    get preventionCount() { return prevented; },
  };
}

function fixture() {
  const listeners = new Map();
  const target = {
    addEventListener(type, fn) {
      const found = listeners.get(type) ?? new Set();
      found.add(fn);
      listeners.set(type, found);
    },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
  };
  let changed = 0;
  let exited = 0;
  const focus = new ContinuousFocusSession();
  const session = new ContinuousKeyboardSession(target, {
    changed: () => { changed += 1; },
    exit: () => { exited += 1; },
  }, focus);
  const fire = event => {
    for (const fn of [...(listeners.get('keydown') ?? [])]) fn(event);
    return event;
  };
  return {
    fire, session, focus, target,
    get changed() { return changed; },
    get exited() { return exited; },
    get listenerCount() { return listeners.get('keydown')?.size ?? 0; },
  };
}

test('F1 opens help, another F1 closes help without exiting', () => {
  const p = fixture();
  try {
    assert.equal(p.session.helpOpen, false);
    assert.equal(p.fire(gesture('F1')).preventionCount, 1);
    assert.equal(p.session.helpOpen, true);
    assert.equal(p.changed, 1);
    assert.equal(p.fire(gesture('F1')).preventionCount, 1);
    assert.equal(p.session.helpOpen, false);
    assert.equal(p.changed, 2);
    assert.equal(p.exited, 0);
  } finally { p.session.dispose(); }
});

test('Escape first closes help; a second Escape leaves the demonstration', () => {
  const p = fixture();
  try {
    p.fire(gesture('F1'));
    assert.equal(p.session.helpOpen, true);
    p.fire(gesture('Escape'));
    assert.equal(p.session.helpOpen, false);
    assert.equal(p.exited, 0);
    p.fire(gesture('Escape'));
    assert.equal(p.exited, 1);
    assert.equal(p.changed, 2);
  } finally { p.session.dispose(); }
});

test('Escape without an open helper calls the named exit action', () => {
  const p = fixture();
  try {
    assert.equal(p.fire(gesture('Escape')).preventionCount, 1);
    assert.equal(p.exited, 1);
  } finally { p.session.dispose(); }
});

test('native input, select, textarea and contenteditable targets keep F1 and Escape', () => {
  const p = fixture();
  try {
    const targets = [
      { tagName: 'INPUT' }, { tagName: 'SELECT' },
      { tagName: 'TEXTAREA' }, { tagName: 'DIV', isContentEditable: true },
    ];
    for (const target of targets) {
      for (const key of ['Escape', 'F1']) {
        const event = gesture(key, { target });
        p.fire(event);
        assert.equal(event.preventionCount, 0);
      }
    }
    assert.equal(p.exited, 0);
    assert.equal(p.changed, 0);
  } finally { p.session.dispose(); }
});

test('typing a question mark, number or arrow is never overridden', () => {
  const p = fixture();
  try {
    for (const key of ['?', '1', '5', 'ArrowLeft', 'ArrowRight', ' ', 'Enter', 'Tab']) {
      const event = gesture(key);
      p.fire(event);
      assert.equal(event.preventionCount, 0);
    }
    assert.equal(p.exited, 0);
    assert.equal(p.changed, 0);
  } finally { p.session.dispose(); }
});

test('key modifiers and already prevented events never trigger a shortcut', () => {
  const p = fixture();
  try {
    for (const flag of ['altKey', 'ctrlKey', 'shiftKey', 'metaKey', 'defaultPrevented']) {
      for (const key of ['F1', 'Escape']) {
        const event = gesture(key, { [flag]: true });
        p.fire(event);
        assert.equal(event.preventionCount, 0);
      }
    }
    assert.equal(p.exited, 0);
    assert.equal(p.changed, 0);
  } finally { p.session.dispose(); }
});

test('event routing is pure and never reads keyboard character content', () => {
  assert.equal(keyboardDecision(gesture('F1')), 'help');
  assert.equal(keyboardDecision(gesture('Escape')), 'exit');
  assert.equal(keyboardDecision(gesture('a')), null);
  assert.equal(keyboardDecision(gesture('ArrowDown')), null);
  assert.equal(keyboardDecision(gesture('F2')), null);
  assert.equal(keyboardDecision(gesture('Control')), null);
});

test('editable checks handle null and a decorative source safely', () => {
  assert.equal(editableKeyboardTarget(null), false);
  assert.equal(editableKeyboardTarget(undefined), false);
  assert.equal(editableKeyboardTarget({}), false);
  assert.equal(editableKeyboardTarget({ tagName: 'DIV' }), false);
  assert.equal(editableKeyboardTarget({ tagName: 'input' }), true);
  assert.equal(editableKeyboardTarget({ tagName: 'TEXTAREA' }), true);
});

test('disposal removes the one listener and prohibits any future callbacks', () => {
  const p = fixture();
  assert.equal(p.listenerCount, 1);
  p.session.dispose();
  assert.equal(p.listenerCount, 0);
  p.fire(gesture('F1'));
  assert.equal(p.changed, 0);
  assert.equal(p.exited, 0);
  p.session.toggleHelp();
  p.session.closeHelp();
  assert.equal(p.session.helpOpen, false);
  p.session.dispose();
});

test('help state never persists into another independent session', () => {
  const first = fixture();
  first.fire(gesture('F1'));
  assert.equal(first.session.helpOpen, true);
  first.session.dispose();
  const second = fixture();
  try {
    assert.equal(second.session.helpOpen, false);
    assert.equal(second.changed, 0);
  } finally { second.session.dispose(); }
});

test('each toggled help update requests focus on its same control action', () => {
  const p = fixture();
  try {
    p.session.toggleHelp();
    const remembered = p.focus;
    const called = [];
    const root = { querySelectorAll: () => [{
      tagName: 'BUTTON', dataset: { tourAction: 'keyboard-help' },
      focus: () => called.push('toggle'), getAttribute: () => null,
    }] };
    remembered.restore(root, 'hair', { focus: () => called.push('heading') });
    assert.deepEqual(called, ['toggle']);
  } finally { p.session.dispose(); }
});
