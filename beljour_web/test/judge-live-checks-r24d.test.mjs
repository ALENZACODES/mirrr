import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  JudgeLiveChecks,
  REAL_DEMO_CHECKS,
  validateManualChecks,
} from '../dist/js/layout/judge-live-checks.js';

function completeSome() {
  const checklist = new JudgeLiveChecks();
  checklist.set('photo-open', 'operator-observed');
  checklist.set('studio-edit', 'operator-observed');
  checklist.set('hair-response', 'blocked');
  return checklist;
}

test('manual checks always begin unobserved, including the provider rows', () => {
  const checklist = new JudgeLiveChecks();
  const snapshot = checklist.snapshot();
  assert.equal(checklist.count, REAL_DEMO_CHECKS.length);
  assert.equal(snapshot.notRun, REAL_DEMO_CHECKS.length);
  assert.equal(snapshot.observed, 0);
  assert.equal(snapshot.blocked, 0);
  assert.equal(snapshot.provenance, 'operator-reported-not-certified');
  assert.equal(snapshot.verifiedProvider, false);
  assert.equal(snapshot.releasePassed, false);
  assert.deepEqual(validateManualChecks(snapshot), []);
});

test('an operator may mark a task observed without calling or certifying a provider', () => {
  const checklist = completeSome();
  const snapshot = checklist.snapshot();
  assert.equal(snapshot.observed, 2);
  assert.equal(snapshot.blocked, 1);
  assert.equal(snapshot.notRun, REAL_DEMO_CHECKS.length - 3);
  assert.equal(snapshot.rows.find(row => row.id === 'hair-response').status, 'blocked');
  assert.equal(snapshot.verifiedProvider, false);
  assert.equal(snapshot.releasePassed, false);
  assert.deepEqual(validateManualChecks(snapshot), []);
});

test('setting the same status twice is idempotent', () => {
  const checklist = new JudgeLiveChecks();
  assert.equal(checklist.set('photo-open', 'operator-observed'), true);
  assert.equal(checklist.set('photo-open', 'operator-observed'), false);
  assert.equal(checklist.set('photo-open', 'blocked'), true);
  assert.equal(checklist.status('photo-open'), 'blocked');
  assert.equal(checklist.snapshot().blocked, 1);
});

test('unknown IDs and statuses do not enter the checklist', () => {
  const checklist = new JudgeLiveChecks();
  assert.equal(checklist.set('not-listed', 'operator-observed'), false);
  assert.equal(checklist.set('photo-open', 'passed'), false);
  assert.equal(checklist.set('photo-open', null), false);
  assert.throws(() => checklist.status('not-listed'), RangeError);
  assert.equal(checklist.snapshot().notRun, REAL_DEMO_CHECKS.length);
});

test('snapshots cannot mutate another result or future operator choice', () => {
  const checklist = completeSome();
  const snapshot = checklist.snapshot();
  snapshot.rows[0].status = 'blocked';
  const reread = checklist.snapshot();
  assert.equal(reread.rows[0].status, 'operator-observed');
  checklist.set('photo-open', 'blocked');
  assert.equal(reread.rows[0].status, 'operator-observed');
  assert.equal(checklist.snapshot().rows[0].status, 'blocked');
});

test('reset clears every manual mark rather than retaining previous provider checks', () => {
  const checklist = completeSome();
  checklist.reset();
  const snapshot = checklist.snapshot();
  assert.equal(snapshot.observed, 0);
  assert.equal(snapshot.blocked, 0);
  assert.equal(snapshot.notRun, REAL_DEMO_CHECKS.length);
  assert.deepEqual(validateManualChecks(snapshot), []);
});

test('dispose refuses future state changes and clears existing observations', () => {
  const checklist = completeSome();
  checklist.dispose();
  assert.equal(checklist.set('photo-open', 'operator-observed'), false);
  assert.equal(checklist.snapshot().observed, 0);
  assert.equal(checklist.snapshot().notRun, REAL_DEMO_CHECKS.length);
});

test('manual provenance cannot be rewritten into a provider or release pass', () => {
  const checklist = completeSome();
  const base = checklist.snapshot();
  assert.ok(validateManualChecks({ ...base, releasePassed: true }).length > 0);
  assert.ok(validateManualChecks({ ...base, verifiedProvider: true }).length > 0);
  assert.ok(validateManualChecks({ ...base, provenance: 'verified-by-test' }).length > 0);
});

test('row order, fixed labels and counts are checked before report serialization', () => {
  const base = completeSome().snapshot();
  assert.ok(validateManualChecks({ ...base, rows: [...base.rows].reverse() }).length > 0);
  assert.ok(validateManualChecks({ ...base, rows: base.rows.slice(1) }).length > 0);
  const forged = base.rows.map(row => row.id === 'photo-open'
    ? { ...row, title: 'private source and name', status: 'operator-observed' }
    : row);
  assert.ok(validateManualChecks({ ...base, rows: forged }).length > 0);
  assert.ok(validateManualChecks({ ...base, observed: 99 }).length > 0);
});

test('every declared checklist row has an explanation and an independently scoped route', () => {
  const ids = new Set();
  for (const row of REAL_DEMO_CHECKS) {
    assert.equal(ids.has(row.id), false);
    ids.add(row.id);
    assert.ok(row.title.length > 5);
    assert.ok(row.question.length > 20);
    assert.ok(row.limitation.length > 20);
  }
  assert.equal(ids.size, REAL_DEMO_CHECKS.length);
});

test('a sparse or malformed checklist cannot crash validation or be serialized', () => {
  const snapshot = completeSome().snapshot();
  const sparse = Array.from({ length: snapshot.rows.length });
  assert.ok(validateManualChecks({ ...snapshot, rows: sparse }).length > 0);
  const missing = snapshot.rows.slice();
  missing[0] = null;
  assert.ok(validateManualChecks({ ...snapshot, rows: missing }).length > 0);
});
