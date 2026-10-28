/** Local replay report cannot certify live, payment or real-face gates. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cassetteAudit, serializeCassetteAudit, parseCassetteAudit } from
  '../dist/js/layout/continuous/cassette-report.js';
import { CassetteSession } from '../dist/js/layout/continuous/cassette-session.js';
import { ContinuousDemoState } from '../dist/js/layout/continuous/state.js';

function fixture() {
  const state = new ContinuousDemoState();
  state.chooseDrawnSource(4, 2, 'drawn-main');
  for (const scope of ['local', 'hair', 'face', 'mock']) state.setPermission(scope, true);
  const cassette = new CassetteSession(false);
  cassette.warm(state.snapshot, true);
  return { state, cassette };
}

test('zero-observation local report has all external gates false', () => {
  const { state, cassette } = fixture();
  const report = cassetteAudit(cassette.snapshot);
  assert.equal(report.providerRequests, 0);
  assert.equal(report.unitsSpent, 0);
  assert.equal(report.photoUploaded, false);
  assert.equal(report.realFaceTested, false);
  assert.equal(report.productionProviderVerified, false);
  assert.equal(report.releaseGatePassed, false);
  assert.deepEqual(report.observedIds, []);
  cassette.dispose();
  state.dispose();
});

test('multiple cached reads appear only as fixed metadata identifiers', () => {
  const { state, cassette } = fixture();
  cassette.choose('drawn-hair', state.snapshot, true);
  cassette.choose('drawn-makeup', state.snapshot, true);
  const encoded = serializeCassetteAudit(cassetteAudit(cassette.snapshot));
  assert.deepEqual(JSON.parse(encoded).observedIds, ['drawn-hair', 'drawn-makeup']);
  assert.doesNotMatch(encoded, /drawn-main|subjectId|photoBytes|fileName|base64|data:image|sha256/i);
  cassette.dispose();
  state.dispose();
});

test('a serialized metadata-only report round-trips under the exact schema', () => {
  const { state, cassette } = fixture();
  cassette.choose('drawn-skin', state.snapshot, true);
  const report = cassetteAudit(cassette.snapshot);
  assert.deepEqual(parseCassetteAudit(serializeCassetteAudit(report)), report);
  cassette.dispose();
  state.dispose();
});

test('forged live-provider and frozen-release claims are rejected', () => {
  const { state, cassette } = fixture();
  const report = cassetteAudit(cassette.snapshot);
  for (const modification of [
    { providerRequests: 1 }, { unitsSpent: 1 }, { photoUploaded: true },
    { realFaceTested: true }, { productionProviderVerified: true },
    { releaseGatePassed: true },
  ]) {
    assert.throws(() => serializeCassetteAudit({ ...report, ...modification }), /release evidence/);
  }
  cassette.dispose();
  state.dispose();
});

test('imported reports reject unknown fields, arbitrary text and identifiers', () => {
  const { state, cassette } = fixture();
  const report = cassetteAudit(cassette.snapshot);
  assert.throws(() => parseCassetteAudit(JSON.stringify({ ...report, notes: 'private' })), /fields/);
  assert.throws(() => parseCassetteAudit(JSON.stringify({ ...report, observedIds: ['not-a-card'] })), /cache/);
  assert.throws(() => parseCassetteAudit(JSON.stringify({ ...report, observedIds: ['drawn-hair', 'drawn-hair'] })), /cache/);
  assert.throws(() => parseCassetteAudit('not json'), /JSON/);
  cassette.dispose();
  state.dispose();
});

test('large inputs fail before parse or any implied upload', () => {
  assert.throws(() => parseCassetteAudit(' '.repeat(2049)), /Invalid audit/);
  assert.throws(() => parseCassetteAudit(new Uint8Array([1, 2, 3])), /Invalid audit/);
  assert.throws(() => parseCassetteAudit(null), /Invalid audit/);
});

test('replay report never stores product prices, person labels or credentials', () => {
  const { state, cassette } = fixture();
  const encoded = serializeCassetteAudit(cassetteAudit(cassette.snapshot));
  for (const forbidden of ['costPerUnit', 'price', 'sessionId', 'faceId', 'token',
    'providerResponse', 'photoBytes', 'payment', 'checkout']) {
    assert.equal(encoded.includes(forbidden), false);
  }
  cassette.dispose();
  state.dispose();
});
