import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DRAWN_PAIR } from '../dist/js/layout/subjects/contract.js';
import { SubjectSelection } from '../dist/js/layout/subjects/selection.js';
import {
  subjectEditDecision,
  currentSubjectTicket,
  subjectSelectionLabel,
} from '../dist/js/layout/subjects/authority.js';

function current() {
  const s = new SubjectSelection();
  s.begin(1);
  s.receive(1, DRAWN_PAIR);
  return s;
}

test('missing and pending detectors fail closed with no edit ticket', () => {
  const s = new SubjectSelection();
  for (const snapshot of [s.snapshot, (s.begin(1), s.snapshot)]) {
    const decision = subjectEditDecision(snapshot);
    assert.equal(decision.allowed, false);
    assert.equal(decision.ticket, null);
    assert.match(decision.message, /until a trusted detector/);
  }
  assert.equal(subjectSelectionLabel(s.snapshot), 'No verified subject selected');
});

test('a valid primary subject gets a revision-bound ticket and explicit bystander IDs', () => {
  const s = current();
  const outcome = subjectEditDecision(s.snapshot);
  assert.equal(outcome.allowed, true);
  assert.equal(outcome.ticket.perSubjectOnly, true);
  assert.equal(outcome.ticket.selectedId, 'drawn-main');
  assert.equal(outcome.ticket.photoRevision, 1);
  assert.deepEqual(outcome.ticket.bystanderIds, ['drawn-guest']);
  assert.equal(currentSubjectTicket(outcome.ticket, s.snapshot), true);
  assert.match(subjectSelectionLabel(s.snapshot), /Drawn person 1 of 2 selected; 1 unchanged/);
});

test('subject switches invalidate existing tickets, even if both rectangles remain valid', () => {
  const s = current();
  const before = subjectEditDecision(s.snapshot).ticket;
  s.choose('drawn-guest');
  assert.equal(currentSubjectTicket(before, s.snapshot), false);
  assert.equal(subjectEditDecision(s.snapshot).ticket.selectedId, 'drawn-guest');
  assert.match(subjectSelectionLabel(s.snapshot), /Drawn person 2 of 2 selected/);
});

test('replacing the photo invalidates prior revision and bystander permission', () => {
  const s = current();
  const before = subjectEditDecision(s.snapshot).ticket;
  s.begin(2);
  assert.equal(currentSubjectTicket(before, s.snapshot), false);
  s.receive(2, DRAWN_PAIR);
  assert.equal(currentSubjectTicket(before, s.snapshot), false);
  assert.equal(subjectEditDecision(s.snapshot).ticket.photoRevision, 2);
});

test('faking a primary with missing box ID does not create a writable region', () => {
  const s = current();
  const snapshot = { ...s.snapshot, selectedId: 'nonexistent' };
  const decision = subjectEditDecision(snapshot);
  assert.equal(decision.allowed, false);
  assert.equal(decision.refusal, 'no-target');
  assert.equal(decision.ticket, null);
});

test('tampered face origin and bounds are refused', () => {
  const s = current();
  const snapshot = s.snapshot;
  const wrongOrigin = { ...snapshot, source: 'detected' };
  assert.equal(subjectEditDecision(wrongOrigin).refusal, 'untrusted-bounds');
  const invalidBounds = { ...snapshot, boxes: [
    { ...DRAWN_PAIR[0], width: Infinity }, DRAWN_PAIR[1],
  ] };
  assert.equal(subjectEditDecision(invalidBounds).refusal, 'untrusted-bounds');
});

test('subject-box geometry changes invalidate previous edit ticket', () => {
  const s = current();
  const prior = subjectEditDecision(s.snapshot).ticket;
  const altered = { ...s.snapshot, boxes: [
    { ...DRAWN_PAIR[0], width: 0.35 }, DRAWN_PAIR[1],
  ] };
  assert.equal(currentSubjectTicket(prior, altered), false);
});

test('bystander-list changes also invalidate previous edit tickets', () => {
  const s = current();
  const prior = subjectEditDecision(s.snapshot).ticket;
  const altered = { ...s.snapshot, boxes: [DRAWN_PAIR[0]] };
  assert.equal(currentSubjectTicket(prior, altered), false);
});

test('ticket is read-only and does not contain image pixels or personal attributes', () => {
  const s = current();
  const ticket = subjectEditDecision(s.snapshot).ticket;
  assert.ok(Object.isFrozen(ticket));
  assert.ok(Object.isFrozen(ticket.target));
  assert.ok(Object.isFrozen(ticket.bystanderIds));
  const keys = Object.keys(ticket).sort();
  assert.deepEqual(keys, ['bystanderIds', 'perSubjectOnly', 'photoRevision', 'selectedId', 'target']);
  assert.ok(!JSON.stringify(ticket).includes('image/jpeg'));
});
