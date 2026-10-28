/** W-series count-only quality summary; no photographs or raw scores.
 * The public report cannot become PASS without Lane A's frozen-set verdict.
 * Author: John Khan.
 */
export type Feature = 'W6' | 'W39' | 'W98' | 'W28' | 'W93';
export type Group = 'monk' | 'gender' | 'age' | 'yaw' |
  'hair_texture' | 'occlusion' | 'intersection';
export interface GroupCount {
  readonly feature: Feature;
  readonly group: Group;
  readonly groupName: string;
  readonly passed: number;
  readonly failed: number;
  readonly unproven: number;
  readonly shard: number;
}
export interface AggregatedGroup {
  readonly feature: Feature;
  readonly group: Group;
  readonly group_name: string;
  readonly passed: number;
  readonly failed: number;
  readonly unproven: number;
  readonly total: number;
  readonly shards: number;
  readonly release_status: 'UNPROVEN';
}

const FEATURE_SET = new Set(['W6', 'W39', 'W98', 'W28', 'W93']);
const GROUP_SET = new Set(['monk', 'gender', 'age', 'yaw', 'hair_texture', 'occlusion', 'intersection']);

function validCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100_000;
}

function validateCount(record: GroupCount): void {
  if (!FEATURE_SET.has(record.feature) || !GROUP_SET.has(record.group)) {
    throw new RangeError('Unexpected feature or reporting group');
  }
  if (!record.groupName || record.groupName.length > 56 ||
      !/^[\x20-\x7e]+$/.test(record.groupName) || /[@\/#]/.test(record.groupName)) {
    throw new RangeError('Only a short aggregate group name may leave the runner');
  }
  if (!Number.isInteger(record.shard) || record.shard < 0 || record.shard >= 1000) {
    throw new RangeError('Invalid shard identifier');
  }
  if (![record.passed, record.failed, record.unproven].every(validCount) ||
      record.passed + record.failed + record.unproven > 100_000) {
    throw new RangeError('Invalid frozen-set aggregate count');
  }
}

export function aggregateCounts(records: readonly GroupCount[]): AggregatedGroup[] {
  const seen = new Set<string>();
  const byGroup = new Map<string, GroupCount[]>();
  for (const record of records) {
    validateCount(record);
    const label = JSON.stringify([record.feature, record.group, record.groupName]);
    const entry = JSON.stringify([record.feature, record.group, record.groupName, record.shard]);
    if (seen.has(entry)) throw new RangeError('Duplicated group and shard entry');
    seen.add(entry);
    byGroup.set(label, [...(byGroup.get(label) ?? []), record]);
  }
  const result: AggregatedGroup[] = [];
  for (const label of [...byGroup.keys()].sort()) {
    const batch = byGroup.get(label)!;
    const passed = batch.reduce((sum, row) => sum + row.passed, 0);
    const failed = batch.reduce((sum, row) => sum + row.failed, 0);
    const unproven = batch.reduce((sum, row) => sum + row.unproven, 0);
    const total = passed + failed + unproven;
    if (total > 100_000) throw new RangeError('Aggregated count exceeds frozen-set maximum');
    result.push({ feature: batch[0].feature, group: batch[0].group,
      group_name: batch[0].groupName, passed, failed, unproven, total,
      shards: batch.length, release_status: 'UNPROVEN' });
  }
  return result;
}

export function publicReport(records: readonly GroupCount[]): {
  format: string; release_status: 'UNPROVEN'; groups: AggregatedGroup[]; note: string;
} {
  return { format: 'beljour-women-r24c-counts/1', release_status: 'UNPROVEN',
    groups: aggregateCounts(records), note: 'Count-only summary; no frozen quality PASS inferred.' };
}
