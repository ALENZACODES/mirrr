/** Motion is settled and optional, never spring-driven. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  EDITORIAL_EASE,
  applyEditorialMotion,
  browserMotionConditions,
  motionPlan,
  stageDuration,
  validMotionPlan,
} from '../dist/js/layout/editorial/motion.js';
import { sequencePage } from './helpers/continuous-sequence-page.mjs';

const awake = { reducedMotion: false, saveData: false, documentHidden: false };

test('settle policy is restrained, deterministic and transform-only', () => {
  const plan = motionPlan(awake);
  assert.equal(plan.mode, 'settle');
  assert.equal(plan.easing, EDITORIAL_EASE);
  assert.equal(stageDuration(plan, 'page'), 260);
  assert.equal(stageDuration(plan, 'caption'), 160);
  assert.equal(stageDuration(plan, 'focus'), 120);
  assert.equal(plan.translatePixels, 6);
  assert.doesNotMatch(plan.easing, /spring|bounce|elastic/i);
  assert.equal(validMotionPlan(plan), true);
});

for (const key of ['reducedMotion', 'saveData', 'documentHidden']) {
  test(`${key} disables decorative movement completely`, () => {
    const plan = motionPlan({ ...awake, [key]: true });
    assert.equal(plan.mode, 'still');
    assert.equal(plan.captionMs, 0);
    assert.equal(plan.pageMs, 0);
    assert.equal(plan.focusMs, 0);
    assert.equal(plan.translatePixels, 0);
    assert.equal(validMotionPlan(plan), true);
  });
}

test('untrusted motion plans cannot alter the fixed timing profile', () => {
  assert.equal(validMotionPlan({ ...motionPlan(awake), pageMs: 9000 }), false);
  assert.equal(validMotionPlan({ ...motionPlan(awake), easing: 'spring' }), false);
  assert.equal(validMotionPlan({ ...motionPlan(awake), payload: 1 }), false);
});

test('document preference is reflected in declarative root state', () => {
  const page = sequencePage({ reducedMotion: true });
  try {
    const host = page.document.createElement('div');
    const policy = applyEditorialMotion(host, page.document);
    assert.equal(policy.mode, 'still');
    assert.equal(host.dataset.editorialMotion, 'still');
    assert.equal(browserMotionConditions(page.document).reducedMotion, true);
  } finally { page.cleanup(); }
});

test('normal browser state uses settled mode without animation loops', () => {
  const page = sequencePage();
  try {
    const host = page.document.createElement('div');
    assert.equal(applyEditorialMotion(host, page.document).mode, 'settle');
    assert.equal(host.dataset.editorialMotion, 'settle');
  } finally { page.cleanup(); }
});
