/** Procedural accessory fit for W85-W88. Author: John Khan. */
import { alphaComposite, feather, stats, subtract } from "./masking.js";
export type FitReport = {
    feature: string;
    regionFraction: number;
    symmetry: number;
    scaleRatio: number;
    outsideFraction: number;
    warning: string;
};
export function ellipseMask(w: number, h: number, cx: number, cy: number, rx: number, ry: number, thickness = .18) {
    const out = new Float32Array(w * h), inner = (1 - thickness) ** 2;
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
            const dx = (x / w - cx) / Math.max(rx, 1e-5), dy = (y / h - cy) / Math.max(ry, 1e-5), d = dx * dx + dy * dy;
            out[y * w + x] = d <= 1 && d >= inner ? 1 : 0;
        }
    return out;
}
function maxMask(a: Float32Array, b: Float32Array) {
    if (a.length !== b.length)
        throw new Error("length mismatch");
    const out = new Float32Array(a.length);
    for (let i = 0; i < out.length; i++)
        out[i] = Math.max(a[i], b[i]);
    return out;
}
export function jewelleryGeometry(w: number, h: number, style: "earrings" | "necklace" | "both", scale = 1) {
    if (scale < .5 || scale > 1.5)
        throw new Error("scale out of range");
    let out = new Float32Array(w * h);
    if (style === "earrings" || style === "both")
        for (const cx of [.30, .70])
            out = maxMask(out, ellipseMask(w, h, cx, .52, .025 * scale, .055 * scale, .28));
    if (style === "necklace" || style === "both")
        for (let y = 0; y < h; y++)
            for (let x = 0; x < w; x++) {
                const dx = (x / w - .5) / (.20 * scale), dy = (y / h - .72) / (.10 * scale), d = dx * dx + dy * dy;
                if (d <= 1 && d >= .72)
                    out[y * w + x] = 1;
            }
    return out;
}
export function glassesGeometry(w: number, h: number, style: "soft_round" | "rectangular" | "cat_eye" | "wire", scale = 1) {
    if (scale < .7 || scale > 1.3)
        throw new Error("scale out of range");
    let out = new Float32Array(w * h), th = style === "wire" ? .07 : .12;
    for (const cx of [.39, .61])
        out = maxMask(out, ellipseMask(w, h, cx, .41, .095 * scale, (style === "rectangular" ? .065 : .082) * scale, th));
    const y = Math.floor(.41 * h);
    for (let yy = Math.max(0, y - 1); yy < Math.min(h, y + 2); yy++)
        for (let x = Math.floor(.485 * w); x < Math.floor(.515 * w); x++)
            out[yy * w + x] = 1;
    if (style === "cat_eye")
        for (const x of [Math.floor(.29 * w), Math.floor(.71 * w)])
            for (let yy = Math.max(0, y - Math.floor(.06 * h)); yy <= y; yy++)
                for (let xx = Math.max(0, x - 2); xx < Math.min(w, x + 3); xx++)
                    out[yy * w + xx] = 1;
    return out;
}
export function mirrorSymmetry(mask: Float32Array, w: number, h: number) {
    let inter = 0, un = 0;
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
            const a = mask[y * w + x] > .5, b = mask[y * w + (w - 1 - x)] > .5;
            if (a && b)
                inter++;
            if (a || b)
                un++;
        }
    return un ? inter / un : 1;
}
export function applyCheckedColour(pixels: Uint8ClampedArray, w: number, h: number, checked: Float32Array, colour: readonly [
    number,
    number,
    number
], opacity: number, protectedMask?: Float32Array) { const safe = protectedMask ? subtract(checked, protectedMask) : checked; return alphaComposite(pixels, w, h, colour, feather(safe, w, h, 1), opacity); }
export function nailColour(pixels: Uint8ClampedArray, w: number, h: number, nails: Float32Array, colour: readonly [
    number,
    number,
    number
], opacity: number) { return alphaComposite(pixels, w, h, colour, nails, opacity); }
export function hijabColour(pixels: Uint8ClampedArray, w: number, h: number, scarf: Float32Array, hair: Float32Array, colour: readonly [
    number,
    number,
    number
], opacity: number) {
    const safe = subtract(scarf, hair), out = alphaComposite(pixels, w, h, colour, feather(safe, w, h, 1), opacity);
    let overlap = 0, hairN = 0, hairChanged = 0;
    for (let i = 0; i < scarf.length; i++) {
        if (scarf[i] > .5 && hair[i] > .5)
            overlap++;
        if (hair[i] > .5) {
            hairN++;
            if (out[i * 4] !== pixels[i * 4] || out[i * 4 + 1] !== pixels[i * 4 + 1] || out[i * 4 + 2] !== pixels[i * 4 + 2])
                hairChanged++;
        }
    }
    return { pixels: out, metrics: { checkedOverlap: overlap / scarf.length, hairChangedFraction: hairN ? hairChanged / hairN : 0, hairReveal: false, culturalReviewRequired: true } };
}
export function fitReport(feature: string, mask: Float32Array, w: number, h: number, referenceWidth: number, outsideFraction = 0): FitReport {
    const s = stats(mask, w, h), symmetry = mirrorSymmetry(mask, w, h), scaleRatio = (s.x1 - s.x0) / w / Math.max(referenceWidth, 1e-5);
    let warning = "Scale is a visual guide, not a physical fit or weight guarantee.";
    if (feature === "W88")
        warning = "Scarf colour only; hair stays protected and cultural co-design is required.";
    if (feature === "W87")
        warning = "Nail colour only; shape and length are unchanged.";
    return { feature, regionFraction: s.fraction, symmetry, scaleRatio, outsideFraction, warning };
}
export function displayScale(value: number, calibrated: boolean) { return calibrated ? `${value.toFixed(1)}  mm` : `${value.toFixed(2)} × image-relative scale`; }

