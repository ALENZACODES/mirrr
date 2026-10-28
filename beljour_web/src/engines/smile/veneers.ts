/** W51 veneer-design geometry over checked teeth only. Author: John Khan. */
import type { Point } from "./contracts.js";
import { annotationBounds } from "./annotations.js";
export type ToothCell = {
    left: number;
    right: number;
    top: number;
    bottom: number;
    index: number;
};
export function toothCells(teeth: readonly Point[], count = 8): ToothCell[] {
    if (count < 4 || count > 14)
        throw new Error("tooth count must be 4..14");
    const b = annotationBounds(teeth), width = (b.maxX - b.minX) / count, out: ToothCell[] = [];
    for (let i = 0; i < count; i++)
        out.push({ left: b.minX + i * width, right: b.minX + (i + 1) * width, top: b.minY, bottom: b.maxY, index: i });
    return out;
}
export function shapeScale(style: string) {
    const map: Record<string, readonly [
        number,
        number
    ]> = { natural: [.98, 1], soft_square: [1, .98], rounded: [.96, 1], longer: [.94, 1.04] };
    const v = map[style];
    if (!v)
        throw new Error("unsupported veneer style");
    return { width: v[0], height: v[1] };
}
export function shadeDelta(style: string) {
    const map: Record<string, number> = { natural: 2, soft_white: 5, bright_preview: 8 };
    if (map[style] === undefined)
        throw new Error("unsupported shade style");
    return map[style];
}
export function shadeWarning(delta: number) { return delta > 6 ? "High-contrast cosmetic simulation; natural appearance is not guaranteed." : "Cosmetic colour simulation only; material and lighting alter real shade."; }
export function materialResponse(style: "matte" | "natural_gloss" | "high_gloss", light: number) {
    if (light < 0 || light > 1)
        throw new Error("light must be in [0,1]");
    const base = { matte: .08, natural_gloss: .18, high_gloss: .28 }[style];
    return Math.min(.35, base * (.4 + .6 * light));
}
export function acceptance(changedOutside: number, alphaPreserved: boolean) { return { local: changedOutside <= .001, alphaPreserved, pass: changedOutside <= .001 && alphaPreserved, modelUsed: false, checkedAnnotation: true }; }

