/** Synthetic authenticated-envelope tests. Author: John Khan. */

import assert from "node:assert/strict";
import test from "node:test";

import {
  newSessionKey, openProtectedArtifact, sealProtectedArtifact, withProtectedArtifact,
} from "../../../../dist/js/engines/upscale/protected-artifact.js";

const binding = "a".repeat(64);
const keyId = "OperatorKey98";

function sample() {
  return new Uint8Array(new TextEncoder().encode("synthetic-private-weights"));
}

test("nonextractable session key is mandatory", async () => {
  const key = await newSessionKey();
  assert.equal(key.extractable, false);
  await assert.rejects(globalThis.crypto.subtle.exportKey("raw", key), /extractable|export/i);
  const other = await globalThis.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"],
  );
  await assert.rejects(sealProtectedArtifact(sample(), "weights", binding, keyId, other),
    /non-extractable/);
});

test("only ciphertext persists and independent seals use different IVs", async () => {
  const key = await newSessionKey();
  const first = await sealProtectedArtifact(sample(), "weights", binding, keyId, key);
  const second = await sealProtectedArtifact(sample(), "weights", binding, keyId, key);
  assert.notDeepEqual(first.ciphertext, second.ciphertext);
  assert.equal(new TextDecoder().decode(first.ciphertext).includes("synthetic-private-weights"), false);
  assert.deepEqual(await openProtectedArtifact(first, "weights", binding, keyId, key), sample());
});

test("wrong key, context, kind, binding and authentication tag all refuse", async () => {
  const key = await newSessionKey();
  const artefact = await sealProtectedArtifact(sample(), "weights", binding, keyId, key);
  await assert.rejects(openProtectedArtifact(
    artefact, "weights", binding, keyId, await newSessionKey()), /authentication/);
  await assert.rejects(openProtectedArtifact(artefact, "recipe", binding, keyId, key), /context/);
  await assert.rejects(openProtectedArtifact(artefact, "weights", "b".repeat(64), keyId, key), /context/);
  const changed = { ...artefact, ciphertext: artefact.ciphertext.slice() };
  changed.ciphertext[changed.ciphertext.length - 1] ^= 0x40;
  await assert.rejects(openProtectedArtifact(changed, "weights", binding, keyId, key), /authentication/);
});

test("plaintext view is cleared on completion and on consumer failure", async () => {
  const key = await newSessionKey();
  const sealed = await sealProtectedArtifact(sample(), "checkpoint", binding, keyId, key);
  let retained;
  const value = await withProtectedArtifact(sealed, "checkpoint", binding, keyId, key,
    async bytes => {
      retained = bytes;
      assert.deepEqual(bytes, sample());
      return "ok";
    });
  assert.equal(value, "ok");
  assert.ok(retained.every(byte => byte === 0));
  await assert.rejects(withProtectedArtifact(sealed, "checkpoint", binding, keyId, key,
    async bytes => {
      retained = bytes;
      throw new Error("forced");
    }), /forced/);
  assert.ok(retained.every(byte => byte === 0));
});

test("reject empty, unbounded and malformed bytes", async () => {
  const key = await newSessionKey();
  await assert.rejects(sealProtectedArtifact(new Uint8Array(), "weights", binding, keyId, key),
    /empty or oversized/);
  await assert.rejects(sealProtectedArtifact(sample(), "weights", "not-sha", keyId, key),
    /binding/);
  const valid = await sealProtectedArtifact(sample(), "weights", binding, keyId, key);
  await assert.rejects(openProtectedArtifact({ ...valid, ciphertext: valid.ciphertext.slice(0, 3) },
    "weights", binding, keyId, key), /Malformed/);
});
