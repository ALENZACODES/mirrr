/** Native controls for user-requested local file confirmation. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { judgeDOM } from './judge-fixtures-r22d.mjs';
import { renderContinuousExportStatus } from '../dist/js/ui/shell/continuous-export-panel.js';

function fixture(phase = 'idle', receiptPhase = 'empty') {
  const page = judgeDOM();
  const calls = [];
  const output = renderContinuousExportStatus(page.document, {
    phase,
    reason: 'none', message: phase,
    pending: ['rendering', 'encoding', 'validating'].includes(phase),
    attempt: 1, bytes: 2000, durationMs: 52,
    verifiedByBrowser: false, photoStored: false,
  }, {
    phase: receiptPhase,
    message: receiptPhase,
    available: ['ready', 'matched', 'mismatch'].includes(receiptPhase),
    exactFileConfirmed: receiptPhase === 'matched',
    usedNetwork: false, storesImages: false,
  }, {
    cancel() { calls.push('cancel'); },
    inspect(file) { calls.push(file); },
  });
  page.host.append(output);
  return { ...page, calls, output };
}

test('idle export never pretends that a PNG has been saved', () => {
  const page = fixture();
  try {
    assert.match(page.host.textContent, /Local file verification/);
    assert.match(page.host.textContent, /Synthetic drawn sample only/);
    assert.equal(page.host.querySelectorAll('button').length, 0);
    assert.equal(page.host.querySelectorAll('input').length, 0);
    assert.equal(page.host.querySelectorAll('p').some(p => p.dataset.exportPhase === 'idle'), true);
  } finally { page.close(); }
});

for (const phase of ['rendering', 'encoding', 'validating']) {
  test(`an in-progress ${phase} stage has a keyboard-native cancel`, async () => {
    const page = fixture(phase);
    try {
      const button = page.host.querySelectorAll('button')[0];
      assert.equal(button.type, 'button');
      assert.equal(button.dataset.tourAction, 'cancel-export');
      assert.ok(button.textContent.trim());
      await button.click();
      assert.deepEqual(page.calls, ['cancel']);
    } finally { page.close(); }
  });
}

test('download request displays bytes and bounded duration, not a confirmed receipt', () => {
  const page = fixture('download-requested', 'preparing');
  try {
    assert.match(page.host.textContent, /2000 bytes/);
    assert.match(page.host.textContent, /elapsed 52 ms/);
    assert.match(page.host.textContent, /does not confirm/);
    assert.equal(page.host.querySelectorAll('input').length, 0);
    assert.equal(page.host.querySelectorAll('button').length, 0);
  } finally { page.close(); }
});

for (const phase of ['ready', 'matched', 'mismatch']) {
  test(`receipt phase ${phase} allows only optional local picker input`, async () => {
    const page = fixture('download-requested', phase);
    try {
      const picker = page.host.querySelectorAll('input')[0];
      assert.equal(picker.type, 'file');
      assert.equal(picker.accept, '.png,image/png');
      assert.equal(picker.dataset.tourAction, 'verify-export-file');
      assert.match(picker.getAttribute('aria-label'), /PNG/);
      const file = new Blob(['synthetic'], { type: 'image/png' });
      picker.files = { item(index) { return index === 0 ? file : null; } };
      await picker.dispatch('change');
      assert.equal(page.calls.length, 1);
      assert.equal(page.calls[0], file);
      assert.equal(picker.value, '');
    } finally { page.close(); }
  });
}

test('file picker reports an empty selection and clears its own value', async () => {
  const page = fixture('download-requested', 'ready');
  try {
    const picker = page.host.querySelectorAll('input')[0];
    picker.files = { item() { return null; } };
    await picker.dispatch('change');
    assert.deepEqual(page.calls, [null]);
    assert.equal(picker.value, '');
  } finally { page.close(); }
});

test('status text has a native live announcement and has no inline handlers', () => {
  const page = fixture('encoding');
  try {
    const statuses = page.host.querySelectorAll('p');
    assert.ok(statuses.some(node => node.getAttribute('role') === 'status'));
    assert.ok(statuses.some(node => node.getAttribute('aria-live') === 'polite'));
    for (const node of page.host.querySelectorAll('button')) {
      assert.equal(node.getAttribute('onclick'), null);
    }
    assert.equal(page.host.querySelectorAll('script').length, 0);
  } finally { page.close(); }
});
