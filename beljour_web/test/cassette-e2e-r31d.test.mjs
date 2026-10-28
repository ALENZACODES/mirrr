/** Full drawn tour including cached mock replay, with fetch blocked. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountContinuousDemo } from '../dist/js/layout/continuous/mount.js';
import { sequencePage } from './helpers/continuous-sequence-page.mjs';

async function moveToTryon(page) {
  await page.press('sample');
  for (let i = 0; i < 3; i += 1) await page.press('continue');
  for (const kind of ['local', 'hair', 'face', 'mock']) await page.tick(`consent-${kind}`, true);
  await page.press('continue');
  await page.press('sequence-play');
  for (let i = 0; i < 6; i += 1) assert.equal(page.flush(), true);
  assert.equal(page.timers.size, 0);
  for (const command of ['/IDENTITYLOCK', '/CLEANUP', '/UPSCALE', '/STUDIOQUALITY', '/POSEONLY']) {
    await page.press(`pro-${command.slice(1)}`);
  }
  await page.press('continue');
  await page.press('continue');
  assert.match(page.host.textContent, /Mock YouCam try-on/);
}

function cassetteAction(page, key) {
  return page.host.querySelectorAll('button').find(node => node.dataset.cassetteAction === key);
}

async function clickCassette(page, key) {
  const button = cassetteAction(page, key);
  assert.ok(button, `Missing cassette action ${key}`);
  assert.equal(button.disabled, false);
  await button.click();
}

function mounted(page, options = {}) {
  return mountContinuousDemo(page.document, page.host, () => {}, {
    now: () => page.clock.now,
    sequenceTimer: page.timer,
    ...options,
  });
}

test('seven edits lead to three offline cached examples and a no-charge sample bag', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await moveToTryon(page);
    for (const id of ['drawn-hair', 'drawn-makeup', 'drawn-skin']) {
      await clickCassette(page, `review-${id}`);
      assert.match(page.host.textContent, /Viewed: .*idea|Viewed: Skin match concept/);
      await clickCassette(page, 'bag-add');
    }
    assert.match(page.host.textContent, /3 of 3 local examples viewed/);
    assert.match(page.host.textContent, /Example category:/);
    assert.match(page.host.textContent, /Sample bag/);
    assert.ok(cassetteAction(page, 'bag-remove-drawn-makeup'));
    assert.equal(page.network.length, 0);
    assert.equal(page.downloads, 0);
    assert.equal(mode.state.snapshot.identityLock, true);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('the provider disabled branch continues through comparison without network', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await moveToTryon(page);
    await page.press('mode-off');
    await clickCassette(page, 'review-drawn-skin');
    assert.match(page.host.textContent, /Zero provider requests and zero units/);
    await page.press('mock-preview');
    assert.equal(mode.state.snapshot.mockResult, 'provider-disabled');
    await page.press('continue');
    assert.equal(mode.state.snapshot.step, 'compare');
    await page.tick('comparison', '42');
    assert.equal(mode.state.snapshot.comparePercent, 42);
    assert.equal(page.network.length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('by default the gallery cannot accidentally open a live provider page', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await moveToTryon(page);
    await clickCassette(page, 'review-drawn-hair');
    assert.equal(page.host.querySelectorAll('a').length, 0);
    assert.match(page.host.textContent, /hidden by the feature flag/);
    assert.equal(page.network.length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('a selected subject change does not reuse evidence from the first person', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await moveToTryon(page);
    await clickCassette(page, 'review-drawn-makeup');
    await clickCassette(page, 'bag-add');
    assert.match(page.host.textContent, /1 of 3 local examples viewed/);
    await page.press('back');
    for (let i = 0; i < 13; i += 1) await page.press('back');
    if (mode.state.snapshot.step === 'subject') await page.press('subject-drawn-second');
    assert.equal(page.network.length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('feature-flag-on path still requires explicit acknowledgement and a separate consent', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page, { providerScreensEnabled: true });
    await moveToTryon(page);
    await clickCassette(page, 'review-drawn-hair');
    assert.equal(page.host.querySelectorAll('a').length, 0);
    const check = page.host.querySelectorAll('input').find(input =>
      input.dataset.cassetteAction === 'separate-consent');
    assert.ok(check);
    check.checked = true;
    await check.dispatch('change');
    assert.equal(page.host.querySelectorAll('a').length, 1);
    assert.match(page.host.querySelectorAll('a')[0].getAttribute('href'), /\.html/);
    assert.equal(page.network.length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('a request to disable identity lock immediately clears the sample bag and route', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page, { providerScreensEnabled: true });
    await moveToTryon(page);
    await clickCassette(page, 'review-drawn-hair');
    await clickCassette(page, 'bag-add');
    await page.tick('identity-lock', false);
    assert.equal(mode.state.snapshot.identityLock, false);
    assert.match(page.host.textContent, /No examples in bag/);
    assert.equal(page.host.querySelectorAll('a').length, 0);
    assert.equal(page.network.length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('exiting the tour clears mock evidence and never triggers a provider request', async () => {
  const page = sequencePage();
  let exits = 0;
  try {
    const mode = mountContinuousDemo(page.document, page.host, () => { exits += 1; }, {
      now: () => page.clock.now,
      sequenceTimer: page.timer,
    });
    await moveToTryon(page);
    await clickCassette(page, 'review-drawn-hair');
    await clickCassette(page, 'bag-add');
    await page.press('exit');
    assert.equal(exits, 1);
    assert.equal(page.host.children.length, 0);
    assert.equal(page.network.length, 0);
    assert.equal(page.downloads, 0);
    assert.throws(() => mode.state.snapshot, /closed|disposed/i);
  } finally { page.cleanup(); }
});
