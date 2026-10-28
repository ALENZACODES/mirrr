import assert from 'node:assert/strict';
import { test } from 'node:test';
import { REAL_DEMO_CHECKS, JudgeLiveChecks } from '../dist/js/layout/judge-live-checks.js';
import { realDemoRoutes } from '../dist/js/layout/judge-live-routes.js';
import { renderJudgeLivePanel } from '../dist/js/ui/shell/judge-live-panel.js';
import { judgeDOM, control } from './judge-fixtures-r22d.mjs';

function mount() {
  const app = judgeDOM();
  const checks = new JudgeLiveChecks();
  renderJudgeLivePanel(app.document, app.host, checks);
  return { app, checks };
}

function statusFor(host, id) {
  const controlNode = control(host, `live-check-${id}`);
  assert.ok(controlNode);
  return controlNode;
}

test('the operator board displays every public destination without sending a photo', () => {
  const { app, checks } = mount();
  try {
    const links = app.host.querySelectorAll('a');
    assert.equal(links.length, realDemoRoutes().length);
    const hrefs = links.map(link => link.href);
    assert.deepEqual(hrefs, realDemoRoutes().map(route => route.href));
    for (const link of links) {
      assert.equal(link.target, '_blank');
      assert.equal(link.rel, 'noopener noreferrer');
      assert.ok(link.dataset.judgeRoute);
      assert.ok(!link.href.includes('?photo='));
    }
    assert.match(app.host.textContent, /No sample, uploaded photo, consent/);
    assert.equal(checks.snapshot().observed, 0);
  } finally { checks.dispose(); app.close(); }
});

test('the nine manual rows have an accessible label and three explicit statuses', () => {
  const { app, checks } = mount();
  try {
    const selects = app.host.querySelectorAll('select');
    assert.equal(selects.length, REAL_DEMO_CHECKS.length);
    for (const row of REAL_DEMO_CHECKS) {
      const field = statusFor(app.host, row.id);
      assert.match(field.getAttribute('aria-label'), /Operator-reported status/);
      assert.equal(field.value, 'not-run');
      assert.equal(field.children.length, 3);
      assert.deepEqual(field.children.map(child => child.value),
        ['not-run', 'operator-observed', 'blocked']);
    }
  } finally { checks.dispose(); app.close(); }
});

test('select changes update the ephemeral state without claiming validation', async () => {
  const { app, checks } = mount();
  try {
    const hair = statusFor(app.host, 'hair-response');
    hair.value = 'operator-observed';
    await hair.dispatch('change');
    const makeup = statusFor(app.host, 'makeup-response');
    makeup.value = 'blocked';
    await makeup.dispatch('change');
    assert.equal(checks.snapshot().observed, 1);
    assert.equal(checks.snapshot().blocked, 1);
    assert.equal(checks.snapshot().verifiedProvider, false);
    assert.equal(checks.snapshot().releasePassed, false);
    assert.match(app.host.textContent, /None are externally certified/);
    assert.equal(statusFor(app.host, 'hair-response').value, 'operator-observed');
  } finally { checks.dispose(); app.close(); }
});

test('clear marks resets select choices and their visible status, not just the count', async () => {
  const { app, checks } = mount();
  try {
    for (const id of ['photo-open', 'hair-consent', 'makeup-response']) {
      const field = statusFor(app.host, id);
      field.value = 'operator-observed';
      await field.dispatch('change');
    }
    assert.equal(checks.snapshot().observed, 3);
    const reset = control(app.host, 'live-reset');
    await reset.click();
    assert.equal(checks.snapshot().observed, 0);
    assert.equal(checks.snapshot().notRun, REAL_DEMO_CHECKS.length);
    for (const field of app.host.querySelectorAll('select')) assert.equal(field.value, 'not-run');
    const statuses = app.host.querySelectorAll('li').filter(node => node.className.includes('lg-judge-live-check'));
    assert.equal(statuses.length, REAL_DEMO_CHECKS.length);
    assert.ok(statuses.every(row => row.dataset.liveStatus === 'not-run'));
  } finally { checks.dispose(); app.close(); }
});

test('manual checklist export needs an explicit Save action', async () => {
  const app = judgeDOM();
  const checks = new JudgeLiveChecks();
  let created = 0;
  let blob;
  let deferred;
  const urls = {
    createObjectURL(file) { created += 1; blob = file; return 'blob:fixed-checklist'; },
    revokeObjectURL(url) { assert.equal(url, 'blob:fixed-checklist'); },
  };
  try {
    renderJudgeLivePanel(app.document, app.host, checks, {
      urls,
      defer: fn => { deferred = fn; },
    });
    assert.equal(created, 0);
    const selection = statusFor(app.host, 'photo-open');
    selection.value = 'operator-observed';
    await selection.dispatch('change');
    assert.equal(created, 0);
    await control(app.host, 'live-report').click();
    assert.equal(created, 1);
    assert.match(await blob.text(), /Operator-reported only/);
    assert.ok(deferred);
    deferred();
  } finally { checks.dispose(); app.close(); }
});

test('if object URL creation fails, the panel preserves the manual state and reports failure', async () => {
  const app = judgeDOM();
  const checks = new JudgeLiveChecks();
  try {
    renderJudgeLivePanel(app.document, app.host, checks, {
      urls: { createObjectURL() { throw Error('blocked'); }, revokeObjectURL() {} },
    });
    const field = statusFor(app.host, 'shade-product');
    field.value = 'blocked';
    await field.dispatch('change');
    await control(app.host, 'live-report').click();
    assert.match(app.host.textContent, /operator checklist could not be downloaded/);
    assert.equal(checks.snapshot().blocked, 1);
    assert.equal(control(app.host, 'live-report').disabled, false);
  } finally { checks.dispose(); app.close(); }
});

test('the real-flow panel never constructs a checkout, form upload or provider command', () => {
  const { app, checks } = mount();
  try {
    assert.equal(app.host.querySelectorAll('form').length, 0);
    assert.equal(app.host.querySelectorAll('input').length, 0);
    assert.ok(app.host.querySelectorAll('button').every(button => button.type === 'button'));
    assert.doesNotMatch(app.host.textContent, /provider task was successful/i);
    assert.match(app.host.textContent, /never authorizes a real YouCam request/);
  } finally { checks.dispose(); app.close(); }
});
