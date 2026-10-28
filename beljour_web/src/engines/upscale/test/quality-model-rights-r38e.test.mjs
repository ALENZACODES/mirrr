/** Browser re-check of model rights records and exact weight bytes. Synthetic bytes only.
 * Author: John Khan.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { record } from "./quality-model-fixtures-r38e.mjs";
import {
  MAX_QUALITY_MODEL_BYTES, QUALITY_MODEL_ROLES, checkModelRights, verifyModelBytes,
} from "../../../../dist/js/engines/upscale/quality-model-rights.js";

const BYTES = Uint8Array.from([3, 1, 4, 1, 5, 9, 2, 6]);

test("an allowed exact record is accepted and frozen", () => {
  const checked = checkModelRights(record("swinir_preclean", BYTES), "swinir_preclean");
  assert.equal(checked.gateDecision, "allowed");
  assert.equal(checked.licence, "Apache-2.0");
  assert.equal(checked.weightsBytes, BYTES.byteLength);
  assert.ok(Object.isFrozen(checked));
});

test("each role carries the licence of its reviewed upstream project", () => {
  assert.deepEqual(Object.fromEntries(Object.entries(QUALITY_MODEL_ROLES).map(([role, spec]) => [role, spec.licence])), {
    swinir_preclean: "Apache-2.0", realesrgan_upscale: "BSD-3-Clause", modnet_matte: "Apache-2.0",
  });
  assert.deepEqual(Object.values(QUALITY_MODEL_ROLES).map(spec => spec.stage), ["preclean", "upscale", "matte"]);
});

test("pending and blocked reviews keep the classical engine", () => {
  for (const gateDecision of ["pending", "blocked"]) {
    assert.throws(() => checkModelRights({ ...record("realesrgan_upscale", BYTES), gateDecision },
      "realesrgan_upscale"), new RegExp(`rights review is ${gateDecision}; the classical engine stays active`));
  }
});

test("a record reviewed for another stage is refused", () => {
  assert.throws(() => checkModelRights(record("modnet_matte", BYTES), "realesrgan_upscale"),
    /reviewed for modnet_matte, not realesrgan_upscale/);
});

test("a commercially allowed but different licence is refused", () => {
  assert.throws(() => checkModelRights({ ...record("swinir_preclean", BYTES), licence: "MIT" }, "swinir_preclean"),
    /does not match the reviewed SwinIR release/);
  assert.throws(() => checkModelRights({ ...record("swinir_preclean", BYTES), licence: "Research only" },
    "swinir_preclean"), /commercial licence not approved/);
});

test("malformed fields fail closed", () => {
  const good = record("swinir_preclean", BYTES);
  const cases = [
    [{ ...good, extra: true }, /malformed/],
    [{ ...good, format: "other/1" }, /unknown model rights format/],
    [{ ...good, upstreamCommit: "main" }, /immutable upstream commit/],
    [{ ...good, weightsSha256: good.weightsSha256.toUpperCase() }, /lower-case SHA-256/],
    [{ ...good, reviewSha256: "0".repeat(63) }, /lower-case SHA-256/],
    [{ ...good, weightsBytes: MAX_QUALITY_MODEL_BYTES + 1 }, /invalid byte size/],
    [{ ...good, weightsBytes: 0 }, /invalid byte size/],
    [null, /malformed/],
  ];
  for (const [value, pattern] of cases) assert.throws(() => checkModelRights(value, "swinir_preclean"), pattern);
});

test("exact bytes verify; a changed byte or length does not", async () => {
  const checked = checkModelRights(record("swinir_preclean", BYTES), "swinir_preclean");
  await verifyModelBytes(checked, BYTES.slice());
  const changed = BYTES.slice();
  changed[2] ^= 1;
  await assert.rejects(verifyModelBytes(checked, changed), /sha256 mismatch/);
  await assert.rejects(verifyModelBytes(checked, BYTES.subarray(1)), /weight size mismatch/);
});

test("a view into a larger buffer is hashed from its own bytes only", async () => {
  const checked = checkModelRights(record("swinir_preclean", BYTES), "swinir_preclean");
  const backing = new Uint8Array(BYTES.byteLength + 6).fill(77);
  backing.set(BYTES, 3);
  await verifyModelBytes(checked, backing.subarray(3, 3 + BYTES.byteLength));
  assert.deepEqual(backing.subarray(3, 3 + BYTES.byteLength), BYTES, "the caller's bytes are untouched");
});
