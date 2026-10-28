import assert from 'node:assert/strict';
import { test } from 'node:test';
import { OperatorRehearsal } from '../dist/js/layout/continuous/operator-state.js';
import { safeOperatorReport, validateOperatorReport } from '../dist/js/layout/continuous/operator-report.js';
import { inspectOperatorControls } from '../dist/js/layout/continuous/operator-accessibility.js';
import { renderContinuousOperator } from '../dist/js/ui/shell/continuous-operator-panel.js';
import { OPERATOR_ROUTE_IDS } from '../dist/js/layout/continuous/operator-contract.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function fixture() {
  let now = 0;
  const run = new OperatorRehearsal(() => now);
  const advance = ms => { now += ms; };
  return { run, advance };
}

test('an operator report cannot contain observations from the future', () => {
  const { run, advance } = fixture();
  run.start();
  advance(30);
  run.open('photo');
  const snapshot = run.snapshot;
  const altered = { ...snapshot, rows: snapshot.rows.map(row => row.id === 'photo'
    ? { ...row, elapsedMs: 3000 } : row) };
  assert.throws(() => safeOperatorReport(altered), /later than/);
  const correct = safeOperatorReport(snapshot);
  assert.equal(validateOperatorReport({ ...correct, rows: correct.rows.map(row => row.id === 'photo'
    ? { ...row, elapsedMs: 3000 } : row) }), false);
  run.dispose();
});

test('operator counts remain in a fixed seven-route model after every transition', () => {
  const { run } = fixture();
  run.start();
  for (const id of OPERATOR_ROUTE_IDS) run.open(id);
  assert.equal(run.snapshot.counts.opened, 7);
  run.acknowledge('photo');
  run.refuse('hair', 'not-verified');
  run.clear('trust');
  const counts = run.snapshot.counts;
  assert.equal(counts.notStarted + counts.opened + counts.selfReported + counts.refused, 7);
  assert.equal(counts.providerProved, false);
  assert.equal(counts.realFaceProved, false);
  assert.equal(counts.releaseProved, false);
  run.dispose();
});

test('a stopped rehearsal cannot add new manual marks', () => {
  const { run } = fixture();
  run.start();
  run.open('studio');
  run.clock.stop();
  assert.equal(run.open('photo'), false);
  assert.equal(run.acknowledge('studio'), false);
  assert.equal(run.refuse('hair', 'unavailable'), false);
  assert.equal(run.snapshot.counts.opened, 1);
  assert.equal(run.snapshot.clock.status, 'stopped');
  run.dispose();
});

test('finished and paused states do not change accessible route links', () => {
  const app = judgeDOM();
  const { run } = fixture();
  try {
    run.start();
    run.open('shade');
    run.acknowledge('shade');
    run.clock.pause();
    const handlers = {
      start() {}, pause() {}, resume() {}, stop() {}, visit() {},
      acknowledge() {}, refuse() {}, clear() {}, export() {},
    };
    app.host.append(renderContinuousOperator(app.document, run.snapshot, handlers));
    const paused = inspectOperatorControls(app.host);
    assert.equal(paused.links, 7);
    assert.equal(paused.unsafeLinks, 0);
    app.host.replaceChildren();
    run.clock.stop();
    app.host.append(renderContinuousOperator(app.document, run.snapshot, handlers));
    const stopped = inspectOperatorControls(app.host);
    assert.equal(stopped.links, 7);
    assert.equal(stopped.missingNames, 0);
    assert.equal(stopped.unsafeLinks, 0);
  } finally {
    run.dispose();
    app.close();
  }
});

test('operator report never accepts extra row fields even when their values look safe', () => {
  const { run } = fixture();
  const original = safeOperatorReport(run.snapshot);
  const forged = {
    ...original,
    rows: original.rows.map((row, i) => i === 0
      ? { ...row, previewPassed: true, liveUnits: 0 } : row),
  };
  assert.equal(validateOperatorReport(forged), false);
  assert.equal(validateOperatorReport(original), true);
  run.dispose();
});
