/** R16B smile contracts. Author: John Khan. */
export const FEATURES = ["W50", "W51", "W52", "W53", "W58"] as const;
export type SmileFeature = typeof FEATURES[number];
export type Point = readonly [
    number,
    number
];
export interface Annotation {
    teeth: readonly Point[];
    gum: readonly Point[];
    midline_x: number | null;
}
export interface SmileOptions {
    feature: SmileFeature;
    amount: number;
    adult_confirmed: boolean;
    annotation: Annotation | null;
    frame_annotations: readonly Annotation[];
    tooth_shade: readonly [
        number,
        number,
        number
    ];
    gum_shade: readonly [
        number,
        number,
        number
    ];
}
export const LABEL = "Adult consultation simulation. Dental geometry is user-annotated and approximate; no diagnosis or treatment recommendation.";
export function validateAnnotation(a: Annotation): void {
    if (a.teeth.length < 3 || a.teeth.length > 128)
        throw new RangeError("checked teeth polygon required");
    for (const p of [...a.teeth, ...a.gum])
        if (p.length !== 2 || p.some(v => !Number.isFinite(v) || v < 0 || v > 1))
            throw new RangeError("annotation points must be normalized");
}
export function parseSmileOptions(v: Partial<SmileOptions> & {
    feature: SmileFeature;
}): SmileOptions {
    if (!FEATURES.includes(v.feature))
        throw new RangeError("unsupported smile feature");
    if (v.adult_confirmed !== true)
        throw new Error("18+ confirmation required");
    const frames = v.frame_annotations ?? [];
    const ann = v.annotation ?? null;
    if (v.feature === "W58") {
        if (frames.length < 2)
            throw new RangeError("two checked frame annotations required");
        frames.forEach(validateAnnotation);
    }
    else {
        if (!ann)
            throw new RangeError("checked annotation required");
        validateAnnotation(ann);
    }
    return { feature: v.feature, amount: v.amount ?? .5, adult_confirmed: true, annotation: ann, frame_annotations: frames, tooth_shade: v.tooth_shade ?? [232, 225, 207], gum_shade: v.gum_shade ?? [155, 83, 91] };
}

