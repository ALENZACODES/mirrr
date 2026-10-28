// R24D: local keyboard-only and responsive checks, no images or telemetry.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Element, installDOM, buttonNamed } from './helpers/dom.mjs';
import {
  KeyboardRehearsal,
  keyboardEvidenceText,
} from '../dist/js/mobile/keyboard-rehearsal.js';
import { inspectResponsiveLayout } from '../dist/js/mobile/responsive-audit.js';
import { mountAccessibilityPage } from '../dist/js/diagnostics/accessibility-page.js';

function emitter() {
  const list = new Map();
  return {
    addEventListener(type, fn) {
      const set = list.get(type) ?? new Set();
      set.add(fn);
      list.set(type, set);
    },
    removeEventListener(type, fn) { list.get(type)?.delete(fn); },
    send(type, payload) { for (const fn of list.get(type) ?? []) fn(payload); },
    count(type) { return list.get(type)?.size ?? 0; },
  };
}

function makeDocument() {
  const dom = installDOM();
  const main = dom.document.createElement('main');
  main.id = 'lg-main';
  dom.root.append(main);
  const link = dom.document.createElement('a');
  link.textContent = 'Open Studio';
  link.width = 120;
  link.height = 40;
  const button = dom.document.createElement('button');
  button.width = 20;
  button.height = 21;
  button.setAttribute('aria-label', 'Consent action');
  const paragraph = dom.document.createElement('p');
  paragraph.textContent = 'Demonstration only';
  const hidden = dom.document.createElement('button');
  hidden.hidden = true;
  hidden.width = 5;
  hidden.height = 5;
  main.append(link, button, paragraph, hidden);
  return { ...dom, main, link, button, paragraph, hidden };
}

test('keyboard session only observes Tab counts and nonidentifying name/ring hints', () => {
  const host = emitter();
  const audit = new KeyboardRehearsal(host, {
    getStyle: () => ({ outlineStyle: 'solid', outlineWidth: '3px' }),
  });
  audit.start();
  audit.start();
  assert.equal(host.count('focusin'), 1);
  assert.equal(host.count('keydown'), 1);
  const named = new Element('button');
  named.textContent = 'Export';
  const unnamed = new Element('button');
  const sensitive = new Element('input');
  sensitive.value = 'user-private-input-must-not-leak';
  host.send('keydown', { key: 'S' });
  host.send('keydown', { key: 'Tab' });
  host.send('keydown', { key: 'Tab', shiftKey: true });
  host.send('focusin', { target: named });
  host.send('focusin', { target: unnamed });
  host.send('focusin', { target: sensitive });
  const snapshot = audit.stop();
  assert.equal(snapshot.recordedFocus, 3);
  assert.equal(snapshot.tabRequests, 2);
  assert.equal(snapshot.namedControls, 1);
  assert.equal(snapshot.unnamedControls, 2);
  assert.equal(snapshot.visibleRingHints, 3);
  assert.equal(snapshot.proof, 'manual-hint-only');
  assert.equal(snapshot.active, false);
  assert.ok(!JSON.stringify(snapshot).includes(sensitive.value));
  assert.match(keyboardEvidenceText(snapshot), /2 potentially unnamed/);
  assert.equal(host.count('focusin'), 0);
  assert.equal(host.count('keydown'), 0);
  audit.dispose();
});

test('keyboard focus outline absence is a manual hint rather than a confident failure', () => {
  const host = emitter();
  const audit = new KeyboardRehearsal(host, {
    getStyle: () => ({ outlineStyle: 'none', outlineWidth: '0px', boxShadow: 'none' }),
    referenceExists: () => true,
  });
  audit.start();
  const link = new Element('a');
  link.setAttribute('aria-labelledby', 'guide-label');
  link.setAttribute('tabindex', '-1');
  host.send('focusin', { target: link });
  assert.equal(audit.snapshot.namedControls, 1);
  assert.equal(audit.snapshot.notInTabOrder, 1);
  assert.equal(audit.snapshot.ringUnknown, 1);
  audit.stop();
  audit.dispose();
});

test('responsive measurement uses physical observed dimensions and reports unknowns safely', () => {
  const app = makeDocument();
  try {
    const output = inspectResponsiveLayout(app.main, {
      viewportWidth: 320,
      contentWidth: 370,
      style: (node) => ({ fontSize: node === app.paragraph ? '11px' : '16px' }),
    });
    assert.equal(output.viewportWidth, 320);
    assert.equal(output.overflowPixels, 50);
    assert.equal(output.controlsSeen, 2);
    assert.equal(output.smallTouchControls, 2);
    assert.equal(output.smallTextElements, 1);
    assert.equal(output.sampled, false);
    assert.match(output.warnings.join(' '), /exceeds the viewport/);
    assert.match(output.warnings.join(' '), /320px\/390px/);
    assert.equal(output.label, 'measurement-not-certification');
    const unknown = inspectResponsiveLayout(app.main, {
      viewportWidth: Number.NaN,
      contentWidth: -1,
    });
    assert.equal(unknown.viewportWidth, null);
    assert.equal(unknown.overflowPixels, null);
    assert.match(unknown.warnings.join(' '), /not measurable/);
  } finally { app.restore(); }
});

test('responsive audit excludes hidden nodes, handles truncation and enforces safe limits', () => {
  const app = makeDocument();
  try {
    const output = inspectResponsiveLayout(app.main, { maxNodes: 2 });
    assert.equal(output.sampled, true);
    assert.ok(output.warnings.some((item) => item.includes('bounded scan')));
    assert.throws(() => inspectResponsiveLayout(app.main, { maxNodes: 0 }), RangeError);
    assert.throws(() => inspectResponsiveLayout(null), TypeError);
    assert.throws(() => inspectResponsiveLayout(app.main, { maxNodes: 5001 }), RangeError);
  } finally { app.restore(); }
});

test('accessible device page provides manual keyboard and viewport actions without storage', async () => {
  const app = makeDocument();
  try {
    const host = app.document.createElement('div');
    app.root.append(host);
    const browser = {
      innerWidth: 390,
      getComputedStyle: () => ({ fontSize: '16px', color: '#1b1b35', backgroundColor: '#fff',
        outlineStyle: 'solid', outlineWidth: '3px' }),
      location: { hash: '#accessibility' },
      setTimeout: (fn) => fn(),
    };
    const page = mountAccessibilityPage(app.document, host, browser);
    const start = buttonNamed(host, 'Start keyboard rehearsal');
    const viewport = buttonNamed(host, 'Measure this viewport');
    assert.ok(start);
    assert.ok(viewport);
    await start.click();
    assert.match(host.textContent, /Keyboard rehearsal is on/);
    await start.click();
    assert.match(host.textContent, /0 Tab requests/);
    await viewport.click();
    assert.match(host.textContent, /controls measured/);
    assert.match(host.textContent, /Test 320px\/390px/);
    page.close();
    assert.equal(host.children.length, 0);
  } finally { app.restore(); }
});
