/** Stale-read and revocation regressions. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deferred, localController, localFiles } from './helpers/offline-import-fixture.mjs';

async function nextMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

test('revoking permission during SHA computation never yields a ready image', async () => {
  const hold = deferred();
  const fixture = localController(undefined, { digest: { digest: () => hold.promise } });
  try {
    const files = await localFiles();
    const pending = fixture.controller.load(files.manifest, files.png);
    await nextMicrotasks();
    fixture.state.setPermission('hair', false);
    hold.resolve('a'.repeat(64));
    const result = await pending;
    assert.notEqual(result.phase, 'ready');
    assert.equal(fixture.controller.previewUrl, null);
  } finally { fixture.dispose(); }
});

test('switching subject during digest rejects the original verification', async () => {
  const hold = deferred();
  const fixture = localController(undefined, { digest: { digest: () => hold.promise } });
  try {
    const files = await localFiles();
    const pending = fixture.controller.load(files.manifest, files.png);
    await nextMicrotasks();
    fixture.state.selectSubject('drawn-second', true);
    hold.resolve('a'.repeat(64));
    assert.notEqual((await pending).phase, 'ready');
    assert.equal(fixture.urls.length, 0);
  } finally { fixture.dispose(); }
});

test('replacing the source during digest clears any old authorization', async () => {
  const hold = deferred();
  const fixture = localController(undefined, { digest: { digest: () => hold.promise } });
  try {
    const files = await localFiles();
    const pending = fixture.controller.load(files.manifest, files.png);
    await nextMicrotasks();
    fixture.state.chooseDrawnSource(2, 2, 'drawn-main');
    hold.resolve('a'.repeat(64));
    assert.notEqual((await pending).phase, 'ready');
  } finally { fixture.dispose(); }
});

test('a changed effect strength clears local verification authority', async () => {
  const fixture = localController();
  try {
    const files = await localFiles();
    await fixture.controller.load(files.manifest, files.png);
    assert.equal(fixture.controller.snapshot.phase, 'ready');
    fixture.state.setStrength('hair', 3.7);
    assert.equal(fixture.controller.snapshot.phase, 'stale');
    assert.equal(fixture.controller.previewUrl, null);
    assert.deepEqual(fixture.revoked, ['blob:local-replay-1']);
  } finally { fixture.dispose(); }
});

test('identity lock going off revokes an already loaded local image', async () => {
  const fixture = localController();
  try {
    const files = await localFiles();
    await fixture.controller.load(files.manifest, files.png);
    fixture.state.setIdentityLock(false);
    assert.equal(fixture.controller.snapshot.phase, 'stale');
    assert.equal(fixture.controller.previewUrl, null);
  } finally { fixture.dispose(); }
});

test('simulated cancellation while digest is pending cannot resurrect an image', async () => {
  const hold = deferred();
  const fixture = localController(undefined, { digest: { digest: () => hold.promise } });
  try {
    const files = await localFiles();
    const pending = fixture.controller.load(files.manifest, files.png);
    await nextMicrotasks();
    fixture.controller.invalidate();
    hold.resolve('a'.repeat(64));
    assert.equal((await pending).phase, 'empty');
    assert.equal(fixture.controller.previewUrl, null);
    assert.equal(fixture.urls.length, 0);
  } finally { fixture.dispose(); }
});

test('disposing while digest runs never creates a late object URL', async () => {
  const hold = deferred();
  const fixture = localController(undefined, { digest: { digest: () => hold.promise } });
  const files = await localFiles();
  const pending = fixture.controller.load(files.manifest, files.png);
  await nextMicrotasks();
  fixture.dispose();
  hold.resolve('a'.repeat(64));
  assert.equal((await pending).phase, 'disposed');
  assert.equal(fixture.urls.length, 0);
});

test('only the last of two concurrent imports may be displayed', async () => {
  const first = deferred();
  let index = 0;
  const fixture = localController(undefined, {
    digest: {
      digest: async bytes => {
        index += 1;
        if (index === 1) return first.promise;
        const { localDigest } = await import('./helpers/offline-import-fixture.mjs');
        return localDigest(bytes);
      },
    },
  });
  try {
    const files = await localFiles();
    const pendingFirst = fixture.controller.load(files.manifest, files.png);
    await nextMicrotasks();
    const pendingSecond = fixture.controller.load(files.manifest, files.png);
    await pendingSecond;
    first.resolve('0'.repeat(64));
    assert.notEqual((await pendingFirst).phase, 'refused');
    assert.equal(fixture.controller.snapshot.phase, 'ready');
    assert.equal(fixture.urls.length, 1);
  } finally { fixture.dispose(); }
});

test('a bad file after a good one removes previous preview and report proof', async () => {
  const fixture = localController();
  try {
    const files = await localFiles();
    await fixture.controller.load(files.manifest, files.png);
    const bad = await localFiles({ providerVerified: true });
    assert.equal((await fixture.controller.load(bad.manifest, bad.png)).phase, 'refused');
    assert.equal(fixture.controller.previewUrl, null);
    assert.deepEqual(fixture.revoked, ['blob:local-replay-1']);
    assert.equal(fixture.controller.snapshot.verifiedFileIntegrity, false);
  } finally { fixture.dispose(); }
});

test('repeated invalidation is harmless and does not leak handles', async () => {
  const fixture = localController();
  try {
    const files = await localFiles();
    await fixture.controller.load(files.manifest, files.png);
    fixture.controller.invalidate();
    fixture.controller.invalidate();
    fixture.controller.invalidate();
    assert.equal(fixture.revoked.length, 1);
    assert.equal(fixture.controller.outstandingReads, 0);
  } finally { fixture.dispose(); }
});
