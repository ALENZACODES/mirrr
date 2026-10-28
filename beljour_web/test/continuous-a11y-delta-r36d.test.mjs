/** Same-authority comparisons; findings never become a passed release gate. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareContinuousAudits, continuousAuditDeltaCaption } from
  '../dist/js/layout/continuous/accessibility-delta.js';

function report(findings = [], count = 10) {
  return {
    format: 'beljour-tour-accessibility/1',
    scope: 'single-local-tour-screen',
    evidence: 'operator-local-observation',
    inspected: count, controls: count, measuredButtons: Math.min(count, 8),
    findings, screenReader: 'not-tested', physicalDevice: 'not-tested',
    realFace: 'not-tested', provider: 'not-tested',
  };
}

test('identical local reports have zero change without being marked certified', () => {
  const delta = compareContinuousAudits(report(), report());
  assert.deepEqual(delta.introduced, []);
  assert.deepEqual(delta.resolved, []);
  assert.deepEqual(delta.persistent, []);
  assert.equal(delta.controlChange, 0);
  assert.match(continuousAuditDeltaCaption(delta), /not real-device or screen-reader certification/);
});

test('a missing button label newly introduced is visible in the comparison', () => {
  const delta = compareContinuousAudits(report(), report(['unnamed-button']));
  assert.deepEqual(delta.introduced, ['unnamed-button']);
  assert.deepEqual(delta.resolved, []);
  assert.match(continuousAuditDeltaCaption(delta), /1 new rule categories/);
});

test('a repaired ARIA reference is recorded as resolved, not a screen-reader pass', () => {
  const delta = compareContinuousAudits(report(['broken-aria-reference']), report());
  assert.deepEqual(delta.resolved, ['broken-aria-reference']);
  assert.deepEqual(delta.introduced, []);
  assert.match(continuousAuditDeltaCaption(delta), /1 resolved/);
  assert.doesNotMatch(JSON.stringify(delta), /"certified"|"passed"/);
});

test('mixed new, resolved and persistent findings remain distinct', () => {
  const delta = compareContinuousAudits(
    report(['missing-canvas-description', 'unnamed-button']),
    report(['unnamed-button', 'undersized-button']),
  );
  assert.deepEqual(delta.introduced, ['undersized-button']);
  assert.deepEqual(delta.resolved, ['missing-canvas-description']);
  assert.deepEqual(delta.persistent, ['unnamed-button']);
});

test('the bounded control-count difference is signed and never measured as latency', () => {
  assert.equal(compareContinuousAudits(report([], 8), report([], 11)).controlChange, 3);
  assert.equal(compareContinuousAudits(report([], 11), report([], 8)).controlChange, -3);
  assert.doesNotMatch(JSON.stringify(compareContinuousAudits(report(), report())),
    /milliseconds|duration|latency|fps/);
});

test('forged independent acceptance on either side fails closed', () => {
  assert.throws(() => compareContinuousAudits(
    { ...report(), screenReader: 'passed' }, report()), Error);
  assert.throws(() => compareContinuousAudits(
    report(), { ...report(), provider: 'passed' }), Error);
  assert.throws(() => compareContinuousAudits(
    report(), { ...report(), realFace: 'passed' }), Error);
});

test('unknown finding values and malformed inputs cannot be compared', () => {
  assert.throws(() => compareContinuousAudits(
    report(['free-form-personal-note']), report()), Error);
  assert.throws(() => compareContinuousAudits(report(), null), TypeError);
  assert.throws(() => compareContinuousAudits(null, report()), TypeError);
});

test('the formatter refuses mutable or fabricated comparison metadata', () => {
  const baseline = compareContinuousAudits(report(), report());
  assert.throws(() => continuousAuditDeltaCaption({ ...baseline, kind: 'certified' }), TypeError);
  assert.throws(() => continuousAuditDeltaCaption({ ...baseline, controlChange: 900 }), RangeError);
  assert.throws(() => continuousAuditDeltaCaption({ ...baseline,
    introduced: Array(50).fill('unknown') }), RangeError);
});

test('the delta contains only fixed rule codes, never user strings or pixels', () => {
  const input = compareContinuousAudits(report(['missing-canvas-description']),
    report(['invalid-expanded-state']));
  const raw = JSON.stringify(input);
  assert.doesNotMatch(raw, /data:image|photo|filename|requestKey|apiKey/i);
  assert.ok(raw.length < 600);
  assert.equal(Object.keys(input).length, 6);
  assert.equal(input.evidence, 'operator-local-observation-only');
});

test('result arrays are immutable even when caller inputs are mutable', () => {
  const before = report(['unnamed-button']);
  const after = report(['missing-canvas-description']);
  const delta = compareContinuousAudits(before, after);
  before.findings.push('invalid-expanded-state');
  after.findings.push('invalid-pressed-state');
  assert.deepEqual(delta.resolved, ['unnamed-button']);
  assert.deepEqual(delta.introduced, ['missing-canvas-description']);
  assert.equal(Object.isFrozen(delta), true);
  assert.equal(Object.isFrozen(delta.introduced), true);
});
