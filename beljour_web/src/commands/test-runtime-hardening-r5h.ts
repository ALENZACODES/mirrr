/** Malformed embedding adapter behavior must never produce a saved edit.
 * Synthetic frames and injected guards only. Author: John Khan.
 */
import { createProPlan } from './plan.js';
import { levelFromTenths } from './levels.js';
import {
  IdentityOutcome, IdentityPort, PixelFrame, ProBrowserRuntime, ProRenderError,
} from './runtime.js';

function check(value: unknown, message: string): void {
  if (!value) throw new Error(`guard boundary ${message}`);
}

async function rejects(code: string, action: () => Promise<unknown>): Promise<void> {
  try { await action(); }
  catch (error) {
    if (error instanceof ProRenderError && error.code === code) return;
    throw error;
  }
  throw new Error(`guard boundary expected ${code}`);
}

function photo(): PixelFrame {
  const pixels = new Uint8Array(12 * 12 * 4);
  for (let i = 0; i < 144; i++) pixels.set([80, 40, 140, 233], i * 4);
  return { width: 12, height: 12, channels: 4, pixels };
}

const PLAN = createProPlan([{ name: 'cleanup', index: 0,
  level: levelFromTenths(25), scale: 2 }]);

function runtime(adapter: IdentityPort): ProBrowserRuntime {
  return new ProBrowserRuntime({
    cleanup: async (frame): Promise<PixelFrame> => {
      const pixels = new Uint8Array(frame.pixels);
      pixels[0] = 90;
      return { ...frame, pixels };
    },
  }, adapter);
}

function guard(fn: (input: PixelFrame) => IdentityOutcome): IdentityPort {
  return {
    modelEvidenceKey: 'synthetic-only',
    async enforce(_original: PixelFrame, input: PixelFrame): Promise<IdentityOutcome> {
      return fn(input);
    },
  };
}

async function render(adapter: IdentityPort) {
  const engine = runtime(adapter);
  const input = photo();
  const report = await engine.run(PLAN, input, 'preview', 'drawn-case',
    new AbortController().signal, () => true);
  return { report, engine, input };
}

export async function testRuntimeHardeningR5H(): Promise<number> {
  let count = 0;
  const valid = guard((input) => ({ frame: input, identityMatch: 98,
    status: 'kept', syntheticOnly: true }));
  const good = await render(valid);
  check(good.report.steps.length === 1, 'valid guarded edit completes');
  check(good.report.steps[0].identity?.syntheticOnly, 'source provenance retained');
  check(good.report.image.pixels[0] === 90 && good.input.pixels[0] === 80,
    'source kept immutable');
  count += 3;
  const changeAlpha = guard(input => {
    const altered = { ...input, pixels: new Uint8Array(input.pixels) };
    altered.pixels[3] = 0;
    return { frame: altered, identityMatch: 90, status: 'softened', syntheticOnly: true };
  });
  await rejects('invalid_guard_alpha', () => render(changeAlpha));
  count++;
  const truncate = guard(input => ({
    frame: { ...input, width: input.width / 2, height: input.height * 2 },
    identityMatch: 100, status: 'kept', syntheticOnly: true,
  }));
  await rejects('invalid_guard_output', () => render(truncate));
  count++;
  for (const invalid of [Number.NaN, -1, 101, 93.7]) {
    const falseMeter = guard(input => ({
      frame: input, identityMatch: invalid, status: 'kept', syntheticOnly: true,
    }));
    await rejects('invalid_guard_evidence', () => render(falseMeter));
    count++;
  }
  const fakeStatus = guard(input => ({
    frame: input, identityMatch: 90, status: 'approved' as IdentityOutcome['status'],
    syntheticOnly: true,
  }));
  await rejects('invalid_guard_evidence', () => render(fakeStatus));
  count++;
  const invalidFlag = guard(input => ({
    frame: input, identityMatch: 90, status: 'kept',
    syntheticOnly: 'yes' as unknown as boolean,
  }));
  await rejects('invalid_guard_evidence', () => render(invalidFlag));
  count++;
  const input = photo();
  const engine = runtime(changeAlpha);
  await rejects('invalid_guard_alpha', () => engine.run(PLAN, input, 'preview', 'case',
    new AbortController().signal, () => true));
  check(engine.cachedBytes === 0, 'rejected identity output never cached');
  check(input.pixels[3] === 233, 'rejected guard cannot mutate original alpha');
  count += 2;
  return count;
}
