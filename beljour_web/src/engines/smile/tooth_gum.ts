/** W53 tooth/gum design guides. Author: John Khan. */
import type { Point } from "./contracts.js";
import { annotationBounds, polygonArea } from "./annotations.js";
export type GumGuide = {
    height: number;
    curvature: number;
    symmetry: number;
    note: string;
};
export function gumLineGuide(gum: readonly Point[], teeth: readonly Point[]): GumGuide { const g = annotationBounds(gum), t = annotationBounds(teeth), height = Math.max(0, t.minY - g.minY), centre = (g.minX + g.maxX) / 2, left = gum.filter(p => p[0] <= centre), right = gum.filter(p => p[0] > centre), la = polygonArea(left), ra = polygonArea(right), sym = Math.min(la, ra) / Math.max(la, ra, 1e-9); return { height, curvature: (g.maxY - g.minY) / Math.max(g.maxX - g.minX, 1e-9), symmetry: sym, note: "Guide uses checked regions only and does not recommend tissue removal." }; }
export function toothCharacter(style: "even" | "natural_variation" | "soft_round" | "soft_square") { return { even: { uniformity: .9, rounding: .35 }, natural_variation: { uniformity: .65, rounding: .45 }, soft_round: { uniformity: .78, rounding: .70 }, soft_square: { uniformity: .80, rounding: .25 } }[style]; }
export function report(gum: readonly Point[], teeth: readonly Point[], style: Parameters<typeof toothCharacter>[0]) { return { guide: gumLineGuide(gum, teeth), character: toothCharacter(style), diagnostic: false, treatmentRecommendation: false, checkedAnnotation: true }; }

