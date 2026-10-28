/** W50 gummy-smile checked-region simulation metrics. Author: John Khan. */
import type { Point } from "./contracts.js";
import { annotationBounds, polygonArea } from "./annotations.js";
export type GumMetrics = {
    gumArea: number;
    teethArea: number;
    gumToTeethRatio: number;
    verticalExposure: number;
};
export function gumMetrics(gum: readonly Point[], teeth: readonly Point[]): GumMetrics { const ga = polygonArea(gum), ta = Math.max(polygonArea(teeth), 1e-9), gb = annotationBounds(gum), tb = annotationBounds(teeth); return { gumArea: ga, teethArea: ta, gumToTeethRatio: ga / ta, verticalExposure: Math.max(0, tb.minY - gb.minY) }; }
export function adjustmentAmount(amount: number) {
    if (amount < 0 || amount > 1)
        throw new Error("amount must be in [0,1]");
    return Math.min(.35, amount * .35);
}
export function targetGumOpacity(amount: number) { return 1 - adjustmentAmount(amount); }
export function acceptance(before: GumMetrics, after: GumMetrics) { const reduced = after.gumArea <= before.gumArea + 1e-8, bounded = after.gumArea >= before.gumArea * .55; return { reduced, bounded, pass: reduced && bounded, diagnostic: false, adultConsultation: true }; }
export function copy() { return "Simulation of checked gum-show appearance only. It is not a diagnosis or treatment recommendation."; }

