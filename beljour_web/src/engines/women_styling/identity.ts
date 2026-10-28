/** Mandatory image-bound identity guard adapter for women's local previews.
 * ASSUMED temporary Lane H interface. This proxy is not face recognition:
 * similarity means RGB proximity only; it cannot establish same-person identity.
 * Author: John Khan.
 */
import { checkedLevel, DEFAULT_LEVEL, opacityForLevel } from './strength.js';

export interface WomanFrame {
  readonly width: number;
  readonly height: number;
  readonly channels: 3 | 4;
  readonly data: Uint8Array;
}

export interface GuardDecision {
  readonly pixels: Uint8Array;
  readonly similarity: number;
  readonly blended: boolean;
  readonly source: string;
}

export interface IdentityGuard {
  guard(before: Uint8Array, after: Uint8Array, lockLevel: number,
    channels: 3 | 4): GuardDecision;
}

export class ConservativeGuard implements IdentityGuard {
  guard(before: Uint8Array, after: Uint8Array, lockLevel: number,
    channels: 3 | 4): GuardDecision {
    const level = checkedLevel(lockLevel);
    if (before.length !== after.length || before.length % channels !== 0) {
      throw new RangeError('Identity guard requires equal RGB/RGBA frames');
    }
    let delta = 0;
    const n = before.length / channels;
    for (let p = 0; p < n; p++) {
      for (let c = 0; c < 3; c++) {
        const i = p * channels + c;
        delta += Math.abs(after[i] - before[i]);
      }
    }
    const measured = delta / (3 * n);
    const allowance = 9 + (5 - level) * 6.75;
    const ratio = measured > 0 ? Math.min(1, allowance / measured) : 1;
    const out = before.slice();
    for (let p = 0; p < n; p++) {
      for (let c = 0; c < 3; c++) {
        const i = p * channels + c;
        out[i] = Math.max(0, Math.min(255,
          Math.floor(before[i] + (after[i] - before[i]) * ratio + .5)));
      }
    }
    let residual = 0;
    for (let p = 0; p < n; p++) {
      for (let c = 0; c < 3; c++) {
        const i = p * channels + c;
        residual += Math.abs(out[i] - before[i]);
      }
    }
    return {
      pixels: out,
      similarity: Math.max(0, 1 - residual / (3 * n * 255)),
      blended: ratio < 1,
      source: 'conservative-local-proxy',
    };
  }
}

export interface GuardedEditResult {
  readonly pixels: Uint8Array;
  readonly similarity: number;
  readonly blended: boolean;
  readonly level: number;
  readonly lockLevel: number;
  readonly stillHerScore: number;
  readonly disclosure: string;
}

export type MaskedRenderer = (source: Uint8Array, mask: Uint8Array,
  opacity: number, width: number, height: number, channels: 3 | 4) => Uint8Array;

export function guardedEdit(frame: WomanFrame, mask: Uint8Array, render: MaskedRenderer,
  level: number = DEFAULT_LEVEL, lockLevel: number = 5,
  guard: IdentityGuard = new ConservativeGuard()): GuardedEditResult {
  const selected = checkedLevel(level);
  const lock = checkedLevel(lockLevel);
  const { width, height, channels } = frame;
  if (!Number.isInteger(width) || !Number.isInteger(height) ||
      width < 1 || height < 1 || width > 8192 || height > 8192 ||
      width * height > 16_000_000 ||
      frame.data.length !== width * height * channels ||
      mask.length !== width * height || !mask.some(Boolean)) {
    throw new RangeError('RGB/RGBA image and an authorized nonempty mask required');
  }
  const before = frame.data.slice();
  const originalMask = mask.slice();
  const candidate = render(before.slice(), mask.slice(), opacityForLevel(selected),
    width, height, channels);
  if (!(candidate instanceof Uint8Array) || candidate.length !== before.length) {
    throw new RangeError('Renderer returned an invalid buffer');
  }
  const decision = guard.guard(before.slice(), candidate.slice(), lock, channels);
  if (!(decision.pixels instanceof Uint8Array) ||
      decision.pixels.length !== before.length ||
      !Number.isFinite(decision.similarity) ||
      decision.similarity < 0 || decision.similarity > 1) {
    throw new RangeError('Identity guard returned an invalid result');
  }
  for (let p = 0; p < width * height; p++) {
    for (let c = 0; c < channels; c++) {
      const i = p * channels + c;
      if ((mask[p] === 0 || c === 3) && decision.pixels[i] !== before[i]) {
        throw new RangeError('Identity guard breached alpha or authorized mask');
      }
      if (mask[p] !== originalMask[p] || before[i] !== frame.data[i]) {
        throw new RangeError('An edit mutated the input');
      }
    }
  }
  return {
    pixels: decision.pixels.slice(),
    similarity: decision.similarity,
    blended: decision.blended,
    level: selected,
    lockLevel: lock,
    stillHerScore: 100,
    disclosure: 'Screen simulation, identity guard applied; not identity verification.',
  };
}
