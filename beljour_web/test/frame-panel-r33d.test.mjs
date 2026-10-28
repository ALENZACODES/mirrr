/** Accessible offline frame gallery rendering. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderContinuousFramePanel } from '../dist/js/ui/shell/continuous-frame-panel.js';
import { sequencePage } from './helpers/continuous-sequence-page.mjs';
import { pixels } from './helpers/local-frame-fixture.mjs';

const summary = {
  phase: 'ready', available: 3, bytes: 384000, hits: 4,
  misses: 0, selected: 'hair', networkCalls: 0, unitsSpent: 0, liveVerified: false,
};

function panel(page, overrides = {}, selected = pixels(), actions = {}) {
  const calls = [];
  const commands = {
    prepare() { calls.push('prepare'); },
    choose(id) { calls.push(`choose-${id}`); },
    clear() { calls.push('clear'); },
    report() { calls.push('report'); },
    ...actions,
  };
  const result = renderContinuousFramePanel(page.document, { ...summary, ...overrides }, selected, commands);
  page.host.replaceChildren(result);
  return { result, calls };
}

function command(page, action) {
  return page.host.querySelectorAll('button').find(button => button.dataset.cacheAction === action);
}

test('the panel is labelled and includes explicit local-only provenance', () => {
  const page = sequencePage();
  try {
    const { result } = panel(page);
    assert.equal(result.getAttribute('aria-label'), 'Cached local illustrations');
    assert.match(page.host.textContent, /not saved YouCam results/i);
    assert.match(page.host.textContent, /Provider calls: 0/);
    assert.doesNotMatch(page.host.textContent, /verified on real faces/i);
  } finally { page.cleanup(); }
});

test('all controls are native and keyboard-focusable buttons', () => {
  const page = sequencePage();
  try {
    panel(page);
    for (const button of page.host.querySelectorAll('button')) {
      assert.equal(button.type, 'button');
      assert.ok(button.dataset.cacheAction);
    }
  } finally { page.cleanup(); }
});

test('three visual families have accessible pressed-state buttons', () => {
  const page = sequencePage();
  try {
    panel(page);
    for (const id of ['hair', 'makeup', 'skin']) {
      const button = command(page, `select-${id}`);
      assert.ok(button);
      assert.equal(button.getAttribute('aria-pressed'), String(id === 'hair'));
    }
  } finally { page.cleanup(); }
});

test('selected raster uses a Canvas, not a persistent data URL or external img', () => {
  const page = sequencePage();
  try {
    const input = pixels();
    panel(page, {}, input);
    assert.equal(page.host.querySelectorAll('canvas').length, 1);
    assert.equal(page.host.querySelectorAll('img').length, 0);
    assert.equal(page.host.querySelectorAll('canvas')[0].getAttribute('aria-label'),
      'hair local illustrated thumbnail, not YouCam output');
    assert.equal(input.rgba[0], 0);
  } finally { page.cleanup(); }
});

for (const action of ['prepare', 'select-hair', 'select-makeup', 'select-skin', 'clear', 'report']) {
  test(`${action} is wired to a concrete action`, async () => {
    const page = sequencePage();
    try {
      const { calls } = panel(page);
      await command(page, action).click();
      assert.deepEqual(calls, [action.replace('select-', 'choose-')]);
    } finally { page.cleanup(); }
  });
}

test('empty cache does not expose selection or pretend a visual is available', () => {
  const page = sequencePage();
  try {
    panel(page, { phase: 'empty', available: 0, selected: null }, null);
    assert.equal(command(page, 'report'), undefined);
    assert.equal(command(page, 'select-hair'), undefined);
    assert.equal(command(page, 'clear').disabled, true);
    assert.equal(page.host.querySelectorAll('canvas').length, 0);
  } finally { page.cleanup(); }
});

test('warming cache disables duplicate prepare and allows cancellation', () => {
  const page = sequencePage();
  try {
    panel(page, { phase: 'warming', available: 1 }, null);
    assert.equal(command(page, 'prepare').disabled, true);
    assert.equal(command(page, 'clear').disabled, false);
    assert.match(page.host.textContent, /No network calls/);
  } finally { page.cleanup(); }
});

test('refusal and stale state display usable recovery copy', () => {
  for (const phase of ['refused', 'stale']) {
    const page = sequencePage();
    try {
      panel(page, { phase, available: 0, selected: null }, null);
      assert.match(page.host.textContent, /consent|discarded/i);
      assert.equal(command(page, 'prepare').disabled, false);
    } finally { page.cleanup(); }
  }
});

test('empty preview never receives hidden image bytes in HTML text', () => {
  const page = sequencePage();
  try {
    const chosen = pixels('skin', 217);
    panel(page, { selected: 'skin' }, chosen);
    assert.equal(page.host.querySelectorAll('canvas').length, 1);
    assert.doesNotMatch(page.host.textContent, /data:image\/|sha256|base64/i);
    assert.equal(page.network.length, 0);
  } finally { page.cleanup(); }
});
