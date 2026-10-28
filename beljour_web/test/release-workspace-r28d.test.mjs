import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountReleaseWorkspace } from '../dist/js/layout/release/mount.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function device() {
  return { secureContext: true, online: true, reducedMotion: false,
    canvasAvailable: true, encodingAvailable: true, pixelRatio: 2, screenWidth: 390 };
}

function fixture() {
  const page = judgeDOM();
  let current = 100;
  let exits = 0;
  const mode = mountReleaseWorkspace(page.document, page.host, () => { exits += 1; }, {
    now: () => current,
    device: device(),
    createCanvas(width, height) {
      const canvas = page.document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas;
    },
  });
  const find = name => page.host.querySelectorAll('button').find(row => row.dataset.releaseAction === name);
  const click = name => {
    const button = find(name);
    assert.ok(button, `missing ${name}`);
    assert.equal(button.disabled, false, `disabled ${name}`);
    return button.click();
  };
  const link = name => page.host.querySelectorAll('a').find(row => row.dataset.releaseRoute === name);
  return { ...page, mode, find, click, link, get exits() { return exits; },
    tick(ms) { current += ms; }, close() { mode.dispose(); page.close(); } };
}

test('mounted release screen shows meaningful requirements without falsely claiming green', () => {
  const page = fixture();
  try {
    assert.match(page.host.textContent, /Release readiness and real-demo handoff/);
    assert.match(page.host.textContent, /No production-release verdict is established/);
    assert.match(page.host.textContent, /Frozen 100,000-face release evidence/);
    assert.match(page.host.textContent, /Commercial licence/);
    assert.match(page.host.textContent, /Five Pro Commands/);
    assert.match(page.host.textContent, /not established by this browser/);
    assert.equal(page.host.querySelectorAll('li').filter(node => node.dataset.releaseCheck).length, 16);
  } finally { page.close(); }
});

test('starting a rehearsal enables real links and disables duplicate starts', async () => {
  const page = fixture();
  try {
    assert.equal(page.find('review-upload').disabled, true);
    await page.click('start');
    assert.equal(page.mode.state.snapshot.phase, 'running');
    assert.equal(page.find('start').disabled, true);
    assert.ok(page.link('upload'));
    assert.equal(page.find('review-upload').disabled, true);
  } finally { page.close(); }
});

test('native public route anchors are safe and never send tokens', () => {
  const page = fixture();
  try {
    const anchors = page.host.querySelectorAll('a').filter(a => a.dataset.releaseRoute);
    assert.equal(anchors.length, 11);
    for (const link of anchors) {
      assert.match(link.href, /^[a-z-]+\.html/);
      assert.equal(link.rel, 'noopener noreferrer');
      assert.equal(link.target, '_blank');
      assert.match(link.getAttribute('aria-label'), /separate tab/);
      assert.doesNotMatch(link.href, /http|\?|token|\.\.|\/\//);
    }
  } finally { page.close(); }
});

test('opening alone cannot become a reviewed action', async () => {
  const page = fixture();
  try {
    await page.click('start');
    await page.link('hair').click();
    assert.equal(page.mode.state.snapshot.localChecks, 0);
    assert.match(page.host.textContent, /Public route opened; outcome not verified/);
    await page.click('review-hair');
    assert.equal(page.mode.state.snapshot.localChecks, 1);
    assert.match(page.host.textContent, /Operator reported reviewing this screen/);
    assert.equal(page.mode.state.snapshot.productionReady, false);
  } finally { page.close(); }
});

test('refusal selection records only the selected fixed reason and can be cleared', async () => {
  const page = fixture();
  try {
    await page.click('start');
    const select = page.host.querySelectorAll('select').find(row => row.dataset.releaseReason === 'hair');
    select.value = 'offline';
    await page.click('refuse-hair');
    assert.match(page.host.textContent, /Refused: offline/);
    const row = page.mode.state.snapshot.rows.find(row => row.id === 'hair');
    assert.equal(row.refusal, 'offline');
    await page.click('clear-hair');
    assert.equal(page.mode.state.snapshot.rows.find(row => row.id === 'hair').refusal, null);
  } finally { page.close(); }
});

test('independent evidence is presented as read-only, never a pass button', () => {
  const page = fixture();
  try {
    for (const name of ['real-face', 'commercial-ip', 'submission', 'performance', 'accessibility']) {
      assert.equal(page.find(`review-${name}`), undefined);
      assert.equal(page.link(name), undefined);
    }
    assert.match(page.host.textContent, /independent evidence outside this browser/i);
  } finally { page.close(); }
});

test('five Pro Commands show no accidental availability without an owner port', () => {
  const page = fixture();
  try {
    assert.equal(page.host.querySelectorAll('li').filter(node => node.dataset.releaseCommand).length, 5);
    assert.equal(page.mode.commands.status, 'absent');
    for (const row of page.mode.commands.rows) {
      assert.equal(row.availability, 'unknown');
      assert.equal(row.independentResult, false);
    }
  } finally { page.close(); }
});

test('Canvas preflight is opt-in and does not change the tour or claim a gate', async () => {
  const page = fixture();
  try {
    assert.equal(page.host.textContent.includes('Canvas median'), false);
    await page.click('start');
    await page.click('measure-canvas');
    assert.match(page.host.textContent, /Canvas median/);
    assert.match(page.host.textContent, /Not a real-photo preview/);
    assert.equal(page.mode.state.snapshot.productionReady, false);
    assert.equal(page.mode.state.snapshot.localChecks, 0);
  } finally { page.close(); }
});

test('stop freezes the clock and disables new manual status controls', async () => {
  const page = fixture();
  try {
    await page.click('start');
    page.tick(500);
    await page.click('stop');
    const elapsed = page.mode.state.snapshot.elapsedMs;
    page.tick(5000);
    assert.equal(page.mode.state.snapshot.elapsedMs, elapsed);
    assert.equal(page.find('review-upload').disabled, true);
    assert.equal(page.find('refuse-upload').disabled, true);
  } finally { page.close(); }
});

test('reset after review clears rows without retaining a user photo', async () => {
  const page = fixture();
  try {
    await page.click('start');
    await page.link('upload').click();
    await page.click('review-upload');
    await page.click('measure-canvas');
    assert.equal(page.mode.state.snapshot.localChecks, 1);
    await page.click('reset');
    assert.equal(page.mode.state.snapshot.localChecks, 0);
    assert.equal(page.mode.state.snapshot.phase, 'not-started');
    assert.doesNotMatch(page.host.textContent, /Canvas median/);
  } finally { page.close(); }
});

test('exit disposes all in-memory values and calls the supplied exit once', async () => {
  const page = fixture();
  try {
    await page.click('start');
    await page.click('exit');
    assert.equal(page.exits, 1);
    assert.equal(page.mode.active(), false);
    assert.equal(page.host.textContent, '');
  } finally { page.close(); }
});

test('report exports no user data and makes no network request', async () => {
  const page = fixture();
  const oldFetch = globalThis.fetch;
  const oldCreate = URL.createObjectURL;
  const oldRevoke = URL.revokeObjectURL;
  const blobs = [];
  const revoked = [];
  let requests = 0;
  globalThis.fetch = () => { requests += 1; throw Error('network refused'); };
  URL.createObjectURL = blob => { blobs.push(blob); return 'blob:release-report'; };
  URL.revokeObjectURL = href => { revoked.push(href); };
  try {
    await page.click('start');
    await page.link('upload').click();
    await page.click('review-upload');
    await page.click('report');
    assert.equal(blobs.length, 1);
    assert.deepEqual(revoked, ['blob:release-report']);
    assert.equal(requests, 0);
    const data = JSON.parse(await blobs[0].text());
    assert.equal(data.providerVerified, false);
    assert.equal(data.realFaceVerified, false);
    assert.equal(data.hasPhotographs, false);
    assert.equal(data.reviewed, 1);
  } finally {
    if (oldFetch === undefined) delete globalThis.fetch;
    else globalThis.fetch = oldFetch;
    URL.createObjectURL = oldCreate;
    URL.revokeObjectURL = oldRevoke;
    page.close();
  }
});

test('all controls are native, named and avoid inline event handlers', () => {
  const page = fixture();
  try {
    for (const node of page.host.querySelectorAll('button')) {
      assert.equal(node.type, 'button');
      assert.ok(node.textContent.trim());
      assert.equal(node.getAttribute('onclick'), null);
    }
    for (const node of page.host.querySelectorAll('select')) {
      assert.ok(node.getAttribute('aria-label'));
    }
    assert.ok(page.host.querySelectorAll('h2').length >= 3);
    assert.ok(page.host.querySelectorAll('a').length >= 7);
  } finally { page.close(); }
});
