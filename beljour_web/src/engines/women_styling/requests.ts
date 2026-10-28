/** Runtime inputs are bounded here, independently of compile-time TS types.
 * All presets are local. No URLs or provider options are accepted.
 * Author: John Khan.
 */
import { checkedRGB } from './palette.js';
import { specFor, type Depth, type DisplayFamily, type FeatureSpec, type ScreenRGB } from './specs.js';
export interface PreviewRequest {
  readonly featureId: string;
  readonly variant: string;
  readonly strength?: number;
  readonly undertone?: DisplayFamily;
  readonly depth?: Depth;
  readonly outfitRGB?: ScreenRGB;
  readonly referenceRGB?: ScreenRGB;
  readonly primaryRGB?: ScreenRGB;
  readonly secondaryRGB?: ScreenRGB;
  readonly mixPercent?: number;
  readonly hours?: number;
}
export interface CheckedRequest {
  readonly featureId: string;
  readonly variant: string;
  readonly strength: number;
  readonly undertone: DisplayFamily;
  readonly depth: Depth;
  readonly outfitRGB: ScreenRGB;
  readonly referenceRGB: ScreenRGB;
  readonly primaryRGB: ScreenRGB;
  readonly secondaryRGB: ScreenRGB;
  readonly mixPercent: number;
  readonly hours: number;
}
function percent(value: unknown, name: string): number {
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 100) {
    throw new Error(`${name} must be an integer in 0..100`);
  }
  return value as number;
}
export function checkedRequest(value: PreviewRequest): { request: CheckedRequest, spec: FeatureSpec } {
  if (!value || typeof value !== 'object') throw new Error('Request must be a record');
  const spec = specFor(value.featureId);
  if (!spec.variants.includes(value.variant)) throw new Error('Unsupported R20c feature variant');
  const strength = percent(value.strength ?? 55, 'strength');
  const mixPercent = percent(value.mixPercent ?? 35, 'mixPercent');
  const hours = value.hours ?? 6;
  if (!Number.isInteger(hours) || hours < 0 || hours > 12) throw new Error('hours must be 0..12');
  const undertone = value.undertone ?? 'neutral';
  const depth = value.depth ?? 'medium';
  if (!['warm', 'cool', 'neutral'].includes(undertone) ||
      !['light', 'medium', 'deep'].includes(depth)) throw new Error('Invalid display family or depth');
  return { spec, request: {
    featureId: value.featureId, variant: value.variant, strength, mixPercent, hours,
    undertone, depth,
    outfitRGB: checkedRGB(value.outfitRGB ?? [132, 104, 143], 'outfitRGB'),
    referenceRGB: checkedRGB(value.referenceRGB ?? [181, 115, 132], 'referenceRGB'),
    primaryRGB: checkedRGB(value.primaryRGB ?? [180, 136, 120], 'primaryRGB'),
    secondaryRGB: checkedRGB(value.secondaryRGB ?? [150, 110, 112], 'secondaryRGB'),
  } };
}
