/** Real DOM interactions for a local-only preexisting PNG. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountContinuousDemo } from '../dist/js/layout/continuous/mount.js';
import { sequencePage } from './helpers/continuous-sequence-page.mjs';
import { localFiles, localPng } from './helpers/offline-import-fixture.mjs';

async function openTryon(page) {
  await page.press('sample');
  for (let i = 0; i < 3; i += 1) await page.press('continue');
  for (const consent of ['local', 'hair', 'face', 'mock']) {
    await page.tick(`consent-${consent}`, true);
  }
  await page.press('continue');
  await page.press('sequence-play');
  for (let i = 0; i < 6; i += 1) assert.equal(page.flush(), true);
  for (const command of ['/IDENTITYLOCK', '/CLEANUP', '/UPSCALE', '/STUDIOQUALITY', '/POSEONLY']) {
    await page.press(`pro-${command.slice(1)}`);
  }
  await page.press('continue');
  await page.press('continue');
  assert.equal(page.host.querySelectorAll('input').filter(node =>
    node.dataset.importType === 'manifest').length, 1);
}

function controls(page) {
  const inputs = page.host.querySelectorAll('input');
  return {
    manifest: inputs.find(node => node.dataset.importType === 'manifest'),
    png: inputs.find(node => node.dataset.importType === 'image'),
    check: page.host.querySelectorAll('button').find(node => node.dataset.offlineImportAction === 'check'),
    clear: page.host.querySelectorAll('button').find(node => node.dataset.offlineImportAction === 'clear'),
  };
}

async function upload(page, fileChanges = {}) {
  const files = await localFiles(fileChanges);
  const c = controls(page);
  c.manifest.files = [new File([files.manifest], 'operator.json', { type: 'application/json' })];
  c.png.files = [new File([files.png], 'operator.png', { type: 'image/png' })];
  await c.check.click();
  for (let i = 0; i < 25; i += 1) {
    await new Promise(resolve => setTimeout(resolve, 0));
    if (/match the selected manifest|was refused/.test(page.host.textContent)) break;
  }
}

function mounted(page, options = {}) {
  return mountContinuousDemo(page.document, page.host, () => {}, {
    now: () => page.clock.now,
    sequenceTimer: page.timer,
    ...options,
  });
}

test('full drawn tour can inspect a local PNG without provider units', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await openTryon(page);
    await upload(page);
    assert.match(page.host.textContent, /Bytes match\. You may inspect/);
    assert.match(page.host.textContent, /provider origin is not authenticated/);
    assert.equal(page.host.querySelectorAll('img').filter(node =>
      node.className === 'lg-local-import-preview').length, 1);
    assert.equal(page.network.length, 0);
    assert.equal(page.downloads, 1);
    assert.equal(mode.state.snapshot.mockResult, 'not-requested');
    mode.dispose();
  } finally { page.cleanup(); }
});

test('an operator-imported file cannot be treated as a provider try-on', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await openTryon(page);
    await upload(page);
    assert.equal(mode.state.snapshot.mockResult, 'not-requested');
    assert.match(page.host.textContent, /Live provider and real-face quality remain NOT VERIFIED/);
    assert.equal(page.network.length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('manifest with false vendor-success declaration is accepted as unverified only', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await openTryon(page);
    await upload(page, { providerVerified: false });
    assert.match(page.host.textContent, /provider origin is not authenticated/);
    assert.equal(page.network.length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('manifest claiming verified vendor processing is refused', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await openTryon(page);
    await upload(page, { providerVerified: true });
    assert.match(page.host.textContent, /Local file inspection did not pass/);
    assert.equal(page.host.querySelectorAll('img').length, 0);
    assert.equal(page.network.length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('operator can clear the local preview without resetting edit sequence', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await openTryon(page);
    await upload(page);
    assert.equal(page.host.querySelectorAll('img').length, 1);
    const button = controls(page).clear;
    await button.click();
    assert.equal(page.host.querySelectorAll('img').length, 0);
    assert.match(page.host.textContent, /Temporary local preview cleared/);
    assert.equal(mode.state.snapshot.step, 'tryon');
    assert.equal(mode.state.snapshot.applied.hair, true);
    assert.equal(page.network.length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('toggling identity lock off immediately clears an imported local image', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await openTryon(page);
    await upload(page);
    assert.equal(page.host.querySelectorAll('img').length, 1);
    await page.tick('identity-lock', false);
    assert.equal(page.host.querySelectorAll('img').length, 0);
    assert.equal(mode.state.snapshot.identityLock, false);
    assert.equal(page.network.length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('a local PNG preview is always separate from the original edit canvas', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await openTryon(page);
    await upload(page);
    assert.equal(page.host.querySelectorAll('canvas').length, 1);
    assert.equal(page.host.querySelectorAll('img').length, 1);
    await page.press('mock-preview');
    await page.press('continue');
    assert.equal(mode.state.snapshot.step, 'compare');
    assert.equal(page.host.querySelectorAll('img').length, 0);
    assert.equal(page.network.length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('exiting tour removes the local preview and leaves no file object in the DOM', async () => {
  const page = sequencePage();
  let exits = 0;
  try {
    const mode = mountContinuousDemo(page.document, page.host, () => { exits += 1; }, {
      now: () => page.clock.now,
      sequenceTimer: page.timer,
    });
    await openTryon(page);
    await upload(page);
    await page.press('exit');
    assert.equal(exits, 1);
    assert.equal(page.host.querySelectorAll('img').length, 0);
    assert.equal(page.host.children.length, 0);
    assert.equal(page.network.length, 0);
    assert.throws(() => mode.state.snapshot, /closed|disposed/i);
  } finally { page.cleanup(); }
});

test('judge can create companion JSON locally, then inspect matching PNG', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await openTryon(page);
    const png = await localPng();
    const prep = page.host.querySelectorAll('input').find(node =>
      node.dataset.offlineImportPrep === 'png');
    assert.ok(prep);
    prep.files = [new File([png], 'saved.png', { type: 'image/png' })];
    const create = page.host.querySelectorAll('button').find(node =>
      node.dataset.offlineImportAction === 'prepare');
    assert.ok(create);
    assert.equal(page.downloads, 0);
    await create.click();
    for (let i = 0; i < 25; i += 1) {
      await new Promise(resolve => setTimeout(resolve, 0));
      if (page.downloads > 0) break;
    }
    assert.equal(page.downloads, 1);
    assert.match(page.host.textContent, /Companion JSON requested/);
    assert.equal(page.network.length, 0);
    assert.equal(mode.state.snapshot.mockResult, 'not-requested');
    mode.dispose();
  } finally { page.cleanup(); }
});

test('companion JSON cannot be downloaded when identity lock is off', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await openTryon(page);
    await page.tick('identity-lock', false);
    const png = await localPng();
    const prep = page.host.querySelectorAll('input').find(node =>
      node.dataset.offlineImportPrep === 'png');
    prep.files = [new File([png], 'saved.png', { type: 'image/png' })];
    const create = page.host.querySelectorAll('button').find(node =>
      node.dataset.offlineImportAction === 'prepare');
    await create.click();
    assert.match(page.host.textContent, /Local consent, selected figure and identity lock are required/);
    assert.equal(page.downloads, 0);
    assert.equal(page.network.length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('companion preparation refuses the wrong file type without sending bytes', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await openTryon(page);
    const prep = page.host.querySelectorAll('input').find(node =>
      node.dataset.offlineImportPrep === 'png');
    prep.files = [new File(['fake'], 'fake.jpeg', { type: 'image/jpeg' })];
    const create = page.host.querySelectorAll('button').find(node =>
      node.dataset.offlineImportAction === 'prepare');
    await create.click();
    for (let i = 0; i < 5; i += 1) await new Promise(resolve => setTimeout(resolve, 0));
    assert.match(page.host.textContent, /Companion JSON could not be prepared/);
    assert.equal(page.downloads, 0);
    assert.equal(page.network.length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});
