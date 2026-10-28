/** Wire types for POST /api/skin/match (api/plumb_api/services/skin_match.py). Author: John Khan. */

export interface SkinConsent { version: string; adult: true; scope: "skin"; photo_id: string; given_at: number }

export interface SkinMatchRequest {
  photo_id: string;
  concerns?: string[];
  local_only?: boolean;
  consent?: SkinConsent;
}

export interface SkinProfile {
  lightness: number; a: number; b: number; hue_angle: number; chroma: number;
  depth: string; depth_label: string; undertone: string; undertone_label: string;
  pixels: number; source: string; note: string;
}

export interface SkinConcern { concern: string; label: string; raw_score: number; band: string }

export interface SkinProduct {
  id: string; type: string; name: string; shade: string | null; coverage: string | null;
  why: string; for: string; label: string;
}

export type SkinFallback = "kill_switch" | "session_cap" | "daily_cap" | "balance_floor" | "not_live"
  | "out_of_scope" | "provider_error" | "timeout" | "pending" | "local_only";

export interface SkinMatchResult {
  photo_id: string;
  profile: SkinProfile;
  concerns: SkinConcern[];
  concerns_source: string | null;
  source: "youcam" | "local";
  fallback: SkinFallback | null;
  message: string | null;
  units_spent: number;
  cached: boolean;
  products: SkinProduct[];
  focus: string[];
  label: string;
  catalogue_version: string;
}
