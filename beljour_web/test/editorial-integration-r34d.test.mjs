/** End-to-end editorial frame and proof state. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountContinuousDemo } from '../dist/js/layout/continuous/mount.js';
import { sequencePage } from './helpers/continuous-sequence-page.mjs';

function mount(page) {
  return mountContinuousDemo(page.document, page.host, () => {}, {
    now: () => page.clock.now,
    sequenceTimer: page.timer,
  });
}

test('first view has an own-brand framed empty state, not a stock photo', () => {
  const page = sequencePage();
  try {
    const mode = mount(page);
    assert.equal(page.host.querySelectorAll('.lg-editorial-cover').length, 1);
    assert.equal(page.host.querySelectorAll('.lg-editorial-cover svg').length, 0);
    assert.equal(page.host.querySelectorAll('svg').length, 1);
    assert.equal(page.host.querySelectorAll('img').length, 0);
    assert.match(page.host.textContent, /Drawing unavailable/);
    assert.match(page.host.textContent, /Atelier \/ Drawn studies/);
    assert.equal(page.host.querySelectorAll('.lg-editorial-proof').length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('opening sample replaces empty illustration with existing local preview canvas', async () => {
  const page = sequencePage();
  try {
    const mode = mount(page);
    await page.press('sample');
    assert.equal(page.host.querySelectorAll('.lg-editorial-cover').length, 1);
    assert.equal(page.host.querySelectorAll('svg').length, 0);
    assert.equal(page.host.querySelectorAll('canvas').length, 1);
    assert.equal(page.host.querySelector('canvas').getAttribute('aria-label'),
      'Original drawn figures with simulated local edits');
    assert.match(page.host.textContent, /Primary drawing/);
    assert.equal(page.network.length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('Proof Wall stays absent until the final download stage', async () => {
  const page = sequencePage();
  try {
    const mode = mount(page);
    await page.press('sample');
    for (let i = 0; i < 14; i += 1) mode.state.next(true);
    mode.render();
    assert.equal(mode.state.snapshot.step, 'compare');
    assert.equal(page.host.querySelectorAll('.lg-editorial-proof').length, 0);
    mode.state.next(true);
    mode.render();
    assert.equal(mode.state.snapshot.step, 'save');
    assert.equal(page.host.querySelectorAll('.lg-editorial-proof').length, 1);
    assert.match(page.host.textContent, /No download requested/);
    assert.match(page.host.textContent, /Real-face quality/);
    assert.match(page.host.textContent, /Not verified/);
    assert.equal(page.network.length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('mock results never fill the real-face or release rows', async () => {
  const page = sequencePage();
  try {
    const mode = mount(page);
    await page.press('sample');
    mode.state.setPermission('local', true);
    mode.state.setPermission('hair', true);
    mode.state.setPermission('face', true);
    mode.state.setPermission('mock', true);
    mode.state.apply('hair');
    mode.state.recordTryon('mock-applied');
    for (let i = 0; i < 15; i += 1) mode.state.next(true);
    mode.render();
    const proof = page.host.querySelector('.lg-editorial-proof');
    assert.ok(proof);
    assert.equal(proof.querySelectorAll('tr').find(row => row.dataset.proofId === 'youcam').dataset.proofState, 'mock');
    for (const id of ['identity', 'real-face', 'frozen']) {
      assert.equal(proof.querySelectorAll('tr').find(row => row.dataset.proofId === id).dataset.proofState, 'pending');
    }
    assert.match(proof.textContent, /Mock branch exercised/);
    assert.doesNotMatch(proof.textContent, /real-face pass achieved|100,000 faces passed/i);
    assert.equal(page.network.length, 0);
    mode.dispose();
  } finally { page.cleanup(); }
});

test('reduced-motion mode is applied to the root for every re-render', async () => {
  const page = sequencePage({ reducedMotion: true });
  try {
    const mode = mount(page);
    assert.equal(page.host.querySelector('.lg-editorial-surface').dataset.editorialMotion, 'still');
    await page.press('sample');
    assert.equal(page.host.querySelector('.lg-editorial-surface').dataset.editorialMotion, 'still');
    mode.dispose();
  } finally { page.cleanup(); }
});
