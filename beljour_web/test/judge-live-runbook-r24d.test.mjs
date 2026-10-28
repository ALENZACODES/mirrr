import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JudgeLiveChecks } from '../dist/js/layout/judge-live-checks.js';
import {
  REAL_DEMO_CUES,
  validateRealDemoCuePlan,
  realDemoTimeline,
  realDemoCueHeadline,
} from '../dist/js/layout/judge-live-runbook.js';
import { realDemoRoutes } from '../dist/js/layout/judge-live-routes.js';
import { renderJudgeLivePanel } from '../dist/js/ui/shell/judge-live-panel.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

test('the suggested real-product sequence covers seven actual entry URLs and 180 seconds', () => {
  assert.deepEqual(validateRealDemoCuePlan(), []);
  assert.equal(REAL_DEMO_CUES.length, 7);
  assert.deepEqual(REAL_DEMO_CUES.map(cue => cue.route), realDemoRoutes().map(route => route.id));
  assert.equal(REAL_DEMO_CUES.reduce((sum, cue) => sum + cue.targetSeconds, 0), 180);
});

test('each cue has a concrete action, honest limitation and stopping condition', () => {
  for (const cue of REAL_DEMO_CUES) {
    assert.ok(cue.action.length > 20);
    assert.ok(cue.explanation.length > 20);
    assert.ok(cue.stopCondition.length > 20);
    assert.ok(cue.targetSeconds >= 5);
    assert.ok(cue.targetSeconds < 60);
  }
});

test('a fresh visit does not claim any observed real-product stage', () => {
  const checks = new JudgeLiveChecks();
  const timeline = realDemoTimeline(checks.snapshot());
  assert.equal(timeline.suggestedSeconds, 180);
  assert.equal(timeline.deliveryStatus, 'planning-only');
  assert.equal(timeline.providerLatencyIncluded, false);
  assert.equal(timeline.liveApiVerified, false);
  assert.equal(timeline.fullFlowObserved, false);
  assert.ok(timeline.rows.every(row => row.operatorStatus === 'not-run'));
  assert.deepEqual(timeline.rows.map(row => row.deadlineSeconds), [15, 40, 75, 110, 140, 165, 180]);
});

test('mixed hair status is distinguished from an unverified provider pass', () => {
  const checks = new JudgeLiveChecks();
  checks.set('hair-consent', 'operator-observed');
  checks.set('hair-response', 'blocked');
  const timeline = realDemoTimeline(checks.snapshot());
  assert.equal(timeline.rows.find(row => row.route === 'hair').operatorStatus, 'mixed');
  assert.equal(timeline.rows.find(row => row.route === 'makeup').operatorStatus, 'not-run');
  assert.equal(timeline.liveApiVerified, false);
  assert.match(realDemoCueHeadline(timeline), /reported blockers or mixed observations/);
});

test('even every manual observation cannot certify provider or frozen-face acceptance', () => {
  const checks = new JudgeLiveChecks();
  for (const row of checks.snapshot().rows) checks.set(row.id, 'operator-observed');
  const timeline = realDemoTimeline(checks.snapshot());
  assert.ok(timeline.rows.every(row => row.operatorStatus === 'operator-observed'));
  assert.equal(timeline.fullFlowObserved, false);
  assert.equal(timeline.liveApiVerified, false);
  assert.equal(timeline.deliveryStatus, 'planning-only');
});

test('provider wait time is not silently added to the three-minute talk track', () => {
  const checks = new JudgeLiveChecks();
  const timeline = realDemoTimeline(checks.snapshot());
  assert.match(realDemoCueHeadline(timeline), /Provider wait time.*not measured/);
  const hair = timeline.rows.find(row => row.route === 'hair');
  const makeup = timeline.rows.find(row => row.route === 'makeup');
  assert.match(hair.stopCondition, /units|consent/);
  assert.match(makeup.stopCondition, /illustrated mock/);
});

test('the operator board makes the live cue sheet opt-in and leaves the mock route available', () => {
  const app = judgeDOM();
  const checks = new JudgeLiveChecks();
  try {
    renderJudgeLivePanel(app.document, app.host, checks);
    const timelines = app.host.querySelectorAll('.lg-judge-live-timeline');
    assert.equal(timelines.length, 1);
    assert.equal(Boolean(timelines[0].open), false);
    assert.match(timelines[0].textContent, /three-minute real-product talk track/);
    assert.equal(timelines[0].querySelectorAll('li').length, 7);
    assert.match(app.host.textContent, /No sample, uploaded photo, consent/);
  } finally { checks.dispose(); app.close(); }
});

test('the cue plan has no screen that automatically sends a picture or uses paid units', () => {
  const text = REAL_DEMO_CUES.map(cue => cue.action + cue.explanation + cue.stopCondition).join(' ');
  assert.doesNotMatch(text, /already charged|automatic purchase|provider guaranteed|no consent needed/i);
  assert.match(text, /authorized free units/);
  assert.match(text, /Do not substitute|Never present/);
});
