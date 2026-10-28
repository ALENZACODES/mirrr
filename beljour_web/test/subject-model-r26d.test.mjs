import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DRAWN_PAIR,
  checkedSubjectBoxes,
  subjectBoxProblem,
  suggestedSubject,
  subjectArea,
} from '../dist/js/layout/subjects/contract.js';
import { SubjectSelection } from '../dist/js/layout/subjects/selection.js';

function face(id, extras = {}) {
  return { id, x: 0.2, y: 0.2, width: 0.3, height: 0.4, origin: 'detected', ...extras };
}

test('the approved synthetic pair is an explicit drawing, not detected evidence', () => {
  assert.equal(DRAWN_PAIR.length, 2);
  assert.equal(DRAWN_PAIR[0].primary, true);
  assert.equal(DRAWN_PAIR[1].origin, 'drawn');
  assert.equal(suggestedSubject(DRAWN_PAIR), 'drawn-main');
  assert.ok(DRAWN_PAIR.every(b => subjectBoxProblem(b) === null));
});

test('bounds validation refuses tampered identifiers, geometry and sources', () => {
  const bad = [
    face(''), face('x/../a'), face('b', { x: -0.01 }),
    face('c', { y: 0.8, height: 0.4 }),
    face('d', { width: 0 }), face('e', { width: 0.001 }),
    face('f', { x: NaN }), face('g', { height: Infinity }),
    face('h', { primary: 'true' }), face('i', { origin: 'manual-guess' }),
  ];
  for (const candidate of bad) {
    assert.ok(subjectBoxProblem(candidate), JSON.stringify(candidate));
    assert.throws(() => checkedSubjectBoxes([candidate]), RangeError);
  }
});

test('list integrity rejects duplicate IDs, multiple mains and capacity overflow', () => {
  assert.throws(() => checkedSubjectBoxes([face('a'), face('a')]), /Duplicate/);
  assert.throws(() => checkedSubjectBoxes([
    face('a', { primary: true }), face('b', { primary: true }),
  ]), /Multiple primary/);
  assert.throws(() => checkedSubjectBoxes(Array.from({ length: 21 }, (_, i) => face('f' + i))), RangeError);
  assert.deepEqual(checkedSubjectBoxes([]), []);
});

test('default main is explicit, otherwise the largest and most centered box', () => {
  assert.equal(subjectArea(face('x')), 0.12);
  const faces = [
    face('tiny-edge', { x: 0.01, y: 0.01, width: 0.12, height: 0.12 }),
    face('main', { x: 0.3, y: 0.3, width: 0.4, height: 0.4 }),
  ];
  assert.equal(suggestedSubject(faces), 'main');
  assert.equal(suggestedSubject([]), null);
  assert.equal(suggestedSubject([face('marked', { primary: true }), ...faces]), 'marked');
});

test('initial state does not assert any face was found', () => {
  const selection = new SubjectSelection();
  assert.equal(selection.snapshot.source, 'none');
  assert.equal(selection.snapshot.selectedId, null);
  assert.equal(selection.active, null);
});

test('new source revision invalidates every previous face and choice', () => {
  const selection = new SubjectSelection();
  selection.begin(1);
  assert.ok(selection.receive(1, DRAWN_PAIR));
  assert.equal(selection.active.id, 'drawn-main');
  assert.equal(selection.choose('drawn-guest'), true);
  assert.equal(selection.active.id, 'drawn-guest');
  selection.begin(2);
  assert.equal(selection.active, null);
  assert.equal(selection.snapshot.boxes.length, 0);
  assert.equal(selection.snapshot.source, 'awaiting-detector');
  assert.equal(selection.receive(1, DRAWN_PAIR), false);
  assert.equal(selection.active, null);
});

test('selection refuses unknown ids and cannot mutate source snapshots', () => {
  const selection = new SubjectSelection();
  selection.begin(3);
  selection.receive(3, DRAWN_PAIR);
  assert.equal(selection.choose('not-present'), false);
  assert.equal(selection.choose('drawn-main'), false);
  assert.equal(selection.choose('drawn-guest'), true);
  assert.equal(selection.choose('drawn-guest'), false);
  const snapshot = selection.snapshot;
  assert.throws(() => { snapshot.boxes[0].id = 'forged'; }, TypeError);
  assert.equal(selection.snapshot.boxes[0].id, 'drawn-main');
  selection.clear();
  assert.equal(selection.snapshot.selectedId, null);
});

test('mixed claimed sources are refused rather than silently merged', () => {
  const selection = new SubjectSelection();
  selection.begin(1);
  assert.throws(() => selection.receive(1, [DRAWN_PAIR[0], face('new')]), /mix drawn and detected/);
  assert.equal(selection.snapshot.boxes.length, 0);
  assert.ok(selection.receive(1, [face('new')]));
  assert.equal(selection.snapshot.source, 'detected');
});

test('empty detected results do not create guessed main subject', () => {
  const selection = new SubjectSelection();
  selection.begin(9);
  selection.receive(9, []);
  assert.equal(selection.snapshot.source, 'awaiting-detector');
  assert.equal(selection.snapshot.selectedId, null);
  assert.match(selection.snapshot.reason, /No verified face boxes/);
});

test('invalid revision or stale reply cannot replace a current subject', () => {
  const selection = new SubjectSelection();
  for (const revision of [0, -1, 1.5, NaN]) {
    assert.throws(() => selection.begin(revision), RangeError);
  }
  selection.begin(8);
  selection.receive(8, [face('original')]);
  assert.throws(() => selection.begin(8), RangeError);
  assert.equal(selection.receive(7, [face('stale')]), false);
  assert.equal(selection.active.id, 'original');
});
