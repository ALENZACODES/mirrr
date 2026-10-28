/** Encrypted posture history recovery; no readable edit records at rest.
 * Author: John Khan.
 */

import type { PostureSettingsStore } from "./posture-history-storage.js";
import { privateSourceBinding } from "../pro/source-binding.js";
import type { PostureHistoryEdit } from "./posture-history.js";
import { PostureEditHistory } from "./posture-history.js";
import { openProtectedArtifact } from "../engines/upscale/protected-artifact.js";
import { sealProtectedArtifact } from "../engines/upscale/protected-artifact.js";
import type { ProtectedArtifact } from "../engines/upscale/protected-artifact.js";

const SCHEMA = "beljour-private-history/1";
const MAX_BYTES = 65536;
const HEX = /^[0-9a-f]+$/;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
}

function fromHex(text: string): Uint8Array<ArrayBuffer> {
  if (text.length > MAX_BYTES * 2 || text.length % 2 !== 0 || !HEX.test(text)) {
    throw new RangeError("Invalid encrypted history encoding");
  }
  return Uint8Array.from(text.match(/../g)!, part => Number.parseInt(part, 16));
}

function checkedStoreKey(key: string): void {
  if (!/^[a-z0-9:_-]{1,64}$/.test(key)) throw new RangeError("Invalid recovery key");
}

export async function saveProtectedPostureHistory(
  store: PostureSettingsStore, storageKey: string, sourceHash: string,
  sessionSalt: Uint8Array, history: PostureEditHistory,
  keyId: string, key: CryptoKey,
): Promise<void> {
  checkedStoreKey(storageKey);
  const binding = await privateSourceBinding(sourceHash, sessionSalt);
  const settings = history.exportSettings(sourceHash);
  const plaintext = new TextEncoder().encode(JSON.stringify({
    schema: SCHEMA, entries: settings.entries, cursor: settings.cursor,
  }));
  try {
    const sealed = await sealProtectedArtifact(plaintext, "tuning", binding, keyId, key);
    const record = JSON.stringify({
      format: sealed.format, kind: sealed.kind, keyId: sealed.keyId,
      binding: sealed.binding, encrypted: toHex(sealed.ciphertext),
    });
    if (record.length > MAX_BYTES) throw new RangeError("Encrypted history is oversized");
    store.setItem(storageKey, record);
  } finally {
    plaintext.fill(0);
  }
}

export async function restoreProtectedPostureHistory(
  store: PostureSettingsStore, storageKey: string, sourceHash: string,
  sessionSalt: Uint8Array, history: PostureEditHistory,
  keyId: string, key: CryptoKey,
): Promise<boolean> {
  checkedStoreKey(storageKey);
  const raw = store.getItem(storageKey);
  if (raw === null) return false;
  if (raw.length > MAX_BYTES) throw new RangeError("Encrypted history is oversized");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new RangeError("Invalid encrypted history record");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new RangeError("Invalid encrypted history record");
  }
  const fields = parsed as Record<string, unknown>;
  if (Object.keys(fields).sort().join(",") !==
      "binding,encrypted,format,keyId,kind" || typeof fields.encrypted !== "string" ||
      typeof fields.keyId !== "string" || typeof fields.binding !== "string") {
    throw new RangeError("Invalid encrypted history record");
  }
  const binding = await privateSourceBinding(sourceHash, sessionSalt);
  const artifact: ProtectedArtifact = {
    format: fields.format as ProtectedArtifact["format"],
    kind: fields.kind as ProtectedArtifact["kind"],
    keyId: fields.keyId,
    binding: fields.binding,
    ciphertext: fromHex(fields.encrypted),
  };
  const decrypted = await openProtectedArtifact(artifact, "tuning", binding, keyId, key);
  try {
    const value: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(decrypted));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new RangeError("Invalid decrypted history");
    }
    const payload = value as Record<string, unknown>;
    if (Object.keys(payload).sort().join(",") !== "cursor,entries,schema" ||
        payload.schema !== SCHEMA || !Array.isArray(payload.entries) ||
        typeof payload.cursor !== "number") {
      throw new RangeError("Invalid decrypted history");
    }
    history.restoreSettings(sourceHash, {
      entries: payload.entries as PostureHistoryEdit[], cursor: payload.cursor,
    });
    return true;
  } finally {
    decrypted.fill(0);
  }
}
