/** Shapes returned by the BELJOUR API (CONTRACTS.md). Kept in one file so extensions can import them. */

export type Source = "live" | "cache" | "demo" | "local";

/** Where a result came from. The badge renders from this (ui/provenance.ts). */
export interface Provenance {
  source: "live" | "recorded" | "local";
  provider: "youcam" | "local" | "retired";
  endpoint: string | null;
  endpoint_version: string | null;
  pipeline_version: string;
  units: number;
  cache_hit: boolean;
  synthetic: boolean;
  created: string | null;
  badge: string;
  simulation: boolean;
}

export interface ResultMeta {
  source: Source;
  units_spent: number;
  synthetic?: boolean;
  /** Added in round 1; older cached replies may not have it. */
  provenance?: Provenance;
  /** Added in round 3 (fixture meta v2): what made the result, even without `provenance`. */
  endpoint?: string | null;
  lifecycle?: "active" | "retired";
}

export interface SessionStatus {
  session: string;
  anonymous: boolean;
  judge: boolean;
  spent: number;
  cap: number | null;
  remaining: number | null;
  kill_switch: boolean;
  daily_cap: number;
  spent_today: number;
}

/** Signed by the server; handed back after a restart. Never edit one. */
export interface TaskTicket {
  request_key: string;
  task_id: string;
  feature: string;
  version: string;
  owner: string;
  units: number;
  sig: string;
  v: number;
}

export interface TaskStart {
  status: "done" | "running";
  request_key: string;
  ticket: TaskTicket | null;
}

export interface TaskStatus extends Partial<ResultMeta> {
  request_key: string;
  status: "done" | "running" | "unknown" | "expired" | "failed" | "ambiguous";
  feature?: string;
  image?: string;
  error?: string;
}

export interface TaskResumeStatus {
  request_key: string;
  status: "done" | "running" | "rejected" | "offline" | "failed" | "ambiguous" | "expired";
  reason?: string;
  error?: string;
}

export interface StylingScope {
  live: boolean;
  styling_flag: boolean;
  legacy_flag: boolean;
  styling: Record<string, boolean>;
  legacy: Record<string, boolean>;
  undecided: string[];
  actions: string[];
}

export interface Photo {
  photo_id: string;
  width: number;
  height: number;
  sample: boolean;
}

export interface ConcernScore {
  concern: string;
  label: string;
  what: string;
  raw_score: number;
  ui_score: number;
  band: string;
  has_mask: boolean;
  habits: string[];
  see_pro: string | null;
}

export interface RoutineStep {
  id: string;
  name: string;
  why: string;
  for: string[];
  caution: string;
}

export interface SkinResult extends ResultMeta {
  scores: ConcernScore[];
  overall: number | null;
  skin_age: number | null;
  skin_type: string | null;
  routine: {
    focus: string[];
    morning: RoutineStep[];
    evening: RoutineStep[];
    alternate_nights: RoutineStep[];
    note: string;
  };
  about_scores: string;
}

export interface ShadeItem {
  id: string;
  name: string;
  hex: string;
  delta_e?: number;
  delta_e_from_lip?: number;
  verdict?: string;
  undertone?: string;
  family?: string;
  shop?: string | null;
}

export interface ShadeResult extends ResultMeta {
  colors: Record<string, string>;
  tone: { undertone: string; hue_angle: number; depth: string; lightness: number };
  foundation: ShadeItem[];
  lip: ShadeItem[];
  range_stats: { best: number; median: number; count: number };
  note: string;
}

export interface Honesty {
  changed_percent: number;
  mean_change: number;
  threshold: number;
}

export interface ImageResult extends ResultMeta {
  image: string;
  honesty: Honesty;
}

export interface Ratio {
  key: string;
  label: string;
  parts: string;
  yours: number[];
  reference: number[];
  difference_percent: number;
  plain: string;
}

export interface ProportionResult extends ResultMeta {
  face_shape: string | null;
  ratios: Ratio[];
  note: string;
}

export interface Procedure {
  id: string;
  name: string;
  area: string;
  plain: string;
  engine: "youcam" | "local" | "planned";
  natural_max: number;
  approximate: boolean;
}

export interface SurgeryResult extends ImageResult {
  applied: { id: string; name: string; level: number; engine: string; approximate: boolean }[];
  reshape: Record<string, number>;
  warnings: string[];
  not_yet_available: string[];
}

export interface Quote {
  feature: string;
  units: number;
  cached: boolean;
  live: boolean;
  /** R8: source and data flow are contract data, not inferred from a 0-unit price. */
  scope: "local" | "youcam" | "recorded_only";
  data_flow: string;
  visit_units_left: number | null;
  visit_units_used: number;
  visit_units_cap: number | null;
  daily_units_left: number;
  visit_units_after: number | null;
  pricing_verified: boolean | null;
  can_apply: boolean;
  unavailable_reason: string | null;
  is_estimate: boolean;
}

export interface Health {
  ok: boolean;
  version: string;
  live: boolean;
  sample_available: boolean;
}

/** MediaPipe Face Mesh landmark, normalised to 0..1 of the image. */
export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface SimulationResult extends ImageResult {
  strengths: Record<string, number>;
  note: string;
}

export interface AgingResult extends ResultMeta {
  frames: { age: number | null; image: string; stop?: number; label?: string }[];
  estimated_age: number | null;
  note: string;
}
