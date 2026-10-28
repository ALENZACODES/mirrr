/**
 * The named portrait looks in the browser: the generated copy of
 * api/plumb_api/filters/recipes/portrait.json, checked with the same rules as
 * api/plumb_api/filters/portrait/looks.py (recipe schema, polish at most 0.6, emphasis 0-1,
 * no lightening or geometry op in a default grade, simulation label, names unique and not
 * already a core filter). A hand edit to the generated file is caught here too.
 * Author: John Khan.
 */
import { PORTRAIT_LOOKS } from "../data/generated/portrait-looks.js";
import { catalogue } from "../recipe/registry.js";
import { type Recipe, checkRecipe } from "../recipe/schema.js";
import { op } from "../colour/ops.js";

export const FORMAT = "beljour-portrait-looks/1";
export const POLISH_MAX = 0.6;   // "soften, not erase"; ASSUMED
export const EMPHASIS_MAX = 1;
export const SPARKLE_DENSITY_MAX = 0.4;
export const LIGHTENING_OPS: readonly string[] = ["colour.exposure", "colour.tone", "light.centre"];
export const ID_PREFIX = "PL";

export interface Emphasis { eyes: number; brows: number; lips: number }
export interface Sparkle { density: number; amount: number; seed: number; palette: [number, number, number][] }
export interface LookEntry { polish: number; emphasis: Emphasis; sparkle: Sparkle | null; recipe: Recipe }
export interface PortraitLookData { format: string; author: string; about: string; looks: LookEntry[] }
export interface Look { id: string; name: string; description: string; polish: number; emphasis: Emphasis; sparkle: Sparkle | null; recipe: Recipe }

export function parse(data: PortraitLookData): Look[] {
  if (data.format !== FORMAT) throw new RangeError(`portrait looks: format must be ${FORMAT}`);
  return data.looks.map((e) => ({ id: e.recipe.id, name: e.recipe.name, description: e.recipe.description,
    polish: e.polish, emphasis: e.emphasis, sparkle: e.sparkle, recipe: e.recipe }));
}

export function validate(looks: readonly Look[], coreNames: ReadonlySet<string> =
  new Set(catalogue().recipes.map((r) => r.name.toLocaleLowerCase("en")))): string[] {
  const problems: string[] = [];
  const ids = new Set<string>(), names = new Set<string>(), ranks = new Set<number>();
  for (const look of looks) {
    const where = look.id;
    problems.push(...checkRecipe(look.recipe));
    if (ids.has(look.id)) problems.push(`${where}: id used twice`);
    const key = look.name.toLocaleLowerCase("en");
    if (names.has(key)) problems.push(`${where}: name ${look.name} is used twice`);
    if (ranks.has(look.recipe.rank)) problems.push(`${where}: rank ${look.recipe.rank} is used twice`);
    ids.add(look.id); names.add(key); ranks.add(look.recipe.rank);
    if (!look.id.startsWith(ID_PREFIX)) problems.push(`${where}: portrait look ids start with ${ID_PREFIX}`);
    if (coreNames.has(key)) problems.push(`${where}: name ${look.name} is already a core filter`);
    if (!(look.polish >= 0 && look.polish <= POLISH_MAX)) problems.push(`${where}: polish must be 0-${POLISH_MAX} (soften, not erase)`);
    for (const [part, value] of Object.entries(look.emphasis)) {
      if (!(value >= 0 && value <= EMPHASIS_MAX)) problems.push(`${where}: emphasis ${part} must be 0-${EMPHASIS_MAX}`);
    }
    if (!look.recipe.limits.simulationLabel) problems.push(`${where}: a portrait look is labelled a simulation`);
    if (look.recipe.tab !== "Beauty") problems.push(`${where}: portrait looks sit in the Beauty tab`);
    for (const stage of look.recipe.stages) {
      if (LIGHTENING_OPS.includes(stage.op)) problems.push(`${where}: ${stage.op} lifts skin; it can't be in a default look`);
      else if ((op(stage.op).family as string) === "geometry") problems.push(`${where}: ${stage.op} moves geometry`);
    }
    const s = look.sparkle;
    if (s) {
      if (!(s.density > 0 && s.density <= SPARKLE_DENSITY_MAX && s.amount > 0 && s.amount <= 1)) {
        problems.push(`${where}: sparkle density 0-${SPARKLE_DENSITY_MAX} and amount 0-1`);
      }
      if (!s.palette.length || s.palette.some((c) => c.some((v) => !(Number.isInteger(v) && v >= 0 && v <= 255)))) {
        problems.push(`${where}: sparkle palette is a list of byte colours`);
      }
      if (!(Number.isInteger(s.seed) && s.seed >= 0 && s.seed < 2 ** 31)) problems.push(`${where}: sparkle seed is a 31-bit number`);
    }
  }
  return problems;
}

let shipped: Look[] | null = null;
/** The shipped looks, checked once. */
export function portraitLooks(): readonly Look[] {
  if (!shipped) {
    const looks = parse(PORTRAIT_LOOKS);
    const problems = validate(looks);
    if (problems.length) throw new Error(`portrait looks are invalid: ${problems.join("; ")}`);
    shipped = looks;
  }
  return shipped;
}

export function portraitLook(id: string): Look | null {
  return portraitLooks().find((look) => look.id === id) ?? null;
}
