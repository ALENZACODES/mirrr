/** Bad Day Rescue (women-first rule 3): one tap on the current photo.
 * Mirrors the "rescue" preset in api/plumb_api/arena/default_presets.json, which the women-first
 * check runs on six skin tones (no lightening, no slimming, freckles and moles kept). It applies
 * what is built: a gentle Natural enhance, then under-eye brightening matched to her own cheek
 * (never past it; nothing changes when there is no dark circle). The dull-skin and flyaway-hair
 * steps are not part of Rescue yet, and the card says so (the separate Glow skin tool is built).
 * Author: John Khan.
 */
import type { LookStep } from "./my-looks.js";

export const RESCUE_ID = "rescue";
export const RESCUE_STEPS: readonly LookStep[] = [{ kind: "enhance", strength: 30, params: { mode: "natural" } },
  { kind: "under-eye", strength: 30, params: {} }];
export const RESCUE_NOT_BUILT: readonly string[] = ["dull skin glow", "flyaway hair"];

export function rescueLine(): string {
  return `Gentle enhance and under-eye brightening matched to your own cheek. Not in Rescue yet: ${RESCUE_NOT_BUILT.join(", ")} (Glow is in the Skin tools).`;
}

/** The layers Rescue adds, in order. A copy, so callers can't change the recipe. */
export function rescueSteps(): LookStep[] {
  return RESCUE_STEPS.map((s) => ({ ...s, params: { ...s.params } }));
}
