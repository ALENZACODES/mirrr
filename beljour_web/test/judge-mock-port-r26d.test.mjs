import assert from 'node:assert/strict';
import { test } from 'node:test';
import { localJudgeMock } from '../dist/js/layout/judge-provider-mock.js';

function request(extra = {}) {
  return { localConsent: true, mockConsent: true, sourceReady: true, subjectSelected: true, ...extra };
}

test('Judge Mode port is mock-only and has no external provider implementation', () => {
  const mock = localJudgeMock();
  assert.equal(mock.kind, 'local-illustration');
  const result = mock.preview(request());
  assert.equal(result.status, 'illustrated');
  assert.equal(result.provider, 'mock-only');
  assert.equal(result.providerCalls, 0);
  assert.equal(result.unitsSpent, 0);
  assert.equal(result.sendsImage, false);
  assert.match(result.description, /No provider request was made/);
});

test('all absent consent scenarios refuse illustration and cost no units', () => {
  const mock = localJudgeMock();
  for (const caseData of [
    { localConsent: false },
    { mockConsent: false },
    { sourceReady: false },
  ]) {
    const result = mock.preview(request(caseData));
    assert.equal(result.status, 'missing-consent');
    assert.equal(result.unitsSpent, 0);
    assert.equal(result.providerCalls, 0);
    assert.equal(result.sendsImage, false);
  }
});

test('missing verified subject fails closed rather than guessing face pixels', () => {
  const mock = localJudgeMock();
  const result = mock.preview(request({ subjectSelected: false }));
  assert.equal(result.status, 'missing-subject');
  assert.equal(result.providerCalls, 0);
  assert.match(result.description, /bystanders cannot be edited/);
});

test('port surface cannot carry photos, task ids or API credentials', () => {
  const mock = localJudgeMock();
  const result = mock.preview(request());
  assert.deepEqual(Object.keys(result).sort(), [
    'description', 'provider', 'providerCalls', 'sendsImage', 'status', 'unitsSpent',
  ]);
  assert.doesNotMatch(JSON.stringify(result), /data:image|photo_id|request_key|api[_-]?key/i);
});
