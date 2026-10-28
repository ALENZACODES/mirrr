/**
 * E06 warp as a contract-13 local engine (mirrors api/plumb_api/engines/warp/engine.py).
 *
 * Params: method ("tps" | "mls-affine" | "mls-similarity" | "mls-rigid" | "piecewise"),
 * from / to (flat x, y lists in pixels), strength 0..1, band (mask name), ramp px, curve,
 * step, alpha, guard (lower the strength until Q3 passes; default on).
 * The edit mask is every pixel whose backward map moved.
 *
 * Author: John Khan.
 */
import { type ByteImage, type Mask, floatImage } from "../core/buffer.js";
import type { EngineResult, LocalEngine, Params } from "../core/engine.js";
import { CURVES, type Curve, bandWeights } from "./falloff.js";
import { type Field, type Point2, apply, moveMagnitude, moveStats, scale, weighted } from "./field.js";
import { foldReport, safeStrength } from "./fold.js";
import { type MlsMode, mlsField } from "./mls.js";
import { piecewiseAffine } from "./piecewise.js";
import { borderPins, tpsField } from "./tps.js";
import { delaunay } from "./triangulate.js";

export const METHODS = ["tps", "mls-affine", "mls-similarity", "mls-rigid", "piecewise"] as const;
export type WarpMethod = typeof METHODS[number];
export const VERSION = "warp-1.0.0";

export function pairs(value: unknown, name: string): Point2[] {
  if (!Array.isArray(value) || value.length === 0 || value.length % 2 || !value.every((v) => typeof v === "number" && Number.isFinite(v))) {
    throw new RangeError(`${name} must be a non-empty flat list of x, y pairs`);
  }
  const out: Point2[] = [];
  for (let i = 0; i < value.length; i += 2) out.push([value[i] as number, value[i + 1] as number]);
  return out;
}

export function buildField(width: number, height: number, method: WarpMethod, src: readonly Point2[], dst: readonly Point2[],
  { step = 4, alpha = 1 } = {}): Field {
  switch (method) {
    case "tps": return tpsField(width, height, src, dst, { step });
    case "mls-affine": case "mls-similarity": case "mls-rigid":
      return mlsField(width, height, src, dst, { mode: method.slice(4) as MlsMode, alpha, step, pinBorder: true });
    case "piecewise": {
      const pins = borderPins(width, height);
      const allSrc = [...src, ...pins], allDst = [...dst, ...pins];
      return piecewiseAffine(width, height, allSrc, allDst, delaunay(allSrc)).field;
    }
    default: throw new RangeError(`method must be one of ${METHODS.join(", ")}`);
  }
}

function num(params: Params, name: string, fallback: number): number {
  const v = params[name] ?? fallback;
  if (typeof v !== "number" || !Number.isFinite(v)) throw new RangeError(`${name} must be a finite number`);
  return v;
}

export class WarpEngine implements LocalEngine {
  readonly version = VERSION;

  run(image: ByteImage, _landmarks: unknown, masks: Readonly<Record<string, Mask>>, params: Params): EngineResult {
    const method = (params.method ?? "tps") as WarpMethod;
    if (!METHODS.includes(method)) throw new RangeError(`method must be one of ${METHODS.join(", ")}`);
    const src = pairs(params.from, "from"), dst = pairs(params.to, "to");
    if (src.length !== dst.length) throw new RangeError("from and to need the same number of points");
    const strength = num(params, "strength", 1);
    if (!(strength >= 0 && strength <= 1)) throw new RangeError("strength must be in [0, 1]");
    const full = buildField(image.width, image.height, method, src, dst, { step: num(params, "step", 4), alpha: num(params, "alpha", 1) });
    let weights = null;
    if (params.band !== undefined) {
      const band = masks[String(params.band)];
      if (!band) throw new RangeError(`mask ${String(params.band)} was not given`);
      const kind = (params.curve ?? "smootherstep") as Curve;
      if (!CURVES.includes(kind)) throw new RangeError(`curve must be one of ${CURVES.join(", ")}`);
      weights = bandWeights(band, num(params, "ramp", 12), kind);
    }
    const build = (s: number) => (weights ? weighted(scale(full, s), weights) : scale(full, s));
    let used = strength, warp: Field, minDet: number;
    if (params.guard ?? true) {
      const safe = safeStrength(build, { requested: strength });
      used = safe.strength; warp = safe.field; minDet = safe.report.minDet;
    } else {
      warp = build(strength); minDet = foldReport(warp).minDet;
    }
    const out = apply(image, warp);
    const move = moveMagnitude(warp);
    const editMask = floatImage(image.width, image.height, 1);
    for (let i = 0; i < move.data.length; i++) editMask.data[i] = move.data[i] > 0 ? 1 : 0;
    return { image: out, editMask, metrics: { min_det: minDet, max_move: moveStats(warp).maxMove, strength_used: used },
             provenance: "local", pipelineVersion: VERSION };
  }
}
