/** Strict local manifest and consent contracts. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  OFFLINE_IMPORT_LABEL,
  checkedOfflineImportManifest,
  offlineImportAuthority,
  offlineImportEvidence,
  offlineImportStatus,
  parseOfflineManifest,
  sameOfflineImportAuthority,
} from '../dist/js/layout/continuous/offline-import-contract.js';
import { localFiles, localState } from './helpers/offline-import-fixture.mjs';

const manifest = async changes => JSON.parse(await (await localFiles(changes)).manifest.text());

test('manifest accepts a bounded unverified local image declaration', async () => {
  const valid = checkedOfflineImportManifest(await manifest());
  assert.equal(valid.family, 'hair');
  assert.equal(valid.providerVerified, false);
  assert.equal(valid.unitsSpentByViewer, 0);
  assert.ok(Object.isFrozen(valid));
  assert.match(OFFLINE_IMPORT_LABEL, /ORIGIN NOT VERIFIED/);
});

test('manifest rejects schema version, arbitrary identifiers, and executable URLs', async () => {
  const baseline = await manifest();
  for (const change of [
    { format: 'beljour-local-png-replay/2' },
    { accountId: '123' },
    { url: 'https://example.invalid/secret' },
    { sessionId: 'private' },
    { path: '/private/face.png' },
    { script: '<script>' },
    { provider: 'youcam' },
    { mediaType: 'image/jpeg' },
  ]) {
    assert.throws(() => checkedOfflineImportManifest({ ...baseline, ...change }), /manifest|format|fields/i);
  }
});

test('category is exactly hair, makeup, or skin', async () => {
  const baseline = await manifest();
  for (const family of ['hair', 'makeup', 'skin']) {
    assert.equal(checkedOfflineImportManifest({ ...baseline, family }).family, family);
  }
  for (const family of ['pose', 'skin-ai', 'Hair', '', null, 1, {}]) {
    assert.throws(() => checkedOfflineImportManifest({ ...baseline, family }), /category/);
  }
});

test('provider and real-face acceptance can never be asserted by a local file', async () => {
  const baseline = await manifest();
  for (const claim of [
    { providerVerified: true }, { realFaceTested: true }, { unitsSpentByViewer: 2 },
    { source: 'verified-provider' }, { scene: 'uploaded-face' },
  ]) {
    assert.throws(() => checkedOfflineImportManifest({ ...baseline, ...claim }));
  }
});

test('dimensions, byte count and SHA-256 are validated, not coerced', async () => {
  const baseline = await manifest();
  for (const claim of [
    { width: 0 }, { height: -1 }, { width: '8' }, { height: NaN },
    { width: 12001 }, { width: 5000, height: 5000 },
    { size: 0 }, { size: 48 * 1024 * 1024 + 1 },
    { sha256: 'AAA' }, { sha256: 'f'.repeat(63) },
    { sha256: 'F'.repeat(64) },
  ]) {
    assert.throws(() => checkedOfflineImportManifest({ ...baseline, ...claim }));
  }
});

test('parser bounds JSON reads before text decoding', async () => {
  const files = await localFiles();
  assert.equal((await parseOfflineManifest(files.manifest)).width, 8);
  await assert.rejects(parseOfflineManifest(new Blob(['x'.repeat(8193)],
    { type: 'application/json' })), /8 KiB/);
  await assert.rejects(parseOfflineManifest(new Blob(['{}'],
    { type: 'application/json' })), /8 KiB/);
  await assert.rejects(parseOfflineManifest(new Blob(['x'.repeat(100)],
    { type: 'text/html' })), /JSON/);
  await assert.rejects(parseOfflineManifest(new Blob(['{broken'].concat([' '.repeat(80)]),
    { type: 'application/json' })), /JSON/);
});

test('import authority binds source, subject, permissions and every strength', () => {
  const state = localState();
  try {
    const first = offlineImportAuthority(state.snapshot, true, 'hair');
    assert.equal(first.selectedId, 'drawn-main');
    assert.equal(offlineImportAuthority(state.snapshot, false, 'hair'), null);
    assert.equal(sameOfflineImportAuthority(first, first), true);
    state.setStrength('hair', 4.1);
    const changed = offlineImportAuthority(state.snapshot, true, 'hair');
    assert.equal(sameOfflineImportAuthority(first, changed), false);
    state.setPermission('hair', false);
    assert.equal(offlineImportAuthority(state.snapshot, true, 'hair'), null);
    assert.ok(offlineImportAuthority(state.snapshot, true, 'makeup'));
  } finally { state.dispose(); }
});

test('identity lock, local consent and current subject are all mandatory', () => {
  const state = localState();
  try {
    state.setIdentityLock(false);
    assert.equal(offlineImportAuthority(state.snapshot, true, 'hair'), null);
    state.setIdentityLock(true);
    state.setPermission('local', false);
    assert.equal(offlineImportAuthority(state.snapshot, true, 'hair'), null);
    state.setPermission('local', true);
    assert.ok(offlineImportAuthority(state.snapshot, true, 'hair'));
  } finally { state.dispose(); }
});

test('safe evidence never includes a filename, URL, hash, or photograph', () => {
  const safe = offlineImportEvidence(offlineImportStatus('ready', {
    family: 'hair', width: 8, height: 8,
  }));
  assert.equal(JSON.parse(safe).imageIntegrityChecked, true);
  for (const field of ['fileName', 'name', 'sha256', 'blob:', 'url', 'photoBytes', 'token']) {
    assert.ok(!safe.includes(field));
  }
  assert.equal(JSON.parse(safe).providerOriginVerified, false);
  assert.equal(JSON.parse(safe).realFaceGatePassed, false);
});

test('forged evidence cannot imply production acceptance', () => {
  const phase = offlineImportStatus('ready');
  assert.throws(() => offlineImportEvidence({ ...phase, providerCalls: 1 }));
  assert.throws(() => offlineImportEvidence({ ...phase, verifiedProviderOrigin: true }));
  assert.throws(() => offlineImportEvidence({ ...phase, imagePersisted: true }));
  assert.throws(() => offlineImportEvidence({ ...phase, phase: 'passed' }));
});
