/** On-device five-strength hair board: 1.0, 2.0, 3.0, 4.0 and 5.0 with the real engines.
 * Mirrors api/plumb_api/commerce/hair_comparison.py and level_evidence.py.
 * Every stop runs the production fibre, hair-colour or short-sides renderer with the
 * default-on identity guard; evidence is measured from the final pixels, and unchanged
 * or refused stops stay in the five-case denominator. Each board uses a fresh fibre
 * session, allocations are bounded at 1,048,576 source pixels, and a cancelled board
 * stops between stops. Local simulation only; no provider client, nothing stored.
 * Author: John Khan.
 */
import { validateLevel } from "./strength.js";
import { requireShade } from "../engines/hair_palette/palette.js";
import { applyShade } from "../engines/hair_palette/preview.js";
import { CoverSession, DefaultCoverGuard, type CoverDecision, type CoverGuard,
  type CoverZone } from "../engines/local/fibre.js";
import { renderStyleForFace } from "../engines/menshair/public-render.js";
import { type HairAnchors, type HairSource } from "../engines/menshair/render.js";

export const FIVE_LEVELS = [1.0, 2.0, 3.0, 4.0, 5.0] as const;
export const MAX_BOARD_PIXELS = 1_048_576;
export const BOARD_LABEL =
  "Local simulation board: five strengths of one edit on your photo. Not a product or real-face result.";
export type LevelStatus = "rendered" | "unchanged" | "refused";
export type BoardKind = "fibre" | "palette" | "short-sides";

export interface FrameEvidence {
  level: number; status: LevelStatus; changed_pixels: number; region_pixels: number;
  changed_share: number; mean_delta: number; max_delta: number;
  identity_similarity: number | null; identity_blended: boolean | null; guard_applied: boolean;
  refusal_code: string | null;
}
export interface BoardTile { level: number; pixels: Uint8Array; evidence: FrameEvidence }
export interface BoardInput {
  pixels: Uint8Array; width: number; height: number;
  hair: Uint8Array; scalp?: Uint8Array; landmarks: HairAnchors | null;
  primaryBox?: readonly [number, number, number, number];
}
export type BoardChoice =
  | { kind: "fibre"; zone: CoverZone; shadeId: string | null; photoHash: string }
  | { kind: "palette"; shadeId: string; allowLightening: boolean }
  | { kind: "short-sides"; styleId: string; source: HairSource };
export interface BoardOptions {
  guard?: CoverGuard; lockLevel?: number; signal?: AbortSignal; pause?: () => Promise<void>;
}
export interface LevelBoard {
  kind: BoardKind; choice: Record<string, string | boolean | null>; width: number; height: number;
  channels: number; original: Uint8Array; tiles: BoardTile[];
}
export interface LevelTotals { rendered: number; unchanged: number; refused: number; cases: number }

export class BoardRefusal extends Error {
  constructor(readonly code: string, message: string) { super(message); this.name = "BoardRefusal"; }
}
export class BoardCancelled extends Error {
  constructor() { super("Five-strength board cancelled."); this.name = "AbortError"; }
}
class FrameEvidenceError extends Error {
  constructor(readonly code: string, message: string) { super(message); }
}

export function round4(value: number): number { return Math.round(value * 1e4) / 1e4; }

/** Measure one rendered stop; alpha or out-of-region edits are contract errors. */
export function frameEvidence(before: Uint8Array, after: Uint8Array, region: Uint8Array, channels: number,
  level: number, similarity: number, blended: boolean, guardApplied: boolean): FrameEvidence {
  const stop = validateLevel(level);
  if (before.length !== after.length || before.length !== region.length * channels ||
      (channels !== 3 && channels !== 4)) {
    throw new FrameEvidenceError("invalid_output", "Rendered frame does not match its source.");
  }
  if (!Number.isFinite(similarity) || similarity < 0 || similarity > 1) {
    throw new FrameEvidenceError("invalid_output", "Identity similarity must lie in [0, 1].");
  }
  let changed = 0, total = 0, largest = 0, regionPixels = 0;
  for (let i = 0; i < region.length; i++) {
    if (region[i]) regionPixels++;
    if (channels === 4 && before[i * 4 + 3] !== after[i * 4 + 3]) {
      throw new FrameEvidenceError("alpha_changed", "A strength stop changed photo transparency.");
    }
    let moved = false;
    for (let c = 0; c < 3; c++) {
      const delta = Math.abs(before[i * channels + c] - after[i * channels + c]);
      if (delta) moved = true;
      if (delta > largest) largest = delta;
      total += delta;
    }
    if (moved && !region[i]) {
      throw new FrameEvidenceError("protected_change", "A strength stop edited pixels outside the hair region.");
    }
    if (moved) changed++;
  }
  return {
    level: stop, status: changed ? "rendered" : "unchanged", changed_pixels: changed,
    region_pixels: regionPixels, changed_share: regionPixels ? round4(changed / regionPixels) : 0,
    mean_delta: changed ? round4(total / (changed * 3) / 255) : 0, max_delta: changed ? largest : 0,
    identity_similarity: round4(similarity), identity_blended: blended, guard_applied: guardApplied,
    refusal_code: null,
  };
}

export function refusedEvidence(level: number, code: string, regionPixels = 0): FrameEvidence {
  if (!code || code.length > 48) throw RangeError("Refusal code must be a short string.");
  return { level: validateLevel(level), status: "refused", changed_pixels: 0, region_pixels: regionPixels,
    changed_share: 0, mean_delta: 0, max_delta: 0, identity_similarity: null, identity_blended: null,
    guard_applied: false, refusal_code: code };
}

export function levelTotals(evidence: readonly FrameEvidence[]): LevelTotals {
  if (evidence.length !== 5 || evidence.some((item, i) => item.level !== FIVE_LEVELS[i])) {
    throw RangeError("Evidence must cover exactly the five strength stops in order.");
  }
  const count = (status: LevelStatus) => evidence.filter((item) => item.status === status).length;
  return { rendered: count("rendered"), unchanged: count("unchanged"), refused: count("refused"), cases: 5 };
}

/** The pixels each engine may edit, by that engine's own mask rule. */
function editableRegion(input: BoardInput, kind: BoardKind): Uint8Array {
  const { width, height, hair } = input;
  const box = input.primaryBox ?? [0, 0, width, height];
  const region = new Uint8Array(width * height);
  if (hair.length !== region.length) return region;
  for (let y = Math.max(0, box[1]); y < Math.min(height, box[3]); y++) {
    for (let x = Math.max(0, box[0]); x < Math.min(width, box[2]); x++) {
      const i = y * width + x;
      region[i] = (kind === "short-sides" ? hair[i] > 0 : hair[i] >= 128) ? 1 : 0;
    }
  }
  return region;
}

function checkedSource(input: BoardInput): number {
  const { width, height, pixels } = input;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new BoardRefusal("invalid_image", "Expected a positive integer photo size.");
  }
  if (width * height > MAX_BOARD_PIXELS) {
    throw new BoardRefusal("too_large", "The five-strength board is limited to 1,048,576 pixels.");
  }
  const channels = pixels.length / (width * height);
  if (channels !== 3 && channels !== 4) throw new BoardRefusal("invalid_image", "Expected RGB or RGBA pixels.");
  return channels;
}

function describe(choice: BoardChoice): Record<string, string | boolean | null> {
  if (choice.kind === "fibre") {
    if (!["crown", "parting", "hairline"].includes(choice.zone)) throw RangeError("Unknown fibre zone.");
    return { zone: choice.zone, shade_id: choice.shadeId };
  }
  if (choice.kind === "palette") {
    if (typeof choice.allowLightening !== "boolean") throw RangeError("Lightening permission must be a boolean.");
    return { shade_id: choice.shadeId, allow_lightening: choice.allowLightening };
  }
  if (choice.kind === "short-sides") return { style_id: choice.styleId };
  throw RangeError("Unknown hair comparison kind.");
}

interface StopResult { rendered: true; pixels: Uint8Array; similarity: number; blended: boolean }
interface StopRefusal { rendered: false; code: string }

function renderStop(input: BoardInput, choice: BoardChoice, level: number, session: CoverSession,
  guard: CoverGuard, lockLevel: number): StopResult | StopRefusal {
  const { width, height, pixels, landmarks, primaryBox } = input;
  if (choice.kind === "fibre") {
    if (!input.scalp) return { rendered: false, code: "no_scalp" };
    const toMask = (values: Uint8Array) => ({ width, height, channels: 1 as const,
      data: Float64Array.from(values, (v) => v / 255) });
    const rgb = choice.shadeId === null ? undefined : requireShade(choice.shadeId).rgb;
    const result = session.render({ width, height, channels: pixels.length / (width * height), data: pixels },
      toMask(input.hair), toMask(input.scalp),
      { photoHash: choice.photoHash, zone: choice.zone, level, landmarks, primaryBox, paletteRgb: rgb,
        guard, lockLevel });
    return result.rendered ? { rendered: true, pixels: new Uint8Array(result.image.data),
      similarity: result.identitySimilarity,
      blended: result.identityBlended } : { rendered: false, code: result.code };
  }
  if (choice.kind === "palette") {
    const result = applyShade(pixels, width, height, input.hair, landmarks, choice.shadeId, level,
      { primaryBox, allowLightening: choice.allowLightening, guard, lockLevel });
    return result.rendered ? { rendered: true, pixels: result.pixels, similarity: result.identitySimilarity,
      blended: result.identityBlended } : { rendered: false, code: result.code };
  }
  const result = renderStyleForFace(pixels, width, height, input.hair, landmarks, choice.styleId, level,
    choice.source, { primaryBox, guard, lockLevel });
  return result.rendered ? { rendered: true, pixels: result.pixels, similarity: result.identitySimilarity,
    blended: result.identityBlended } : { rendered: false, code: result.code };
}

const nextTask = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** Render all five stops; cancellation is checked before each stop and after each pause. */
export async function compareLevels(input: BoardInput, choice: BoardChoice,
  options: BoardOptions = {}): Promise<LevelBoard> {
  const channels = checkedSource(input);
  const lockLevel = validateLevel(options.lockLevel ?? 5);
  const described = describe(choice);
  const original = new Uint8Array(input.pixels);
  const source: BoardInput = { ...input, pixels: original };
  const inner = options.guard ?? new DefaultCoverGuard();
  let calls = 0;
  const counting: CoverGuard = {
    guard(before: Uint8Array, after: Uint8Array, level: number): CoverDecision {
      calls++;
      return inner.guard(before, after, level);
    },
  };
  const region = editableRegion(source, choice.kind);
  const regionPixels = region.reduce((sum, v) => sum + v, 0);
  const session = new CoverSession();
  const tiles: BoardTile[] = [];
  const pause = options.pause ?? nextTask;
  for (const level of FIVE_LEVELS) {
    if (options.signal?.aborted) throw new BoardCancelled();
    const before = calls;
    let tile: BoardTile;
    try {
      const result = renderStop(source, choice, level, session, counting, lockLevel);
      if (!result.rendered) {
        tile = { level, pixels: new Uint8Array(original), evidence: refusedEvidence(level, result.code, regionPixels) };
      } else {
        const evidence = frameEvidence(original, result.pixels, region, channels, level,
          result.similarity, result.blended, calls > before);
        tile = { level, pixels: new Uint8Array(result.pixels), evidence };
      }
    } catch (error) {
      if (!(error instanceof FrameEvidenceError)) throw error;
      tile = { level, pixels: new Uint8Array(original), evidence: refusedEvidence(level, error.code, regionPixels) };
    }
    tiles.push(tile);
    await pause();
    if (options.signal?.aborted) throw new BoardCancelled();
  }
  session.clear();
  return { kind: choice.kind, choice: described, width: input.width, height: input.height, channels,
    original, tiles };
}

/** Photo-free report: settings, numeric evidence and fixed labels only. */
export function publicReport(board: LevelBoard): Record<string, unknown> {
  const evidence = board.tiles.map((tile) => ({ ...tile.evidence }));
  return { kind: board.kind, choice: { ...board.choice }, width: board.width, height: board.height,
    levels: evidence, totals: levelTotals(evidence), simulated: true, provider_calls: 0,
    real_face_status: "not_tested", label: BOARD_LABEL };
}
