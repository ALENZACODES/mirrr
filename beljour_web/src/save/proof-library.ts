/** Guarded, revision-aware writes for the versioned My Looks storage.
 *
 * A checked write reads the recipe back before claiming persistence. Writes
 * through the same instance are serialized by look ID. A different browser
 * tab/database writer is not locked by this class: the full IndexedDB commit
 * must still be verified by a real browser test. Nothing here stores photos.
 * Author: John Khan.
 */

import { canonical, hashSettings } from "./proof-plan.js";
import { type LookRecipe, cloneLook } from "./recipe.js";
import { type LookStorage } from "./storage.js";
import { validateRecipe } from "./validate.js";

export const VERIFIED_SAVE_FORMAT = "beljour-verified-look-save/1";
export type VerifiedSaveStatus = "stored" | "conflict" | "denied" | "aborted" | "changed";

export interface VerifiedSaveResult {
  readonly format: typeof VERIFIED_SAVE_FORMAT;
  readonly status: VerifiedSaveStatus;
  readonly version: number;
  readonly persisted: boolean;
  readonly reason: "readback_match" | "missing_or_changed" | "storage_unavailable" | "cancelled" | "version_conflict";
}

export interface VerifiedSaveOptions {
  readonly expectedVersion?: number;
  /** User-triggered cancel, checked before the write and before accepting readback. */
  readonly abort?: AbortSignal;
}

function versionCount(look: LookRecipe): number {
  return look.versions.length;
}

function result(status: VerifiedSaveStatus, version: number, reason: VerifiedSaveResult["reason"]): VerifiedSaveResult {
  return {
    format: VERIFIED_SAVE_FORMAT,
    status,
    version,
    persisted: status === "stored",
    reason,
  };
}

function checkedVersion(version: number | undefined): number | undefined {
  if (version === undefined) return undefined;
  if (!Number.isSafeInteger(version) || version < 0 || version > 64) {
    throw new RangeError("invalid expected Look version");
  }
  return version;
}

function validId(look: LookRecipe): string {
  const id = look.id;
  if (!/^look-[0-9a-f]{8}$/i.test(id)) throw new TypeError("invalid saved Look ID");
  return id;
}

/**
 * Serialize writers per ID without retaining Look settings, photos or a
 * background task. Always delete settled locks from the map.
 */
export class VerifiedLookLibrary {
  private readonly writes = new Map<string, Promise<void>>();

  constructor(private readonly storage: LookStorage) {}

  /** No queued snapshots are exposed to UI or export. */
  queued(): number {
    return this.writes.size;
  }

  async save(raw: LookRecipe, options: VerifiedSaveOptions = {}): Promise<VerifiedSaveResult> {
    const look = validateRecipe(cloneLook(raw));
    const id = validId(look);
    const expectedVersion = checkedVersion(options.expectedVersion);
    const previous = this.writes.get(id);
    let release!: () => void;
    const lock = new Promise<void>((resolve) => { release = resolve; });
    this.writes.set(id, lock);
    if (previous) await previous;
    try {
      if (options.abort?.aborted) return result("aborted", versionCount(look), "cancelled");
      let existing: LookRecipe | null;
      try {
        existing = await this.storage.get(id);
      } catch {
        return result("denied", versionCount(look), "storage_unavailable");
      }
      if (options.abort?.aborted) return result("aborted", versionCount(look), "cancelled");
      if (expectedVersion !== undefined && versionCount(existing ?? { ...look, versions: [] }) !== expectedVersion) {
        return result("conflict", versionCount(look), "version_conflict");
      }
      // A valid update must preserve every historical version, never rewrite v1.
      if (existing && (versionCount(look) < versionCount(existing) ||
        existing.versions.some((version, index) => canonical(version) !== canonical(look.versions[index])))) {
        return result("conflict", versionCount(look), "version_conflict");
      }
      if (options.abort?.aborted) return result("aborted", versionCount(look), "cancelled");
      try {
        await this.storage.put(look);
      } catch {
        return result("denied", versionCount(look), "storage_unavailable");
      }
      // A returned write request alone does not establish that a recipe can be read back.
      let readback: LookRecipe | null;
      try {
        readback = await this.storage.get(id);
      } catch {
        return result("denied", versionCount(look), "storage_unavailable");
      }
      if (options.abort?.aborted) return result("aborted", versionCount(look), "cancelled");
      if (!readback || canonical(readback) !== canonical(look)) {
        return result("changed", versionCount(look), "missing_or_changed");
      }
      return result("stored", versionCount(look), "readback_match");
    } finally {
      release();
      if (this.writes.get(id) === lock) this.writes.delete(id);
    }
  }

  /**
   * Settings-only digest for conservative comparison. A hash is not a
   * signature, identifier for a person, or proof that an image was edited.
   */
  async digest(raw: LookRecipe): Promise<string> {
    const look = validateRecipe(raw);
    return hashSettings(canonical(look));
  }
}

export function validateVerifiedSave(raw: unknown): VerifiedSaveResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new TypeError("invalid save receipt");
  const obj = raw as Record<string, unknown>;
  const names = ["format", "status", "version", "persisted", "reason"];
  if (Object.keys(obj).length !== names.length || names.some((name) => !Object.hasOwn(obj, name))) {
    throw new TypeError("unexpected save receipt fields");
  }
  const versions: readonly unknown[] = ["stored", "conflict", "denied", "aborted", "changed"];
  const reasons: readonly unknown[] = ["readback_match", "missing_or_changed", "storage_unavailable", "cancelled", "version_conflict"];
  if (obj.format !== VERIFIED_SAVE_FORMAT || !versions.includes(obj.status) || !reasons.includes(obj.reason) ||
    typeof obj.version !== "number" || !Number.isSafeInteger(obj.version) || obj.version < 1 || obj.version > 64 ||
    typeof obj.persisted !== "boolean") {
    throw new TypeError("invalid verified save status");
  }
  const expectedReason: Record<VerifiedSaveStatus, VerifiedSaveResult["reason"]> = {
    stored: "readback_match",
    conflict: "version_conflict",
    denied: "storage_unavailable",
    aborted: "cancelled",
    changed: "missing_or_changed",
  };
  const status = obj.status as VerifiedSaveStatus;
  if (obj.reason !== expectedReason[status] || obj.persisted !== (status === "stored")) {
    throw new TypeError("verified save counts do not support the claim");
  }
  return result(status, obj.version, expectedReason[status]);
}
