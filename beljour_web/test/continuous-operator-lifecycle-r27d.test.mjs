import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountContinuousDemo } from '../dist/js/layout/continuous/mount.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function newScene() {
  const app = judgeDOM();
  let tick = 0;
  let exitCount = 0;
  const scene = mountContinuousDemo(app.document, app.host, () => { exitCount += 1; }, {
    now: () => tick,
  });
  return { ...app, scene, advance: ms => { tick += ms; }, get exitCount() { return exitCount; },
    close() { scene.dispose(); app.close(); } };
}

function button(host, name) {
  return host.querySelectorAll('button').find(item => item.dataset.tourAction === name);
}

async function press(host, name) {
  const element = button(host, name);
  assert.ok(element, `Missing ${name}`);
  assert.equal(element.disabled, false);
  await element.click();
}

async function moveTo(app, target) {
  for (let i = 0; i < 17; i += 1) {
    if (app.scene.state.snapshot.step === target) return;
    await press(app.host, 'skip');
  }
  assert.fail(`Cannot reach ${target}`);
}

async function returnTo(app, target) {
  for (let i = 0; i < 17; i += 1) {
    if (app.scene.state.snapshot.step === target) return;
    await press(app.host, 'back');
  }
  assert.fail(`Cannot return to ${target}`);
}

async function checkPage(app, id) {
  const link = app.host.querySelectorAll('a').find(item =>
    item.dataset.tourAction === `operator-open-${id}`);
  assert.ok(link, `Missing public ${id} link`);
  await link.click();
  await press(app.host, `operator-check-${id}`);
}

test('full manual route checklist is visibly self-reported and never release approved', async () => {
  const app = newScene();
  try {
    await press(app.host, 'sample');
    await moveTo(app, 'save');
    await press(app.host, 'operator-start');
    app.advance(8000);
    for (const id of ['photo', 'studio', 'hair', 'makeup', 'shade', 'commerce', 'trust']) {
      await checkPage(app, id);
      app.advance(6000);
    }
    assert.match(app.host.textContent, /7 of 7 screens manually checked/);
    assert.match(app.host.textContent, /self-reports/i);
    assert.match(app.host.textContent, /release gate/i);
    assert.match(app.host.textContent, /still missing or unverified/i);
  } finally { app.close(); }
});

test('changing the main subject invalidates all manual checks', async () => {
  const app = newScene();
  try {
    await press(app.host, 'sample');
    await moveTo(app, 'save');
    await press(app.host, 'operator-start');
    await checkPage(app, 'studio');
    assert.match(app.host.textContent, /1 of 7 screens manually checked/);
    await returnTo(app, 'subject');
    await press(app.host, 'subject-drawn-guest');
    await moveTo(app, 'save');
    assert.match(app.host.textContent, /0 of 7 screens manually checked/);
    assert.match(app.host.textContent, /clock not started/);
    assert.equal(app.scene.state.snapshot.selectedId, 'drawn-guest');
  } finally { app.close(); }
});

test('permission withdrawal and identity disabling both clear operator observations', async () => {
  const app = newScene();
  try {
    await press(app.host, 'sample');
    await moveTo(app, 'save');
    await press(app.host, 'operator-start');
    await checkPage(app, 'trust');
    const lock = app.host.querySelectorAll('input').find(input =>
      input.dataset.tourAction === 'identity-lock');
    assert.ok(lock);
    lock.checked = false;
    await lock.dispatch('change');
    assert.match(app.host.textContent, /0 of 7 screens manually checked/);
    assert.match(app.host.textContent, /clock not started/);
    await press(app.host, 'operator-start');
    await checkPage(app, 'photo');
    await returnTo(app, 'consent');
    const localConsent = app.host.querySelectorAll('input').find(input =>
      input.dataset.tourAction === 'consent-local');
    assert.ok(localConsent);
    localConsent.checked = false;
    await localConsent.dispatch('change');
    await moveTo(app, 'save');
    assert.match(app.host.textContent, /0 of 7 screens manually checked/);
  } finally { app.close(); }
});

test('early exit clears operator controls and invokes the exit callback once', async () => {
  const app = newScene();
  try {
    await moveTo(app, 'save');
    await press(app.host, 'operator-start');
    await press(app.host, 'exit');
    assert.equal(app.exitCount, 1);
    assert.equal(app.host.children.length, 0);
    app.scene.render();
    assert.equal(app.host.children.length, 0);
    app.scene.dispose();
    assert.equal(app.exitCount, 1);
  } finally { app.close(); }
});

test('a declined public operation cannot become an operator verified result', async () => {
  const app = newScene();
  try {
    await moveTo(app, 'save');
    await press(app.host, 'operator-start');
    await press(app.host, 'operator-refuse-hair-unavailable');
    assert.match(app.host.textContent, /operation was unavailable/i);
    assert.match(app.host.textContent, /1 refused/);
    assert.ok(!button(app.host, 'operator-check-hair'));
    await press(app.host, 'operator-clear-hair');
    assert.match(app.host.textContent, /0 refused/);
  } finally { app.close(); }
});

test('mock try-on and real-product links never share a private image or consent', async () => {
  const app = newScene();
  const oldFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => { calls += 1; throw Error('Remote request blocked'); };
  try {
    await press(app.host, 'sample');
    await moveTo(app, 'save');
    await press(app.host, 'operator-start');
    const anchors = app.host.querySelectorAll('a').filter(item =>
      item.dataset.tourAction?.startsWith('operator-open-'));
    for (const anchor of anchors) {
      assert.doesNotMatch(anchor.href, /\?|base64|data:|https?:|\.\./);
      await anchor.click();
    }
    assert.equal(calls, 0);
    assert.match(app.host.textContent, /0 of 7 screens manually checked/);
  } finally {
    if (oldFetch === undefined) delete globalThis.fetch;
    else globalThis.fetch = oldFetch;
    app.close();
  }
});
