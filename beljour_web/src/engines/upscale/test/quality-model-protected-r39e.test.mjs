/** Reviewed model admission from encrypted synthetic assets. Author: John Khan. */

import assert from "node:assert/strict";
import test from "node:test";

import { record } from "./quality-model-fixtures-r38e.mjs";
import { newSessionKey, sealProtectedArtifact } from
  "../../../../dist/js/engines/upscale/protected-artifact.js";
import { loadProtectedQualityModels } from
  "../../../../dist/js/engines/upscale/quality-model-protected.js";

const keyId = "OperatorKey98";

async function prepared(key) {
  const make = async role => {
    const bytes = Uint8Array.from([21, 37, 41, role.length]);
    const rights = record(role, bytes);
    const sealed = await sealProtectedArtifact(bytes, "weights", rights.weightsSha256, keyId, key);
    return { record: rights, sealed };
  };
  return {
    preclean: await make("swinir_preclean"),
    upscale: await make("realesrgan_upscale"),
  };
}

function factory(log) {
  return {
    loadSwinIR: async (_model, bytes) => {
      log.push(["preclean", bytes.slice()]);
      return {
        engine: async source => new Uint8ClampedArray(source.data),
        dispose: () => log.push(["close-preclean"]),
      };
    },
    loadRealESRGAN: async (_model, bytes) => {
      log.push(["upscale", bytes.slice()]);
      return {
        engine: async (_source, width, height) => {
          const output = new Uint8ClampedArray(width * height * 4);
          for (let i = 3; i < output.length; i += 4) output[i] = 255;
          return output;
        },
        dispose: () => log.push(["close-upscale"]),
      };
    },
  };
}

test("stages receive authenticated weight buffers, never ciphertext", async () => {
  const key = await newSessionKey();
  const bundle = await prepared(key);
  const events = [];
  const session = await loadProtectedQualityModels(bundle, key, factory(events));
  assert.deepEqual(events.map(row => row[0]), ["preclean", "upscale"]);
  assert.deepEqual(events[0][1], Uint8Array.from([21, 37, 41, "swinir_preclean".length]));
  assert.equal(session.verifiedModels.length, 2);
  await session.dispose();
  assert.deepEqual(events.slice(-2).map(row => row[0]), ["close-upscale", "close-preclean"]);
});

test("ciphertext tampering refuses before any runtime creation", async () => {
  const key = await newSessionKey();
  const bundle = await prepared(key);
  const modified = bundle.preclean.sealed.ciphertext.slice();
  modified[modified.length - 1] ^= 1;
  const events = [];
  await assert.rejects(loadProtectedQualityModels({
    ...bundle, preclean: { ...bundle.preclean, sealed: { ...bundle.preclean.sealed,
      ciphertext: modified } },
  }, key, factory(events)), /authentication/);
  assert.deepEqual(events, []);
});

test("rights changes fail after successful decryption", async () => {
  const key = await newSessionKey();
  const bundle = await prepared(key);
  const events = [];
  await assert.rejects(loadProtectedQualityModels({
    ...bundle, upscale: {
      ...bundle.upscale,
      record: { ...bundle.upscale.record, gateDecision: "pending" },
    },
  }, key, factory(events)), /review/);
  assert.deepEqual(events, []);
});

test("wrong session key refuses before any stage admission", async () => {
  const encryptedWith = await newSessionKey();
  const bundle = await prepared(encryptedWith);
  const events = [];
  await assert.rejects(loadProtectedQualityModels(bundle, await newSessionKey(),
    factory(events)), /authentication/);
  assert.deepEqual(events, []);
});
