/** Commerce contract and safety labels. All samples are fictional. Author: John Khan. */
export type Tone = "cool" | "neutral" | "warm" | "olive";
export type Finish = "natural" | "dewy" | "satin" | "matte";
export type Category = "complexion" | "cheek" | "lip" | "prep" | "finish";
export type Vto = "foundation" | "blush" | "lip" | null;
export type Mode = "local" | "youcam";

export interface Product {
  id: string;
  formula_id: string;
  name: string;
  description: string;
  category: Category;
  vto: Vto;
  price_cents: number;
  currency: "CAD";
  finish: Finish;
  concerns: readonly string[];
  depth: number | null;
  undertone: Tone | null;
  swatch: string;
  coverage: string;
  sample: true;
  label: string;
}
export interface Formula {
  id: string;
  name: string;
  description: string;
  category: Category;
  vto: Vto;
  price_cents: number;
  finish: Finish;
  concerns: string[];
  coverage: string;
}
export interface SourceCatalogue {
  format: "beljour-commerce-catalogue/1";
  author: "John Khan";
  version: string;
  currency: "CAD";
  note: string;
  tones: Tone[];
  depths: string[];
  depth_swatches: string[];
  finishes: Finish[];
  concerns: string[];
  formulas: Formula[];
}
export interface Profile {
  depth: number;
  undertone: Tone;
  confidence: "estimate" | "manual" | "measured";
  lightness?: number | null;
  evidence: string;
}
export interface Recommendation {
  product: Product;
  score: number;
  why: string[];
  label: string;
}
export interface SkinMatchResult {
  photo_id: string;
  source: string;
  fallback?: string | null;
  message?: string | null;
  units_spent: number;
  cached: boolean;
  profile: Profile;
  cosmetic_concerns: Record<string, number>;
  recommendations: Recommendation[];
  note: string;
}
export interface Consent {
  version: "beljour-consent/1";
  adult: true;
  scope: "skin" | "makeup";
  photo_id: string;
  given_at: number;
}
export interface TryOnResult {
  image: string;
  source: "local" | "youcam";
  simulation: true;
  notice: string;
  product: Product;
  provider_calls: number;
  cached: boolean;
  units_spent: number;
  label: string;
  fallback?: string | null;
}
export interface BagLine { product: Product; quantity: number; total_cents: number }
export interface BagSnapshot {
  lines: BagLine[];
  wishlist: Product[];
  items: number;
  subtotal_cents: number;
  currency: "CAD";
  tax_cents: null;
  shipping_cents: null;
  total_cents: number;
  total_label: string;
  checkout_enabled: false;
  checkout_message: string;
  revision: number;
}
export const SAMPLE_NOTICE = "Fictional sample products. No checkout, product tests or brand partnerships.";
export const SIMULATION_NOTICE = "Visual simulation only. Actual cosmetic results will differ.";
