/** Smile release-gate assessment. Author: John Khan. */
export type SmileAssessment = {
    feature: string;
    tested: boolean;
    passed: boolean;
    locality: number | null;
    alphaPreserved: boolean;
    annotationValid: boolean;
    reasons: string[];
};
const definitions: Record<string, string> = { W50: "checked gum region only; bounded reduction; adult consultation label; no diagnosis", W51: "checked teeth only; no automatic segmentation model; bounded shape/shade; alpha preserved", W52: "checked teeth only; optional spacing remains available; no orthodontic claim", W53: "checked teeth and gum only; character preserved; no treatment recommendation", W58: "two or more checked frames; bounded frame-to-frame motion; no automatic tracking claim" };
export function assessSmile(feature: string, locality: number, alphaPreserved: boolean, annotationValid: boolean): SmileAssessment {
    if (!definitions[feature])
        throw new Error("unknown smile feature");
    const reasons: string[] = [];
    if (locality > .002)
        reasons.push("changed pixels escaped checked region");
    if (!alphaPreserved)
        reasons.push("alpha changed");
    if (!annotationValid)
        reasons.push("checked annotation invalid");
    return { feature, tested: true, passed: !reasons.length, locality, alphaPreserved, annotationValid, reasons };
}
export function smileNotTested(feature: string, reason: string): SmileAssessment {
    if (!definitions[feature])
        throw new Error("unknown smile feature");
    return { feature, tested: false, passed: false, locality: null, alphaPreserved: true, annotationValid: false, reasons: [reason] };
}
export function smileGroup(feature: string, cases: readonly SmileAssessment[], required = 1) { const rows = cases.filter(c => c.feature === feature), tested = rows.filter(c => c.tested), passed = tested.filter(c => c.passed).length, failed = tested.length - passed, notTested = rows.length - tested.length; return { feature, tested: tested.length, passed, failed, notTested, passRate: tested.length ? passed / tested.length : null, releaseReady: tested.length >= required && failed === 0 && notTested === 0, definition: definitions[feature] }; }
export function smileReleaseSummary(groups: readonly ReturnType<typeof smileGroup>[]) { const blocked = groups.filter(g => !g.releaseReady).map(g => g.feature); return { allReady: blocked.length === 0, blocked, simulationLabels: true, realFaceGate: "required before public release" }; }

