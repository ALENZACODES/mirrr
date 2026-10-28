/** Companion JSON round-trip and authority checks without a remote API. */
/** Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  prepareOfflineReplayManifest,
  preparedManifestBlob,
} from '../dist/js/layout/continuous/offline-import-preparation.js';
import {
  offlineImportEvidence,
  offlineImportStatus,
  parseOfflineManifest,
} from '../dist/js/layout/continuous/offline-import-contract.js';
import { localController, localDigest, localPng } from './helpers/offline-import-fixture.mjs';

const port = { digest: async bytes => localDigest(bytes) };

async function roundTrip(family = 'hair') {
  const file = await localPng(12, 14);
  const manifest = await prepareOfflineReplayManifest(file, family, port);
  const json = preparedManifestBlob(manifest);
  return { file, manifest, json };
}

test('generated companion and PNG pass the actual importer without changing edits', async () => {
  const fixture = localController();
  try {
    const { file, manifest, json } = await roundTrip();
    const before = fixture.state.snapshot.applied;
    assert.equal((await fixture.controller.load(json, file)).phase, 'ready');
    assert.deepEqual(fixture.state.snapshot.applied, before);
    assert.equal(fixture.controller.snapshot.width, manifest.width);
    assert.equal(fixture.controller.snapshot.height, manifest.height);
    assert.equal(fixture.controller.snapshot.verifiedProviderOrigin, false);
    assert.equal(fixture.controller.snapshot.providerCalls, 0);
  } finally { fixture.dispose(); }
});

test('each supported category round trips with its own permission', async () => {
  for (const family of ['hair', 'makeup', 'skin']) {
    const fixture = localController();
    try {
      const { file, json } = await roundTrip(family);
      const outcome = await fixture.controller.load(json, file);
      assert.equal(outcome.phase, 'ready');
      assert.equal(outcome.family, family);
    } finally { fixture.dispose(); }
  }
});

test('using the wrong locally generated PNG fails the companion checksum', async () => {
  const fixture = localController();
  try {
    const { json } = await roundTrip('hair');
    const other = await localPng(12, 14);
    const changed = new Blob([await other.arrayBuffer()], { type: 'image/png' });
    const result = await fixture.controller.load(json, changed);
    assert.equal(result.phase, 'ready');
    // Identical drawn fixtures are legitimately hash-equal; a distinct byte sequence is required.
    const mismatched = await localPng(7, 9);
    assert.equal((await fixture.controller.load(json, mismatched)).phase, 'refused');
  } finally { fixture.dispose(); }
});

test('tampering with a stored digest invalidates the prepared companion', async () => {
  const fixture = localController();
  try {
    const { file, manifest } = await roundTrip();
    const modified = preparedManifestBlob({ ...manifest, sha256: 'b'.repeat(64) });
    assert.equal((await fixture.controller.load(modified, file)).phase, 'refused');
    assert.equal(fixture.controller.previewUrl, null);
  } finally { fixture.dispose(); }
});

test('additional provider claims in a companion cannot be imported', async () => {
  const fixture = localController();
  try {
    const { file, manifest } = await roundTrip();
    const tampered = new Blob([JSON.stringify({ ...manifest, result: 'verified' })],
      { type: 'application/json' });
    assert.equal((await fixture.controller.load(tampered, file)).phase, 'refused');
  } finally { fixture.dispose(); }
});

test('the manifest validator does not replace an independently reported release gate', async () => {
  const { json } = await roundTrip();
  const data = await parseOfflineManifest(json);
  assert.equal(data.providerVerified, false);
  assert.equal(data.realFaceTested, false);
  const report = offlineImportEvidence(offlineImportStatus('ready', data));
  assert.equal(JSON.parse(report).realFaceGatePassed, false);
  assert.equal(JSON.parse(report).providerOriginVerified, false);
});

test('new-session permission withdrawal clears the imported local preview', async () => {
  const fixture = localController();
  try {
    const { file, json } = await roundTrip();
    await fixture.controller.load(json, file);
    assert.equal(fixture.controller.snapshot.phase, 'ready');
    fixture.state.setPermission('local', false);
    assert.equal(fixture.controller.snapshot.phase, 'stale');
    assert.equal(fixture.controller.previewUrl, null);
    assert.equal(fixture.revoked.length, 1);
  } finally { fixture.dispose(); }
});

test('operator report for an imported PNG has no fingerprint or file content', async () => {
  const fixture = localController();
  try {
    const { file, json, manifest } = await roundTrip();
    const ready = await fixture.controller.load(json, file);
    const report = offlineImportEvidence(ready);
    assert.equal(JSON.parse(report).imageIntegrityChecked, true);
    assert.ok(!report.includes(manifest.sha256));
    assert.ok(!report.includes('blob:local'));
    assert.ok(!report.includes('image/png'));
    assert.ok(!report.includes('12,14'));
  } finally { fixture.dispose(); }
});
