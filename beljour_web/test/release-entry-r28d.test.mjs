import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountJudgeEntry } from '../dist/js/layout/judge-entry.js';
import { judgeDOM, fakeBrowser } from './judge-fixtures-r22d.mjs';

function fixture(hash) {
  const page = judgeDOM();
  page.host.id = 'lg-judge-root';
  const browser = fakeBrowser(hash);
  const launch = page.document.createElement('a');
  launch.id = 'lg-judge-launch';
  const verify = page.document.createElement('a');
  verify.id = 'lg-verify-launch';
  page.root.append(launch, verify);
  const entry = mountJudgeEntry(page.document, browser);
  return { ...page, entry, browser, launch, verify, close() { entry.destroy(); page.close(); } };
}

test('optional release-check hash mounts the real review without uploading a photo', () => {
  const page = fixture('#judge-verify');
  try {
    assert.equal(page.entry.active(), true);
    assert.equal(page.host.hidden, false);
    assert.equal(page.document.body.dataset.judgeActive, 'true');
    assert.match(page.host.textContent, /Release readiness and real-demo handoff/);
    assert.match(page.host.textContent, /No production-release verdict/);
  } finally { page.close(); }
});

test('unrelated hashes do not activate or retain Judge Mode', () => {
  const page = fixture('#looks');
  try {
    assert.equal(page.entry.active(), false);
    assert.equal(page.host.hidden, true);
    assert.equal(page.document.body.dataset.judgeActive, undefined);
  } finally { page.close(); }
});

test('changing routes destroys the stale release review before opening Judge Mode', () => {
  const page = fixture('#judge-verify');
  try {
    page.browser.location.hash = '#judge';
    page.browser.fire('hashchange');
    assert.equal(page.entry.active(), true);
    assert.doesNotMatch(page.host.textContent, /Release readiness and real-demo handoff/);
    page.browser.location.hash = '#home';
    page.browser.fire('hashchange');
    assert.equal(page.entry.active(), false);
    assert.equal(page.host.textContent, '');
  } finally { page.close(); }
});

test('same hash does not remount or erase an operator observation', async () => {
  const page = fixture('#judge-verify');
  try {
    const start = page.host.querySelectorAll('button').find(b => b.dataset.releaseAction === 'start');
    await start.click();
    assert.match(page.host.textContent, /Session running/);
    page.browser.fire('hashchange');
    assert.match(page.host.textContent, /Session running/);
  } finally { page.close(); }
});

test('pagehide clears sensitive operator state and BFCache pageshow reconstructs safely', async () => {
  const page = fixture('#judge-verify');
  try {
    const start = page.host.querySelectorAll('button').find(b => b.dataset.releaseAction === 'start');
    await start.click();
    page.browser.fire('pagehide');
    assert.equal(page.entry.active(), false);
    page.browser.fire('pageshow', { persisted: true });
    assert.equal(page.entry.active(), true);
    assert.match(page.host.textContent, /Session not-started/);
  } finally { page.close(); }
});

test('exit returns to Home and restores focus to the release-launch anchor', async () => {
  const page = fixture('#judge-verify');
  try {
    const exit = page.host.querySelectorAll('button').find(b => b.dataset.releaseAction === 'exit');
    await exit.click();
    assert.equal(page.browser.location.hash, '#home');
    assert.equal(page.entry.active(), false);
    assert.equal(page.verify.focused, true);
    assert.equal(page.document.body.dataset.judgeActive, undefined);
  } finally { page.close(); }
});

test('destroy removes listeners and prevents stale Hash routes from reopening', () => {
  const page = fixture('#judge-verify');
  try {
    assert.equal(page.browser.count('hashchange'), 1);
    page.entry.destroy();
    assert.equal(page.browser.count('hashchange'), 0);
    assert.equal(page.browser.count('pagehide'), 0);
    page.browser.location.hash = '#judge-verify';
    page.browser.fire('hashchange');
    assert.equal(page.entry.active(), false);
  } finally { page.close(); }
});
