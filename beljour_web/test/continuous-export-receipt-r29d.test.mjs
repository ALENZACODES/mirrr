/** Reopen a saved synthetic PNG without any server call. Author: John Khan. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { LocalExportReceipt } from '../dist/js/layout/continuous/export-receipt.js';
import { syntheticPng } from './helpers/synthetic-png.mjs';

function fixture(options = {}) {
  const changes = [];
  const digest = options.digest ?? (async blob => {
    const bytes = Buffer.from(await blob.arrayBuffer());
    return createHash('sha256').update(bytes).digest('hex');
  });
  const receipt = new LocalExportReceipt({ digest }, () => {
    changes.push(receipt.snapshot);
  });
  const blob = syntheticPng(27, 19);
  return { receipt, changes, blob, context: { width: 27, height: 19, size: blob.size } };
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

test('no file comparison is available until an actual validated export exists', async () => {
  const setup = fixture();
  assert.equal(setup.receipt.snapshot.phase, 'empty');
  assert.equal(setup.receipt.snapshot.available, false);
  assert.equal(setup.receipt.snapshot.exactFileConfirmed, false);
  await setup.receipt.check(setup.blob);
  assert.equal(setup.receipt.snapshot.phase, 'empty');
});

test('staging alone never claims the user saved the PNG', async () => {
  const setup = fixture();
  const staged = await setup.receipt.stage(setup.blob, setup.context);
  assert.equal(staged.phase, 'ready');
  assert.equal(staged.exactFileConfirmed, false);
  assert.equal(staged.usedNetwork, false);
  assert.equal(staged.storesImages, false);
  assert.deepEqual(setup.changes.map(status => status.phase), [
    'empty', 'preparing', 'ready',
  ]);
});

test('reopening the same file verifies local byte equality', async () => {
  const setup = fixture();
  await setup.receipt.stage(setup.blob, setup.context);
  const result = await setup.receipt.check(setup.blob);
  assert.equal(result.phase, 'matched');
  assert.equal(result.exactFileConfirmed, true);
  assert.match(result.message, /exactly matches/);
  assert.equal(result.usedNetwork, false);
});

test('a separate Blob with identical synthetic bytes can match', async () => {
  const setup = fixture();
  await setup.receipt.stage(setup.blob, setup.context);
  const reopened = new Blob([await setup.blob.arrayBuffer()], { type: 'image/png' });
  const result = await setup.receipt.check(reopened);
  assert.equal(result.phase, 'matched');
});

test('a different image size cannot match even with a matching filename', async () => {
  const setup = fixture();
  await setup.receipt.stage(setup.blob, setup.context);
  const other = syntheticPng(26, 20);
  const result = await setup.receipt.check(other);
  assert.notEqual(result.phase, 'matched');
  assert.equal(result.exactFileConfirmed, false);
});

test('a matching-length but different valid output does not match a digest', async () => {
  let calls = 0;
  const setup = fixture({ digest: async () => (++calls === 1 ? 'a' : 'b').repeat(64) });
  await setup.receipt.stage(setup.blob, setup.context);
  const result = await setup.receipt.check(setup.blob);
  assert.equal(result.phase, 'mismatch');
  assert.equal(result.exactFileConfirmed, false);
});

test('a metadata-bearing PNG is refused before hashing visitor-selected data', async () => {
  const setup = fixture();
  await setup.receipt.stage(setup.blob, setup.context);
  const bytes = Buffer.from(await setup.blob.arrayBuffer());
  const wrong = new Blob([Buffer.from('bad blob'), bytes], { type: 'image/png' });
  const result = await setup.receipt.check(wrong);
  assert.equal(result.exactFileConfirmed, false);
  assert.notEqual(result.phase, 'matched');
});

test('a text file cannot become a verified download receipt', async () => {
  const setup = fixture();
  await setup.receipt.stage(setup.blob, setup.context);
  const other = new Blob([Buffer.alloc(setup.blob.size)], { type: 'text/plain' });
  const result = await setup.receipt.check(other);
  assert.equal(result.phase, 'refused');
  assert.equal(result.exactFileConfirmed, false);
});

test('empty or unselected local file does not show success', async () => {
  const setup = fixture();
  await setup.receipt.stage(setup.blob, setup.context);
  const result = await setup.receipt.check(null);
  assert.equal(result.phase, 'mismatch');
  assert.equal(result.exactFileConfirmed, false);
});

test('staging an incompatible size refuses before reading PNG bytes', async () => {
  const setup = fixture();
  const result = await setup.receipt.stage(setup.blob, {
    ...setup.context, size: setup.context.size + 1,
  });
  assert.equal(result.phase, 'refused');
});

for (const context of [
  { width: 0, height: 19, size: 1 },
  { width: 27, height: -1, size: 1 },
  { width: 1.1, height: 19, size: 1 },
]) {
  test('invalid image dimensions cannot stage a receipt', async () => {
    const setup = fixture();
    const result = await setup.receipt.stage(setup.blob, {
      ...context, size: setup.blob.size,
    });
    assert.equal(result.phase, 'refused');
  });
}

test('a digest engine that errors cannot accidentally claim a match', async () => {
  const setup = fixture({ digest: async () => { throw Error('crypto blocked'); } });
  const result = await setup.receipt.stage(setup.blob, setup.context);
  assert.equal(result.phase, 'refused');
  assert.equal(result.exactFileConfirmed, false);
});

test('a malformed digest must be refused, not compared with free text', async () => {
  const setup = fixture({ digest: async () => 'not-a-valid-hash' });
  const result = await setup.receipt.stage(setup.blob, setup.context);
  assert.equal(result.phase, 'refused');
});

test('invalidating a successful match clears only local checksum evidence', async () => {
  const setup = fixture();
  await setup.receipt.stage(setup.blob, setup.context);
  await setup.receipt.check(setup.blob);
  assert.equal(setup.receipt.snapshot.phase, 'matched');
  setup.receipt.invalidate();
  assert.equal(setup.receipt.snapshot.phase, 'empty');
  assert.equal(setup.receipt.snapshot.exactFileConfirmed, false);
});

test('late staging completion after reset cannot revive an old checksum', async () => {
  const delay = deferred();
  const setup = fixture({ digest: () => delay.promise });
  const pending = setup.receipt.stage(setup.blob, setup.context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(setup.receipt.snapshot.phase, 'preparing');
  setup.receipt.invalidate();
  delay.resolve('a'.repeat(64));
  await pending;
  assert.equal(setup.receipt.snapshot.phase, 'empty');
});

test('late file verification after reset cannot emit a successful receipt', async () => {
  const queue = deferred();
  let calls = 0;
  const setup = fixture({ digest: () => (++calls === 1
    ? Promise.resolve('a'.repeat(64)) : queue.promise) });
  await setup.receipt.stage(setup.blob, setup.context);
  const pending = setup.receipt.check(setup.blob);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(setup.receipt.snapshot.phase, 'checking');
  setup.receipt.invalidate();
  queue.resolve('a'.repeat(64));
  await pending;
  assert.equal(setup.receipt.snapshot.phase, 'empty');
});

test('disposed file checks cannot write to stale client state', async () => {
  const queue = deferred();
  const setup = fixture({ digest: () => queue.promise });
  const pending = setup.receipt.stage(setup.blob, setup.context);
  await new Promise(resolve => setImmediate(resolve));
  setup.receipt.dispose();
  queue.resolve('c'.repeat(64));
  await pending;
  assert.equal(setup.receipt.snapshot.phase, 'disposed');
  assert.equal(setup.receipt.snapshot.exactFileConfirmed, false);
});

test('status reports cannot contain a raw file, SHA, name, EXIF or face identifier', async () => {
  const setup = fixture();
  await setup.receipt.stage(setup.blob, setup.context);
  await setup.receipt.check(setup.blob);
  const text = JSON.stringify(setup.receipt.snapshot);
  for (const value of ['.png', 'filename', 'sha256', 'drawn-main', 'EXIF', 'data:image']) {
    assert.equal(text.includes(value), false);
  }
  assert.ok(text.length < 360);
});

test('no background polling or network fallbacks are created by optional verification', async () => {
  const before = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = () => { requests += 1; throw Error('unexpected request'); };
  try {
    const setup = fixture();
    await setup.receipt.stage(setup.blob, setup.context);
    await setup.receipt.check(setup.blob);
    assert.equal(requests, 0);
  } finally {
    if (before === undefined) delete globalThis.fetch;
    else globalThis.fetch = before;
  }
});

test('rapid repeated file selections run only one private digest operation', async () => {
  const queue = deferred();
  let calls = 0;
  const setup = fixture({ digest: () => {
    calls += 1;
    return calls === 1 ? Promise.resolve('a'.repeat(64)) : queue.promise;
  } });
  await setup.receipt.stage(setup.blob, setup.context);
  const first = setup.receipt.check(setup.blob);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(setup.receipt.snapshot.phase, 'checking');
  const results = await Promise.all(Array.from({ length: 100 }, () =>
    setup.receipt.check(setup.blob)));
  assert.ok(results.every(result => result.phase === 'checking'));
  assert.equal(calls, 2);
  queue.resolve('a'.repeat(64));
  await first;
  assert.equal(setup.receipt.snapshot.phase, 'matched');
});

test('two outstanding digest jobs are the maximum across superseded exports', async () => {
  const first = deferred();
  const second = deferred();
  let calls = 0;
  const setup = fixture({ digest: () => (++calls === 1 ? first.promise : second.promise) });
  const prior = setup.receipt.stage(setup.blob, setup.context);
  await new Promise(resolve => setImmediate(resolve));
  const replacement = setup.receipt.stage(setup.blob, setup.context);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 2);
  const third = await setup.receipt.stage(setup.blob, setup.context);
  assert.equal(third.phase, 'refused');
  assert.equal(calls, 2);
  first.resolve('a'.repeat(64));
  second.resolve('b'.repeat(64));
  await Promise.all([prior, replacement]);
  assert.equal(setup.receipt.snapshot.exactFileConfirmed, false);
});
