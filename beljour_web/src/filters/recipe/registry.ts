/**
 * The filter catalogue in the browser: the generated copy of the Python recipes, ranked.
 * Python is the source (api/plumb_api/filters/recipes/*.json); `make filters-data` fails if
 * the generated file is stale. Strip order is the §2.22 rank (unique, so it never shuffles).
 * Author: John Khan.
 */
import { CATALOGUE } from "../data/generated/recipes.js";
import { type Addon, type CatalogueData, type Recipe, type Tab, checkCatalogue } from "./schema.js";

export class FilterCatalogue {
  readonly recipes: readonly Recipe[];
  readonly addons: ReadonlyMap<string, Addon>;
  private readonly byId: ReadonlyMap<string, Recipe>;
  constructor(readonly data: CatalogueData) {
    this.recipes = [...data.recipes].sort((a, b) => a.rank - b.rank || (a.id < b.id ? -1 : 1));
    this.byId = new Map(this.recipes.map((r) => [r.id, r]));
    this.addons = new Map(data.addons.map((a) => [a.id, a]));
  }
  has(id: string): boolean { return this.byId.has(id); }
  get(id: string): Recipe {
    const r = this.byId.get(id);
    if (!r) throw new RangeError(`no filter ${JSON.stringify(id)}`);
    return r;
  }
  ids(): string[] { return this.recipes.map((r) => r.id); }
  tabs(): Tab[] {
    const out: Tab[] = [];
    for (const r of this.recipes) if (!out.includes(r.tab)) out.push(r.tab);
    return out;
  }
  inTab(tab: Tab): Recipe[] { return this.recipes.filter((r) => r.tab === tab); }
  forRound(round: string): Recipe[] { return this.recipes.filter((r) => r.round === round); }
  problems(): string[] { return checkCatalogue(this.data); }
}

let shipped: FilterCatalogue | null = null;
/** The shipped catalogue (built once). */
export function catalogue(): FilterCatalogue {
  if (!shipped) {
    const problems = checkCatalogue(CATALOGUE);
    if (problems.length) throw new Error(`Invalid filter catalogue: ${problems.join("; ")}`);
    shipped = new FilterCatalogue(CATALOGUE);
  }
  return shipped;
}
