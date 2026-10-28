import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountJudgeMode } from '../dist/js/layout/judge-mode.js';
import { fiveEditSummary } from '../dist/js/layout/judge-five-edits.js';
import { judgeDOM, control } from './judge-fixtures-r22d.mjs';

async function press(host, id) {
  const button = control(host, id);
  assert.ok(button, `Missing ${id}`);
  assert.equal(button.disabled, false, `Disabled ${id}`);
  await button.click();
}

async function consent(host, name) {
  const field = control(host, 'consent-' + name);
  assert.ok(field);
  field.checked = true;
  await field.dispatch('change');
}

async function toHair(host, sample = 'sample-pair') {
  await press(host, sample);
  await press(host, 'next');
  for (const action of ['local', 'hair', 'face', 'mock']) await consent(host, action);
  await press(host, 'next');
}

async function toFace(host) {
  await toHair(host);
  await press(host, 'hair-chestnut');
  await press(host, 'next');
}

async function applyFive(host, mode) {
  await toFace(host);
  assert.equal(mode.session.snapshot.step, 'face');
  await press(host, 'five-edit-apply');
  assert.equal(fiveEditSummary(mode.session.snapshot).appliedCount, 5);
}

test('hair and face screens expose separate control for each of the five edits', async () => {
  const app = judgeDOM();
  try {
    const mode = mountJudgeMode(app.document, app.host, () => {});
    await toHair(app.host);
    assert.ok(control(app.host, 'hair-chestnut'));
    assert.ok(control(app.host, 'detail-hair-highlight'));
    await press(app.host, 'hair-chestnut');
    await press(app.host, 'detail-hair-highlight');
    assert.equal(fiveEditSummary(mode.session.snapshot).appliedCount, 2);
    await press(app.host, 'next');
    assert.ok(control(app.host, 'face-warm'));
    assert.ok(control(app.host, 'detail-lip-colour'));
    assert.ok(control(app.host, 'detail-eyeliner'));
    await press(app.host, 'face-warm');
    await press(app.host, 'detail-lip-colour');
    await press(app.host, 'detail-eyeliner');
    assert.equal(fiveEditSummary(mode.session.snapshot).appliedCount, 5);
    assert.match(app.host.textContent, /5 of 5 local illustrative edits selected/);
    mode.dispose();
  } finally { app.close(); }
});

test('one explicit five-edit control is available only with source and all required consent', async () => {
  const app = judgeDOM();
  try {
    const mode = mountJudgeMode(app.document, app.host, () => {});
    await press(app.host, 'sample-pair');
    await press(app.host, 'next');
    await consent(app.host, 'local');
    await consent(app.host, 'hair');
    await press(app.host, 'next');
    await press(app.host, 'hair-chestnut');
    await press(app.host, 'next');
    assert.equal(control(app.host, 'five-edit-apply').disabled, true);
    await press(app.host, 'back');
    await press(app.host, 'back');
    await consent(app.host, 'face');
    await press(app.host, 'next');
    await press(app.host, 'next');
    assert.equal(control(app.host, 'five-edit-apply').disabled, false);
    mode.dispose();
  } finally { app.close(); }
});

test('full drawn demo reaches five edits, mock, before-after, marked export and plans', async () => {
  const app = judgeDOM();
  const create = URL.createObjectURL;
  const revoke = URL.revokeObjectURL;
  let downloads = 0;
  URL.createObjectURL = () => { downloads += 1; return 'blob:drawn'; };
  URL.revokeObjectURL = () => {};
  try {
    const mode = mountJudgeMode(app.document, app.host, () => {});
    await applyFive(app.host, mode);
    assert.equal(mode.session.snapshot.mock, false);
    assert.equal(mode.image.activeSubject.id, 'drawn-main');
    await press(app.host, 'next');
    assert.match(app.host.textContent, /Mock YouCam try-on/);
    await press(app.host, 'mock-tryon');
    assert.equal(mode.session.snapshot.mock, true);
    await press(app.host, 'next');
    const compare = app.host.querySelectorAll('input').find(n => n.id === 'lg-judge-comparison');
    compare.value = '69';
    await compare.dispatch('input');
    await press(app.host, 'next');
    await press(app.host, 'export-save');
    assert.equal(downloads, 1);
    await press(app.host, 'next');
    assert.equal(mode.session.snapshot.step, 'plans');
    assert.match(app.host.textContent, /5 of 5 local illustrative edits selected/);
    assert.match(app.host.textContent, /8 of 8 local actions observed/);
    assert.match(app.host.textContent, /No real YouCam request occurs/);
    mode.dispose();
  } finally {
    URL.createObjectURL = create;
    URL.revokeObjectURL = revoke;
    app.close();
  }
});

test('all effect strength sliders are decimal 1.0 to 5.0, not the compare percentage', async () => {
  const app = judgeDOM();
  try {
    const mode = mountJudgeMode(app.document, app.host, () => {});
    await toHair(app.host);
    for (const family of ['hair', 'face', 'mock']) {
      const slider = control(app.host, 'edit-strength');
      assert.ok(slider, `Missing ${family} strength`);
      assert.deepEqual([slider.min, slider.max, slider.step], ['1', '5', '0.1']);
      assert.match(app.host.textContent, /Identity lock: ON by default/);
      assert.equal(mode.session.snapshot.strength, 5);
      if (family === 'hair') await press(app.host, 'hair-chestnut');
      if (family === 'face') await press(app.host, 'face-warm');
      if (family === 'mock') await press(app.host, 'mock-tryon');
      await press(app.host, 'next');
    }
    const divider = app.host.querySelectorAll('input').find(n => n.id === 'lg-judge-comparison');
    assert.deepEqual([divider.min, divider.max, divider.step], ['0', '100', '1']);
    mode.dispose();
  } finally { app.close(); }
});

test('strength changes preserve chosen edits without turning identity lock off', async () => {
  const app = judgeDOM();
  try {
    const mode = mountJudgeMode(app.document, app.host, () => {});
    await applyFive(app.host, mode);
    const slider = control(app.host, 'edit-strength');
    for (const strength of ['1.0', '2.8', '4.9']) {
      slider.value = strength;
      await slider.dispatch('input');
      assert.equal(fiveEditSummary(mode.session.snapshot).appliedCount, 5);
    }
    assert.match(app.host.textContent, /Identity lock: ON by default/);
    assert.doesNotMatch(app.host.textContent, /Disable identity lock/);
    mode.dispose();
  } finally { app.close(); }
});

test('all five edits are on the selected person, not copied to the bystander', async () => {
  const app = judgeDOM();
  try {
    const mode = mountJudgeMode(app.document, app.host, () => {});
    await applyFive(app.host, mode);
    const guest = app.host.querySelectorAll('button').find(b => b.dataset.subjectChoice === 'drawn-guest');
    assert.ok(guest);
    await guest.click();
    assert.equal(mode.image.activeSubject.id, 'drawn-guest');
    assert.equal(fiveEditSummary(mode.session.snapshot).appliedCount, 5);
    assert.equal(app.host.querySelectorAll('.lg-subject-box').length, 2);
    assert.equal(app.host.querySelectorAll('.lg-subject-box')[0].getAttribute('aria-pressed'), 'false');
    assert.equal(app.host.querySelectorAll('.lg-subject-box')[1].getAttribute('aria-pressed'), 'true');
    assert.match(app.host.textContent, /Target changed/);
    mode.dispose();
  } finally { app.close(); }
});

test('returning to source and choosing a new photo removes all old effects', async () => {
  const app = judgeDOM();
  try {
    const mode = mountJudgeMode(app.document, app.host, () => {});
    await applyFive(app.host, mode);
    assert.equal(fiveEditSummary(mode.session.snapshot).allApplied, true);
    await press(app.host, 'back');
    await press(app.host, 'back');
    await press(app.host, 'back');
    await press(app.host, 'sample');
    assert.equal(mode.image.activeSubject, null);
    assert.equal(fiveEditSummary(mode.session.snapshot).appliedCount, 0);
    mode.dispose();
  } finally { app.close(); }
});

test('exit disposes every optional model and clears in-memory action state', async () => {
  const app = judgeDOM();
  let exited = 0;
  try {
    const mode = mountJudgeMode(app.document, app.host, () => { exited += 1; });
    await applyFive(app.host, mode);
    await press(app.host, 'exit');
    assert.equal(exited, 1);
    assert.equal(mode.image.hasImage, false);
    assert.equal(fiveEditSummary(mode.session.snapshot).appliedCount, 0);
    assert.equal(app.host.children.length, 0);
  } finally { app.close(); }
});
