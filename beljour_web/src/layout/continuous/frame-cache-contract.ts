/** Private authority for drawn-frame replay; never serialise an authority key. Author: John Khan. */
import {
  TOUR_EFFECTS,
  type TourApplied,
  type TourEffect,
  type TourState,
} from "./contract.js";

export const FRAME_IDS = ["hair", "makeup", "skin"] as const;
export type FrameId = typeof FRAME_IDS[number];
export type FramePhase = "empty" | "warming" | "ready" | "refused" | "stale" | "disposed";
export const FRAME_WIDTH = 160;
export const FRAME_HEIGHT = 200;
export const FRAME_MAX_BYTES = 1_048_576;
export const FRAME_TTL_MS = 180_000;

export interface DrawnFrame {
  readonly id: FrameId;
  readonly width: number;
  readonly height: number;
  readonly rgba: Uint8ClampedArray;
  readonly provenance: "local-rendered-illustration";
  readonly providerVerified: false;
  readonly unitsSpent: 0;
}

export interface CacheAuthority {
  /** Internal revision signature, never included in a downloaded report. */
  readonly signature: string;
  readonly mode: "mock" | "off";
}

export interface FrameSafeSummary {
  readonly phase: FramePhase;
  readonly available: number;
  readonly bytes: number;
  readonly hits: number;
  readonly misses: number;
  readonly selected: FrameId | null;
  readonly networkCalls: 0;
  readonly unitsSpent: 0;
  readonly liveVerified: false;
}

export const FRAME_CAPTIONS: Readonly<Record<FrameId, string>> = Object.freeze({
  hair: "Illustrative hair colour and highlights. No hairstyle transfer was performed.",
  makeup: "Illustrative cheek colour and style guide. No product fit was verified.",
  skin: "Drawn complexion reference grid. No Skin AI result or diagnosis is available.",
});

export function isFrameId(value: unknown): value is FrameId {
  return FRAME_IDS.some((item) => item === value);
}

function levelStamp(state: TourState): number[] {
  return TOUR_EFFECTS.map((effect) => state.levels[effect]);
}

/** Revoke all frames on *any* setting or permission revision. */
export function cacheAuthority(state: TourState, drawn: boolean): CacheAuthority | null {
  if (!drawn || !state.sourceLoaded || state.sourceRevision < 1
    || !Number.isSafeInteger(state.sourceRevision)
    || !["drawn-main", "drawn-second"].includes(state.selectedId ?? "")
    || !state.identityLock || !state.permissions.local
    || !state.permissions.hair || !state.permissions.face
    || (state.mockMode === "mock" && !state.permissions.mock)) return null;
  if (TOUR_EFFECTS.some((effect) => !Number.isFinite(state.levels[effect])
    || state.levels[effect] < 1 || state.levels[effect] > 5)) return null;
  const signature = JSON.stringify([
    "beljour-drawn-frame-authority/1",
    state.sourceRevision,
    state.selectedId,
    state.permissions.local,
    state.permissions.hair,
    state.permissions.face,
    state.permissions.mock,
    state.identityLock,
    state.mockMode,
    state.appearanceCue,
    ...levelStamp(state),
    ...TOUR_EFFECTS.map((effect) => state.applied[effect]),
  ]);
  return { signature, mode: state.mockMode };
}

/** Render a family-specific local frame, never an attributed provider result. */
export function stateForFrame(state: TourState, id: FrameId): TourState {
  if (!isFrameId(id)) throw new RangeError("Unknown cached drawing family");
  const applied = Object.fromEntries(TOUR_EFFECTS.map(
    (effect) => [effect, false],
  )) as Record<TourEffect, boolean>;
  if (id === "hair") {
    applied.hair = true;
    applied.colour = true;
  }
  if (id === "makeup") {
    applied.concealer = true;
    applied.appearance = true;
  }
  if (id === "skin") {
    applied.ratio = true;
  }
  return {
    ...state,
    applied: applied as TourApplied,
    mockResult: "not-requested",
    requestedDownload: false,
  };
}

export function validFrame(frame: DrawnFrame): boolean {
  if (!isFrameId(frame.id) || frame.width !== FRAME_WIDTH
    || frame.height !== FRAME_HEIGHT || frame.provenance !== "local-rendered-illustration"
    || frame.providerVerified !== false || frame.unitsSpent !== 0) return false;
  if (!(frame.rgba instanceof Uint8ClampedArray)
    || frame.rgba.length !== FRAME_WIDTH * FRAME_HEIGHT * 4) return false;
  return true;
}
