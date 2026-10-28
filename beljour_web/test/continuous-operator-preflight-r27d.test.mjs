import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TOUR_EFFECTS, TOUR_STEPS } from '../dist/js/layout/continuous/contract.js';
import { ContinuousDemoState } from '../dist/js/layout/continuous/state.js';
import { ContinuousTimings } from '../dist/js/layout/continuous/performance.js';
import { operatorPreflight, preflightCaption } from '../dist/js/layout/continuous/operator-preflight.js';
import { OperatorRehearsal } from '../dist/js/layout/continuous/operator-state.js';
import { OPERATOR_ROUTE_IDS } from '../dist/js/layout/continuous/operator-contract.js';

function fixture() {
  const demo = new ContinuousDemoState();
  const operator = new OperatorRehearsal(() => 0);
  const timings = new ContinuousTimings();
  return { demo, operator, timings, check: () => operatorPreflight(
    demo.snapshot, operator.snapshot, timings.summary('preview')) };
}

function completedDemo(demo) {
  demo.chooseDrawnSource(1, 2, 'drawn-main');
  for (const key of ['local', 'hair', 'face', 'mock']) demo.setPermission(key, true);
  for (const effect of TOUR_EFFECTS) demo.apply(effect);
  for (const command of ['/IDENTITYLOCK', '/CLEANUP', '/UPSCALE', '/STUDIOQUALITY', '/POSEONLY']) {
    demo.reviewCommand(command);
  }
  demo.chooseMockMode('off');
  demo.recordTryon('provider-disabled');
  demo.compare(60);
  demo.recordDownload();
}

test('blank rehearsal identifies untested provider, face and release requirements', () => {
  const { check } = fixture();
  const value = check();
  assert.equal(value.format, 'beljour-demo-preflight/1');
  assert.equal(value.syntheticRehearsalComplete, false);
  assert.equal(value.realProductManuallyReviewed, false);
  assert.equal(value.liveProviderVerified, false);
  assert.equal(value.realFaceGatePassed, false);
  assert.equal(value.frozen100000Passed, false);
  assert.equal(value.releaseReady, false);
  assert.ok(value.rows.filter(row => row.category === 'quality').every(row => !row.observed));
  assert.match(preflightCaption(value), /never approves live processing/);
});

test('all seven effects remain illustrative even with allowed consent', () => {
  const { demo, check } = fixture();
  completedDemo(demo);
  const result = check();
  for (const effect of TOUR_EFFECTS) {
    const row = result.rows.find(item => item.id === `local-${effect}`);
    assert.equal(row.observed, true);
    assert.equal(row.source, 'drawn');
    assert.match(row.note, /Synthetic placement/);
  }
  assert.equal(result.rows.find(row => row.id === 'tryon').source, 'mock');
  assert.equal(result.rows.find(row => row.id === 'export').note.includes('Request only'), true);
  assert.equal(result.releaseReady, false);
});

test('manual operator checks cannot upgrade a live provider verdict', () => {
  const { demo, operator, check } = fixture();
  completedDemo(demo);
  operator.start();
  for (const id of OPERATOR_ROUTE_IDS) {
    operator.open(id);
    operator.acknowledge(id);
  }
  const result = check();
  assert.equal(result.realProductManuallyReviewed, true);
  assert.equal(result.rows.find(row => row.id === 'real-pages').source, 'operator');
  assert.equal(result.liveProviderVerified, false);
  assert.equal(result.realFaceGatePassed, false);
  assert.equal(result.releaseReady, false);
});

test('provider off is an observed mock branch, not an API integration', () => {
  const { demo, check } = fixture();
  completedDemo(demo);
  const result = check();
  const tryon = result.rows.find(row => row.id === 'tryon');
  const real = result.rows.find(row => row.id === 'youcam-live');
  assert.equal(tryon.observed, true);
  assert.equal(tryon.source, 'mock');
  assert.equal(real.observed, false);
  assert.equal(real.source, 'missing');
});

test('consent withdrawal makes all dependent steps unobserved', () => {
  const { demo, check } = fixture();
  completedDemo(demo);
  demo.setPermission('hair', false);
  const afterHair = check();
  assert.equal(afterHair.rows.find(row => row.id === 'local-hair').observed, false);
  assert.equal(afterHair.rows.find(row => row.id === 'local-colour').observed, false);
  demo.setPermission('face', false);
  const afterFace = check();
  assert.equal(afterFace.rows.find(row => row.id === 'local-posture').observed, false);
  assert.equal(afterFace.rows.find(row => row.id === 'local-appearance').observed, false);
  assert.equal(afterFace.syntheticRehearsalComplete, false);
});

test('the preview reference is metadata only, not a device performance pass', () => {
  const { demo, timings, check } = fixture();
  completedDemo(demo);
  timings.record('preview', 160);
  timings.record('preview', 230);
  const result = check();
  assert.equal(result.previewReferenceExceeded, true);
  const phone = result.rows.find(row => row.id === 'phone-budget');
  assert.equal(phone.observed, false);
  assert.equal(phone.source, 'missing');
  assert.match(phone.note, /physical phone performance unmeasured/i);
});

test('skipped steps never make the synthetic rehearsal fully completed', () => {
  const { demo, check } = fixture();
  completedDemo(demo);
  for (let i = 0; i < TOUR_STEPS.length - 1; i += 1) demo.next(true);
  assert.equal(demo.snapshot.step, 'save');
  assert.ok(demo.snapshot.skipped.length > 0);
  assert.equal(check().syntheticRehearsalComplete, false);
});

test('reselecting another person revokes old illustrative and export proof', () => {
  const { demo, check } = fixture();
  completedDemo(demo);
  demo.selectSubject('drawn-guest', true);
  const result = check();
  assert.equal(result.rows.find(row => row.id === 'drawn-source').observed, true);
  assert.equal(result.rows.find(row => row.id === 'local-hair').observed, false);
  assert.equal(result.rows.find(row => row.id === 'export').observed, false);
  assert.equal(result.releaseReady, false);
});
