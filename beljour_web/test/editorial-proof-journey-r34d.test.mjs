/** Tour proof handoff remains separate from the image export action. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountContinuousDemo } from '../dist/js/layout/continuous/mount.js';
import { sequencePage } from './helpers/continuous-sequence-page.mjs';

function reachSave(page) {
  const mode = mountContinuousDemo(page.document, page.host, () => {}, {
    now: () => page.clock.now,
    sequenceTimer: page.timer,
  });
  for (let index = 0; index < 15; index += 1) mode.state.next(true);
  mode.render();
  return mode;
}

test('proof image is optional and never the same as the labelled photo export', async () => {
  const page = sequencePage();
  try {
    const mode = reachSave(page);
    assert.equal(mode.state.snapshot.step, 'save');
    const buttons = page.host.querySelectorAll('button');
    assert.ok(buttons.some(button => button.dataset.tourAction === 'save'));
    const review = buttons.find(button => button.dataset.editorialAction === 'proof-export');
    assert.ok(review);
    assert.equal(mode.state.snapshot.requestedDownload, false);
    await review.click();
    assert.equal(page.downloads, 1);
    assert.equal(mode.state.snapshot.requestedDownload, false);
    assert.match(page.host.textContent, /Saved file is not confirmed/);
    assert.equal(page.network.length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('new demo view retains proof and cover without multiplying handlers', async () => {
  const page = sequencePage();
  try {
    const mode = reachSave(page);
    for (let i = 0; i < 4; i += 1) mode.render();
    assert.equal(page.host.querySelectorAll('.lg-editorial-proof').length, 1);
    assert.equal(page.host.querySelectorAll('.lg-editorial-cover').length, 1);
    assert.equal(page.host.querySelectorAll('[role="status"]').length >= 1, true);
    assert.equal(page.network.length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});
