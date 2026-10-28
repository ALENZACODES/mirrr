import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountContinuousDemo } from '../dist/js/layout/continuous/mount.js';
import { PRO_COMMANDS } from '../dist/js/layout/continuous/pro-commands.js';
import { TOUR_STEPS } from '../dist/js/layout/continuous/contract.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function button(host, id) {
  return host.querySelectorAll('button').find(node => node.dataset.tourAction === id);
}

function input(host, id) {
  return host.querySelectorAll('input').find(node => node.dataset.tourAction === id);
}

async function click(host, id) {
  const action = button(host, id);
  assert.ok(action, `Missing control ${id}`);
  assert.equal(action.disabled, false, `${id} should be operable`);
  await action.click();
}

async function setChecked(host, name, checked) {
  const control = input(host, name);
  assert.ok(control, `${name} missing`);
  control.checked = checked;
  await control.dispatch('change');
}

async function reach(host, target) {
  for (let index = 0; index < TOUR_STEPS.length; index += 1) {
    if (host.textContent.includes(`Step ${TOUR_STEPS.findIndex(s => s.id === target) + 1} of 16`)) return;
    await click(host, 'skip');
  }
  assert.fail(`Could not reach ${target}`);
}

test('complete guided source loads a drawn pair and shows both face box controls', async () => {
  const app = judgeDOM();
  try {
    const tour = mountContinuousDemo(app.document, app.host, () => {});
    assert.equal(tour.state.snapshot.identityLock, true);
    assert.equal(tour.state.snapshot.step, 'source');
    assert.match(app.host.textContent, /Step 1 of 16/);
    assert.match(app.host.textContent, /No sample selected/);
    await click(app.host, 'sample');
    assert.equal(tour.image.subjects.snapshot.boxes.length, 2);
    assert.equal(tour.state.snapshot.selectedId, 'drawn-main');
    assert.equal(tour.state.snapshot.sourceLoaded, true);
    assert.equal(app.host.querySelectorAll('canvas').length, 1);
    await click(app.host, 'continue');
    assert.equal(tour.state.snapshot.step, 'faces');
    assert.match(app.host.textContent, /known drawn figure boxes/i);
    await click(app.host, 'continue');
    assert.equal(tour.state.snapshot.step, 'subject');
    assert.equal(app.host.querySelectorAll('.lg-subject-box').length, 2);
    assert.equal(app.host.querySelectorAll('button').filter(n => n.dataset.tourAction?.startsWith('subject-')).length, 2);
    tour.dispose();
  } finally { app.close(); }
});

test('subject picker accepts keyboard-click route and clears previous effect settings', async () => {
  const app = judgeDOM();
  try {
    const tour = mountContinuousDemo(app.document, app.host, () => {});
    await click(app.host, 'sample');
    await click(app.host, 'continue');
    await click(app.host, 'continue');
    await click(app.host, 'subject-drawn-guest');
    assert.equal(tour.state.snapshot.selectedId, 'drawn-guest');
    assert.match(app.host.textContent, /Selected figure updated/);
    await click(app.host, 'subject-drawn-main');
    assert.equal(tour.state.snapshot.selectedId, 'drawn-main');
    tour.dispose();
  } finally { app.close(); }
});

test('permissions and identity lock are visible and block unapproved changes', async () => {
  const app = judgeDOM();
  try {
    const tour = mountContinuousDemo(app.document, app.host, () => {});
    await click(app.host, 'sample');
    await reach(app.host, 'consent');
    assert.equal(input(app.host, 'identity-lock').checked, true);
    await setChecked(app.host, 'identity-lock', false);
    assert.equal(tour.state.snapshot.identityLock, false);
    await setChecked(app.host, 'consent-local', true);
    await setChecked(app.host, 'consent-hair', true);
    await setChecked(app.host, 'consent-face', true);
    await click(app.host, 'continue');
    assert.equal(tour.state.snapshot.step, 'hair');
    await click(app.host, 'apply-hair');
    assert.equal(tour.state.snapshot.applied.hair, false);
    assert.match(app.host.textContent, /enable identity lock/i);
    await setChecked(app.host, 'identity-lock', true);
    await click(app.host, 'apply-hair');
    assert.equal(tour.state.snapshot.applied.hair, true);
    tour.dispose();
  } finally { app.close(); }
});

test('every applied effect has the exact 1.0 to 5.0 native slider contract', async () => {
  const app = judgeDOM();
  try {
    const tour = mountContinuousDemo(app.document, app.host, () => {});
    await click(app.host, 'sample');
    await reach(app.host, 'hair');
    const family = ['hair', 'colour', 'concealer', 'appearance', 'ratio', 'turn', 'posture'];
    for (const effect of family) {
      const slider = input(app.host, `strength-${effect}`);
      assert.ok(slider, `Missing ${effect} slider`);
      assert.equal(slider.min, '1');
      assert.equal(slider.max, '5');
      assert.equal(slider.step, '0.1');
      assert.equal(slider.dataset.editStrength, 'true');
      slider.value = '3.7';
      await slider.dispatch('input');
      assert.equal(tour.state.snapshot.levels[effect], 3.7);
      if (effect !== 'posture') await click(app.host, 'skip');
    }
    tour.dispose();
  } finally { app.close(); }
});

test('appearance offers neutral, masculine and feminine optional style cues', async () => {
  const app = judgeDOM();
  try {
    const tour = mountContinuousDemo(app.document, app.host, () => {});
    await click(app.host, 'sample');
    await reach(app.host, 'appearance');
    for (const [buttonId, cue] of [['cue-masc', 'masc'], ['cue-fem', 'fem'], ['cue-none', 'none']]) {
      await click(app.host, buttonId);
      assert.equal(tour.state.snapshot.appearanceCue, cue);
      assert.match(app.host.textContent, /not a gender inference/i);
    }
    tour.dispose();
  } finally { app.close(); }
});

test('all five exact Pro Commands are reviewable without claiming execution', async () => {
  const app = judgeDOM();
  try {
    const tour = mountContinuousDemo(app.document, app.host, () => {});
    await click(app.host, 'sample');
    await reach(app.host, 'pro');
    assert.equal(tour.state.snapshot.step, 'pro');
    assert.match(app.host.textContent, /Public execution: unknown/);
    for (const command of PRO_COMMANDS) {
      assert.match(app.host.textContent, new RegExp(command));
      await click(app.host, `pro-${command.slice(1)}`);
    }
    assert.equal(tour.state.snapshot.proCommandsReviewed.length, 5);
    assert.equal(tour.state.readiness('pro').allowed, true);
    assert.match(app.host.textContent, /not asserted/);
    tour.dispose();
  } finally { app.close(); }
});

test('Halloween pack renders first from public catalogue and no static pack is invented', async () => {
  const app = judgeDOM();
  try {
    const tour = mountContinuousDemo(app.document, app.host, () => {}, {
      seasonal: { kind: 'seasonal-catalogue', listPacks: async () => [
        { id: 'first', title: 'First', season: 'Winter', available: true },
        { id: 'halloween', title: 'Second', season: 'Halloween', available: true },
      ] },
    });
    await click(app.host, 'sample');
    await reach(app.host, 'seasonal');
    await new Promise(resolve => setImmediate(resolve));
    const buttons = app.host.querySelectorAll('button').filter(b => b.dataset.tourAction?.startsWith('season-'));
    assert.equal(buttons.length, 2);
    assert.equal(buttons[0].dataset.tourAction, 'season-halloween');
    await click(app.host, 'season-halloween');
    assert.equal(tour.state.snapshot.seasonalId, 'halloween');
    tour.dispose();
  } finally { app.close(); }
});

test('mock try-on and provider switched off both use no network or provider units', async () => {
  const app = judgeDOM();
  let calls = 0;
  const oldFetch = globalThis.fetch;
  globalThis.fetch = () => { calls += 1; throw new Error('unexpected network'); };
  try {
    const tour = mountContinuousDemo(app.document, app.host, () => {});
    await click(app.host, 'sample');
    await reach(app.host, 'tryon');
    await click(app.host, 'mock-preview');
    assert.equal(tour.state.snapshot.mockResult, 'consent-required');
    await click(app.host, 'mode-off');
    await click(app.host, 'mock-preview');
    assert.equal(tour.state.snapshot.mockResult, 'provider-disabled');
    assert.equal(calls, 0);
    tour.dispose();
  } finally {
    if (oldFetch === undefined) delete globalThis.fetch;
    else globalThis.fetch = oldFetch;
    app.close();
  }
});

test('comparison is keyboard-operable and export screen does not claim a saved file', async () => {
  const app = judgeDOM();
  try {
    const tour = mountContinuousDemo(app.document, app.host, () => {});
    await click(app.host, 'sample');
    await reach(app.host, 'compare');
    const slider = input(app.host, 'comparison');
    assert.ok(slider);
    assert.equal(slider.getAttribute('aria-label'), 'Percentage showing the original illustration');
    slider.value = '76';
    await slider.dispatch('input');
    assert.equal(tour.state.snapshot.comparePercent, 76);
    await click(app.host, 'continue');
    assert.equal(tour.state.snapshot.step, 'save');
    assert.equal(tour.state.snapshot.requestedDownload, false);
    assert.match(app.host.textContent, /No download has been requested/);
    tour.dispose();
  } finally { app.close(); }
});

test('closing the walkthrough clears data and returns through the exit callback', async () => {
  const app = judgeDOM();
  let exited = 0;
  try {
    const tour = mountContinuousDemo(app.document, app.host, () => { exited += 1; });
    await click(app.host, 'sample');
    await click(app.host, 'exit');
    assert.equal(exited, 1);
    assert.equal(app.host.textContent, '');
    assert.throws(() => tour.state.snapshot, /closed/);
    tour.dispose();
  } finally { app.close(); }
});
