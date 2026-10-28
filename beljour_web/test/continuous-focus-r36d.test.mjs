/** Dynamic-focus regression checks. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ContinuousFocusSession, descendantOf, focusAction } from
  '../dist/js/layout/continuous/focus-session.js';
import { installDOM } from './helpers/dom.mjs';

function page() {
  const dom = installDOM();
  const root = dom.document.createElement('section');
  dom.root.append(root);
  let active = null;
  Object.defineProperty(dom.document, 'activeElement', { get: () => active });
  const heading = () => {
    const item = dom.document.createElement('h2');
    item.id = 'lg-cont-title';
    item.focus = () => { active = item; };
    return item;
  };
  const control = (action, tag = 'button') => {
    const item = dom.document.createElement(tag);
    item.dataset.tourAction = action;
    item.focus = () => { active = item; };
    return item;
  };
  const focus = item => { active = item; };
  return { ...dom, body: dom.root, root, heading, control, focus, get active() { return active; } };
}

test('same step restores a named button after replacing the entire tour', () => {
  const p = page();
  try {
    const session = new ContinuousFocusSession();
    const first = p.control('continue');
    p.root.append(first);
    p.focus(first);
    session.capture(p.document, p.root, 'hair');
    const next = p.control('continue');
    const title = p.heading();
    p.root.replaceChildren(next, title);
    assert.equal(session.restore(p.root, 'hair', title), 'control');
    assert.equal(p.active, next);
    assert.equal(session.snapshot, null);
    session.dispose();
  } finally { p.restore(); }
});

test('new step focuses its heading rather than retaining a stale effect control', () => {
  const p = page();
  try {
    const session = new ContinuousFocusSession();
    const old = p.control('apply-hair');
    p.root.append(old);
    p.focus(old);
    session.capture(p.document, p.root, 'hair');
    const title = p.heading();
    p.root.replaceChildren(p.control('apply-colour'), title);
    assert.equal(session.restore(p.root, 'colour', title), 'heading');
    assert.equal(p.active, title);
    session.dispose();
  } finally { p.restore(); }
});

test('rebuilding a checkbox keeps its action key but never its value', () => {
  const p = page();
  try {
    const session = new ContinuousFocusSession();
    const old = p.control('consent-hair', 'input');
    old.checked = true;
    old.value = 'private-user-input';
    p.root.append(old);
    p.focus(old);
    session.capture(p.document, p.root, 'consent');
    assert.deepEqual(session.snapshot, { action: 'consent-hair', step: 'consent' });
    const next = p.control('consent-hair', 'input');
    const title = p.heading();
    p.root.replaceChildren(next, title);
    assert.equal(session.restore(p.root, 'consent', title), 'control');
    assert.equal(p.active, next);
    assert.equal(next.checked, false);
    assert.doesNotMatch(JSON.stringify(session), /private-user-input/);
    session.dispose();
  } finally { p.restore(); }
});

test('active element outside the tour never becomes a focus target', () => {
  const p = page();
  try {
    const session = new ContinuousFocusSession();
    const remote = p.control('continue');
    p.body.append(remote);
    p.focus(remote);
    session.capture(p.document, p.root, 'hair');
    assert.equal(session.snapshot, null);
    const title = p.heading();
    p.root.append(title);
    assert.equal(session.restore(p.root, 'hair', title), 'heading');
    assert.equal(p.active, title);
  } finally { p.restore(); }
});

test('external active element with matching action cannot steal keyboard focus', () => {
  const p = page();
  try {
    const session = new ContinuousFocusSession();
    const external = p.control('save');
    const local = p.control('save');
    p.root.append(local);
    p.body.append(external);
    p.focus(external);
    session.capture(p.document, p.root, 'save');
    const title = p.heading();
    p.root.replaceChildren(local, title);
    session.restore(p.root, 'save', title);
    assert.equal(p.active, title);
  } finally { p.restore(); }
});

test('the preferred help control receives focus even after a step change', () => {
  const p = page();
  try {
    const session = new ContinuousFocusSession();
    session.prefer('keyboard-help');
    const button = p.control('keyboard-help');
    const title = p.heading();
    p.root.append(button, title);
    assert.equal(session.restore(p.root, 'compare', title), 'control');
    assert.equal(p.active, button);
    assert.equal(session.restore(p.root, 'compare', title), 'heading');
  } finally { p.restore(); }
});

test('a preferred missing or disabled action falls back to the step heading', () => {
  const p = page();
  try {
    const session = new ContinuousFocusSession();
    session.prefer('keyboard-audit');
    const disabled = p.control('keyboard-audit');
    disabled.disabled = true;
    const title = p.heading();
    p.root.append(disabled, title);
    assert.equal(session.restore(p.root, 'save', title), 'heading');
    assert.equal(p.active, title);
    session.prefer('keyboard-audit');
    p.root.replaceChildren(title);
    assert.equal(session.restore(p.root, 'save', title), 'heading');
  } finally { p.restore(); }
});

test('hidden, disabled and aria-hidden controls cannot be captured', () => {
  const p = page();
  try {
    const session = new ContinuousFocusSession();
    for (const variant of ['hidden', 'disabled', 'aria']) {
      const node = p.control('continue');
      if (variant === 'hidden') node.hidden = true;
      if (variant === 'disabled') node.disabled = true;
      if (variant === 'aria') node.setAttribute('aria-hidden', 'true');
      p.root.replaceChildren(node);
      p.focus(node);
      session.capture(p.document, p.root, 'hair');
      assert.equal(session.snapshot, null);
    }
  } finally { p.restore(); }
});

test('a malicious selector string is rejected before it can reach querySelectorAll', () => {
  const p = page();
  try {
    const session = new ContinuousFocusSession();
    assert.throws(() => session.prefer('a[href="https://example.invalid"]'), RangeError);
    assert.throws(() => session.prefer('__proto__'), RangeError);
    assert.throws(() => session.prefer('a b'), RangeError);
    assert.throws(() => session.prefer(''), RangeError);
  } finally { p.restore(); }
});

test('only native actionable controls produce a reusable focus reference', () => {
  const p = page();
  try {
    const button = p.control('next');
    const field = p.control('comparison', 'input');
    const select = p.control('palette', 'select');
    const text = p.control('notes', 'textarea');
    const decorative = p.control('save', 'span');
    assert.equal(focusAction(button), 'next');
    assert.equal(focusAction(field), 'comparison');
    assert.equal(focusAction(select), 'palette');
    assert.equal(focusAction(text), 'notes');
    assert.equal(focusAction(decorative), null);
  } finally { p.restore(); }
});

test('deep or cyclic ancestry terminates without traversing arbitrary objects', () => {
  const p = page();
  try {
    const cycle = { parentNode: null };
    cycle.parentNode = cycle;
    assert.equal(descendantOf(cycle, p.root), false);
    let leaf = { parentNode: null };
    for (let n = 0; n < 100; n += 1) leaf = { parentNode: leaf };
    assert.equal(descendantOf(leaf, p.root), false);
    const child = { parentNode: p.root };
    assert.equal(descendantOf(child, p.root), true);
  } finally { p.restore(); }
});

test('dispose cancels pending focus without retaining actions', () => {
  const p = page();
  try {
    const session = new ContinuousFocusSession();
    const button = p.control('continue');
    p.root.append(button);
    p.focus(button);
    session.capture(p.document, p.root, 'hair');
    session.prefer('keyboard-help');
    session.dispose();
    assert.equal(session.snapshot, null);
    const title = p.heading();
    assert.equal(session.restore(p.root, 'hair', title), 'none');
    session.prefer('keyboard-help');
    assert.equal(session.snapshot, null);
  } finally { p.restore(); }
});
