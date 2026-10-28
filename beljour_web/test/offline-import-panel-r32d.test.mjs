/** Native, accessible local PNG file controls. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderOfflineImportPanel } from '../dist/js/ui/shell/continuous-offline-import-panel.js';
import { offlineImportStatus } from '../dist/js/layout/continuous/offline-import-contract.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';
import { localFiles } from './helpers/offline-import-fixture.mjs';

function fixture(phase = 'empty', url = null) {
  const page = judgeDOM();
  const actions = [];
  const callbacks = {
    async load(manifest, png) { actions.push({ kind: 'load', manifest, png }); },
    clear() { actions.push({ kind: 'clear' }); },
  };
  const status = offlineImportStatus(phase, {
    family: 'hair', width: 8, height: 8,
  });
  const view = renderOfflineImportPanel(page.document, status, url, callbacks);
  page.host.replaceChildren(view);
  const inputs = () => page.host.querySelectorAll('input');
  const buttons = () => page.host.querySelectorAll('button');
  return { page, view, status, actions, callbacks, inputs, buttons, close: () => page.close() };
}

test('empty panel contains no image until file integrity is checked', () => {
  const f = fixture();
  try {
    assert.equal(f.page.host.querySelectorAll('img').length, 0);
    assert.match(f.page.host.textContent, /Choose the JSON manifest and matching PNG/);
    assert.match(f.page.host.textContent, /ORIGIN NOT VERIFIED/);
    assert.equal(f.inputs().length, 3);
    assert.equal(f.buttons().length, 3);
    assert.equal(f.inputs()[0].accept, '.json,application/json');
    assert.equal(f.inputs()[1].accept, '.png,image/png');
  } finally { f.close(); }
});

test('every file input is explicitly labelled and has no automatic submission', () => {
  const f = fixture();
  try {
    for (const field of f.inputs()) {
      assert.equal(field.type, 'file');
      assert.ok(field.getAttribute('aria-label').length > 10);
      assert.equal(field.getAttribute('autocomplete'), 'off');
      assert.equal(field.getAttribute('onchange'), null);
    }
    assert.equal(f.page.host.querySelectorAll('form').length, 0);
    assert.equal(f.page.host.querySelectorAll('script').length, 0);
    assert.equal(f.page.host.querySelectorAll('a').length, 0);
  } finally { f.close(); }
});

test('a click without both files does not start a local read', async () => {
  const f = fixture();
  try {
    await f.buttons()[0].click();
    assert.equal(f.actions.length, 0);
    const files = await localFiles();
    f.inputs()[0].files = [new File([files.manifest], 'manifest.json', { type: 'application/json' })];
    await f.buttons()[0].click();
    assert.equal(f.actions.length, 0);
  } finally { f.close(); }
});

test('operator click passes only file handles to its local callback', async () => {
  const f = fixture();
  try {
    const files = await localFiles();
    const manifest = new File([files.manifest], 'manifest.json', { type: 'application/json' });
    const png = new File([files.png], 'preview.png', { type: 'image/png' });
    f.inputs()[0].files = [manifest];
    f.inputs()[1].files = [png];
    await f.buttons()[0].click();
    assert.equal(f.actions.length, 1);
    assert.equal(f.actions[0].manifest, manifest);
    assert.equal(f.actions[0].png, png);
    assert.equal(f.page.host.querySelectorAll('img').length, 0);
  } finally { f.close(); }
});

test('checking disables repeated action and announces progress politely', async () => {
  const f = fixture('checking');
  try {
    assert.equal(f.buttons()[0].disabled, true);
    const status = f.page.host.querySelectorAll('p').find(node => node.getAttribute('aria-live') === 'polite');
    assert.ok(status);
    assert.equal(status.getAttribute('role'), 'status');
    assert.match(status.textContent, /Keep this page open/);
  } finally { f.close(); }
});

test('a ready preview uses only a local blob URL and explicit provenance caveat', () => {
  const f = fixture('ready', 'blob:local-replay-1');
  try {
    const images = f.page.host.querySelectorAll('img');
    assert.equal(images.length, 1);
    assert.equal(images[0].src, 'blob:local-replay-1');
    assert.match(images[0].alt, /not verified/);
    assert.match(f.page.host.textContent, /Local hair file, 8 by 8 pixels/);
    assert.match(f.page.host.textContent, /Live provider and real-face quality remain NOT VERIFIED/);
    assert.equal(f.page.host.querySelectorAll('iframe').length, 0);
  } finally { f.close(); }
});

test('even ready status cannot make an image with an external URL', () => {
  for (const url of ['https://example.invalid/img.png', '//example.invalid/img.png',
    'data:image/png;base64,aaaa', 'javascript:alert(1)', null]) {
    const f = fixture('ready', url);
    try { assert.equal(f.page.host.querySelectorAll('img').length, 0); }
    finally { f.close(); }
  }
});

test('clear control is keyboard-operable and does not carry a filename', async () => {
  const f = fixture('ready', 'blob:local-replay-1');
  try {
    const clear = f.buttons().find(node => node.dataset.offlineImportAction === 'clear');
    assert.equal(clear.type, 'button');
    await clear.click();
    assert.deepEqual(f.actions, [{ kind: 'clear' }]);
    assert.doesNotMatch(f.page.host.textContent, /manifest\.json|preview\.png/);
  } finally { f.close(); }
});

test('disposed controls cannot trigger local reads or reset', async () => {
  const f = fixture('disposed');
  try {
    assert.ok(f.buttons().every(button => button.disabled));
    for (const button of f.buttons()) await button.click();
    assert.equal(f.actions.length, 0);
    assert.equal(f.page.host.querySelectorAll('img').length, 0);
  } finally { f.close(); }
});

test('the expandable guidance has five fixed no-network review steps', () => {
  const f = fixture();
  try {
    assert.equal(f.page.host.querySelectorAll('details').length, 1);
    assert.equal(f.page.host.querySelectorAll('summary').length, 1);
    assert.equal(f.page.host.querySelectorAll('ol').length, 1);
    assert.equal(f.page.host.querySelectorAll('li').length, 5);
    assert.match(f.page.host.textContent, /checks PNG chunks, dimensions and digest/);
    assert.doesNotMatch(f.page.host.textContent, /paid plan|checkout|credit card/i);
  } finally { f.close(); }
});
