/** Full drawn demo replays actual local rendered pixels from bounded memory. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountContinuousDemo } from '../dist/js/layout/continuous/mount.js';
import { sequencePage } from './helpers/continuous-sequence-page.mjs';
import { pixels } from './helpers/local-frame-fixture.mjs';

async function openTryon(page) {
  await page.press('sample');
  for (let i = 0; i < 3; i += 1) await page.press('continue');
  for (const name of ['local', 'hair', 'face', 'mock']) {
    await page.tick(`consent-${name}`, true);
  }
  await page.press('continue');
  await page.press('sequence-play');
  for (let i = 0; i < 6; i += 1) assert.equal(page.flush(), true);
  for (const command of ['/IDENTITYLOCK', '/CLEANUP', '/UPSCALE', '/STUDIOQUALITY', '/POSEONLY']) {
    await page.press(`pro-${command.slice(1)}`);
  }
  await page.press('continue');
  await page.press('continue');
  assert.ok(page.host.textContent.includes('Offline styling examples'));
}

function button(page, name) {
  return page.host.querySelectorAll('button').find(b => b.dataset.cacheAction === name);
}

async function ready(page) {
  const prepare = button(page, 'prepare');
  assert.ok(prepare);
  await prepare.click();
  for (let i = 0; i < 30; i += 1) {
    await new Promise(resolve => setTimeout(resolve, 0));
    if (page.host.textContent.includes('Three local frames available')) break;
  }
  assert.match(page.host.textContent, /Three local frames available/);
}

test('whole drawn Judge Mode reaches the cache and replays three local images without network', async () => {
  const page = sequencePage();
  try {
    const tour = mountContinuousDemo(page.document, page.host, () => {}, {
      now: () => page.clock.now, sequenceTimer: page.timer,
      drawnFrameCapture: async id => pixels(id),
    });
    await openTryon(page);
    await ready(page);
    assert.equal(page.host.querySelectorAll('canvas').length, 2);
    assert.equal(page.network.length, 0);
    assert.equal(tour.state.snapshot.mockResult, 'not-requested');
    for (const id of ['hair', 'makeup', 'skin']) {
      await button(page, `select-${id}`).click();
      assert.match(page.host.textContent, /local illustration|local drawing|temporary memory/i);
    }
    await button(page, 'clear').click();
    assert.equal(page.host.querySelectorAll('canvas').length, 1);
    assert.equal(page.network.length, 0);
    tour.dispose();
  } finally { page.cleanup(); }
});

test('gallery does not warm itself or spend units when judge opens try-on', async () => {
  const page = sequencePage();
  try {
    const tour = mountContinuousDemo(page.document, page.host, () => {}, {
      now: () => page.clock.now, sequenceTimer: page.timer,
      drawnFrameCapture: async id => pixels(id),
    });
    await openTryon(page);
    assert.match(page.host.textContent, /No cached image frames/);
    assert.equal(page.host.querySelectorAll('canvas').length, 1);
    assert.equal(page.network.length, 0);
    tour.dispose();
  } finally { page.cleanup(); }
});

test('turning identity lock off deletes cached visual and disables rewarming', async () => {
  const page = sequencePage();
  try {
    const tour = mountContinuousDemo(page.document, page.host, () => {}, {
      now: () => page.clock.now, sequenceTimer: page.timer,
      drawnFrameCapture: async id => pixels(id),
    });
    await openTryon(page);
    await ready(page);
    await page.tick('identity-lock', false);
    assert.equal(page.host.querySelectorAll('canvas').length, 1);
    await button(page, 'prepare').click();
    assert.match(page.host.textContent, /Cache unavailable/);
    assert.equal(page.network.length, 0);
    tour.dispose();
  } finally { page.cleanup(); }
});

test('using the tour in provider-off mode still permits local frames', async () => {
  const page = sequencePage();
  try {
    const tour = mountContinuousDemo(page.document, page.host, () => {}, {
      now: () => page.clock.now, sequenceTimer: page.timer,
      drawnFrameCapture: async id => pixels(id),
    });
    await openTryon(page);
    tour.state.chooseMockMode('off');
    tour.state.setPermission('mock', false);
    tour.render();
    await ready(page);
    assert.equal(page.network.length, 0);
    assert.equal(page.host.querySelectorAll('canvas').length, 2);
    tour.dispose();
  } finally { page.cleanup(); }
});

test("new source clears cached result before any other person's image appears", async () => {
  const page = sequencePage();
  try {
    const tour = mountContinuousDemo(page.document, page.host, () => {}, {
      now: () => page.clock.now, sequenceTimer: page.timer,
      drawnFrameCapture: async id => pixels(id),
    });
    await openTryon(page);
    await ready(page);
    await page.press('back');
    tour.state.selectSubject('drawn-second', true);
    tour.render();
    assert.equal(page.host.querySelectorAll('canvas').length, 1);
    tour.dispose();
  } finally { page.cleanup(); }
});

test('cache report is a user-initiated download only', async () => {
  const page = sequencePage();
  try {
    const tour = mountContinuousDemo(page.document, page.host, () => {}, {
      now: () => page.clock.now, sequenceTimer: page.timer,
      drawnFrameCapture: async id => pixels(id),
    });
    await openTryon(page);
    const baseline = page.downloads;
    await ready(page);
    assert.equal(page.downloads, baseline);
    await button(page, 'report').click();
    assert.equal(page.downloads, baseline + 1);
    assert.equal(page.network.length, 0);
    tour.dispose();
  } finally { page.cleanup(); }
});

test('leaving try-on removes temporary visible cached Canvas', async () => {
  const page = sequencePage();
  try {
    const tour = mountContinuousDemo(page.document, page.host, () => {}, {
      now: () => page.clock.now, sequenceTimer: page.timer,
      drawnFrameCapture: async id => pixels(id),
    });
    await openTryon(page);
    await ready(page);
    await page.press('skip');
    assert.equal(page.host.querySelectorAll('.lg-cache-canvas').length, 0);
    assert.equal(page.network.length, 0);
    tour.dispose();
  } finally { page.cleanup(); }
});
