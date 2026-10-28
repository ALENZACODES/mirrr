import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountJudgeMode } from '../dist/js/layout/judge-mode.js';
import {
  checkDrawnBystanderPixels,
  renderJudgeIsolationPanel,
} from '../dist/js/ui/shell/judge-isolation-panel.js';
import { judgeDOM, control } from './judge-fixtures-r22d.mjs';

test('the main drawn face synthetic self-check has no changed bystander pixels', () => {
  const result = checkDrawnBystanderPixels('drawn-main');
  assert.equal(result.status, 'pass');
  assert.ok(result.metrics.changedPixels > 0);
  assert.equal(result.metrics.protectedChangedPixels, 0);
  assert.equal(result.metrics.changedAlphaPixels, 0);
  assert.match(result.description, /no real face was tested/i);
  assert.doesNotMatch(JSON.stringify(result.metrics), /pixels\s*:\s*\[/);
});

test('second drawn figure can be independently selected and checked', () => {
  const result = checkDrawnBystanderPixels('drawn-guest');
  assert.equal(result.status, 'pass');
  assert.ok(result.metrics.changedPixels > 0);
  assert.equal(result.metrics.protectedChangedPixels, 0);
  assert.ok(result.metrics.rejectedChanges > 0);
});

test('panel starts without made-up measurements or PASS labels', () => {
  const app = judgeDOM();
  try {
    renderJudgeIsolationPanel(app.document, app.host);
    assert.match(app.host.textContent, /No self-check run yet/);
    assert.match(app.host.textContent, /not a face-detector, phone, or real-photo result/i);
    assert.equal(control(app.host, 'isolation-main').type, 'button');
    assert.equal(control(app.host, 'isolation-guest').type, 'button');
    assert.equal(app.host.querySelectorAll('[aria-live="polite"]').length, 1);
  } finally { app.close(); }
});

test('both native button actions run the check and update an accessible status', async () => {
  const app = judgeDOM();
  try {
    renderJudgeIsolationPanel(app.document, app.host);
    await control(app.host, 'isolation-main').click();
    const node = app.host.querySelectorAll('p').find(n => n.id === 'lg-judge-isolation-status');
    assert.ok(node);
    assert.match(node.textContent, /pixel check passed/);
    assert.match(node.textContent, /0 protected pixels changed/);
    await control(app.host, 'isolation-guest').click();
    assert.match(node.textContent, /pixel check passed/);
    assert.equal(node.getAttribute('aria-live'), 'polite');
  } finally { app.close(); }
});

test('Judge Mode final plan displays the optional synthetic isolation self-check', async () => {
  const app = judgeDOM();
  try {
    const mode = mountJudgeMode(app.document, app.host, () => {});
    for (let i = 0; i < 7; i++) {
      await control(app.host, 'skip').click();
    }
    assert.equal(mode.session.snapshot.step, 'plans');
    assert.ok(control(app.host, 'isolation-main'));
    assert.ok(control(app.host, 'isolation-guest'));
    assert.match(app.host.textContent, /Tests only the built-in two-person drawing/);
    await control(app.host, 'isolation-main').click();
    assert.match(app.host.textContent, /no real face was tested/);
    mode.dispose();
  } finally { app.close(); }
});

test('the panel does not create a remote request or persist a face photograph', () => {
  const app = judgeDOM();
  const oldFetch = globalThis.fetch;
  const oldStorage = globalThis.localStorage;
  let networkCalls = 0;
  globalThis.fetch = async () => { networkCalls += 1; throw new Error('network refused'); };
  try {
    renderJudgeIsolationPanel(app.document, app.host);
    const result = checkDrawnBystanderPixels();
    assert.equal(result.status, 'pass');
    assert.equal(networkCalls, 0);
    assert.equal(globalThis.localStorage, oldStorage);
  } finally {
    globalThis.fetch = oldFetch;
    app.close();
  }
});
