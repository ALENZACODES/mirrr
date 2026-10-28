/** Revision-bound, cancellable posture preview workflow.
 * Slider drags coalesce so only the newest pending drag renders; a release always renders at
 * full size. Changing the photo (a new revision), cancelling or disposing makes every
 * outstanding request stale, and a stale result is never delivered as current.
 * Author: John Khan.
 */
import { type FixName, checkedPostureLevel } from "../engines/local/posture.js";

export type WorkflowStage = "preview" | "release";

export interface WorkflowRequest {
  ticket: number;
  revision: number;
  stage: WorkflowStage;
  fix: FixName;
  level: number;
  lockLevel: number;
}

export type WorkflowOutcome<T> =
  | { status: "done"; request: WorkflowRequest; value: T }
  | { status: "stale"; request: WorkflowRequest }
  | { status: "failed"; request: WorkflowRequest; error: unknown };

export type WorkflowRunner<T> = (request: WorkflowRequest) => T | Promise<T>;
export type Scheduler = (task: () => void) => void;

interface Pending<T> {
  request: WorkflowRequest;
  resolve: (outcome: WorkflowOutcome<T>) => void;
}

export class PostureWorkflow<T> {
  private revisionValue = 0;
  private ticketValue = 0;
  private latestTicket = 0;
  private pendingDrag: Pending<T> | null = null;
  private disposed = false;

  constructor(private readonly runner: WorkflowRunner<T>,
    private readonly schedule: Scheduler = (task) => queueMicrotask(task)) {}

  get revision(): number { return this.revisionValue; }
  get isDisposed(): boolean { return this.disposed; }

  /** A new photo or annotation: everything outstanding becomes stale. */
  setPhoto(): number {
    this.requireOpen();
    this.dropPendingDrag();
    this.revisionValue++;
    return this.revisionValue;
  }

  drag(fix: FixName, level: number, lockLevel: number): Promise<WorkflowOutcome<T>> {
    return this.enqueue("preview", fix, level, lockLevel);
  }

  release(fix: FixName, level: number, lockLevel: number): Promise<WorkflowOutcome<T>> {
    return this.enqueue("release", fix, level, lockLevel);
  }

  cancel(): void {
    this.dropPendingDrag();
    this.latestTicket = ++this.ticketValue;
  }

  dispose(): void {
    if (this.disposed) return;
    this.cancel();
    this.disposed = true;
  }

  private requireOpen(): void {
    if (this.disposed) throw new RangeError("posture workflow has been disposed");
  }

  private dropPendingDrag(): void {
    const pending = this.pendingDrag;
    this.pendingDrag = null;
    pending?.resolve({ status: "stale", request: pending.request });
  }

  private current(request: WorkflowRequest): boolean {
    return !this.disposed && request.revision === this.revisionValue && request.ticket === this.latestTicket;
  }

  private enqueue(stage: WorkflowStage, fix: FixName, level: number, lockLevel: number): Promise<WorkflowOutcome<T>> {
    this.requireOpen();
    const request: WorkflowRequest = { ticket: ++this.ticketValue, revision: this.revisionValue, stage, fix,
      level: checkedPostureLevel(level), lockLevel: checkedPostureLevel(lockLevel) };
    this.latestTicket = request.ticket;
    return new Promise<WorkflowOutcome<T>>((resolve) => {
      if (stage === "preview") {
        this.dropPendingDrag();
        this.pendingDrag = { request, resolve };
      } else {
        this.dropPendingDrag();
      }
      this.schedule(() => {
        if (stage === "preview") {
          if (this.pendingDrag?.request !== request) return;
          this.pendingDrag = null;
        }
        void this.execute(request, resolve);
      });
    });
  }

  private async execute(request: WorkflowRequest, resolve: (outcome: WorkflowOutcome<T>) => void): Promise<void> {
    if (!this.current(request)) {
      resolve({ status: "stale", request });
      return;
    }
    try {
      const value = await this.runner(request);
      resolve(this.current(request) ? { status: "done", request, value } : { status: "stale", request });
    } catch (error) {
      resolve(this.current(request) ? { status: "failed", request, error } : { status: "stale", request });
    }
  }
}
