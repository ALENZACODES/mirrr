/** Exact 1.0–5.0 levels in tenths; never store incremental float slider state.
 * Author: John Khan.
 */

export type DecimalLevel = number & { readonly __decimalLevel: unique symbol };

export class ProLevelError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'ProLevelError';
  }
}

export function levelFromTenths(value: number): DecimalLevel {
  if (!Number.isInteger(value) || value < 10 || value > 50) {
    throw new ProLevelError('invalid_level', 'Strength must be between 1.0 and 5.0 in 0.1 steps.');
  }
  return value as DecimalLevel;
}

export function parseLevel(value: number | string): DecimalLevel {
  if (typeof value === 'string') {
    if (!/^[1-5](\.[0-9])?$/.test(value)) {
      throw new ProLevelError('invalid_level', 'Strength needs one decimal place.');
    }
    return levelFromTenths(Math.round(Number(value) * 10));
  }
  if (!Number.isFinite(value)) {
    throw new ProLevelError('invalid_level', 'Strength must be a finite number.');
  }
  const scaled = value * 10;
  if (Math.abs(scaled - Math.round(scaled)) > 1e-8) {
    throw new ProLevelError('invalid_level', 'Strength must be a multiple of 0.1.');
  }
  return levelFromTenths(Math.round(scaled));
}

export function levelLabel(value: DecimalLevel): string {
  return (value / 10).toFixed(1);
}

export function levelDose(value: DecimalLevel): number {
  return value / 50;
}

export function adjustLevel(value: DecimalLevel, deltaSteps: number): DecimalLevel {
  if (!Number.isInteger(deltaSteps)) {
    throw new ProLevelError('invalid_step', 'Level step count must be an integer.');
  }
  return levelFromTenths(value + deltaSteps);
}

export function boundedAdjustLevel(value: DecimalLevel, deltaSteps: number): DecimalLevel {
  if (!Number.isInteger(deltaSteps)) {
    throw new ProLevelError('invalid_step', 'Level step count must be an integer.');
  }
  return levelFromTenths(Math.max(10, Math.min(50, value + deltaSteps)));
}

export const LEVEL_TICKS: readonly string[] = Object.freeze(
  Array.from({ length: 41 }, (_, index) => levelLabel(levelFromTenths(index + 10))),
);

export function isCompliantSlider(min: unknown, max: unknown, step: unknown): boolean {
  try {
    return parseLevel(String(min)) === 10 && parseLevel(String(max)) === 50 && Number(step) === 0.1;
  } catch {
    return false;
  }
}
