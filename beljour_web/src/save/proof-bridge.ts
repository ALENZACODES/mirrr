/** Versioned saved-look proof adapter with one transient photo reader.
 *
 * The bridge reads a saved recipe only on a user-triggered proof check. It
 * does not persist or expose photo pixels; an application-owned epoch makes
 * old runs stale when the editor opens or updates a different source. A blocked
 * IndexedDB read becomes an unavailable check, not a spurious success.
 * Author: John Khan.
 */

import { type Engine, type PhotoPixels } from "./looks.js";
import { downloadLocalReceipt } from "./proof-download.js";
import { type LookRecipe } from "./recipe.js";
import { type LookStorage } from "./storage.js";
import { type AuditInput } from "./proof-service.js";
import { type TransientBatchSource } from "./proof-scheduler.js";
import { mountProofWidget, type ProofWidget, type PortableDelivery } from "./proof-widget.js";

export interface ProofPhotoReader {
  /** Monotone, non-identifying integer updated whenever photo/recipe edits change. */
  revision(): number;
  /** An image must be read only on explicit user action and never cached here. */
  read(): PhotoPixels | Promise<PhotoPixels | null> | null;
  /** Optional privacy-reviewed encoded local output, also read on demand. */
  encoded?(): Uint8Array | Promise<Uint8Array | null> | null;
}

export interface ProofBridgeOptions {
  readonly id: () => string | null;
  readonly library: LookStorage;
  readonly photo: ProofPhotoReader;
  readonly engine: Engine;
  readonly deliverReceipt?: PortableDelivery;
}

function checkedRevision(photo: ProofPhotoReader): number {
  const value = photo.revision();
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError("invalid editor revision");
  return value;
}

function checkId(value: unknown): string {
  if (typeof value !== "string" || !/^look-[0-9a-f]{8}$/i.test(value)) {
    throw new TypeError("saved look reference is invalid");
  }
  return value;
}

function checkedPhoto(photo: PhotoPixels | null): PhotoPixels {
  if (!photo || !Number.isSafeInteger(photo.width) || !Number.isSafeInteger(photo.height) ||
    (photo.channels !== 3 && photo.channels !== 4) ||
    !(photo.data instanceof Uint8Array || photo.data instanceof Uint8ClampedArray) ||
    photo.width < 1 || photo.height < 1 || photo.width * photo.height > 16_777_216 ||
    photo.data.length !== photo.width * photo.height * photo.channels) {
    throw new TypeError("unavailable photo for local proof");
  }
  return photo;
}

/** A proof checks the latest saved version; no photo or person identifier enters a receipt. */
export async function resolveSavedProof(
  options: ProofBridgeOptions,
): Promise<{ recipe: LookRecipe; batch: TransientBatchSource; engine: Engine } | null> {
  const id = options.id();
  if (id === null) return null;
  const key = checkId(id);
  const epoch = checkedRevision(options.photo);
  const look = await options.library.get(key);
  if (checkedRevision(options.photo) !== epoch) return null;
  if (!look) return null;
  const batch: TransientBatchSource = {
    declared: 1,
    available: 1,
    revision: () => checkedRevision(options.photo),
    async read(index: number): Promise<AuditInput> {
      if (index !== 0) throw new RangeError("saved look has one current photo");
      if (checkedRevision(options.photo) !== epoch) throw new Error("photo changed during proof");
      const original = checkedPhoto(await options.photo.read());
      if (checkedRevision(options.photo) !== epoch) throw new Error("photo changed during proof");
      const encoded = options.photo.encoded ? await options.photo.encoded() : null;
      if (checkedRevision(options.photo) !== epoch) throw new Error("photo changed during export proof");
      if (encoded !== null && encoded !== undefined && !(encoded instanceof Uint8Array)) {
        throw new TypeError("invalid encoded local output");
      }
      return encoded ? { pixels: original, encoded } : { pixels: original };
    },
  };
  return { recipe: look, batch, engine: options.engine };
}

/** Pluggable browser UI; Save layout owners can mount without editing proof logic. */
export function mountSavedLookProof(root: HTMLElement, options: ProofBridgeOptions): ProofWidget {
  let currentId: string | null = null;
  const reader = async (): Promise<Awaited<ReturnType<typeof resolveSavedProof>>> => {
    const selected = options.id();
    const result = await resolveSavedProof(options);
    currentId = result && selected !== null ? checkId(selected) : null;
    return result;
  };
  const deliver: PortableDelivery = options.deliverReceipt ?? (async (name, text) => {
    if (!currentId) throw new Error("proof recipe is no longer available");
    const current = await options.library.get(currentId);
    if (!current || await downloadLocalReceipt(name, text, current) !== "downloaded") {
      throw new Error("local proof receipt is unavailable");
    }
  });
  return mountProofWidget(root, {
    readSource: reader,
    deliverReceipt: deliver,
    title: "Verify saved look locally",
  });
}
