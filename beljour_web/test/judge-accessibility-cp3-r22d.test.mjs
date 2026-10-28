// Lane D r22d-cp3: a screen reader and native slider keep their keyboard semantics.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  announceJudgeStep,
  attachJudgeKeys,
  focusJudgeHeading,
  isEditableJudgeTarget,
  judgeShortcut,
  prepareJudgeRegion,
} from '../dist/js/mobile/judge-accessibility.js';
import { eventSource, keyEvent, reportPage } from './judge-fixtures-cp3-r22d.mjs';

test('Escape exits only outside text inputs and modifier sequences', () => {
  assert.equal(judgeShortcut(keyEvent('Escape')), 'exit');
  assert.equal(judgeShortcut(keyEvent('Escape', { tagName: 'INPUT' })), null);
  assert.equal(judgeShortcut(keyEvent('Escape', { tagName: 'SELECT' })), null);
  assert.equal(judgeShortcut(keyEvent('Escape', { tagName: 'TEXTAREA' })), null);
  assert.equal(judgeShortcut(keyEvent('Escape', null, { altKey: true })), null);
  assert.equal(judgeShortcut(keyEvent('Escape', null, { ctrlKey: true })), null);
  assert.equal(judgeShortcut(keyEvent('Escape', null, { metaKey: true })), null);
});

test('question mark and F1 toggle guide without hijacking arbitrary typing', () => {
  assert.equal(judgeShortcut(keyEvent('?')), 'help');
  assert.equal(judgeShortcut(keyEvent('F1')), 'help');
  assert.equal(judgeShortcut(keyEvent('?', { tagName: 'INPUT' })), null);
  assert.equal(judgeShortcut(keyEvent('?', { isContentEditable: true })), null);
  assert.equal(judgeShortcut(keyEvent('ArrowLeft')), null);
  assert.equal(judgeShortcut(keyEvent('ArrowRight')), null);
  assert.equal(judgeShortcut(keyEvent('Enter')), null);
  assert.equal(judgeShortcut(keyEvent(' ')), null);
  assert.equal(judgeShortcut(keyEvent('Tab')), null);
});

test('a prevented keyboard event cannot trigger a second action', () => {
  assert.equal(judgeShortcut(keyEvent('Escape', null, { defaultPrevented: true })), null);
});

test('target classification uses exact native editable tags', () => {
  assert.equal(isEditableJudgeTarget(null), false);
  assert.equal(isEditableJudgeTarget(undefined), false);
  assert.equal(isEditableJudgeTarget({ tagName: 'input' }), true);
  assert.equal(isEditableJudgeTarget({ tagName: 'select' }), true);
  assert.equal(isEditableJudgeTarget({ tagName: 'TEXTAREA' }), true);
  assert.equal(isEditableJudgeTarget({ tagName: 'BUTTON' }), false);
  assert.equal(isEditableJudgeTarget({ tagName: 'CANVAS' }), false);
  assert.equal(isEditableJudgeTarget({ isContentEditable: true }), true);
});

test('keyboard hook dispatches one exit/help action and removes its listener', () => {
  const source = eventSource();
  let exited = 0;
  let helped = 0;
  const dispose = attachJudgeKeys(source, {
    exit: () => { exited += 1; },
    toggleHelp: () => { helped += 1; },
  });
  assert.equal(source.count('keydown'), 1);
  const escape = source.fire('keydown', { key: 'Escape' });
  assert.equal(escape.prevented, true);
  assert.equal(exited, 1);
  const question = source.fire('keydown', { key: '?' });
  assert.equal(question.prevented, true);
  assert.equal(helped, 1);
  dispose();
  assert.equal(source.count('keydown'), 0);
  source.fire('keydown', { key: 'Escape' });
  assert.equal(exited, 1);
});

test('keyboard hook leaves range-input arrows to the native browser', () => {
  const source = eventSource();
  let called = 0;
  const dispose = attachJudgeKeys(source, {
    exit: () => { called += 1; },
    toggleHelp: () => { called += 1; },
  });
  const action = source.fire('keydown', { key: 'ArrowLeft', target: { tagName: 'INPUT' } });
  assert.equal(action.prevented, false);
  assert.equal(called, 0);
  dispose();
});

test('step announcement sets an atomic polite live region without fabricated progress', () => {
  const page = reportPage();
  try {
    const mark = page.document.createElement('p');
    announceJudgeStep(mark, 2, 8, 'Consent');
    assert.equal(mark.textContent, 'Step 2 of 8: Consent');
    assert.equal(mark.getAttribute('role'), 'status');
    assert.equal(mark.getAttribute('aria-live'), 'polite');
    assert.equal(mark.getAttribute('aria-atomic'), 'true');
  } finally { page.teardown(); }
});

test('invalid step announcements throw rather than display nonsensical numbers', () => {
  const page = reportPage();
  try {
    const mark = page.document.createElement('p');
    for (const value of [0, -1, 9, 2.2, NaN, Infinity]) {
      assert.throws(() => announceJudgeStep(mark, value, 8, 'Hair'), RangeError);
    }
    assert.throws(() => announceJudgeStep(mark, 1, 0, 'Hair'), RangeError);
  } finally { page.teardown(); }
});

test('region names its real visible heading instead of a new focus trap', () => {
  const page = reportPage();
  try {
    prepareJudgeRegion(page.host, 'lg-judge-title');
    assert.equal(page.host.getAttribute('role'), 'region');
    assert.equal(page.host.getAttribute('aria-labelledby'), 'lg-judge-title');
    assert.equal(page.host.getAttribute('aria-roledescription'), 'guided illustration');
  } finally { page.teardown(); }
});

test('arbitrary invalid or script-like label IDs are rejected', () => {
  const page = reportPage();
  try {
    for (const id of ['', 'bad space', '<h1>', '5element', '#target']) {
      assert.throws(() => prepareJudgeRegion(page.host, id), RangeError);
    }
  } finally { page.teardown(); }
});

test('focus helper focuses only its own heading and handles missing header', () => {
  const page = reportPage();
  try {
    assert.equal(focusJudgeHeading(page.host), false);
    const heading = page.document.createElement('h2');
    heading.id = 'lg-judge-title';
    page.host.append(heading);
    assert.equal(focusJudgeHeading(page.host), true);
    assert.equal(heading.focused, true);
    assert.equal(heading.tabIndex, -1);
  } finally { page.teardown(); }
});
