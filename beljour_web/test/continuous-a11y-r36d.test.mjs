/** Native controls and cautious on-device audit evidence. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { auditContinuousControls, auditLabel } from
  '../dist/js/layout/continuous/accessibility-audit.js';
import { installDOM } from './helpers/dom.mjs';

function scene(options = {}) {
  const dom = installDOM();
  const root = dom.document.createElement('section');
  dom.root.append(root);
  if (options.heading !== false) {
    const heading = dom.document.createElement('h2');
    heading.id = 'lg-cont-title';
    heading.textContent = 'Guided demonstration';
    root.append(heading);
  }
  const addButton = (text, options = {}) => {
    const item = dom.document.createElement('button');
    item.type = 'button';
    item.textContent = text;
    if (options.name) item.setAttribute('aria-label', options.name);
    root.append(item);
    return item;
  };
  const addSlider = (options = {}) => {
    const label = dom.document.createElement('label');
    label.textContent = 'Illustration strength';
    const item = dom.document.createElement('input');
    item.type = 'range';
    item.min = options.min ?? '1';
    item.max = options.max ?? '5';
    item.step = options.step ?? '0.1';
    item.dataset.tourAction = options.action ?? 'strength-hair';
    item.dataset.editStrength = 'true';
    item.setAttribute('aria-label', 'Hair intensity');
    label.append(item);
    root.append(label);
    return item;
  };
  return { ...dom, root, addButton, addSlider };
}

test('valid heading, named buttons and decimal slider have no local findings', () => {
  const p = scene();
  try {
    p.addButton('Continue');
    p.addButton('Skip');
    p.addSlider();
    const result = auditContinuousControls(p.root);
    assert.deepEqual(result.findings, []);
    assert.equal(result.format, 'beljour-tour-accessibility/1');
    assert.equal(result.note, 'local-observation-only');
    assert.equal(result.controls, 3);
    assert.equal(result.inspected, 3);
    assert.equal(result.measuredButtons, 2);
    assert.match(auditLabel(result), /Screen-reader and physical-device verification remain required/);
  } finally { p.restore(); }
});

test('missing current heading cannot be passed by a different heading', () => {
  const p = scene({ heading: false });
  try {
    const heading = p.document.createElement('h3');
    heading.id = 'lg-cont-title';
    p.root.append(heading);
    assert.ok(auditContinuousControls(p.root).findings.includes('no-current-heading'));
  } finally { p.restore(); }
});

test('duplicate HTML ids are flagged even for non-control elements', () => {
  const p = scene();
  try {
    for (let i = 0; i < 2; i += 1) {
      const child = p.document.createElement('div');
      child.id = 'duplicate-edit-region';
      p.root.append(child);
    }
    assert.ok(auditContinuousControls(p.root).findings.includes('duplicate-id'));
  } finally { p.restore(); }
});

test('buttons without a visible or accessible name are refused', () => {
  const p = scene();
  try {
    p.addButton('');
    const report = auditContinuousControls(p.root);
    assert.deepEqual(report.findings, ['unnamed-button']);
    assert.match(auditLabel(report), /rule categories to review/);
  } finally { p.restore(); }
});

test('an aria-label is sufficient when a button has only an icon', () => {
  const p = scene();
  try {
    p.addButton('', { name: 'Close keyboard guidance' });
    assert.deepEqual(auditContinuousControls(p.root).findings, []);
  } finally { p.restore(); }
});

test('unlabelled inputs are flagged and a native wrapping label clears the flag', () => {
  const p = scene();
  try {
    const node = p.document.createElement('input');
    node.type = 'checkbox';
    p.root.append(node);
    assert.ok(auditContinuousControls(p.root).findings.includes('unnamed-input'));
    const label = p.document.createElement('label');
    label.textContent = 'Consent to local illustration';
    label.append(node);
    p.root.replaceChildren(p.root.firstChild, label);
    assert.deepEqual(auditContinuousControls(p.root).findings, []);
  } finally { p.restore(); }
});

test('a strength slider must use exactly 1.0–5.0 with steps of 0.1', () => {
  const variants = [
    { min: '0', max: '5', step: '0.1' },
    { min: '1', max: '6', step: '0.1' },
    { min: '1', max: '5', step: '1' },
    { min: '1', max: '5', step: '0.25' },
  ];
  for (const variant of variants) {
    const p = scene();
    try {
      p.addSlider(variant);
      assert.ok(auditContinuousControls(p.root).findings.includes('invalid-strength-step'));
    } finally { p.restore(); }
  }
});

test('an independent compare slider may have its own legitimate range', () => {
  const p = scene();
  try {
    const input = p.addSlider({ action: 'comparison', min: '0', max: '100', step: '1' });
    delete input.dataset.editStrength;
    assert.deepEqual(auditContinuousControls(p.root).findings, []);
  } finally { p.restore(); }
});

test('missing or invalid slider ranges are reported without throwing', () => {
  const p = scene();
  try {
    const input = p.addSlider();
    input.max = '1';
    assert.ok(auditContinuousControls(p.root).findings.includes('missing-slider-range'));
    input.max = '5';
    input.step = 'NaN';
    assert.ok(auditContinuousControls(p.root).findings.includes('missing-slider-range'));
    input.step = '0.1';
    assert.deepEqual(auditContinuousControls(p.root).findings, []);
  } finally { p.restore(); }
});

test('aria pressed accepts only true or false, never decorative free text', () => {
  const p = scene();
  try {
    const button = p.addButton('Select subject');
    button.setAttribute('aria-pressed', 'chosen');
    assert.ok(auditContinuousControls(p.root).findings.includes('invalid-pressed-state'));
    button.setAttribute('aria-pressed', 'true');
    assert.deepEqual(auditContinuousControls(p.root).findings, []);
    button.setAttribute('aria-pressed', 'false');
    assert.deepEqual(auditContinuousControls(p.root).findings, []);
  } finally { p.restore(); }
});

test('aria expanded accepts only true or false and is optional', () => {
  const p = scene();
  try {
    const button = p.addButton('Keyboard help');
    button.setAttribute('aria-expanded', 'open');
    assert.ok(auditContinuousControls(p.root).findings.includes('invalid-expanded-state'));
    button.setAttribute('aria-expanded', 'true');
    assert.deepEqual(auditContinuousControls(p.root).findings, []);
    button.removeAttribute('aria-expanded');
    assert.deepEqual(auditContinuousControls(p.root).findings, []);
  } finally { p.restore(); }
});

test('measured buttons smaller than 44px are flagged for touch review', () => {
  const p = scene();
  try {
    const button = p.addButton('Continue');
    button.getBoundingClientRect = () => ({ width: 42, height: 44 });
    assert.ok(auditContinuousControls(p.root).findings.includes('undersized-button'));
    button.getBoundingClientRect = () => ({ width: 44, height: 44 });
    assert.deepEqual(auditContinuousControls(p.root).findings, []);
    button.getBoundingClientRect = () => ({ width: 45, height: 43 });
    assert.ok(auditContinuousControls(p.root).findings.includes('undersized-button'));
  } finally { p.restore(); }
});

test('unmeasurable offscreen buttons are not counted as measured success', () => {
  const p = scene();
  try {
    const button = p.addButton('Later');
    button.getBoundingClientRect = () => ({ width: 0, height: 0 });
    const report = auditContinuousControls(p.root);
    assert.equal(report.measuredButtons, 0);
    assert.ok(!report.findings.includes('undersized-button'));
  } finally { p.restore(); }
});

test('a bounded scan refuses excess controls without expanding exported content', () => {
  const p = scene();
  try {
    for (let index = 0; index < 330; index += 1) p.addButton(`Action ${index}`);
    const report = auditContinuousControls(p.root);
    assert.equal(report.controls, 321);
    assert.equal(report.inspected, 320);
    assert.ok(report.findings.includes('control-limit'));
    assert.ok(JSON.stringify(report).length < 450);
  } finally { p.restore(); }
});

test('multiple instances of the same rule collapse to one finding category', () => {
  const p = scene();
  try {
    p.addButton('');
    p.addButton('');
    p.addButton('');
    assert.deepEqual(auditContinuousControls(p.root).findings, ['unnamed-button']);
    assert.equal(auditContinuousControls(p.root).controls, 3);
  } finally { p.restore(); }
});

test('report never serializes a user-provided button label or filename', () => {
  const p = scene();
  try {
    p.addButton('PRIVATE_USER_FILENAME_face.png');
    const report = auditContinuousControls(p.root);
    assert.doesNotMatch(JSON.stringify(report), /PRIVATE_USER_FILENAME|face\.png/);
    assert.equal(report.inspected, 1);
  } finally { p.restore(); }
});

test('audit rejects an unmounted input rather than reporting success', () => {
  assert.throws(() => auditContinuousControls(null), TypeError);
  assert.throws(() => auditContinuousControls({}), TypeError);
});

test('an aria-controls reference must point to an actual element in the same tour', () => {
  const p = scene();
  try {
    const toggle = p.addButton('Keyboard guidance');
    toggle.setAttribute('aria-controls', 'missing-panel');
    assert.ok(auditContinuousControls(p.root).findings.includes('broken-aria-reference'));
    const panel = p.document.createElement('div');
    panel.id = 'missing-panel';
    panel.hidden = true;
    p.root.append(panel);
    assert.deepEqual(auditContinuousControls(p.root).findings, []);
  } finally { p.restore(); }
});

test('multiple aria-labelledby references must each have bounded, valid IDs', () => {
  const p = scene();
  try {
    const button = p.addButton('Continue');
    button.setAttribute('aria-labelledby', 'lg-cont-title secondary-label');
    assert.ok(auditContinuousControls(p.root).findings.includes('broken-aria-reference'));
    const secondary = p.document.createElement('span');
    secondary.id = 'secondary-label';
    p.root.append(secondary);
    assert.deepEqual(auditContinuousControls(p.root).findings, []);
    button.setAttribute('aria-labelledby', 'lg-cont-title [secret]');
    assert.ok(auditContinuousControls(p.root).findings.includes('broken-aria-reference'));
  } finally { p.restore(); }
});

test('a zero-length or oversized aria-controls reference is refused', () => {
  const p = scene();
  try {
    const button = p.addButton('Show help');
    button.setAttribute('aria-controls', '   ');
    assert.ok(auditContinuousControls(p.root).findings.includes('broken-aria-reference'));
    button.setAttribute('aria-controls', Array(13).fill('lg-cont-title').join(' '));
    assert.ok(auditContinuousControls(p.root).findings.includes('broken-aria-reference'));
  } finally { p.restore(); }
});

test('a generated drawing must have a text alternative for screen readers', () => {
  const p = scene();
  try {
    const canvas = p.document.createElement('canvas');
    p.root.append(canvas);
    assert.ok(auditContinuousControls(p.root).findings.includes('missing-canvas-description'));
    canvas.setAttribute('aria-label', 'Original drawn subject with local edits');
    assert.deepEqual(auditContinuousControls(p.root).findings, []);
  } finally { p.restore(); }
});

test('two main landmarks inside one local tour are flagged', () => {
  const p = scene();
  try {
    const first = p.document.createElement('main');
    const second = p.document.createElement('main');
    p.root.append(first, second);
    assert.ok(auditContinuousControls(p.root).findings.includes('multiple-main-landmarks'));
    second.remove();
    assert.deepEqual(auditContinuousControls(p.root).findings, []);
  } finally { p.restore(); }
});

test('full continuous screens require one usable status live region', () => {
  const p = scene();
  try {
    const tour = p.document.createElement('div');
    tour.className = 'lg-continuous';
    p.root.append(tour);
    assert.ok(auditContinuousControls(p.root).findings.includes('missing-status-region'));
    const status = p.document.createElement('p');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    tour.append(status);
    assert.deepEqual(auditContinuousControls(p.root).findings, []);
  } finally { p.restore(); }
});

test('aria reference repair changes only fixed finding codes, never serializes target ids', () => {
  const p = scene();
  try {
    const button = p.addButton('Access options');
    button.setAttribute('aria-controls', 'private-subject-name');
    const result = auditContinuousControls(p.root);
    assert.ok(result.findings.includes('broken-aria-reference'));
    assert.doesNotMatch(JSON.stringify(result), /private-subject-name/);
  } finally { p.restore(); }
});
