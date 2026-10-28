// Lane D r22d-cp3: report actual browser capabilities without device certification.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  judgeDeviceAudit,
  judgeDeviceSummaryText,
  judgeMotionPreference,
  safeJudgeViewportWidth,
} from '../dist/js/mobile/judge-device-audit.js';
import { renderJudgeDevicePanel } from '../dist/js/ui/shell/judge-device-panel.js';
import { reportPage } from './judge-fixtures-cp3-r22d.mjs';

function browser(options = {}) {
  return {
    innerWidth: 390,
    createImageBitmap: () => {},
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} },
    matchMedia: () => ({ matches: false }),
    ...options,
  };
}

test('mobile viewport width is measured but never advertised as layout certification', () => {
  const page = reportPage();
  try {
    const result = judgeDeviceAudit(page.document, browser());
    assert.equal(result.viewportWidth, 390);
    assert.equal(result.allVerified, false);
    assert.match(result.rows.find(row => row.id === 'viewport').detail, /not a responsive-layout certification/);
  } finally { page.teardown(); }
});

test('no API presence is treated as fully verified or as a successful download', () => {
  const page = reportPage();
  try {
    const result = judgeDeviceAudit(page.document, browser());
    assert.equal(result.allVerified, false);
    assert.match(result.disclaimer, /need device testing/);
    assert.match(result.rows.find(row => row.id === 'local-export').detail, /still be checked/);
  } finally { page.teardown(); }
});

test('when canvas is not available it is reported as unavailable', () => {
  const doc = { createElement: tag => ({
    type: tag === 'input' ? 'file' : undefined,
    getContext: () => null,
  }) };
  const result = judgeDeviceAudit(doc, browser());
  assert.equal(result.rows.find(row => row.id === 'canvas').result, 'unavailable');
});

test('a throwing canvas context is unknown rather than a falsely ready feature', () => {
  const doc = { createElement: () => ({ getContext() { throw new Error('blocked'); } }) };
  const result = judgeDeviceAudit(doc, browser());
  assert.equal(result.rows.find(row => row.id === 'canvas').result, 'unknown');
});

test('bitmap decode requires function availability, not just a truthy object', () => {
  const page = reportPage();
  try {
    const unavailable = judgeDeviceAudit(page.document, browser({ createImageBitmap: 'yes' }));
    assert.equal(unavailable.rows.find(row => row.id === 'bitmap-decode').result, 'unavailable');
    const unknown = judgeDeviceAudit(page.document, browser({ createImageBitmap: undefined }));
    assert.equal(unknown.rows.find(row => row.id === 'bitmap-decode').result, 'unknown');
  } finally { page.teardown(); }
});

test('object URL creation and revocation are required together', () => {
  const page = reportPage();
  try {
    const probe = judgeDeviceAudit(page.document, browser({ URL: { createObjectURL() {} } }));
    assert.equal(probe.rows.find(row => row.id === 'local-export').result, 'unavailable');
  } finally { page.teardown(); }
});

test('width below 320 is flagged for manual responsive testing', () => {
  const page = reportPage();
  try {
    const result = judgeDeviceAudit(page.document, browser({ innerWidth: 290 }));
    assert.equal(result.rows.find(row => row.id === 'viewport').result, 'unavailable');
    assert.equal(result.allVerified, false);
  } finally { page.teardown(); }
});

test('unknown width and nonfinite width do not create fake measurements', () => {
  for (const width of [null, undefined, 'mobile', 0, -20, Infinity, NaN]) {
    assert.equal(safeJudgeViewportWidth(width), null);
  }
  assert.equal(safeJudgeViewportWidth(360.51), 361);
  assert.equal(safeJudgeViewportWidth(1000000), 100000);
});

test('reduced motion hint is independent of whether the local demo is ready', () => {
  assert.equal(judgeMotionPreference(browser({ matchMedia: () => ({ matches: true }) })), true);
  assert.equal(judgeMotionPreference(browser({ matchMedia: () => ({ matches: false }) })), false);
  assert.equal(judgeMotionPreference(null), null);
  assert.equal(judgeMotionPreference({}), null);
  assert.equal(judgeMotionPreference({ matchMedia() { throw new Error('unavailable'); } }), null);
});

test('summary states available, unavailable and unknown counts explicitly', () => {
  const page = reportPage();
  try {
    const result = judgeDeviceAudit(page.document, browser());
    const text = judgeDeviceSummaryText(result);
    assert.match(text, /available/);
    assert.match(text, /unavailable/);
    assert.match(text, /unknown/);
    assert.match(text, /No reduced-motion request detected/);
  } finally { page.teardown(); }
});

test('device panel is a semantic human-readable check with no dead links', () => {
  const page = reportPage();
  try {
    const result = judgeDeviceAudit(page.document, browser());
    renderJudgeDevicePanel(page.document, page.host, result);
    assert.equal(page.host.querySelectorAll('dt').length, 5);
    assert.equal(page.host.querySelectorAll('dd').length, 5);
    assert.match(page.host.textContent, /local capability check/);
    assert.match(page.host.textContent, /No diagnostic data is uploaded/);
    assert.equal(page.host.querySelectorAll('a').length, 0);
  } finally { page.teardown(); }
});

test('device preflight contains no face uploads, API credentials or tracked metrics', async () => {
  const { readFileSync } = await import('node:fs');
  for (const name of ['mobile/judge-device-audit.ts', 'ui/shell/judge-device-panel.ts']) {
    const file = readFileSync(new URL('../src/' + name, import.meta.url), 'utf8');
    assert.doesNotMatch(file, /\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
    assert.doesNotMatch(file, /localStorage|indexedDB|document\.cookie/);
    assert.doesNotMatch(file, /api[_-]?key|Authorization:/i);
  }
});
