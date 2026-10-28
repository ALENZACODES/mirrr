// Lane A: synthetic count-only quality dashboards, no faces or network.
// Tests reject spoofed intervals, missing groups and invalid counts.
// Author: John Khan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classify, wilson95, parseDiagnostic, conciseGateLines } from '../dist/js/quality/realface-summary.js';

const rounded = (a, b) => Math.abs(a - b) < 1e-12;
const sample = () => ({
  format: 'beljour-realface-diagnostics/1', confidence: 0.95, minimum_slice_faces: 20,
  face_count: 100,
  meaning: 'screening intervals; no change to frozen definitions or release verdict',
  gates: [{
    gate: 'regions', written_gate_status: 'FAIL', whole_set: classify(90, 100, 0.95),
    failure_reasons: { threshold_miss: 10 },
    slices: [
      { dimension: 'source', value: 'drawn', ...classify(90, 100, 0.95) },
      { dimension: 'occlusion', value: 'hijab', ...classify(0, 3, 0.95) },
      { dimension: 'occlusion', value: 'none', ...classify(90, 97, 0.95) },
    ],
  }],
});

test('Wilson 95% preserves exact boundaries and no denominator', () => {
  assert.equal(wilson95(0, 0), null);
  assert.ok(rounded(wilson95(0, 20)[0], 0));
  assert.ok(rounded(wilson95(20, 20)[1], 1));
  assert.ok(wilson95(50, 100)[0] < .5 && wilson95(50, 100)[1] > .5);
});

test('small groups cannot claim failure from 0/3 or success from 3/3', () => {
  assert.equal(classify(0, 3, .95).status, 'UNPROVEN');
  assert.equal(classify(3, 3, .95).reason, 'small_group');
  assert.equal(classify(0, 0, .95).reason, 'no_observations');
});

test('large, compelling failures fail; near-threshold uncertainty remains unproven', () => {
  assert.equal(classify(60, 100, .95).status, 'FAIL');
  assert.equal(classify(95, 100, .95).status, 'UNPROVEN');
  assert.equal(classify(500, 500, .95).status, 'PASS');
});

for (const [passed, total, threshold] of [[1, 0, .95], [-1, 20, .95], [25, 24, .95],
  [5.2, 20, .95], [4, 20.5, .95], [1, 20, 0], [20, 20, NaN], [20, 20, 1.1]]) {
  test(`invalid input fails closed: ${passed} ${total} ${threshold}`, () => {
    assert.throws(() => classify(passed, total, threshold));
  });
}

test('valid count-only report stays count-only and distinguishes written verdict', () => {
  const valid = parseDiagnostic(sample());
  assert.deepEqual(conciseGateLines(valid),
    ['regions: 90/100; CI diagnostic FAIL; frozen gate FAIL']);
  assert.equal(valid.gates[0].slices[1].status, 'UNPROVEN');
  assert.ok(!JSON.stringify(valid).includes('face_id'));
});

for (const [label, mutate] of [
  ['relabelled rate', data => { data.gates[0].whole_set.rate = 1; }],
  ['relabelled interval', data => { data.gates[0].whole_set.ci95 = [0, 1]; }],
  ['string interval', data => { data.gates[0].whole_set.ci95[0] = String(data.gates[0].whole_set.ci95[0]); }],
  ['nan interval', data => { data.gates[0].whole_set.ci95[1] = NaN; }],
  ['relabelled status', data => { data.gates[0].whole_set.status = 'PASS'; }],
  ['unreconciled reasons', data => { data.gates[0].failure_reasons.no_face = 4; }],
  ['private category path', data => { data.gates[0].slices[1].value = 'private/face.png'; }],
  ['changed denominator', data => { data.face_count = 99; }],
  ['duplicate gate', data => { data.gates.push(data.gates[0]); }],
  ['duplicate slice', data => { data.gates[0].slices.push(data.gates[0].slices[0]); }],
  ['unknown failure', data => { data.gates[0].failure_reasons.unverified = 1; }],
  ['missing slices', data => { delete data.gates[0].slices; }],
  ['missing version', data => { delete data.format; }],
  ['falsified threshold', data => { data.gates[0].whole_set.threshold = .8; }],
]) test(`invalid aggregate is rejected: ${label}`, () => {
  const value = sample();
  mutate(value);
  assert.throws(() => parseDiagnostic(value));
});

test('composite demographic categories with age bands are valid but private paths are not', () => {
  const value = sample();
  value.gates[0].slices[0].value = '6/female/30-39';
  assert.equal(parseDiagnostic(value).gates[0].slices[0].value, '6/female/30-39');
  value.gates[0].slices[0].value = '../private/face.png';
  assert.throws(() => parseDiagnostic(value));
});

test('dropped demographic partition is not accepted as a complete aggregate', () => {
  const data = sample();
  data.gates[0].slices.splice(1, 1);
  assert.throws(() => parseDiagnostic(data), /partition/);
});

test('a slice cannot claim more passes than the gate-wide frozen count', () => {
  const data = sample();
  data.gates[0].slices[0] = {
    dimension: 'source', value: 'drawn', ...classify(91, 100, .95),
  };
  assert.throws(() => parseDiagnostic(data));
});
