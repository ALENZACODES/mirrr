/** Browser acceptance preflight assembled from actual guarded render results.
 * No combination of local measurements can grant a real-face release pass.
 * Author: John Khan.
 */
import { ProPlan } from './plan.js';
import { measurePreviewParity, PreviewParityReport } from './preview-parity.js';
import { ProtectedRegionReport } from './protected-quality.js';
import { ProRenderError, RunSummary } from './runtime.js';

export interface BrowserAcceptanceBundle {
  readonly version: 'beljour-pro-acceptance-bundle/1';
  readonly status: 'blocked' | 'review' | 'unproven';
  readonly preview: RunSummary['quality'];
  readonly export: RunSummary['quality'];
  readonly parity: PreviewParityReport;
  readonly preservation: ProtectedRegionReport | null;
  readonly blockingReasons: readonly string[];
  readonly outstandingEvidence: readonly string[];
  readonly releaseQualified: false;
}

export function assembleBrowserAcceptance(
  plan: ProPlan,
  preview: RunSummary,
  exported: RunSummary,
  preservation: ProtectedRegionReport | null = null,
): BrowserAcceptanceBundle {
  if (plan.version !== 'beljour-pro-plan/1' ||
      plan.steps.length !== preview.steps.length ||
      plan.steps.length !== exported.steps.length) {
    throw new ProRenderError('invalid_bundle', 'The approved chain and both results must agree.');
  }
  for (let index = 0; index < plan.steps.length; index++) {
    const expected = plan.steps[index];
    const first = preview.steps[index];
    const second = exported.steps[index];
    const level = (expected.level / 10).toFixed(1);
    if (first.command !== expected.name || second.command !== expected.name ||
        first.level !== level || second.level !== level) {
      throw new ProRenderError('invalid_bundle', 'One chain changed between preview and export.');
    }
  }
  const parity = measurePreviewParity(preview, exported);
  const blockers: string[] = [];
  const missing: string[] = [];
  if (!plan.identity.enabled) blockers.push('identity_user_optout');
  if ([...preview.steps, ...exported.steps].some(step => step.identity === null)) {
    blockers.push('step_identity_unverified');
  }
  if ([...preview.steps, ...exported.steps].some(step => step.identity?.status === 'warned')) {
    blockers.push('identity_warning_requires_review');
  }
  if ([...preview.steps, ...exported.steps].some(step => step.identity?.syntheticOnly)) {
    missing.push('approved_identity_model_and_realface_test');
  }
  if (!preview.withinBudget || !exported.withinBudget) {
    missing.push('device_performance_gate');
  }
  if (parity.alphaMismatchPixels > 0) blockers.push('preview_alpha_mismatch');
  if (parity.reasonCodes.includes('mean_preview_drift') ||
      parity.reasonCodes.includes('peak_preview_drift')) {
    missing.push('preview_export_drift_review');
  }
  if (preservation === null || !preservation.complete) {
    missing.push('checked_region_coverage');
  }
  if (preservation?.readings.some(row => row.alphaMismatchPixels > 0)) {
    blockers.push('protected_alpha_changed');
  }
  missing.push('external_realface_gate_and_human_review');
  return {
    version: 'beljour-pro-acceptance-bundle/1',
    status: blockers.length > 0 ? 'blocked' : missing.includes('preview_export_drift_review') ||
      missing.includes('device_performance_gate') ? 'review' : 'unproven',
    preview: preview.quality, export: exported.quality, parity, preservation,
    blockingReasons: [...new Set(blockers)],
    outstandingEvidence: [...new Set(missing)], releaseQualified: false,
  };
}
