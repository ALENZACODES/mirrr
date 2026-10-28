/** Device readiness checks with injected clock and synthetic image bytes only.
 * Author: John Khan.
 */
import { ProDeviceReadinessProbe, DeviceProbeOptions } from './device-readiness.js';
import { HostProBridge } from './host-bridge.js';
import { levelFromTenths } from './levels.js';
import { createProPlan, ProPlan } from './plan.js';
import { PixelFrame, ProRenderError, RunSummary, StepSummary } from './runtime.js';

function check(value: unknown, label: string): void {
  if (!value) throw new Error(`device readiness ${label}`);
}

const COMMANDS = ['identitylock', 'cleanup', 'upscale', 'studioquality', 'poseonly'] as const;

function plan(): ProPlan {
  return createProPlan(COMMANDS.map((name, index) => ({
    index, name, level: levelFromTenths(10), scale: 2 as const,
  })));
}

function frame(value = 70): PixelFrame {
  const pixels = new Uint8Array(16 * 16 * 4);
  for (let index = 0; index < 16 * 16; index++) {
    pixels.set([value, 92, 103, 255], index * 4);
  }
  return { width: 16, height: 16, channels: 4, pixels };
}

function summary(
  quality: 'preview' | 'export',
  type: 'checked' | 'synthetic' | 'missing' | 'warned' = 'checked',
): RunSummary {
  const steps: StepSummary[] = COMMANDS.map((command, index) => ({
    index, command, level: '1.0', cacheHit: false, changed: index > 0,
    identity: type === 'missing' ? null : {
      identityMatch: 99, status: type === 'warned' ? 'warned' : 'kept',
      syntheticOnly: type === 'synthetic',
    },
  }));
  return {
    image: frame(70), quality, steps, elapsedMs: 15,
    targetMs: quality === 'preview' ? 100 : 2000,
    withinBudget: true, originalUnchanged: true,
  };
}

class MockHost {
  active = true;
  photoOpen = true;
  currentPlan: ProPlan | null = plan();
  mode: 'checked' | 'synthetic' | 'missing' | 'warned' = 'checked';
  throwPreview: ProRenderError | null = null;
  throwExport: ProRenderError | null = null;
  mutateOnPreview = false;
  renderCalls = 0;

  get state(): { photoOpen: boolean; plan: ProPlan | null } {
    return { photoOpen: this.photoOpen, plan: this.currentPlan };
  }

  async preview(signal?: AbortSignal): Promise<RunSummary> {
    this.renderCalls++;
    if (this.throwPreview !== null) throw this.throwPreview;
    if (signal?.aborted) throw new ProRenderError('host_cancelled', 'Cancelled.');
    if (this.mutateOnPreview) this.currentPlan = createProPlan([
      { name: 'cleanup', index: 0, level: levelFromTenths(30), scale: 2 },
    ]);
    return summary('preview', this.mode);
  }

  async exportImage(signal?: AbortSignal): Promise<RunSummary> {
    this.renderCalls++;
    if (this.throwExport !== null) throw this.throwExport;
    if (signal?.aborted) throw new ProRenderError('host_cancelled', 'Cancelled.');
    return summary('export', this.mode);
  }
}

function attach(host: MockHost): ProDeviceReadinessProbe {
  return new ProDeviceReadinessProbe(host as unknown as Pick<
    HostProBridge, 'state' | 'preview' | 'exportImage' | 'active'
  >);
}

function settings(overrides: Partial<DeviceProbeOptions> = {}): DeviceProbeOptions {
  return {
    repetitions: 3, warmups: 1, operatorSelectedDevice: false,
    clock: (): number => performance.now(),
    ...overrides,
  };
}

async function throws(code: string, fn: () => Promise<unknown>): Promise<void> {
  try { await fn(); }
  catch (error) {
    if (error instanceof ProRenderError && error.code === code) return;
    throw error;
  }
  throw new Error(`expected ${code}`);
}

export async function testDeviceReadinessR7H(): Promise<number> {
  let count = 0;
  const primary = new MockHost();
  let timer = 0;
  let memory = 1100;
  const checked = await attach(primary).run(settings({
    repetitions: 4, warmups: 2, operatorSelectedDevice: true,
    clock(): number { timer += 2; return timer; },
    memoryBytes(): number { memory += 10; return memory; },
  }));
  check(checked.status === 'unproven' && checked.releaseQualified === false,
    'local timing does not grant release');
  check(checked.independentlyReviewed === false, 'human review missing');
  check(checked.preview.count === 4 && checked.fullRender.count === 4,
    'expected measured sample count');
  check(checked.preview.medianMs !== null && checked.preview.p95Ms !== null,
    'preview median and P95 measured');
  check(checked.fullRender.maximumMs !== null, 'render max measured');
  check(checked.identityCheckedEveryStep, 'every command identity checked');
  check(checked.alphaMismatchPixels === 0 && checked.meanPreviewDrift === 0,
    'preview/export pixels matched');
  check(checked.maximumObservedMemoryBytes === 1220, 'memory samples bounded');
  check(primary.renderCalls === 12, 'warmups are excluded from the reported sample count');
  check(checked.issues.includes('external_realface_gate_and_human_review'),
    'independent review remains outstanding');
  count += 10;

  const serialized = JSON.stringify(checked);
  check(!serialized.includes('pixels') && !serialized.includes('filename') &&
    !serialized.includes('sourceKey') && !serialized.includes('embedding'),
    'metadata is photo-free');
  count++;

  const synthetic = new MockHost();
  synthetic.mode = 'synthetic';
  const syntheticResult = await attach(synthetic).run(settings({ warmups: 0 }));
  check(syntheticResult.issues.includes('approved_identity_model_and_realface_test'),
    'test-only identity evidence cannot certify a face');
  check(syntheticResult.issues.includes('physical_device_unverified'),
    'operator device not presumed');
  count += 2;

  for (const kind of ['missing', 'warned'] as const) {
    const host = new MockHost();
    host.mode = kind;
    const report = await attach(host).run(settings({ warmups: 0 }));
    check(report.status === 'failed' && report.errorCode === 'device_identity_unverified',
      'identity failure blocks timing certification');
    check(report.identityCheckedEveryStep === false, 'missing identity evidence recorded');
    count += 2;
  }

  const mutated = new MockHost();
  mutated.mutateOnPreview = true;
  const stale = await attach(mutated).run(settings({ warmups: 0 }));
  check(stale.status === 'failed' && stale.errorCode === 'device_probe_superseded',
    'plan mutation rejects stale results');
  count++;

  const noPhoto = new MockHost();
  noPhoto.photoOpen = false;
  await throws('device_photo_missing', () => attach(noPhoto).run(settings()));
  const disposed = new MockHost();
  disposed.active = false;
  await throws('device_photo_missing', () => attach(disposed).run(settings()));
  count += 2;

  const memoryBad = new MockHost();
  const badMemory = await attach(memoryBad).run(settings({
    warmups: 0, memoryBytes: (): number => -2,
  }));
  check(badMemory.status === 'failed' && badMemory.errorCode === 'invalid_device_memory',
    'invalid memory readings refused');
  count++;

  const failing = new MockHost();
  failing.throwExport = new ProRenderError('render_stopped', 'Private implementation error');
  const stopped = await attach(failing).run(settings({ warmups: 0 }));
  check(stopped.status === 'failed' && stopped.errorCode === 'render_stopped',
    'safe code preserved');
  check(!JSON.stringify(stopped).includes('Private implementation error'),
    'internal exception message never serialized');
  count += 2;

  const unexpected = new MockHost();
  unexpected.throwPreview = new Error('Private exception') as ProRenderError;
  const unexpectedReport = await attach(unexpected).run(settings({ warmups: 0 }));
  check(unexpectedReport.errorCode === 'device_probe_failed', 'unexpected failure redacted');
  count++;

  const brokenClock = new MockHost();
  let reading = 0;
  const badTimer = await attach(brokenClock).run(settings({
    repetitions: 1, warmups: 0,
    clock(): number {
      reading++;
      return reading === 4 ? -10 : reading * 10;
    },
  }));
  check(badTimer.status === 'failed' && badTimer.errorCode === 'invalid_device_clock',
    'decreasing wall-clock timestamps never produce valid timing claims');
  count++;

  const cancelled = new MockHost();
  const signal = new AbortController();
  signal.abort();
  const cancelledReport = await attach(cancelled).run(settings({ warmups: 0 }), signal.signal);
  check(cancelledReport.status === 'failed' &&
    cancelledReport.errorCode === 'device_probe_cancelled', 'pre-aborted request refused');
  count++;

  for (const invalid of [
    { repetitions: 0 }, { repetitions: 31 }, { repetitions: 1.5 },
    { warmups: -1 }, { warmups: 6 }, { warmups: NaN },
    { operatorSelectedDevice: 1 as unknown as boolean },
  ]) {
    await throws('invalid_device_probe', () => attach(new MockHost()).run(settings(invalid)));
    count++;
  }

  return count;
}
