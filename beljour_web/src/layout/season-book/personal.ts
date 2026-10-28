/** Private, in-memory Season Book evidence and Lane F matching boundary.
 * A match exists only when the public mapping port returns a validated reason.
 * No undertone, tone preference or photographic trait is inferred. Author: John Khan.
 */
import type { MyLook } from "../my-looks.js";
import type { SeasonBook, SeasonLook } from "./contracts.js";
import { SeasonContractError } from "./contracts.js";

export const PERSONAL_FORMAT = "beljour-season-personal/1" as const;
export const MATCH_FORMAT = "beljour-season-match/1" as const;

export interface ShadeObservation {
  shadeId: string;
  observedOn: string;
  source: "user-chosen" | "lane-f-record";
}

export interface UndertoneProfile {
  profileId: string;
  undertone: "warm" | "cool" | "neutral" | "olive" | "unclassified";
  source: "user-confirmed" | "lane-f-mapping";
  confirmed: boolean;
}

export interface SavedLookEvidence {
  id: string;
  kinds: readonly string[];
  shades: readonly string[];
}

export interface PersonalEvidence {
  format: typeof PERSONAL_FORMAT;
  seasonId: string;
  savedLooks: readonly SavedLookEvidence[];
  shadeHistory: readonly ShadeObservation[];
  undertone: UndertoneProfile | null;
}

export interface SeasonalMatch {
  lookId: string;
  toneId: string;
  fit: "recommended" | "explore";
  reason: string;
}

export interface SeasonalMatches {
  format: typeof MATCH_FORMAT;
  seasonId: string;
  mappingProvider: "lane-f";
  mappingVersion: string;
  matchedProfileId: string;
  matches: readonly SeasonalMatch[];
}

const SHADE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{1,39}$/;
const EVIDENCE_ID = /^[a-zA-Z0-9][a-zA-Z0-9-]{2,63}$/;
const MAPPING_VERSION = /^[a-z0-9][a-z0-9._-]{0,47}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const REASON = /^[^\x00-\x1f\x7f]{8,160}$/;
const KINDS = new Set([
  "enhance", "hair-fibre", "beard", "posture", "filters", "lighting",
  "recolour", "balayage", "older", "younger", "gender",
]);
const SHADE_KEYS = ["shade_id", "shade_ref", "selected_shade", "tone_id"];

function object(value: unknown, name: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new SeasonContractError("personal_shape", `${name} must be an object`);
  }
  return value as Record<string, unknown>;
}

function boundedArray(value: unknown, name: string, limit: number): unknown[] {
  if (!Array.isArray(value) || value.length > limit) {
    throw new SeasonContractError("personal_array", `${name} must be bounded`);
  }
  return value;
}

function safeId(value: unknown, name: string): string {
  if (typeof value !== "string" || !EVIDENCE_ID.test(value)) {
    throw new SeasonContractError("personal_id", `${name} is invalid`);
  }
  return value;
}

function shade(value: unknown): string {
  if (typeof value !== "string" || !SHADE_ID.test(value)) {
    throw new SeasonContractError("shade_id", "Shade must have a catalogue identifier");
  }
  return value;
}

export function savedLookEvidence(looks: readonly MyLook[]): SavedLookEvidence[] {
  if (looks.length > 24) {
    throw new SeasonContractError("looks_count", "Too many saved looks");
  }
  return looks.map((look) => {
    const id = safeId(look.id, "saved look id");
    const kinds: string[] = [];
    const shades: string[] = [];
    for (const step of look.steps) {
      if (!KINDS.has(step.kind)) {
        continue;
      }
      kinds.push(step.kind);
      for (const key of SHADE_KEYS) {
        const value = step.params[key];
        if (value === undefined) {
          continue;
        }
        try {
          shades.push(shade(value));
        } catch {
          // Unknown historic settings are ignored, never interpreted as a tone.
        }
      }
    }
    return { id, kinds: [...new Set(kinds)], shades: [...new Set(shades)] };
  });
}

export function validateShadeHistory(value: unknown): ShadeObservation[] {
  return boundedArray(value, "shade history", 48).map((item) => {
    const raw = object(item, "shade observation");
    if (Object.keys(raw).some((key) => !["shadeId", "observedOn", "source"].includes(key))) {
      throw new SeasonContractError("shade_history", "Unknown shade history field");
    }
    const shadeId = shade(raw.shadeId);
    if (typeof raw.observedOn !== "string" || !DAY.test(raw.observedOn)) {
      throw new SeasonContractError("shade_date", "A shade observation needs its date");
    }
    const date = new Date(`${raw.observedOn}T12:00:00Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw.observedOn) {
      throw new SeasonContractError("shade_date", "Invalid shade observation day");
    }
    if (raw.source !== "user-chosen" && raw.source !== "lane-f-record") {
      throw new SeasonContractError("shade_source", "A shade observation needs provenance");
    }
    return { shadeId, observedOn: raw.observedOn, source: raw.source };
  });
}

export function validateUndertone(value: unknown): UndertoneProfile | null {
  if (value === null) {
    return null;
  }
  const raw = object(value, "undertone profile");
  if (Object.keys(raw).sort().join(",") !== "confirmed,profileId,source,undertone") {
    throw new SeasonContractError("profile_shape", "Unknown or missing profile field");
  }
  const profileId = safeId(raw.profileId, "profile id");
  if (!["warm", "cool", "neutral", "olive", "unclassified"].includes(String(raw.undertone))) {
    throw new SeasonContractError("undertone", "Unknown undertone category");
  }
  if (raw.source !== "user-confirmed" && raw.source !== "lane-f-mapping") {
    throw new SeasonContractError("profile_source", "Profile source must be explicit");
  }
  if (raw.confirmed !== true && raw.confirmed !== false) {
    throw new SeasonContractError("profile_consent", "Profile confirmation must be explicit");
  }
  return {
    profileId,
    undertone: raw.undertone as UndertoneProfile["undertone"],
    source: raw.source,
    confirmed: raw.confirmed,
  };
}

export function personalEvidence(
  book: SeasonBook,
  savedLooks: readonly MyLook[],
  shadeHistory: unknown,
  undertone: unknown,
): PersonalEvidence {
  return {
    format: PERSONAL_FORMAT,
    seasonId: book.seasonId,
    savedLooks: savedLookEvidence(savedLooks),
    shadeHistory: validateShadeHistory(shadeHistory),
    undertone: validateUndertone(undertone),
  };
}

export function validateSeasonMatches(value: unknown, book: SeasonBook, evidence: PersonalEvidence): SeasonalMatches {
  const raw = object(value, "season matching result");
  const expected = "format,mappingProvider,mappingVersion,matchedProfileId,matches,seasonId";
  if (Object.keys(raw).sort().join(",") !== expected) {
    throw new SeasonContractError("match_shape", "Matching result contains unknown or missing fields");
  }
  if (raw.format !== MATCH_FORMAT || raw.mappingProvider !== "lane-f" || raw.seasonId !== book.seasonId) {
    throw new SeasonContractError("mapping_provider", "Result must belong to Lane F and the active season");
  }
  if (!evidence.undertone?.confirmed || raw.matchedProfileId !== evidence.undertone.profileId) {
    throw new SeasonContractError("profile_mismatch", "Matching result does not belong to the confirmed profile");
  }
  if (typeof raw.mappingVersion !== "string" || !MAPPING_VERSION.test(raw.mappingVersion)) {
    throw new SeasonContractError("mapping_version", "Missing versioned Lane F mapping");
  }
  const visibleLooks = new Map<string, SeasonLook>(book.looks.map((item) => [item.id, item]));
  const matches = boundedArray(raw.matches, "matches", 12).map((item) => {
    const match = object(item, "match");
    if (Object.keys(match).sort().join(",") !== "fit,lookId,reason,toneId") {
      throw new SeasonContractError("match_fields", "A match must have four exact fields");
    }
    const lookId = safeId(match.lookId, "matched look");
    const selected = visibleLooks.get(lookId);
    const toneId = shade(match.toneId);
    if (!selected || selected.release !== "reviewed" || !selected.toneIds.includes(toneId)) {
      throw new SeasonContractError(
        "match_reference",
        "Personal match must reference a reviewed look and its listed tone",
      );
    }
    if (match.fit !== "recommended" && match.fit !== "explore") {
      throw new SeasonContractError("match_fit", "Unknown Lane F match category");
    }
    if (typeof match.reason !== "string" || !REASON.test(match.reason) || match.reason.trim() !== match.reason) {
      throw new SeasonContractError("match_reason", "Lane F must supply one plain, bounded reason");
    }
    return { lookId, toneId, fit: match.fit as SeasonalMatch["fit"], reason: match.reason };
  });
  if (new Set(matches.map((item) => `${item.lookId}|${item.toneId}`)).size !== matches.length) {
    throw new SeasonContractError("duplicate_match", "A tone can appear once per look");
  }
  return {
    format: MATCH_FORMAT,
    seasonId: book.seasonId,
    mappingProvider: "lane-f",
    mappingVersion: raw.mappingVersion,
    matchedProfileId: evidence.undertone.profileId,
    matches,
  };
}
