/** Photo-free SKN-03 accounting and skin-reference inventory coverage.
 * Mirrors api/plumb_api/engines/shade/readiness.py. SKN-03: repeat-capture stability,
 * same session and light, same tone and undertone, at least 95% stable. A case is stable
 * only when every repeat was measured and all agree on W6 depth band and undertone.
 * Refused or unmeasured repeats keep the case in the denominator; the target is the
 * exact integer ceil(95 * N / 100); without independent labels, a compatible baseline
 * and human review the status stays UNPROVEN, and release_pass is always false. Group
 * labels come only from the caller, never from colour. Author: John Khan.
 */
import { delta_e } from "./distance.js";
import type { ShadeResult } from "./finder.js";
import { loadShadeCatalogue, type ShadeKind } from "./loaders.js";

export const SKN03_TARGET = 0.95;
const TARGET_NUMERATOR = 95, TARGET_DENOMINATOR = 100;
export const MAX_CASES = 100_000;
export const MAX_REPEATS = 50;
export const UNKNOWN_GROUP = "unknown";
/** Same "too close to tell apart" rule as the hair palette (CIEDE2000 below 1.0). */
export const DISTINGUISHABLE_DELTA_E = 1.0;
const UNDERTONES = ["cool", "neutral", "warm", "olive"] as const;
const CASE_ID = /^[A-Za-z0-9_.:-]{1,64}$/;
const GROUP = /^[A-Za-z0-9][A-Za-z0-9 _.+-]{0,31}$/;

export type SKNStatus = "BELOW_TARGET" | "UNPROVEN" | "BOX_REVIEW_REQUIRED";
export type Reading = readonly [number, string] | null;

export interface SkinCheckCase {
  readonly case_id: string;
  readonly group: string;
  readonly readings: readonly Reading[];
  readonly measured: boolean;
  readonly stable: boolean;
}

export interface SKN03Report {
  readonly format: "beljour-skn03-readiness/1";
  readonly check: "SKN-03";
  readonly definition: string;
  readonly total: number; readonly stable: number; readonly unstable: number; readonly unmeasured: number;
  readonly rate: number; readonly target: number;
  readonly minimum_stable: number; readonly additional_required: number;
  readonly groups: Readonly<Record<string, { total: number; stable: number }>>;
  readonly independent_labels: boolean; readonly compatible_baseline: boolean; readonly human_review: boolean;
  readonly status: SKNStatus;
  readonly release_pass: false;
}

export interface SKN03Evidence { independentLabels?: boolean; compatibleBaseline?: boolean; humanReview?: boolean }

const round = (v: number, d: number) => { const s = 10 ** d; return Math.round(v * s) / s; };

function reading(value: unknown): Reading {
  if (value === null) return null;
  if (!Array.isArray(value) || value.length !== 2) throw new RangeError("A repeat is [depth band, undertone] or null");
  const [band, undertone] = value;
  if (!Number.isInteger(band) || band < 1 || band > 10 || !(UNDERTONES as readonly unknown[]).includes(undertone)) {
    throw new RangeError("A repeat needs a 1..10 depth band and a known undertone");
  }
  return Object.freeze([band as number, undertone as string] as const);
}

/** A checked, frozen SKN-03 case. `null` marks a refused or unmeasured repeat. */
export function skinCheckCase(caseId: string, readings: readonly unknown[], group: string = UNKNOWN_GROUP): SkinCheckCase {
  if (typeof caseId !== "string" || !CASE_ID.test(caseId)) throw new RangeError("Case id must be 1-64 letters, digits or _ . : -");
  if (typeof group !== "string" || !GROUP.test(group)) throw new RangeError("Group label must be 1-32 plain characters");
  if (!Array.isArray(readings) || readings.length < 2 || readings.length > MAX_REPEATS) {
    throw new RangeError(`A repeat-capture case needs 2..${MAX_REPEATS} readings`);
  }
  const rows = Object.freeze(readings.map(reading));
  const measured = rows.every((r) => r !== null);
  const stable = measured && new Set(rows.map((r) => `${r![0]}|${r![1]}`)).size === 1;
  return Object.freeze({ case_id: caseId, group, readings: rows, measured, stable });
}

type ResultLike = Pick<ShadeResult, "refused" | "depth_band"> & { undertone: { undertone: string } | null };

/** A refused W6 result counts as not measured, even when it carries a Lab estimate (ASSUMED). */
function fromResult(result: ResultLike): Reading {
  if (result === null || typeof result !== "object") throw new RangeError("Expected a W6 shade result");
  if (result.refused !== false || result.depth_band === null || result.undertone === null ||
      typeof result.undertone !== "object") return null;
  return reading([result.depth_band, result.undertone.undertone]);
}

/** Build one SKN-03 case from the repeated W6 results of a single capture session. */
export function caseFromShade(caseId: string, results: readonly ResultLike[], options: { group?: string } = {}): SkinCheckCase {
  if (!Array.isArray(results)) throw new RangeError("Expected a sequence of W6 shade results");
  return skinCheckCase(caseId, results.map(fromResult), options.group ?? UNKNOWN_GROUP);
}

/** Count stable cases against the frozen 95% target; every case stays in the total. */
export function measureSKN03(cases: readonly SkinCheckCase[], evidence: SKN03Evidence = {}): SKN03Report {
  if (!Array.isArray(cases) || cases.length < 1 || cases.length > MAX_CASES) {
    throw new RangeError(`SKN-03 needs 1..${MAX_CASES} checked cases`);
  }
  const rows = cases.map((c) => skinCheckCase(c.case_id, c.readings, c.group));
  if (new Set(rows.map((c) => c.case_id)).size !== rows.length) throw new RangeError("Each SKN-03 case may be counted once");
  const { independentLabels = false, compatibleBaseline = false, humanReview = false } = evidence;
  if (![independentLabels, compatibleBaseline, humanReview].every((f) => typeof f === "boolean")) {
    throw new RangeError("Evidence flags must be booleans");
  }
  const tallies = new Map<string, { total: number; stable: number }>();
  for (const c of rows) {
    const t = tallies.get(c.group) ?? { total: 0, stable: 0 };
    t.total += 1;
    t.stable += c.stable ? 1 : 0;
    tallies.set(c.group, t);
  }
  const groups: Record<string, { total: number; stable: number }> = {};
  for (const name of [...tallies.keys()].sort()) groups[name] = Object.freeze(tallies.get(name)!);
  const total = rows.length, stable = rows.filter((c) => c.stable).length;
  const minimum = Math.floor((TARGET_NUMERATOR * total + TARGET_DENOMINATOR - 1) / TARGET_DENOMINATOR);
  const additional = Math.max(0, minimum - stable);
  const status: SKNStatus = additional > 0 ? "BELOW_TARGET"
    : independentLabels && compatibleBaseline && humanReview ? "BOX_REVIEW_REQUIRED" : "UNPROVEN";
  return Object.freeze({
    format: "beljour-skn03-readiness/1" as const, check: "SKN-03" as const,
    definition: "Repeat-capture stability: same session, same light - same tone and undertone",
    total, stable, unstable: total - stable, unmeasured: rows.filter((c) => !c.measured).length,
    rate: round(stable / total, 6), target: SKN03_TARGET, minimum_stable: minimum, additional_required: additional,
    groups: Object.freeze(groups), independent_labels: independentLabels, compatible_baseline: compatibleBaseline,
    human_review: humanReview, status, release_pass: false as const,
  });
}

export interface ReferenceCoverage {
  readonly format: "beljour-reference-inventory/1";
  readonly kind: ShadeKind;
  readonly total: number;
  readonly cells: readonly { depth_band: number; undertone: string; count: number }[];
  readonly missing: readonly { depth_band: number; undertone: string }[];
  readonly min_separation: number;
  readonly close_pairs: readonly { first: string; second: string; delta_e: number }[];
  readonly cross_undertone_neighbours: number;
  readonly note: string;
}

const byCode = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Audit a skin catalogue: cell counts, nearest-neighbour separation and undertone borders. */
export function checkReferenceCoverage(kind: ShadeKind = "reference"): ReferenceCoverage {
  const records = loadShadeCatalogue(kind).records;
  if (records.some((r) => r.surface !== "skin")) throw new RangeError("Reference coverage is defined for skin catalogues only");
  const cells: { depth_band: number; undertone: string; count: number }[] = [];
  for (let band = 1; band <= 10; band++) {
    for (const tone of UNDERTONES) {
      cells.push({ depth_band: band, undertone: tone,
        count: records.filter((r) => r.level === band && r.undertone === tone).length });
    }
  }
  let minimum = Infinity, crossing = 0;
  const close: { first: string; second: string; delta_e: number }[] = [];
  records.forEach((first, i) => {
    let best: { d: number; id: string; tone: string } | null = null;
    records.forEach((other, j) => {
      if (i === j) return;
      const d = delta_e(first.lab, other.lab);
      if (best === null || d < best.d || (d === best.d && (other.id < best.id ||
          (other.id === best.id && other.undertone < best.tone)))) best = { d, id: other.id, tone: other.undertone };
      if (d < DISTINGUISHABLE_DELTA_E && first.id < other.id) close.push({ first: first.id, second: other.id, delta_e: d });
    });
    const found = best as { d: number; id: string; tone: string } | null;
    if (found === null) throw new RangeError("Reference coverage needs at least two references");
    minimum = Math.min(minimum, found.d);
    if (found.tone !== first.undertone) crossing += 1;
  });
  close.sort((a, b) => a.delta_e - b.delta_e || byCode(a.first, b.first) || byCode(a.second, b.second));
  return Object.freeze({
    format: "beljour-reference-inventory/1" as const, kind, total: records.length, cells,
    missing: cells.filter((c) => c.count === 0).map((c) => ({ depth_band: c.depth_band, undertone: c.undertone })),
    min_separation: round(minimum, 4),
    close_pairs: close.map((p) => ({ ...p, delta_e: round(p.delta_e, 4) })),
    cross_undertone_neighbours: crossing,
    note: "In-house cosmetic references; not a physical product catalogue.",
  });
}
