/** Local companion JSON preparation is opt-in and never asserts vendor origin. */
/** Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  downloadPreparedManifest,
  prepareOfflineReplayManifest,
  preparedManifestBlob,
} from '../dist/js/layout/continuous/offline-import-preparation.js';
import { checkedOfflineImportManifest } from '../dist/js/layout/continuous/offline-import-contract.js';
import { localDigest, localPng } from './helpers/offline-import-fixture.mjs';

const hasher = { digest: async bytes => localDigest(bytes) };

test('a drawn PNG can generate its own strict matching JSON in local memory', async () => {
  const image = await localPng();
  const manifest = await prepareOfflineReplayManifest(image, 'hair', hasher);
  assert.equal(manifest.format, 'beljour-local-png-replay/1');
  assert.equal(manifest.width, 8);
  assert.equal(manifest.height, 8);
  assert.equal(manifest.size, image.size);
  assert.equal(manifest.sha256.length, 64);
  assert.equal(manifest.providerVerified, false);
  assert.equal(manifest.realFaceTested, false);
  assert.equal(manifest.unitsSpentByViewer, 0);
  assert.ok(Object.isFrozen(manifest));
});

test('all three local categories generate a manifest with no product claim', async () => {
  const image = await localPng();
  for (const family of ['hair', 'makeup', 'skin']) {
    const record = await prepareOfflineReplayManifest(image, family, hasher);
    assert.equal(record.family, family);
    assert.equal(record.source, 'operator-supplied-unverified');
    assert.equal(record.scene, 'drawn-pair');
    assert.equal(Object.keys(record).includes('productPrice'), false);
  }
});

test('the prepared JSON round trips through the strict parser', async () => {
  const png = await localPng();
  const manifest = await prepareOfflineReplayManifest(png, 'skin', hasher);
  const blob = preparedManifestBlob(manifest);
  assert.equal(blob.type, 'application/json');
  assert.ok(blob.size < 8192);
  const parsed = checkedOfflineImportManifest(JSON.parse(await blob.text()));
  assert.deepEqual(parsed, manifest);
  assert.doesNotMatch(await blob.text(), /data:image|filename|photoBytes|apiKey/i);
});

test('unsupported category cannot sneak into the prepared manifest', async () => {
  const png = await localPng();
  await assert.rejects(prepareOfflineReplayManifest(png, 'other', hasher), /category/);
  await assert.rejects(prepareOfflineReplayManifest(png, '', hasher), /category/);
});

test('non-PNG content is refused before hashing', async () => {
  let calls = 0;
  const port = { digest: async () => { calls += 1; return 'a'.repeat(64); } };
  const fake = new Blob(['hello'], { type: 'image/jpeg' });
  await assert.rejects(prepareOfflineReplayManifest(fake, 'hair', port));
  assert.equal(calls, 0);
});

test('wrong PNG signature is refused even if the MIME claims image/png', async () => {
  const data = new Uint8Array(120);
  await assert.rejects(prepareOfflineReplayManifest(
    new Blob([data], { type: 'image/png' }), 'hair', hasher,
  ));
});

test('image dimensions come from checked PNG headers, never caller guesses', async () => {
  const png = await localPng(20, 12);
  const result = await prepareOfflineReplayManifest(png, 'makeup', hasher);
  assert.deepEqual([result.width, result.height], [20, 12]);
});

test('PNG metadata is rejected before manifest creation', async () => {
  const { syntheticPng } = await import('./helpers/synthetic-png.mjs');
  const png = syntheticPng(8, 8, [{ type: 'tEXt', data: Buffer.from('name\0test') }]);
  await assert.rejects(prepareOfflineReplayManifest(png, 'hair', hasher), /metadata/);
});

test('digest port cannot supply malformed or forged high-level claims', async () => {
  const png = await localPng();
  await assert.rejects(prepareOfflineReplayManifest(png, 'hair', {
    digest: async () => 'not-a-sha',
  }), /digest/);
});

test('download control is explicit and writes only a fixed-named JSON', async () => {
  const image = await localPng();
  const record = await prepareOfflineReplayManifest(image, 'hair', hasher);
  const json = preparedManifestBlob(record);
  const used = [];
  const previous = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  URL.createObjectURL = blob => {
    used.push(['create', blob]);
    return 'blob:local-manifest';
  };
  URL.revokeObjectURL = url => used.push(['revoke', url]);
  const link = { href: '', download: '', rel: '', click() { used.push(['click', this]); } };
  try {
    downloadPreparedManifest({ createElement() { return link; } }, json);
    assert.equal(link.download, 'BELJOUR-FULL-BEAUTY-STUDIO-local-replay.json');
    assert.equal(link.rel, 'noopener');
    assert.equal(link.href, 'blob:local-manifest');
    assert.deepEqual(used.map(row => row[0]), ['create', 'click', 'revoke']);
  } finally {
    URL.createObjectURL = previous.create;
    URL.revokeObjectURL = previous.revoke;
  }
});

test('invalid JSON download bytes are refused before URL allocation', () => {
  assert.throws(() => downloadPreparedManifest({}, new Blob(['x'])));
  assert.throws(() => downloadPreparedManifest({}, new Blob(['x'.repeat(8193)],
    { type: 'application/json' })));
});
