// Lane D r22d-cp3: live DOM flow with local illustration only, no provider calls.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { mountJudgeMode } from '../dist/js/layout/judge-mode.js';
import { JUDGE_STEPS } from '../dist/js/layout/judge-contract.js';
import { headerFile, reportPage, sampleBytesPng } from './judge-fixtures-cp3-r22d.mjs';
import { control } from './judge-fixtures-r22d.mjs';

async function press(host, action) {
  const button = control(host, action);
  assert.ok(button, `missing ${action}`);
  await button.click();
}

async function check(host, action) {
  const checkbox = control(host, 'consent-' + action);
  assert.ok(checkbox);
  checkbox.checked = true;
  await checkbox.dispatch('change');
}

test('initial walk has a measured clock, status, guide toggle and no consent', () => {
  const app = reportPage();
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    assert.match(app.host.textContent, /Rehearsal time 0:00/);
    assert.match(app.host.textContent, /not a performance test/);
    assert.match(app.host.textContent, /Connection status unavailable/);
    assert.equal(app.host.getAttribute('aria-roledescription'), 'guided illustration');
    assert.equal(guide.session.snapshot.permissions.local, false);
    assert.equal(control(app.host, 'guide').getAttribute('aria-expanded'), 'false');
    guide.dispose();
  } finally { app.teardown(); }
});

test('help button toggles open and closed without changing the current step', async () => {
  const app = reportPage();
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    await press(app.host, 'guide');
    assert.equal(control(app.host, 'guide').getAttribute('aria-expanded'), 'true');
    assert.match(app.host.textContent, /What to show: Image/);
    assert.equal(guide.session.snapshot.step, 'source');
    await press(app.host, 'guide');
    assert.equal(control(app.host, 'guide').getAttribute('aria-expanded'), 'false');
    guide.dispose();
  } finally { app.teardown(); }
});

test('question-mark keyboard shortcut toggles help and retains focus', async () => {
  const app = reportPage();
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    await app.host.dispatch('keydown', { key: '?' });
    assert.equal(control(app.host, 'guide').getAttribute('aria-expanded'), 'true');
    assert.equal(control(app.host, 'guide').focused, true);
    await app.host.dispatch('keydown', { key: '?' });
    assert.equal(control(app.host, 'guide').getAttribute('aria-expanded'), 'false');
    guide.dispose();
  } finally { app.teardown(); }
});

test('Escape clears the guide and invokes exit without preserving sensitive pixels', async () => {
  const app = reportPage();
  try {
    let exits = 0;
    const guide = mountJudgeMode(app.document, app.host, () => { exits += 1; });
    await press(app.host, 'sample');
    assert.equal(guide.image.hasImage, true);
    await app.host.dispatch('keydown', { key: 'Escape' });
    assert.equal(exits, 1);
    assert.equal(guide.image.hasImage, false);
    assert.equal(app.host.children.length, 0);
    assert.equal(guide.session.snapshot.source, null);
  } finally { app.teardown(); }
});

test('guide does not intercept the native range controls during comparison', async () => {
  const app = reportPage();
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    for (let count = 0; count < 5; count += 1) await press(app.host, 'skip');
    assert.equal(guide.session.snapshot.step, 'compare');
    await app.host.dispatch('keydown', { key: 'ArrowRight', target: { tagName: 'INPUT' } });
    assert.equal(guide.session.snapshot.step, 'compare');
    guide.dispose();
  } finally { app.teardown(); }
});

test('skipping every demonstration action still shows an honest final report', async () => {
  const app = reportPage();
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    for (let index = 0; index < JUDGE_STEPS.length - 1; index += 1) {
      await press(app.host, 'skip');
    }
    assert.equal(guide.session.snapshot.step, 'plans');
    assert.match(app.host.textContent, /Skipped steps were not tested/);
    assert.match(app.host.textContent, /7/);
    assert.match(app.host.textContent, /0 — mocked/);
    assert.match(app.host.textContent, /Demo — no charge/);
    guide.dispose();
  } finally { app.teardown(); }
});

test('full guided local sample path exposes an in-pixel export choice and no live API result', async () => {
  const app = reportPage();
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    await press(app.host, 'sample');
    await press(app.host, 'next');
    for (const action of ['local', 'hair', 'face', 'mock']) await check(app.host, action);
    await press(app.host, 'next');
    await press(app.host, 'hair-chestnut');
    await press(app.host, 'next');
    await press(app.host, 'face-warm');
    await press(app.host, 'next');
    await press(app.host, 'mock-tryon');
    await press(app.host, 'next');
    assert.equal(guide.session.snapshot.step, 'compare');
    await press(app.host, 'next');
    assert.equal(control(app.host, 'export-save').disabled, false);
    assert.match(app.host.textContent, /label is burned/);
    await press(app.host, 'next');
    assert.equal(guide.session.snapshot.step, 'plans');
    assert.match(app.host.textContent, /Real YouCam calls from this guide/);
    assert.match(app.host.textContent, /0 — mocked/);
    assert.match(app.host.textContent, /Save/);
    guide.dispose();
  } finally { app.teardown(); }
});

test('wrong file signature is rejected without passing to the pixel decoder', async () => {
  const app = reportPage();
  const savedDecoder = globalThis.createImageBitmap;
  let decoded = 0;
  globalThis.createImageBitmap = async () => { decoded += 1; throw new Error('must not decode'); };
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    const picker = app.host.querySelector('input');
    picker.files = [headerFile(sampleBytesPng(), 'image/jpeg')];
    await picker.dispatch('change');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(decoded, 0);
    assert.equal(guide.session.snapshot.source, null);
    assert.match(app.host.textContent, /Unable to open that image/);
    guide.dispose();
  } finally {
    if (savedDecoder === undefined) delete globalThis.createImageBitmap;
    else globalThis.createImageBitmap = savedDecoder;
    app.teardown();
  }
});

test('valid local PNG header can be decoded without network, then resource is closed', async () => {
  const app = reportPage();
  const savedDecoder = globalThis.createImageBitmap;
  let closed = 0;
  globalThis.createImageBitmap = async () => ({
    width: 512,
    height: 640,
    close() { closed += 1; },
  });
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    const picker = app.host.querySelector('input');
    picker.files = [headerFile(sampleBytesPng(), 'image/png')];
    await picker.dispatch('change');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(guide.session.snapshot.source, 'upload');
    assert.equal(closed, 1);
    assert.match(app.host.textContent, /Local image selected/);
    guide.dispose();
    assert.equal(guide.image.hasImage, false);
  } finally {
    if (savedDecoder === undefined) delete globalThis.createImageBitmap;
    else globalThis.createImageBitmap = savedDecoder;
    app.teardown();
  }
});

test('source preflight cannot overwrite a newer drawn sample after a delayed header read', async () => {
  const app = reportPage();
  let finishRead;
  const bytes = sampleBytesPng();
  const fake = {
    type: 'image/png',
    size: 100,
    slice() { return { arrayBuffer: () => new Promise(resolve => { finishRead = resolve; }) }; },
  };
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    const picker = app.host.querySelector('input');
    picker.files = [fake];
    const pending = picker.dispatch('change');
    await Promise.resolve();
    await press(app.host, 'sample');
    assert.equal(guide.session.snapshot.source, 'sample');
    finishRead(bytes.buffer);
    await pending;
    await Promise.resolve();
    assert.equal(guide.session.snapshot.source, 'sample');
    guide.dispose();
  } finally { app.teardown(); }
});

test('new source modules retain privacy-network boundary, free stack and no third-party faces', () => {
  const names = [
    'src/layout/judge-rehearsal.ts',
    'src/layout/judge-readiness.ts',
    'src/mobile/judge-accessibility.ts',
    'src/mobile/judge-connectivity.ts',
    'src/mobile/judge-device-audit.ts',
    'src/ui/shell/judge-device-panel.ts',
    'src/ui/shell/judge-file-check.ts',
    'src/ui/shell/judge-guide.ts',
    'src/ui/shell/judge-report.ts',
  ];
  for (const name of names) {
    const code = readFileSync(new URL('../' + name, import.meta.url), 'utf8');
    assert.doesNotMatch(code, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
    assert.doesNotMatch(code, /localStorage|sessionStorage|indexedDB|Firebase/);
    assert.doesNotMatch(code, /stripe\.com|api\.youcam|googleapis\.com/);
  }
});
