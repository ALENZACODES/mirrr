/** Shared checked-annotation helpers for smile features. Author: John Khan. */
import { renderSmile } from "../engine.js";
import type { Annotation } from "../contracts.js";
export function requireRegions(annotation: Annotation, ...names: readonly (keyof Annotation)[]) { for (const name of names) {
    const value = annotation[name];
    if (!Array.isArray(value) || value.length < 3)
        throw new Error(`checked ${String(name)}  annotation required`);
} }
export function renderFeature(pixels: Uint8ClampedArray, width: number, height: number, feature: string, annotation: Annotation, amount: number, adultConfirmed: boolean) { return renderSmile({ width, height, channels: 4, data: pixels }, { feature: feature as any, amount, adult_confirmed: adultConfirmed, annotation }).data; }

