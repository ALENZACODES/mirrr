import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ReleaseSession } from '../dist/js/layout/release/state.js';
import { commandReadiness } from '../dist/js/layout/release/commands.js';
import { evaluateReleaseReadiness } from '../dist/js/layout/release/readiness.js';
import { safeReleaseReport, serializeReleaseReport } from '../dist/js/layout/release/report.js';
import { inspectReleaseFile, inspectReleaseText } from '../dist/js/layout/release/import-review.js';
import { mountReleaseWorkspace } from '../dist/js/layout/release/mount.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function validText() {
  const state = new ReleaseSession(() => 500);
  state.start();
  state.open('upload');
  state.review('upload');
  const snapshot = state.snapshot;
  const commands = commandReadiness(null);
  const readiness = evaluateReleaseReadiness(snapshot, commands, null, null);
  return serializeReleaseReport(safeReleaseReport(snapshot, readiness, commands, null, null));
}

test('re-importing a generated rehearsal report never verifies production', () => {
  const reviewed = inspectReleaseText(validText());
  assert.equal(reviewed.status, 'schema-valid');
  assert.equal(reviewed.rows, 16);
  assert.equal(reviewed.reviewed, 1);
  assert.equal(reviewed.productionReady, false);
  assert.equal(reviewed.independentAccepted, false);
  assert.match(reviewed.note, /self-reported/);
});

test('malformed JSON, extra raw face input and invalid schema all fail closed', () => {
  for (const text of [
    '{', '{}', '[]', 'null', JSON.stringify({ face: 'private', passed: true }),
    JSON.stringify({ ...JSON.parse(validText()), productionReady: true }),
    JSON.stringify({ ...JSON.parse(validText()), uploaded: true }),
    JSON.stringify({ ...JSON.parse(validText()), userNotes: 'untrusted' }),
  ]) {
    const result = inspectReleaseText(text);
    assert.equal(result.status, 'invalid');
    assert.equal(result.productionReady, false);
    assert.equal(result.independentAccepted, false);
    assert.doesNotMatch(result.note, /private|untrusted/);
  }
});

test('large metadata input is rejected before JSON parsing', () => {
  const result = inspectReleaseText('a'.repeat(33_000));
  assert.equal(result.status, 'too-large');
  assert.equal(result.rows, 0);
});

test('large binary or image file is refused without invoking .text', async () => {
  let reads = 0;
  for (const file of [
    { size: 100_000, type: 'application/json', text: async () => { reads++; return '{}'; } },
    { size: 10, type: 'image/png', text: async () => { reads++; return '{}'; } },
    { size: -1, type: 'application/json', text: async () => { reads++; return '{}'; } },
  ]) {
    const result = await inspectReleaseFile(file, () => 0, 0);
    assert.notEqual(result.status, 'schema-valid');
    assert.equal(result.productionReady, false);
  }
  assert.equal(reads, 0);
});

test('only one bounded file text read occurs for an accepted JSON file', async () => {
  let reads = 0;
  const text = validText();
  const file = { size: text.length, type: 'application/json', text: async () => { reads++; return text; } };
  const result = await inspectReleaseFile(file, () => 9, 9);
  assert.equal(reads, 1);
  assert.equal(result.status, 'schema-valid');
});

test('revision change while reading a local file invalidates the stale result', async () => {
  let finish;
  let revision = 2;
  const text = validText();
  const file = { size: text.length, type: 'application/json',
    text: () => new Promise(resolve => { finish = resolve; }) };
  const promise = inspectReleaseFile(file, () => revision, 2);
  revision = 3;
  finish(text);
  const result = await promise;
  assert.equal(result.status, 'stale');
  assert.equal(result.reviewed, 0);
});

test('a thrown file read is classified unavailable, not as a positive result', async () => {
  const file = { size: 3, type: 'application/json', text: async () => { throw Error('permission denied'); } };
  const result = await inspectReleaseFile(file, () => 1, 1);
  assert.equal(result.status, 'unavailable');
  assert.doesNotMatch(result.note, /permission denied/);
});

test('empty file selection does not access any browser files', async () => {
  const result = await inspectReleaseFile(null, () => 1, 1);
  assert.equal(result.status, 'unavailable');
  assert.equal(result.independentAccepted, false);
});

test('local report input is accept-limited, keyboard-accessible and not a form upload', () => {
  const page = judgeDOM();
  const mode = mountReleaseWorkspace(page.document, page.host, () => {}, {
    device: { secureContext: true, online: true, reducedMotion: false,
      canvasAvailable: true, encodingAvailable: true, pixelRatio: 1, screenWidth: 390 },
  });
  try {
    const input = page.host.querySelectorAll('input').find(row => row.dataset.releaseImport === 'report');
    assert.ok(input);
    assert.equal(input.type, 'file');
    assert.equal(input.accept, 'application/json,.json');
    assert.match(input.getAttribute('aria-label'), /release rehearsal JSON/);
    assert.equal(page.host.querySelectorAll('form').length, 0);
  } finally {
    mode.dispose();
    page.close();
  }
});

test('an inspected file only updates fixed local status text', async () => {
  const page = judgeDOM();
  const mode = mountReleaseWorkspace(page.document, page.host, () => {}, {
    device: { secureContext: true, online: true, reducedMotion: false,
      canvasAvailable: true, encodingAvailable: true, pixelRatio: 1, screenWidth: 390 },
  });
  const oldFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = () => { requests++; throw Error('No external request'); };
  try {
    const text = validText();
    const input = page.host.querySelectorAll('input').find(row => row.dataset.releaseImport === 'report');
    input.files = [{ size: text.length, type: 'application/json', text: async () => text }];
    await input.dispatch('change');
    await new Promise(resolve => setImmediate(resolve));
    assert.match(page.host.textContent, /format is valid/);
    assert.equal(mode.state.snapshot.productionReady, false);
    assert.equal(requests, 0);
  } finally {
    if (oldFetch === undefined) delete globalThis.fetch;
    else globalThis.fetch = oldFetch;
    mode.dispose();
    page.close();
  }
});
