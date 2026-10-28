/** Synthetic checks and independent release evidence remain separate. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cassetteJourney, cassetteJourneyCaption } from
  '../dist/js/layout/continuous/cassette-journey.js';
import { CassetteSession } from '../dist/js/layout/continuous/cassette-session.js';
import { ContinuousDemoState } from '../dist/js/layout/continuous/state.js';

function prepared() {
  const state = new ContinuousDemoState();
  state.chooseDrawnSource(5, 2, 'drawn-main');
  for (const permission of ['local', 'hair', 'face', 'mock']) state.setPermission(permission, true);
  const cassette = new CassetteSession(false);
  cassette.warm(state.snapshot, true);
  return { state, cassette };
}

test('a new walkthrough reports only source, person and consent as observed', () => {
  const { state, cassette } = prepared();
  const summary = cassetteJourney(state.snapshot, cassette.snapshot);
  assert.equal(summary.format, 'beljour-cassette-journey/1');
  assert.equal(summary.observedCount, 3);
  assert.equal(summary.totalCount, 11);
  assert.equal(summary.rows[3].status, 'missing');
  assert.equal(summary.verifiedProvider, false);
  assert.equal(summary.verifiedFaceQuality, false);
  assert.equal(summary.releasePassed, false);
  cassette.dispose();
  state.dispose();
});

test('each viewed cached example advances only its own checklist entry', () => {
  const { state, cassette } = prepared();
  cassette.choose('drawn-hair', state.snapshot, true);
  assert.equal(cassetteJourney(state.snapshot, cassette.snapshot).rows[4].status, 'observed');
  assert.equal(cassetteJourney(state.snapshot, cassette.snapshot).rows[5].status, 'missing');
  cassette.choose('drawn-makeup', state.snapshot, true);
  assert.equal(cassetteJourney(state.snapshot, cassette.snapshot).rows[5].status, 'observed');
  cassette.choose('drawn-skin', state.snapshot, true);
  assert.equal(cassetteJourney(state.snapshot, cassette.snapshot).rows[6].status, 'observed');
  cassette.dispose();
  state.dispose();
});

test('a demo bag is not counted until a cached item is explicitly added', () => {
  const { state, cassette } = prepared();
  cassette.choose('drawn-hair', state.snapshot, true);
  assert.equal(cassetteJourney(state.snapshot, cassette.snapshot).rows[7].status, 'missing');
  cassette.addToBag(state.snapshot, true);
  assert.equal(cassetteJourney(state.snapshot, cassette.snapshot).rows[7].status, 'observed');
  cassette.dispose();
  state.dispose();
});

test('a provider-off test is a local observation but never provider verification', () => {
  const { state, cassette } = prepared();
  state.recordTryon('provider-disabled');
  const journey = cassetteJourney(state.snapshot, cassette.snapshot);
  assert.equal(journey.rows[8].status, 'observed');
  assert.equal(journey.verifiedProvider, false);
  assert.equal(journey.providerUnits, 0);
  cassette.dispose();
  state.dispose();
});

test('a mock applied result is not a live provider result', () => {
  const { state, cassette } = prepared();
  state.recordTryon('mock-applied');
  assert.equal(cassetteJourney(state.snapshot, cassette.snapshot).rows[8].status, 'observed');
  assert.match(cassetteJourneyCaption(cassetteJourney(state.snapshot, cassette.snapshot)), /unverified/);
  cassette.dispose();
  state.dispose();
});

test('zero or partial edits cannot falsely mark the seven-edit milestone', () => {
  const { state, cassette } = prepared();
  assert.equal(cassetteJourney(state.snapshot, cassette.snapshot).rows[3].status, 'missing');
  const partial = { ...state.snapshot, applied: { ...state.snapshot.applied, hair: true } };
  assert.equal(cassetteJourney(partial, cassette.snapshot).rows[3].status, 'missing');
  const all = Object.fromEntries(Object.keys(state.snapshot.applied).map(id => [id, true]));
  const entire = { ...state.snapshot, applied: all };
  assert.equal(cassetteJourney(entire, cassette.snapshot).rows[3].status, 'observed');
  cassette.dispose();
  state.dispose();
});

test('the export milestone means a request, not verified file creation', () => {
  const { state, cassette } = prepared();
  const before = cassetteJourney(state.snapshot, cassette.snapshot);
  assert.equal(before.rows.at(-1).status, 'missing');
  const requested = cassetteJourney({ ...state.snapshot, requestedDownload: true }, cassette.snapshot);
  assert.equal(requested.rows.at(-1).status, 'observed');
  assert.equal(requested.verifiedProvider, false);
  assert.equal(requested.releasePassed, false);
  cassette.dispose();
  state.dispose();
});

test('the journey summary refuses invented provider or release successes', () => {
  const { state, cassette } = prepared();
  const summary = cassetteJourney(state.snapshot, cassette.snapshot);
  for (const attempted of [
    { ...summary, providerUnits: 1 },
    { ...summary, photoUploaded: true },
    { ...summary, verifiedProvider: true },
    { ...summary, verifiedFaceQuality: true },
    { ...summary, releasePassed: true },
    { ...summary, observedCount: 20 },
    { ...summary, rows: [] },
    { ...summary, rows: [{ ...summary.rows[0], id: 'unknown' }, ...summary.rows.slice(1)] },
  ]) assert.throws(() => cassetteJourneyCaption(attempted), /Untrusted|Invalid|Unexpected|Unrecognized/);
  cassette.dispose();
  state.dispose();
});

test('a cleared cache removes previous evidence, including the bag', () => {
  const { state, cassette } = prepared();
  cassette.choose('drawn-hair', state.snapshot, true);
  cassette.addToBag(state.snapshot, true);
  const active = cassetteJourney(state.snapshot, cassette.snapshot);
  assert.equal(active.rows[4].status, 'observed');
  assert.equal(active.rows[7].status, 'observed');
  cassette.warm(state.snapshot, true);
  const empty = cassetteJourney(state.snapshot, cassette.snapshot);
  assert.equal(empty.rows[4].status, 'missing');
  assert.equal(empty.rows[7].status, 'missing');
  cassette.dispose();
  state.dispose();
});
