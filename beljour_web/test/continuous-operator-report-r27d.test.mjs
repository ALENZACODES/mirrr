import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  safeOperatorReport,
  serializeOperatorReport,
  validateOperatorReport,
} from '../dist/js/layout/continuous/operator-report.js';
import { OperatorRehearsal } from '../dist/js/layout/continuous/operator-state.js';

function ready() {
  let time = 500;
  const state = new OperatorRehearsal(() => time);
  state.start();
  return { state, advance: (ms) => { time += ms; } };
}

test('a manual report carries only fixed row IDs and status codes', () => {
  const { state, advance } = ready();
  advance(125);
  state.open('photo');
  state.acknowledge('photo');
  state.refuse('hair', 'no-consent');
  const report = safeOperatorReport(state.snapshot);
  assert.equal(report.format, 'beljour-operator-rehearsal/1');
  assert.equal(report.dataPolicy, 'fixed-metadata-only');
  assert.equal(report.providerVerified, false);
  assert.equal(report.realFaceVerified, false);
  assert.equal(report.frozenReleaseVerified, false);
  assert.equal(report.completeForSubmission, false);
  assert.equal(report.rows.find(row => row.id === 'photo').state, 'self-reported');
  assert.equal(report.rows.find(row => row.id === 'hair').refusal, 'no-consent');
  const copy = serializeOperatorReport(report);
  assert.ok(copy.length < 4096);
  assert.deepEqual(JSON.parse(copy), report);
  assert.equal(validateOperatorReport(JSON.parse(copy)), true);
  assert.doesNotMatch(copy, /data:image|https?:\/\/|base64|filename|photo\.jpg|authorization/i);
});

test('reports omit route text, href, thumbnails, raw notes, and injected fields', () => {
  const { state } = ready();
  const snapshot = state.snapshot;
  const changed = {
    ...snapshot,
    rows: snapshot.rows.map(row => ({
      ...row,
      title: 'Sensitive visitor name',
      href: 'https://unexpected.invalid/secret',
      unsafeNote: 'private-dataset-data',
    })),
  };
  const copy = serializeOperatorReport(safeOperatorReport(changed));
  assert.doesNotMatch(copy, /Sensitive visitor name|unexpected\.invalid|private-dataset-data/);
  assert.deepEqual(JSON.parse(copy).rows[0], {
    id: 'photo', state: 'not-started', refusal: null, elapsedMs: null,
  });
});

test('forged provider verification and release approval fail report validation', () => {
  const { state } = ready();
  const report = safeOperatorReport(state.snapshot);
  for (const name of [
    'providerVerified', 'realFaceVerified', 'frozenReleaseVerified', 'completeForSubmission',
  ]) {
    const changed = { ...report, [name]: true };
    assert.equal(validateOperatorReport(changed), false, name);
    assert.throws(() => serializeOperatorReport(changed), /Invalid/);
  }
});

test('malformed clock, inconsistent rows, unknown fields, and extra PII are rejected', () => {
  const { state } = ready();
  const report = safeOperatorReport(state.snapshot);
  assert.equal(validateOperatorReport({ ...report, email: 'private@example.org' }), false);
  assert.equal(validateOperatorReport({ ...report, clock: { ...report.clock, activeMs: -3 } }), false);
  assert.equal(validateOperatorReport({ ...report, clock: { ...report.clock, exceeded: true } }), false);
  assert.equal(validateOperatorReport({ ...report, rows: [...report.rows, report.rows[0]] }), false);
  assert.equal(validateOperatorReport({ ...report, rows: report.rows.slice(1) }), false);
  assert.equal(validateOperatorReport({ ...report, rows: report.rows.map((row, index) => index === 0
    ? { ...row, state: 'verified' } : row) }), false);
  assert.equal(validateOperatorReport({ ...report, rows: report.rows.map((row, index) => index === 0
    ? { ...row, file: 'private.png' } : row) }), false);
  assert.equal(validateOperatorReport({ ...report, rows: report.rows.map((row, index) => index === 0
    ? { ...row, elapsedMs: 1 } : row) }), false);
  assert.equal(validateOperatorReport({ ...report, rows: report.rows.map((row, index) => index === 0
    ? { ...row, refusal: 'offline' } : row) }), false);
});

test('report cannot accept fake release flags added to state snapshots', () => {
  const { state } = ready();
  const original = state.snapshot;
  const forged = { ...original, counts: { ...original.counts, providerProved: true } };
  assert.throws(() => safeOperatorReport(forged), /certify/);
  const forgedRow = { ...original, rows: original.rows.map((row, index) => index === 0
    ? { ...row, liveVerified: true } : row) };
  assert.throws(() => safeOperatorReport(forgedRow), /unverified/);
});
