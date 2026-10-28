/**
 * Skin guard, the browser mirror of api/plumb_api/filters/masks/guard.py (women-first rule 8).
 *
 * Inside the skin mask, on CIELAB of the photo before and the look after: the skin's L*
 * spread is held to 75-125%; L* may rise by at most the look's rise on mid-grey + 1, never
 * more than 3; C*ab keeps at least 85%; h_ab turns at most 6 degrees (chroma and hue skipped
 * for mono looks). A margin under each limit (0.1 L*, 3% chroma, 2 degrees) absorbs byte
 * rounding, and a fully guarded pixel whose lightness was lowered rounds down when nearest
 * would land above the limit. Blended back by twice the mask alpha (capped at 1) in linear
 * light. Spread statistics can come from the whole photo, so tiles match a whole render.
 * Face-mapping inspiration: MediaPipe Multiclass Selfie Segmenter (skin classes) and
 * face-parsing.PyTorch (region-masked edits); concept only, no code copied.
 * Author: John Khan.
 */
import type { Mask } from "../../engines/core/buffer.js";
import { DEG, MID_GREY_BYTE, RAD, decode1, encode1, labToSrgb, luminance, srgbToLab, unitToByte, wrapDegrees } from "../colour/space.js";

export const LIFT_OVER_GREY = 1, LIFT_MAX = 3, CHROMA_KEEP = 0.85, HUE_TURN_MAX = 6;
export const MARGIN_L = 0.1, MARGIN_CHROMA = 0.03, MARGIN_HUE = 2;
export const SPREAD_RANGE: readonly [number, number] = [0.75, 1.25];
export const HUE_MIN_CHROMA = 2;
export const DEEP_SKIN_MEAN_L = 45, DEEP_SKIN_LIFT_CAP = 2.1, DEEP_SKIN_HUE_MARGIN = 3;
export const GUARD_MODES = ["full", "lightness"] as const;
export type GuardMode = typeof GUARD_MODES[number];

/** Mask-weighted sums of L* before and after. */
export interface SpreadStats { weight: number; beforeSum: number; beforeSq: number; afterSum: number; afterSq: number }
export const EMPTY_STATS: SpreadStats = { weight: 0, beforeSum: 0, beforeSq: 0, afterSum: 0, afterSq: 0 };

export function plusStats(a: SpreadStats, b: SpreadStats): SpreadStats {
  return { weight: a.weight + b.weight, beforeSum: a.beforeSum + b.beforeSum, beforeSq: a.beforeSq + b.beforeSq,
    afterSum: a.afterSum + b.afterSum, afterSq: a.afterSq + b.afterSq };
}

export function spreadRatio(s: SpreadStats): number | null {
  if (s.weight <= 0) return null;
  const mb = s.beforeSum / s.weight, ma = s.afterSum / s.weight;
  const vb = Math.max(0, s.beforeSq / s.weight - mb * mb), va = Math.max(0, s.afterSq / s.weight - ma * ma);
  if (vb <= 1e-9) return null;
  return Math.sqrt(va / vb);
}

export function spreadScale(s: SpreadStats): number {
  const ratio = spreadRatio(s);
  if (ratio === null || ratio <= 0) return 1;
  const target = Math.min(SPREAD_RANGE[1], Math.max(SPREAD_RANGE[0], ratio));
  return target / ratio;
}

/** Sums over a block: bytes (RGB, 3 apart) and the mask alpha as weights. */
export function spreadStats(before: Uint8Array, look: Uint8Array, skin: ArrayLike<number>): SpreadStats {
  const s = new Float64Array(3);
  let weight = 0, bs = 0, bq = 0, as = 0, aq = 0;
  for (let p = 0; p < skin.length; p++) {
    const w = skin[p];
    if (!(w > 0)) continue;
    const i = p * 3;
    const lb = srgbToLab(before[i] / 255, before[i + 1] / 255, before[i + 2] / 255, s)[0];
    const la = srgbToLab(look[i] / 255, look[i + 1] / 255, look[i + 2] / 255, s)[0];
    weight += w; bs += w * lb; bq += w * lb * lb; as += w * la; aq += w * la * la;
  }
  return weight > 0 ? { weight, beforeSum: bs, beforeSq: bq, afterSum: as, afterSq: aq } : EMPTY_STATS;
}

const GREY_L = (() => srgbToLab(MID_GREY_BYTE / 255, MID_GREY_BYTE / 255, MID_GREY_BYTE / 255, [0, 0, 0])[0])();

/** How much the look lifts mid-grey L* at each pixel, from the look of a mid-grey photo. */
export function greyRise(greyLook: Uint8Array): Float64Array {
  const s = new Float64Array(3);
  const out = new Float64Array(greyLook.length / 3);
  for (let p = 0; p < out.length; p++) {
    const i = p * 3;
    out[p] = srgbToLab(greyLook[i] / 255, greyLook[i + 1] / 255, greyLook[i + 2] / 255, s)[0] - GREY_L;
  }
  return out;
}

/** The look with its skin pixels pulled back inside the limits; RGB bytes in and out. */
export function guard(before: Uint8Array, look: Uint8Array, skin: Mask | ArrayLike<number>, rise: ArrayLike<number>,
  mode: GuardMode = "full", stats: SpreadStats | null = null): Uint8Array {
  if (!(GUARD_MODES as readonly string[]).includes(mode)) throw new RangeError("guard mode must be full or lightness");
  if (before.length !== look.length) throw new RangeError("guard needs two images of one size");
  const alphaIn = "data" in (skin as Mask) ? (skin as Mask).data : (skin as ArrayLike<number>);
  const out = Uint8Array.from(look);
  let any = false;
  for (let p = 0; p < alphaIn.length; p++) if (alphaIn[p] > 0) { any = true; break; }
  if (!any) return out;
  const st = stats ?? spreadStats(before, look, alphaIn);
  const k = spreadScale(st);
  const mean = st.weight > 0 ? st.afterSum / st.weight : 0;
  const sb = new Float64Array(3), sa = new Float64Array(3), g = new Float64Array(3), tmp = new Float64Array(3);
  const deep = st.weight > 0 && st.beforeSum / st.weight < DEEP_SKIN_MEAN_L;
  const cap = HUE_TURN_MAX - (deep ? DEEP_SKIN_HUE_MARGIN : MARGIN_HUE);
  for (let p = 0; p < alphaIn.length; p++) {
    const alpha = Math.min(1, 2 * alphaIn[p]);
    if (!(alpha > 0)) continue;
    const i = p * 3;
    srgbToLab(before[i] / 255, before[i + 1] / 255, before[i + 2] / 255, sb);
    srgbToLab(look[i] / 255, look[i + 1] / 255, look[i + 2] / 255, sa);
    let light = sa[0];
    if (k !== 1) light = mean + (light - mean) * k;
    const allowed = Math.min(rise[p] + LIFT_OVER_GREY, LIFT_MAX) - MARGIN_L;
    const protectedLift = deep ? Math.min(allowed, DEEP_SKIN_LIFT_CAP) : allowed;
    light = Math.min(light, sb[0] + protectedLift);
    let a = sa[1], b = sa[2];
    if (mode === "full") {
      const cb = Math.hypot(sb[1], sb[2]), ca = Math.hypot(sa[1], sa[2]);
      const hb = Math.atan2(sb[2], sb[1]) * DEG, ha = Math.atan2(sa[2], sa[1]) * DEG;
      const turn = wrapDegrees(ha - hb);
      const limited = cb >= HUE_MIN_CHROMA ? Math.min(cap, Math.max(-cap, turn)) : turn;
      const hue = (hb + limited) * RAD;
      const chroma = Math.max(ca, (CHROMA_KEEP + MARGIN_CHROMA) * cb);
      a = chroma * Math.cos(hue); b = chroma * Math.sin(hue);
    }
    labToSrgb(light, a, b, g);
    if (mode === "lightness" && look[i] === look[i + 1] && look[i + 1] === look[i + 2]) {
      const level = encode1(luminance(decode1(g[0]), decode1(g[1]), decode1(g[2])));
      g[0] = level; g[1] = level; g[2] = level;
    }
    for (let c = 0; c < 3; c++) {
      const ll = decode1(look[i + c] / 255), lg = decode1(g[c]);
      tmp[c] = Math.min(1, Math.max(0, encode1(ll + (lg - ll) * alpha)));
      out[i + c] = unitToByte(tmp[c]);
    }
    if (alpha === 1 && light < sa[0] - 1e-9) {
      const reached = srgbToLab(out[i] / 255, out[i + 1] / 255, out[i + 2] / 255, g)[0];
      if (reached > light + 1e-9) for (let c = 0; c < 3; c++) out[i + c] = Math.floor(tmp[c] * 255 + 1e-9);
    }
  }
  return out;
}
