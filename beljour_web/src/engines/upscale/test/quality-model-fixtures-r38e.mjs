/** Synthetic rights records for model-admission tests. The bytes are short made-up
 * arrays, never real weights; digests are computed from them, not copied.
 * Author: John Khan.
 */
import { createHash } from "node:crypto";

import { MODEL_RIGHTS_FORMAT, QUALITY_MODEL_ROLES } from
  "../../../../dist/js/engines/upscale/quality-model-rights.js";

const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");

/** An `allowed` record for `role` that matches `bytes` exactly. */
export function record(role, bytes) {
  const spec = QUALITY_MODEL_ROLES[role];
  return {
    format: MODEL_RIGHTS_FORMAT,
    role,
    modelId: `synthetic-${role.replaceAll("_", "-")}`,
    upstreamCommit: sha256(`synthetic upstream ${role}`).slice(0, 40),
    licence: spec.licence,
    weightsSha256: sha256(bytes),
    weightsBytes: bytes.byteLength,
    reviewSha256: sha256(`synthetic rights review ${role}`),
    gateDecision: "allowed",
  };
}

/** Reviewed candidates for the chain roles, each backed by its own short made-up bytes. */
export function candidates({ matte = false } = {}) {
  const make = (role, seed) => {
    const bytes = Uint8Array.from([seed, seed + 1, seed + 2, seed + 3, role.length]);
    return { record: record(role, bytes), bytes };
  };
  return {
    preclean: make("swinir_preclean", 11),
    upscale: make("realesrgan_upscale", 23),
    ...(matte ? { matte: make("modnet_matte", 37) } : {}),
  };
}

/** Pull every colour value a quarter of the way toward mid-grey; alpha unchanged. */
export function greyPull(source) {
  return source.data.map((value, i) => (i % 4 === 3 ? value : value + Math.round((128 - value) / 4)));
}

/** Nearest-neighbour enlargement, pixel-centre aligned. */
export function nearest(source, width, height) {
  const output = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const sy = Math.min(source.height - 1, Math.floor((y + 0.5) * source.height / height));
    for (let x = 0; x < width; x++) {
      const sx = Math.min(source.width - 1, Math.floor((x + 0.5) * source.width / width));
      output.set(source.data.subarray((sy * source.width + sx) * 4, (sy * source.width + sx) * 4 + 4),
        (y * width + x) * 4);
    }
  }
  return output;
}

/** Tiny synthetic stand-ins for a local runtime: no model, no weights, no network.
 * `log` records loads (with a copy of the staged bytes and the staged buffer
 * itself), runs and disposals. `fail` names a load or run to throw from, and
 * the matte stand-in returns a fresh copy of `alpha` (the caller wipes it). */
export function syntheticFactory(log = [], { fail = null, alpha = null, upscale = nearest } = {}) {
  const loader = (name, engine) => async (model, bytes) => {
    log.push({ load: name, role: model.role, copy: bytes.slice(), staged: bytes });
    if (fail === `load-${name}`) throw new Error(`synthetic ${name} load failure`);
    return { engine, dispose: () => { log.push({ dispose: name }); } };
  };
  const run = (name, work) => async (...args) => {
    log.push({ run: name });
    if (fail === name) throw new Error(`synthetic ${name} failure`);
    return work(...args);
  };
  return {
    loadSwinIR: loader("preclean", run("preclean", greyPull)),
    loadRealESRGAN: loader("upscale", run("upscale", upscale)),
    loadMODNet: loader("matte", run("matte", source => alpha?.slice() ?? new Float32Array(source.width * source.height))),
  };
}
