import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JudgeSession } from '../dist/js/layout/judge-session.js';
import {
  EMPTY_JUDGE_DETAILS,
  FIVE_EDIT_STEPS,
  fiveEditHeadline,
  fiveEditSummary,
  validateFiveEditId,
} from '../dist/js/layout/judge-five-edits.js';

function session({ permissions = true } = {}) {
  const state = new JudgeSession();
  state.selectSource('sample');
  if (permissions) for (const action of ['local', 'hair', 'face']) state.consent(action, true);
  return state;
}

test('the five edits have stable, distinct identifiers and consent scopes', () => {
  assert.deepEqual(FIVE_EDIT_STEPS.map(x => x.id), [
    'hair-colour', 'hair-highlight', 'cheek-colour', 'lip-colour', 'eyeliner',
  ]);
  assert.deepEqual(FIVE_EDIT_STEPS.map(x => x.family), ['hair', 'hair', 'face', 'face', 'face']);
  for (const item of FIVE_EDIT_STEPS) assert.equal(validateFiveEditId(item.id), true);
  assert.equal(validateFiveEditId('skin-whiten'), false);
  assert.equal(validateFiveEditId(''), false);
  assert.equal(validateFiveEditId('mock'), false);
});

test('new sessions start with zero applied details and no hidden on state', () => {
  const s = session({ permissions: false });
  assert.deepEqual(s.snapshot.details, EMPTY_JUDGE_DETAILS);
  assert.equal(fiveEditSummary(s.snapshot).appliedCount, 0);
  assert.equal(fiveEditSummary(s.snapshot).hasProviderEvidence, false);
  assert.equal(fiveEditSummary(s.snapshot).labelsAreIllustrative, true);
});

test('all five explicit local choices are real, individually switchable state', () => {
  const s = session();
  assert.equal(s.setHair('chestnut'), true);
  assert.equal(fiveEditSummary(s.snapshot).appliedCount, 1);
  assert.equal(s.setDetail('hair-highlight', true), true);
  assert.equal(fiveEditSummary(s.snapshot).appliedCount, 2);
  assert.equal(s.setFace('warm'), true);
  assert.equal(fiveEditSummary(s.snapshot).appliedCount, 3);
  assert.equal(s.setDetail('lip-colour', true), true);
  assert.equal(fiveEditSummary(s.snapshot).appliedCount, 4);
  assert.equal(s.setDetail('eyeliner', true), true);
  assert.equal(fiveEditSummary(s.snapshot).appliedCount, 5);
  assert.equal(fiveEditSummary(s.snapshot).allApplied, true);
  assert.match(fiveEditHeadline(s.snapshot), /^5 of 5 local illustrative edits selected$/);
  assert.equal(s.setDetail('eyeliner', false), true);
  assert.equal(fiveEditSummary(s.snapshot).appliedCount, 4);
});

test('one explicit five-edit selection creates distinct effects but no mock provider action', () => {
  const s = session();
  assert.equal(s.applyFiveIllustrations(), true);
  const state = s.snapshot;
  assert.equal(state.hair, 'chestnut');
  assert.equal(state.face, 'warm');
  assert.deepEqual(state.details, { 'hair-highlight': true, 'lip-colour': true, eyeliner: true });
  assert.equal(state.mock, false);
  assert.equal(fiveEditSummary(state).allApplied, true);
  assert.equal(fiveEditSummary(state).rows.length, 5);
});

test('five-edit shortcut cannot bypass missing local, hair or face permission', () => {
  const s = session({ permissions: false });
  assert.equal(s.applyFiveIllustrations(), false);
  s.consent('local', true);
  assert.equal(s.applyFiveIllustrations(), false);
  s.consent('hair', true);
  assert.equal(s.applyFiveIllustrations(), false);
  s.consent('face', true);
  assert.equal(s.applyFiveIllustrations(), true);
});

test('hair consent withdrawal removes exactly the two hair effects', () => {
  const s = session();
  s.applyFiveIllustrations();
  s.consent('hair', false);
  assert.equal(s.snapshot.hair, 'none');
  assert.equal(s.snapshot.details['hair-highlight'], false);
  assert.equal(s.snapshot.face, 'warm');
  assert.equal(s.snapshot.details['lip-colour'], true);
  assert.equal(s.snapshot.details.eyeliner, true);
  assert.equal(fiveEditSummary(s.snapshot).appliedCount, 3);
  assert.equal(s.setDetail('hair-highlight', true), false);
});

test('face consent withdrawal removes all three face edits while retaining hair', () => {
  const s = session();
  s.applyFiveIllustrations();
  s.consent('face', false);
  assert.equal(s.snapshot.face, 'none');
  assert.equal(s.snapshot.details['lip-colour'], false);
  assert.equal(s.snapshot.details.eyeliner, false);
  assert.equal(s.snapshot.hair, 'chestnut');
  assert.equal(s.snapshot.details['hair-highlight'], true);
  assert.equal(fiveEditSummary(s.snapshot).appliedCount, 2);
  assert.equal(s.setDetail('eyeliner', true), false);
});

test('withdrawal of local consent clears all five and all action permissions', () => {
  const s = session();
  s.applyFiveIllustrations();
  s.consent('local', false);
  assert.equal(fiveEditSummary(s.snapshot).appliedCount, 0);
  assert.deepEqual(s.snapshot.permissions, { local: false, hair: false, face: false, mock: false });
  assert.equal(s.applyFiveIllustrations(), false);
});

test('new source and reset both discard old details rather than leaking to another person', () => {
  const s = session();
  s.applyFiveIllustrations();
  s.selectSource('upload');
  assert.equal(fiveEditSummary(s.snapshot).appliedCount, 0);
  assert.deepEqual(s.snapshot.details, EMPTY_JUDGE_DETAILS);
  s.applyFiveIllustrations();
  s.reset();
  assert.equal(fiveEditSummary(s.snapshot).appliedCount, 0);
  assert.equal(s.snapshot.source, null);
});

test('clearSource invalidates visible edits without preserving previous output', () => {
  const s = session();
  s.applyFiveIllustrations();
  s.clearSource();
  assert.equal(s.snapshot.source, null);
  assert.equal(fiveEditSummary(s.snapshot).appliedCount, 0);
});

test('invalid detail IDs and malformed enable arguments are refused', () => {
  const s = session();
  assert.equal(s.setDetail('unknown', true), false);
  assert.equal(s.setDetail('lip-colour', 'true'), false);
  assert.equal(s.setDetail('eyeliner', null), false);
  assert.deepEqual(s.snapshot.details, EMPTY_JUDGE_DETAILS);
});

test('changing preview strength cannot silently add or remove effects', () => {
  const s = session();
  s.applyFiveIllustrations();
  for (const level of [1, 1.1, 2.7, 4.9, 5]) {
    assert.equal(s.setStrength(level), true);
    assert.equal(fiveEditSummary(s.snapshot).appliedCount, 5);
  }
  assert.equal(s.setStrength(0.5), false);
  assert.equal(s.setStrength(3.05), false);
  assert.equal(s.snapshot.strength, 5);
});
