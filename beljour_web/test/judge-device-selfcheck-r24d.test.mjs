import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  measureJudgeDevice,
  measureJudgeCurrentScreen,
  describeJudgeDeviceCheck,
} from '../dist/js/mobile/judge-device-selfcheck.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

function sample(app) {
  const card = app.document.createElement('section');
  const button = app.document.createElement('button');
  button.type = 'button';
  button.textContent = 'Check';
  const label = app.document.createElement('p');
  label.textContent = 'Some source-independent label';
  card.append(button, label);
  app.root.append(card);
  return { card, button, label };
}

test('a measurable width has a stable shape, with no claim of physical phone validation', () => {
  const app = judgeDOM();
  try {
    const { card } = sample(app);
    const result = measureJudgeDevice(card, {
      viewportWidth: 390,
      contentWidth: 390,
      style: () => ({ display: 'block', fontSize: '16px' }),
    });
    assert.equal(result.viewport, 390);
    assert.equal(result.content, 390);
    assert.equal(result.overflow, 0);
    assert.equal(result.dataSent, 0);
    assert.equal(result.screenshotsRecorded, 0);
    assert.equal(result.phoneCertified, false);
    assert.equal(result.verdict, 'manual-review-required');
  } finally { app.close(); }
});

test('horizontal overflow remains a visible warning, not a silent success', () => {
  const app = judgeDOM();
  try {
    const { card } = sample(app);
    const result = measureJudgeDevice(card, {
      viewportWidth: 320,
      contentWidth: 357,
      style: () => ({ fontSize: '16px' }),
    });
    assert.equal(result.overflow, 37);
    assert.ok(result.warnings.includes('overflow'));
    assert.match(describeJudgeDeviceCheck(result), /horizontal overflow 37px/);
  } finally { app.close(); }
});

test('text under twelve pixels is detected as a hint, not an accessibility certification', () => {
  const app = judgeDOM();
  try {
    const { card, label } = sample(app);
    const result = measureJudgeDevice(card, {
      viewportWidth: 390,
      contentWidth: 390,
      style: node => ({ fontSize: node === label ? '11px' : '16px' }),
    });
    assert.ok(result.smallText > 0);
    assert.ok(result.warnings.includes('small-text'));
    assert.equal(result.phoneCertified, false);
  } finally { app.close(); }
});

test('unknown viewport never gets a fabricated zero-overflow pass', () => {
  const app = judgeDOM();
  try {
    const { card } = sample(app);
    const result = measureJudgeDevice(card);
    assert.equal(result.viewport, null);
    assert.equal(result.overflow, null);
    assert.ok(result.warnings.includes('not-measurable'));
  } finally { app.close(); }
});

test('bounded scans disclose when the collection is truncated', () => {
  const app = judgeDOM();
  try {
    const { card } = sample(app);
    const result = measureJudgeDevice(card, { maxNodes: 1, viewportWidth: 390, contentWidth: 390 });
    assert.ok(result.warnings.includes('bounded-scan'));
    assert.equal(result.phoneCertified, false);
  } finally { app.close(); }
});

test('the current-document helper works without browser computed style', () => {
  const app = judgeDOM();
  try {
    const { card } = sample(app);
    const result = measureJudgeCurrentScreen(app.document, card);
    assert.equal(result.dataSent, 0);
    assert.equal(result.screenshotsRecorded, 0);
    assert.equal(result.verdict, 'manual-review-required');
  } finally { app.close(); }
});

test('invalid scan bounds are refused by the owned responsive-audit module', () => {
  const app = judgeDOM();
  try {
    const { card } = sample(app);
    assert.throws(() => measureJudgeDevice(card, { maxNodes: -1 }), RangeError);
    assert.throws(() => measureJudgeDevice(card, { maxNodes: 5001 }), RangeError);
  } finally { app.close(); }
});
