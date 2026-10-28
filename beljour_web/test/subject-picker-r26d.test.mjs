import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SubjectSelection } from '../dist/js/layout/subjects/selection.js';
import { DRAWN_PAIR } from '../dist/js/layout/subjects/contract.js';
import { attachSubjectPicker, renderSubjectButtons } from '../dist/js/ui/shell/subject-picker.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function seeded() {
  const selection = new SubjectSelection();
  selection.begin(1);
  selection.receive(1, DRAWN_PAIR);
  return selection;
}

test('every drawn face has a positioned keyboard-operable selection box', async () => {
  const app = judgeDOM();
  try {
    const selection = seeded();
    const ids = [];
    const overlay = renderSubjectButtons(app.document, selection.snapshot, { choose: id => ids.push(id) });
    app.host.append(overlay);
    const boxes = app.host.querySelectorAll('button');
    assert.equal(boxes.length, 2);
    assert.deepEqual(boxes.map(node => node.dataset.subjectId), ['drawn-main', 'drawn-guest']);
    assert.equal(boxes[0].getAttribute('aria-pressed'), 'true');
    assert.equal(boxes[1].getAttribute('aria-pressed'), 'false');
    assert.equal(boxes[0].style.left, '12%');
    assert.equal(boxes[1].style.left, '55.00000000000001%');
    assert.match(boxes[1].getAttribute('aria-label'), /unchanged by current edit/);
    await boxes[1].click();
    assert.deepEqual(ids, ['drawn-guest']);
  } finally { app.close(); }
});

test('subject panel states no fabricated detection for an uploaded image', () => {
  const app = judgeDOM();
  try {
    const preview = app.document.createElement('figure');
    preview.className = 'lg-judge-visual';
    app.host.append(preview);
    attachSubjectPicker(app.document, app.host, new SubjectSelection().snapshot, { choose: () => {} });
    assert.match(app.host.textContent, /No face boxes supplied/);
    assert.match(app.host.textContent, /Do not assume a main face/);
    assert.equal(app.host.querySelectorAll('.lg-subject-box').length, 0);
  } finally { app.close(); }
});

test('picker emits a face id rather than any photo or provider data', async () => {
  const app = judgeDOM();
  try {
    const preview = app.document.createElement('figure');
    preview.className = 'lg-judge-visual';
    app.host.append(preview);
    const seen = [];
    attachSubjectPicker(app.document, app.host, seeded().snapshot, { choose: id => seen.push(id) });
    assert.equal(app.host.querySelectorAll('.lg-subject-box').length, 2);
    const buttons = app.host.querySelectorAll('button');
    await buttons.at(-1).click();
    assert.deepEqual(seen, ['drawn-guest']);
    assert.match(app.host.textContent, /Bystanders are not edited/);
    assert.doesNotMatch(app.host.textContent, /data:image|https?:\/\//);
  } finally { app.close(); }
});
