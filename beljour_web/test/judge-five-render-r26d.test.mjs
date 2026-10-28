import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JudgeSession } from '../dist/js/layout/judge-session.js';
import { FIVE_EDIT_STEPS } from '../dist/js/layout/judge-five-edits.js';
import { paintJudgeLook, burnJudgeLabel } from '../dist/js/ui/shell/judge-canvas.js';
import { paintSubjectOverlays } from '../dist/js/ui/shell/subject-render.js';
import { paintSingleExtraEdits } from '../dist/js/ui/shell/judge-five-render.js';
import { DRAWN_PAIR } from '../dist/js/layout/subjects/contract.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function fiveState() {
  const session = new JudgeSession();
  session.selectSource('sample');
  for (const action of ['local', 'hair', 'face']) session.consent(action, true);
  session.applyFiveIllustrations();
  return session.snapshot;
}

test('the single-drawing pipeline now paints all three distinct extra details', () => {
  const app = judgeDOM();
  try {
    const ctx = app.document.createElement('canvas').getContext('2d');
    app.calls.length = 0;
    paintSingleExtraEdits(ctx, fiveState(), 1);
    const operations = app.calls.map(call => call[0]);
    assert.ok(operations.filter(op => op === 'stroke').length >= 2);
    assert.ok(operations.includes('fill'));
    assert.equal(operations[0], 'save');
    assert.equal(operations.at(-1), 'restore');
  } finally { app.close(); }
});

test('separately disabled details produce no paint operations', () => {
  const app = judgeDOM();
  try {
    const s = new JudgeSession();
    s.selectSource('sample');
    const ctx = app.document.createElement('canvas').getContext('2d');
    paintSingleExtraEdits(ctx, s.snapshot, 1);
    assert.equal(app.calls.filter(call => ['stroke', 'fill'].includes(call[0])).length, 0);
  } finally { app.close(); }
});

test('invalid strength is rejected without touching the canvas', () => {
  const app = judgeDOM();
  try {
    const ctx = app.document.createElement('canvas').getContext('2d');
    for (const level of [-1, 1.01, Infinity, NaN]) {
      assert.throws(() => paintSingleExtraEdits(ctx, fiveState(), level), RangeError);
    }
    assert.equal(app.calls.length, 0);
  } finally { app.close(); }
});

test('five layers remain strictly confined to the chosen person in multi-person mode', () => {
  const app = judgeDOM();
  try {
    const target = app.document.createElement('canvas');
    const ctx = target.getContext('2d');
    const left = DRAWN_PAIR[0];
    const right = DRAWN_PAIR[1];
    paintSubjectOverlays(ctx, left, fiveState(), 512, 640);
    const firstRect = app.calls.find(op => op[0] === 'rect').slice(1);
    app.calls.length = 0;
    paintSubjectOverlays(ctx, right, fiveState(), 512, 640);
    const secondRect = app.calls.find(op => op[0] === 'rect').slice(1);
    assert.ok(firstRect[0] + firstRect[2] < secondRect[0]);
    assert.ok(app.calls.filter(op => op[0] === 'clip').length === 1);
    assert.ok(app.calls.filter(op => op[0] === 'stroke').length >= 2);
    assert.equal(FIVE_EDIT_STEPS.length, 5);
  } finally { app.close(); }
});

test('before-after and large export use the same five selected effects', () => {
  const app = judgeDOM();
  try {
    const source = app.document.createElement('canvas');
    const preview = app.document.createElement('canvas');
    const large = app.document.createElement('canvas');
    const state = fiveState();
    paintJudgeLook(source, preview, state, 'standard', true, DRAWN_PAIR[0], false);
    const first = app.calls.filter(op => op[0] === 'clip').length;
    app.calls.length = 0;
    paintJudgeLook(source, large, state, 'large', true, DRAWN_PAIR[0], false);
    assert.equal(first, 1);
    assert.equal(app.calls.filter(op => op[0] === 'clip').length, 1);
    assert.equal(preview.width, 512);
    assert.equal(large.width, 768);
    assert.ok(app.calls.some(op => op[0] === 'fillText' && /SIMULATION/.test(op[1])));
  } finally { app.close(); }
});

test('mandatory simulation label has no off flag or CSS-only path', () => {
  const app = judgeDOM();
  try {
    const ctx = app.document.createElement('canvas').getContext('2d');
    burnJudgeLabel(ctx, 512, 640);
    assert.ok(app.calls.some(op => op[0] === 'fillText' && /SIMULATION/.test(op[1])));
  } finally { app.close(); }
});
