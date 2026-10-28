/** R17B browser release-ledger tests. Author: John Khan. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { assessRelease, frozenReady, validateFrozen, validateParity } from '../dist/js/ui/r17b/release.js';

const hash = 'a'.repeat(64);
const names = ['mypy', 'ruff', 'api', 'web', 'parity', 'browser_acceptance'];
const groupNames = ['hair_women', 'makeup_w', 'workflow_w', 'upscale', 'gender_look', 'shave'];
const gates = () => names.map((name) => ({ name, status: 'passed' }));
const groups = (ready = true) => groupNames.map((group) => ready
  ? { group, total: 1, tested: 1, passed: 1, failed: 0, not_tested: 0, ready: true }
  : { group, total: 1, tested: 0, passed: 0, failed: 0, not_tested: 1, ready: false });
const parity = (error = 1) => ({ max_byte_error: error, vectors: 24, engines: [...groupNames] });
const frozen = (cases = 100000, failed = 0, locked = true) => ({ cases, passed: cases - failed, failed, locked, lock_sha256: locked ? hash : null });
const assess = (overrides = {}) => assessRelease({ gates: gates(), parity: parity(), groups: groups(), frozen: frozen(), definitions_sha256: hash, ...overrides });

test('complete externally supplied evidence reaches candidate bookkeeping state', () => {
  const result = assess();
  assert.equal(result.decision, 'release_candidate');
  assert.deepEqual(result.blockers, []);
});

test('missing frozen evidence stays development verified', () => {
  const result = assess({ frozen: frozen(0, 0, false) });
  assert.equal(result.decision, 'development_verified');
  assert.equal(result.frozen_ready, false);
});

test('not-tested group prevents release candidate', () => {
  const result = assess({ groups: groups(false) });
  assert.equal(result.decision, 'development_verified');
  assert.equal(result.group_evidence_ready, false);
});

test('failed static gate blocks', () => {
  const values = gates();
  values[1] = { name: 'ruff', status: 'failed' };
  const result = assess({ gates: values });
  assert.equal(result.decision, 'blocked');
  assert.ok(result.blockers.includes('static:ruff:failed'));
});

test('missing static gate blocks', () => {
  const result = assess({ gates: gates().slice(0, -1) });
  assert.equal(result.decision, 'blocked');
  assert.ok(result.blockers.includes('static:browser_acceptance:missing'));
});

test('two-byte parity drift blocks', () => {
  const result = assess({ parity: parity(2) });
  assert.equal(result.decision, 'blocked');
  assert.ok(result.blockers.includes('parity:max_byte_error=2'));
});

test('frozen minimum is exactly 100000', () => {
  assert.equal(frozenReady(frozen(99999)), false);
  assert.equal(frozenReady(frozen(100000)), true);
});

test('frozen failed case prevents readiness', () => {
  assert.equal(frozenReady(frozen(100000, 1)), false);
});

test('frozen counts must add up', () => {
  assert.throws(() => validateFrozen({ cases: 2, passed: 2, failed: 1, locked: true, lock_sha256: hash }), /add up/);
});

test('locked evidence requires lock hash', () => {
  assert.throws(() => validateFrozen({ cases: 1, passed: 1, failed: 0, locked: true }), /lock hash/);
});

test('parity byte error bounded to one byte domain', () => {
  assert.throws(() => validateParity({ max_byte_error: 256, vectors: 1, engines: ['x'] }), /0..255/);
});

test('parity engine names unique', () => {
  assert.throws(() => validateParity({ max_byte_error: 0, vectors: 1, engines: ['x', 'x'] }), /unique/);
});

test('duplicate gates rejected', () => {
  assert.throws(() => assess({ gates: [...gates(), { name: 'mypy', status: 'passed' }] }), /duplicate gate/);
});

test('duplicate groups rejected', () => {
  assert.throws(() => assess({ groups: [...groups(), groups()[0]] }), /duplicate group/);
});

test('audit hash is order independent', () => {
  const first = assess();
  const second = assess({ gates: gates().reverse(), groups: groups().reverse() });
  assert.equal(first.audit_sha256, second.audit_sha256);
});

test('audit hash changes with measured evidence', () => {
  assert.notEqual(assess().audit_sha256, assess({ frozen: frozen(100001) }).audit_sha256);
});
