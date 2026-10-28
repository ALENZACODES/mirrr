/** Screen binding for the posture panel: photo, workflow, protected render and a fail-closed gate.
 * The owning screen supplies each photo's frame (pixels, person and head masks, confirmed
 * control points) through `resolveFrame`. Every rendered result is inspected on its final
 * pixels (head bytes, outside-band bytes, Jacobian floor, alpha, strength values and label)
 * before `onFrame` or export can see it; a failing result is refused, never shown.
 * Errors carry fixed copy only, never pixel data or file names. Author: John Khan.
 */
import { type FixName } from "../engines/local/posture.js";
import { type CanvasEncoder, canvasEncoder } from "../save/export.js";
import { type PanelPhoto, checkedPanelPhoto } from "./posture-panel-state.js";
import { type PosturePanelHandle, mountPosturePanel } from "./posture-panel.js";
import { type PostureExportSettings, type PostureImageExport } from "./posture-export.js";
import { type PostureInspection, PostureOutputRefused, exportProtectedPosture,
  inspectPostureOutput } from "./posture-output.js";
import { type PostureFrame, type PreparedPostureFrame, preparePostureFrame } from "./posture-preview.js";
import { type ProtectedPostureResult, renderProtectedPosture } from "./posture-safe.js";
import { type FaceIdentityGuard, IdentityLockUnavailable } from "./posture-session.js";
import { PostureWorkflow, type Scheduler, type WorkflowRequest, type WorkflowStage } from "./posture-workflow.js";

export interface CheckedPostureFrame {
  digest: string;
  revision: number;
  stage: WorkflowStage;
  frame: PreparedPostureFrame;
  result: ProtectedPostureResult;
  inspection: PostureInspection;
}

export interface PostureScreenOptions {
  resolveFrame: (digest: string) => PostureFrame;
  identityGuard: FaceIdentityGuard | null;
  onFrame: (frame: CheckedPostureFrame) => void;
  onError: (message: string) => void;
  schedule?: Scheduler;
}

export interface PostureScreenHandle {
  readonly panel: PosturePanelHandle;
  setPhoto(photo: PanelPhoto): void;
  clearPhoto(): void;
  latest(): CheckedPostureFrame | null;
  /** Full-size render of the panel's current selection; null if stale, refused or nothing selected. */
  release(): Promise<CheckedPostureFrame | null>;
  /** Full-size render of an explicit edit (used by history replay); null if stale or refused. */
  renderRelease(fix: FixName, level: number, lockLevel: number): Promise<CheckedPostureFrame | null>;
  export(settings?: PostureExportSettings, encoder?: CanvasEncoder): Promise<PostureImageExport>;
  dispose(): void;
}

export const REFUSED_OUTPUT_MESSAGE = "The edited image failed its safety checks and was not shown.";
export const FAILED_EDIT_MESSAGE = "This posture edit could not be made.";

export function publicPostureError(error: unknown): string {
  if (error instanceof PostureOutputRefused) return REFUSED_OUTPUT_MESSAGE;
  if (error instanceof IdentityLockUnavailable) return "Identity protection is required for this edit.";
  return FAILED_EDIT_MESSAGE;
}

/** Render and gate one request; throws PostureOutputRefused if final pixels fail inspection. */
export function checkedPostureRender(frame: PostureFrame, request: Pick<WorkflowRequest, "fix" | "level" |
  "lockLevel" | "stage">, guard: FaceIdentityGuard | null): { frame: PreparedPostureFrame; result: ProtectedPostureResult;
  inspection: PostureInspection } {
  const prepared = preparePostureFrame(frame, request.stage === "release");
  const result = renderProtectedPosture(prepared.image, prepared.person, prepared.head, prepared.controls,
    request.fix, request.level, guard, request.lockLevel);
  const inspection = inspectPostureOutput(prepared.image, result, prepared.head);
  if (!inspection.passed) throw new PostureOutputRefused(inspection.reasons);
  return { frame: prepared, result, inspection };
}

export function installPostureScreen(parent: HTMLElement, options: PostureScreenOptions): PostureScreenHandle {
  let photo: PanelPhoto | null = null;
  let latest: CheckedPostureFrame | null = null;
  const runner = (request: WorkflowRequest): CheckedPostureFrame => {
    if (!photo) throw new RangeError("no photo");
    const digest = photo.digest;
    const frame = options.resolveFrame(digest);
    if (frame.image.width !== photo.width || frame.image.height !== photo.height ||
        frame.controls.view !== photo.view) {
      throw new RangeError("frame does not belong to the current photo");
    }
    return { digest, revision: request.revision, stage: request.stage,
      ...checkedPostureRender(frame, request, options.identityGuard) };
  };
  const workflow = new PostureWorkflow<CheckedPostureFrame>(runner, options.schedule);
  const run = async (stage: WorkflowStage, fix: FixName, level: number, lock: number): Promise<CheckedPostureFrame | null> => {
    const outcome = await (stage === "release" ? workflow.release(fix, level, lock) : workflow.drag(fix, level, lock));
    if (outcome.status === "done") {
      if (stage === "release") latest = outcome.value;
      options.onFrame(outcome.value);
      return outcome.value;
    }
    if (outcome.status === "failed") {
      if (stage === "release") latest = null;
      options.onError(publicPostureError(outcome.error));
    }
    return null;
  };
  const deliver = (stage: WorkflowStage) => (fix: FixName, level: number, lock: number): void => {
    void run(stage, fix, level, lock);
  };
  const panel = mountPosturePanel(parent, { onPreview: deliver("preview"), onRelease: deliver("release") });
  panel.setGuardAvailable(options.identityGuard !== null);
  let disposed = false;
  const open = (): void => {
    if (disposed) throw new RangeError("posture screen has been disposed");
  };

  return {
    panel,
    setPhoto(next: PanelPhoto) {
      open();
      photo = checkedPanelPhoto(next);
      latest = null;
      workflow.setPhoto();
      panel.setPhoto(photo);
    },
    clearPhoto() {
      open();
      photo = null;
      latest = null;
      workflow.setPhoto();
      panel.setPhoto(null);
    },
    latest: () => latest,
    async release() {
      open();
      const state = panel.state();
      return state.selected ? run("release", state.selected, state.level, state.lockLevel) : null;
    },
    async renderRelease(fix: FixName, level: number, lockLevel: number) {
      open();
      return run("release", fix, level, lockLevel);
    },
    async export(settings: PostureExportSettings = {}, encoder: CanvasEncoder = canvasEncoder()) {
      open();
      const current = latest;
      if (!current || current.stage !== "release" || !photo || current.digest !== photo.digest ||
          current.revision !== workflow.revision) {
        throw new RangeError("Release a full-size edit of the current photo before saving.");
      }
      return exportProtectedPosture(current.result, current.inspection, settings, encoder);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      workflow.dispose();
      panel.dispose();
      photo = null;
      latest = null;
    },
  };
}
