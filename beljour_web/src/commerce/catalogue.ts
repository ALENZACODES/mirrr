/** Validate and expand the same fictional catalogue used by the Python API.
 * No generated TypeScript SKU tables or copy-pasted product names. Author: John Khan.
 */
import type { Category, Formula, Product, SourceCatalogue, Tone } from "./types.js";

export const TONES: readonly Tone[] = ["cool", "neutral", "warm", "olive"];
export const TONE_OFFSETS: Record<Tone, readonly [number, number, number]> = {
  cool: [8, -1, 6], neutral: [0, 0, 0], warm: [5, 4, -5], olive: [-4, 2, -7],
};
export const SHADE_SUFFIX: Record<Tone, string> = { cool: "Rose", neutral: "Balance", warm: "Gold", olive: "Olive" };
export const OTHER_SWATCH: Record<Exclude<Category, "complexion">, string> = {
  cheek: "#be6e7a", lip: "#924e61", prep: "#e1d9cf", finish: "#d7c5b8",
};
const FORMATS = new Set(["natural", "dewy", "satin", "matte"]);
const CATEGORIES = new Set(["complexion", "cheek", "lip", "prep", "finish"]);
const VTO = new Set([null, "foundation", "blush", "lip"]);
const HEX = /^#[0-9a-fA-F]{6}$/;
const ID = /^[a-z][a-z0-9-]{2,35}$/;
const DEPTH_COUNT = 10;

function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw Error("Invalid sample catalogue data");
  return value as Record<string, unknown>;
}
function stringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((s) => typeof s === "string");
}
export function assertCatalogue(input: unknown): asserts input is SourceCatalogue {
  const data = object(input);
  if (data.format !== "beljour-commerce-catalogue/1" || data.author !== "John Khan" || data.currency !== "CAD") {
    throw Error("Unrecognised sample catalogue");
  }
  if (typeof data.version !== "string" || typeof data.note !== "string" || data.note.length < 25) {
    throw Error("Incomplete catalogue provenance");
  }
  if (!stringArray(data.tones) || data.tones.join(",") !== TONES.join(",") ||
      !stringArray(data.depths) || data.depths.length !== DEPTH_COUNT ||
      !stringArray(data.depth_swatches) || data.depth_swatches.length !== DEPTH_COUNT ||
      !data.depth_swatches.every((s) => HEX.test(s)) ||
      !stringArray(data.finishes) || !data.finishes.every((s) => FORMATS.has(s)) ||
      !stringArray(data.concerns) || data.concerns.length === 0) {
    throw Error("Invalid sample shade options");
  }
  if (!Array.isArray(data.formulas) || data.formulas.length < 2) throw Error("Sample products are missing");
  const ids = new Set<string>();
  for (const row of data.formulas) {
    const value = object(row);
    if (typeof value.id !== "string" || !ID.test(value.id) || ids.has(value.id) ||
        typeof value.name !== "string" || value.name.length < 4 || value.name.length > 70 ||
        typeof value.description !== "string" || value.description.length < 12 || value.description.length > 250 ||
        !CATEGORIES.has(value.category as string) || !FORMATS.has(value.finish as string) ||
        !VTO.has(value.vto as string) || !Number.isInteger(value.price_cents) ||
        (value.price_cents as number) <= 0 || (value.price_cents as number) >= 100_000 ||
        !stringArray(value.concerns) || value.concerns.length === 0 ||
        !value.concerns.every((s) => (data.concerns as string[]).includes(s)) ||
        !["none", "sheer", "medium"].includes(value.coverage as string)) {
      throw Error("Sample product failed validation");
    }
    ids.add(value.id);
    if ((value.category === "complexion") !== (value.vto === "foundation") ||
        (["cheek", "lip"].includes(value.category as string) && value.vto !== (value.category === "cheek" ? "blush" : "lip"))) {
      throw Error("Sample try-on category mismatch");
    }
  }
}

export function shiftSwatch(base: string, tone: Tone): string {
  if (!HEX.test(base)) throw Error("Swatch must be a six-digit hex colour");
  return `#${([1, 3, 5] as const).map((index, channel) => {
    const value = parseInt(base.slice(index, index + 2), 16) + TONE_OFFSETS[tone][channel];
    return Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
  }).join("")}`;
}

function base(formula: Formula): Omit<Product, "id" | "name" | "depth" | "undertone" | "swatch"> {
  return { formula_id: formula.id, description: formula.description, category: formula.category,
    vto: formula.vto, price_cents: formula.price_cents, currency: "CAD", finish: formula.finish,
    concerns: formula.concerns, coverage: formula.coverage, sample: true,
    label: "Fictional sample product; not tested against real products" };
}

export function expandCatalogue(value: unknown): Product[] {
  assertCatalogue(value);
  const out: Product[] = [];
  for (const row of value.formulas) {
    if (row.category !== "complexion") {
      out.push({ ...base(row), id: row.id, name: row.name, depth: null,
        undertone: null, swatch: OTHER_SWATCH[row.category] });
      continue;
    }
    for (let depth = 1; depth <= DEPTH_COUNT; depth += 1) {
      for (const tone of value.tones) {
        out.push({ ...base(row), id: `${row.id}-${String(depth).padStart(2, "0")}-${tone}`,
          name: `${row.name} ${value.depths[depth - 1].replace(/(^|-)[a-z]/g, (c) => c.toUpperCase())} ${SHADE_SUFFIX[tone]}`,
          depth, undertone: tone, swatch: shiftSwatch(value.depth_swatches[depth - 1], tone) });
      }
    }
  }
  if (new Set(out.map((row) => row.id)).size !== out.length) throw Error("Duplicated sample SKU");
  return out;
}

export function findProduct(catalogue: readonly Product[], sku: string): Product {
  const item = catalogue.find((row) => row.id === sku);
  if (!item) throw Error("That item is not in our fictional sample catalogue.");
  return item;
}

export function nearbyShades(catalogue: readonly Product[], sku: string, depth: number, tone: Tone, max = 8): Product[] {
  const original = findProduct(catalogue, sku);
  if (original.depth === null) return [];
  return catalogue.filter((p) => p.formula_id === original.formula_id && p.id !== sku &&
    p.depth !== null && Math.abs(p.depth - depth) <= 1)
    .sort((a, b) => Math.abs((a.depth ?? 0) - depth) - Math.abs((b.depth ?? 0) - depth) ||
      Number(a.undertone !== tone) - Number(b.undertone !== tone) || a.id.localeCompare(b.id))
    .slice(0, max);
}
