/** Drawn authority and provenance contract. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  FRAME_CAPTIONS, FRAME_IDS, FRAME_MAX_BYTES, cacheAuthority,
  isFrameId, stateForFrame, validFrame,
} from '../dist/js/layout/continuous/frame-cache-contract.js';
import { drawnState, pixels } from './helpers/local-frame-fixture.mjs';

function allowed() { return drawnState().snapshot; }

test('the only cached families are authored hair, makeup, and skin-reference drawings', () => {
  assert.deepEqual(FRAME_IDS, ['hair', 'makeup', 'skin']);
  assert.equal(isFrameId('new-user-photo'), false);
  assert.equal(isFrameId('makeup'), true);
  assert.ok(FRAME_MAX_BYTES <= 1_048_576);
  for (const id of FRAME_IDS) assert.match(FRAME_CAPTIONS[id], /illustrative|Drawn/i);
});

test('consented drawn main figure permits a private cache authority', () => {
  const key = cacheAuthority(allowed(), true);
  assert.ok(key);
  assert.equal(key.mode, 'mock');
  assert.match(key.signature, /drawn-main/);
});

test('no cache authority exists for an uploaded or unverified source', () => {
  assert.equal(cacheAuthority(allowed(), false), null);
  assert.equal(cacheAuthority({ ...allowed(), selectedId: 'person-from-upload' }, true), null);
  assert.equal(cacheAuthority({ ...allowed(), sourceLoaded: false }, true), null);
  assert.equal(cacheAuthority({ ...allowed(), sourceRevision: 0 }, true), null);
});

for (const denied of ['local', 'hair', 'face', 'mock']) {
  test(`withdrawal of ${denied} refuses mock replay`, () => {
    const base = allowed();
    assert.equal(cacheAuthority({ ...base, permissions: { ...base.permissions, [denied]: false } }, true), null);
  });
}

test('the provider-off branch never requires a mock-provider permission', () => {
  const base = allowed();
  const modified = { ...base, mockMode: 'off', permissions: { ...base.permissions, mock: false } };
  assert.ok(cacheAuthority(modified, true));
});

test('identity lock must be visibly on to make cached images', () => {
  assert.equal(cacheAuthority({ ...allowed(), identityLock: false }, true), null);
});

test('source, subject, mode, permission, style, levels and applied steps change authority', () => {
  const a = allowed();
  const base = cacheAuthority(a, true).signature;
  const cases = [
    { ...a, sourceRevision: 2 },
    { ...a, selectedId: 'drawn-second' },
    { ...a, mockMode: 'off' },
    { ...a, permissions: { ...a.permissions, mock: false }, mockMode: 'off' },
    { ...a, appearanceCue: 'fem' },
    { ...a, levels: { ...a.levels, hair: 4 } },
    { ...a, applied: { ...a.applied, hair: true } },
  ];
  for (const variant of cases) assert.notEqual(cacheAuthority(variant, true)?.signature, base);
});

test('invalid strengths cannot create a reusable frame identity', () => {
  for (const level of [NaN, Infinity, 0, 5.1]) {
    const a = allowed();
    assert.equal(cacheAuthority({ ...a, levels: { ...a.levels, face: 3, hair: level } }, true), null);
  }
});

for (const id of FRAME_IDS) {
  test(`stage ${id} uses local settings and never carries a provider result`, () => {
    const original = allowed();
    const frame = stateForFrame(original, id);
    assert.equal(frame.mockResult, 'not-requested');
    assert.equal(frame.requestedDownload, false);
    assert.deepEqual(frame.permissions, original.permissions);
    assert.equal(frame.applied.hair, id === 'hair');
    assert.equal(frame.applied.concealer, id === 'makeup');
    assert.equal(frame.applied.ratio, id === 'skin');
    assert.equal(original.applied.hair, false);
  });
}

test('valid frame has exact synthetic pixels and disallows provider claims', () => {
  assert.ok(validFrame(pixels()));
  assert.equal(validFrame({ ...pixels(), rgba: new Uint8ClampedArray(4) }), false);
  assert.equal(validFrame({ ...pixels(), providerVerified: true }), false);
  assert.equal(validFrame({ ...pixels(), unitsSpent: 1 }), false);
  assert.equal(validFrame({ ...pixels(), provenance: 'provider' }), false);
  assert.equal(validFrame({ ...pixels(), id: 'unexpected' }), false);
});
