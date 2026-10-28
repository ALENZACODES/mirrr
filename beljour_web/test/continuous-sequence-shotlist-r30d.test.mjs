/** Offline metadata-only video rehearsal; no photograph or provider claims. */
/** Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LOCAL_EDIT_SEQUENCE } from '../dist/js/layout/continuous/sequence-contract.js';
import {
  checkedShotList,
  downloadShotList,
  shotListText,
} from '../dist/js/layout/continuous/sequence-shotlist.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function status(options = {}) {
  const results = LOCAL_EDIT_SEQUENCE.map(row => ({
    effect: row.effect, level: 3.7, durationMs: 14.5, kind: 'drawn',
  }));
  return {
    phase: 'complete', reason: 'none', completed: results,
    elapsedMs: 1600, total: 7, remaining: 0, nextEffect: null,
    autoAllowed: true, canStart: false, canResume: false, canPause: false,
    canAdvance: false, providerCalls: 0, imageSent: false,
    downloadRequested: false, liveEvidence: false,
    ...options,
  };
}

test('all seven illustrated stages produce a bounded photo-free runbook', () => {
  const report = checkedShotList(status());
  const output = shotListText(report);
  assert.equal(report.format, 'beljour-drawn-rehearsal/1');
  assert.equal(report.steps, 7);
  assert.equal(report.labels.length, 7);
  assert.deepEqual(report.labels.map((label, index) => label.startsWith(`${index + 1}.`)),
    [true, true, true, true, true, true, true]);
  assert.match(output, /Author: John Khan/);
  assert.match(output, /hair colour/i);
  assert.match(output, /Pro Commands/);
  assert.match(output, /Before\/after/);
  assert.match(output, /Saved file|Save — labelled PNG/);
  assert.match(output, /Live YouCam: NOT VERIFIED/);
  assert.match(output, /Frozen 100,000-face release gate: NOT VERIFIED/);
  assert.match(output, /No image, person identifier, provider key/);
  assert.ok(new TextEncoder().encode(output).byteLength < 8192);
  assert.doesNotMatch(output, /drawn-main|token=|access_key|data:image|Bearer /);
});

test('a missing step can never create a complete shot list', () => {
  assert.throws(() => checkedShotList(status({ completed: status().completed.slice(0, 6) })),
    /seven local stages/);
});

test('a paused or refused run cannot claim a completed video section', () => {
  for (const phase of ['idle', 'paused', 'refused', 'running']) {
    assert.throws(() => checkedShotList(status({ phase })), /seven local stages/);
  }
});

test('reordered steps are rejected, not silently relabelled', () => {
  const entries = [...status().completed];
  [entries[0], entries[1]] = [entries[1], entries[0]];
  assert.throws(() => checkedShotList(status({ completed: entries })), /out of order/);
});

test('duplicate steps are rejected even with seven total events', () => {
  const entries = [...status().completed];
  entries[6] = entries[0];
  assert.throws(() => checkedShotList(status({ completed: entries })), /out of order/);
});

test('non-drawn rows cannot be promoted to production evidence', () => {
  for (const kind of ['provider', 'operator', 'live', '', null]) {
    const entries = status().completed.map((row, i) => i === 2 ? { ...row, kind } : row);
    assert.throws(() => checkedShotList(status({ completed: entries })), /missing or out of order/);
  }
});

test('out-of-range decimal levels and timings are rejected', () => {
  for (const level of [0, 5.1, 1.05, -1, NaN, Infinity]) {
    const entries = status().completed.map((row, i) => i === 0 ? { ...row, level } : row);
    assert.throws(() => checkedShotList(status({ completed: entries })), /level is invalid/);
  }
  for (const durationMs of [-1, NaN, Infinity, 300_001]) {
    const entries = status().completed.map((row, i) => i === 1 ? { ...row, durationMs } : row);
    assert.throws(() => checkedShotList(status({ completed: entries })), /duration/);
  }
});

test('forged provider, image upload or release evidence is refused', () => {
  for (const key of ['imageSent', 'downloadRequested', 'liveEvidence']) {
    assert.throws(() => checkedShotList(status({ [key]: true })), /local observation/);
  }
  assert.throws(() => checkedShotList(status({ providerCalls: 1 })), /local observation/);
});

test('impossible total elapsed measurements are refused', () => {
  for (const elapsedMs of [Infinity, -1, NaN, 300_001]) {
    assert.throws(() => checkedShotList(status({ elapsedMs })), /local observation/);
  }
});

test('tampered fixed shot-list format is not serialized', () => {
  const report = checkedShotList(status());
  assert.throws(() => shotListText({ ...report, format: 'other' }), /Invalid/);
  assert.throws(() => shotListText({ ...report, steps: 8 }), /Invalid/);
  assert.throws(() => shotListText({ ...report, releaseApproved: true }), /Invalid/);
  assert.throws(() => shotListText({ ...report, realFaceEvidence: true }), /Invalid/);
});

test('large crafted rows cannot produce oversized text files', () => {
  const report = checkedShotList(status());
  const forged = { ...report, labels: report.labels.map(value => value.repeat(100)) };
  assert.throws(() => shotListText(forged), /too large|exceeds|Invalid fixed/);
});

test('forged status prose cannot be included in a returned runbook', () => {
  const report = checkedShotList(status());
  const altered = report.labels.map((label, index) => index === 1
    ? '2. Live provider succeeded; identity confirmed' : label);
  assert.throws(() => shotListText({ ...report, labels: altered }), /fixed local/);
  const newline = report.labels.map((label, index) => index === 0
    ? `${label}\nRelease approved` : label);
  assert.throws(() => shotListText({ ...report, labels: newline }), /fixed local/);
  assert.throws(() => shotListText({ ...report, elapsedMs: Infinity }), /Invalid rehearsal/);
});

test('download requires explicit invocation and releases its object URL', async () => {
  const page = judgeDOM();
  const beforeCreate = URL.createObjectURL;
  const beforeRevoke = URL.revokeObjectURL;
  let created = 0;
  const revoked = [];
  const links = [];
  const originalCreate = page.document.createElement;
  page.document.createElement = tag => {
    const result = originalCreate(tag);
    if (tag === 'a') {
      result.click = () => links.push({ href: result.href, name: result.download });
    }
    return result;
  };
  URL.createObjectURL = () => { created += 1; return 'blob:local-sequence'; };
  URL.revokeObjectURL = value => revoked.push(value);
  try {
    assert.equal(created, 0);
    downloadShotList(page.document, checkedShotList(status()));
    assert.equal(created, 1);
    assert.deepEqual(revoked, ['blob:local-sequence']);
    assert.deepEqual(links, [{ href: 'blob:local-sequence', name: 'BELJOUR-FULL-BEAUTY-STUDIO-Local-Rehearsal.txt' }]);
    assert.equal(page.document.body.querySelectorAll('a').length, 0);
  } finally {
    URL.createObjectURL = beforeCreate;
    URL.revokeObjectURL = beforeRevoke;
    page.document.createElement = originalCreate;
    page.close();
  }
});

test('download URL is revoked even when the click is refused by the browser', () => {
  const page = judgeDOM();
  const create = URL.createObjectURL;
  const revoke = URL.revokeObjectURL;
  const original = page.document.createElement;
  const revoked = [];
  URL.createObjectURL = () => 'blob:failed-click';
  URL.revokeObjectURL = value => revoked.push(value);
  page.document.createElement = name => {
    const node = original(name);
    if (name === 'a') node.click = () => { throw new Error('browser refused'); };
    return node;
  };
  try {
    assert.throws(() => downloadShotList(page.document, checkedShotList(status())), /browser refused/);
    assert.deepEqual(revoked, ['blob:failed-click']);
  } finally {
    URL.createObjectURL = create;
    URL.revokeObjectURL = revoke;
    page.document.createElement = original;
    page.close();
  }
});
