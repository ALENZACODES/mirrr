/** Validated local eye simulation contracts. Author: John Khan. */
export const FEATURES = ["W59", "W60", "W61", "W62", "W63", "W64", "W65", "W66", "W67", "W75", "W76"] as const;
export const FEATURE_STYLES: Record<string, readonly string[]> = {
  W59: ["classic", "hybrid", "volume", "mega"], W60: ["cat", "doll", "wispy", "kitten", "fox"],
  W61: ["lifting", "tint"], W62: ["strip", "cluster", "half_strip"], W63: ["lengthening", "volumising", "tubing"],
  W64: ["wing", "batwing", "tightline", "soft_wing"], W65: ["floating", "double_wing", "smoked_pencil", "gel", "shadow"],
  W66: ["cut_crease", "halo", "smokey"], W67: ["foil", "duochrome"], W75: [], W76: ["navy", "burgundy", "forest"],
};
export const ANATOMIES = ["open", "hooded", "monolid", "deep_set"] as const;
export const SIDES = ["right", "left"] as const;
export const MAX_PIXELS = 4_194_304;
export const MAX_LASHES = 256;
export const LABEL = "Local eye simulation. Placement and colour are estimates, not a product result.";
export const VERSION = "eyes-r15b/1";
export type EyeFeature = typeof FEATURES[number];
export type Anatomy = typeof ANATOMIES[number];
export type Side = typeof SIDES[number];
export type Point = readonly [number, number];
export type RGB = readonly [number, number, number];
export interface EyePhoto { width: number; height: number; channels: number; data: ArrayLike<number> }
export interface LashTrace { side: Side; points: readonly Point[]; lower: boolean; confidence: number }
export interface EyeOptions {
  feature: EyeFeature;
  amount: number;
  style: string;
  anatomy: Record<Side, Anatomy>;
  colour: RGB;
  secondary_colour: RGB;
  observed_lashes: readonly LashTrace[];
  natural_density: number | null;
  curl: number;
  length: number;
  thickness: number;
  blend: number;
  angle: number;
  transparency: number;
  smudge: number;
  lower: boolean;
  glasses_clearance: number | null;
  skin_depth: number | null;
  seed: number;
}
export type EyeRequest = Partial<EyeOptions> & { feature: EyeFeature };
export interface EyeReport {
  feature: EyeFeature;
  version: string;
  label: string;
  provider: string;
  status: string;
  real_face_quality: string;
  geometry_changed: boolean;
  eye_colour_changed: boolean;
  anatomy_source: string;
  warnings: string[];
  sides: Record<string, unknown>[];
  amount: number;
  [key: string]: unknown;
}
export interface EyeResult { image: Uint8ClampedArray; coverage: Float64Array; report: EyeReport }

export function number(value: unknown, name: string, low: number, high: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < low || value > high) {
    throw new RangeError(`${name} must be a finite number in ${low}..${high}`);
  }
  return value;
}
export function rgb(value: unknown, name: string): RGB {
  if (!Array.isArray(value) || value.length !== 3) throw new RangeError(`${name} needs three byte channels`);
  const channels = value.map(v => number(v, name, 0, 255));
  if (!channels.every(Number.isInteger)) throw new RangeError(`${name} needs integer byte channels`);
  return [channels[0], channels[1], channels[2]];
}
function record(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RangeError(`${name} must be an object`);
  return value as Record<string, unknown>;
}
export function parseTrace(value: unknown): LashTrace {
  const input = record(value, "lash trace");
  if (Object.keys(input).some(k => !["side", "points", "lower", "confidence"].includes(k))) throw new RangeError("unknown lash trace field");
  if (!SIDES.includes(input.side as Side)) throw new RangeError("lash trace side must be right or left");
  if (!Array.isArray(input.points) || input.points.length < 2 || input.points.length > 64) throw new RangeError("lash trace needs 2..64 points");
  const points: Point[] = input.points.map(p => {
    if (!Array.isArray(p) || p.length !== 2) throw new RangeError("trace points must be pairs");
    return [number(p[0], "trace x", 0, 1), number(p[1], "trace y", 0, 1)];
  });
  if (polylineLength(points) <= 1e-8) throw new RangeError("lash trace must have nonzero length");
  const lower = input.lower ?? false;
  if (typeof lower !== "boolean") throw new RangeError("lower must be a boolean");
  return { side: input.side as Side, points, lower, confidence: number(input.confidence ?? 1, "confidence", 0, 1) };
}
export function parseRequest(value: unknown): EyeOptions {
  const input = record(value, "eye request");
  const fields = ["feature", "amount", "style", "anatomy", "colour", "secondary_colour", "observed_lashes", "natural_density", "curl", "length", "thickness", "blend", "angle", "transparency", "smudge", "lower", "glasses_clearance", "skin_depth", "seed"];
  if (Object.keys(input).some(k => !fields.includes(k))) throw new RangeError("unknown eye request field");
  if (!FEATURES.includes(input.feature as EyeFeature)) throw new RangeError("unsupported eye feature");
  const style = input.style ?? "";
  if (typeof style !== "string" || style.length > 40) throw new RangeError("style must be a short identifier");
  if (style && !FEATURE_STYLES[input.feature as string].includes(style)) throw new RangeError("unsupported style for this eye feature");
  const anatomy = record(input.anatomy ?? { right: "open", left: "open" }, "anatomy");
  if (Object.keys(anatomy).length !== 2 || !SIDES.every(s => ANATOMIES.includes(anatomy[s] as Anatomy))) throw new RangeError("anatomy needs right and left selections");
  const lower = input.lower ?? false;
  if (typeof lower !== "boolean") throw new RangeError("lower must be a boolean");
  const observed = input.observed_lashes ?? [];
  if (!Array.isArray(observed) || observed.length > MAX_LASHES) throw new RangeError("observed lash list is too large");
  const seed = number(input.seed ?? 17, "seed", 0, 4294967295);
  if (!Number.isInteger(seed)) throw new RangeError("seed must be an integer");
  const optional = (key: string) => input[key] == null ? null : number(input[key], key, 0, 1);
  return {
    feature: input.feature as EyeFeature, style, lower, seed,
    anatomy: { right: anatomy.right as Anatomy, left: anatomy.left as Anatomy },
    observed_lashes: observed.map(parseTrace),
    colour: rgb(input.colour ?? [38, 31, 30], "colour"),
    secondary_colour: rgb(input.secondary_colour ?? [103, 150, 118], "secondary_colour"),
    amount: number(input.amount ?? .65, "amount", 0, 1),
    curl: number(input.curl ?? .55, "curl", 0, 1),
    length: number(input.length ?? .19, "length", .02, .4),
    thickness: number(input.thickness ?? .012, "thickness", .002, .05),
    blend: number(input.blend ?? .35, "blend", 0, 1),
    angle: number(input.angle ?? 0, "angle", -90, 90),
    transparency: number(input.transparency ?? .35, "transparency", 0, 1),
    smudge: number(input.smudge ?? 0, "smudge", 0, 1),
    natural_density: optional("natural_density"),
    skin_depth: optional("skin_depth"),
    glasses_clearance: optional("glasses_clearance"),
  };
}
export function validatePhoto(image: EyePhoto): void {
  if (!Number.isInteger(image.width) || !Number.isInteger(image.height) || Math.min(image.width, image.height) < 8 || image.width * image.height > MAX_PIXELS) {
    throw new RangeError("eye photo needs at least 8 pixels per side and at most 4 MP");
  }
  if (image.channels !== 3 && image.channels !== 4) throw new RangeError("eye photo must be RGB or RGBA");
  if (image.data.length !== image.width * image.height * image.channels) throw new RangeError("eye photo buffer size is wrong");
  for (let i = 0; i < image.data.length; i++) {
    if (!Number.isInteger(image.data[i]) || image.data[i] < 0 || image.data[i] > 255) throw new RangeError("eye photo must contain bytes");
  }
}
export function validatePoints(value: readonly Point[]): Point[] {
  if (!Array.isArray(value) || ![468, 478].includes(value.length)) throw new RangeError("eye engine needs 468 or 478 points");
  return value.map(p => {
    if (!Array.isArray(p) || p.length !== 2) throw new RangeError("landmark must be a pair");
    return [number(p[0], "landmark x", -.25, 1.25), number(p[1], "landmark y", -.25, 1.25)];
  });
}
export function polylineLength(points: readonly Point[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) length += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  return length;
}
