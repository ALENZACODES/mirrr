/** Owned GPU (or CPU) resources with explicit release and counters (plan §6 P0 step 5;
 * the LeakCanary role, done with plain counts the tests can read).
 *
 * Every texture, framebuffer, program or buffer the pipeline makes is registered here with
 * its kind and byte estimate; releasing it twice is an error, and `dispose()` frees the
 * rest. Tests run 100 edits and check that `live` stays flat. Author: John Khan.
 */

export type ResourceKind = "texture" | "framebuffer" | "program" | "shader" | "buffer" | "vertex-array" | "cpu-image";

export interface Resource<T = unknown> {
  readonly id: number;
  readonly kind: ResourceKind;
  readonly bytes: number;
  readonly handle: T;
  readonly label: string;
}

export interface ResourceCounts {
  created: number;
  released: number;
  live: number;
  liveBytes: number;
  peakLive: number;
  byKind: Record<ResourceKind, number>;
}

export class ResourceError extends Error {}

export class ResourcePool {
  private next = 1;
  private readonly owned = new Map<number, { resource: Resource; free: () => void }>();
  private created = 0;
  private released = 0;
  private peak = 0;
  private disposed = false;

  /** Register a resource with the function that frees it. */
  own<T>(kind: ResourceKind, handle: T, free: () => void, bytes = 0, label: string = kind): Resource<T> {
    if (this.disposed) {
      free();
      throw new ResourceError("resource pool is disposed");
    }
    const resource: Resource<T> = Object.freeze({ id: this.next++, kind, bytes: Math.max(0, bytes), handle, label });
    this.owned.set(resource.id, { resource, free });
    this.created++;
    this.peak = Math.max(this.peak, this.owned.size);
    return resource;
  }

  release(resource: Resource | null | undefined): void {
    if (!resource) return;
    const entry = this.owned.get(resource.id);
    if (!entry) throw new ResourceError(`${resource.label} #${resource.id} was already released`);
    this.owned.delete(resource.id);
    this.released++;
    entry.free();
  }

  has(resource: Resource): boolean { return this.owned.has(resource.id); }

  counts(): ResourceCounts {
    const byKind: Record<ResourceKind, number> = { texture: 0, framebuffer: 0, program: 0, shader: 0, buffer: 0, "vertex-array": 0, "cpu-image": 0 };
    let liveBytes = 0;
    for (const { resource } of this.owned.values()) { byKind[resource.kind]++; liveBytes += resource.bytes; }
    return { created: this.created, released: this.released, live: this.owned.size, liveBytes, peakLive: this.peak, byKind };
  }

  /** Free everything still owned, newest first. Safe to call more than once. */
  dispose(): void {
    const entries = [...this.owned.values()].reverse();
    this.owned.clear();
    for (const entry of entries) { this.released++; entry.free(); }
    this.disposed = true;
  }

  /** After a context loss the handles are already gone: forget them without calling free. */
  forgetAll(): number {
    const n = this.owned.size;
    this.released += n;
    this.owned.clear();
    return n;
  }

  get isDisposed(): boolean { return this.disposed; }
}
