/** Real local renderer requires verified bystander isolation before caching. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDrawnFrameRenderer } from '../dist/js/layout/continuous/frame-render.js';
import { DrawnFrameController } from '../dist/js/layout/continuous/frame-controller.js';
import { ContinuousDemoState } from '../dist/js/layout/continuous/state.js';
import { JudgeImage } from '../dist/js/ui/shell/judge-image.js';
import { sequencePage } from './helpers/continuous-sequence-page.mjs';

function scene(page) {
  const figure = new JudgeImage(page.document);
  figure.samplePair();
  const subjects = figure.subjects.snapshot;
  const state = new ContinuousDemoState();
  state.chooseDrawnSource(subjects.revision, subjects.boxes.length, subjects.selectedId);
  for (const permission of ['local', 'hair', 'face', 'mock']) {
    state.setPermission(permission, true);
  }
  const current = () => ({
    state: state.snapshot,
    subjects: figure.subjects.snapshot,
    original: figure.original,
  });
  return { figure, state, current };
}

test('renderer refuses a source revision mismatch before any frame capture', async () => {
  const page = sequencePage();
  try {
    const { figure, state, current } = scene(page);
    const render = createDrawnFrameRenderer(page.document, current);
    const invalid = { ...state.snapshot, sourceRevision: state.snapshot.sourceRevision + 1 };
    await assert.rejects(() => render('hair', invalid), /source changed/);
    assert.equal(page.network.length, 0);
    figure.dispose();
    state.dispose();
  } finally { page.cleanup(); }
});

test('renderer refuses a different subject rather than substitute a cached figure', async () => {
  const page = sequencePage();
  try {
    const { figure, state, current } = scene(page);
    const render = createDrawnFrameRenderer(page.document, current);
    const invalid = { ...state.snapshot, selectedId: 'drawn-second' };
    await assert.rejects(() => render('makeup', invalid), /source changed/);
    assert.equal(page.network.length, 0);
    figure.dispose();
    state.dispose();
  } finally { page.cleanup(); }
});

test('incomplete mock Canvas isolation is a refusal, never an accepted cached image', async () => {
  const page = sequencePage();
  try {
    const { figure, state, current } = scene(page);
    const render = createDrawnFrameRenderer(page.document, current);
    const cache = new DrawnFrameController({
      current: () => ({ state: state.snapshot, drawn: true }),
      capture: render,
    });
    const observed = await cache.prepare();
    assert.equal(observed.phase, 'refused');
    assert.equal(observed.available, 0);
    assert.equal(observed.liveVerified, false);
    assert.equal(page.network.length, 0);
    cache.dispose();
    figure.dispose();
    state.dispose();
  } finally { page.cleanup(); }
});

test('no user photo or provider URL can be reconstructed from a refused frame', async () => {
  const page = sequencePage();
  try {
    const { figure, state, current } = scene(page);
    const render = createDrawnFrameRenderer(page.document, current);
    await assert.rejects(() => render('skin', state.snapshot));
    assert.equal(page.network.length, 0);
    assert.equal(figure.subjects.snapshot.source, 'drawn');
    figure.dispose();
    state.dispose();
  } finally { page.cleanup(); }
});
