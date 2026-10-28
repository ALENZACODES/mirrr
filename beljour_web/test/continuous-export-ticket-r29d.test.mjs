/** Source and consent revision pinning tests. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { captureExportTicket, stillCurrentExport } from '../dist/js/layout/continuous/export-ticket.js';
import { DRAWN_PAIR } from '../dist/js/layout/subjects/contract.js';

function sample() {
  const source = { width: 512, height: 640 };
  const subjects = {
    revision: 7, source: 'drawn', boxes: DRAWN_PAIR,
    selectedId: 'drawn-main', reason: 'drawn only',
  };
  const state = {
    step: 'save', sourceLoaded: true, faceCount: 2, sourceRevision: 7,
    selectedId: 'drawn-main',
    permissions: { local: true, hair: true, face: true, mock: false },
    identityLock: true,
    levels: { hair: 3, colour: 3, concealer: 3, appearance: 3,
      ratio: 3, turn: 3, posture: 3 },
    applied: { hair: true, colour: true, concealer: true, appearance: false,
      ratio: false, turn: false, posture: false },
    appearanceCue: 'none', mockMode: 'off', mockResult: 'provider-disabled',
    comparePercent: 50, requestedDownload: false,
    completed: [], skipped: [], proCommandsReviewed: [], seasonalId: null,
  };
  return { original: source, state, subjects };
}

function clone(entry) {
  return {
    original: entry.original,
    state: { ...entry.state, permissions: { ...entry.state.permissions },
      levels: { ...entry.state.levels }, applied: { ...entry.state.applied } },
    subjects: { ...entry.subjects, boxes: entry.subjects.boxes.map(box => ({ ...box })) },
  };
}

test('ticket accepts only a current consented selected drawing', () => {
  const image = sample();
  const ticket = captureExportTicket(image);
  assert.equal(ticket.width, 512);
  assert.equal(ticket.height, 640);
  assert.equal(ticket.source, image.original);
  assert.equal(stillCurrentExport(ticket, clone(image)), true);
  assert.equal(Object.isFrozen(ticket), true);
});

for (const [title, change] of [
  ['local permission', x => { x.state.permissions.local = false; }],
  ['identity lock', x => { x.state.identityLock = false; }],
  ['selected person', x => {
    x.state.selectedId = 'drawn-guest';
    x.subjects.selectedId = 'drawn-guest';
  }],
  ['source revision', x => {
    x.state.sourceRevision = 8;
    x.subjects.revision = 8;
  }],
  ['local source canvas', x => { x.original = { width: 512, height: 640 }; }],
  ['source dimensions', x => { x.original = { width: 510, height: 640 }; }],
  ['bystander position', x => { x.subjects.boxes[1].x = 0.54; }],
  ['second person removed', x => {
    x.subjects.boxes = x.subjects.boxes.slice(0, 1);
    x.state.faceCount = 1;
  }],
  ['face consent', x => { x.state.permissions.face = false; }],
  ['hair consent', x => { x.state.permissions.hair = false; }],
  ['mock consent', x => { x.state.permissions.mock = true; }],
  ['mock result', x => { x.state.mockResult = 'mock-applied'; }],
  ['provider mode', x => { x.state.mockMode = 'mock'; }],
  ['seasonal catalogue choice', x => { x.state.seasonalId = 'owner-pack'; }],
  ['appearance cue', x => { x.state.appearanceCue = 'masc'; }],
  ['hair applied', x => { x.state.applied.hair = false; }],
  ['posture intensity', x => { x.state.levels.posture = 4.1; }],
  ['facial intensity', x => { x.state.levels.concealer = 2.1; }],
]) {
  test(`ticket is stale after ${title} changes`, () => {
    const input = sample();
    const ticket = captureExportTicket(input);
    const newer = clone(input);
    change(newer);
    assert.equal(stillCurrentExport(ticket, newer), false);
  });
}

test('navigation and prior download bookkeeping do not alter image identity', () => {
  const input = sample();
  const ticket = captureExportTicket(input);
  const next = clone(input);
  next.state.step = 'compare';
  next.state.requestedDownload = true;
  next.state.comparePercent = 75;
  next.state.completed.push('hair');
  assert.equal(stillCurrentExport(ticket, next), true);
});

for (const [title, change] of [
  ['not selected', x => { x.state.selectedId = null; }],
  ['selected wrong person', x => { x.subjects.selectedId = 'drawn-guest'; }],
  ['real detector substituted', x => { x.subjects.source = 'detected'; }],
  ['unknown source', x => { x.subjects.source = 'none'; }],
  ['mixed origin', x => { x.subjects.boxes[0].origin = 'detected'; }],
  ['no local permission', x => { x.state.permissions.local = false; }],
  ['identity unlocked', x => { x.state.identityLock = false; }],
  ['source not loaded', x => { x.state.sourceLoaded = false; }],
  ['unmatched subject revision', x => { x.subjects.revision = 9; }],
  ['zero image dimension', x => { x.original = { width: 0, height: 640 }; }],
  ['oversized drawing', x => { x.original = { width: 6000, height: 6000 }; }],
  ['too many faces', x => { x.state.faceCount = 30; }],
  ['invalid strength', x => { x.state.levels.hair = 4.05; }],
  ['missing image canvas', x => { x.original = null; }],
]) {
  test(`ticket rejects ${title}`, () => {
    const input = clone(sample());
    change(input);
    assert.throws(() => captureExportTicket(input));
  });
}

test('every effect level uses validated decimal precision', () => {
  for (const effect of Object.keys(sample().state.levels)) {
    const original = sample();
    for (const level of [1, 1.1, 2.8, 3.9, 5]) {
      original.state.levels[effect] = level;
      assert.doesNotThrow(() => captureExportTicket(original));
    }
    for (const level of [0, 5.1, NaN, Infinity, 1.005]) {
      original.state.levels[effect] = level;
      assert.throws(() => captureExportTicket(original));
    }
  }
});

test('no image bytes or personal filename are included in a ticket', () => {
  const ticket = captureExportTicket(sample());
  assert.equal(Object.keys(ticket).sort().join(','), 'height,signature,source,width');
  assert.doesNotMatch(ticket.signature, /data:image|\.png|\.jpg|biometric|EXIF/);
});
