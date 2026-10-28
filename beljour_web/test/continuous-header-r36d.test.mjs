/** Exact public identity and announced step state. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderContinuousHeader } from
  '../dist/js/layout/continuous/header.js';
import { installDOM } from './helpers/dom.mjs';

function render(state = {}) {
  const dom = installDOM();
  const result = renderContinuousHeader(dom.document, {
    index: 0, total: 16, title: 'Source',
    caption: 'Choose the drawn sample.', announce: true,
    ...state,
  });
  dom.root.append(result.header);
  return { ...dom, ...result };
}

test('the complete own-brand lockup is visible and never reduces to initials', () => {
  const p = render();
  try {
    assert.match(p.header.textContent, /BELJOUR/);
    assert.match(p.header.textContent, /FULL BEAUTY STUDIO/);
    assert.match(p.header.textContent, /Your best day\. Still you\./);
    assert.doesNotMatch(p.header.textContent, />LG<|>BJ<|LOOK\.GOOD/);
    assert.equal(p.header.tagName, 'HEADER');
    assert.equal(p.header.querySelectorAll('span').length, 4);
  } finally { p.restore(); }
});

test('brand aria label includes complete descriptor and tagline', () => {
  const p = render();
  try {
    const wrapper = p.header.querySelector('.lg-demo-monogram');
    assert.equal(wrapper.getAttribute('aria-label'),
      'BELJOUR — FULL BEAUTY STUDIO. Your best day. Still you.');
    assert.equal(wrapper.getAttribute('role'), null);
    assert.equal(p.header.querySelectorAll('svg').length, 0);
  } finally { p.restore(); }
});

test('initial progress announces exactly one step out of sixteen', () => {
  const p = render();
  try {
    const progress = p.header.querySelectorAll('p')[0];
    assert.equal(progress.textContent, 'Step 1 of 16: Source');
    assert.equal(progress.getAttribute('aria-live'), 'polite');
    assert.equal(progress.getAttribute('aria-atomic'), 'true');
  } finally { p.restore(); }
});

test('same-step rerenders do not repeatedly announce the step', () => {
  const p = render({ announce: false });
  try {
    const progress = p.header.querySelectorAll('p')[0];
    assert.equal(progress.getAttribute('aria-live'), 'off');
    assert.equal(progress.textContent, 'Step 1 of 16: Source');
  } finally { p.restore(); }
});

test('zero-based final index announces exact last stage', () => {
  const p = render({ index: 15, title: 'Save', caption: 'Local PNG' });
  try {
    assert.match(p.header.textContent, /Step 16 of 16: Save/);
    assert.match(p.header.textContent, /Local PNG/);
  } finally { p.restore(); }
});

test('heading is a real focusable h2 for step transitions', () => {
  const p = render();
  try {
    assert.equal(p.title.tagName, 'H2');
    assert.equal(p.title.id, 'lg-cont-title');
    assert.equal(p.title.tabIndex, -1);
    assert.equal(p.title.textContent, 'Guided product demonstration');
  } finally { p.restore(); }
});

test('unknown progress indices refuse without partial DOM mutation', () => {
  const dom = installDOM();
  try {
    for (const data of [
      { index: -1, total: 16 }, { index: 16, total: 16 },
      { index: 1.5, total: 16 }, { index: 0, total: 0 },
      { index: 0, total: Infinity }, { index: NaN, total: 16 },
    ]) {
      assert.throws(() => renderContinuousHeader(dom.document, {
        title: 'Safe', caption: 'Safe', announce: true, ...data,
      }), RangeError);
      assert.equal(dom.root.children.length, 0);
    }
  } finally { dom.restore(); }
});

test('captions are inserted as DOM text, never an HTML template', () => {
  const p = render({ caption: '<script>UNTRUSTED</script>' });
  try {
    assert.equal(p.header.querySelectorAll('script').length, 0);
    assert.match(p.header.textContent, /<script>UNTRUSTED<\/script>/);
    assert.equal(p.header.querySelectorAll('button').length, 0);
  } finally { p.restore(); }
});
