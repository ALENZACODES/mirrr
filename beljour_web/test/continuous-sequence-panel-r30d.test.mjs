/** Native sequence controls, captions and step indicators. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { judgeDOM } from './judge-fixtures-r22d.mjs';
import { renderLocalSequencePanel } from '../dist/js/ui/shell/continuous-sequence-panel.js';
import { LOCAL_EDIT_SEQUENCE, sequenceReadableStatus } from '../dist/js/layout/continuous/sequence-contract.js';

function fixture(phase = 'idle', options = {}) {
  const page = judgeDOM();
  const calls = [];
  const count = options.count ?? 0;
  const done = LOCAL_EDIT_SEQUENCE.slice(0, count).map(row => ({
    effect: row.effect, level: 3.0, durationMs: 1, kind: 'drawn',
  }));
  const status = {
    phase, reason: options.reason ?? 'none', completed: done,
    nextEffect: LOCAL_EDIT_SEQUENCE[count]?.effect ?? null,
    remaining: 7 - count, total: 7,
    autoAllowed: options.autoAllowed ?? true,
    canStart: phase === 'idle' && (options.canStart ?? true),
    canAdvance: options.canAdvance ?? (phase === 'idle' || phase === 'paused'),
    canResume: options.canResume ?? phase === 'paused',
    canPause: phase === 'running',
    elapsedMs: options.elapsedMs ?? 0,
    providerCalls: 0, imageSent: false, downloadRequested: false, liveEvidence: false,
  };
  const actions = Object.fromEntries(
    ['play', 'pause', 'resume', 'advance', 'stop', 'clear', 'shotList'].map(name => [name, () => calls.push(name)]),
  );
  const panel = renderLocalSequencePanel(page.document, status, actions);
  page.host.append(panel);
  const byAction = action => page.host.querySelectorAll('button')
    .find(button => button.dataset.tourAction === `sequence-${action.toLowerCase()}`);
  return { ...page, calls, status, panel, byAction };
}

const controls = ['play', 'pause', 'resume', 'advance', 'stop', 'clear', 'shotList'];

test('seven actual edit stages, one native progress meter and an announced status', () => {
  const page = fixture();
  try {
    assert.equal(page.panel.getAttribute('aria-label'), 'Seven local illustration steps');
    assert.equal(page.panel.dataset.sequencePhase, 'idle');
    assert.equal(page.host.querySelectorAll('progress').length, 1);
    const meter = page.host.querySelector('progress');
    assert.equal(meter.max, 7);
    assert.equal(meter.value, 0);
    const rows = page.host.querySelectorAll('li');
    assert.equal(rows.length, 7);
    assert.deepEqual(rows.map(row => row.dataset.sequenceStep),
      LOCAL_EDIT_SEQUENCE.map(row => row.effect));
    assert.equal(rows[0].dataset.sequenceState, 'next');
    assert.ok(rows.slice(1).every(row => row.dataset.sequenceState === 'pending'));
    assert.ok(page.host.querySelectorAll('p').some(row => row.getAttribute('role') === 'status'));
    assert.match(page.host.textContent, /No live service runs/);
  } finally { page.close(); }
});

test('idle screen enables explicit play and one edit, never automatic consent', async () => {
  const page = fixture();
  try {
    assert.equal(page.byAction('play').disabled, false);
    assert.equal(page.byAction('advance').disabled, false);
    assert.equal(page.byAction('pause').disabled, true);
    assert.equal(page.byAction('resume').disabled, true);
    assert.equal(page.byAction('stop').disabled, true);
    assert.equal(page.byAction('shotList').disabled, true);
    assert.equal(page.byAction('clear').disabled, true);
    await page.byAction('play').click();
    assert.deepEqual(page.calls, ['play']);
    assert.match(page.host.textContent, /explicit click|your click/i);
  } finally { page.close(); }
});

test('an unavailable starting state disables play and manual one-edit', async () => {
  const page = fixture('idle', { canStart: false, canAdvance: false });
  try {
    assert.equal(page.byAction('play').disabled, true);
    assert.equal(page.byAction('advance').disabled, true);
    await page.byAction('play').click();
    await page.byAction('advance').click();
    assert.deepEqual(page.calls, []);
  } finally { page.close(); }
});

test('running stage has only pause and stop enabled', async () => {
  const page = fixture('running', { count: 2, elapsedMs: 10 });
  try {
    for (const key of controls) {
      assert.equal(page.byAction(key).disabled, !['pause', 'stop', 'clear'].includes(key), key);
    }
    const meter = page.host.querySelector('progress');
    assert.equal(meter.value, 2);
    const rows = page.host.querySelectorAll('li');
    assert.equal(rows[0].dataset.sequenceState, 'done');
    assert.equal(rows[1].dataset.sequenceState, 'done');
    assert.equal(rows[2].dataset.sequenceState, 'next');
    await page.byAction('pause').click();
    await page.byAction('stop').click();
    assert.deepEqual(page.calls, ['pause', 'stop']);
  } finally { page.close(); }
});

test('paused stage exposes explicit resume and one edit; no secret autoplay', async () => {
  const page = fixture('paused', { count: 1 });
  try {
    assert.equal(page.byAction('resume').disabled, false);
    assert.equal(page.byAction('advance').disabled, false);
    assert.equal(page.byAction('play').disabled, true);
    await page.byAction('advance').click();
    await page.byAction('resume').click();
    assert.deepEqual(page.calls, ['advance', 'resume']);
  } finally { page.close(); }
});

test('hidden document refusal is described without claiming an edit', () => {
  const page = fixture('paused', { reason: 'hidden', count: 1 });
  try {
    assert.match(page.host.textContent, /Page hidden/);
    assert.match(page.host.textContent, /Applied edits remain/);
    assert.doesNotMatch(page.host.textContent, /real-face gate passed/i);
  } finally { page.close(); }
});

test('reduced-motion selection offers one-step input but no autoplay promise', () => {
  const page = fixture('paused', {
    count: 3, reason: 'reduced-motion', autoAllowed: false, canResume: false,
  });
  try {
    assert.equal(page.byAction('advance').disabled, false);
    assert.equal(page.byAction('resume').disabled, true);
    assert.match(page.host.textContent, /Reduced-motion mode/);
    assert.match(page.host.textContent, /Automatic replay is disabled/);
  } finally { page.close(); }
});

test('complete stage displays all seven illustrated edits, not provider proof', () => {
  const page = fixture('complete', { count: 7, elapsedMs: 120 });
  try {
    const meter = page.host.querySelector('progress');
    assert.equal(meter.value, 7);
    assert.ok(page.host.querySelectorAll('li').every(row => row.dataset.sequenceState === 'done'));
    assert.equal(page.byAction('advance').disabled, true);
    assert.equal(page.byAction('resume').disabled, true);
    assert.equal(page.byAction('shotList').disabled, false);
    assert.match(page.host.textContent, /Stopped before provider or export/);
    assert.match(page.host.textContent, /Not a phone performance measurement/);
    assert.match(page.host.textContent, /real-face results or release acceptance/);
  } finally { page.close(); }
});

test('refused stage lists a fixed reason without exposing personal data', () => {
  const page = fixture('refused', { count: 2, reason: 'source-changed' });
  try {
    assert.equal(page.panel.dataset.sequencePhase, 'refused');
    assert.match(page.host.textContent, /source or selected subject changed/i);
    assert.equal(page.byAction('play').disabled, true);
    assert.equal(page.byAction('clear').disabled, false);
    assert.equal(page.byAction('stop').disabled, true);
    assert.equal(page.byAction('shotList').disabled, true);
    assert.doesNotMatch(page.host.textContent, /drawn-main|png:|data:image/);
  } finally { page.close(); }
});

test('only standard native named buttons and safe DOM text are emitted', () => {
  const page = fixture('running', { count: 4 });
  try {
    const all = page.host.querySelectorAll('button');
    assert.equal(all.length, controls.length);
    assert.ok(all.every(button => button.type === 'button'));
    assert.ok(all.every(button => button.textContent.trim().length > 0));
    assert.ok(all.every(button => button.getAttribute('onclick') === null));
    assert.equal(page.host.querySelectorAll('script').length, 0);
    assert.equal(page.host.querySelectorAll('a').length, 0);
    assert.equal(page.host.querySelectorAll('input').length, 0);
    assert.ok(page.host.querySelectorAll('p').some(row => row.getAttribute('aria-live') === 'polite'));
  } finally { page.close(); }
});

test('replay copy preserves explicit simulated-only and manual consent messaging', () => {
  const page = fixture('idle');
  try {
    assert.match(page.host.textContent, /personally opt in/);
    assert.match(page.host.textContent, /YouCam/);
    assert.match(page.host.textContent, /No live service runs/);
    assert.match(page.host.textContent, /not.*face detection/i);
    assert.match(page.host.textContent, /identity preservation/i);
  } finally { page.close(); }
});

test('the fixed status formatter never prints an externally supplied reason string', () => {
  const page = fixture('refused', { count: 0, reason: 'consent-required' });
  try {
    const copy = sequenceReadableStatus(page.status);
    assert.match(copy, /local, hair and face consent/);
    assert.doesNotMatch(copy, /apiKey|face_id|bearer|token/i);
  } finally { page.close(); }
});
