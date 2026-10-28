/** Typed tenths-based 1.0--5.0 cosmetic strength.
 * Exact parity with commerce/strength.py, including legacy conversion.
 * No face or photo is retained by the memory store. Author: John Khan.
 */
export type ProductKind = "complexion" | "cheek" | "lip" | "hair" | "shade";
const KINDS = ["complexion", "cheek", "lip", "hair", "shade"] as const;
export const DEFAULT_LEVEL = 3.0;
export const DEFAULT_LOCK = 5.0;
export const MIN_LEVEL = 1.0;
export const MAX_LEVEL = 5.0;
export const STEP = 0.1;

export function levelTicks(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1 || value > 5) {
    throw RangeError("Try-on strength must be from 1.0 to 5.0.");
  }
  const ticks = Math.round(value * 10);
  if (ticks < 10 || ticks > 50 || Math.abs(value * 10 - ticks) > 1e-7) {
    throw RangeError("Try-on strength must use increments of 0.1.");
  }
  return ticks;
}
export function validateLevel(value: unknown): number { return levelTicks(value) / 10; }
export function fromLegacy(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > 100) {
    throw RangeError("Legacy intensity must be an integer from 0 to 100.");
  }
  return (10 + Math.floor(value * 0.4 + 0.5)) / 10;
}
export function toLegacy(value: unknown): number { return Math.floor((levelTicks(value) - 10) * 2.5 + 0.5); }
export function nudge(value: unknown, direction: -1 | 1): number {
  if (direction !== -1 && direction !== 1) throw RangeError("Choose a 0.1 nudge.");
  return Math.max(10, Math.min(50, levelTicks(value) + direction)) / 10;
}
export function legacyPresets(): Readonly<Record<string, number>> {
  return {none: fromLegacy(0), subtle: fromLegacy(25), natural: fromLegacy(50),
    strong: fromLegacy(75), full: fromLegacy(100)};
}
export class LevelHistory {
  private readonly values = new Map<ProductKind, number>();
  get(kind: ProductKind): number {
    if (!KINDS.includes(kind)) throw RangeError("Unknown cosmetic product type.");
    return this.values.get(kind) ?? DEFAULT_LEVEL;
  }
  remember(kind: ProductKind, value: unknown): number {
    if (!KINDS.includes(kind)) throw RangeError("Unknown cosmetic product type.");
    const level = validateLevel(value);
    this.values.set(kind, level);
    return level;
  }
  step(kind: ProductKind, direction: -1 | 1): number {
    return this.remember(kind, nudge(this.get(kind), direction));
  }
  clear(): void { this.values.clear(); }
  snapshot(): Record<ProductKind, number> {
    return Object.fromEntries(KINDS.map((kind) => [kind, this.get(kind)])) as Record<ProductKind, number>;
  }
}
