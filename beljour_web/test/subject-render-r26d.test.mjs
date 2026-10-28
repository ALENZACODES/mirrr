import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DRAWN_PAIR } from '../dist/js/layout/subjects/contract.js';
import { paintSubjectOverlays, toRasterRegion } from '../dist/js/ui/shell/subject-render.js';
import { drawTwoPersonSample } from '../dist/js/ui/shell/subject-drawing.js';
import { JudgeSession } from '../dist/js/layout/judge-session.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function state() {
  const session = new JudgeSession();
  session.selectSource('sample');
  for (const name of ['local', 'hair', 'face', 'mock']) session.consent(name, true);
  session.setHair('chestnut');
  session.setFace('warm');
  session.setMock(true);
  return session.snapshot;
}

test('pixel target is the exact normalized rectangle, not an inferred contour', () => {
  const box = DRAWN_PAIR[0];
  assert.deepEqual(toRasterRegion(box, 1000, 500), {
    x: 120, y: 110, width: 370, height: 270,
  });
  for (const [w, h] of [[0, 4], [640, NaN], [100.5, 20]]) {
    assert.throws(() => toRasterRegion(box, w, h), RangeError);
  }
});

test('all selected-face drawing is clipped before the first illustrative edit', () => {
  const app = judgeDOM();
  try {
    const canvas = app.document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    app.calls.length = 0;
    paintSubjectOverlays(ctx, DRAWN_PAIR[1], state(), 512, 640);
    const commands = app.calls.map(c => c[0]);
    assert.equal(commands[0], 'save');
    assert.ok(commands.indexOf('rect') < commands.indexOf('clip'));
    assert.ok(commands.indexOf('clip') < commands.indexOf('ellipse'));
    assert.equal(commands.at(-1), 'restore');
    const bounds = app.calls.find(c => c[0] === 'rect');
    assert.deepEqual(bounds.slice(1), [281.6, 160, 168.96, 320]);
  } finally { app.close(); }
});

test('no selected edits yield no ellipse and no tint', () => {
  const app = judgeDOM();
  try {
    const session = new JudgeSession();
    session.selectSource('sample');
    const canvas = app.document.createElement('canvas');
    paintSubjectOverlays(canvas.getContext('2d'), DRAWN_PAIR[0], session.snapshot, 512, 640);
    assert.equal(app.calls.filter(c => c[0] === 'ellipse').length, 0);
  } finally { app.close(); }
});

test('the pair remains an illustration and contains no copied person image', () => {
  const app = judgeDOM();
  try {
    const canvas = app.document.createElement('canvas');
    drawTwoPersonSample(canvas);
    assert.equal(canvas.width, 512);
    assert.equal(canvas.height, 640);
    assert.ok(app.calls.some(c => c[0] === 'fillText' && /NO REAL FACES/.test(c[1])));
    assert.ok(!app.calls.some(c => c[0] === 'drawImage'));
  } finally { app.close(); }
});
