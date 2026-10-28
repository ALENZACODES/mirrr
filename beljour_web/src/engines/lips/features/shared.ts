/** Shared browser helpers for lip feature orchestration. Author: John Khan. */
import type { Photo } from "../contracts.js";
export type Point = readonly [
    number,
    number
];
export function photoOf(pixels: Uint8ClampedArray, width: number, height: number): Photo { if (pixels.length !== width * height * 4)
    throw new Error("RGBA length mismatch"); return { width, height, channels: 4, data: pixels }; }
export function changedFraction(before: Uint8ClampedArray, after: Uint8ClampedArray) { if (before.length !== after.length)
    throw new Error("length mismatch"); let changed = 0; const count = before.length / 4; for (let i = 0; i < count; i++) {
    if (before[i * 4] !== after[i * 4] || before[i * 4 + 1] !== after[i * 4 + 1] || before[i * 4 + 2] !== after[i * 4 + 2])
        changed++;
} return changed / count; }
export function alphaPreserved(before: Uint8ClampedArray, after: Uint8ClampedArray) { for (let i = 3; i < before.length; i += 4)
    if (before[i] !== after[i])
        return false; return true; }

