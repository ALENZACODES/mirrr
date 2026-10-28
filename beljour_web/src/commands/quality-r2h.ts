/** Browser-side reader for predeclared Pro real-face definitions.
 * It can report local measurements but cannot award a frozen-set PASS.
 * Author: John Khan.
 */
import { ProRenderError } from './runtime.js';

export interface QualityLimit {
  readonly name: string;
  readonly comparison: 'at_least' | 'at_most';
  readonly threshold: number;
  readonly unit: string;
}

export interface CommandQualityDefinition {
  readonly version: 'beljour-pro-realface/1';
  readonly command: 'cleanup' | 'upscale';
  readonly minimum_faces: number;
  readonly metrics: readonly QualityLimit[];
  readonly required_labels: readonly string[];
  readonly assumptions: true;
}

export interface QualityAssessment {
  readonly outcome: 'fail' | 'unproven';
  readonly checked: number;
  readonly incomplete: readonly string[];
  readonly failed: readonly string[];
  readonly realfacePass: false;
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return input !== null && typeof input === 'object' && !Array.isArray(input);
}

function fail(): never {
  throw new ProRenderError('invalid_gate_definition', 'Written Pro definition is invalid.');
}

export function parseCommandQualityDefinition(input: unknown): CommandQualityDefinition {
  if (!isRecord(input) || input.version !== 'beljour-pro-realface/1' ||
      (input.command !== 'cleanup' && input.command !== 'upscale') ||
      !Number.isSafeInteger(input.minimum_faces) || Number(input.minimum_faces) < 100_000 ||
      input.assumptions !== true || !Array.isArray(input.metrics) ||
      !Array.isArray(input.required_labels) || input.metrics.length < 1 ||
      input.required_labels.length < 1) {
    fail();
  }
  const metrics: QualityLimit[] = [];
  const names = new Set<string>();
  for (const source of input.metrics) {
    if (!isRecord(source) || typeof source.name !== 'string' || source.name.length === 0 ||
        (source.comparison !== 'at_least' && source.comparison !== 'at_most') ||
        typeof source.threshold !== 'number' || !Number.isFinite(source.threshold) ||
        typeof source.unit !== 'string' || source.unit.length === 0 || names.has(source.name)) {
      fail();
    }
    names.add(source.name);
    metrics.push({ name: source.name, comparison: source.comparison,
      threshold: source.threshold, unit: source.unit });
  }
  for (const label of input.required_labels) {
    if (typeof label !== 'string' || label.length === 0) fail();
  }
  return {
    version: 'beljour-pro-realface/1', command: input.command,
    minimum_faces: Number(input.minimum_faces), metrics,
    required_labels: input.required_labels as string[], assumptions: true,
  };
}

export function assessLocalQuality(definition: CommandQualityDefinition,
  metrics: Readonly<Record<string, number | null | undefined>>,
  externalVerified = false, observedFaces = 0): QualityAssessment {
  if (!Number.isSafeInteger(observedFaces) || observedFaces < 0) {
    throw new ProRenderError('invalid_gate_input', 'Observed face count is invalid.');
  }
  const incomplete: string[] = [];
  const failed: string[] = [];
  let checked = 0;
  for (const limit of definition.metrics) {
    const observed = metrics[limit.name];
    if (observed === null || observed === undefined || !Number.isFinite(observed)) {
      incomplete.push(limit.name);
      continue;
    }
    checked++;
    const passed = limit.comparison === 'at_least' ?
      observed >= limit.threshold : observed <= limit.threshold;
    if (!passed) failed.push(limit.name);
  }
  if (!externalVerified || observedFaces < definition.minimum_faces) {
    incomplete.push('frozen_realface_run_not_verified');
  }
  return { outcome: failed.length ? 'fail' : 'unproven',
    checked, incomplete, failed, realfacePass: false };
}
