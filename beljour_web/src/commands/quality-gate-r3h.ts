/** Strict local reader for versioned Pro quality gate definitions.
 * The consumer UI cannot promote synthetic metrics into a real-face PASS.
 * Author: John Khan.
 */
import { ProRenderError } from './runtime.js';

export interface QualityMetricLimit {
  readonly name: string;
  readonly comparison: 'at_least' | 'at_most';
  readonly threshold: number;
  readonly unit: string;
}

export interface VersionedProGate {
  readonly version: 'beljour-pro-quality-gate/1';
  readonly command: 'enhance' | 'denoise' | 'upscale' | 'studioquality' | 'poseonly';
  readonly minimumFaces: number;
  readonly requiredLabels: readonly string[];
  readonly metrics: readonly QualityMetricLimit[];
  readonly assumptions: true;
}

export interface LocalGateFinding {
  readonly command: VersionedProGate['command'];
  readonly outcome: 'fail' | 'unproven';
  readonly missing: readonly string[];
  readonly failed: readonly string[];
  readonly inspected: number;
  readonly realfacePass: false;
}

function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ProRenderError('invalid_gate_definition', 'Gate must be a structured object.');
  }
  return value as Record<string, unknown>;
}

export function decodeGate(raw: unknown): VersionedProGate {
  const value = object(raw);
  const exact = ['version', 'command', 'minimum_faces', 'required_labels',
    'metrics', 'assumptions'].sort();
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify(exact) ||
      value.version !== 'beljour-pro-quality-gate/1' ||
      !['enhance', 'denoise', 'upscale', 'studioquality', 'poseonly'].includes(String(value.command)) ||
      !Number.isSafeInteger(value.minimum_faces) || Number(value.minimum_faces) < 100000 ||
      value.assumptions !== true || !Array.isArray(value.required_labels) ||
      !Array.isArray(value.metrics) || value.metrics.length < 1 || value.metrics.length > 24) {
    throw new ProRenderError('invalid_gate_definition', 'Gate schema is invalid or incomplete.');
  }
  const labels = value.required_labels;
  if (labels.length < 1 || labels.length > 24 || labels.some(
    (label) => typeof label !== 'string' || label.length < 1 || label.length > 60) ||
      new Set(labels).size !== labels.length) {
    throw new ProRenderError('invalid_gate_definition', 'Gate labels are missing or repeated.');
  }
  const metrics: QualityMetricLimit[] = [];
  for (const field of value.metrics) {
    const measure = object(field);
    if (JSON.stringify(Object.keys(measure).sort()) !== JSON.stringify(
      ['name', 'comparison', 'threshold', 'unit'].sort()) ||
        typeof measure.name !== 'string' || measure.name.length < 1 ||
        !['at_least', 'at_most'].includes(String(measure.comparison)) ||
        typeof measure.threshold !== 'number' || !Number.isFinite(measure.threshold) ||
        typeof measure.unit !== 'string' || measure.unit.length < 1) {
      throw new ProRenderError('invalid_gate_definition', 'Gate metric is invalid.');
    }
    metrics.push({ name: measure.name,
      comparison: measure.comparison as 'at_least' | 'at_most',
      threshold: measure.threshold, unit: measure.unit });
  }
  if (new Set(metrics.map((metric) => metric.name)).size !== metrics.length) {
    throw new ProRenderError('invalid_gate_definition', 'Gate metric is repeated.');
  }
  return { version: 'beljour-pro-quality-gate/1',
    command: value.command as VersionedProGate['command'],
    minimumFaces: Number(value.minimum_faces),
    requiredLabels: labels as string[], metrics,
    assumptions: true };
}

export function evaluateLocalGate(
  gate: VersionedProGate, values: Readonly<Record<string, number | null | undefined>>,
  labels: readonly string[] = [], frozenFaces = 0, externalLocked = false,
): LocalGateFinding {
  if (!Number.isSafeInteger(frozenFaces) || frozenFaces < 0) {
    throw new ProRenderError('invalid_gate_input', 'Frozen face count must be nonnegative.');
  }
  const missing: string[] = [];
  const failed: string[] = [];
  let inspected = 0;
  for (const metric of gate.metrics) {
    const measured = values[metric.name];
    if (measured === null || measured === undefined || !Number.isFinite(measured)) {
      missing.push(metric.name);
      continue;
    }
    inspected++;
    const accepted = metric.comparison === 'at_least' ?
      measured >= metric.threshold : measured <= metric.threshold;
    if (!accepted) failed.push(metric.name);
  }
  for (const label of gate.requiredLabels) {
    if (!labels.includes(label)) missing.push(`label:${label}`);
  }
  missing.push(!externalLocked || frozenFaces < gate.minimumFaces ?
    'frozen_realface_evidence_unverified' : 'external_release_verdict_not_supplied');
  return { command: gate.command, outcome: failed.length > 0 ? 'fail' : 'unproven',
    missing, failed, inspected, realfacePass: false };
}
