/** Local replay state machine tests, no browser network. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { localController, localFiles, localManifest, localPng } from './helpers/offline-import-fixture.mjs';

function phase(controller) { return controller.snapshot.phase; }

test('matching locally generated PNG and manifest create only one temporary preview', async () => {
  const fixture = localController();
  try {
    const { manifest, png } = await localFiles();
    const result = await fixture.controller.load(manifest, png);
    assert.equal(result.phase, 'ready');
    assert.equal(result.verifiedFileIntegrity, true);
    assert.equal(result.verifiedProviderOrigin, false);
    assert.equal(result.verifiedRealFaceQuality, false);
    assert.equal(result.providerCalls, 0);
    assert.equal(result.unitsSpent, 0);
    assert.equal(result.imageUploaded, false);
    assert.equal(result.imagePersisted, false);
    assert.equal(fixture.controller.previewUrl, 'blob:local-replay-1');
    assert.equal(fixture.urls.length, 1);
  } finally { fixture.dispose(); }
  assert.deepEqual(fixture.revoked, ['blob:local-replay-1']);
});

test('mismatched PNG hash refuses without creating a browser URL', async () => {
  const fixture = localController();
  try {
    const { png, manifest } = await localFiles({ sha256: 'a'.repeat(64) });
    assert.equal(phase(await fixture.controller.load(manifest, png) && fixture.controller), 'refused');
    assert.equal(fixture.urls.length, 0);
    assert.equal(fixture.controller.previewUrl, null);
  } finally { fixture.dispose(); }
});

test('encoded PNG dimensions must exactly match manifest', async () => {
  const fixture = localController();
  try {
    const { png, manifest } = await localFiles({ width: 7 });
    assert.equal((await fixture.controller.load(manifest, png)).phase, 'refused');
    assert.equal(fixture.urls.length, 0);
  } finally { fixture.dispose(); }
});

test('PNG size must match exactly, not merely fall below a quota', async () => {
  const fixture = localController();
  try {
    const { png, manifest } = await localFiles({ size: 200000 });
    assert.equal((await fixture.controller.load(manifest, png)).phase, 'refused');
  } finally { fixture.dispose(); }
});

test('unsupported JPEG masquerading as a PNG is refused before hashing', async () => {
  const fixture = localController();
  try {
    const png = new Blob(['not-a-png'], { type: 'image/jpeg' });
    const manifest = await localManifest(await localPng());
    assert.equal((await fixture.controller.load(manifest, png)).phase, 'refused');
    assert.equal(fixture.urls.length, 0);
  } finally { fixture.dispose(); }
});

test('extra metadata fails the structural PNG validator', async () => {
  const fixture = localController();
  try {
    const { syntheticPng } = await import('./helpers/synthetic-png.mjs');
    const png = syntheticPng(8, 8, [{ type: 'eXIf', data: Buffer.from([1, 2]) }]);
    const manifest = await localManifest(png);
    assert.equal((await fixture.controller.load(manifest, png)).phase, 'refused');
    assert.equal(fixture.urls.length, 0);
  } finally { fixture.dispose(); }
});

test('only the selected drawn person can authorize a replay', async () => {
  const fixture = localController();
  try {
    const files = await localFiles();
    fixture.state.setPermission('local', false);
    assert.equal((await fixture.controller.load(files.manifest, files.png)).phase, 'refused');
    fixture.state.setPermission('local', true);
    assert.equal((await fixture.controller.load(files.manifest, files.png)).phase, 'ready');
  } finally { fixture.dispose(); }
});

test('each relevant consent scope is checked independently', async () => {
  const fixture = localController();
  try {
    const files = await localFiles({ family: 'makeup' });
    fixture.state.setPermission('face', false);
    assert.equal((await fixture.controller.load(files.manifest, files.png)).phase, 'refused');
    fixture.state.setPermission('face', true);
    assert.equal((await fixture.controller.load(files.manifest, files.png)).phase, 'ready');
    fixture.controller.invalidate();
    fixture.state.setPermission('hair', false);
    assert.equal((await fixture.controller.load(files.manifest, files.png)).phase, 'ready');
  } finally { fixture.dispose(); }
});

test('the controller is local-only even with mock consent withdrawn in off mode', async () => {
  const fixture = localController();
  try {
    fixture.state.chooseMockMode('off');
    fixture.state.setPermission('mock', false);
    const files = await localFiles();
    const result = await fixture.controller.load(files.manifest, files.png);
    assert.equal(result.phase, 'ready');
    assert.equal(result.providerCalls, 0);
  } finally { fixture.dispose(); }
});

test('an invalid object URL is revoked and never used for a preview', async () => {
  const revoked = [];
  const fixture = localController(undefined, {
    urls: { create: () => 'https://example.invalid/other.png', revoke: url => revoked.push(url) },
  });
  try {
    const files = await localFiles();
    assert.equal((await fixture.controller.load(files.manifest, files.png)).phase, 'refused');
    assert.equal(fixture.controller.previewUrl, null);
    assert.deepEqual(revoked, ['https://example.invalid/other.png']);
  } finally { fixture.dispose(); }
});

test('exception while allocating a preview does not create a false success', async () => {
  const fixture = localController(undefined, {
    urls: { create: () => { throw new Error('quota'); }, revoke() {} },
  });
  try {
    const files = await localFiles();
    assert.equal((await fixture.controller.load(files.manifest, files.png)).phase, 'refused');
    assert.equal(fixture.controller.previewUrl, null);
  } finally { fixture.dispose(); }
});

test('reset clears a verified image URL immediately', async () => {
  const fixture = localController();
  try {
    const files = await localFiles();
    await fixture.controller.load(files.manifest, files.png);
    fixture.controller.invalidate();
    assert.equal(fixture.controller.previewUrl, null);
    assert.equal(phase(fixture.controller), 'empty');
    assert.deepEqual(fixture.revoked, ['blob:local-replay-1']);
  } finally { fixture.dispose(); }
});

test('reloading a different PNG revokes the old temporary URL', async () => {
  const fixture = localController();
  try {
    const files = await localFiles();
    await fixture.controller.load(files.manifest, files.png);
    await fixture.controller.load(files.manifest, files.png);
    assert.deepEqual(fixture.revoked, ['blob:local-replay-1']);
    assert.equal(fixture.controller.previewUrl, 'blob:local-replay-2');
  } finally { fixture.dispose(); }
});

test('disposed controller cannot accept new local files', async () => {
  const fixture = localController();
  fixture.dispose();
  const files = await localFiles();
  assert.equal((await fixture.controller.load(files.manifest, files.png)).phase, 'disposed');
  assert.equal(fixture.controller.previewUrl, null);
});
