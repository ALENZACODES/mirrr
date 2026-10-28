/**
 * The Holiday Engine: "what's coming up", with a look for each occasion she follows.
 *
 * - Dates come from the local calendar (calendar.ts); nothing is fetched and nothing leaves the
 *   device. Her choices (region, which occasions to show, Western or Orthodox dates) and which of
 *   her saved looks she keeps for which occasion are stored in this browser only, and every
 *   storage access is guarded: in a private window it all still works for the visit.
 * - Only secular occasions are shown until she chooses more. Cultural and religious occasions
 *   appear only after she ticks them herself: the engine never picks one from her name, face,
 *   photo or anything else about her (the holiday template rules).
 * - The look offered for an occasion is her own saved look if she has kept one for it, otherwise
 *   one of the app's existing looks that suits the light of the occasion. These are ordinary
 *   built looks (skin guard on, never lightening); no holiday-specific template is offered,
 *   because those stay queued until they are reviewed.
 * Author: John Khan.
 */
import type { KeyValueStore } from "../../session.js";
import type { MyLook } from "../my-looks.js";
import { type OccasionInfo, type Occurrence, type Region, isRegion, occasion, occasions, upcoming } from "./calendar.js";

export const PREFS_KEY = "beljour.holiday-prefs";
export const TAGS_KEY = "beljour.look-occasions";
export const PREFS_FORMAT = "beljour-holiday-prefs/1";
export const WINDOW_DAYS = 45;      // the seasonal calendar's own suggestion window
export const SHOWN = 3;             // occasions shown at once on Home; ASSUMED

export type OccasionKind = "secular" | "cultural" | "religious";
/** ASSUMED, pending the curated holiday catalogue's own kind field: anything not plainly secular
 * is treated as cultural or religious, so it is shown only when she chooses it. */
export const KINDS: Readonly<Record<string, OccasionKind>> = Object.freeze({
  halloween: "secular", new_year: "secular", thanksgiving: "secular", kwanzaa: "cultural",
  christmas: "religious", easter: "religious", hanukkah: "religious", eid_al_fitr: "religious",
  eid_al_adha: "religious", diwali: "religious", holi: "religious", vaisakhi: "religious",
  gurpurab: "religious", bandi_chhor_divas: "religious",
});

export interface BuiltInLook { studio: "filters" | "portrait"; id: string; name: string; reason: string; needsFace: boolean }
/** One existing look per occasion, chosen for the light of the day only (no symbols, no claim
 * about what the day means). Names are checked against the catalogues by the tests. ASSUMED. */
export const OCCASION_LOOKS: Readonly<Record<string, BuiltInLook>> = Object.freeze({
  halloween: { studio: "filters", id: "C23", name: "Toulouse", reason: "A moody evening grade.", needsFace: false },
  new_year: { studio: "portrait", id: "PL13", name: "Vence", reason: "An evening look with fine glints.", needsFace: true },
  thanksgiving: { studio: "filters", id: "C30", name: "Périgord", reason: "Warm autumn light.", needsFace: false },
  christmas: { studio: "filters", id: "C40", name: "Uzès", reason: "Warm indoor evening light.", needsFace: false },
  easter: { studio: "filters", id: "C09", name: "Provence", reason: "Soft spring daylight.", needsFace: false },
  kwanzaa: { studio: "filters", id: "C50", name: "Arcachon", reason: "Warm, low-contrast evening light.", needsFace: false },
  hanukkah: { studio: "filters", id: "C107", name: "Croissy", reason: "Soft, warm indoor light.", needsFace: false },
  eid_al_fitr: { studio: "portrait", id: "PL08", name: "Mougins", reason: "Golden warmth with gentle polish.", needsFace: true },
  eid_al_adha: { studio: "portrait", id: "PL02", name: "Amboise", reason: "A classic, gentle portrait.", needsFace: true },
  diwali: { studio: "filters", id: "C02", name: "Biarritz", reason: "Rich warm colour for evening light.", needsFace: false },
  holi: { studio: "filters", id: "C26", name: "Colmar", reason: "Lively daytime colour.", needsFace: false },
  vaisakhi: { studio: "filters", id: "C14", name: "Lyon", reason: "Gentle spring warmth.", needsFace: false },
  gurpurab: { studio: "filters", id: "C55", name: "Bréhat", reason: "Soft, neutral light.", needsFace: false },
  bandi_chhor_divas: { studio: "filters", id: "C33", name: "Royan", reason: "Warm evening colour.", needsFace: false },
});

export class HolidayError extends Error {}

export interface HolidayPrefs {
  format: typeof PREFS_FORMAT;
  region: Region;
  follow: string[];
  variants: Record<string, string>;
}

export function kindOf(id: string): OccasionKind {
  return KINDS[id] ?? "religious";
}

export function defaultPrefs(): HolidayPrefs {
  return { format: PREFS_FORMAT, region: "CA", follow: occasions().filter((o) => kindOf(o.id) === "secular").map((o) => o.id), variants: {} };
}

function knownOccasion(id: unknown): OccasionInfo {
  const info = typeof id === "string" ? occasion(id) : null;
  if (!info) throw new HolidayError("An occasion this app doesn't have");
  return info;
}

export function validatePrefs(raw: unknown): HolidayPrefs {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new HolidayError("Holiday settings are damaged");
  const p = raw as Record<string, unknown>;
  if (p.format !== PREFS_FORMAT) throw new HolidayError("Holiday settings are from another version");
  if (!isRegion(p.region)) throw new HolidayError("Pick a region");
  if (!Array.isArray(p.follow) || p.follow.length > occasions().length) throw new HolidayError("Holiday settings are damaged");
  const follow = [...new Set(p.follow.map((id) => knownOccasion(id).id))];
  if (typeof p.variants !== "object" || p.variants === null || Array.isArray(p.variants)) throw new HolidayError("Holiday settings are damaged");
  const variants: Record<string, string> = {};
  for (const [id, value] of Object.entries(p.variants as Record<string, unknown>)) {
    const info = knownOccasion(id);
    if (typeof value !== "string" || !info.variants.includes(value)) throw new HolidayError(`${info.name} has no such date choice`);
    variants[id] = value;
  }
  return { format: PREFS_FORMAT, region: p.region, follow, variants };
}

/** Her holiday choices, kept in this browser only. */
export class HolidayPrefsStore {
  private current: HolidayPrefs;
  constructor(private readonly store: KeyValueStore | null) {
    this.current = this.read();
  }
  private read(): HolidayPrefs {
    try {
      const raw = this.store?.getItem(PREFS_KEY);
      return raw ? validatePrefs(JSON.parse(raw)) : defaultPrefs();
    } catch { return defaultPrefs(); }
  }
  private write(): void {
    try { this.store?.setItem(PREFS_KEY, JSON.stringify(this.current)); } catch { /* kept for this visit */ }
  }
  get(): HolidayPrefs { return validatePrefs(JSON.parse(JSON.stringify(this.current))); }
  setRegion(region: string): HolidayPrefs {
    if (!isRegion(region)) throw new HolidayError("Pick a region");
    this.current = { ...this.current, region };
    this.write();
    return this.get();
  }
  /** Show or hide an occasion; only ever called from her own tick or untick. */
  follow(id: string, on: boolean): HolidayPrefs {
    const info = knownOccasion(id);
    const rest = this.current.follow.filter((x) => x !== info.id);
    this.current = { ...this.current, follow: on ? [...rest, info.id] : rest };
    this.write();
    return this.get();
  }
  setVariant(id: string, variant: string): HolidayPrefs {
    const info = knownOccasion(id);
    this.current = validatePrefs({ ...this.current, variants: { ...this.current.variants, [info.id]: variant } });
    this.write();
    return this.get();
  }
  reset(): HolidayPrefs {
    this.current = defaultPrefs();
    try { this.store?.removeItem(PREFS_KEY); } catch { /* nothing stored */ }
    return this.get();
  }
}

const LOOK_ID = /^look-[0-9a-f]{8}$/;

/** Which saved look she keeps for which occasion (look id -> occasion id), in this browser only. */
export class OccasionTags {
  private tags: Record<string, string>;
  constructor(private readonly store: KeyValueStore | null) {
    this.tags = this.read();
  }
  private read(): Record<string, string> {
    try {
      const raw = JSON.parse(this.store?.getItem(TAGS_KEY) ?? "{}") as unknown;
      if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
      return Object.fromEntries(Object.entries(raw as Record<string, unknown>)
        .filter(([id, o]) => LOOK_ID.test(id) && typeof o === "string" && occasion(o) !== null)) as Record<string, string>;
    } catch { return {}; }
  }
  private write(): void {
    try { this.store?.setItem(TAGS_KEY, JSON.stringify(this.tags)); } catch { /* kept for this visit */ }
  }
  of(lookId: string): string | null { return this.tags[lookId] ?? null; }
  tag(lookId: string, occasionId: string): void {
    if (!LOOK_ID.test(lookId)) throw new HolidayError("That look id is damaged");
    this.tags = { ...this.tags, [lookId]: knownOccasion(occasionId).id };
    this.write();
  }
  untag(lookId: string): void {
    const { [lookId]: _gone, ...rest } = this.tags;
    this.tags = rest;
    this.write();
  }
  /** Drop tags whose look she has since removed; returns how many went. */
  prune(looks: readonly MyLook[]): number {
    const ids = new Set(looks.map((l) => l.id));
    const before = Object.keys(this.tags).length;
    this.tags = Object.fromEntries(Object.entries(this.tags).filter(([id]) => ids.has(id)));
    if (Object.keys(this.tags).length !== before) this.write();
    return before - Object.keys(this.tags).length;
  }
  /** Her looks kept for an occasion, newest first. */
  looksFor(occasionId: string, looks: readonly MyLook[]): MyLook[] {
    return looks.filter((l) => this.tags[l.id] === occasionId).sort((a, b) => b.created.localeCompare(a.created));
  }
}

export type Suggestion =
  | { source: "saved"; lookId: string; name: string; reason: string; hash: string }
  | { source: "built-in"; studio: BuiltInLook["studio"]; id: string; name: string; reason: string; needsFace: boolean; hash: string };

export interface ComingUp {
  occurrence: Occurrence;
  daysUntil: number;
  underWay: boolean;
  kind: OccasionKind;
  /** Plain note when the date comes from a table row nobody has checked yet. */
  dateNote: string;
  suggestion: Suggestion;
}

const TRY = /^try=(filters|portrait):([A-Z]{1,2}\d{1,3})$/;

/** The studio hash that adds one built look as a layer: try=filters:C40, try=portrait:PL13. */
export function tryHash(studio: BuiltInLook["studio"], id: string): string {
  const hash = `try=${studio}:${id}`;
  if (!TRY.test(hash)) throw new HolidayError("That look id is damaged");
  return hash;
}

export function parseTry(value: string): { studio: BuiltInLook["studio"]; id: string } | null {
  const m = TRY.exec(value);
  return m ? { studio: m[1] as BuiltInLook["studio"], id: m[2] } : null;
}

export function suggestionFor(occasionId: string, looks: readonly MyLook[], tags: OccasionTags): Suggestion {
  const own = tags.looksFor(occasionId, looks)[0];
  if (own) return { source: "saved", lookId: own.id, name: own.name, reason: "Your own look for this day.", hash: `look=${own.id}` };
  const built = OCCASION_LOOKS[occasionId];
  if (!built) throw new HolidayError(`No look is set for ${occasionId}`);
  return { source: "built-in", studio: built.studio, id: built.id, name: built.name, reason: built.reason,
    needsFace: built.needsFace, hash: tryHash(built.studio, built.id) };
}

/** What's coming up for her: the occasions she follows, soonest first, each with a look. */
export function comingUp(today: string, prefs: HolidayPrefs, looks: readonly MyLook[], tags: OccasionTags,
  limit: number = SHOWN): ComingUp[] {
  const p = validatePrefs(prefs);
  return upcoming(today, p.region, p.follow, WINDOW_DAYS, p.variants).slice(0, limit).map((u) => ({
    ...u, kind: kindOf(u.occurrence.occasion),
    dateNote: u.occurrence.verified ? "" : "This date comes from a table that hasn't been checked yet; it can differ where you are.",
    suggestion: suggestionFor(u.occurrence.occasion, looks, tags) }));
}
