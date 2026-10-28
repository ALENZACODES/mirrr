/** W79/W91 checked-region continuity tools. Author: John Khan. */
import { alphaComposite, feather, outsideChangeFraction } from "./masking.js";
import { compareRegions, robustRegionColour, type RGB } from "./colorimetry.js";
export type ContinuityMeasurement = {
    deltaE: number;
    lightnessGap: number;
    chromaGap: number;
    sourcePixels: number;
    targetPixels: number;
    lightingWarning: boolean;
};
export type ContinuityPlan = {
    sourceRgb: RGB;
    opacity: number;
    maximumDeltaEReduction: number;
    note: string;
};
export function measure(pixels: Uint8ClampedArray, w: number, h: number, source: Float32Array, target: Float32Array): ContinuityMeasurement { const s = robustRegionColour(pixels, w, h, source), t = robustRegionColour(pixels, w, h, target), d = compareRegions(pixels, w, h, source, target); return { deltaE: d.deltaE76, lightnessGap: d.lightness, chromaGap: d.chroma, sourcePixels: s.pixelCount, targetPixels: t.pixelCount, lightingWarning: Math.abs(s.luma - t.luma) > .20 }; }
export function continuityPlan(pixels: Uint8ClampedArray, w: number, h: number, source: Float32Array, target: Float32Array, amount: number): ContinuityPlan {
    if (amount < 0 || amount > 1)
        throw new Error("amount must be in [0,1]");
    const m = measure(pixels, w, h, source, target), s = robustRegionColour(pixels, w, h, source), lighting = m.lightingWarning ? .45 : 1, opacity = Math.min(.18, m.deltaE / 120) * amount * lighting;
    return { sourceRgb: s.rgb.map(Math.round) as unknown as RGB, opacity, maximumDeltaEReduction: .45, note: "Colour continuity only; body shape and worth are never scored." };
}
export function applyContinuity(pixels: Uint8ClampedArray, w: number, h: number, target: Float32Array, plan: ContinuityPlan) { return alphaComposite(pixels, w, h, plan.sourceRgb, feather(target, w, h, 4), plan.opacity); }
export function evaluateContinuity(before: Uint8ClampedArray, after: Uint8ClampedArray, w: number, h: number, source: Float32Array, target: Float32Array) { const b = measure(before, w, h, source, target), a = measure(after, w, h, source, target), outside = outsideChangeFraction(before, after, target), improved = a.deltaE <= b.deltaE + 1e-6, overcorrected = (b.deltaE - a.deltaE) > Math.max(2, b.deltaE * .60); return { beforeDeltaE: b.deltaE, afterDeltaE: a.deltaE, improved, overcorrected, outsideChangeFraction: outside, pass: improved && !overcorrected && outside <= .001 }; }
export function regionPairNames(names: string[]): readonly [
    string,
    string
] {
    for (const p of [["face", "neck"], ["neck", "chest"], ["face", "chest"], ["face", "hand"]] as const)
        if (names.includes(p[0]) && names.includes(p[1]))
            return p;
    if (names.length < 2)
        throw new Error("two checked regions required");
    return [names[0], names[1]];
}
export function lightingCaveat(m: ContinuityMeasurement) { return m.lightingWarning ? "The checked regions have a large luminance gap, so lighting may dominate the apparent colour difference." : "The comparison is within one photo but still depends on local lighting and camera processing."; }

