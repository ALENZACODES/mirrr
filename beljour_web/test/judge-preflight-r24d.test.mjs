import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  demoCapabilitySummary,
  evaluateDemoCapabilities,
  readDemoCapabilities,
} from '../dist/js/mobile/judge-demo-preflight.js';
import { renderJudgePreflightPanel } from '../dist/js/ui/shell/judge-preflight-panel.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function capable(options = {}) {
  return evaluateDemoCapabilities({
    makeCanvas: () => ({ getContext: () => ({}), toBlob() {} }),
    makeObjectURL() {},
    imageBitmap() {},
    online: true,
    ...options,
  });
}

test('capability check does not contact a provider or issue network requests', () => {
  const called = [];
  const result = evaluateDemoCapabilities({
    makeCanvas: () => { called.push('canvas'); return { getContext: () => ({}) }; },
    online: true,
  });
  assert.deepEqual(called, ['canvas']);
  assert.equal(result.platform, 'browser-local');
  assert.equal(result.realYouCamVerified, false);
  assert.equal(result.releasedFaceQualityVerified, false);
});

test('the empty environment is reported honestly instead of inventing support', () => {
  const report = evaluateDemoCapabilities({});
  assert.equal(report.canRunIllustration, false);
  assert.equal(report.checks.length, 8);
  assert.equal(report.checks[0].status, 'unavailable');
  assert.equal(report.checks[1].status, 'unavailable');
  assert.equal(report.checks[2].status, 'unavailable');
  assert.equal(report.checks[3].status, 'not-tested');
  assert.equal(report.checks[4].status, 'not-tested');
  assert.equal(report.checks[5].status, 'not-tested');
});

test('healthy Canvas support does not automatically become a provider PASS', () => {
  const report = capable();
  assert.equal(report.canRunIllustration, true);
  assert.equal(report.checks[0].status, 'supported');
  assert.equal(report.checks[1].status, 'supported');
  assert.equal(report.checks[2].status, 'supported');
  assert.equal(report.checks[5].status, 'not-tested');
  assert.equal(report.checks[6].status, 'not-tested');
  assert.equal(report.checks[7].status, 'not-tested');
});

test('Canvas context failure is a capability unavailable, not a thrown error', () => {
  const report = capable({
    makeCanvas: () => ({ getContext() { throw Error('unavailable graphics'); } }),
  });
  assert.equal(report.canRunIllustration, false);
  assert.equal(report.checks[0].status, 'unavailable');
});

test('a null Canvas context is insufficient for an illustration claim', () => {
  const report = capable({ makeCanvas: () => ({ getContext: () => null }) });
  assert.equal(report.canRunIllustration, false);
});

test('the ability to request file export needs both Canvas and Blob URL support', () => {
  const withoutURL = capable({ makeObjectURL: null });
  const withoutBlob = capable({ makeCanvas: () => ({ getContext: () => ({}) }) });
  assert.equal(withoutURL.checks[2].status, 'unavailable');
  assert.equal(withoutBlob.checks[2].status, 'unavailable');
  assert.equal(withoutURL.checks[0].status, 'supported');
});

test('offline navigator state does not become a statement about API service health', () => {
  const report = capable({ online: false });
  assert.equal(report.checks[4].status, 'unavailable');
  assert.match(report.checks[4].explanation, /does not establish API availability/);
  assert.equal(report.realYouCamVerified, false);
});

test('keyboard review stays not tested until an actual interaction is recorded', () => {
  const before = capable({ keyboardObserved: false });
  const after = capable({ keyboardObserved: true });
  assert.equal(before.checks[3].status, 'not-tested');
  assert.equal(after.checks[3].status, 'supported');
  assert.match(after.checks[3].explanation, /not a full WCAG audit/);
});

test('summary uses exactly available, unavailable and not-tested totals', () => {
  const report = capable({ online: false });
  const text = demoCapabilitySummary(report);
  assert.match(text, /3 available/);
  assert.match(text, /1 unavailable/);
  assert.match(text, /4 not tested/);
  assert.match(text, /Provider connectivity is not checked/);
});

test('readDemoCapabilities can use the local synthetic DOM without requesting permissions', () => {
  const page = judgeDOM();
  try {
    const report = readDemoCapabilities(page.document);
    assert.equal(report.checks.length, 8);
    assert.equal(report.realYouCamVerified, false);
    assert.equal(report.checks[5].status, 'not-tested');
  } finally { page.close(); }
});

test('preflight panel displays every browser capability and an honest proof limit', () => {
  const page = judgeDOM();
  try {
    renderJudgePreflightPanel(page.document, page.host, capable());
    assert.ok(page.host.querySelector('details'));
    assert.equal(page.host.querySelectorAll('li').length, 8);
    assert.match(page.host.textContent, /Live YouCam integration/);
    assert.match(page.host.textContent, /Physical screen reader/);
    assert.match(page.host.textContent, /Separate live demo required/);
  } finally { page.close(); }
});

test('unavailable Canvas prompts refusal, not unverified processing output', () => {
  const page = judgeDOM();
  try {
    renderJudgePreflightPanel(page.document, page.host, evaluateDemoCapabilities({}));
    assert.match(page.host.textContent, /Local illustration not available/);
    assert.match(page.host.textContent, /Do not claim a successful render/);
    assert.equal(page.host.querySelectorAll('li').length, 8);
  } finally { page.close(); }
});

test('preflight details are opt-in and do not hijack keyboard navigation', () => {
  const page = judgeDOM();
  try {
    renderJudgePreflightPanel(page.document, page.host, capable());
    const details = page.host.querySelector('details');
    assert.equal(details.open, undefined);
    assert.equal(page.host.querySelectorAll('button').length, 0);
    assert.equal(page.host.querySelectorAll('input').length, 0);
  } finally { page.close(); }
});
