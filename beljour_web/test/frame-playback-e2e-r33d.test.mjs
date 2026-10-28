/** User-visible cached animation stays on local drawn pixels. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountContinuousDemo } from '../dist/js/layout/continuous/mount.js';
import { pixels } from './helpers/local-frame-fixture.mjs';
import { sequencePage } from './helpers/continuous-sequence-page.mjs';

async function stage(page) {
  await page.press('sample');
  for (let i = 0; i < 3; i += 1) await page.press('continue');
  for (const key of ['local', 'hair', 'face', 'mock']) {
    await page.tick(`consent-${key}`, true);
  }
  await page.press('continue');
  if (page.document.defaultView.matchMedia().matches) {
    for (let i = 0; i < 7; i += 1) await page.press('sequence-advance');
  } else {
    await page.press('sequence-play');
    for (let i = 0; i < 6; i += 1) assert.equal(page.flush(), true);
  }
  for (const name of ['/IDENTITYLOCK', '/CLEANUP', '/UPSCALE', '/STUDIOQUALITY', '/POSEONLY']) {
    await page.press(`pro-${name.slice(1)}`);
  }
  await page.press('continue');
  await page.press('continue');
}

function command(page, id) {
  return page.host.querySelectorAll('button').find(node => node.dataset.cacheAction === id);
}

function boot(page) {
  return mountContinuousDemo(page.document, page.host, () => {}, {
    now: () => page.clock.now,
    sequenceTimer: page.timer,
    drawnFrameCapture: async id => pixels(id),
  });
}

async function warm(page) {
  await command(page, 'prepare').click();
  for (let i = 0; i < 15; i += 1) {
    await new Promise(resolve => setTimeout(resolve, 0));
    if (page.host.textContent.includes('Three local frames available')) return;
  }
  assert.fail('cache did not warm');
}

test('one click replays three cached frames without another Canvas render or upload', async () => {
  const page = sequencePage();
  try {
    const tour = boot(page);
    await stage(page);
    await warm(page);
    assert.equal(page.network.length, 0);
    await command(page, 'replay-play').click();
    assert.match(page.host.textContent, /1 of 3 locally cached images/);
    assert.equal(page.flush(), true);
    assert.match(page.host.textContent, /2 of 3 locally cached images/);
    assert.equal(page.flush(), true);
    assert.match(page.host.textContent, /3 of 3 locally cached images/);
    assert.equal(page.flush(), false);
    assert.equal(page.downloads, 0);
    assert.equal(tour.state.snapshot.mockResult, 'not-requested');
    tour.dispose();
  } finally { page.cleanup(); }
});

test('Pause leaves frame visible but cancels scheduled advancement', async () => {
  const page = sequencePage();
  try {
    const tour = boot(page);
    await stage(page);
    await warm(page);
    await command(page, 'replay-play').click();
    await command(page, 'replay-pause').click();
    assert.equal(page.flush(), false);
    assert.match(page.host.textContent, /state: paused/);
    await command(page, 'replay-resume').click();
    assert.equal(page.flush(), true);
    assert.match(page.host.textContent, /2 of 3 locally cached images/);
    tour.dispose();
  } finally { page.cleanup(); }
});

test('reduced motion prevents autoplay while allowing Next cached frame', async () => {
  const page = sequencePage({ reducedMotion: true });
  try {
    const tour = boot(page);
    await stage(page);
    await warm(page);
    await command(page, 'replay-play').click();
    assert.match(page.host.textContent, /state: refused/);
    assert.equal(page.flush(), false);
    await command(page, 'replay-advance').click();
    assert.match(page.host.textContent, /1 of 3 locally cached images/);
    assert.equal(page.network.length, 0);
    tour.dispose();
  } finally { page.cleanup(); }
});

test('changing subject ends playback and clears cached images immediately', async () => {
  const page = sequencePage();
  try {
    const tour = boot(page);
    await stage(page);
    await warm(page);
    await command(page, 'replay-play').click();
    tour.state.selectSubject('drawn-second', true);
    tour.render();
    assert.equal(page.flush(), true);
    assert.match(page.host.textContent, /earlier cached frames were discarded|No cached image frames/i);
    assert.equal(page.network.length, 0);
    tour.dispose();
  } finally { page.cleanup(); }
});

test('explicit clear stops active playback and releases cached Canvas', async () => {
  const page = sequencePage();
  try {
    const tour = boot(page);
    await stage(page);
    await warm(page);
    await command(page, 'replay-play').click();
    await command(page, 'clear').click();
    assert.equal(page.flush(), false);
    assert.equal(page.host.querySelectorAll('.lg-cache-canvas').length, 0);
    assert.equal(page.network.length, 0);
    tour.dispose();
  } finally { page.cleanup(); }
});

test('the gallery remains separate from the approved mock try-on and export', async () => {
  const page = sequencePage();
  try {
    const tour = boot(page);
    await stage(page);
    await warm(page);
    await command(page, 'replay-play').click();
    page.flush();
    page.flush();
    assert.equal(tour.state.snapshot.mockResult, 'not-requested');
    assert.equal(tour.state.snapshot.requestedDownload, false);
    assert.equal(page.network.length, 0);
    tour.dispose();
  } finally { page.cleanup(); }
});
