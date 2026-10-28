/** Every Pro Command and every decimal strength must meet the local contract.
 * These observations are engineering evidence, never independent face results.
 * Author: John Khan.
 */
import { ProName } from './plan.js';
import { ProRenderError } from './runtime.js';

export type LockStatus = 'blocked' | 'incomplete' | 'synthetic_ready' | 'device_measured';

export const PRO_COMMAND_NAMES: readonly ProName[] = Object.freeze([
  'identitylock', 'cleanup', 'upscale', 'studioquality', 'poseonly',
]);

export interface LockObservation {
  readonly command: ProName;
  readonly levelTenths: number;
  readonly previewMs: number;
  readonly exportMs: number;
  readonly identityApplied: boolean;
  readonly alphaUnchanged: boolean;
  readonly protectedUnchanged: boolean;
  readonly neutralCorrect: boolean;
  readonly skinLiftL?: number | null;
  readonly poseMinimumJacobian?: number | null;
  readonly poseRetention?: number | null;
  readonly measuredDevice: boolean;
}

export interface CommandLockFinding {
  readonly command: ProName;
  readonly checkedLevels: number;
  readonly missingLevels: readonly number[];
  readonly failedLevels: readonly number[];
  readonly timingLimitedLevels: readonly number[];
  readonly deviceLevels: number;
}

export interface LockMatrixReport {
  readonly version: 'beljour-five-command-lock/1';
  readonly status: LockStatus;
  readonly findings: readonly CommandLockFinding[];
  readonly totalChecked: number;
  readonly duplicateRows: number;
  readonly previewBudgetMs: number;
  readonly exportBudgetMs: number;
  readonly completeFiveCommandCoverage: boolean;
  readonly independentlyReviewed: false;
  readonly releaseQualified: false;
}

function validateObservation(value: LockObservation): void {
  if (!PRO_COMMAND_NAMES.includes(value.command) ||
      !Number.isInteger(value.levelTenths) ||
      value.levelTenths < 10 || value.levelTenths > 50 ||
      !Number.isFinite(value.previewMs) || value.previewMs < 0 ||
      !Number.isFinite(value.exportMs) || value.exportMs < 0 ||
      [value.identityApplied, value.alphaUnchanged, value.protectedUnchanged,
        value.neutralCorrect, value.measuredDevice].some((flag) => typeof flag !== 'boolean') ||
      [value.skinLiftL, value.poseMinimumJacobian, value.poseRetention].some(
        (number) => number !== undefined && number !== null && !Number.isFinite(number))) {
    throw new ProRenderError('invalid_lock_matrix', 'Pro lock observation is invalid.');
  }
}

function passesGuard(record: LockObservation): boolean {
  if (!record.identityApplied || !record.alphaUnchanged || !record.protectedUnchanged ||
      (record.levelTenths === 10 && !record.neutralCorrect)) return false;
  if (record.command === 'studioquality' &&
      (record.skinLiftL === undefined || record.skinLiftL === null ||
        record.skinLiftL > 2.5)) return false;
  if (record.command === 'poseonly' &&
      (record.poseMinimumJacobian === undefined || record.poseMinimumJacobian === null ||
        record.poseRetention === undefined || record.poseRetention === null ||
        record.poseMinimumJacobian < 0.25 || record.poseRetention < 0.25)) return false;
  return true;
}

export function evaluateCommandLocks(observations: readonly LockObservation[],
  previewBudgetMs = 100, exportBudgetMs = 2000): LockMatrixReport {
  if (!Array.isArray(observations) || observations.length > 410 ||
      !Number.isFinite(previewBudgetMs) || previewBudgetMs <= 0 ||
      !Number.isFinite(exportBudgetMs) || exportBudgetMs <= 0) {
    throw new ProRenderError('invalid_lock_matrix', 'Pro lock matrix limits are invalid.');
  }
  const lookup = new Map<string, LockObservation>();
  const duplicate = new Set<string>();
  for (const observation of observations) {
    validateObservation(observation);
    const key = `${observation.command}:${observation.levelTenths}`;
    if (lookup.has(key)) duplicate.add(key);
    else lookup.set(key, observation);
  }
  const findings: CommandLockFinding[] = [];
  let allDevice = true;
  for (const command of PRO_COMMAND_NAMES) {
    const missing: number[] = [];
    const failed: number[] = [];
    const slow: number[] = [];
    let deviceLevels = 0;
    for (let level = 10; level <= 50; level++) {
      const key = `${command}:${level}`;
      const record = lookup.get(key);
      if (record === undefined) {
        missing.push(level);
        continue;
      }
      if (!passesGuard(record) || duplicate.has(key)) failed.push(level);
      if (record.previewMs > previewBudgetMs || record.exportMs > exportBudgetMs) {
        slow.push(level);
      }
      if (record.measuredDevice) deviceLevels++;
      else allDevice = false;
    }
    findings.push({ command, checkedLevels: 41 - missing.length,
      missingLevels: missing, failedLevels: failed,
      timingLimitedLevels: slow, deviceLevels });
  }
  const complete = findings.every((entry) => entry.checkedLevels === 41);
  let status: LockStatus = 'synthetic_ready';
  if (duplicate.size > 0 || findings.some((entry) => entry.failedLevels.length > 0)) {
    status = 'blocked';
  } else if (!complete) {
    status = 'incomplete';
  } else if (findings.some((entry) => entry.timingLimitedLevels.length > 0)) {
    status = 'blocked';
  } else if (allDevice) {
    status = 'device_measured';
  }
  return { version: 'beljour-five-command-lock/1', status,
    findings, totalChecked: lookup.size, duplicateRows: duplicate.size,
    previewBudgetMs, exportBudgetMs, completeFiveCommandCoverage: complete,
    independentlyReviewed: false, releaseQualified: false };
}
