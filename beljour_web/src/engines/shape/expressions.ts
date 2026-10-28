/** Closed-mouth expressions: neutral and serious (feature 8), surprise, soft smile and raised
 * brows (feature 46), as named settings of the face part controls, run through the guarded
 * part warp (parts.ts). Only existing pixels move: no teeth, no closed eyes are drawn. The
 * mouth must be closed and the warp may not widen the lip gap. Face-mapping inspiration: FLAME
 * (expression kept apart from identity shape); concept only, no code copied. Mesh index layout:
 * MediaPipe Face Landmarker (runtime data). Mirrors
 * api/plumb_api/engines/shape/expressions.py; shared vectors in api/tests/goldens/expressions.json.
 * Author: John Khan.
 */
import type { ByteImage } from "../core/buffer.js";
import type { Point2 } from "../warp/field.js";
import { MOUTH_LIPS } from "../../data/regions/index.js";
import { checkFace } from "./geometry.js";
import { renderParts, SIMULATION, type PartValues } from "./parts.js";
import { EXPRESSION_TABLE } from "./generated/expressions.js";

export const VERSION = "expressions/1";
export const LABEL = EXPRESSION_TABLE.label;
export const OPEN_MOUTH_RATIO = 0.12;   // ASSUMED, as expressions.py
export const GAP_TOLERANCE = 1e-6;
export type ExpressionId = typeof EXPRESSION_TABLE.expressions[number]["id"];
export const EXPRESSIONS = EXPRESSION_TABLE.expressions;
export const REFUSALS = {
  unknown_expression: "That expression is not in this set.",
  mouth_open: "These expressions keep the mouth closed, and the mouth in this photo is open.",
  mouth_opened: "This change would open the mouth, so it was not applied.",
} as const;
export type ExpressionCode = keyof typeof REFUSALS;
export class ExpressionRefusal extends RangeError {
  constructor(readonly code: ExpressionCode) { super(REFUSALS[code]); this.name = "ExpressionRefusal"; }
}
export interface ExpressionOutcome { image: ByteImage; targets: Point2[]; expression: string; values: PartValues; metrics: Record<string, unknown>; labels: string[] }

export function lipGap(points: readonly Point2[]): number {
  const [a, b] = MOUTH_LIPS;
  return Math.hypot(points[b][0] - points[a][0], points[b][1] - points[a][1]);
}
export function mouthGap(points: readonly Point2[]): number {
  const [, , c, d] = MOUTH_LIPS, width = Math.hypot(points[d][0] - points[c][0], points[d][1] - points[c][1]);
  return width > 1e-9 ? lipGap(points) / width : 0;
}

/** The part amounts of an expression at `amount` percent (0..100) of full expression. */
export function valuesFor(expression: string, amount = 100): PartValues {
  const row = EXPRESSIONS.find((e) => e.id === expression);
  if (!row) throw new ExpressionRefusal("unknown_expression");
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0 || amount > 100) throw new RangeError("expression amount must be 0..100");
  const out: Record<string, number> = {};
  for (const [name, v] of Object.entries(row.values)) out[name] = (v as number) * amount / 100;
  return out as PartValues;
}

export function renderExpression(image: ByteImage, face: readonly Point2[], expression: string,
  { amount = 100, strength = 1 }: { amount?: number; strength?: number } = {}): ExpressionOutcome {
  checkFace(face);
  const values = valuesFor(expression, amount);
  const ratio = mouthGap(face);
  if (ratio > OPEN_MOUTH_RATIO) throw new ExpressionRefusal("mouth_open");
  const out = renderParts(image, face, values, { strength, optedIn: true });
  const before = lipGap(face), after = lipGap(out.targets);
  if (after > before + GAP_TOLERANCE) throw new ExpressionRefusal("mouth_opened");
  return { image: out.image, targets: out.targets, expression, values,
    metrics: { ...out.metrics, expression, amount, mouthGapRatio: ratio, lipGapBefore: before, lipGapAfter: after },
    labels: [SIMULATION, LABEL] };
}

export function catalogue(feature?: number): typeof EXPRESSIONS[number][] {
  return EXPRESSIONS.filter((e) => feature === undefined || e.feature === feature);
}
