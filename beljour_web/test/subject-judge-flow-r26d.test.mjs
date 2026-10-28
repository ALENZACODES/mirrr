import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountJudgeMode } from '../dist/js/layout/judge-mode.js';
import { paintJudgeLook } from '../dist/js/ui/shell/judge-canvas.js';
import { JudgeImage } from '../dist/js/ui/shell/judge-image.js';
import { JudgeSession } from '../dist/js/layout/judge-session.js';
import { judgeDOM, control } from './judge-fixtures-r22d.mjs';

async function press(host, id) {
  const button = control(host, id);
  assert.ok(button, `Missing ${id}`);
  assert.equal(button.disabled, false, `Disabled ${id}`);
  await button.click();
}

async function consent(host, id) {
  const field = control(host, 'consent-' + id);
  assert.ok(field, `Missing ${id} consent`);
  field.checked = true;
  await field.dispatch('change');
}

async function hairStep(host) {
  await press(host, 'sample-pair');
  await press(host, 'next');
  for (const id of ['local', 'hair', 'face', 'mock']) await consent(host, id);
  await press(host, 'next');
}

test('pair is optional and ordinary single drawn sample keeps prior behavior', async () => {
  const app = judgeDOM();
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    assert.ok(control(app.host, 'sample'));
    assert.ok(control(app.host, 'sample-pair'));
    await press(app.host, 'sample');
    assert.equal(guide.image.activeSubject, null);
    assert.equal(guide.image.canIllustrate, true);
    assert.equal(guide.image.subjects.snapshot.boxes.length, 0);
    guide.dispose();
  } finally { app.close(); }
});

test('pair loads with every face box and selects the declared main figure by default', async () => {
  const app = judgeDOM();
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    await press(app.host, 'sample-pair');
    assert.equal(guide.image.subjects.snapshot.source, 'drawn');
    assert.equal(guide.image.subjects.snapshot.boxes.length, 2);
    assert.equal(guide.image.activeSubject.id, 'drawn-main');
    assert.equal(app.host.querySelectorAll('.lg-subject-box').length, 2);
    assert.equal(app.host.querySelectorAll('button').filter(node => Boolean(node.dataset.subjectChoice)).length, 2);
    assert.match(app.host.textContent, /bystander is unchanged/i);
    guide.dispose();
  } finally { app.close(); }
});

test('selecting another drawn person changes exactly the intended face', async () => {
  const app = judgeDOM();
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    await hairStep(app.host);
    await press(app.host, 'hair-chestnut');
    assert.equal(guide.session.snapshot.hair, 'chestnut');
    const guest = app.host.querySelectorAll('button').find(b => b.dataset.subjectChoice === 'drawn-guest');
    assert.ok(guest);
    await guest.click();
    assert.equal(guide.image.activeSubject.id, 'drawn-guest');
    assert.match(app.host.textContent, /Only the selected person receives/);
    const boxes = app.host.querySelectorAll('.lg-subject-box');
    assert.equal(boxes[0].getAttribute('aria-pressed'), 'false');
    assert.equal(boxes[1].getAttribute('aria-pressed'), 'true');
    guide.dispose();
  } finally { app.close(); }
});

test('a source replacement invalidates the previous selected bystander', async () => {
  const app = judgeDOM();
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    await press(app.host, 'sample-pair');
    const guest = app.host.querySelectorAll('button').find(b => b.dataset.subjectChoice === 'drawn-guest');
    await guest.click();
    assert.equal(guide.image.activeSubject.id, 'drawn-guest');
    await press(app.host, 'sample');
    assert.equal(guide.image.activeSubject, null);
    assert.equal(guide.image.subjects.snapshot.boxes.length, 0);
    guide.dispose();
  } finally { app.close(); }
});

test('switching subject clears stale comparison and download milestones', async () => {
  const app = judgeDOM();
  try {
    const guide = mountJudgeMode(app.document, app.host, () => {});
    await hairStep(app.host);
    await press(app.host, 'hair-chestnut');
    await press(app.host, 'next');
    await press(app.host, 'face-warm');
    await press(app.host, 'next');
    await press(app.host, 'mock-tryon');
    await press(app.host, 'next');
    const slider = app.host.querySelectorAll('input').find(n => n.id === 'lg-judge-comparison');
    slider.value = '68';
    await slider.dispatch('input');
    await press(app.host, 'back');
    const selector = app.host.querySelectorAll('button').find(b => b.dataset.subjectChoice === 'drawn-guest');
    await selector.click();
    assert.equal(guide.image.activeSubject.id, 'drawn-guest');
    await press(app.host, 'next');
    await press(app.host, 'next');
    await press(app.host, 'next');
    assert.match(app.host.textContent, /No labelled image download was requested/);
    guide.dispose();
  } finally { app.close(); }
});

test('uploaded image has no guessed face and is barred from untargeted edits', async () => {
  const app = judgeDOM();
  try {
    const image = new JudgeImage(app.document);
    let closed = 0;
    const decoded = { width: 1200, height: 900, close() { closed += 1; } };
    const file = { size: 200, type: 'image/png' };
    const accepted = await image.upload(file, async () => decoded);
    assert.equal(accepted, true);
    assert.equal(closed, 1);
    assert.equal(image.subjects.snapshot.boxes.length, 0);
    assert.equal(image.activeSubject, null);
    assert.equal(image.allowUntrackedDrawing, false);
    assert.equal(image.canIllustrate, false);
    image.dispose();
  } finally { app.close(); }
});

test('painting with no subject must not apply a guessed face edit', () => {
  const app = judgeDOM();
  try {
    const image = new JudgeImage(app.document);
    image.sample();
    const session = new JudgeSession();
    session.selectSource('sample');
    for (const id of ['local', 'hair', 'face', 'mock']) session.consent(id, true);
    session.setHair('deep-blue');
    session.setFace('cool');
    session.setMock(true);
    const target = app.document.createElement('canvas');
    app.calls.length = 0;
    paintJudgeLook(image.original, target, session.snapshot, 'standard', false, null, false);
    const overlays = app.calls.filter(c => c[0] === 'ellipse');
    assert.equal(overlays.length, 0);
    assert.equal(app.calls.filter(c => c[0] === 'drawImage').length, 1);
    image.dispose();
  } finally { app.close(); }
});
