/** Browser-style local action path with no live provider or automatic export. */
/** Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountContinuousDemo } from '../dist/js/layout/continuous/mount.js';
import { PRO_COMMANDS } from '../dist/js/layout/continuous/pro-commands.js';
import { LOCAL_EDIT_SEQUENCE } from '../dist/js/layout/continuous/sequence-contract.js';
import { sequencePage } from './helpers/continuous-sequence-page.mjs';

async function toHair(page) {
  await page.press('sample');
  await page.press('continue');
  await page.press('continue');
  await page.press('continue');
  assert.equal(page.host.querySelectorAll('input').filter(item =>
    item.dataset.tourAction?.startsWith('consent-')).length, 4);
  await page.tick('consent-local', true);
  await page.tick('consent-hair', true);
  await page.tick('consent-face', true);
  await page.tick('consent-mock', true);
  await page.press('continue');
  assert.ok(page.action('sequence-play'));
}

function mounted(page) {
  const mode = mountContinuousDemo(page.document, page.host, () => {}, {
    now: () => page.clock.now,
    sequenceTimer: page.timer,
    sequenceIntervalMs: 650,
  });
  return mode;
}

test('seven local edits play from explicit permission and stop before Pro Commands', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await toHair(page);
    assert.equal(mode.state.snapshot.identityLock, true);
    assert.equal(page.action('sequence-play').disabled, false);
    await page.press('sequence-play');
    assert.equal(mode.state.snapshot.step, 'colour');
    assert.equal(mode.state.snapshot.applied.hair, true);
    for (let index = 1; index < 7; index += 1) {
      assert.equal(page.flush(), true);
      assert.equal(mode.state.snapshot.applied[LOCAL_EDIT_SEQUENCE[index].effect], true);
      const next = LOCAL_EDIT_SEQUENCE[index + 1]?.effect ?? 'pro';
      assert.equal(mode.state.snapshot.step, next);
      assert.equal(page.network.length, 0);
      assert.equal(page.downloads, 0);
    }
    assert.equal(page.timers.size, 0);
    assert.equal(page.action('sequence-shotlist').disabled, false);
    assert.match(page.host.textContent, /Stopped before provider or export/);
    assert.deepEqual(mode.state.snapshot.proCommandsReviewed, []);
    assert.equal(mode.state.snapshot.mockResult, 'not-requested');
    assert.equal(mode.state.snapshot.requestedDownload, false);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('one-step mode honours reduced motion and never schedules a timer', async () => {
  const page = sequencePage({ reducedMotion: true });
  try {
    const mode = mounted(page);
    await toHair(page);
    await page.press('sequence-play');
    assert.equal(page.timers.size, 0);
    assert.equal(mode.state.snapshot.step, 'hair');
    assert.match(page.host.textContent, /Reduced-motion mode/);
    for (let index = 0; index < 7; index += 1) {
      await page.press('sequence-advance');
      assert.equal(page.timers.size, 0);
      assert.equal(mode.state.snapshot.applied[LOCAL_EDIT_SEQUENCE[index].effect], true);
    }
    assert.equal(mode.state.snapshot.step, 'pro');
    assert.equal(page.action('sequence-shotlist').disabled, false);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('the sequence never grants consent automatically', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await page.press('sample');
    for (let i = 0; i < 4; i += 1) await page.press('skip');
    assert.equal(mode.state.snapshot.step, 'hair');
    assert.equal(mode.state.snapshot.permissions.local, false);
    assert.equal(page.action('sequence-play').disabled, true);
    assert.equal(page.action('sequence-advance').disabled, true);
    assert.equal(page.downloads, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('an active replay can be paused and resumed without duplicated edits', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await toHair(page);
    await page.press('sequence-play');
    await page.press('sequence-pause');
    assert.equal(page.timers.size, 0);
    assert.equal(mode.state.snapshot.step, 'colour');
    await page.press('sequence-resume');
    assert.equal(page.timers.size, 1);
    page.flush();
    assert.equal(mode.state.snapshot.step, 'concealer');
    assert.equal(mode.state.snapshot.applied.hair, true);
    assert.equal(mode.state.snapshot.applied.colour, true);
    assert.equal(page.timers.size, 1);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('visitor changing a decimal strength cancels automatic edits', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await toHair(page);
    await page.press('sequence-play');
    assert.equal(page.timers.size, 1);
    await page.tick('strength-colour', '4.2');
    assert.equal(page.timers.size, 0);
    assert.equal(mode.state.snapshot.levels.colour, 4.2);
    assert.equal(mode.state.snapshot.applied.colour, false);
    assert.match(page.host.textContent, /source or selected subject changed|editor moved|Stop drawn replay/i);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('leaving the walkthrough disposes timers and cannot create a file', async () => {
  const page = sequencePage();
  let exited = 0;
  try {
    const mode = mountContinuousDemo(page.document, page.host, () => { exited += 1; }, {
      now: () => page.clock.now,
      sequenceTimer: page.timer,
    });
    await toHair(page);
    await page.press('sequence-play');
    const oldCallback = [...page.timers.values()][0];
    await page.press('exit');
    oldCallback();
    assert.equal(exited, 1);
    assert.equal(page.timers.size, 0);
    assert.equal(page.downloads, 0);
    assert.equal(page.host.children.length, 0);
    assert.throws(() => mode.state.snapshot, /closed|disposed/);
  } finally { page.cleanup(); }
});

test('completed local replay continues to save and refuses an unsupported Canvas safely', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await toHair(page);
    await page.press('sequence-play');
    for (let index = 0; index < 6; index += 1) page.flush();
    assert.equal(mode.state.snapshot.step, 'pro');
    for (const command of PRO_COMMANDS) {
      await page.press(`pro-${command.slice(1)}`);
    }
    await page.press('continue');
    assert.equal(mode.state.snapshot.step, 'seasonal');
    await page.press('continue');
    assert.equal(mode.state.snapshot.step, 'tryon');
    assert.equal(mode.state.snapshot.mockResult, 'not-requested');
    await page.press('mock-preview');
    assert.equal(mode.state.snapshot.mockResult, 'mock-applied');
    await page.press('continue');
    assert.equal(mode.state.snapshot.step, 'compare');
    await page.tick('comparison', '63');
    await page.press('continue');
    assert.equal(mode.state.snapshot.step, 'save');
    assert.equal(page.downloads, 0);
    await page.press('save');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(mode.state.snapshot.requestedDownload, false);
    assert.equal(page.downloads, 0);
    assert.match(page.host.textContent, /could not be rendered/);
    assert.equal(page.network.length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('snapshot captions do not assert actual provider usage or automated real-face gates', async () => {
  const page = sequencePage();
  try {
    const mode = mounted(page);
    await toHair(page);
    await page.press('sequence-play');
    for (let index = 0; index < 6; index += 1) page.flush();
    const text = page.host.textContent;
    assert.match(text, /No live service runs/);
    assert.match(text, /face detection, identity preservation/);
    assert.match(text, /No voice, logos, API units or tracking/);
    assert.doesNotMatch(text, /live.*passed|real.face.*passed|production.*certified/i);
    mode.dispose();
  } finally { page.cleanup(); }
});
