/** Restrained editorial motion. Transform and opacity only. Author: John Khan. */

export type EditorialMotionMode = "settle" | "still";
export type EditorialMotionStage = "caption" | "page" | "focus";

export interface MotionConditions {
  readonly reducedMotion: boolean;
  readonly saveData: boolean;
  readonly documentHidden: boolean;
}

export interface EditorialMotionPlan {
  readonly mode: EditorialMotionMode;
  readonly easing: string;
  readonly captionMs: number;
  readonly pageMs: number;
  readonly focusMs: number;
  readonly translatePixels: number;
}

export const EDITORIAL_EASE = "cubic-bezier(0.22, 0.75, 0.29, 1)";

/** No spring physics, continuous repaint, or animation on obscured pages. */
export function motionPlan(conditions: MotionConditions): EditorialMotionPlan {
  const still = conditions.reducedMotion || conditions.saveData || conditions.documentHidden;
  if (still) {
    return {
      mode: "still",
      easing: "linear",
      captionMs: 0,
      pageMs: 0,
      focusMs: 0,
      translatePixels: 0,
    };
  }
  return {
    mode: "settle",
    easing: EDITORIAL_EASE,
    captionMs: 160,
    pageMs: 260,
    focusMs: 120,
    translatePixels: 6,
  };
}

export function stageDuration(plan: EditorialMotionPlan, stage: EditorialMotionStage): number {
  if (stage === "caption") return plan.captionMs;
  if (stage === "page") return plan.pageMs;
  return plan.focusMs;
}

export function browserMotionConditions(doc: Document): MotionConditions {
  const view = doc.defaultView;
  const reducedMotion = view?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const saveData = Boolean((view?.navigator as Navigator & {
    connection?: { saveData?: boolean };
  } | undefined)?.connection?.saveData);
  return {
    reducedMotion,
    saveData,
    documentHidden: doc.hidden === true,
  };
}

/** The CSS owns transitions. This only sets a bounded declarative mode. */
export function applyEditorialMotion(root: HTMLElement, doc: Document): EditorialMotionPlan {
  const policy = motionPlan(browserMotionConditions(doc));
  root.dataset.editorialMotion = policy.mode;
  return policy;
}

/** Avoid spreading a generated duration to arbitrary styles or DOM nodes. */
export function validMotionPlan(value: unknown): value is EditorialMotionPlan {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).length !== 6) return false;
  if (row.mode === "still") {
    return row.easing === "linear" && row.captionMs === 0
      && row.pageMs === 0 && row.focusMs === 0 && row.translatePixels === 0;
  }
  return row.mode === "settle" && row.easing === EDITORIAL_EASE
    && row.captionMs === 160 && row.pageMs === 260
    && row.focusMs === 120 && row.translatePixels === 6;
}
