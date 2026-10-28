// Local photo fixes in the browser: Python -> TypeScript agreement on live vectors from
// api/tests/photo_fix_vectors.py (drawn faces with known irises, glow, glare, scratches and
// marked objects; nothing written to disk) and the browser-side rules: alpha kept, pixels
// outside the edit alpha unchanged, zero strength is a no-op, coded refusals. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fixRedEye } from "../dist/js/engines/local/red-eye.js";
import { MESSAGES } from "../dist/js/engines/local/photo-fix.js";
import { eyeColour } from "../dist/js/engines/local/eye-colour.js";
import { removeGlare } from "../dist/js/engines/local/glare.js";
import { restoreOldPhoto } from "../dist/js/engines/local/old-photo.js";
import { brushMask, removeObject } from "../dist/js/engines/local/object-removal.js";
import { guideOverlay, idCrop } from "../dist/js/engines/local/id-crop.js";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const V = JSON.parse(execFileSync(process.env.PYTHON || "python3", ["api/tests/photo_fix_vectors.py"], {
  cwd: repo, env: { ...process.env, PYTHONPATH: resolve(repo, "api") }, encoding: "utf8", maxBuffer: 256 << 20 }));
const bytes = (b64) => new Uint8Array(Buffer.from(b64, "base64"));
const photo = (c) => ({ width: c.width, height: c.height, channels: c.channels, data: bytes(c.image) });

export const RUNNERS = {
  red_eye: (c, image = photo(c), params = c.params) => fixRedEye(image, c.points, params),
  eye_colour: (c, image = photo(c), params = c.params) => eyeColour(image, c.points, params),
  glare: (c, image = photo(c), params = c.params) => removeGlare(image, c.points, params),
  object: (c, image = photo(c), params = c.params) => removeObject(image, brushMask(c.height, c.width, c.taps, c.radius), { ...params, landmarks: c.points }),
  old_photo: (c, image = photo(c), params = c.params) => restoreOldPhoto(image, params.mesh === false ? null : c.points, params),
};

for (const c of V.cases.filter((x) => x.kind !== "id_crop")) {
  test(`TypeScript matches Python: ${c.kind} ${JSON.stringify(c.params)}`, () => {
    const got = RUNNERS[c.kind](c), want = bytes(c.out), src = bytes(c.image);
    assert.equal(got.status, c.status);
    assert.equal(got.reasonCode, c.reason_code);
    assert.equal(got.message, MESSAGES[c.reason_code]);
    let max = 0;
    for (let i = 0; i < want.length; i++) max = Math.max(max, Math.abs(got.image.data[i] - want[i]));
    assert.ok(max <= V.byte_tolerance, `largest byte gap ${max}`);
    if (c.channels === 4) for (let i = 3; i < src.length; i += 4) assert.equal(got.image.data[i], src[i], "alpha kept");
    for (let i = 0; i < got.alpha.length; i++) {
      if (got.alpha[i] === 0) for (let k = 0; k < 3; k++) assert.equal(got.image.data[i * c.channels + k], src[i * c.channels + k]);
    }
  });
}

test("zero strength returns the photo unchanged with a coded reason", () => {
  for (const kind of Object.keys(RUNNERS)) {
    const c = V.cases.find((x) => x.kind === kind && x.status === "edited");
    const r = RUNNERS[kind](c, photo(c), { ...c.params, strength: 0 });
    assert.equal(r.status, "not_applicable");
    assert.equal(r.reasonCode, "zero_strength");
    assert.deepEqual(Array.from(r.image.data), Array.from(bytes(c.image)));
    assert.ok(r.alpha.every((v) => v === 0));
  }
});

test("a broken mesh is a coded refusal, never an edit", () => {
  const c = V.cases.find((x) => x.kind === "red_eye");
  const r = fixRedEye(photo(c), c.points.slice(0, 100));
  assert.equal(r.status, "refused");
  assert.equal(r.reasonCode, "wrong_shape");
});

for (const c of V.cases.filter((x) => x.kind === "id_crop")) {
  test(`TypeScript matches Python: id crop ${c.params.preset} ${c.reason_code}`, () => {
    const got = idCrop(photo(c), c.points, c.params);
    assert.equal(got.status, c.status);
    assert.equal(got.reasonCode, c.reason_code);
    assert.equal(got.message, MESSAGES[c.reason_code]);
    assert.deepEqual(got.box, c.box);
    assert.deepEqual(got.checks, c.checks);
    for (const [key, value] of Object.entries(c.guides)) assert.ok(Math.abs(got.guides[key] - value) < 1e-9, key);
    assert.deepEqual(Array.from(guideOverlay(got).data), Array.from(bytes(c.out)));
  });
}
