/** Deterministic frame-interval checks; no CI wall-clock thresholds. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  EditorialPacingProbe,
  frameClockForDocument,
  framePacingReport,
  pacingCaption,
  verifyFramePacingReport,
} from '../dist/js/layout/editorial/frame-pacing.js';
import { renderProofExperience } from '../dist/js/layout/editorial/proof-experience.js';
import { sequencePage } from './helpers/continuous-sequence-page.mjs';

const noEvidence = {
  drawnLoaded: false, subjectChosen: false, localPermission: false,
  editCount: 0, requestedDownload: false, mockTryon: false, cacheFrames: 0,
};

function fakeFrameClock() {
  const queue = new Map();
  let nextId = 0;
  let visible = true;
  let cancelled = 0;
  return {
    clock: {
      request(callback) {
        const id = ++nextId;
        queue.set(id, callback);
        return id;
      },
      cancel(handle) {
        cancelled += 1;
        queue.delete(handle);
      },
      visible() { return visible; },
    },
    tick(time) {
      const [id, callback] = queue.entries().next().value ?? [];
      if (!callback) throw Error('No queued frame');
      queue.delete(id);
      callback(time);
    },
    hide() { visible = false; },
    get pending() { return queue.size; },
    get cancelled() { return cancelled; },
  };
}

test('nearest-rank median/p95 are computed from synthetic intervals', () => {
  const result = framePacingReport([16, 16, 16, 17, 16, 17, 17, 16, 16, 28]);
  assert.deepEqual(result, {
    format: 'beljour-editorial-pacing/1',
    outcome: 'measured',
    samples: 10,
    medianMs: 16,
    p95Ms: 28,
    fpsTargetMs: 16.7,
    editorPerformanceVerified: false,
  });
  assert.match(pacingCaption(result), /not proof of editor performance/);
});

for (const intervals of [
  [], Array(9).fill(16), Array(121).fill(16),
  [...Array(9).fill(16), 0],
  [...Array(9).fill(16), -1],
  [...Array(9).fill(16), Number.POSITIVE_INFINITY],
  [...Array(9).fill(16), Number.NaN],
  [...Array(9).fill(16), 10_001],
]) {
  test(`invalid timing data is refused: ${String(intervals.at(-1))}`, () => {
    assert.throws(() => framePacingReport(intervals));
  });
}

test('a synthetic animation completes without global timers or network', async () => {
  const scheduler = fakeFrameClock();
  const probe = new EditorialPacingProbe(scheduler.clock);
  const work = probe.start(10);
  assert.equal(probe.running, true);
  for (let index = 0; index <= 10; index += 1) {
    assert.equal(scheduler.pending, 1);
    scheduler.tick(index * 16.6);
  }
  const result = await work;
  assert.equal(result.outcome, 'measured');
  assert.equal(result.samples, 10);
  assert.equal(result.editorPerformanceVerified, false);
  assert.ok(result.medianMs > 16 && result.medianMs < 17);
  assert.equal(scheduler.pending, 0);
  assert.equal(probe.running, false);
});

test('cancellation releases the scheduled callback and returns no fabricated timings', async () => {
  const scheduler = fakeFrameClock();
  const probe = new EditorialPacingProbe(scheduler.clock);
  const work = probe.start(10);
  scheduler.tick(0);
  scheduler.tick(16);
  probe.cancel();
  const result = await work;
  assert.equal(result.outcome, 'cancelled');
  assert.equal(result.samples, 0);
  assert.equal(result.medianMs, null);
  assert.equal(result.p95Ms, null);
  assert.equal(scheduler.pending, 0);
  assert.equal(scheduler.cancelled, 1);
  assert.equal(probe.running, false);
});

test('tab-hidden refusal does not start a scheduler', async () => {
  const scheduler = fakeFrameClock();
  scheduler.hide();
  const result = await new EditorialPacingProbe(scheduler.clock).start(10);
  assert.equal(result.outcome, 'unavailable');
  assert.equal(scheduler.pending, 0);
});

test('becoming hidden mid-measurement invalidates all partial intervals', async () => {
  const scheduler = fakeFrameClock();
  const probe = new EditorialPacingProbe(scheduler.clock);
  const work = probe.start(10);
  scheduler.tick(0);
  scheduler.hide();
  scheduler.tick(16);
  const result = await work;
  assert.equal(result.outcome, 'unavailable');
  assert.equal(result.samples, 0);
  assert.equal(scheduler.pending, 0);
});

test('duplicate measurements and invalid frame counts refuse safely', async () => {
  const scheduler = fakeFrameClock();
  const probe = new EditorialPacingProbe(scheduler.clock);
  const work = probe.start(10);
  assert.throws(() => probe.start(10), /already running/);
  probe.cancel();
  await work;
  for (const count of [0, 9, 121, 10.5, Infinity]) {
    assert.throws(() => probe.start(count));
  }
});

test('non-monotonic browser timestamps cannot be measured', async () => {
  const scheduler = fakeFrameClock();
  const probe = new EditorialPacingProbe(scheduler.clock);
  const work = probe.start(10);
  scheduler.tick(20);
  scheduler.tick(19);
  assert.equal((await work).outcome, 'unavailable');
  assert.equal(scheduler.pending, 0);
});

test('forged editor certification is rejected at the report boundary', () => {
  const result = framePacingReport(Array(12).fill(16));
  assert.throws(() => verifyFramePacingReport({ ...result, editorPerformanceVerified: true }));
  assert.throws(() => verifyFramePacingReport({ ...result, p95Ms: -1 }));
  assert.throws(() => verifyFramePacingReport({ ...result, extra: true }));
});

test('an unsupported browser leaves an accessible disabled control', () => {
  const page = sequencePage();
  try {
    assert.equal(frameClockForDocument(page.document), null);
    const panel = renderProofExperience(page.document, noEvidence);
    page.host.append(panel);
    const pacing = panel.querySelectorAll('button').find(button => button.dataset.editorialAction === 'frame-pacing');
    assert.ok(pacing);
    assert.equal(pacing.disabled, true);
    assert.match(page.host.textContent, /Optional motion timing/);
  } finally { page.cleanup(); }
});

test('an injected platform frame clock runs only after a user clicks', async () => {
  const page = sequencePage();
  const fake = fakeFrameClock();
  const original = page.document.defaultView;
  page.document.defaultView = {
    ...original,
    requestAnimationFrame: (callback) => fake.clock.request(callback),
    cancelAnimationFrame: (id) => fake.clock.cancel(id),
  };
  try {
    const panel = renderProofExperience(page.document, noEvidence);
    page.host.append(panel);
    const pacing = panel.querySelectorAll('button').find(button => button.dataset.editorialAction === 'frame-pacing');
    assert.equal(fake.pending, 0);
    await pacing.click();
    assert.equal(fake.pending, 1);
    for (let index = 0; index <= 48; index += 1) fake.tick(index * 17);
    await Promise.resolve();
    assert.equal(fake.pending, 0);
    assert.equal(pacing.disabled, false);
    assert.match(page.host.textContent, /median 17 ms/);
    assert.match(page.host.textContent, /not proof of editor performance/);
    assert.equal(page.network.length, 0);
  } finally {
    page.document.defaultView = original;
    page.cleanup();
  }
});
