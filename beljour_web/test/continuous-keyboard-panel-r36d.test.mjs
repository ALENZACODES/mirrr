/** Keyboard panel uses static help and named native controls. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderContinuousKeyboardPanel } from
  '../dist/js/ui/shell/continuous-keyboard-panel.js';
import { installDOM } from './helpers/dom.mjs';

function fixture(open = false, hasReport = false) {
  const dom = installDOM();
  const calls = [];
  const element = renderContinuousKeyboardPanel(dom.document, {
    open, hasReport, auditStatus: 'No certification was claimed.',
  }, {
    toggleHelp: () => calls.push('toggle'),
    focusStep: () => calls.push('focus'),
    runCheck: () => calls.push('check'),
    saveCheck: () => calls.push('save'),
  });
  dom.root.append(element);
  const action = name => element.querySelectorAll('button')
    .find(item => item.dataset.tourAction === name);
  return { ...dom, element, action, calls };
}

test('collapsed default exposes named help and skip controls', async () => {
  const p = fixture();
  try {
    const toggle = p.action('keyboard-help');
    assert.ok(toggle);
    assert.equal(toggle.type, 'button');
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    assert.equal(toggle.getAttribute('aria-controls'), 'lg-cont-keyboard-instructions');
    assert.equal(p.element.querySelectorAll('button').length, 2);
    assert.equal(p.action('keyboard-jump').textContent, 'Skip to current controls');
    assert.equal(p.element.querySelectorAll('ol').length, 0);
    await toggle.click();
    assert.deepEqual(p.calls, ['toggle']);
  } finally { p.restore(); }
});

test('expanded panel explains native focus, native slider arrows and Escape', () => {
  const p = fixture(true);
  try {
    assert.equal(p.action('keyboard-help').getAttribute('aria-expanded'), 'true');
    assert.equal(p.element.querySelector('ol').children.length, 6);
    assert.match(p.element.textContent, /Tab and Shift\+Tab/);
    assert.match(p.element.textContent, /Arrow keys adjust/);
    assert.match(p.element.textContent, /Escape closes this help/);
    assert.match(p.element.textContent, /not a screen-reader certification/i);
    assert.match(p.element.textContent, /never requests a provider task/i);
  } finally { p.restore(); }
});

test('optional control check and report download have distinct event handlers', async () => {
  const p = fixture(true, true);
  try {
    await p.action('keyboard-audit').click();
    await p.action('keyboard-audit-download').click();
    assert.deepEqual(p.calls, ['check', 'save']);
    assert.equal(p.action('keyboard-audit').type, 'button');
    assert.equal(p.action('keyboard-audit-download').type, 'button');
  } finally { p.restore(); }
});

test('download remains disabled until a local check has completed', () => {
  const p = fixture(true, false);
  try {
    const button = p.action('keyboard-audit-download');
    assert.ok(button);
    assert.equal(button.disabled, true);
    assert.equal(p.calls.length, 0);
  } finally { p.restore(); }
});

test('result is a polite live region and has no form value or user data', () => {
  const p = fixture(true, true);
  try {
    const region = p.element.querySelector('.lg-cont-keyboard-result');
    assert.ok(region);
    assert.equal(region.getAttribute('role'), 'status');
    assert.equal(region.getAttribute('aria-live'), 'polite');
    assert.equal(region.getAttribute('aria-atomic'), 'true');
    assert.doesNotMatch(p.element.textContent, /data:image|png:|requestKey|apiKey/i);
  } finally { p.restore(); }
});

test('no scripts, inline handlers, external links or client network code are emitted', () => {
  const p = fixture(true, true);
  try {
    assert.equal(p.element.querySelectorAll('script').length, 0);
    assert.equal(p.element.querySelectorAll('a').length, 0);
    assert.equal(p.element.querySelectorAll('input').length, 0);
    for (const button of p.element.querySelectorAll('button')) {
      assert.equal(button.getAttribute('onclick'), null);
      assert.ok(button.textContent.trim());
    }
  } finally { p.restore(); }
});

test('the fixed instructions never represent local checks as WCAG certification', () => {
  const p = fixture(true, true);
  try {
    assert.doesNotMatch(p.element.textContent, /WCAG 2\.2 AA PASS/i);
    assert.doesNotMatch(p.element.textContent, /certified accessible/i);
    assert.match(p.element.textContent, /screen-reader certification/i);
  } finally { p.restore(); }
});


test('the skip control remains available when expanded and never starts a tour action', async () => {
  const p = fixture(true, true);
  try {
    const skip = p.action('keyboard-jump');
    assert.ok(skip);
    assert.equal(skip.type, 'button');
    await skip.click();
    assert.deepEqual(p.calls, ['focus']);
    assert.equal(p.action('keyboard-help').getAttribute('aria-expanded'), 'true');
  } finally { p.restore(); }
});
