/** All five Pro Commands share one default-on identity-guarded browser runner.
 * Checked region suppliers are invoked once per selected image, not per slider.
 * Author: John Khan.
 */
import { CheckedSpot } from './cpu-cleanup.js';
import { DEFAULT_STUDIO_CONTROLS, CpuStudioQuality, StudioControls } from './studio-quality.js';
import { CheckedPose, CpuPoseOnly, validatePose } from './pose-only.js';
import { ProPlan, RenderQuality } from './plan.js';
import { PreviewTicket } from './preview.js';
import { CheckedRegions, PhotoRegions } from './regions.js';
import { R2HBrowserSession, R2HSessionState } from './r2h-session.js';
import { IdentityPort, PixelFrame, RenderBudget, RunSummary, checkedFrame } from './runtime.js';

export type RegionSupplier = (image: PixelFrame) => CheckedRegions | null;

export interface R3HSessionState extends R2HSessionState {
  readonly poseAvailable: boolean;
  readonly studioLastLevel: string | null;
  readonly poseLastLevel: string | null;
}

export class R3HBrowserSession {
  private readonly regions = new PhotoRegions();
  private readonly studio: CpuStudioQuality;
  private readonly pose: CpuPoseOnly;
  private readonly root: R2HBrowserSession;
  private posePresent = false;

  constructor(
    identity: IdentityPort | null,
    settings: StudioControls = DEFAULT_STUDIO_CONTROLS,
    budget?: RenderBudget,
    clock: () => number = () => performance.now(),
  ) {
    this.studio = new CpuStudioQuality(this.regions, settings);
    this.pose = new CpuPoseOnly(this.regions);
    this.root = new R2HBrowserSession(identity, {
      studioquality: async (image, step, quality, signal) =>
        this.studio.render(image, step.level, quality === 'preview', signal),
      poseonly: async (image, step, quality, signal) =>
        this.pose.render(image, step.level, quality === 'preview', signal),
    }, budget, clock);
  }

  openPhoto(
    source: PixelFrame,
    key: string,
    supplier: RegionSupplier | null = null,
    spots: readonly CheckedSpot[] = [],
    pose: CheckedPose | null = null,
  ): void {
    checkedFrame(source);
    const validatedPose = pose === null ? null : validatePose(pose, source);
    const regions = supplier?.(source) ?? null;
    const held = regions === null ? null : (): CheckedRegions => regions;
    this.root.openPhoto(source, key, held, spots);
    this.regions.open(source, held);
    this.pose.openPhoto(source, validatedPose);
    this.posePresent = validatedPose !== null;
  }

  closePhoto(): void {
    this.root.closePhoto();
    this.regions.close();
    this.pose.closePhoto();
    this.posePresent = false;
  }

  run(plan: ProPlan, quality: RenderQuality = 'export',
    signal?: AbortSignal, current?: () => boolean): Promise<RunSummary> {
    return this.root.run(plan, quality, signal, current);
  }

  request(plan: ProPlan, quality: RenderQuality = 'preview'): PreviewTicket {
    return this.root.request(plan, quality);
  }

  renderReady(ticket: PreviewTicket,
    scaler: (photo: PixelFrame, edge: number) => PixelFrame): Promise<RunSummary> {
    return this.root.renderReady(ticket, scaler);
  }

  undo(): PixelFrame | null {
    return this.root.undo();
  }

  get studioMetrics(): CpuStudioQuality['lastMetrics'] {
    return this.studio.lastMetrics;
  }

  get poseMetrics(): CpuPoseOnly['lastMetrics'] {
    return this.pose.lastMetrics;
  }

  get state(): R3HSessionState {
    return {
      ...this.root.state,
      poseAvailable: this.posePresent,
      studioLastLevel: this.studio.lastMetrics?.level ?? null,
      poseLastLevel: this.pose.lastMetrics?.level ?? null,
    };
  }
}
