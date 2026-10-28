/** Seeded interleaving checks for stale local exports. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ContinuousExportController } from '../dist/js/layout/continuous/export-controller.js';
import { DRAWN_PAIR } from '../dist/js/layout/subjects/contract.js';
import { syntheticPng } from './helpers/synthetic-png.mjs';

const CHANGES = [
  ['source change', (s, faces) => { s.sourceRevision += 1; faces.revision += 1; }],
  ['consent withdrawn', (s) => { s.permissions.local = false; }],
  ['lock withdrawn', (s) => { s.identityLock = false; }],
  ['selected figure changed', (s, faces) => {
    s.selectedId = 'drawn-guest';
    faces.selectedId = 'drawn-guest';
  }],
  ['hair colour changed', (s) => { s.levels.colour = 4.2; }],
  ['face edit reset', (s) => { s.applied.concealer = false; }],
  ['bystander box changed', (_s, faces) => {
    faces.boxes = faces.boxes.map(box => ({ ...box }));
    faces.boxes[1].y += 0.01;
  }],
];

function deferred() {
  let finish;
  const promise = new Promise(resolve => { finish = resolve; });
  return { promise, finish };
}

function setup(phase) {
  const output = syntheticPng(32, 24);
  const source = { width: 32, height: 24 };
  const state = {
    step: 'save', sourceLoaded: true, faceCount: 2, sourceRevision: 42,
    selectedId: 'drawn-main', identityLock: true,
    permissions: { local: true, hair: true, face: true, mock: false },
    applied: { hair: true, colour: true, concealer: true, appearance: true,
      ratio: false, turn: false, posture: false },
    levels: { hair: 3, colour: 3, concealer: 3, appearance: 3,
      ratio: 3, turn: 3, posture: 3 },
    appearanceCue: 'none', mockMode: 'off', mockResult: 'provider-disabled',
    comparePercent: 65, requestedDownload: false, completed: [], skipped: [],
    proCommandsReviewed: [], seasonalId: null,
  };
  const faces = {
    revision: 42, source: 'drawn', boxes: DRAWN_PAIR,
    selectedId: 'drawn-main', reason: 'drawn figure',
  };
  const delay = deferred();
  const downloaded = [];
  const canvases = [];
  const coordinator = new ContinuousExportController({
    current: () => ({ state, subjects: faces, original: source }),
    makeCanvas() {
      const canvas = { width: 0, height: 0 };
      canvases.push(canvas);
      return canvas;
    },
    render(canvas) {
      canvas.width = source.width;
      canvas.height = source.height;
      return { visual: 'illustration', protectedBystanders: true, note: 'drawn' };
    },
    encode: () => phase === 'encoding' ? delay.promise : Promise.resolve(output),
    verify: () => phase === 'validating' ? delay.promise : Promise.resolve({
      width: 32, height: 24, size: output.size,
      hasPixels: true, hasTextMetadata: false,
    }),
    requestDownload: file => downloaded.push(file),
    now: () => 42,
  });
  return { coordinator, state, faces, downloaded, canvases, delay, output };
}

for (const phase of ['encoding', 'validating']) {
  for (const [name, mutate] of CHANGES) {
    test(`a ${name} during ${phase} cannot download earlier pixels`, async () => {
      const run = setup(phase);
      const pending = run.coordinator.start();
      if (phase === 'validating') await new Promise(resolve => setImmediate(resolve));
      assert.equal(run.coordinator.snapshot.phase, phase);
      mutate(run.state, run.faces);
      run.delay.finish(phase === 'encoding' ? run.output : {
        width: 32, height: 24, size: run.output.size,
        hasPixels: true, hasTextMetadata: false,
      });
      const outcome = await pending;
      assert.equal(outcome.phase, 'cancelled');
      assert.equal(run.downloaded.length, 0);
      assert.equal(run.canvases.length, 1);
      assert.equal(run.canvases[0].width, 0);
      assert.equal(run.canvases[0].height, 0);
      assert.equal(outcome.verifiedByBrowser, false);
      assert.equal(outcome.photoStored, false);
    });
  }
}

test('an unchanged illustration is exactly one local download request per click', async () => {
  const run = setup('encoding');
  const first = run.coordinator.start();
  const second = await run.coordinator.start();
  assert.equal(second.reason, 'already-running');
  run.delay.finish(run.output);
  const finished = await first;
  assert.equal(finished.phase, 'download-requested');
  assert.equal(run.downloaded.length, 1);
  const after = await run.coordinator.start();
  assert.equal(after.phase, 'download-requested');
  assert.equal(run.downloaded.length, 2);
  assert.equal(after.attempt, 2);
});

test('cancel before and after a completed request has distinct user-visible states', async () => {
  const run = setup('encoding');
  const pending = run.coordinator.start();
  run.coordinator.cancel();
  assert.equal(run.coordinator.snapshot.reason, 'operator-cancelled');
  run.delay.finish(run.output);
  await pending;
  assert.equal(run.downloaded.length, 0);
  run.coordinator.reset();
  assert.equal(run.coordinator.snapshot.phase, 'idle');
  assert.equal(run.coordinator.snapshot.attempt, 0);
});

test('all late asynchronous completions remain inert after disposal', async () => {
  const run = setup('validating');
  const pending = run.coordinator.start();
  await new Promise(resolve => setImmediate(resolve));
  run.coordinator.dispose();
  run.delay.finish({ width: 32, height: 24, size: 333,
    hasPixels: true, hasTextMetadata: false });
  await pending;
  assert.equal(run.coordinator.snapshot.phase, 'disposed');
  assert.equal(run.downloaded.length, 0);
  assert.equal(run.canvases[0].width, 0);
});
