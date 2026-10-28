// Lane D r22d-cp3: honest walkthrough script, focusable help and evidence limits.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JUDGE_STEPS } from '../dist/js/layout/judge-contract.js';
import { JudgeSession } from '../dist/js/layout/judge-session.js';
import {
  JUDGE_EVIDENCE_LIMITS,
  JUDGE_SCRIPT,
  judgeGuideTitle,
  renderJudgeGuide,
} from '../dist/js/ui/shell/judge-guide.js';
import { availableSession, reportPage } from './judge-fixtures-cp3-r22d.mjs';
import { control } from './judge-fixtures-r22d.mjs';

test('guide has one specific script line for each existing route step', () => {
  assert.equal(JUDGE_SCRIPT.length, JUDGE_STEPS.length);
  for (const item of JUDGE_SCRIPT) assert.ok(item.length > 25);
});

test('guidance labels the source as an illustration, not a test face', () => {
  assert.match(JUDGE_SCRIPT[0], /drawn sample/);
  assert.match(JUDGE_EVIDENCE_LIMITS[0], /not a person/);
});

test('mock script explicitly disclaims API calls', () => {
  assert.match(JUDGE_SCRIPT[4], /no API request/);
  assert.ok(JUDGE_EVIDENCE_LIMITS.some(text => /not evidence of YouCam API/.test(text)));
});

test('timing language never suggests the three-minute requirement has been verified', () => {
  assert.ok(JUDGE_EVIDENCE_LIMITS.some(text => /not a performance benchmark/.test(text)));
  for (const line of JUDGE_EVIDENCE_LIMITS) assert.doesNotMatch(line, /passed|guaranteed|certified/i);
});

test('collapsed guide renders a working toggle without any inappropriate hidden content', async () => {
  const page = reportPage();
  try {
    let toggles = 0;
    renderJudgeGuide(page.document, page.host, new JudgeSession().snapshot, {
      isOpen: false,
      toggle() { toggles += 1; },
    });
    assert.equal(control(page.host, 'guide').getAttribute('aria-expanded'), 'false');
    assert.doesNotMatch(page.host.textContent, /provider try-on.*zero YouCam units/);
    await control(page.host, 'guide').click();
    assert.equal(toggles, 1);
  } finally { page.teardown(); }
});

test('open guide shows a heading, evidence list and accessible toggle', () => {
  const page = reportPage();
  try {
    renderJudgeGuide(page.document, page.host, new JudgeSession().snapshot, {
      isOpen: true, toggle() {},
    });
    assert.equal(control(page.host, 'guide').getAttribute('aria-expanded'), 'true');
    assert.equal(control(page.host, 'guide').getAttribute('aria-controls'), 'lg-judge-guide-content');
    assert.match(page.host.textContent, /What to show: Image/);
    assert.match(page.host.textContent, /0 completed, 0 skipped, 8 total steps/);
    assert.equal(page.host.querySelectorAll('li').length, 8 + JUDGE_EVIDENCE_LIMITS.length);
  } finally { page.teardown(); }
});

test('links to existing public photo route, not a new unapproved API endpoint', () => {
  const page = reportPage();
  try {
    renderJudgeGuide(page.document, page.host, new JudgeSession().snapshot, {
      isOpen: true, toggle() {},
    });
    const links = page.host.querySelectorAll('a');
    assert.equal(links.length, 1);
    assert.equal(links[0].href, 'index.html#/photo');
    assert.equal(links[0].target, '_blank');
    assert.equal(links[0].rel, 'noopener noreferrer');
  } finally { page.teardown(); }
});

test('state change updates the script and marks skipped source honestly', () => {
  const page = reportPage();
  try {
    const session = new JudgeSession();
    session.skip();
    renderJudgeGuide(page.document, page.host, session.snapshot, { isOpen: true, toggle() {} });
    assert.match(page.host.textContent, /What to show: Consent/);
    assert.match(page.host.textContent, /1 skipped/);
    assert.equal(page.host.querySelectorAll('li').filter(row => row.dataset.judgeEvidence === 'skipped').length, 1);
  } finally { page.teardown(); }
});

test('selected edit states do not add unsupported measured success claims', () => {
  const page = reportPage();
  try {
    const session = availableSession();
    renderJudgeGuide(page.document, page.host, session.snapshot, { isOpen: true, toggle() {} });
    assert.match(page.host.textContent, /zero YouCam units/);
    assert.match(page.host.textContent, /not a person or a measured result/);
    assert.doesNotMatch(page.host.textContent, /100% fairness|clinical success|perfect results/);
  } finally { page.teardown(); }
});

test('step titles come from existing step contract; no divergent list of features', () => {
  const session = availableSession();
  assert.equal(judgeGuideTitle(session.snapshot), 'What to show: Image');
  session.next();
  assert.equal(judgeGuideTitle(session.snapshot), 'What to show: Consent');
});

test('guide text is readable without colour-only success status', () => {
  const page = reportPage();
  try {
    renderJudgeGuide(page.document, page.host, new JudgeSession().snapshot, {
      isOpen: true, toggle() {},
    });
    const row = page.host.querySelectorAll('li').find(node => node.dataset.judgeEvidence === 'action-needed');
    assert.ok(row);
    assert.match(row.textContent, /action-needed/);
    assert.equal(page.host.querySelectorAll('canvas').length, 0);
  } finally { page.teardown(); }
});
