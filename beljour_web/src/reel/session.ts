/** Owned lifetime for one local reel render.
 * The consumer screen can adopt this helper without changing frame detection,
 * provider calls or the held video engine. Nothing runs after abort/dispose.
 */
export interface ReelDisposable {
  dispose(): void;
}

export interface ReelAudioHandle {
  close(): Promise<void>;
}

export interface ReelVideoHandle extends EventTarget {
  readonly ended: boolean;
  readonly paused: boolean;
  pause(): void;
  requestVideoFrameCallback?: (callback: VideoFrameRequestCallback) => number;
  cancelVideoFrameCallback?: (id: number) => void;
}

export interface ReelScheduler {
  request(callback: FrameRequestCallback): number;
  cancel(id: number): void;
}

export interface ReelScopeStats {
  readonly state: "active" | "disposed";
  readonly urlCount: number;
  readonly resourceCount: number;
  readonly pendingFrames: number;
  readonly frameCalls: number;
}

export class ReelScopeError extends Error {
  constructor(public readonly code: string) {
    super(code === "REEL_ABORTED" ? "Clip rendering was cancelled" : "Clip rendering could not complete");
    this.name = "ReelScopeError";
  }
}

function browserScheduler(): ReelScheduler {
  return {
    request: (callback) => requestAnimationFrame(callback),
    cancel: (id) => cancelAnimationFrame(id),
  };
}

/** Release each reference independently, even when a device's close() rejects.
 * The caller continues to own its photo, recipe and decoded input unless
 * explicitly handed to this scope.
 */
export class ReelJobScope {
  private readonly controller = new AbortController();
  private readonly externalSignal: AbortSignal | undefined;
  private readonly scheduler: ReelScheduler;
  private readonly urls = new Map<string, (url: string) => void>();
  private readonly resources = new Set<ReelDisposable>();
  private readonly audios = new Set<ReelAudioHandle>();
  private readonly frames = new Map<number, () => void>();
  private readonly videos = new Set<ReelVideoHandle>();
  private disposed = false;
  private nextFrameId = 0;
  private frameCalls = 0;
  private disposing: Promise<void> | null = null;
  private readonly onExternalAbort = (): void => {
    this.cancel();
  };

  constructor(externalSignal?: AbortSignal, scheduler: ReelScheduler = browserScheduler()) {
    this.scheduler = scheduler;
    this.externalSignal = externalSignal;
    if (externalSignal?.aborted) {
      this.controller.abort();
      this.disposed = true;
    } else {
      externalSignal?.addEventListener("abort", this.onExternalAbort, { once: true });
    }
  }

  get signal(): AbortSignal {
    return this.controller.signal;
  }

  get stats(): ReelScopeStats {
    return {
      state: this.disposed ? "disposed" : "active",
      urlCount: this.urls.size,
      resourceCount: this.resources.size + this.audios.size + this.videos.size,
      pendingFrames: this.frames.size,
      frameCalls: this.frameCalls,
    };
  }

  private assertActive(): void {
    if (this.signal.aborted || this.disposed) throw new ReelScopeError("REEL_ABORTED");
  }

  ownResource<T extends ReelDisposable>(resource: T): T {
    this.assertActive();
    this.resources.add(resource);
    return resource;
  }

  ownAudio<T extends ReelAudioHandle>(audio: T): T {
    this.assertActive();
    this.audios.add(audio);
    return audio;
  }

  ownVideo<T extends ReelVideoHandle>(video: T): T {
    this.assertActive();
    this.videos.add(video);
    return video;
  }

  ownObjectUrl(url: string, revoke: (url: string) => void = URL.revokeObjectURL): string {
    this.assertActive();
    if (typeof url !== "string" || !url.startsWith("blob:")) {
      throw new ReelScopeError("REEL_URL_INVALID");
    }
    if (this.urls.has(url)) throw new ReelScopeError("REEL_URL_DUPLICATE");
    this.urls.set(url, revoke);
    return url;
  }

  /** Frames are scheduled one at a time. A paused/ended video leaves no
   * outstanding callback; a scope cancel disables even queued stale callbacks.
   */
  startFrameLoop(video: ReelVideoHandle, draw: (now: number) => void,
    onError: (error: unknown) => void = () => undefined): () => void {
    this.assertActive();
    this.ownVideo(video);
    let running = true;
    const ownFrames = new Set<number>();
    const request = (): void => {
      if (!running || this.signal.aborted || video.paused || video.ended) return;
      const id = ++this.nextFrameId;
      const callback = (now: number): void => {
        if (!ownFrames.delete(id)) return;
        this.frames.delete(id);
        if (!running || this.signal.aborted || video.paused || video.ended) return;
        this.frameCalls++;
        try {
          draw(now);
        } catch (error) {
          this.cancel();
          onError(error);
          return;
        }
        request();
      };
      if (video.requestVideoFrameCallback && video.cancelVideoFrameCallback) {
        const callbackId = video.requestVideoFrameCallback((now) => callback(now));
        this.frames.set(id, () => video.cancelVideoFrameCallback?.(callbackId));
      } else {
        const callbackId = this.scheduler.request(callback);
        this.frames.set(id, () => this.scheduler.cancel(callbackId));
      }
      ownFrames.add(id);
    };
    const release = { dispose: (): void => stop() };
    const stop = (): void => {
      if (!running) return;
      running = false;
      for (const id of ownFrames) {
        const cancel = this.frames.get(id);
        try {
          cancel?.();
        } catch {
          // The browser may have already released a callback.
        }
        this.frames.delete(id);
      }
      ownFrames.clear();
      this.resources.delete(release);
    };
    this.ownResource(release);
    request();
    return stop;
  }

  /** The listener is removed on success, error, or cancellation. */
  waitForEnd(video: ReelVideoHandle): Promise<void> {
    this.assertActive();
    if (video.ended) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      const clear = (): void => {
        video.removeEventListener("ended", ended);
        video.removeEventListener("error", failed);
        this.signal.removeEventListener("abort", aborted);
      };
      const ended = (): void => {
        clear();
        resolve();
      };
      const failed = (): void => {
        clear();
        reject(new ReelScopeError("REEL_PLAYBACK_FAILED"));
      };
      const aborted = (): void => {
        clear();
        reject(new ReelScopeError("REEL_ABORTED"));
      };
      video.addEventListener("ended", ended, { once: true });
      video.addEventListener("error", failed, { once: true });
      this.signal.addEventListener("abort", aborted, { once: true });
      if (this.signal.aborted) aborted();
    });
  }

  cancel(): void {
    if (this.disposed) return;
    this.controller.abort();
    void this.dispose();
  }

  dispose(): Promise<void> {
    if (this.disposing) return this.disposing;
    if (this.disposed) return Promise.resolve();
    this.disposed = true;
    this.controller.abort();
    this.externalSignal?.removeEventListener("abort", this.onExternalAbort);
    for (const cancel of this.frames.values()) {
      try {
        cancel();
      } catch {
        // Continue disposal even when a browser callback is already gone.
      }
    }
    this.frames.clear();
    for (const video of this.videos) {
      try {
        video.pause();
      } catch {
        // Pausing an already-released video must not retain anything else.
      }
    }
    this.videos.clear();
    for (const resource of this.resources) {
      try {
        resource.dispose();
      } catch {
        // Release remaining resources even if one cleanup implementation fails.
      }
    }
    this.resources.clear();
    for (const [url, revoke] of this.urls) {
      try {
        revoke(url);
      } catch {
        // User-provided revokers cannot block further cleanup.
      }
    }
    this.urls.clear();
    const closing = Array.from(this.audios, (audio) => {
      try {
        return Promise.resolve(audio.close()).then(() => undefined, () => undefined);
      } catch {
        return Promise.resolve();
      }
    });
    this.audios.clear();
    this.disposing = Promise.all(closing).then(() => undefined);
    return this.disposing;
  }
}

/** Convenience guard for caller-owned asynchronous recording steps.
 * Ownership ends even if scanning, frame upload, recording, or finalization fails.
 */
export async function withReelJobScope<T>(task: (scope: ReelJobScope) => Promise<T>,
  signal?: AbortSignal, scheduler?: ReelScheduler): Promise<T> {
  const scope = new ReelJobScope(signal, scheduler);
  try {
    if (scope.signal.aborted) throw new ReelScopeError("REEL_ABORTED");
    const result = await task(scope);
    if (scope.signal.aborted) throw new ReelScopeError("REEL_ABORTED");
    return result;
  } finally {
    await scope.dispose();
  }
}
