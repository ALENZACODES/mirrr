/** W58 checked-frame smile-in-motion evaluator. Author: John Khan. */
import type { Point } from "./contracts.js";
import { annotationBounds, polygonArea, sequenceHash } from "./annotations.js";
export type MotionFrame = {
    teeth: readonly Point[];
    gum?: readonly Point[];
    timeMs: number;
};
export type MotionMetrics = {
    frames: number;
    durationMs: number;
    centreTravel: number;
    areaVariation: number;
    maximumStep: number;
    sequenceHash: string;
};
function centre(points: readonly Point[]) { const b = annotationBounds(points); return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 }; }
export function motionMetrics(frames: readonly MotionFrame[]): MotionMetrics {
    if (frames.length < 2)
        throw new Error("at least two checked frames are required");
    for (let i = 1; i < frames.length; i++)
        if (frames[i].timeMs <= frames[i - 1].timeMs)
            throw new Error("frame times must be strictly increasing");
    const centres = frames.map(f => centre(f.teeth)), areas = frames.map(f => polygonArea(f.teeth)), steps = centres.slice(1).map((c, i) => Math.hypot(c.x - centres[i].x, c.y - centres[i].y)), travel = steps.reduce((a, b) => a + b, 0), mean = areas.reduce((a, b) => a + b, 0) / areas.length, variation = mean ? Math.sqrt(areas.reduce((s, v) => s + (v - mean) ** 2, 0) / areas.length) / mean : 0;
    return { frames: frames.length, durationMs: frames.at(-1)!.timeMs - frames[0].timeMs, centreTravel: travel, areaVariation: variation, maximumStep: Math.max(...steps), sequenceHash: sequenceHash(frames.map(f => ({ teeth: f.teeth, ...(f.gum ? { gum: f.gum } : {}) }))) };
}
export function acceptance(metrics: MotionMetrics) { const boundedStep = metrics.maximumStep <= .08, boundedArea = metrics.areaVariation <= .35, hasTime = metrics.durationMs > 0; return { boundedStep, boundedArea, hasTime, pass: boundedStep && boundedArea && hasTime, automaticTracking: false }; }
export function report(frames: readonly MotionFrame[]) { const m = motionMetrics(frames); return { metrics: m, gate: acceptance(m), method: "checked frame annotations", modelUsed: false, label: "SIMULATION" }; }

