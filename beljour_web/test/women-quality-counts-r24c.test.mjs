/** Lane C R24c group-name/count-only reporting parity; no faces. Author: John Khan. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { publicReport } from '../dist/js/engines/women_styling/qualityCounts.js';

const cases = [
  { feature: 'W28', group: 'monk', groupName: 'tone-1', passed: 9, failed: 1, unproven: 0, shard: 0 },
  { feature: 'W28', group: 'monk', groupName: 'tone-1', passed: 7, failed: 2, unproven: 1, shard: 1 },
  { feature: 'W39', group: 'hair_texture', groupName: 'coily', passed: 5, failed: 0, unproven: 5, shard: 0 },
];

test('shard summaries merge without guessing any quality PASS', () => {
  const report = publicReport(cases);
  assert.equal(report.release_status, 'UNPROVEN');
  assert.equal(report.groups.length, 2);
  const row = report.groups.find(item => item.feature === 'W28');
  assert.deepEqual([row.passed, row.failed, row.unproven, row.total, row.shards], [16, 3, 1, 20, 2]);
  assert.doesNotMatch(JSON.stringify(report), /photo_id|embedding|raw_score/);
});

test('duplicate groups and identifying names fail closed', () => {
  assert.throws(() => publicReport([cases[0], cases[0]]), /Duplicated/);
  assert.throws(() => publicReport([{ ...cases[0], groupName: '../private' }]));
  assert.throws(() => publicReport([{ ...cases[0], groupName: 'someone@example.org' }]));
  assert.throws(() => publicReport([{ ...cases[0], failed: 100_001 }]));
  assert.deepEqual(publicReport([]).groups, []);
});
