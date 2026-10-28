import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Element } from './helpers/dom.mjs';
import { judgeDOM } from './judge-fixtures-r22d.mjs';
import { mountContinuousDemo } from '../dist/js/layout/continuous/mount.js';
import { PRO_COMMANDS } from '../dist/js/layout/continuous/pro-commands.js';
import { syntheticPng } from './helpers/synthetic-png.mjs';

function fixture() {
  const app = judgeDOM();
  const oldContext = Element.prototype.getContext;
  const oldToBlob = Element.prototype.toBlob;
  const oldImageData = globalThis.ImageData;
  const oldObject = URL.createObjectURL;
  const oldRevoke = URL.revokeObjectURL;
  const previousCreate = app.document.createElement;
  const calls = [];
  const files = [];
  const canvases = new WeakMap();
  let activeUrls = 0;
  app.document.createElement = (tag) => {
    const node = previousCreate(tag);
    node.ownerDocument = app.document;
    return node;
  };
  Element.prototype.getContext = function (type) {
    if (this.tagName !== 'CANVAS' || type !== '2d') return null;
    const node = this;
    if (canvases.has(node)) return canvases.get(node);
    const ctx = new Proxy({}, {
      get(_obj, method) {
        if (method === 'getImageData') return (_x, _y, width, height) => {
          const pixels = new Uint8ClampedArray(width * height * 4);
          for (let i = 3; i < pixels.length; i += 4) pixels[i] = 255;
          calls.push(['getImageData', width, height]);
          return { width, height, data: pixels };
        };
        if (method === 'putImageData') return (frame) => calls.push(['putImageData', frame.width, frame.height]);
        return (...args) => calls.push([method, ...args]);
      },
      set(_obj, prop, value) {
        calls.push(['set', prop, value]);
        return true;
      },
    });
    canvases.set(node, ctx);
    return ctx;
  };
  Element.prototype.toBlob = function (callback, type) {
    calls.push(['toBlob', type]);
    const encoded = syntheticPng(this.width, this.height);
    files.push(encoded);
    callback(encoded);
  };
  globalThis.ImageData = class ImageData {
    constructor(data, width, height) {
      this.data = data;
      this.width = width;
      this.height = height;
    }
  };
  URL.createObjectURL = () => { activeUrls += 1; return `blob:demo-${activeUrls}`; };
  URL.revokeObjectURL = (url) => calls.push(['revokeObjectURL', url]);
  return {
    ...app,
    calls,
    files,
    get activeUrls() { return activeUrls; },
    close() {
      app.document.createElement = previousCreate;
      Element.prototype.getContext = oldContext;
      if (oldToBlob === undefined) delete Element.prototype.toBlob;
      else Element.prototype.toBlob = oldToBlob;
      if (oldImageData === undefined) delete globalThis.ImageData;
      else globalThis.ImageData = oldImageData;
      URL.createObjectURL = oldObject;
      URL.revokeObjectURL = oldRevoke;
      app.close();
    },
  };
}

function button(host, action) {
  return host.querySelectorAll('button').find(row => row.dataset.tourAction === action);
}

function checkbox(host, action) {
  return host.querySelectorAll('input').find(row => row.dataset.tourAction === action);
}

async function press(host, action) {
  const node = button(host, action);
  assert.ok(node, `Missing ${action}`);
  assert.equal(node.disabled, false, `Disabled ${action}`);
  await node.click();
}

async function tick(host, action, enabled) {
  const node = checkbox(host, action);
  assert.ok(node, `Missing ${action}`);
  node.checked = enabled;
  await node.dispatch('change');
}

async function next(host) {
  await press(host, 'continue');
}

async function walkToConsent(host) {
  await press(host, 'sample');
  await next(host);
  await next(host);
  await next(host);
}

async function grant(host) {
  await tick(host, 'consent-local', true);
  await tick(host, 'consent-hair', true);
  await tick(host, 'consent-face', true);
  await tick(host, 'consent-mock', true);
  await next(host);
}

async function applyAll(host) {
  for (const effect of ['hair', 'colour', 'concealer', 'appearance', 'ratio', 'turn', 'posture']) {
    assert.ok(checkbox(host, 'identity-lock').checked, `${effect} lost the lock`);
    const strength = checkbox(host, `strength-${effect}`);
    assert.ok(strength, `Missing level for ${effect}`);
    assert.equal(strength.min, '1');
    assert.equal(strength.max, '5');
    assert.equal(strength.step, '0.1');
    strength.value = '3.7';
    await strength.dispatch('input');
    if (effect === 'appearance') await press(host, 'cue-fem');
    await press(host, `apply-${effect}`);
    await next(host);
  }
}

async function reviewCommands(host) {
  for (const command of PRO_COMMANDS) await press(host, `pro-${command.slice(1)}`);
  await next(host);
}

async function untilTryon(host) {
  await walkToConsent(host);
  await grant(host);
  await applyAll(host);
  await reviewCommands(host);
  await next(host);
}

test('full drawn-to-save flow works with mock adapter and permanent simulation label', async () => {
  const app = fixture();
  let exitCount = 0;
  let actualProviderCalls = 0;
  const beforeFetch = globalThis.fetch;
  globalThis.fetch = () => { actualProviderCalls += 1; throw Error('No network expected'); };
  try {
    const mode = mountContinuousDemo(app.document, app.host, () => { exitCount += 1; });
    await untilTryon(app.host);
    assert.equal(mode.state.snapshot.step, 'tryon');
    await press(app.host, 'mock-preview');
    assert.equal(mode.state.snapshot.mockResult, 'mock-applied');
    await next(app.host);
    const comparison = checkbox(app.host, 'comparison');
    comparison.value = '64';
    await comparison.dispatch('input');
    assert.equal(mode.state.snapshot.comparePercent, 64);
    await next(app.host);
    assert.equal(mode.state.snapshot.step, 'save');
    await press(app.host, 'save');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(mode.state.snapshot.requestedDownload, true);
    assert.equal(actualProviderCalls, 0);
    assert.equal(app.activeUrls, 1);
    assert.ok(app.calls.some(call => call[0] === 'putImageData'));
    assert.ok(app.calls.some(call => call[0] === 'fillText'
      && /SIMULATION/.test(String(call[1]))));
    assert.match(app.host.textContent, /Download requested/);
    assert.match(app.host.textContent, /No live provider or real-face acceptance evidence/);
    await press(app.host, 'exit');
    assert.equal(exitCount, 1);
  } finally {
    if (beforeFetch === undefined) delete globalThis.fetch;
    else globalThis.fetch = beforeFetch;
    app.close();
  }
});

test('provider switched off completes the rehearsal without any mock success claim', async () => {
  const app = fixture();
  try {
    const mode = mountContinuousDemo(app.document, app.host, () => {});
    await untilTryon(app.host);
    await press(app.host, 'mode-off');
    await press(app.host, 'mock-preview');
    assert.equal(mode.state.snapshot.mockResult, 'provider-disabled');
    assert.match(app.host.textContent, /Provider branch switched off|provider branch is off/i);
    assert.equal(mode.state.readiness('tryon').allowed, true);
    await next(app.host);
    assert.equal(mode.state.snapshot.step, 'compare');
    mode.dispose();
  } finally { app.close(); }
});

test('withdrawing consent before Save refuses any downloaded file', async () => {
  const app = fixture();
  try {
    const mode = mountContinuousDemo(app.document, app.host, () => {});
    await untilTryon(app.host);
    await press(app.host, 'mode-off');
    await press(app.host, 'mock-preview');
    await next(app.host);
    await press(app.host, 'skip');
    assert.equal(mode.state.snapshot.step, 'save');
    await tick(app.host, 'identity-lock', false);
    await press(app.host, 'save');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(mode.state.snapshot.requestedDownload, false);
    assert.equal(app.activeUrls, 0);
    assert.match(app.host.textContent, /Export requires local consent and identity lock/);
    mode.dispose();
  } finally { app.close(); }
});

test('a malicious mock response cannot result in download or provider evidence', async () => {
  const app = fixture();
  try {
    const mode = mountContinuousDemo(app.document, app.host, () => {}, {
      tryon: { kind: 'tour-tryon', mode: 'mock', preview: () => ({
        result: 'mock-applied', providerCalls: 1, unitsSpent: 3,
        imageSent: true, copy: 'fake result',
      }) },
    });
    await untilTryon(app.host);
    await press(app.host, 'mock-preview');
    assert.equal(mode.state.snapshot.mockResult, 'not-requested');
    assert.match(app.host.textContent, /Mock preview refused/);
    assert.equal(app.activeUrls, 0);
    mode.dispose();
  } finally { app.close(); }
});

test('seasonal unavailability remains honest, and is not a dead button', async () => {
  const app = fixture();
  try {
    const mode = mountContinuousDemo(app.document, app.host, () => {});
    await walkToConsent(app.host);
    await tick(app.host, 'consent-local', true);
    for (let n = 0; n < 9; n += 1) await press(app.host, 'skip');
    assert.equal(mode.state.snapshot.step, 'seasonal');
    assert.match(app.host.textContent, /no invented Halloween pack/i);
    assert.equal(app.host.querySelectorAll('button')
      .filter(row => row.dataset.tourAction?.startsWith('season-')).length, 0);
    await press(app.host, 'continue');
    assert.equal(mode.state.snapshot.step, 'tryon');
    mode.dispose();
  } finally { app.close(); }
});

async function untilReceipt(host, phase) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (host.querySelectorAll('p').some(row => row.dataset.receiptPhase === phase)) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 4));
  }
  assert.fail(`Local file confirmation did not reach ${phase}`);
}

test('Judge Mode may reopen its downloaded sample and confirm the same local bytes', async () => {
  const app = fixture();
  const oldFetch = globalThis.fetch;
  let networkCalls = 0;
  globalThis.fetch = () => { networkCalls += 1; throw Error('No network expected'); };
  try {
    const mode = mountContinuousDemo(app.document, app.host, () => {});
    await untilTryon(app.host);
    await press(app.host, 'mock-preview');
    await next(app.host);
    const divider = checkbox(app.host, 'comparison');
    divider.value = '64';
    await divider.dispatch('input');
    await next(app.host);
    assert.equal(mode.state.snapshot.step, 'save');
    assert.equal(app.host.querySelectorAll('input')
      .some(row => row.dataset.tourAction === 'verify-export-file'), false);
    await press(app.host, 'save');
    await untilReceipt(app.host, 'ready');
    assert.equal(app.files.length, 1);
    const picker = app.host.querySelectorAll('input')
      .find(row => row.dataset.tourAction === 'verify-export-file');
    assert.ok(picker);
    picker.files = { item(index) { return index === 0 ? app.files[0] : null; } };
    await picker.dispatch('change');
    await untilReceipt(app.host, 'matched');
    assert.match(app.host.textContent, /exactly matches the PNG requested/);
    assert.equal(networkCalls, 0);
    assert.equal(mode.state.snapshot.requestedDownload, true);
    mode.dispose();
  } finally {
    if (oldFetch === undefined) delete globalThis.fetch;
    else globalThis.fetch = oldFetch;
    app.close();
  }
});

test('turning identity lock off invalidates a locally matched downloaded PNG', async () => {
  const app = fixture();
  try {
    const mode = mountContinuousDemo(app.document, app.host, () => {});
    await untilTryon(app.host);
    await press(app.host, 'mock-preview');
    await next(app.host);
    const divider = checkbox(app.host, 'comparison');
    divider.value = '64';
    await divider.dispatch('input');
    await next(app.host);
    await press(app.host, 'save');
    await untilReceipt(app.host, 'ready');
    const picker = app.host.querySelectorAll('input')
      .find(row => row.dataset.tourAction === 'verify-export-file');
    picker.files = { item(index) { return index === 0 ? app.files[0] : null; } };
    await picker.dispatch('change');
    await untilReceipt(app.host, 'matched');
    await tick(app.host, 'identity-lock', false);
    assert.equal(app.host.querySelectorAll('input')
      .some(row => row.dataset.tourAction === 'verify-export-file'), false);
    assert.equal(app.host.querySelectorAll('p')
      .some(row => row.dataset.receiptPhase === 'matched'), false);
    await press(app.host, 'save');
    assert.match(app.host.textContent, /Export requires local consent and identity lock/);
    mode.dispose();
  } finally { app.close(); }
});
