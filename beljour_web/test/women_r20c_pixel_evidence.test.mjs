/** Cross-runtime audits use generated algebraic pixels, never real faces.
 * Author: John Khan.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { auditFrame, auditChecks, specFor } from '../dist/js/engines/women_styling/index.js';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const candidate = resolve(root, 'api/.venv/bin/python');
const python = process.env.BELJOUR_PYTHON || (existsSync(candidate) ? candidate : 'python3');
const script = resolve(root, 'api/tests/test_women_r20c_pixel_evidence.py');
const call = spawnSync(python, [script, '--emit-audit-vectors'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 12 * 1024 * 1024,
  env: { ...process.env, PYTHONPATH: resolve(root, 'api') },
});
assert.equal(call.status, 0, call.stderr || String(call.error));
const vectors = JSON.parse(call.stdout);
const decode = base64 => new Uint8Array(Buffer.from(base64, 'base64'));

function scenarioData(scenario) {
  return {
    original: decode(scenario.source),
    result: decode(scenario.result),
    masks: Object.fromEntries(Object.entries(scenario.masks).map(([key, value]) => [key, decode(value)])),
  };
}

test('all parity vectors come from in-memory synthetic arithmetic and avoid photo IDs', () => {
  assert.equal(vectors.version, 'synthetic-audit-parity/1');
  assert.equal(vectors.no_photos, true);
  assert.equal(vectors.cases.length, 104);
  for (const scenario of vectors.cases) {
    assert.equal('image_id' in scenario, false);
    assert.equal('filename' in scenario, false);
    assert.equal(scenario.expected.provider_calls, 0);
  }
});

for (const featureId of new Set(vectors.cases.map(scenario => scenario.feature))) {
  test(`${featureId}: read-only Python/TS pixel-audit byte parity`, () => {
    for (const scenario of vectors.cases.filter(item => item.feature === featureId)) {
      const { original, result, masks } = scenarioData(scenario);
      const originalSaved = Uint8Array.from(original);
      const resultSaved = Uint8Array.from(result);
      for (const stripeHeight of [1, 3, 9, 64]) {
        const report = auditFrame(featureId, original, result,
          scenario.width, scenario.height, masks, { stripeHeight });
        assert.deepEqual(report, scenario.expected,
          `${featureId}/${scenario.channels} stripe=${stripeHeight}`);
        assert.deepEqual(auditChecks(report, specFor(featureId)), scenario.failures);
      }
      assert.deepEqual(original, originalSaved, 'source must remain owned by caller');
      assert.deepEqual(result, resultSaved, 'edited result cannot be mutated by audit');
    }
  });
}

test('malicious outside-mask edits, alpha edits and oversized changes are detected', () => {
  const scenario = vectors.cases.find(item => item.channels === 4 && item.feature === 'W68');
  assert.ok(scenario);
  const { original, result, masks } = scenarioData(scenario);
  const channelCount = 4;
  let notMasked = -1;
  const maskArrays = Object.values(masks);
  for (let p = 0; p < scenario.width * scenario.height; p++) {
    if (!maskArrays.some(mask => mask[p] > 0)) { notMasked = p; break; }
  }
  assert.ok(notMasked >= 0);
  result[notMasked * channelCount] ^= 1;
  result[3] ^= 1;
  const audited = auditFrame('W68', original, result,
    scenario.width, scenario.height, masks);
  const codes = auditChecks(audited, specFor('W68'));
  assert.ok(codes.includes('OUTSIDE_MASK'));
  assert.ok(codes.includes('ALPHA_CHANGED'));
  const forged = auditFrame('W68', original, result,
    scenario.width, scenario.height, masks, {
      synthetic: false,
      consented: false,
      simulationDisclosed: false,
      providerCalls: 2,
    });
  const violations = auditChecks(forged, specFor('W68'));
  assert.ok(violations.includes('REAL_FACE_CONSENT_REQUIRED'));
  assert.ok(violations.includes('NETWORK_NOT_AUTHORIZED'));
  assert.ok(violations.includes('SIMULATION_NOT_DISCLOSED'));
});

test('shared underlying memory cannot masquerade as preserved original', () => {
  const sample = vectors.cases[0];
  const { original, masks } = scenarioData(sample);
  const view = new Uint8Array(original.buffer);
  const report = auditFrame(sample.feature, original, view,
    sample.width, sample.height, masks);
  assert.equal(report.original_preserved, false);
  assert.ok(auditChecks(report, specFor(sample.feature)).includes('ORIGINAL_NOT_PRESERVED'));
});

test('bad frames, missing masks, corrupted regions and malformed types fail closed', () => {
  const sample = vectors.cases[0];
  const { original, result, masks } = scenarioData(sample);
  const args = [sample.feature, original, result, sample.width, sample.height, masks];
  assert.throws(() => auditFrame(sample.feature, original, original.subarray(1),
    sample.width, sample.height, masks), /RGB or RGBA channels/);
  assert.throws(() => auditFrame(...args.slice(0, 5), {}), /nonempty mask/);
  assert.throws(() => auditFrame('W14', original, result,
    sample.width, sample.height, masks), /does not offer/);
  for (const invalid of [0, -1, 1025, 1.1, true]) {
    assert.throws(() => auditFrame(...args, { stripeHeight: invalid }), /Stripe height/);
  }
  for (const invalid of [true, -1, 0.3, 'one']) {
    assert.throws(() => auditFrame(...args, { providerCalls: invalid }), /provider count/);
  }
  assert.throws(() => auditFrame(...args, { synthetic: 1 }), /boolean/);
  assert.throws(() => auditFrame(...args, { consented: null }), /boolean/);
});
