/** Stale callbacks and consent changes must never revive a cassette. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CassetteSession } from '../dist/js/layout/continuous/cassette-session.js';
import { ContinuousDemoState } from '../dist/js/layout/continuous/state.js';

function model(mode = 'mock') {
  const state = new ContinuousDemoState();
  state.chooseDrawnSource(11, 2, 'drawn-main');
  state.setPermission('local', true);
  state.setPermission('hair', true);
  state.setPermission('face', true);
  if (mode === 'mock') state.setPermission('mock', true);
  state.chooseMockMode(mode);
  const cassette = new CassetteSession(false);
  cassette.warm(state.snapshot, true);
  return { cassette, state, close() { cassette.dispose(); state.dispose(); } };
}

test('provider-off cassette reads work with only local relevant-edit permission', () => {
  const { cassette, state, close } = model('off');
  try {
    assert.equal(state.snapshot.permissions.mock, false);
    assert.equal(cassette.canRead('drawn-hair', state.snapshot, true), true);
    assert.equal(cassette.canRead('drawn-makeup', state.snapshot, true), true);
    const result = cassette.choose('drawn-hair', state.snapshot, true);
    assert.equal(result.providerMode, 'off');
    assert.equal(result.unitsSpent, 0);
    assert.equal(cassette.addToBag(state.snapshot, true), true);
  } finally { close(); }
});

test('mock mode needs separate consent even for an authored cached example', () => {
  const { cassette, state, close } = model('off');
  try {
    state.chooseMockMode('mock');
    assert.equal(cassette.canRead('drawn-hair', state.snapshot, true), false);
    assert.equal(cassette.choose('drawn-hair', state.snapshot, true).status, 'consent-required');
    assert.equal(cassette.addToBag(state.snapshot, true), false);
  } finally { close(); }
});

test('stale bag action is refused after a subject change', () => {
  const { cassette, state, close } = model();
  try {
    cassette.choose('drawn-hair', state.snapshot, true);
    state.selectSubject('drawn-second', true);
    assert.equal(cassette.addToBag(state.snapshot, true), false);
    assert.equal(cassette.snapshot.bag.items.length, 0);
  } finally { close(); }
});

test('stale bag action is refused after permission is withdrawn', () => {
  const { cassette, state, close } = model();
  try {
    cassette.choose('drawn-makeup', state.snapshot, true);
    state.setPermission('face', false);
    assert.equal(cassette.addToBag(state.snapshot, true), false);
    assert.equal(cassette.snapshot.bag.items.length, 0);
  } finally { close(); }
});

test('a stale acknowledged route is refused after a source revision changes', () => {
  const { state, close } = model();
  const cassette = new CassetteSession(true);
  try {
    cassette.warm(state.snapshot, true);
    cassette.choose('drawn-hair', state.snapshot, true);
    cassette.acknowledge(true);
    assert.equal(cassette.route(state.snapshot, true).available, true);
    state.chooseDrawnSource(12, 2, 'drawn-main');
    assert.equal(cassette.route(state.snapshot, true), null);
  } finally { cassette.dispose(); close(); }
});

test('changing from a drawn source to an upload makes cached routes unavailable', () => {
  const { cassette, state, close } = model();
  try {
    cassette.choose('drawn-hair', state.snapshot, true);
    assert.equal(cassette.canRead('drawn-hair', state.snapshot, false), false);
    assert.equal(cassette.status('drawn-hair', state.snapshot, false), 'no-source');
    assert.equal(cassette.route(state.snapshot, false), null);
  } finally { close(); }
});

test('changes to decimal intensity can explicitly reset cached bag evidence', () => {
  const { cassette, state, close } = model();
  try {
    cassette.choose('drawn-hair', state.snapshot, true);
    assert.equal(cassette.addToBag(state.snapshot, true), true);
    state.setStrength('hair', 4.3);
    cassette.warm(state.snapshot, true);
    assert.equal(state.snapshot.levels.hair, 4.3);
    assert.equal(cassette.snapshot.observed.length, 0);
    assert.equal(cassette.snapshot.bag.items.length, 0);
  } finally { close(); }
});

test('stale provider screen acknowledgement is erased by a rebind', () => {
  const { state, close } = model();
  const cassette = new CassetteSession(true);
  try {
    cassette.warm(state.snapshot, true);
    cassette.choose('drawn-skin', state.snapshot, true);
    cassette.acknowledge(true);
    assert.equal(cassette.snapshot.acknowledged, true);
    cassette.warm(state.snapshot, true);
    assert.equal(cassette.snapshot.acknowledged, false);
    assert.equal(cassette.snapshot.selectedId, null);
    assert.equal(cassette.route(state.snapshot, true), null);
  } finally { cassette.dispose(); close(); }
});

test('no old cache read can be promoted by a new consent session', () => {
  const { cassette, state, close } = model();
  try {
    const old = cassette.choose('drawn-hair', state.snapshot, true);
    state.setPermission('local', false);
    cassette.warm(state.snapshot, true);
    state.setPermission('local', true);
    cassette.warm(state.snapshot, true);
    assert.equal(cassette.snapshot.observed.length, 0);
    assert.equal(cassette.snapshot.lastResult, null);
    assert.equal(cassette.snapshot.providerCalls, 0);
    assert.equal(old.liveVerified, false);
  } finally { close(); }
});
