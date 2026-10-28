/** Proof Wall is an opt-in, photo-free local export. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderProofExperience } from '../dist/js/layout/editorial/proof-experience.js';
import { sequencePage } from './helpers/continuous-sequence-page.mjs';

const empty = {
  drawnLoaded: false, subjectChosen: false, localPermission: false,
  editCount: 0, requestedDownload: false, mockTryon: false, cacheFrames: 0,
};

function experience(page, data = empty) {
  const panel = renderProofExperience(page.document, data);
  page.host.append(panel);
  return panel;
}

test('the final Proof Wall has an explicit download action', () => {
  const page = sequencePage();
  try {
    const panel = experience(page);
    const button = panel.querySelector('button');
    assert.equal(button.type, 'button');
    assert.equal(button.dataset.editorialAction, 'proof-export');
    assert.equal(panel.querySelectorAll('table').length, 1);
    assert.match(page.host.textContent, /Export local Proof Wall graphic/);
    assert.match(page.host.textContent, /Generated locally/);
    assert.equal(page.downloads, 0);
  } finally { page.cleanup(); }
});

test('a deliberate click requests only a local SVG and cleans the temporary URL', async () => {
  const page = sequencePage();
  try {
    const panel = experience(page);
    await panel.querySelector('button').click();
    assert.equal(page.downloads, 1);
    assert.equal(page.network.length, 0);
    assert.match(page.host.textContent, /Graphic download requested/);
    assert.match(page.host.textContent, /Saved file is not confirmed/);
    assert.equal(panel.querySelectorAll('a').length, 0);
  } finally { page.cleanup(); }
});

test('invalid client evidence is refused before the export panel can be created', () => {
  const page = sequencePage();
  try {
    assert.throws(() => experience(page, { ...empty, editCount: 50 }),
      /invalid client observations/);
    assert.equal(page.downloads, 0);
    assert.equal(page.network.length, 0);
  } finally { page.cleanup(); }
});

test('all final controls preserve keyboard access and live status semantics', () => {
  const page = sequencePage();
  try {
    const panel = experience(page);
    assert.equal(panel.getAttribute('aria-label'), 'Local Proof Wall review and image handoff');
    assert.equal(panel.querySelector('button').type, 'button');
    assert.equal(panel.querySelector('[role="status"]').getAttribute('aria-live'), 'polite');
    assert.equal(panel.querySelectorAll('input').length, 0);
    assert.equal(panel.querySelectorAll('img').length, 0);
  } finally { page.cleanup(); }
});
