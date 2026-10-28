/** Transaction and stale-export regression tests. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ContinuousExportController } from '../dist/js/layout/continuous/export-controller.js';
import { DRAWN_PAIR } from '../dist/js/layout/subjects/contract.js';
import { syntheticPng } from './helpers/synthetic-png.mjs';

function fixture() {
  const original = { width: 8, height: 8 };
  const snapshot = {
    step: 'save', sourceLoaded: true, sourceRevision: 1, faceCount: 2,
    selectedId: 'drawn-main',
    permissions: { local: true, hair: true, face: true, mock: false },
    identityLock: true,
    levels: { hair: 3, colour: 3, concealer: 3, appearance: 3,
      ratio: 3, turn: 3, posture: 3 },
    applied: { hair: true, colour: true, concealer: true, appearance: true,
      ratio: true, turn: true, posture: true },
    appearanceCue: 'none', mockMode: 'off', mockResult: 'provider-disabled',
    comparePercent: 50, requestedDownload: false,
    completed: [], skipped: [], proCommandsReviewed: [], seasonalId: null,
  };
  const subjects = {
    revision: 1, source: 'drawn', boxes: DRAWN_PAIR, selectedId: 'drawn-main',
    reason: 'original drawing',
  };
  const canvases = [];
  const downloads = [];
  const changes = [];
  const requested = [];
  const encoded = syntheticPng(8, 8);
  let time = 10;
  let requestedThrow = false;
  let renderResult = { visual: 'illustration', protectedBystanders: true, note: 'drawn' };
  let encoding = () => Promise.resolve(encoded);
  let verifying = undefined;
  const port = {
    current: () => ({ original, state: snapshot, subjects }),
    makeCanvas() {
      const canvas = { width: 0, height: 0 };
      canvases.push(canvas);
      return canvas;
    },
    render(target) {
      target.width = original.width;
      target.height = original.height;
      return renderResult;
    },
    encode(target) { return encoding(target); },
    requestDownload(output) {
      if (requestedThrow) throw Error('Browser refused');
      downloads.push(output);
    },
    requested(duration, output) {
      requested.push({ duration, output });
      snapshot.requestedDownload = true;
    },
    now() { time += 17; return time; },
    notify(status) { changes.push(status); },
  };
  const controller = new ContinuousExportController(port);
  return {
    controller, port, snapshot, subjects, original, canvases, downloads, changes,
    requested, encoded,
    setEncoding(fn) { encoding = fn; },
    setVerifying(fn) { verifying = fn; port.verify = fn; },
    setRender(result) { renderResult = result; },
    setDownloadFailure(enabled) { requestedThrow = enabled; },
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

async function assertRefusedWith(setup, reason) {
  const result = await setup.controller.start();
  assert.equal(result.phase, 'refused');
  assert.equal(result.reason, reason);
  assert.equal(setup.downloads.length, 0);
  assert.equal(setup.requested.length, 0);
  assert.equal(result.verifiedByBrowser, false);
  assert.equal(result.photoStored, false);
  for (const canvas of setup.canvases) {
    assert.equal(canvas.width, 0);
    assert.equal(canvas.height, 0);
  }
}

test('a valid single request emits one bounded labelled PNG request', async () => {
  const setup = fixture();
  const result = await setup.controller.start();
  assert.equal(result.phase, 'download-requested');
  assert.equal(result.pending, false);
  assert.equal(result.reason, 'none');
  assert.equal(result.attempt, 1);
  assert.equal(setup.downloads.length, 1);
  assert.equal(setup.requested.length, 1);
  assert.equal(setup.downloads[0].filename, 'BELJOUR-FULL-BEAUTY-STUDIO-guided-simulation.png');
  assert.equal(setup.downloads[0].file, setup.encoded);
  assert.equal(setup.downloads[0].width, 8);
  assert.equal(setup.downloads[0].height, 8);
  assert.equal(setup.snapshot.requestedDownload, true);
  assert.equal(result.bytes, setup.encoded.size);
  assert.equal(typeof result.durationMs, 'number');
  assert.deepEqual(setup.changes.map(row => row.phase), [
    'rendering', 'encoding', 'validating', 'download-requested',
  ]);
  assert.equal(setup.canvases[0].width, 0);
  assert.equal(setup.canvases[0].height, 0);
  assert.match(result.message, /not independently confirmed/);
});

test('no render runs when local consent is missing', async () => {
  const setup = fixture();
  setup.snapshot.permissions.local = false;
  const result = await setup.controller.start();
  assert.equal(result.phase, 'refused');
  assert.equal(setup.canvases.length, 0);
  assert.equal(setup.downloads.length, 0);
});

test('no render runs when identity lock was withdrawn', async () => {
  const setup = fixture();
  setup.snapshot.identityLock = false;
  const result = await setup.controller.start();
  assert.equal(result.phase, 'refused');
  assert.equal(setup.canvases.length, 0);
});

test('no render runs without valid checked subject geometry', async () => {
  const setup = fixture();
  setup.subjects.selectedId = 'not-a-person';
  const result = await setup.controller.start();
  assert.equal(result.phase, 'refused');
  assert.equal(setup.canvases.length, 0);
});

test('target rendering refuses when a bystander has not been preserved', async () => {
  const setup = fixture();
  setup.setRender({ visual: 'illustration', protectedBystanders: false, note: 'unverified' });
  await assertRefusedWith(setup, 'pixel-isolation');
});

test('an unchanged original cannot be falsely certified as an edited export', async () => {
  const setup = fixture();
  setup.setRender({ visual: 'original', protectedBystanders: true, note: 'unchanged' });
  await assertRefusedWith(setup, 'pixel-isolation');
});

test('Canvas output dimensions must match the original source', async () => {
  const setup = fixture();
  setup.port.render = (target) => {
    target.width = 7;
    target.height = 8;
    return { visual: 'illustration', protectedBystanders: true, note: 'cropped' };
  };
  await assertRefusedWith(setup, 'render-failed');
});

test('a throwing renderer cannot start a file encoder', async () => {
  const setup = fixture();
  setup.port.render = () => { throw Error('No Canvas available'); };
  await assertRefusedWith(setup, 'render-failed');
});

test('encoding failure leaves the original source and no issued file', async () => {
  const setup = fixture();
  setup.setEncoding(() => Promise.reject(Error('toBlob returned null')));
  await assertRefusedWith(setup, 'encoding-failed');
});

test('invalid content is refused after decoding, not sent to download', async () => {
  const setup = fixture();
  setup.setEncoding(async () => new Blob(['not a PNG'], { type: 'image/png' }));
  await assertRefusedWith(setup, 'invalid-png');
});

test('an incorrect image size is refused by the runtime content validator', async () => {
  const setup = fixture();
  setup.setEncoding(async () => syntheticPng(9, 9));
  await assertRefusedWith(setup, 'invalid-png');
});

test('browser download refusal does not mark the export requested', async () => {
  const setup = fixture();
  setup.setDownloadFailure(true);
  await assertRefusedWith(setup, 'download-unavailable');
});

test('a structurally invalid validator outcome is refused', async () => {
  const setup = fixture();
  setup.setVerifying(async () => ({
    width: 8, height: 8, size: 100, hasPixels: true, hasTextMetadata: true,
  }));
  await assertRefusedWith(setup, 'invalid-png');
});

test('a renderer may not silently change the canvas size during encoding', async () => {
  const setup = fixture();
  setup.setVerifying(async () => ({
    width: 99, height: 8, size: 100, hasPixels: true, hasTextMetadata: false,
  }));
  await assertRefusedWith(setup, 'invalid-png');
});

test('a repeated click while encoding cannot start another download', async () => {
  const setup = fixture();
  const queue = deferred();
  setup.setEncoding(() => queue.promise);
  const first = setup.controller.start();
  assert.equal(setup.controller.snapshot.phase, 'encoding');
  const repeated = await setup.controller.start();
  assert.equal(repeated.reason, 'already-running');
  assert.equal(setup.canvases.length, 1);
  queue.resolve(setup.encoded);
  assert.equal((await first).phase, 'download-requested');
  assert.equal(setup.downloads.length, 1);
});

test('user cancellation during encoding drops stale work without download', async () => {
  const setup = fixture();
  const queue = deferred();
  setup.setEncoding(() => queue.promise);
  const attempt = setup.controller.start();
  setup.controller.cancel();
  assert.equal(setup.controller.snapshot.phase, 'cancelled');
  assert.equal(setup.canvases[0].width, 0);
  queue.resolve(setup.encoded);
  await attempt;
  assert.equal(setup.downloads.length, 0);
  assert.equal(setup.controller.snapshot.phase, 'cancelled');
});

for (const [title, change] of [
  ['source revision', input => { input.snapshot.sourceRevision += 1; input.subjects.revision += 1; }],
  ['selected person', input => {
    input.snapshot.selectedId = 'drawn-guest';
    input.subjects.selectedId = 'drawn-guest';
  }],
  ['local consent', input => { input.snapshot.permissions.local = false; }],
  ['identity lock', input => { input.snapshot.identityLock = false; }],
  ['hair intensity', input => { input.snapshot.levels.hair = 4.2; }],
  ['effect revision', input => { input.snapshot.applied.concealer = false; }],
  ['bystander geometry', input => {
    input.subjects.boxes = input.subjects.boxes.map(box => ({ ...box }));
    input.subjects.boxes[1].x -= 0.01;
  }],
]) {
  test(`async output is discarded when ${title} changes`, async () => {
    const setup = fixture();
    const queue = deferred();
    setup.setEncoding(() => queue.promise);
    const attempt = setup.controller.start();
    change(setup);
    queue.resolve(setup.encoded);
    await attempt;
    assert.equal(setup.downloads.length, 0);
    assert.equal(setup.requested.length, 0);
    assert.equal(setup.controller.snapshot.phase, 'cancelled');
  });
}

test('async validation cannot export after subject selection changes', async () => {
  const setup = fixture();
  const queue = deferred();
  setup.setVerifying(() => queue.promise);
  const pending = setup.controller.start();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(setup.controller.snapshot.phase, 'validating');
  setup.snapshot.selectedId = 'drawn-guest';
  setup.subjects.selectedId = 'drawn-guest';
  queue.resolve({ width: 8, height: 8, size: setup.encoded.size,
    hasPixels: true, hasTextMetadata: false });
  await pending;
  assert.equal(setup.downloads.length, 0);
});

test('rapid restart after cancellation rejects older completion', async () => {
  const setup = fixture();
  const oldQueue = deferred();
  const nextQueue = deferred();
  let sequence = 0;
  setup.setEncoding(() => (sequence++ === 0 ? oldQueue.promise : nextQueue.promise));
  const first = setup.controller.start();
  setup.controller.cancel();
  const second = setup.controller.start();
  oldQueue.resolve(setup.encoded);
  await first;
  assert.equal(setup.downloads.length, 0);
  nextQueue.resolve(setup.encoded);
  await second;
  assert.equal(setup.downloads.length, 1);
  assert.equal(setup.controller.snapshot.phase, 'download-requested');
});

test('no more than two in-flight encoder callbacks can be retained', async () => {
  const setup = fixture();
  const oldQueue = deferred();
  const nextQueue = deferred();
  let sequence = 0;
  setup.setEncoding(() => (sequence++ === 0 ? oldQueue.promise : nextQueue.promise));
  const first = setup.controller.start();
  setup.controller.cancel();
  const second = setup.controller.start();
  setup.controller.cancel();
  const third = await setup.controller.start();
  assert.equal(third.reason, 'already-running');
  assert.equal(setup.canvases.length, 2);
  oldQueue.resolve(setup.encoded);
  nextQueue.resolve(setup.encoded);
  await Promise.all([first, second]);
  assert.equal(setup.downloads.length, 0);
});

test('closing the continuous tour cancels all late encoding results', async () => {
  const setup = fixture();
  const queue = deferred();
  setup.setEncoding(() => queue.promise);
  const pending = setup.controller.start();
  setup.controller.dispose();
  assert.equal(setup.controller.snapshot.phase, 'disposed');
  queue.resolve(setup.encoded);
  await pending;
  assert.equal(setup.downloads.length, 0);
  assert.equal(setup.controller.snapshot.phase, 'disposed');
});

test('an explicit reset clears old download outcome and any source proof', async () => {
  const setup = fixture();
  await setup.controller.start();
  assert.equal(setup.controller.snapshot.phase, 'download-requested');
  setup.controller.reset();
  assert.equal(setup.controller.snapshot.phase, 'idle');
  assert.equal(setup.controller.snapshot.bytes, null);
  assert.equal(setup.controller.snapshot.attempt, 0);
});

test('invalidation after download clears stale display evidence', async () => {
  const setup = fixture();
  await setup.controller.start();
  setup.controller.invalidate();
  assert.equal(setup.controller.snapshot.phase, 'idle');
  assert.equal(setup.controller.snapshot.bytes, null);
});

test('controller never sends source pixels or personal fields through its status', async () => {
  const setup = fixture();
  await setup.controller.start();
  const JSONStatus = JSON.stringify(setup.controller.snapshot);
  for (const forbidden of ['drawn-main', 'drawn-guest', 'rgba', 'base64', 'photoId', 'sha256']) {
    assert.equal(JSONStatus.includes(forbidden), false);
  }
  assert.ok(JSONStatus.length < 600);
});

test('no hidden retry after an encoding failure', async () => {
  const setup = fixture();
  let calls = 0;
  setup.setEncoding(() => { calls += 1; return Promise.reject(Error('codec')); });
  await setup.controller.start();
  assert.equal(calls, 1);
  assert.equal(setup.controller.snapshot.phase, 'refused');
});

test('source getter failures after asynchronous encoding fail closed', async () => {
  const setup = fixture();
  const queue = deferred();
  let calls = 0;
  const current = setup.port.current;
  setup.port.current = () => {
    calls += 1;
    if (calls > 1) throw Error('Studio page closed');
    return current();
  };
  setup.setEncoding(() => queue.promise);
  const pending = setup.controller.start();
  queue.resolve(setup.encoded);
  const result = await pending;
  assert.notEqual(result.phase, 'download-requested');
  assert.equal(setup.downloads.length, 0);
  assert.equal(setup.canvases[0].width, 0);
});
