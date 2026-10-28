/** Own-brand framed portrait on the continuous demo. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  coverAudit,
  createEditorialCover,
  validateCoverReading,
} from '../dist/js/layout/editorial/cover.js';
import { sequencePage } from './helpers/continuous-sequence-page.mjs';

const drawing = {
  origin: 'drawn', subject: 'main', step: 'subject', position: 3, total: 16,
};

function pageFor(reading = drawing, withCanvas = true) {
  const page = sequencePage();
  const canvas = withCanvas ? page.document.createElement('canvas') : null;
  const cover = createEditorialCover(page.document, canvas, reading);
  page.host.append(cover);
  return { ...page, cover, canvas };
}

test('cover carries an original wordmark and no other publication identity', () => {
  const page = pageFor();
  try {
    assert.match(page.host.textContent, /BELJOUR/);
    assert.match(page.host.textContent, /FULL BEAUTY STUDIO/);
    assert.match(page.host.textContent, /Your best day\. Still you\./);
    assert.match(page.host.textContent, /Atelier \/ Drawn studies/);
    assert.match(page.host.textContent, /Primary drawing/);
    assert.match(page.host.textContent, /3 \/ 16/);
    assert.match(page.host.textContent, /Local illustration · No provider result/);
    assert.equal(page.cover.querySelectorAll('canvas').length, 1);
    assert.equal(page.cover.querySelectorAll('svg').length, 0);
  } finally { page.cleanup(); }
});

test('cover reuses the existing canvas without cloning or persisting it', () => {
  const page = pageFor();
  try {
    assert.equal(page.cover.querySelector('canvas'), page.canvas);
    assert.equal(page.canvas.getAttribute('aria-label'),
      'Original drawn figures with simulated local edits');
    assert.equal(page.cover.getAttribute('aria-label'), 'BELJOUR — FULL BEAUTY STUDIO. Your best day. Still you. Illustrated portrait presentation');
    assert.equal(page.cover.dataset.editorialStage, 'page');
    assert.equal(page.cover.dataset.coverOrigin, 'drawn');
  } finally { page.cleanup(); }
});

test('unknown drawing is represented only by a clearly labelled vector', () => {
  const page = pageFor({ origin: 'unavailable', subject: 'none', step: 'source', position: 1, total: 16 }, false);
  try {
    assert.equal(page.cover.querySelectorAll('canvas').length, 0);
    assert.equal(page.cover.querySelectorAll('svg').length, 1);
    assert.match(page.host.textContent, /Drawing unavailable/);
    assert.match(page.host.textContent, /Local illustration/);
  } finally { page.cleanup(); }
});

test('second drawn subject receives an explicit distinct caption', () => {
  const page = pageFor({ ...drawing, subject: 'second', step: 'compare', position: 15 });
  try {
    assert.match(page.host.textContent, /Second drawing/);
    assert.doesNotMatch(page.host.textContent, /Primary drawing/);
    assert.match(page.host.textContent, /compare/);
  } finally { page.cleanup(); }
});

test('audit cannot assert live provider verification', () => {
  assert.deepEqual(coverAudit(drawing), {
    format: 'beljour-editorial-cover/1',
    source: 'drawn', subjectChosen: true, liveProviderVerified: false,
  });
});

for (const changed of [
  { origin: 'provider' }, { subject: 'unknown' }, { position: 0 },
  { position: 17 }, { total: 100 }, { step: '<script>' },
  { origin: 'unavailable' }, { extra: true },
]) {
  test(`cover reading rejects ${JSON.stringify(changed)}`, () => {
    assert.throws(() => validateCoverReading({ ...drawing, ...changed }));
  });
}
