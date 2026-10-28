// Lane D r22d: route, step counter, keyboard focus and full local walkthrough DOM.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { mountJudgeMode } from '../dist/js/layout/judge-mode.js';
import { mountJudgeEntry } from '../dist/js/layout/judge-entry.js';
import { control, fakeBrowser, judgeDOM } from './judge-fixtures-r22d.mjs';

function judgePage() {
  const app = judgeDOM();
  app.host.id = 'lg-judge-root';
  const launch = app.document.createElement('a');
  launch.id = 'lg-judge-launch';
  launch.href = '#judge';
  app.root.append(launch);
  return { ...app, launch };
}

async function press(host, name) {
  const button = control(host, name);
  assert.ok(button, `missing button ${name}`);
  assert.equal(button.disabled, false, `disabled button ${name}`);
  await button.click();
}

async function permit(host, name) {
  const input = control(host, 'consent-' + name);
  assert.ok(input, `missing consent ${name}`);
  assert.equal(input.disabled, false);
  input.checked = true;
  await input.dispatch('change');
}

test('home has one genuine Judge Mode entry and a dedicated hidden mount', () => {
  const html = readFileSync(new URL('../home.html', import.meta.url), 'utf8');
  assert.match(html, /id="lg-judge-root"[^>]*hidden/);
  assert.match(html, /id="lg-judge-launch"[^>]*href="#judge"/);
  assert.match(html, /No real sample faces and no live API calls/);
  assert.equal((html.match(/id="lg-judge-root"/g) ?? []).length, 1);
  assert.doesNotMatch(html, /<script[^>]*judge.*\.js/);
});

test('non-judge home never mounts any guide or changes body styling', () => {
  const a = judgePage();
  try {
    const win = fakeBrowser('#looks');
    const entry = mountJudgeEntry(a.document, win);
    assert.equal(entry.active(), false);
    assert.equal(a.root.dataset.judgeActive, undefined);
    assert.equal(a.host.children.length, 0);
    entry.destroy();
    assert.equal(win.count('hashchange'), 0);
  } finally { a.close(); }
});

test('Judge Mode opens only on its exact hash, closes on route change', () => {
  const a = judgePage();
  try {
    const win = fakeBrowser('#judge');
    const entry = mountJudgeEntry(a.document, win);
    assert.equal(entry.active(), true);
    assert.equal(a.root.dataset.judgeActive, 'true');
    assert.equal(a.host.hidden, false);
    assert.match(a.host.textContent, /Step 1 of 8/);
    win.location.hash = '#look-other';
    win.fire('hashchange');
    assert.equal(entry.active(), false);
    assert.equal(a.host.hidden, true);
    assert.equal(a.host.children.length, 0);
    assert.equal(a.root.dataset.judgeActive, undefined);
    entry.destroy();
  } finally { a.close(); }
});

test('pagehide clears active image and BFCache pageshow can remount', async () => {
  const a = judgePage();
  try {
    const win = fakeBrowser('#judge');
    const entry = mountJudgeEntry(a.document, win);
    await press(a.host, 'sample');
    assert.match(a.host.textContent, /Drawn sample selected/);
    win.fire('pagehide');
    assert.equal(a.host.children.length, 0);
    assert.equal(entry.active(), false);
    win.fire('pageshow', { persisted: true });
    assert.equal(entry.active(), true);
    assert.match(a.host.textContent, /Step 1 of 8/);
    assert.doesNotMatch(a.host.textContent, /Drawn sample selected/);
    entry.destroy();
  } finally { a.close(); }
});

test('Exit always removes private state, restores page and returns keyboard focus', async () => {
  const a = judgePage();
  try {
    const win = fakeBrowser('#judge');
    const entry = mountJudgeEntry(a.document, win);
    await press(a.host, 'sample');
    await press(a.host, 'exit');
    assert.equal(win.location.hash, '#home');
    assert.equal(entry.active(), false);
    assert.equal(a.host.hidden, true);
    assert.equal(a.launch.focused, true);
    entry.destroy();
  } finally { a.close(); }
});

test('continue guard reports a safe message without advancing or erasing a photo', async () => {
  const a = judgePage();
  try {
    const mode = mountJudgeMode(a.document, a.host, () => {});
    await press(a.host, 'next');
    assert.equal(mode.session.snapshot.step, 'source');
    assert.match(a.host.textContent, /Choose the drawn sample/);
    assert.equal(control(a.host, 'next').focused, true);
    mode.dispose();
  } finally { a.close(); }
});

test('Skip never implies consent and still allows a judge to see later screens', async () => {
  const a = judgePage();
  try {
    const mode = mountJudgeMode(a.document, a.host, () => {});
    for (let i = 0; i < 6; i++) await press(a.host, 'skip');
    assert.equal(mode.session.snapshot.step, 'export');
    assert.equal(mode.session.snapshot.source, null);
    assert.equal(control(a.host, 'export-save').disabled, true);
    assert.match(a.host.textContent, /Choose an image on step 1/);
    assert.equal(mode.session.snapshot.permissions.mock, false);
    mode.dispose();
  } finally { a.close(); }
});

test('complete happy path: sample, separate consent, hair, face, mock, compare, export, plans', async () => {
  const a = judgePage();
  try {
    let exits = 0;
    const mode = mountJudgeMode(a.document, a.host, () => exits++);
    await press(a.host, 'sample');
    await press(a.host, 'next');
    await permit(a.host, 'local');
    await permit(a.host, 'hair');
    await permit(a.host, 'face');
    await permit(a.host, 'mock');
    assert.deepEqual(mode.session.snapshot.permissions, { local: true, hair: true, face: true, mock: true });
    await press(a.host, 'next');
    await press(a.host, 'hair-chestnut');
    await press(a.host, 'next');
    await press(a.host, 'face-warm');
    await press(a.host, 'next');
    await press(a.host, 'mock-tryon');
    assert.equal(mode.session.snapshot.mock, true);
    await press(a.host, 'next');
    assert.ok(a.host.querySelector('input'));
    assert.match(a.host.textContent, /Before and after/);
    await press(a.host, 'next');
    assert.match(a.host.textContent, /Permanent simulation label/);
    await press(a.host, 'next');
    assert.match(a.host.textContent, /3-day free trial/);
    assert.match(a.host.textContent, /Step 8 of 8/);
    assert.equal(mode.session.progress().percent, 100);
    await press(a.host, 'finish-footer');
    assert.equal(exits, 1);
    assert.equal(mode.image.hasImage, false);
    assert.equal(mode.session.snapshot.source, null);
  } finally { a.close(); }
});

test('visible step counter, skip and exit appear at every guided step', async () => {
  const a = judgePage();
  try {
    const mode = mountJudgeMode(a.document, a.host, () => {});
    for (let i = 1; i <= 7; i++) {
      assert.match(a.host.textContent, new RegExp('Step ' + i + ' of 8'));
      assert.ok(control(a.host, 'exit'));
      assert.ok(control(a.host, 'skip'));
      await press(a.host, 'skip');
    }
    assert.equal(mode.session.snapshot.step, 'plans');
    assert.ok(control(a.host, 'exit'));
    assert.equal(control(a.host, 'skip'), undefined);
    mode.dispose();
  } finally { a.close(); }
});

test('Judge Mode does not import the provider adapter or make direct network calls', () => {
  for (const name of ['judge-mode.ts', 'judge-entry.ts', 'judge-session.ts']) {
    const code = readFileSync(new URL('../src/layout/' + name, import.meta.url), 'utf8');
    assert.doesNotMatch(code, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
    assert.doesNotMatch(code, /providers\/|from ["'][^"']*api\.js/);
  }
});

test('new client modules are registered in exactly one Lane D r22d block', () => {
  const registry = readFileSync(new URL('../../api/plumb_api/arena/lane_registry/d.py', import.meta.url), 'utf8');
  // Integration rebases retain one D-owned block with a checkpoint suffix.
  const markers = ['# --- Lane D r22d:', '# --- Lane D r22d-cp2:'];
  const matched = markers.filter(marker => registry.includes(marker));
  assert.equal(matched.length, 1);
  const added = registry.split(matched[0]);
  assert.equal(added.length, 2);
  const ownerBlock = added[1];
  assert.match(ownerBlock, /LANE_D_R22D_MODULES/);
  assert.match(ownerBlock, /lane_d_r22d_ownership/);
  for (const name of ['judge-mode.ts', 'judge-entry.ts', 'judge-image.ts', 'judge-export.ts', 'judge-paywall.ts']) {
    assert.match(ownerBlock, new RegExp(name.replace('.', '\\.')));
  }
});
