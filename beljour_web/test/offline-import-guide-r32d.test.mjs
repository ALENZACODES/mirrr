/** Fixed import instructions must never overstate evidence. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { offlineImportStatus } from '../dist/js/layout/continuous/offline-import-contract.js';
import {
  OFFLINE_IMPORT_GUIDE,
  offlineImportHelp,
  offlineImportReadiness,
  offlineImportSummary,
} from '../dist/js/layout/continuous/offline-import-guide.js';

const phases = ['empty', 'checking', 'ready', 'refused', 'stale', 'disposed'];

test('the five review tasks have stable unique names and nonempty instructions', () => {
  assert.deepEqual(OFFLINE_IMPORT_GUIDE.map(step => step.id),
    ['prepare', 'consent', 'inspect', 'compare', 'clear']);
  assert.equal(OFFLINE_IMPORT_GUIDE.length, new Set(OFFLINE_IMPORT_GUIDE.map(step => step.id)).size);
  assert.ok(OFFLINE_IMPORT_GUIDE.every(step => step.title.length > 4 && step.instruction.length > 20));
});

test('every phase has explanatory help with no network instructions', () => {
  for (const phase of phases) {
    const note = offlineImportHelp(offlineImportStatus(phase));
    assert.ok(note.length > 20);
    assert.doesNotMatch(note, /send (?:the|your) (?:photo|image) to|upload to provider/i);
  }
});

test('only matching-file ready status can display an image', () => {
  for (const phase of phases) {
    const readiness = offlineImportReadiness(offlineImportStatus(phase));
    assert.equal(readiness.safeToDisplay, phase === 'ready');
    assert.equal(readiness.providerUnverified, true);
    assert.equal(readiness.needOperatorReview, true);
    assert.equal(readiness.photoUploaded, false);
  }
});

test('every status continues to require provider and real-face verification', () => {
  for (const phase of phases) {
    const sentence = offlineImportSummary(offlineImportStatus(phase));
    assert.match(sentence, /Live provider and real-face quality remain NOT VERIFIED/);
  }
});

test('a forced success flag cannot create a verified-provider summary', () => {
  const forged = { ...offlineImportStatus('ready'), verifiedProviderOrigin: true };
  assert.match(offlineImportSummary(forged), /NOT VERIFIED/);
  assert.match(offlineImportHelp(forged), /not authenticated/);
});

test('the instructions never solicit passwords, photos as reports, or paid upgrades', () => {
  const text = OFFLINE_IMPORT_GUIDE.map(step => step.instruction).join(' ');
  assert.doesNotMatch(text, /password|bearer|API key|credit card|payment|share your image/i);
  assert.match(text, /No file is uploaded/);
});
