import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountJudgeMode } from '../dist/js/layout/judge-mode.js';
import { judgeDOM, control } from './judge-fixtures-r22d.mjs';

async function press(host, name) {
  const button = control(host, name);
  assert.ok(button, `Missing ${name}`);
  assert.equal(button.disabled, false, `${name} disabled`);
  await button.click();
}

async function approve(host, id) {
  const field = control(host, `consent-${id}`);
  assert.ok(field, `Missing consent ${id}`);
  field.checked = true;
  await field.dispatch('change');
}

async function reachTryon(host) {
  await press(host, 'sample');
  await press(host, 'next');
  for (const id of ['local', 'hair', 'face', 'mock']) await approve(host, id);
  await press(host, 'next');
  await press(host, 'hair-chestnut');
  await press(host, 'next');
  await press(host, 'face-warm');
  await press(host, 'next');
}

async function reachPlans(host) {
  for (let i = 0; i < 7; i += 1) await press(host, 'skip');
}

test('a skipped rehearsal shows an optional live-product handoff without certifying eight features', async () => {
  const app = judgeDOM();
  try {
    const mode = mountJudgeMode(app.document, app.host, () => {});
    await reachPlans(app.host);
    assert.equal(mode.session.snapshot.step, 'plans');
    assert.match(app.host.textContent, /Continue in the real application/);
    assert.match(app.host.textContent, /Open separate real-product checklist \(optional\)/);
    assert.match(app.host.textContent, /not a certification/i);
    assert.match(app.host.textContent, /7 skipped/);
    const board = app.host.querySelector('.lg-judge-live-panel');
    assert.ok(board);
    assert.equal(Boolean(board.querySelector('details').open), false);
    assert.equal(mode.session.snapshot.permissions.local, false);
    assert.match(app.host.textContent, /real adapter, external faces and release gates/);
    mode.dispose();
  } finally { app.close(); }
});

test('the final panel keeps each real route distinct from the illustrative canvas', async () => {
  const app = judgeDOM();
  try {
    const mode = mountJudgeMode(app.document, app.host, () => {});
    await reachPlans(app.host);
    const links = app.host.querySelectorAll('a').filter(link => link.dataset.judgeRoute);
    assert.equal(links.length, 7);
    for (const link of links) {
      assert.match(link.href, /\.html(?:#.*)?$/);
      assert.equal(link.target, '_blank');
      assert.equal(link.rel, 'noopener noreferrer');
      assert.ok(!link.href.includes('?'));
      assert.equal(link.href.includes('blob:'), false);
    }
    assert.ok(links.find(link => link.dataset.judgeRoute === 'makeup'));
    assert.ok(links.find(link => link.dataset.judgeRoute === 'commerce'));
    mode.dispose();
  } finally { app.close(); }
});

test('local permissions cannot turn a fictional failure into a successful mock response', async () => {
  const app = judgeDOM();
  try {
    const mode = mountJudgeMode(app.document, app.host, () => {});
    await reachTryon(app.host);
    assert.equal(mode.session.snapshot.step, 'tryon');
    await press(app.host, 'mock-tryon');
    assert.equal(mode.session.snapshot.mock, true);
    await press(app.host, 'failure-unit-limit');
    assert.equal(mode.session.snapshot.mock, false);
    assert.equal(mode.image.hasImage, true);
    assert.match(app.host.textContent, /Illustrative refusal only/);
    assert.match(app.host.textContent, /Simulated requests: 0/);
    assert.match(app.host.textContent, /Provider result verified: no/);
    assert.equal(app.host.querySelector('.lg-judge-failure-result').dataset.judgeFailurePhase,
      'simulated-refusal');
    mode.dispose();
  } finally { app.close(); }
});

test('an unavailable provider can be acknowledged and then retried only by a fresh click', async () => {
  const app = judgeDOM();
  try {
    const mode = mountJudgeMode(app.document, app.host, () => {});
    await reachTryon(app.host);
    await press(app.host, 'failure-offline');
    assert.equal(mode.session.snapshot.mock, false);
    await press(app.host, 'failure-acknowledge');
    assert.match(app.host.textContent, /No provider retry occurred/);
    assert.equal(mode.session.snapshot.mock, false);
    await press(app.host, 'failure-reset');
    assert.equal(mode.session.snapshot.mock, false);
    await press(app.host, 'mock-tryon');
    assert.equal(mode.session.snapshot.mock, true);
    assert.doesNotMatch(app.host.textContent, /No provider retry occurred/);
    mode.dispose();
  } finally { app.close(); }
});

test('consent withdrawal prevents treating later mock navigation as a provider success', async () => {
  const app = judgeDOM();
  try {
    const mode = mountJudgeMode(app.document, app.host, () => {});
    await reachTryon(app.host);
    await press(app.host, 'failure-timeout');
    await press(app.host, 'back');
    await press(app.host, 'back');
    await press(app.host, 'back');
    assert.equal(mode.session.snapshot.step, 'consent');
    const field = control(app.host, 'consent-mock');
    field.checked = false;
    await field.dispatch('change');
    assert.equal(mode.session.snapshot.permissions.mock, false);
    await press(app.host, 'next');
    await press(app.host, 'next');
    await press(app.host, 'next');
    assert.equal(mode.session.snapshot.step, 'tryon');
    assert.equal(control(app.host, 'mock-tryon').disabled, true);
    assert.doesNotMatch(app.host.textContent, /Simulated task deadline elapsed/);
    mode.dispose();
  } finally { app.close(); }
});

test('manual marks survive a panel rerender but never survive an exit/new session', async () => {
  const app = judgeDOM();
  try {
    let exited = 0;
    const first = mountJudgeMode(app.document, app.host, () => { exited += 1; });
    await reachPlans(app.host);
    const mark = control(app.host, 'live-check-photo-open');
    mark.value = 'operator-observed';
    await mark.dispatch('change');
    assert.match(app.host.textContent, /1 reported observations/);
    first.render();
    assert.equal(control(app.host, 'live-check-photo-open').value, 'operator-observed');
    await press(app.host, 'exit');
    assert.equal(exited, 1);
    assert.equal(app.host.children.length, 0);
    const second = mountJudgeMode(app.document, app.host, () => {});
    await reachPlans(app.host);
    assert.equal(control(app.host, 'live-check-photo-open').value, 'not-run');
    assert.match(app.host.textContent, /0 reported observations/);
    second.dispose();
  } finally { app.close(); }
});

test('a photo-free operator report cannot be downloaded without user action', async () => {
  const app = judgeDOM();
  const original = URL.createObjectURL;
  let created = 0;
  URL.createObjectURL = () => { created += 1; return 'blob:operator-manual'; };
  try {
    const mode = mountJudgeMode(app.document, app.host, () => {});
    await reachPlans(app.host);
    assert.equal(created, 0);
    const mark = control(app.host, 'live-check-photo-open');
    mark.value = 'operator-observed';
    await mark.dispatch('change');
    assert.equal(created, 0);
    await press(app.host, 'live-report');
    assert.equal(created, 1);
    assert.match(app.host.textContent, /Operator checklist download requested/);
    assert.match(app.host.textContent, /no photo or provider response included/);
    mode.dispose();
  } finally {
    URL.createObjectURL = original;
    app.close();
  }
});

test('on-demand viewport selfcheck never becomes a real device compliance claim', async () => {
  const app = judgeDOM();
  try {
    const mode = mountJudgeMode(app.document, app.host, () => {});
    await reachPlans(app.host);
    assert.match(app.host.textContent, /Inspect current screen layout/);
    assert.match(app.host.textContent, /No screen measurement has been requested/);
    await press(app.host, 'device-selfcheck');
    assert.match(app.host.textContent, /Review manually at 320px, 390px/);
    assert.match(app.host.textContent, /Not a mobile certification/);
    assert.match(app.host.textContent, /No screenshot or private data is saved/);
    mode.dispose();
  } finally { app.close(); }
});
