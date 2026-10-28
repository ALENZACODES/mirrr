import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SubjectDiscovery } from '../dist/js/layout/subjects/discovery.js';
import { DRAWN_PAIR } from '../dist/js/layout/subjects/contract.js';

function pixels(width = 512, height = 640) { return { width, height }; }

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test('null subject adapter refuses to fabricate a face on user images', async () => {
  const service = new SubjectDiscovery(null);
  const outcome = await service.find(pixels());
  assert.equal(outcome.notice, 'unavailable');
  assert.equal(outcome.count, 0);
  assert.equal(service.snapshot.selectedId, null);
  assert.equal(service.snapshot.boxes.length, 0);
  service.dispose();
});

test('typed adapter receives only the current preview and a cancellation signal', async () => {
  const requests = [];
  const port = { kind: 'subject-detection', async detect(input) {
    requests.push(input);
    return { revision: input.revision, boxes: [
      { id: 'face-main', x: 0.1, y: 0.1, width: 0.6, height: 0.7, origin: 'detected' },
      { id: 'face-guest', x: 0.78, y: 0.2, width: 0.2, height: 0.3, origin: 'detected' },
    ] };
  } };
  const service = new SubjectDiscovery(port);
  const source = pixels();
  const result = await service.find(source);
  assert.equal(result.notice, 'detected');
  assert.equal(result.count, 2);
  assert.equal(requests[0].pixels, source);
  assert.ok(requests[0].signal instanceof AbortSignal);
  assert.equal(service.snapshot.selectedId, 'face-main');
  assert.equal(service.selection.choose('face-guest'), true);
  assert.equal(service.selection.active.id, 'face-guest');
  service.dispose();
});

test('stale detections cannot paint boxes on a replacement image', async () => {
  const first = deferred();
  const second = deferred();
  const port = { kind: 'subject-detection', detect({ revision }) {
    return revision === 1 ? first.promise : second.promise;
  } };
  const service = new SubjectDiscovery(port);
  const pending = service.find(pixels());
  const current = service.find(pixels());
  second.resolve({ revision: 2, boxes: [DRAWN_PAIR[0]] });
  const result = await current;
  assert.equal(result.notice, 'detected');
  first.resolve({ revision: 1, boxes: [DRAWN_PAIR[1]] });
  const ignored = await pending;
  assert.equal(ignored.notice, 'stale');
  assert.equal(service.snapshot.selectedId, 'drawn-main');
  service.dispose();
});

test('incorrect result revisions cannot be applied', async () => {
  const port = { kind: 'subject-detection', async detect() {
    return { revision: 100000, boxes: DRAWN_PAIR };
  } };
  const service = new SubjectDiscovery(port);
  const result = await service.find(pixels());
  assert.equal(result.notice, 'stale');
  assert.equal(service.snapshot.boxes.length, 0);
  service.dispose();
});

test('adapter rejection is a safe refusal and never a guessed face', async () => {
  const service = new SubjectDiscovery({ kind: 'subject-detection', async detect() {
    throw new Error('model not cleared');
  } });
  assert.equal((await service.find(pixels())).notice, 'refused');
  assert.equal(service.snapshot.selectedId, null);
  service.dispose();
});

test('tiny previews do not reach the detector', async () => {
  let calls = 0;
  const service = new SubjectDiscovery({ kind: 'subject-detection', async detect() {
    calls += 1;
    return { revision: 1, boxes: DRAWN_PAIR };
  } });
  assert.equal((await service.find(pixels(4, 8))).notice, 'refused');
  assert.equal(calls, 0);
  service.dispose();
});

test('disposal aborts an in-flight job and clears all candidate metadata', async () => {
  const waiter = deferred();
  let signal;
  const service = new SubjectDiscovery({ kind: 'subject-detection', detect(input) {
    signal = input.signal;
    return waiter.promise;
  } });
  const pending = service.find(pixels());
  service.dispose();
  assert.equal(signal.aborted, true);
  waiter.resolve({ revision: 1, boxes: DRAWN_PAIR });
  assert.equal((await pending).notice, 'stale');
  assert.equal(service.snapshot.selectedId, null);
  assert.throws(() => service.seedDrawn(DRAWN_PAIR));
});

test('drawn samples are explicit metadata and can be replaced safely', () => {
  const service = new SubjectDiscovery();
  service.seedDrawn(DRAWN_PAIR);
  assert.equal(service.snapshot.source, 'drawn');
  service.selection.choose('drawn-guest');
  assert.equal(service.selection.active.id, 'drawn-guest');
  service.reset();
  assert.equal(service.selection.active, null);
  service.dispose();
});
