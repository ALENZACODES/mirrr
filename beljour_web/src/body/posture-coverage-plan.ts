/** Body-set admission coverage plan: strict reader and display for the studio.
 * Reads `beljour-posture-body-coverage-plan/1` from the offline body command and recomputes
 * every derived number from the 60 admitted counts: per-group need (20 minimum), per-view
 * need (600 minimum), the additional-admissions lower bound and the status. Surplus in one
 * group never offsets another's gap. The plan is counts only; measurement stays NOT_RUN.
 * It never changes the photo, the fixes or export readiness. Author: John Khan.
 */
import { BODY_SIZES, EvidenceRefused, MIN_GROUP_BODIES, MONK_TONES } from "./posture-proof.js";
import { MIN_TOTAL_BODIES, MIN_VIEW_BODIES } from "./posture-proof-integrity.js";

export const COVERAGE_FORMAT = "beljour-posture-body-coverage-plan/1";
export const INTERSECTIONS = 60;

export interface CoverageGroup { view: "front" | "side"; body_size: string; monk: string; admitted: number; needed: number }
export interface CoveragePlan {
  run: string;
  admitted: number;
  views: Record<"front" | "side", { admitted: number; needed: number }>;
  groups: CoverageGroup[];
  groupsBelowMinimum: number;
  additionalNeeded: number;
  status: "ADMISSION_MINIMUMS_MET" | "MORE_BODIES_NEEDED";
}

const KEYS = ["format", "run", "minimums", "admitted", "views", "groups", "groups_below_minimum",
  "additional_needed", "status", "measurement_status"];

function exact(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new EvidenceRefused("invalid_coverage_plan");
  const found = Object.keys(value).sort(), wanted = [...keys].sort();
  if (found.length !== wanted.length || found.some((key, i) => key !== wanted[i])) {
    throw new EvidenceRefused("unexpected_coverage_attributes");
  }
  return value as Record<string, unknown>;
}

/** Structural equality of JSON values, independent of object key order. */
function equal(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, i) => equal(item, b[i]));
  }
  if (typeof a === "object" && a !== null && typeof b === "object" && b !== null) {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length &&
      keys.every((key) => Object.hasOwn(b, key) && equal((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
  }
  return a === b;
}

function same(actual: unknown, expected: unknown): void {
  if (!equal(actual, expected)) throw new EvidenceRefused("inconsistent_coverage_plan");
}

export function checkedCoveragePlan(value: unknown): CoveragePlan {
  const raw = exact(value, KEYS);
  if (raw.format !== COVERAGE_FORMAT || raw.measurement_status !== "NOT_RUN") {
    throw new EvidenceRefused("unsupported_coverage_plan");
  }
  if (typeof raw.run !== "string" || !/^[0-9a-f]{64}$/.test(raw.run)) throw new EvidenceRefused("invalid_coverage_binding");
  same(raw.minimums, { per_group: MIN_GROUP_BODIES, per_view: MIN_VIEW_BODIES, total: MIN_TOTAL_BODIES });
  if (!Array.isArray(raw.groups) || raw.groups.length !== INTERSECTIONS) throw new EvidenceRefused("missing_coverage_groups");
  const groups: CoverageGroup[] = [];
  let i = 0;
  for (const view of ["front", "side"] as const) {
    for (const size of BODY_SIZES) {
      for (const tone of MONK_TONES) {
        const entry = exact(raw.groups[i++], ["view", "body_size", "monk", "admitted", "needed"]);
        if (entry.view !== view || entry.body_size !== size || entry.monk !== tone) {
          throw new EvidenceRefused("unregistered_coverage_group");
        }
        const admitted = entry.admitted;
        if (!Number.isSafeInteger(admitted) || (admitted as number) < 0) throw new EvidenceRefused("invalid_coverage_count");
        const group = { view, body_size: size, monk: tone, admitted: admitted as number,
          needed: Math.max(0, MIN_GROUP_BODIES - (admitted as number)) };
        same(entry.needed, group.needed);
        groups.push(group);
      }
    }
  }
  const views = Object.fromEntries((["front", "side"] as const).map((view) => {
    const own = groups.filter((group) => group.view === view);
    const admitted = own.reduce((total, group) => total + group.admitted, 0);
    const need = own.reduce((total, group) => total + group.needed, 0);
    return [view, { admitted, needed: Math.max(need, MIN_VIEW_BODIES - admitted) }];
  })) as CoveragePlan["views"];
  same(raw.views, views);
  const admitted = views.front.admitted + views.side.admitted;
  const additional = Math.max(views.front.needed + views.side.needed, MIN_TOTAL_BODIES - admitted);
  const below = groups.filter((group) => group.needed > 0).length;
  const status = additional === 0 ? "ADMISSION_MINIMUMS_MET" : "MORE_BODIES_NEEDED";
  same([raw.admitted, raw.additional_needed, raw.groups_below_minimum, raw.status], [admitted, additional, below, status]);
  return { run: raw.run, admitted, views, groups, groupsBelowMinimum: below, additionalNeeded: additional, status };
}

export function coveragePlanLines(plan: CoveragePlan | null): string[] {
  if (!plan) return ["Body-set coverage: no plan loaded."];
  const gaps = plan.groups.filter((group) => group.needed > 0);
  const largest = [...gaps].sort((a, b) => b.needed - a.needed).slice(0, 5)
    .map((group) => `${group.view}/${group.body_size}/tone ${group.monk} needs ${group.needed}`);
  return [
    `Locally supplied body-set coverage: ${plan.admitted} admitted; at least ${plan.additionalNeeded} more needed.`,
    `Front ${plan.views.front.admitted} (needs ${plan.views.front.needed}), side ${plan.views.side.admitted} ` +
      `(needs ${plan.views.side.needed}); ${plan.groupsBelowMinimum} of ${INTERSECTIONS} groups below 20.`,
    ...(largest.length ? [`Largest gaps: ${largest.join("; ")}.`] : []),
    "This is a lower bound on admissions, not an estimate of available photos. Measurement: NOT_RUN.",
  ];
}

export interface CoveragePlanHandle {
  readonly element: HTMLElement;
  readonly plan: CoveragePlan | null;
  show(value: unknown): CoveragePlan;
  reset(): void;
  dispose(): void;
}

export function mountCoveragePlan(parent: HTMLElement): CoveragePlanHandle {
  const root = document.createElement("section");
  root.className = "posture-coverage-plan";
  root.setAttribute("aria-label", "Body-set coverage");
  parent.append(root);
  let current: CoveragePlan | null = null;
  const render = (): void => {
    root.replaceChildren(...coveragePlanLines(current).map((line) => {
      const item = document.createElement("p");
      item.textContent = line;
      return item;
    }));
  };
  render();
  return {
    element: root,
    get plan() { return current; },
    show(value: unknown) {
      try {
        current = checkedCoveragePlan(value);
        return current;
      } catch (error) {
        current = null;
        throw error;
      } finally {
        render();
      }
    },
    reset() { current = null; render(); },
    dispose() { root.remove(); },
  };
}
