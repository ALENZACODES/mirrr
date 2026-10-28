import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountContinuousDemo } from '../dist/js/layout/continuous/mount.js';
import { OPERATOR_ROUTE_IDS } from '../dist/js/layout/continuous/operator-contract.js';
import { TOUR_STEPS } from '../dist/js/layout/continuous/contract.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function button(host, id) {
  return host.querySelectorAll('button').find(row => row.dataset.tourAction === id);
}

async function press(host, id) {
  const element = button(host, id);
  assert.ok(element, `Missing ${id}`);
  assert.equal(element.disabled, false);
  await element.click();
}

async function reachLastStep(host) {
  for (let count = 0; count < TOUR_STEPS.length - 1; count += 1) {
    await press(host, 'skip');
  }
  assert.match(host.textContent, /Step 16 of 16/);
}

function fixture() {
  const app = judgeDOM();
  let current = 0;
  const mode = mountContinuousDemo(app.document, app.host, () => {}, {
    now: () => current,
  });
  return { ...app, mode, advance: ms => { current += ms; }, close() {
    mode.dispose();
    app.close();
  } };
}

test('final Judge Mode screen includes operator links as native same-origin anchors', async () => {
  const app = fixture();
  try {
    await reachLastStep(app.host);
    const anchors = app.host.querySelectorAll('a').filter(row =>
      row.dataset.tourAction?.startsWith('operator-open-'));
    assert.equal(anchors.length, 7);
    assert.deepEqual(anchors.map(row => row.dataset.tourAction.slice('operator-open-'.length)),
      OPERATOR_ROUTE_IDS);
    for (const anchor of anchors) {
      assert.match(anchor.href, /^[a-z-]+\.html/);
      assert.equal(anchor.rel, 'noopener noreferrer');
      assert.equal(anchor.target, '_blank');
      assert.match(anchor.getAttribute('aria-label'), /separate tab/);
      assert.doesNotMatch(anchor.href, /\?|\.\.|https?:|\/\//);
    }
  } finally { app.close(); }
});

test('operator must start the clock before an opened page is recorded', async () => {
  const app = fixture();
  try {
    await reachLastStep(app.host);
    assert.match(app.host.textContent, /clock not started/);
    const anchor = app.host.querySelectorAll('a').find(row =>
      row.dataset.tourAction === 'operator-open-studio');
    await anchor.click();
    assert.match(app.host.textContent, /Not visited in this rehearsal/);
    await press(app.host, 'operator-start');
    app.advance(1000);
    const link = app.host.querySelectorAll('a').find(row =>
      row.dataset.tourAction === 'operator-open-studio');
    await link.click();
    assert.match(app.host.textContent, /Route opened or opening attempted/);
    assert.ok(button(app.host, 'operator-check-studio'));
    await press(app.host, 'operator-check-studio');
    assert.match(app.host.textContent, /Operator reported inspecting this route/);
    assert.match(app.host.textContent, /1 of 7 screens manually checked/);
  } finally { app.close(); }
});

test('operator pause and refusal stay visible and never imply provider success', async () => {
  const app = fixture();
  try {
    await reachLastStep(app.host);
    await press(app.host, 'operator-start');
    app.advance(1200);
    await press(app.host, 'operator-pause');
    assert.match(app.host.textContent, /paused/);
    assert.ok(button(app.host, 'operator-resume'));
    await press(app.host, 'operator-refuse-hair-no-consent');
    assert.match(app.host.textContent, /Separate consent has not been confirmed/);
    assert.match(app.host.textContent, /no independent validation|separate verification/i);
    await press(app.host, 'operator-resume');
    await press(app.host, 'operator-stop');
    assert.equal(button(app.host, 'operator-resume'), undefined);
    assert.match(app.host.textContent, /stopped/);
  } finally { app.close(); }
});

test('clear removes self-reported approval without affecting other route checks', async () => {
  const app = fixture();
  try {
    await reachLastStep(app.host);
    await press(app.host, 'operator-start');
    for (const name of ['photo', 'trust']) {
      const link = app.host.querySelectorAll('a').find(row =>
        row.dataset.tourAction === `operator-open-${name}`);
      await link.click();
      await press(app.host, `operator-check-${name}`);
    }
    assert.match(app.host.textContent, /2 of 7 screens manually checked/);
    await press(app.host, 'operator-clear-trust');
    assert.match(app.host.textContent, /1 of 7 screens manually checked/);
    assert.match(app.host.textContent, /Not visited in this rehearsal/);
  } finally { app.close(); }
});

test('operator export is strictly local and does not contain image or user input', async () => {
  const app = fixture();
  const oldFetch = globalThis.fetch;
  const oldCreate = URL.createObjectURL;
  const oldRevoke = URL.revokeObjectURL;
  const downloads = [];
  const revokes = [];
  let networkCalls = 0;
  globalThis.fetch = () => { networkCalls += 1; throw Error('Remote network disallowed'); };
  URL.createObjectURL = blob => { downloads.push(blob); return 'blob:manual-report'; };
  URL.revokeObjectURL = url => { revokes.push(url); };
  try {
    await reachLastStep(app.host);
    await press(app.host, 'operator-start');
    await press(app.host, 'operator-report');
    assert.equal(downloads.length, 1);
    assert.deepEqual(revokes, ['blob:manual-report']);
    assert.equal(networkCalls, 0);
    const copy = await downloads[0].text();
    const data = JSON.parse(copy);
    assert.equal(data.completeForSubmission, false);
    assert.equal(data.providerVerified, false);
    assert.equal(data.realFaceVerified, false);
    assert.equal(data.rows.length, 7);
    assert.doesNotMatch(copy, /data:image|base64|filename|private|http/);
    assert.match(app.host.textContent, /self-report updated/);
  } finally {
    if (oldFetch === undefined) delete globalThis.fetch;
    else globalThis.fetch = oldFetch;
    URL.createObjectURL = oldCreate;
    URL.revokeObjectURL = oldRevoke;
    app.close();
  }
});

test('operator panel remains absent on earlier demo steps', async () => {
  const app = fixture();
  try {
    assert.equal(app.host.querySelector('#lg-cont-operator'), null);
    await press(app.host, 'sample');
    await press(app.host, 'continue');
    assert.equal(app.host.querySelector('#lg-cont-operator'), null);
  } finally { app.close(); }
});
