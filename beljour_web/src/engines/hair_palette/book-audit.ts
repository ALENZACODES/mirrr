/** Editorial Shade Book data audit over the 90 original hair swatches.
 * Mirrors api/plumb_api/engines/hair_palette/book_audit.py: unique ids and names, Lab
 * rebuilt from the authored sRGB and LCh from Lab (largest error of each), folio numbers
 * 1..N in source order, and the smallest CIEDE2000 separation with its pair. Reports
 * only; original digital swatches, not dye products. Author: John Khan.
 */
import { ciede2000, rgbToXyz, xyzToLab } from "../core/colour.js";
import { catalogue, type HairShade } from "./palette.js";

/** The catalogue loader's own tolerance for Lab/RGB and Lab/LCh agreement. */
export const RECONSTRUCTION_LIMIT = 0.006;
/** The catalogue loader's own "too close to tell apart" rule. */
export const SEPARATION_LIMIT = 1.0;

export interface BookAudit {
  readonly format: "beljour-shade-book-audit/1";
  readonly count: number;
  readonly ok: boolean;
  readonly duplicate_ids: readonly string[];
  readonly duplicate_names: readonly string[];
  readonly max_lab_error: number;
  readonly max_lch_error: number;
  readonly folios_contiguous: boolean;
  readonly min_separation: number;
  readonly closest_pair: readonly [string, string];
  readonly note: string;
}

const round = (v: number, d: number) => { const s = 10 ** d; return Math.round(v * s) / s; };

/** [folio, id] in source order, numbered from 1. */
export function folioNumbers(shades: readonly HairShade[] = catalogue()): readonly (readonly [number, string])[] {
  return shades.map((shade, i) => [i + 1, shade.id] as const);
}

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>(), repeated = new Set<string>();
  for (const v of values) (seen.has(v) ? repeated : seen).add(v);
  return [...repeated].sort();
}

function lchError(shade: HairShade): number {
  const [light, a, b] = shade.lab;
  const hue = ((Math.atan2(b, a) * 180) / Math.PI % 360 + 360) % 360;
  const gap = Math.abs(hue - shade.lch[2]);
  return Math.max(Math.abs(light - shade.lch[0]), Math.abs(Math.hypot(a, b) - shade.lch[1]), Math.min(gap, 360 - gap));
}

/** Audit the catalogue (or a supplied list) and a book's [folio, id] numbering. */
export function auditBook(shades: readonly HairShade[] = catalogue(),
  folios: readonly (readonly [number, string])[] = folioNumbers(shades)): BookAudit {
  if (!Array.isArray(shades) || shades.length < 2) throw new RangeError("The shade book audit needs at least two hair swatches");
  let labError = 0;
  for (const s of shades) {
    const rebuilt = xyzToLab(rgbToXyz(s.rgb));
    for (let i = 0; i < 3; i++) labError = Math.max(labError, Math.abs(rebuilt[i] - s.lab[i]));
  }
  let best = { d: Infinity, a: "", b: "" };
  shades.forEach((first, i) => {
    for (const second of shades.slice(i + 1)) {
      const d = ciede2000(first.lab, second.lab);
      const [a, b] = [first.id, second.id].sort();
      if (d < best.d || (d === best.d && (a < best.a || (a === best.a && b < best.b)))) best = { d, a, b };
    }
  });
  const contiguous = folios.length === shades.length &&
    folios.every(([n, id], i) => n === i + 1 && id === shades[i].id);
  const dupIds = duplicates(shades.map((s) => s.id)), dupNames = duplicates(shades.map((s) => s.name));
  const lch = Math.max(...shades.map(lchError));
  const ok = dupIds.length === 0 && dupNames.length === 0 && contiguous && labError <= RECONSTRUCTION_LIMIT &&
    lch <= RECONSTRUCTION_LIMIT && best.d >= SEPARATION_LIMIT;
  return Object.freeze({ format: "beljour-shade-book-audit/1" as const, count: shades.length, ok,
    duplicate_ids: dupIds, duplicate_names: dupNames, max_lab_error: round(labError, 6), max_lch_error: round(lch, 6),
    folios_contiguous: contiguous, min_separation: round(best.d, 4), closest_pair: [best.a, best.b] as const,
    note: "Original in-house digital swatches; not physical dye products." });
}
