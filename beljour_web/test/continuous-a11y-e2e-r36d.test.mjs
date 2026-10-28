/** End-to-end keyboard access in the already-tested drawn-only tour. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { mountContinuousDemo } from '../dist/js/layout/continuous/mount.js';
import { sequencePage } from './helpers/continuous-sequence-page.mjs';
import { Element } from './helpers/dom.mjs';

function fixture() {
  const page = sequencePage();
  let active = null;
  const previousFocus = Element.prototype.focus;
  Element.prototype.focus = function () {
    active = this;
  };
  Object.defineProperty(page.document, 'activeElement', {
    configurable: true, get: () => active,
  });
  let exits = 0;
  const tour = mountContinuousDemo(page.document, page.host, () => { exits += 1; }, {
    now: () => page.clock.now, sequenceTimer: page.timer,
  });
  return {
    ...page, tour,
    get active() { return active; },
    get exits() { return exits; },
    async key(key, target = page.host) {
      await page.host.dispatch('keydown', { key, target });
    },
    close() {
      tour.dispose();
      Element.prototype.focus = previousFocus;
      page.cleanup();
    },
  };
}

test('first screen exposes full BELJOUR name, native actions and guidance', () => {
  const p = fixture();
  try {
    assert.match(p.host.textContent, /BELJOUR/);
    assert.match(p.host.textContent, /FULL BEAUTY STUDIO/);
    assert.match(p.host.textContent, /Your best day\. Still you/);
    assert.ok(p.action('keyboard-help'));
    assert.equal(p.active.id, 'lg-cont-title');
    assert.equal(p.network.length, 0);
  } finally { p.close(); }
});

test('keyboard help is available without opening any external screen', async () => {
  const p = fixture();
  try {
    await p.key('F1');
    assert.equal(p.action('keyboard-help').getAttribute('aria-expanded'), 'true');
    assert.equal(p.active, p.action('keyboard-help'));
    assert.match(p.host.textContent, /Arrow keys adjust/);
    assert.equal(p.network.length, 0);
    await p.key('Escape');
    assert.equal(p.exits, 0);
    assert.equal(p.action('keyboard-help').getAttribute('aria-expanded'), 'false');
  } finally { p.close(); }
});

test('two Escape actions leave the demo only after dismissing open help', async () => {
  const p = fixture();
  try {
    await p.key('F1');
    await p.key('Escape');
    assert.equal(p.exits, 0);
    await p.key('Escape');
    assert.equal(p.exits, 1);
    assert.equal(p.host.children.length, 0);
  } finally { p.close(); }
});

test('source change moves focus to heading and does not make a provider request', async () => {
  const p = fixture();
  try {
    const first = p.action('sample');
    p.document.activeElement?.focus?.();
    await first.click();
    assert.equal(p.active.id, 'lg-cont-title');
    assert.equal(p.tour.state.snapshot.sourceLoaded, true);
    assert.equal(p.network.length, 0);
  } finally { p.close(); }
});

test('a check on the current live tour screen reports counts, not face claims', async () => {
  const p = fixture();
  try {
    await p.press('keyboard-help');
    await p.press('keyboard-audit');
    assert.equal(p.action('keyboard-audit-download').disabled, false);
    assert.match(p.host.textContent, /native controls in this page|rule categories to review/);
    assert.equal(p.network.length, 0);
  } finally { p.close(); }
});

test('step navigation invalidates an earlier control check', async () => {
  const p = fixture();
  try {
    await p.press('keyboard-help');
    await p.press('keyboard-audit');
    assert.equal(p.action('keyboard-audit-download').disabled, false);
    await p.press('sample');
    assert.equal(p.action('keyboard-audit-download').disabled, true);
    assert.match(p.host.textContent, /not been checked in this state/);
  } finally { p.close(); }
});

test('native form fields keep their own Escape behavior', async () => {
  const p = fixture();
  try {
    await p.press('sample');
    for (let index = 0; index < 3; index += 1) p.tour.state.next(true);
    p.tour.render();
    const tick = p.input('consent-local');
    assert.ok(tick);
    await p.key('Escape', tick);
    assert.equal(p.exits, 0);
    tick.focus();
    await p.tick('consent-local', true);
    assert.equal(p.active.dataset.tourAction, 'consent-local');
    assert.equal(p.network.length, 0);
  } finally { p.close(); }
});

test('the user can still skip a step using the native footer button', async () => {
  const p = fixture();
  try {
    const before = p.tour.state.snapshot.step;
    await p.press('skip');
    assert.notEqual(p.tour.state.snapshot.step, before);
    assert.match(p.host.textContent, /Skipped steps are not evidence/);
    assert.equal(p.active.id, 'lg-cont-title');
  } finally { p.close(); }
});

test('remounting the tour has no previous keyboard help, focus or audit state', async () => {
  const p = fixture();
  try {
    await p.press('keyboard-help');
    await p.press('keyboard-audit');
    assert.equal(p.action('keyboard-audit-download').disabled, false);
    p.tour.dispose();
    const second = mountContinuousDemo(p.document, p.host, () => {}, {
      now: () => p.clock.now, sequenceTimer: p.timer,
    });
    try {
      assert.equal(p.action('keyboard-help').getAttribute('aria-expanded'), 'false');
      assert.equal(p.action('keyboard-audit-download'), undefined);
      assert.equal(p.network.length, 0);
    } finally { second.dispose(); }
  } finally { p.close(); }
});

test('the accessibility stylesheet keeps only French blue and 12px-plus text', () => {
  const css = readFileSync(new URL('../theme.css', import.meta.url), 'utf8');
  const section = css.slice(css.indexOf('/* BELJOUR: in-place keyboard guidance'));
  assert.ok(section.length > 100);
  assert.match(section, /#000091/);
  assert.match(section, /#ffffff/i);
  assert.doesNotMatch(section, /#e1000f/i);
  assert.match(section, /min-height:\s*44px/);
  assert.doesNotMatch(section, /font-size:\s*0\.[0-6][0-9]?rem/);
  assert.match(section, /prefers-reduced-motion/);
});


test('skip-to-current-controls lands on the current step without changing its state', async () => {
  const p = fixture();
  try {
    const before = p.tour.state.snapshot.step;
    await p.press('keyboard-jump');
    assert.equal(p.active.id, 'lg-cont-current-step');
    assert.equal(p.tour.state.snapshot.step, before);
    assert.equal(p.network.length, 0);
    await p.press('sample');
    await p.press('keyboard-jump');
    assert.equal(p.active.id, 'lg-cont-current-step');
    assert.equal(p.tour.state.snapshot.sourceLoaded, true);
  } finally { p.close(); }
});
