/** Offline Hair Studio catalogue, selectors and provenance: *not* provider output.
 * A browser never fetches the catalogue or adds a new synthetic template ID to a
 * live request. R11 may activate only IDs from a genuinely reviewed S1 manifest.
 * Clean-room UI metadata; no reused third-party thumbnails or filter names.
 * Author: John Khan.
 */
import { HAIR_DATA } from "./generated/catalogue.js";

export const HAIR_GROUPS = HAIR_DATA.groups;
export const HAIR_STYLES = HAIR_DATA.styles;
export const HAIR_CATALOGUE_FORMAT = HAIR_DATA.format;
export const DEFAULT_HAIR_STRENGTH = 30;
export const HAIR_TEXTURES = ["straight", "wavy", "curly", "coily"] as const;
export const HAIR_LENGTHS = ["short", "medium", "long"] as const;
export const HAIR_GRID_SIZES = [4, 9] as const;
export type HairTexture = typeof HAIR_TEXTURES[number];
export type HairLength = typeof HAIR_LENGTHS[number];
export type HairStyle = typeof HAIR_STYLES[number];
export type HairGroup = typeof HAIR_GROUPS[number]["id"];
export type HairSource = "synthetic-s1" | "inspiration";
export type StylingAdjunct = "bangs" | "curl" | "extension" | "volume";
export type HairRoute = "demo" | "live";
export type HairStep = "catalogue" | "reference" | "adjust" | "variants" | "result";

export interface HairQuery {
  group: HairGroup | "all";
  texture: HairTexture | "all";
  length: HairLength | "all";
  term: string;
  source: HairSource | "all";
  favouritesOnly: boolean;
}

export interface HairSelection {
  styleId: string;
  strength: number;
  adjuncts: Readonly<Record<StylingAdjunct, number>>;
  keepColour: boolean;
  variantCount: 4 | 9;
  /** A user-selected reference; actual bytes stay in memory until they choose to upload. */
  reference: HairReference | null;
  /** Explicit opt-in. Never inferred from a file selection. */
  referenceRights: boolean;
}
export interface HairReference {
  fileName: string;
  mime: string;
  size: number;
  localPreview: string;
}
export interface HairPaletteGroup {
  name: HairGroup;
  title: string;
  count: number;
  description: string;
}
export interface HairCatalogueSummary {
  total: number;
  s1Synthetic: number;
  concepts: number;
  verifiedLive: number;
  shortSides: number;
  shortStyles: number;
}
export const DEFAULT_QUERY: HairQuery = {
  group: "all", texture: "all", length: "all", term: "", source: "all", favouritesOnly: false,
};

export function styleById(id: string): HairStyle | null {
  return HAIR_STYLES.find((row) => row.id === id) ?? null;
}

export function clampStrength(raw: number): number {
  if (!Number.isFinite(raw)) throw new RangeError("Hair strength must be finite");
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function defaultSelection(styleId = "tpl-bob"): HairSelection {
  if (!styleById(styleId)) throw new RangeError("Choose a known hair style");
  return { styleId, strength: DEFAULT_HAIR_STRENGTH,
    adjuncts: { bangs: 0, curl: 0, extension: 0, volume: 0 },
    keepColour: true, variantCount: 4, reference: null, referenceRights: false };
}

/** Every catalogue row is either a synthetic S1 item or an authored inspiration.
 * Deliberately no ``canApplyLive`` source flag: it must come from a separate real
 * S1 manifest after the operator verifies actual provider availability.
 */
export function liveTemplateId(styleId: string, verifiedIds: ReadonlySet<string>): string | null {
  const item = styleById(styleId);
  if (!item || item.source !== "synthetic-s1" || !item.template_id) return null;
  return verifiedIds.has(item.template_id) ? item.template_id : null;
}

export function sourceLabel(row: HairStyle): string {
  return row.source === "synthetic-s1"
    ? "S1 synthetic catalogue — live template unverified"
    : "Cut idea only — no YouCam template or rendered result";
}

export function filteredStyles(query: HairQuery, favourites: ReadonlySet<string> = new Set()): HairStyle[] {
  const term = query.term.trim().toLocaleLowerCase();
  if (term.length > 80) throw new RangeError("Hair search may be at most 80 characters");
  return HAIR_STYLES.filter((row) => {
    if (query.group !== "all" && row.group !== query.group) return false;
    if (query.texture !== "all" && !(row.textures as readonly string[]).includes(query.texture)) return false;
    if (query.length !== "all" && !(row.lengths as readonly string[]).includes(query.length)) return false;
    if (query.source !== "all" && row.source !== query.source) return false;
    if (query.favouritesOnly && !favourites.has(row.id)) return false;
    return !term || `${row.name} ${row.description} ${row.tags.join(" ")}`.toLocaleLowerCase().includes(term);
  });
}

export function groupedStyles(query: HairQuery, favourites: ReadonlySet<string> = new Set()): {
  group: typeof HAIR_GROUPS[number]; items: HairStyle[];
}[] {
  const rows = filteredStyles(query, favourites);
  return HAIR_GROUPS.map((group) => ({ group, items: rows.filter((row) => row.group === group.id) }))
    .filter(({ items }) => items.length > 0);
}

export function catalogueSummary(): HairCatalogueSummary {
  return { total: HAIR_STYLES.length,
    s1Synthetic: HAIR_STYLES.filter((row) => row.source === "synthetic-s1").length,
    concepts: HAIR_STYLES.filter((row) => row.source === "inspiration").length,
    verifiedLive: 0,
    shortSides: HAIR_STYLES.filter((row) => row.group === "short-sides").length,
    shortStyles: HAIR_STYLES.filter((row) => (row.lengths as readonly string[]).includes("short")).length };
}

export function groupCounts(): HairPaletteGroup[] {
  return HAIR_GROUPS.map((row) => ({ name: row.id, title: row.title,
    count: HAIR_STYLES.filter((item) => item.group === row.id).length, description: row.detail }));
}

/** A user-facing recommendation is based on cut goals, not measured attractiveness.
 * Favourites and equal access mean a cut is never restricted to a gender.
 */
export function recommendedStyles(preferences: { length: HairLength | "any"; texture: HairTexture | "any";
    shortSides: boolean; occasion: boolean }, limit = 6): HairStyle[] {
  const rows = HAIR_STYLES.map((style) => {
    let score = 0;
    if (preferences.length !== "any" && (style.lengths as readonly string[]).includes(preferences.length)) score += 5;
    if (preferences.texture !== "any" && (style.textures as readonly string[]).includes(preferences.texture)) score += 5;
    if (preferences.shortSides && style.group === "short-sides") score += 6;
    if (preferences.occasion && style.group === "formal") score += 6;
    if (style.source === "synthetic-s1") score += 1; // narrower claim, not better visual quality
    return { style, score };
  });
  rows.sort((a, b) => b.score - a.score || a.style.name.localeCompare(b.style.name));
  return rows.slice(0, Math.max(0, Math.min(20, Math.trunc(limit)))).map((x) => x.style);
}

export function guardCatalogue(): string[] {
  const issues: string[] = [], ids = new Set<string>();
  if (HAIR_CATALOGUE_FORMAT !== "beljour-hair-catalogue/1") issues.push("Version mismatch");
  for (const style of HAIR_STYLES) {
    if (ids.has(style.id)) issues.push(`Duplicate id ${style.id}`);
    ids.add(style.id);
    if (!HAIR_GROUPS.some((g) => g.id === style.group)) issues.push(`Unknown group: ${style.id}`);
    if (style.source === "inspiration" && (style as { template_id: string | null }).template_id !== null) issues.push(`Unverified provider id ${style.id}`);
    if (style.source === "synthetic-s1" && String(style.template_id) !== String(style.id)) issues.push("Bad S1 link");
    if (!String(style.name).trim() || !String(style.description).trim()) issues.push("Empty copy");
  }
  return issues;
}
