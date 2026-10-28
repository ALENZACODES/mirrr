/** Region raster helpers. Author: John Khan. */
import type { RegionMask } from "./contracts.js";
export function polygonMask(w: number, h: number, poly: readonly (readonly [
    number,
    number
])[]): Float32Array {
    const out = new Float32Array(w * h);
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
            const px = (x + .5) / w, py = (y + .5) / h;
            let inside = false;
            for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                const a = poly[i]!, b = poly[j]!;
                if ((a[1] > py) !== (b[1] > py) && px < (b[0] - a[0]) * (py - a[1]) / (b[1] - a[1] + 1e-12) + a[0])
                    inside = !inside;
            }
            out[y * w + x] = inside ? 1 : 0;
        }
    return out;
}
export function namedMasks(w: number, h: number, regions: readonly RegionMask[]): Map<string, Float32Array> {
    const m = new Map<string, Float32Array>();
    for (const r of regions)
        m.set(r.name, polygonMask(w, h, r.points));
    return m;
}
export function unionMasks(w: number, h: number, masks: Iterable<Float32Array>): Float32Array {
    const out = new Float32Array(w * h);
    for (const m of masks)
        for (let i = 0; i < out.length; i++)
            out[i] = Math.max(out[i]!, m[i]!);
    return out;
}
export function faceEllipse(w: number, h: number): Float32Array {
    const out = new Float32Array(w * h);
    for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
            const dx = (x - w * .5) / (w * .28 + 1), dy = (y - h * .43) / (h * .35 + 1);
            out[y * w + x] = dx * dx + dy * dy < 1 ? 1 : 0;
        }
    return out;
}

