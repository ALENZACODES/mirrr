/** The R8 shell's preview compositor. Calls the R7 engines; does not copy or
 * fork their contour tables, colour formulas, posture points or fibre logic.
 * No file/network/provider access. Deterministic on one source, layers and seed.
 * Author: John Khan.
 */
import { type ByteImage, type FloatImage, requireColour, decodeChannel, encodeChannel, roundHalfEven } from "../../engines/core/buffer.js";
import { enhance, type Mode, MODES } from "../../engines/local/enhance.js";
import { readCrown, shadeCard, hairColour } from "../../engines/local/fibre.js";
import { renderFibres, type Product, PRODUCTS } from "../../engines/local/strands.js";
import { renderBeard, type Style, STYLES } from "../../engines/local/beard.js";
import { plan, renderPosture, type FixName, FIXES } from "../../engines/local/posture.js";
import { postureSettings } from "./settings.js";
import { effective } from "./layers.js";
import { appearanceOrder } from "./appearance-stack.js";
import { readiness } from "./catalogue.js";
import { applyHeroLayer } from "./hero-layer.js";
import { applyBeautyLayer } from "./beauty-layer.js";
import { applySkinLayer } from "./skin-layer.js";
import { applyUnderEyeLayer } from "./under-eye-layer.js";
import { applyHairBeardTeethLayer } from "./hair-beard-teeth-layer.js";
import { applyStudioLayer } from "./studio-layer.js";
import type { LightingRenderer } from "./gpu-renderer.js";
import { applyFilterLayer } from "../../filters/runtime/layer.js";
import { applyPortraitLayer } from "../../filters/portrait/layer.js";
import { regionMask } from "../../data/regions/index.js";
import type { LayerResult, PhotoSource, ShellLayer } from "./types.js";
import type { Point2 } from "../../engines/warp/field.js";

/** `face` is where the face points are after the whole stack (the photo's own points when no
 * layer moved them, undefined when the photo has none). */
export interface Preview { image: ByteImage; labels: string[]; metrics: Record<string, number | string | boolean>[]; effective: number; face?: readonly Point2[] }

/** The points after a layer that moved them and was mixed in at `weight` (0-1). A partly mixed
 * warp has no single true geometry; moving the points by the same share is ASSUMED. */
export function nextFace(before: readonly Point2[] | undefined, after: readonly Point2[] | undefined, weight: number): readonly Point2[] | undefined {
  if (!before || !after || after.length !== before.length) return before;
  if (weight >= 1) return after;
  return before.map((p, i) => [p[0] + weight * (after[i][0] - p[0]), p[1] + weight * (after[i][1] - p[1])] as const);
}
export function copyRGB(img: ByteImage): ByteImage {
  requireColour(img);
  if (img.channels === 3) return { ...img, data: new Uint8Array(img.data) };
  const out = new Uint8Array(img.width * img.height * 3);
  for (let i = 0; i < img.width * img.height; i++) out.set(img.data.subarray(i * 4, i * 4 + 3), i * 3);
  return { width: img.width, height: img.height, channels: 3, data: out };
}

/** Linear-light opacity blend with half-even rounding for a reproducible image. */
export function mixOpacity(base: ByteImage, changed: ByteImage, opacity: number): ByteImage {
  requireColour(base); requireColour(changed);
  if (base.width !== changed.width || base.height !== changed.height) throw new RangeError("Layer preview size must match source");
  if (!(Number.isFinite(opacity) && opacity >= 0 && opacity <= 1)) throw new RangeError("Opacity must be 0–1");
  const out = copyRGB(base);
  if (opacity === 0) return out;
  for (let i = 0; i < base.width * base.height; i++) for (let c = 0; c < 3; c++) {
    const a = decodeChannel(base.data[i * base.channels + c] / 255);
    const b = decodeChannel(changed.data[i * changed.channels + c] / 255);
    out.data[i * 3 + c] = roundHalfEven(Math.min(255, Math.max(0, encodeChannel(a * (1 - opacity) + b * opacity) * 255)));
  }
  return out;
}

function stringParam(layer: ShellLayer, name: string, fallback: string): string {
  const value = layer.parameters[name];
  return typeof value === "string" ? value : fallback;
}
function numberParam(layer: ShellLayer, name: string, fallback: number): number {
  const value = layer.parameters[name];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function applyLocalLayer(img: ByteImage, source: PhotoSource, layer: ShellLayer, lightingRenderer?: LightingRenderer): LayerResult {
  requireColour(img);
  if (!(layer.enabled && layer.strength > 0 && layer.opacity > 0)) {
    return { image: copyRGB(img), label: "Disabled layer", metrics: { skipped: true } };
  }
  if (layer.kind === "styling") throw new Error("This is not an offline local engine. Use the approved styling screen.");
  const ready = readiness(layer.kind, source);
  if (!ready.ready) throw new Error(ready.reason);
  const hero = applyHeroLayer(img, source, layer);
  if (hero) return hero;
  const beauty = applyBeautyLayer(img, source, layer, lightingRenderer);
  if (beauty) return beauty;
  const skin = applySkinLayer(img, source, layer);
  if (skin) return skin;
  const underEye = applyUnderEyeLayer(img, source, layer);
  if (underEye) return underEye;
  const hairBeardTeeth = applyHairBeardTeethLayer(img, source, layer);
  if (hairBeardTeeth) return hairBeardTeeth;
  const studio = applyStudioLayer(img, source, layer);
  if (studio) return studio;
  if (layer.kind === "filters") return applyFilterLayer(img, source, layer);
  if (layer.kind === "portrait") return applyPortraitLayer(img, source, layer);
  if (layer.kind === "enhance") {
    const requested = stringParam(layer, "mode", "natural");
    if (!(requested in MODES)) throw new RangeError("Unknown enhancement mode");
    const mode = requested as Mode;
    let faceMask: FloatImage | undefined;
    if (source.face?.length === 478) {
      try {
        const known = regionMask("skin", source.face, img.width, img.height, { normalized: false, supersample: 2 });
        if (known.data.some(value => value > 0)) faceMask = known;
      } catch (error) {
        // A missing/invalid geometry mask supplies no skin evidence. Photo-wide
        // enhancement stays available and records that the cap is unmeasured.
        if (!(error instanceof RangeError)) throw error;
      }
    }
    const result = enhance(img, mode, { strength: layer.strength / 100,
      faceMask,
      steps: {
        denoise: layer.parameters.denoise !== false, deblur: layer.parameters.deblur !== false,
        white_balance: layer.parameters.white_balance !== false, colour: layer.parameters.colour !== false,
        exposure: layer.parameters.exposure !== false, sharpen: layer.parameters.sharpen !== false,
      },
    });
    return { image: result.image, label: result.label, metrics: { mode, noise_before: result.before.noise_sigma,
      noise_after: result.after.noise_sigma, condition: result.condition.primary,
      effective_mode: result.safety.plan.effective_mode, exposure_applied: result.steps.exposure_applied === true,
      normal_preserved: result.steps.normal_preserved === true, unchanged: result.steps.unchanged === true,
      face_metering: faceMask ? "supplied_face_mask" : "unmeasured",
      ...(result.safety.face_tone ? { skin_lstar_max_rise: result.safety.face_tone.max_rise } : {}) } };
  }
  if (layer.kind === "beard") {
    const requested = stringParam(layer, "style", "stubble");
    if (!(requested in STYLES)) throw new RangeError("Unknown beard style");
    const style = requested as Style;
    const length = Math.max(1, Math.min(5, Math.round(numberParam(layer, "length", 3))));
    const density = Math.max(1, Math.min(4, Math.ceil(layer.strength / 25)));
    const result = renderBeard(img, source.face!, { style, length, density,
      colour: stringParam(layer, "colour", "#3B2A22"), seed: 11 });
    return { image: result.image, label: result.label,
      metrics: { style, length, density, strands: Number(result.metrics.strands) } };
  }
  if (layer.kind === "hair-fibre") {
    const requested = stringParam(layer, "product", "fibres");
    if (!(PRODUCTS as readonly string[]).includes(requested)) throw new RangeError("Unknown fibre product");
    const product = requested as Product;
    const area = source.crown!;
    const reading = readCrown(img, area);
    const shade = shadeCard(hairColour(img, reading.split.hair));
    const result = renderFibres(img, area, reading.split.scalp, shade.top[0].lab,
      { product, hair: reading.split.hair, amount: layer.strength, seed: 17 });
    return { image: result.image, label: result.label,
      metrics: { product, scalp_share: reading.overall_scalp_share, fibres: Number(result.metrics.fibres || 0) } };
  }
  if (layer.kind === "posture") {
    const requested = stringParam(layer, "fix", "lean");
    if (!(requested in FIXES)) throw new RangeError("Unknown posture edit");
    const fix = requested as FixName;
    if (FIXES[fix].view !== source.body!.view) throw new RangeError("Posture fix needs a matching front or side view");
    const config = postureSettings({ bandShare: numberParam(layer, "band_share", postureSettings().bandShare),
      capShare: numberParam(layer, "cap_share", postureSettings().capShare) });
    const p = plan(source.body!, fix, layer.strength / 100, { capShare: config.capShare });
    const result = renderPosture(img, source.person!, p, { bandShare: config.bandShare });
    return { image: result.image, label: result.label,
      metrics: { fix, cap_share: config.capShare, band_share: config.bandShare,
        strength_used: result.strengthUsed, cap_scale: p.capScale } };
  }
  throw new Error("This layer has no approved local renderer");
}

/** Render bottom to top; originals and input layers are never mutated. */
export function renderLayers(source: PhotoSource, layers: readonly ShellLayer[], lightingRenderer?: LightingRenderer): Preview {
  // Age texture before the gender warp, so creases follow the face (appearance-stack.ts).
  const used = appearanceOrder(effective(layers)).layers;
  let current = copyRGB(source.image);
  // A layer that moves the face (age reshape, gender) hands its points on, so a later face tool
  // edits the skin, eyes and lips where they now are, not where they were on the original.
  let face = source.face;
  const labels: string[] = [], metrics: Preview["metrics"] = [];
  for (const item of used) {
    const result = applyLocalLayer(current, face === source.face ? source : { ...source, face }, item, lightingRenderer);
    const weight = item.opacity * (item.kind === "lighting" ? item.strength / 100 : 1);
    current = mixOpacity(current, result.image, weight);
    face = nextFace(face, result.face, weight);
    labels.push(result.label);
    metrics.push({ ...result.metrics, opacity: item.opacity, strength: item.strength,
      simulation: item.simulation, source: item.provenance });
  }
  return { image: current, labels, metrics, effective: used.length, face };
}

/** Independent low-level comparison metric, useful in the offline smoke test. */
export function pixelsChanged(a: ByteImage, b: ByteImage): { pixels: number; percent: number; mean: number } {
  requireColour(a); requireColour(b);
  if (a.width !== b.width || a.height !== b.height) throw new RangeError("Different photo sizes");
  let pixels = 0, sum = 0;
  const n = a.width * a.height;
  for (let i = 0; i < n; i++) {
    let delta = 0;
    for (let c = 0; c < 3; c++) delta += Math.abs(a.data[i * a.channels + c] - b.data[i * b.channels + c]);
    if (delta > 0) pixels++;
    sum += delta / 3;
  }
  return { pixels, percent: 100 * pixels / n, mean: sum / n };
}
