import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inspectOperatorDevice, operatorDeviceCaption } from '../dist/js/layout/continuous/operator-device.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function supportedDocument() {
  return { createElement(tag) {
    if (tag === 'canvas') return { getContext() {}, toBlob() {} };
    if (tag === 'a') return { download: '' };
    if (tag === 'input') return { addEventListener() {} };
    throw Error('Unknown element');
  } };
}

test('public browser feature probe makes no network call and stores no fingerprint', () => {
  let calls = 0;
  const oldFetch = globalThis.fetch;
  globalThis.fetch = () => { calls += 1; throw Error('Remote call not allowed'); };
  try {
    const report = inspectOperatorDevice({ doc: supportedDocument(), online: false });
    assert.equal(report.supported, true);
    assert.equal(report.performanceMeasured, false);
    assert.equal(report.phoneVerified, false);
    assert.equal(report.photoSent, false);
    assert.equal(report.observedCapabilities.online, false);
    assert.equal(calls, 0);
    const copy = JSON.stringify(report);
    assert.doesNotMatch(copy, /userAgent|hardwareConcurrency|serial|address|base64|filename/);
    assert.match(operatorDeviceCaption(report), /No photo/);
  } finally {
    if (oldFetch === undefined) delete globalThis.fetch;
    else globalThis.fetch = oldFetch;
  }
});

test('unsupported encoder is an explicit unavailable capability', () => {
  const doc = { createElement(tag) {
    if (tag === 'canvas') return { getContext() {} };
    if (tag === 'a') return { download: '' };
    return { addEventListener() {} };
  } };
  const report = inspectOperatorDevice({ doc, online: true });
  assert.equal(report.supported, false);
  assert.equal(report.observedCapabilities.encoder, false);
  assert.equal(report.observedCapabilities.online, true);
  assert.match(report.note, /unavailable/);
});

test('element constructor failures become local unsupported states', () => {
  const report = inspectOperatorDevice({ doc: { createElement() { throw Error('No DOM'); } } });
  assert.equal(report.supported, false);
  assert.deepEqual(report.observedCapabilities, {
    canvas: false, encoder: false, download: false, keyboardInput: false, online: null,
  });
  assert.match(operatorDeviceCaption(report), /0\/4/);
});

test('a DOM polyfill is not mistaken for a real-phone certification', () => {
  const app = judgeDOM();
  try {
    const report = inspectOperatorDevice({ doc: app.document });
    assert.equal(report.phoneVerified, false);
    assert.equal(report.performanceMeasured, false);
    assert.equal(report.photoSent, false);
  } finally { app.close(); }
});
