/** Shared browser-side quality metrics for R16 Lane B. Author: John Khan. */
export type PixelBuffer = Uint8ClampedArray;

export type ImageShape = Readonly<{
  width: number;
  height: number;
  channels: 4;
}>;

export type IntegrityMetrics = Readonly<{
  sameLength: boolean;
  alphaIdentity: boolean;
  meanAbsoluteError: number;
  changedFraction: number;
  finite: boolean;
}>;

export type LocalityMetrics = Readonly<{
  insideError: number;
  outsideError: number;
  protectedError: number;
  supportFraction: number;
  passed: boolean;
}>;

export type TextureMetrics = Readonly<{
  correlation: number;
  gradientRatio: number;
  varianceRatio: number;
  passed: boolean;
}>;

export type Evaluation = Readonly<{
  feature: string;
  passed: boolean;
  metrics: Readonly<Record<string, number | boolean | string | null>>;
  failures: readonly string[];
  notes: readonly string[];
}>;

function assertShape(pixels: PixelBuffer, shape: ImageShape): void {
  const expected = shape.width * shape.height * shape.channels;
  if (!Number.isInteger(shape.width) || shape.width < 1) throw new Error("width must be a positive integer");
  if (!Number.isInteger(shape.height) || shape.height < 1) throw new Error("height must be a positive integer");
  if (pixels.length !== expected) throw new Error("pixel buffer length does not match image shape");
}

function assertMask(mask: Float32Array, shape: ImageShape): void {
  if (mask.length !== shape.width * shape.height) throw new Error("mask length does not match image shape");
  for (let i = 0; i < mask.length; i += 1) {
    if (!Number.isFinite(mask[i])) throw new Error("mask must contain finite values");
  }
}

function channelDifference(a: PixelBuffer, b: PixelBuffer, pixel: number): number {
  const offset = pixel * 4;
  return (
    Math.abs(a[offset] - b[offset]) +
    Math.abs(a[offset + 1] - b[offset + 1]) +
    Math.abs(a[offset + 2] - b[offset + 2])
  ) / (255 * 3);
}

export function integrity(before: PixelBuffer, after: PixelBuffer, shape: ImageShape): IntegrityMetrics {
  assertShape(before, shape);
  assertShape(after, shape);
  let alphaIdentity = true;
  let sum = 0;
  let changed = 0;
  let finite = true;
  const pixels = shape.width * shape.height;
  for (let pixel = 0; pixel < pixels; pixel += 1) {
    const offset = pixel * 4;
    const difference = channelDifference(before, after, pixel);
    sum += difference;
    if (difference > 0) changed += 1;
    if (before[offset + 3] !== after[offset + 3]) alphaIdentity = false;
    if (
      !Number.isFinite(after[offset]) ||
      !Number.isFinite(after[offset + 1]) ||
      !Number.isFinite(after[offset + 2]) ||
      !Number.isFinite(after[offset + 3])
    ) {
      finite = false;
    }
  }
  return {
    sameLength: before.length === after.length,
    alphaIdentity,
    meanAbsoluteError: pixels ? sum / pixels : 0,
    changedFraction: pixels ? changed / pixels : 0,
    finite,
  };
}

export function locality(
  before: PixelBuffer,
  after: PixelBuffer,
  shape: ImageShape,
  support: Float32Array,
  protectedMask?: Float32Array,
  outsideLimit = 0.03,
): LocalityMetrics {
  assertShape(before, shape);
  assertShape(after, shape);
  assertMask(support, shape);
  if (protectedMask) assertMask(protectedMask, shape);
  let insideSum = 0;
  let insideCount = 0;
  let outsideSum = 0;
  let outsideCount = 0;
  let protectedSum = 0;
  let protectedCount = 0;
  let supportCount = 0;
  const pixels = shape.width * shape.height;
  for (let pixel = 0; pixel < pixels; pixel += 1) {
    const difference = channelDifference(before, after, pixel);
    if (support[pixel] > 0.05) {
      insideSum += difference;
      insideCount += 1;
      supportCount += 1;
    } else {
      outsideSum += difference;
      outsideCount += 1;
    }
    if (protectedMask && protectedMask[pixel] > 0.05) {
      protectedSum += difference;
      protectedCount += 1;
    }
  }
  const insideError = insideCount ? insideSum / insideCount : 0;
  const outsideError = outsideCount ? outsideSum / outsideCount : 0;
  const protectedError = protectedCount ? protectedSum / protectedCount : 0;
  return {
    insideError,
    outsideError,
    protectedError,
    supportFraction: pixels ? supportCount / pixels : 0,
    passed: outsideError <= outsideLimit && protectedError <= Number.EPSILON,
  };
}

function luminance(pixels: PixelBuffer, shape: ImageShape): Float64Array {
  assertShape(pixels, shape);
  const result = new Float64Array(shape.width * shape.height);
  for (let pixel = 0; pixel < result.length; pixel += 1) {
    const offset = pixel * 4;
    result[pixel] =
      pixels[offset] * 0.2126 +
      pixels[offset + 1] * 0.7152 +
      pixels[offset + 2] * 0.0722;
  }
  return result;
}

function gradient(values: Float64Array, shape: ImageShape): Float64Array {
  const result = new Float64Array(values.length);
  const { width, height } = shape;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const right = y * width + Math.min(width - 1, x + 1);
      const down = Math.min(height - 1, y + 1) * width + x;
      const dx = values[right] - values[index];
      const dy = values[down] - values[index];
      result[index] = Math.hypot(dx, dy);
    }
  }
  return result;
}

function selected(values: Float64Array, mask: Float32Array): number[] {
  const result: number[] = [];
  for (let index = 0; index < values.length; index += 1) {
    if (mask[index] > 0.05) result.push(values[index]);
  }
  return result;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variance(values: readonly number[], average = mean(values)): number {
  if (values.length === 0) return 0;
  let total = 0;
  for (const value of values) total += (value - average) ** 2;
  return total / values.length;
}

function correlation(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length) throw new Error("correlation vectors must have the same length");
  if (a.length < 2) return 1;
  const ma = mean(a);
  const mb = mean(b);
  const va = variance(a, ma);
  const vb = variance(b, mb);
  if (va <= Number.EPSILON || vb <= Number.EPSILON) return 1;
  let covariance = 0;
  for (let index = 0; index < a.length; index += 1) {
    covariance += (a[index] - ma) * (b[index] - mb);
  }
  covariance /= a.length;
  return covariance / Math.sqrt(va * vb);
}

export function texture(
  before: PixelBuffer,
  after: PixelBuffer,
  shape: ImageShape,
  support: Float32Array,
  minimum: number,
): TextureMetrics {
  assertMask(support, shape);
  if (!Number.isFinite(minimum) || minimum < 0 || minimum > 1) throw new Error("minimum must be in [0,1]");
  const beforeLuminance = luminance(before, shape);
  const afterLuminance = luminance(after, shape);
  const beforeSelected = selected(beforeLuminance, support);
  const afterSelected = selected(afterLuminance, support);
  if (beforeSelected.length < 8) {
    return {
      correlation: 1,
      gradientRatio: 1,
      varianceRatio: 1,
      passed: true,
    };
  }
  const corr = correlation(beforeSelected, afterSelected);
  const beforeGradient = selected(gradient(beforeLuminance, shape), support);
  const afterGradient = selected(gradient(afterLuminance, shape), support);
  const gradientRatio = mean(afterGradient) / Math.max(mean(beforeGradient), Number.EPSILON);
  const varianceRatio = variance(afterSelected) / Math.max(variance(beforeSelected), Number.EPSILON);
  return {
    correlation: corr,
    gradientRatio,
    varianceRatio,
    passed: Math.max(0, Math.min(1, corr)) >= minimum && gradientRatio >= minimum * 0.55,
  };
}

export function zeroIdentity(before: PixelBuffer, zeroResult: PixelBuffer): boolean {
  if (before.length !== zeroResult.length) return false;
  for (let index = 0; index < before.length; index += 1) {
    if (before[index] !== zeroResult[index]) return false;
  }
  return true;
}

export function changedPixels(before: PixelBuffer, after: PixelBuffer, shape: ImageShape): Uint8Array {
  assertShape(before, shape);
  assertShape(after, shape);
  const result = new Uint8Array(shape.width * shape.height);
  for (let pixel = 0; pixel < result.length; pixel += 1) {
    result[pixel] = channelDifference(before, after, pixel) > 0 ? 1 : 0;
  }
  return result;
}

export function protectedIdentity(
  before: PixelBuffer,
  after: PixelBuffer,
  shape: ImageShape,
  protectedMask: Float32Array,
): boolean {
  assertMask(protectedMask, shape);
  for (let pixel = 0; pixel < protectedMask.length; pixel += 1) {
    if (protectedMask[pixel] <= 0.05) continue;
    const offset = pixel * 4;
    if (
      before[offset] !== after[offset] ||
      before[offset + 1] !== after[offset + 1] ||
      before[offset + 2] !== after[offset + 2] ||
      before[offset + 3] !== after[offset + 3]
    ) {
      return false;
    }
  }
  return true;
}

export function monotonic(values: readonly number[], direction: "increasing" | "decreasing", strict = false): boolean {
  if (values.some((value) => !Number.isFinite(value))) return false;
  for (let index = 1; index < values.length; index += 1) {
    if (direction === "increasing") {
      if (strict ? values[index] <= values[index - 1] : values[index] < values[index - 1]) return false;
    } else if (strict ? values[index] >= values[index - 1] : values[index] > values[index - 1]) {
      return false;
    }
  }
  return true;
}

export function bounded(value: number, minimum: number, maximum: number): boolean {
  return Number.isFinite(value) && Number.isFinite(minimum) && Number.isFinite(maximum) && value >= minimum && value <= maximum;
}

export function evaluateCommon(
  feature: string,
  before: PixelBuffer,
  after: PixelBuffer,
  zeroResult: PixelBuffer,
  shape: ImageShape,
  support: Float32Array,
  options: Readonly<{
    textureMinimum?: number;
    protectedMask?: Float32Array;
    outsideLimit?: number;
    notes?: readonly string[];
  }> = {},
): Evaluation {
  const failures: string[] = [];
  const imageIntegrity = integrity(before, after, shape);
  const local = locality(
    before,
    after,
    shape,
    support,
    options.protectedMask,
    options.outsideLimit ?? 0.03,
  );
  const identity = zeroIdentity(before, zeroResult);
  if (!imageIntegrity.alphaIdentity) failures.push("alpha channel changed");
  if (!imageIntegrity.finite) failures.push("result contains non-finite channel values");
  if (!local.passed) failures.push("change escaped allowed or protected support");
  if (!identity) failures.push("zero-strength render is not identity");
  const metrics: Record<string, number | boolean | string | null> = {
    outside_error: local.outsideError,
    protected_error: local.protectedError,
    support_fraction: local.supportFraction,
    alpha_identity: imageIntegrity.alphaIdentity,
    zero_identity: identity,
    changed_fraction: imageIntegrity.changedFraction,
  };
  if (options.textureMinimum !== undefined) {
    const textureMetrics = texture(before, after, shape, support, options.textureMinimum);
    metrics.texture_retention = Math.max(0, Math.min(1, textureMetrics.correlation));
    metrics.gradient_ratio = textureMetrics.gradientRatio;
    metrics.variance_ratio = textureMetrics.varianceRatio;
    if (!textureMetrics.passed) failures.push("texture-retention gate failed");
  }
  return {
    feature,
    passed: failures.length === 0,
    metrics,
    failures,
    notes: options.notes ?? [],
  };
}

export function mergeEvaluation(
  base: Evaluation,
  extraMetrics: Readonly<Record<string, number | boolean | string | null>>,
  extraFailures: readonly string[] = [],
  extraNotes: readonly string[] = [],
): Evaluation {
  const failures = [...base.failures, ...extraFailures];
  return {
    feature: base.feature,
    passed: failures.length === 0,
    metrics: { ...base.metrics, ...extraMetrics },
    failures,
    notes: [...base.notes, ...extraNotes],
  };
}

export function evaluateProtectedFeature(
  feature: string,
  before: PixelBuffer,
  after: PixelBuffer,
  zeroResult: PixelBuffer,
  shape: ImageShape,
  support: Float32Array,
  protectedMask: Float32Array,
): Evaluation {
  const base = evaluateCommon(feature, before, after, zeroResult, shape, support, {
    protectedMask,
    outsideLimit: 0.01,
  });
  const unchanged = protectedIdentity(before, after, shape, protectedMask);
  return mergeEvaluation(
    base,
    { protected_identity: unchanged },
    unchanged ? [] : ["protected pixels changed"],
  );
}

export function evaluateTextureFeature(
  feature: string,
  before: PixelBuffer,
  after: PixelBuffer,
  zeroResult: PixelBuffer,
  shape: ImageShape,
  support: Float32Array,
  floor: number,
): Evaluation {
  return evaluateCommon(feature, before, after, zeroResult, shape, support, {
    textureMinimum: floor,
  });
}

export function evaluationReport(rows: readonly Evaluation[]) {
  const byFeature: Record<string, Evaluation> = {};
  let passed = 0;
  let failed = 0;
  for (const row of rows) {
    byFeature[row.feature] = row;
    if (row.passed) passed += 1;
    else failed += 1;
  }
  return {
    rows: rows.length,
    passed,
    failed,
    byFeature,
    realFaceClaim: false,
    note: "Browser metrics are diagnostic only; frozen real-face evaluation remains a separate release gate.",
  } as const;
}
