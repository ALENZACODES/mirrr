/** Screen-level focus and authority lifecycle. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ContinuousAccessibilitySession } from
  '../dist/js/layout/continuous/accessibility-session.js';
import { Element, installDOM } from './helpers/dom.mjs';

function state(step = 'hair') {
  return {
    step, sourceLoaded: true, sourceRevision: 7,
    selectedId: 'drawn-main', identityLock: true,
    permissions: { local: true, hair: true, face: true, mock: true },
    levels: { hair: 2, colour: 2, concealer: 2, appearance: 2,
      ratio: 2, turn: 2, posture: 2 },
    applied: { hair: false, colour: false, concealer: false, appearance: false,
      ratio: false, turn: false, posture: false },
    appearanceCue: 'none', mockMode: 'off',
  };
}

function fixture(initial = state()) {
  const dom = installDOM();
  const host = dom.document.createElement('section');
  dom.root.append(host);
  let current = initial;
  let active = null;
  const oldFocus = Element.prototype.focus;
  Element.prototype.focus = function () { active = this; };
  let renders = 0;
  let exits = 0;
  Object.defineProperty(dom.document, 'activeElement', { get: () => active });
  const focus = node => { active = node; };
  const rebuild = () => {
    const changed = controller.beforeRender(current);
    const heading = dom.document.createElement('h2');
    heading.id = 'lg-cont-title';
    heading.tabIndex = -1;
    heading.textContent = 'Guided product demonstration';
    heading.focus = () => focus(heading);
    const button = dom.document.createElement('button');
    button.type = 'button';
    button.textContent = 'Continue';
    button.dataset.tourAction = 'continue';
    button.focus = () => focus(button);
    host.replaceChildren(heading, button, controller.panel());
    controller.afterRender(current.step, heading);
    renders += 1;
    return changed;
  };
  const controller = new ContinuousAccessibilitySession({
    doc: dom.document, host,
    onExit: () => { exits += 1; },
    rerender: () => rebuild(),
  });
  const action = name => host.querySelectorAll('button')
    .find(item => item.dataset.tourAction === name);
  return {
    ...dom, host, controller, rebuild, action, focus,
    setState: value => { current = value; },
    get current() { return current; },
    get active() { return active; },
    get renders() { return renders; },
    get exits() { return exits; },
    close() { controller.dispose(); Element.prototype.focus = oldFocus; dom.restore(); },
  };
}

test('initial render focuses the current step heading and shows collapsed help', () => {
  const p = fixture();
  try {
    assert.equal(p.rebuild(), true);
    assert.equal(p.active.id, 'lg-cont-title');
    assert.equal(p.action('keyboard-help').getAttribute('aria-expanded'), 'false');
    assert.equal(p.controller.hasReport, false);
  } finally { p.close(); }
});

test('a same-step mutation retains focus on its named continue button', () => {
  const p = fixture();
  try {
    p.rebuild();
    const old = p.action('continue');
    p.focus(old);
    assert.equal(p.rebuild(), false);
    assert.equal(p.active, p.action('continue'));
    assert.notEqual(p.active, old);
  } finally { p.close(); }
});

test('a changed step moves focus back to the new heading', () => {
  const p = fixture();
  try {
    p.rebuild();
    p.focus(p.action('continue'));
    p.setState(state('colour'));
    assert.equal(p.rebuild(), true);
    assert.equal(p.active.id, 'lg-cont-title');
  } finally { p.close(); }
});

test('keyboard button expands help without changing the active demonstration state', async () => {
  const p = fixture();
  try {
    p.rebuild();
    const original = p.current;
    await p.action('keyboard-help').click();
    assert.equal(p.controller.helpOpen, true);
    assert.equal(p.active, p.action('keyboard-help'));
    assert.match(p.host.textContent, /Tab and Shift\+Tab/);
    assert.equal(p.current, original);
    assert.equal(p.renders, 2);
  } finally { p.close(); }
});

test('Escape closes help then exits without touching native input shortcuts', async () => {
  const p = fixture();
  try {
    p.rebuild();
    await p.action('keyboard-help').click();
    await p.host.dispatch('keydown', { key: 'Escape', target: p.action('keyboard-help') });
    assert.equal(p.controller.helpOpen, false);
    assert.equal(p.exits, 0);
    await p.host.dispatch('keydown', { key: 'Escape', target: p.action('continue') });
    assert.equal(p.exits, 1);
  } finally { p.close(); }
});

test('the optional check produces a report without claiming a screen-reader pass', async () => {
  const p = fixture();
  try {
    p.rebuild();
    await p.action('keyboard-help').click();
    await p.action('keyboard-audit').click();
    assert.equal(p.controller.hasReport, true);
    assert.match(p.host.textContent, /Screen-reader and physical-device verification remain required/);
    assert.equal(p.action('keyboard-audit-download').disabled, false);
    assert.equal(p.active, p.action('keyboard-audit'));
  } finally { p.close(); }
});

test('a report remains available after a same-state re-render', async () => {
  const p = fixture();
  try {
    p.rebuild();
    await p.action('keyboard-help').click();
    await p.action('keyboard-audit').click();
    p.rebuild();
    assert.equal(p.controller.hasReport, true);
    assert.equal(p.action('keyboard-audit-download').disabled, false);
  } finally { p.close(); }
});

test('changed consent automatically invalidates any earlier local audit', async () => {
  const p = fixture();
  try {
    p.rebuild();
    await p.action('keyboard-help').click();
    await p.action('keyboard-audit').click();
    assert.equal(p.controller.hasReport, true);
    p.setState({ ...p.current,
      permissions: { ...p.current.permissions, mock: false } });
    p.rebuild();
    assert.equal(p.controller.hasReport, false);
    assert.equal(p.action('keyboard-audit-download').disabled, true);
  } finally { p.close(); }
});

test('changing selected subject invalidates a report and preserves only fixed copy', async () => {
  const p = fixture();
  try {
    p.rebuild();
    await p.action('keyboard-help').click();
    await p.action('keyboard-audit').click();
    p.setState({ ...p.current, selectedId: 'private-portrait-subject' });
    p.rebuild();
    assert.equal(p.controller.hasReport, false);
    assert.doesNotMatch(p.host.textContent, /private-portrait-subject/);
  } finally { p.close(); }
});

test('a source change or strength change also invalidates the local review', async () => {
  for (const modification of [
    current => ({ ...current, sourceRevision: 8 }),
    current => ({ ...current, levels: { ...current.levels, hair: 2.1 } }),
    current => ({ ...current, identityLock: false }),
    current => ({ ...current, applied: { ...current.applied, hair: true } }),
  ]) {
    const p = fixture();
    try {
      p.rebuild();
      await p.action('keyboard-help').click();
      await p.action('keyboard-audit').click();
      assert.equal(p.controller.hasReport, true);
      p.setState(modification(p.current));
      p.rebuild();
      assert.equal(p.controller.hasReport, false);
    } finally { p.close(); }
  }
});

test('audit download makes a local JSON request and revokes the URL', async () => {
  const p = fixture();
  const create = URL.createObjectURL;
  const revoke = URL.revokeObjectURL;
  const releases = [];
  URL.createObjectURL = () => 'blob:local-audit-file';
  URL.revokeObjectURL = url => releases.push(url);
  try {
    p.rebuild();
    await p.action('keyboard-help').click();
    await p.action('keyboard-audit').click();
    await p.action('keyboard-audit-download').click();
    assert.deepEqual(releases, ['blob:local-audit-file']);
    assert.match(p.host.textContent, /Browser save is not confirmed/);
  } finally {
    URL.createObjectURL = create;
    URL.revokeObjectURL = revoke;
    p.close();
  }
});

test('after dispose no handler executes and the ephemeral report is cleared', async () => {
  const p = fixture();
  try {
    p.rebuild();
    await p.action('keyboard-help').click();
    await p.action('keyboard-audit').click();
    const previousRenders = p.renders;
    const previousExits = p.exits;
    p.controller.dispose();
    assert.equal(p.controller.hasReport, false);
    p.controller.check();
    p.controller.save();
    await p.host.dispatch('keydown', { key: 'Escape', target: p.action('keyboard-help') });
    assert.equal(p.renders, previousRenders);
    assert.equal(p.exits, previousExits);
  } finally { p.close(); }
});
