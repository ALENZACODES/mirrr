// Lane D r22d-cp3: local run summary; neither exported image nor API quality proof.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JudgeRehearsal } from '../dist/js/layout/judge-rehearsal.js';
import { JudgeSession } from '../dist/js/layout/judge-session.js';
import { judgeReport, renderJudgeReport } from '../dist/js/ui/shell/judge-report.js';
import { availableSession, clockHarness, reportPage } from './judge-fixtures-cp3-r22d.mjs';

test('summary of a new guide is not a fabricated completion record', () => {
  const clock = new JudgeRehearsal(clockHarness().port);
  const report = judgeReport(new JudgeSession().snapshot, clock.snapshot());
  assert.equal(report.stepsCompleted, 0);
  assert.equal(report.stepsSkipped, 0);
  assert.equal(report.elapsed, '0:00');
  assert.equal(report.hasImage, false);
});

test('real provider calls and transferred image bytes are always explicitly zero', () => {
  const clock = new JudgeRehearsal(clockHarness().port);
  const report = judgeReport(availableSession().snapshot, clock.snapshot());
  assert.equal(report.realYouCamCalls, 0);
  assert.equal(report.imageBytesTransferred, 0);
  assert.match(report.label, /SIMULATION/);
});

test('measured local timing uses the injected elapsed duration', () => {
  const clock = clockHarness();
  const timer = new JudgeRehearsal(clock.port);
  timer.start();
  clock.advance(64_000);
  const report = judgeReport(availableSession().snapshot, timer.snapshot());
  assert.equal(report.elapsed, '1:04');
});

test('a skipped source is counted as skipped, never completed', () => {
  const session = new JudgeSession();
  session.skip();
  const report = judgeReport(session.snapshot, new JudgeRehearsal(clockHarness().port).snapshot());
  assert.equal(report.stepsSkipped, 1);
  assert.equal(report.stepsCompleted, 0);
});

test('final report creates a semantic definition list of plain non-personal facts', () => {
  const page = reportPage();
  try {
    const timer = new JudgeRehearsal(clockHarness().port);
    renderJudgeReport(page.document, page.host, availableSession().snapshot, timer.snapshot());
    assert.ok(page.host.querySelector('dl'));
    assert.ok(page.host.querySelectorAll('dt').length >= 5);
    assert.match(page.host.textContent, /Real YouCam calls/);
    assert.match(page.host.textContent, /0 — mocked/);
    assert.match(page.host.textContent, /No personal image/);
  } finally { page.teardown(); }
});

test('report distinguishes incomplete rehearsal from success', () => {
  const page = reportPage();
  try {
    const session = new JudgeSession();
    session.skip();
    renderJudgeReport(page.document, page.host, session.snapshot,
      new JudgeRehearsal(clockHarness().port).snapshot());
    assert.match(page.host.textContent, /Incomplete walkthrough/);
    assert.match(page.host.textContent, /Skipped steps were not tested/);
  } finally { page.teardown(); }
});

test('a complete-in-progress path does not display the incomplete warning', () => {
  const page = reportPage();
  try {
    renderJudgeReport(page.document, page.host, availableSession().snapshot,
      new JudgeRehearsal(clockHarness().port).snapshot());
    assert.doesNotMatch(page.host.textContent, /Incomplete walkthrough/);
    assert.match(page.host.textContent, /one local rehearsal/);
  } finally { page.teardown(); }
});

test('plain-text record stays collapsed in a semantic details element', () => {
  const page = reportPage();
  try {
    renderJudgeReport(page.document, page.host, new JudgeSession().snapshot,
      new JudgeRehearsal(clockHarness().port).snapshot());
    const details = page.host.querySelector('details');
    assert.ok(details);
    assert.equal(details.querySelectorAll('summary').length, 1);
    assert.ok(details.querySelectorAll('pre').length > 0);
    assert.match(details.textContent, /No photos, names, device identifiers/);
  } finally { page.teardown(); }
});

test('report has no billing controls, analytics or export endpoints', async () => {
  const { readFileSync } = await import('node:fs');
  const code = readFileSync(new URL('../src/ui/shell/judge-report.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(code, /\bfetch\s*\(|sendBeacon|XMLHttpRequest/);
  assert.doesNotMatch(code, /localStorage|sessionStorage|checkout|Stripe/);
});
