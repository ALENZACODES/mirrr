/** Independent pixel evidence for externally observed brows, without face labels.
 * Synthetic acceptance is never a real-face or appearance-quality pass.
 * Author: John Khan.
 */
import type { ByteImage } from "../core/buffer.js";
import { checkedMask, type Side, type TrialResult } from "./brow-trial.js";

export interface BrowPixelReport {
  status: string;
  observedPixels: number;
  changedPixels: number;
  changedOutside: number;
  maxOutsideRgb: number;
  alphaChanges: number;
  protectedChanges: number;
  guardMissing: boolean;
  textureCorrelation: number | null;
  meanLumaChange: number | null;
  verdict: "FAIL" | "UNPROVEN";
}

export function safeBrowEvidence(row: BrowPixelReport): Record<string, unknown> {
  return {
    format: "beljour-brow-pixel-evidence/1", status: row.status,
    observed_pixels: row.observedPixels, changed_pixels: row.changedPixels,
    changed_outside: row.changedOutside, max_outside_rgb: row.maxOutsideRgb,
    alpha_changes: row.alphaChanges, protected_changes: row.protectedChanges,
    guard_missing: row.guardMissing, texture_correlation: row.textureCorrelation,
    mean_luma_change: row.meanLumaChange, quality_verdict: row.verdict,
  };
}

function correlation(x: number[], y: number[]): number | null {
  if (x.length < 12) return null;
  const meanX = x.reduce((sum, v) => sum + v, 0) / x.length;
  const meanY = y.reduce((sum, v) => sum + v, 0) / y.length;
  let sumX = 0;
  let sumY = 0;
  let product = 0;
  for (let i = 0; i < x.length; i++) {
    const a = x[i] - meanX;
    const b = y[i] - meanY;
    sumX += a * a;
    sumY += b * b;
    product += a * b;
  }
  const denominator = Math.sqrt(sumX * sumY);
  return denominator <= 1e-12 ? null : Math.max(-1, Math.min(1, product / denominator));
}

export function auditBrowTrial(
  before: ByteImage,
  result: TrialResult,
  observed: Record<Side, ArrayLike<number>>,
  protectedMask?: ArrayLike<number>,
): BrowPixelReport {
  if (![3, 4].includes(before.channels) ||
      before.data.length !== before.width * before.height * before.channels ||
      result.image.length !== before.data.length) {
    throw new RangeError("brow audit needs matching RGB/RGBA full-size frames");
  }
  if (Object.keys(observed).sort().join() !== ["left_brow", "right_brow"].join()) {
    throw new RangeError("brow audit needs both observed brow masks");
  }
  const count = before.width * before.height;
  const right = checkedMask(observed.right_brow, count);
  const left = checkedMask(observed.left_brow, count);
  const protectedPlane = protectedMask ? checkedMask(protectedMask, count) : undefined;
  let observedPixels = 0;
  let changedPixels = 0;
  let changedOutside = 0;
  let alphaChanges = 0;
  let protectedChanges = 0;
  let maxOutsideRgb = 0;
  const beforeLuma: number[] = [];
  const afterLuma: number[] = [];
  const weights = [0.2126, 0.7152, 0.0722];
  for (let i = 0; i < count; i++) {
    if (right[i] >= 0.5 && left[i] >= 0.5) {
      throw new RangeError("independently observed brow regions overlap");
    }
    const protectedHere = protectedPlane !== undefined && protectedPlane[i] >= 0.5;
    const permitted = (right[i] >= 0.5 || left[i] >= 0.5) && !protectedHere;
    let changed = false;
    let maxRgb = 0;
    let oldLight = 0;
    let newLight = 0;
    for (let channel = 0; channel < 3; channel++) {
      const index = i * before.channels + channel;
      const oldByte = before.data[index];
      const newByte = result.image[index];
      const gap = Math.abs(oldByte - newByte);
      changed ||= gap > 0;
      maxRgb = Math.max(maxRgb, gap);
      oldLight += oldByte * weights[channel];
      newLight += newByte * weights[channel];
    }
    if (before.channels === 4 && before.data[i * 4 + 3] !== result.image[i * 4 + 3]) {
      alphaChanges++;
    }
    if (permitted) {
      observedPixels++;
      beforeLuma.push(oldLight);
      afterLuma.push(newLight);
      if (changed) changedPixels++;
    } else {
      maxOutsideRgb = Math.max(maxOutsideRgb, maxRgb);
      if (changed) changedOutside++;
    }
    if (protectedHere && changed) protectedChanges++;
  }
  const guardMissing = (result.status === "rendered" || result.status === "neutral") &&
    !result.guardCalled;
  const changedRefusal = result.status !== "rendered" && result.status !== "neutral" &&
    changedPixels + changedOutside > 0;
  const failures = changedOutside > 0 || alphaChanges > 0 || protectedChanges > 0 ||
    guardMissing || changedRefusal;
  const meanLumaChange = observedPixels === 0 ? null :
    afterLuma.reduce((sum, v, i) => sum + (v - beforeLuma[i]), 0) / observedPixels;
  return {
    status: result.status, observedPixels, changedPixels, changedOutside,
    maxOutsideRgb, alphaChanges, protectedChanges, guardMissing,
    textureCorrelation: correlation(beforeLuma, afterLuma), meanLumaChange,
    verdict: failures ? "FAIL" : "UNPROVEN",
  };
}

export interface GroupCounts {
  observations: number;
  failures: number;
  unproven: number;
  statuses: Record<string, number>;
  groups: Record<string, Record<string, number>>;
}

export function aggregateBrowEvidence(rows: readonly BrowPixelReport[],
  groups?: readonly string[]): GroupCounts {
  if (groups && groups.length !== rows.length) {
    throw new RangeError("group count does not match observations");
  }
  const result: GroupCounts = {
    observations: rows.length, failures: 0, unproven: 0, statuses: {}, groups: {},
  };
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const group = groups?.[i] ?? "all";
    if (!/^[a-z0-9_-]{1,32}$/.test(group)) {
      throw new RangeError("group labels must be short anonymous slugs");
    }
    const status = row.verdict === "FAIL" ? "failures" : "unproven";
    result[status]++;
    result.statuses[row.status] = (result.statuses[row.status] ?? 0) + 1;
    const groupData = result.groups[group] ?? { observations: 0, failures: 0, unproven: 0 };
    groupData.observations++;
    groupData[status]++;
    result.groups[group] = groupData;
  }
  return result;
}

export interface BrowSideReport {
  side: Side;
  status: "MEASURED" | "DECLARED_NOT_VISIBLE" | "INVALID";
  observedPixels: number;
  changedPixels: number;
  meanRgbChange: number | null;
  qualityVerdict: "FAIL" | "UNPROVEN";
}

export function browSideEvidence(before: ByteImage, result: TrialResult,
  masks: Record<Side, ArrayLike<number>>,
  states: Record<Side, string>): BrowSideReport[] {
  if (result.image.length !== before.data.length ||
      Object.keys(masks).sort().join() !== ["left_brow", "right_brow"].join() ||
      Object.keys(states).sort().join() !== ["left_brow", "right_brow"].join()) {
    throw new RangeError("brow side evidence needs matched frames and both sides");
  }
  const rows: BrowSideReport[] = [];
  for (const side of ["right_brow", "left_brow"] as const) {
    const region = checkedMask(masks[side], before.width * before.height);
    let observedPixels = 0;
    let changedPixels = 0;
    let delta = 0;
    for (let i = 0; i < region.length; i++) {
      if (region[i] < 0.5) continue;
      observedPixels++;
      let changed = false;
      for (let channel = 0; channel < 3; channel++) {
        const index = i * before.channels + channel;
        const difference = Math.abs(before.data[index] - result.image[index]);
        delta += difference;
        changed ||= difference > 0;
      }
      if (changed) changedPixels++;
    }
    const state = states[side];
    let status: BrowSideReport["status"] = "INVALID";
    if (state === "visible" && observedPixels >= 8) status = "MEASURED";
    if (["not_visible:hidden_by_turn", "not_visible:occluded"].includes(state) &&
        observedPixels === 0) status = "DECLARED_NOT_VISIBLE";
    rows.push({ side, status, observedPixels, changedPixels,
      meanRgbChange: observedPixels ? delta / (observedPixels * 3) : null,
      qualityVerdict: status === "INVALID" ? "FAIL" : "UNPROVEN" });
  }
  return rows;
}
