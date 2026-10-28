// Lane D r21d: responsive and keyboard operation using synthetic DOM nodes.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Element, installDOM } from './helpers/dom.mjs';
import {
  COMPACT_MAX, COMPACT_QUERY, SMALL_PHONE_MAX, compactNow,
  touchTargetSize, watchCompact, widthClass,
} from '../dist/js/mobile/viewport.js';
import { isTypingTarget, moveNavFocus, navigationIndex } from '../dist/js/mobile/keyboard.js';
import { makeDisclosure, within } from '../dist/js/mobile/disclosure.js';

function media(initial = true) {
  const events = new Set();
  const query = { matches: initial, addEventListener: (_, callback) => events.add(callback),
    removeEventListener: (_, callback) => events.delete(callback),
    change(matches) { this.matches = matches; for (const fn of events) fn({ matches }); } };
  return { host: { matchMedia(name) { assert.equal(name, COMPACT_QUERY); return query; } }, query, events };
}
function makeSurface() {
  const events = new Map();
  return { events,
    addEventListener(name, callback) {
      const listeners = events.get(name) ?? new Set();
      listeners.add(callback);
      events.set(name, listeners);
    },
    removeEventListener(name, callback) { events.get(name)?.delete(callback); },
    emit(name, props = {}) { for (const callback of [...(events.get(name) ?? [])]) callback({ type: name,
      target: null, preventDefault() {}, ...props }); } };
}
function fakeParts() {
  const root = new Element('section'), trigger = new Element('button'), panel = new Element('nav');
  const toolsButton = new Element('button'), toolsPanel = new Element('section');
  const links = [new Element('a'), new Element('a'), new Element('a')];
  root.append(trigger, panel);
  panel.append(...links, toolsButton, toolsPanel);
  toolsPanel.append(new Element('a'));
  return { root, trigger, panel, toolsButton, toolsPanel, topLinks: links };
}

test('viewport cutoffs preserve 44-pixel phone targets', () => {
  assert.equal(COMPACT_MAX, 760);
  assert.equal(SMALL_PHONE_MAX, 480);
  assert.equal(widthClass(320), 'phone');
  assert.equal(widthClass(480), 'phone');
  assert.equal(widthClass(481), 'compact');
  assert.equal(widthClass(760), 'compact');
  assert.equal(widthClass(761), 'wide');
  assert.equal(touchTargetSize(360), 44);
  assert.equal(touchTargetSize(760), 44);
  assert.equal(touchTargetSize(1200), 40);
  for (const invalid of [0, -1, NaN, Infinity]) assert.throws(() => widthClass(invalid), RangeError);
});

test('viewport watcher removes listeners and supports the older change interface', () => {
  const { host, query, events } = media(true);
  const seen = [];
  const stop = watchCompact(host, value => seen.push(value));
  query.change(false);
  query.change(true);
  assert.deepEqual(seen, [true, false, true]);
  stop();
  assert.equal(events.size, 0);
  query.change(false);
  assert.deepEqual(seen, [true, false, true]);
  const legacy = {
    matches: true,
    addListener(fn) { this.fn = fn; },
    removeListener(fn) {
      assert.equal(fn, this.fn);
      this.fn = null;
    },
  };
  const end = watchCompact({ matchMedia: () => legacy }, v => seen.push(v));
  legacy.fn({ matches: false });
  end();
  assert.deepEqual(seen.slice(-2), [true, false]);
});

test('no-matchMedia fallback never locks the app out of navigation', () => {
  assert.equal(compactNow({ innerWidth: 390 }), true);
  assert.equal(compactNow({ innerWidth: 1200 }), false);
  assert.equal(compactNow({ innerWidth: 0 }), false);
  assert.equal(compactNow({ matchMedia() { throw new Error('blocked'); } }), false);
  const changes = [];
  watchCompact({ innerWidth: 320 }, value => changes.push(value))();
  assert.deepEqual(changes, [true]);
  const blocked = [];
  watchCompact({ matchMedia() { throw new Error('blocked'); } }, value => blocked.push(value))();
  assert.deepEqual(blocked, [false]);
});

test('top link keyboard arithmetic wraps and ignores unsupported events', () => {
  assert.equal(navigationIndex(5, 0, 'ArrowLeft'), 4);
  assert.equal(navigationIndex(5, 4, 'ArrowRight'), 0);
  assert.equal(navigationIndex(5, 3, 'Home'), 0);
  assert.equal(navigationIndex(5, 1, 'End'), 4);
  assert.equal(navigationIndex(5, 2, 'x'), null);
  assert.equal(navigationIndex(0, 0, 'Home'), null);
  assert.equal(navigationIndex(4, -1, 'End'), null);
  assert.equal(navigationIndex(4, 4, 'Home'), null);
});

test('navigation focus moves on arrow keys without hijacking text entry', () => {
  const links = [new Element('a'), new Element('a'), new Element('a')];
  const key = (target, name, flags = {}) => {
    let prevented = false;
    return { event: { key: name, target, altKey: false, ctrlKey: false, metaKey: false,
      preventDefault() { prevented = true; }, ...flags }, prevented: () => prevented };
  };
  const event = key(links[1], 'ArrowRight');
  assert.equal(moveNavFocus(event.event, links), true);
  assert.equal(event.prevented(), true);
  assert.equal(links[2].focused, true);
  const modified = key(links[0], 'ArrowLeft', { ctrlKey: true });
  assert.equal(moveNavFocus(modified.event, links), false);
  assert.equal(modified.prevented(), false);
  assert.equal(isTypingTarget(new Element('input')), true);
  assert.equal(isTypingTarget(new Element('textarea')), true);
  assert.equal(isTypingTarget(new Element('select')), true);
  assert.equal(isTypingTarget(links[0]), false);
});

test('disclosure Escape restores focus and responsive change closes panels', async () => {
  const dom = installDOM();
  const previous = globalThis.Element;
  globalThis.Element = Element;
  try {
    const parts = fakeParts();
    dom.root.append(parts.root);
    const events = makeSurface();
    const { host, query } = media(true);
    const drawer = makeDisclosure(parts, events, host);
    assert.equal(drawer.expanded, false);
    assert.equal(parts.trigger.getAttribute('aria-expanded'), 'false');
    await parts.trigger.click();
    assert.equal(drawer.expanded, true);
    assert.equal(parts.topLinks[0].focused, true);
    drawer.openTools();
    assert.equal(drawer.toolsExpanded, true);
    assert.equal(parts.toolsButton.getAttribute('aria-expanded'), 'true');
    let prevented = 0;
    events.emit('keydown', { key: 'Escape', target: parts.topLinks[0], preventDefault() { prevented++; } });
    assert.equal(drawer.toolsExpanded, false);
    assert.equal(drawer.expanded, true);
    assert.equal(parts.toolsButton.focused, true);
    events.emit('keydown', { key: 'Escape', target: parts.topLinks[0], preventDefault() { prevented++; } });
    assert.equal(drawer.expanded, false);
    assert.equal(parts.trigger.focused, true);
    assert.equal(prevented, 2);
    drawer.open();
    query.change(false);
    assert.equal(drawer.expanded, false);
    assert.equal(parts.panel.dataset.open, 'false');
    drawer.destroy();
    assert.equal(events.events.get('keydown').size, 0);
    drawer.open();
    assert.equal(drawer.expanded, false);
  } finally {
    if (previous === undefined) delete globalThis.Element;
    else globalThis.Element = previous;
    dom.restore();
  }
});

test('clicking elsewhere closes a phone menu without touching a document editor', async () => {
  const dom = installDOM();
  const previous = globalThis.Element;
  globalThis.Element = Element;
  try {
    const parts = fakeParts();
    dom.root.append(parts.root);
    const events = makeSurface();
    const { host } = media(true);
    const drawer = makeDisclosure(parts, events, host);
    drawer.open();
    assert.equal(within(parts.topLinks[0], parts.root), true);
    assert.equal(within(dom.root, parts.root), false);
    events.emit('pointerdown', { target: parts.topLinks[0] });
    assert.equal(drawer.expanded, true);
    events.emit('pointerdown', { target: dom.root });
    assert.equal(drawer.expanded, false);
    drawer.open();
    await parts.panel.dispatch('click', { target: parts.topLinks[1] });
    assert.equal(drawer.expanded, false);
    drawer.destroy();
  } finally {
    if (previous === undefined) delete globalThis.Element;
    else globalThis.Element = previous;
    dom.restore();
  }
});
