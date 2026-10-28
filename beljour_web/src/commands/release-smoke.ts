/** Complete local smoke flow for the five guarded Pro Commands.
 * Generated test pixels only; no real faces, model assets or provider calls.
 * This verifies behavior, not model accuracy, fairness or device speed.
 * Author: John Khan.
 */
import { syntheticBenchmarkFrame } from './benchmark.js';
import { assembleBrowserAcceptance } from './acceptance-bundle.js';
import { levelFromTenths } from './levels.js';
import { createProPlan, ProName, ProStep } from './plan.js';
import { PreflightCapabilities, preflightProPlan } from './preflight.js';
import { R3HBrowserSession } from './r3h-session.js';
import { IdentityPort, PixelFrame, ProRenderError, checkedFrame, unchanged } from './runtime.js';

export interface ProReleaseSmokeResult {
  readonly version: 'beljour-pro-synthetic-smoke/1';
  readonly status: 'unproven' | 'failed';
  readonly previewElapsedMs: number | null;
  readonly exportElapsedMs: number | null;
  readonly previewWithinAssumedBudget: boolean | null;
  readonly exportWithinAssumedBudget: boolean | null;
  readonly identityOnAtEveryStep: boolean;
  readonly originalUnchanged: boolean;
  readonly executedCommands: readonly ProName[];
  readonly previewExportDifference: number | null;
  readonly missingEvidence: readonly string[];
  readonly errorCode: string | null;
  readonly syntheticOnly: true;
  readonly releaseQualified: false;
}

const NAMES: readonly ProName[] = [
  'identitylock', 'cleanup', 'studioquality', 'poseonly', 'upscale',
];

function smokePlan() {
  const steps: ProStep[] = NAMES.map((name, index): ProStep => ({
    name, index, scale: 2, level: levelFromTenths(10),
  }));
  return createProPlan(steps);
}

function preservedSource(original: PixelFrame, current: PixelFrame): boolean {
  return unchanged(original, current);
}

function failure(code: string): ProReleaseSmokeResult {
  return {
    version: 'beljour-pro-synthetic-smoke/1', status: 'failed',
    previewElapsedMs: null, exportElapsedMs: null,
    previewWithinAssumedBudget: null, exportWithinAssumedBudget: null,
    identityOnAtEveryStep: false, originalUnchanged: true,
    executedCommands: [], previewExportDifference: null,
    missingEvidence: ['synthetic_only', 'external_realface_gate_and_human_review'],
    errorCode: code, syntheticOnly: true, releaseQualified: false,
  };
}

export async function runFiveCommandSyntheticSmoke(
  identity: IdentityPort | null,
  seed = 17,
  edge = 32,
  signal: AbortSignal = new AbortController().signal,
  input?: PixelFrame,
): Promise<ProReleaseSmokeResult> {
  if (!Number.isInteger(seed) || seed < 0 || seed > 2 ** 32 - 1 ||
      !Number.isInteger(edge) || edge < 8 || edge > 256) {
    throw new ProRenderError('invalid_smoke_case', 'Synthetic smoke size or seed is invalid.');
  }
  if (input !== undefined) checkedFrame(input);
  const source = input ?? syntheticBenchmarkFrame(edge, edge, 4, seed);
  if (source.width * source.height > 256 * 256) {
    throw new ProRenderError('invalid_smoke_case', 'Synthetic smoke image is too large.');
  }
  const frozen = new Uint8Array(source.pixels);
  const plan = smokePlan();
  const capabilities: PreflightCapabilities = {
    identityGuardAvailable: identity !== null,
    enabledEffects: new Set<ProName>(NAMES.filter(name => name !== 'identitylock')),
    checkedPoseAvailable: false,
    checkedMasksAvailable: false,
  };
  const preflight = preflightProPlan(plan, source, capabilities, 'export');
  if (preflight.status !== 'ready') {
    return failure(preflight.issues[0] ?? 'preflight_blocked');
  }
  if (signal.aborted) return failure('cancelled_before_smoke');
  const session = new R3HBrowserSession(identity);
  try {
    session.openPhoto(source, `synthetic-smoke-${seed}`);
    const preview = await session.run(plan, 'preview', signal);
    const exported = await session.run(plan, 'export', signal);
    const complete = [...preview.steps, ...exported.steps].every(step =>
      step.identity !== null && step.identity.status !== 'warned' &&
      Number.isInteger(step.identity.identityMatch) && step.identity.identityMatch >= 0 &&
      step.identity.identityMatch <= 100,
    );
    const identityOn = complete && plan.identity.enabled;
    const bundle = assembleBrowserAcceptance(plan, preview, exported);
    const originalUnchanged = preservedSource(source, {
      ...source, pixels: frozen,
    });
    const executed = preview.steps.map(step => step.command);
    const sourceWasNotMutated = source.pixels.every((value, index) => value === frozen[index]);
    const missing = ['synthetic_only', ...bundle.outstandingEvidence];
    if (!identityOn) missing.push('identity_step_missing');
    if (!sourceWasNotMutated || !preview.originalUnchanged || !exported.originalUnchanged) {
      return failure('original_modified');
    }
    return {
      version: 'beljour-pro-synthetic-smoke/1', status: 'unproven',
      previewElapsedMs: preview.elapsedMs, exportElapsedMs: exported.elapsedMs,
      previewWithinAssumedBudget: preview.withinBudget,
      exportWithinAssumedBudget: exported.withinBudget,
      identityOnAtEveryStep: identityOn,
      originalUnchanged: originalUnchanged && sourceWasNotMutated,
      executedCommands: executed,
      previewExportDifference: bundle.parity.meanError,
      missingEvidence: [...new Set(missing)], errorCode: null,
      syntheticOnly: true, releaseQualified: false,
    };
  } catch (error) {
    return failure(error instanceof ProRenderError ? error.code : 'smoke_failed');
  } finally {
    session.closePhoto();
  }
}
