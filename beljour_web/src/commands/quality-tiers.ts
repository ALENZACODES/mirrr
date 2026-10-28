/** BELJOUR 1080/4K /UPSCALE tiers with /CLEANUP first and identity ON.
 * Uses existing 2x/4x guarded engines, without inventing new weights or APIs.
 * An input that cannot satisfy the tier within 24 MP is refused BEFORE editing.
 * Author: John Khan.
 */
import { levelFromTenths, parseLevel, DecimalLevel, levelLabel } from './levels.js';
import { createProPlan, ProPlan, ProStep, RenderQuality } from './plan.js';
import { R2HBrowserSession } from './r2h-session.js';
import { checkedFrame, PixelFrame, ProRenderError, RunSummary } from './runtime.js';

export type QualityTier = '1080' | '4k';
export const TIER_LONG_EDGES: Readonly<Record<QualityTier, number>> = Object.freeze({
  '1080': 1920,
  '4k': 3840,
});
export const QUALITY_TIER_VERSION = 'beljour-quality-generator/1' as const;

export interface QualityTierRecipe {
  readonly tier: QualityTier;
  readonly cleanupLevel: DecimalLevel;
  readonly upscaleLevel: DecimalLevel;
  readonly explicitIdentityStep: boolean;
}

export interface QualityTierPlan {
  readonly recipe: QualityTierRecipe;
  readonly proPlan: ProPlan;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly outputWidth: number;
  readonly outputHeight: number;
  readonly upscaleFactor: 2 | 4;
}

export interface QualityTierRun {
  readonly plan: QualityTierPlan;
  readonly result: RunSummary;
  readonly quality: RenderQuality;
  readonly guardedStepCount: number;
  readonly elapsedMs: number;
}

export function checkedTier(value: unknown): QualityTier {
  if (value === '1080') return '1080';
  if (value === '4k' || value === '4K') return '4k';
  throw new ProRenderError('invalid_tier', 'Quality Generator supports 1080 or 4K.');
}

export function createTierRecipe(
  tier: QualityTier,
  cleanupLevel: DecimalLevel = levelFromTenths(10),
  upscaleLevel: DecimalLevel = levelFromTenths(30),
  explicitIdentityStep = false,
): QualityTierRecipe {
  checkedTier(tier);
  const cleanup = levelFromTenths(cleanupLevel);
  const upscale = levelFromTenths(upscaleLevel);
  if (typeof explicitIdentityStep !== 'boolean') {
    throw new ProRenderError('invalid_lock_policy', 'Lock request flag must be boolean.');
  }
  return Object.freeze({ tier, cleanupLevel: cleanup, upscaleLevel: upscale,
    explicitIdentityStep });
}

export function parseQualityTierCommands(text: string): QualityTierRecipe {
  if (typeof text !== 'string' || text.length > 192 || text.trim() !== text) {
    throw new ProRenderError('invalid_quality_command', 'Quality command text is invalid.');
  }
  const pattern = new RegExp(
    String.raw`^(?:/cleanup ([1-5](?:\.[0-9])?) )?/upscale (1080|4k)` +
    String.raw`(?: ([1-5](?:\.[0-9])?))?( /identitylock)?$`, 'i',
  );
  const matched = pattern.exec(text);
  if (matched === null) {
    throw new ProRenderError('invalid_quality_command',
      'Use /cleanup LEVEL /upscale 1080|4k LEVEL [/identitylock].');
  }
  const tier = checkedTier((matched[2] ?? '').toLowerCase());
  return createTierRecipe(tier, parseLevel(matched[1] ?? '1.0'),
    parseLevel(matched[3] ?? '3.0'), matched[4] !== undefined);
}

export function planQualityTier(frame: PixelFrame, recipe: QualityTierRecipe): QualityTierPlan {
  checkedFrame(frame);
  if (recipe === null || typeof recipe !== 'object') {
    throw new ProRenderError('invalid_tier_input', 'A checked output tier is required.');
  }
  const checked = createTierRecipe(recipe.tier, recipe.cleanupLevel,
    recipe.upscaleLevel, recipe.explicitIdentityStep);
  const minimum = TIER_LONG_EDGES[checked.tier];
  const sourceLong = Math.max(frame.width, frame.height);
  const sourcePixels = frame.width * frame.height;
  let scale: 2 | 4 | null = null;
  for (const candidate of [2, 4] as const) {
    if (sourceLong * candidate >= minimum &&
        sourcePixels * candidate * candidate <= 24_000_000) {
      scale = candidate;
      break;
    }
  }
  if (scale === null) {
    throw new ProRenderError('tier_unavailable',
      `${checked.tier.toUpperCase()} tier requires at least ${minimum} on its long edge; ` +
      'the current 2x/4x CPU engine cannot meet it within 24 MP. No smaller output was delivered.');
  }
  const steps: ProStep[] = [
    { name: 'cleanup' as const, index: 0, level: checked.cleanupLevel, scale: 2 as const },
    { name: 'upscale' as const, index: 1, level: checked.upscaleLevel, scale },
  ];
  if (checked.explicitIdentityStep) {
    steps.push({ name: 'identitylock' as const, index: 2,
      level: levelFromTenths(10), scale: 2 as const });
  }
  const plan = createProPlan(steps);
  return Object.freeze({ recipe: checked, proPlan: plan,
    sourceWidth: frame.width, sourceHeight: frame.height,
    outputWidth: frame.width * scale, outputHeight: frame.height * scale,
    upscaleFactor: scale });
}

export function checkedTierOutput(plan: QualityTierPlan, output: PixelFrame): void {
  checkedFrame(output);
  if (output.width !== plan.outputWidth || output.height !== plan.outputHeight ||
      Math.max(output.width, output.height) < TIER_LONG_EDGES[plan.recipe.tier]) {
    throw new ProRenderError(
      'tier_shortfall', 'Rendered pixels do not meet the requested output tier.',
    );
  }
  if (output.width * plan.sourceHeight !== output.height * plan.sourceWidth) {
    throw new ProRenderError('aspect_changed', 'The output aspect ratio differs from the source.');
  }
}

export async function runQualityTier(session: R2HBrowserSession, frame: PixelFrame,
  recipe: QualityTierRecipe, quality: RenderQuality = 'export',
  signal: AbortSignal = new AbortController().signal,
  current: () => boolean = () => true): Promise<QualityTierRun> {
  if (!(session instanceof R2HBrowserSession) || (quality !== 'preview' && quality !== 'export')) {
    throw new ProRenderError('invalid_tier_session', 'A checked local editor session is required.');
  }
  const prepared = planQualityTier(frame, recipe);
  if (!session.state.photoOpen) {
    throw new ProRenderError('photo_missing', 'Open the input photo before editing.');
  }
  const result = await session.run(prepared.proPlan, quality, signal, current);
  checkedTierOutput(prepared, result.image);
  let guarded = 0;
  for (const [index, report] of result.steps.entries()) {
    if (report.command !== prepared.proPlan.steps[index]?.name || report.identity === null) {
      throw new ProRenderError('tier_identity_unverified',
        'Quality output lacks a mandatory identity check.');
    }
    guarded++;
  }
  if (guarded !== prepared.proPlan.steps.length || !Number.isFinite(result.elapsedMs)) {
    throw new ProRenderError('invalid_tier_execution', 'Quality execution evidence is incomplete.');
  }
  return Object.freeze({ plan: prepared, result, quality, guardedStepCount: guarded,
    elapsedMs: result.elapsedMs });
}

export function tierPublicMetadata(plan: QualityTierPlan): Readonly<Record<string, unknown>> {
  return Object.freeze({ version: QUALITY_TIER_VERSION, tier: plan.recipe.tier,
    minimum_long_edge: TIER_LONG_EDGES[plan.recipe.tier],
    cleanup_first: true,
    cleanup_level: levelLabel(plan.recipe.cleanupLevel),
    upscale_level: levelLabel(plan.recipe.upscaleLevel),
    identity_lock_on: plan.proPlan.identity.enabled,
    output_width: plan.outputWidth, output_height: plan.outputHeight,
    scale: plan.upscaleFactor, independent_face_gate: 'NOT_RUN',
    release_qualified: false });
}
