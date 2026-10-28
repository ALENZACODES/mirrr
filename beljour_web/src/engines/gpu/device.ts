/** WebGL2 context creation and context-loss handling (plan §5 device.ts).
 * The canvas is any object with getContext and event listeners, so node tests can pass a fake.
 * On loss: the default is prevented (so the browser may restore it), the pool forgets the dead
 * handles without calling into the lost context, and listeners hear about it so the editor can
 * fall back to the CPU path. On restore, a fresh context is fetched; programs are rebuilt
 * lazily by the backend. Author: John Khan.
 */
import type { GLLike } from "./gl.js";
import { ResourcePool } from "./resources.js";

export interface CanvasLike {
  getContext(type: "webgl2", attributes?: Record<string, unknown>): unknown;
  addEventListener(type: string, listener: (event: { preventDefault?: () => void }) => void): void;
  removeEventListener(type: string, listener: (event: { preventDefault?: () => void }) => void): void;
}

export const CONTEXT_ATTRIBUTES = Object.freeze({
  alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false,
  preserveDrawingBuffer: false, powerPreference: "default", failIfMajorPerformanceCaveat: false,
});

export type DeviceState = "ready" | "lost" | "unavailable" | "disposed";
export type DeviceListener = (state: DeviceState) => void;

export class Device {
  readonly pool = new ResourcePool();
  private glRef: GLLike | null;
  private stateRef: DeviceState;
  private readonly listeners = new Set<DeviceListener>();
  private generationRef = 0;
  private readonly onLost = (event: { preventDefault?: () => void }) => {
    event.preventDefault?.();
    this.pool.forgetAll();
    this.set("lost");
  };
  private readonly onRestored = () => {
    this.glRef = (this.canvas.getContext("webgl2", CONTEXT_ATTRIBUTES) as GLLike | null) ?? null;
    this.generationRef++;
    this.set(this.glRef ? "ready" : "unavailable");
  };

  constructor(private readonly canvas: CanvasLike) {
    let gl: GLLike | null = null;
    try { gl = (canvas.getContext("webgl2", CONTEXT_ATTRIBUTES) as GLLike | null) ?? null; } catch { gl = null; }
    this.glRef = gl;
    this.stateRef = gl ? "ready" : "unavailable";
    canvas.addEventListener("webglcontextlost", this.onLost);
    canvas.addEventListener("webglcontextrestored", this.onRestored);
  }

  /** The live context, or null when lost, unavailable or disposed. */
  get gl(): GLLike | null {
    if (this.stateRef !== "ready" || !this.glRef || this.glRef.isContextLost()) return null;
    return this.glRef;
  }
  get state(): DeviceState { return this.stateRef; }
  /** Bumps on every restore, so cached programs know they belong to a dead context. */
  get generation(): number { return this.generationRef; }

  subscribe(listener: DeviceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private set(state: DeviceState): void {
    this.stateRef = state;
    for (const listener of [...this.listeners]) listener(state);
  }

  dispose(): void {
    if (this.stateRef === "disposed") return;
    if (this.stateRef === "ready") this.pool.dispose();
    else this.pool.forgetAll();
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onRestored);
    this.glRef = null;
    this.set("disposed");
    this.listeners.clear();
  }
}
