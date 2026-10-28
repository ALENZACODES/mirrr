// #26 spot healing, #27 line softening and #28 under-eye brightening in the browser:
// Python -> TypeScript agreement on live vectors from api/tests/skin_touch_up_vectors.py (drawn
// faces with known blemishes, marks, lines and crescents; nothing written to disk) and the
// browser-side rules: alpha kept, zero strength is a no-op, coded refusals. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { healBlemishes, measure } from "../dist/js/engines/skin/blemish.js";
import { softenLines } from "../dist/js/engines/skin/wrinkles.js";
import { brightenUnderEyes } from "../dist/js/engines/skin/under-eye.js";
import { MESSAGES, meshRefusal } from "../dist/js/engines/skin/local-zones.js";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const V = JSON.parse(execFileSync(process.env.PYTHON || "python3", ["api/tests/skin_touch_up_vectors.py"], {
  cwd: repo, env: { ...process.env, PYTHONPATH: resolve(repo, "api") }, encoding: "utf8", maxBuffer: 64 << 20 }));
const bytes = (b64) => new Uint8Array(Buffer.from(b64, "base64"));
const photo = (c) => ({ width: c.width, height: c.height, channels: c.channels, data: bytes(c.image) });

function run(c, image = photo(c), points = c.points) {
  const p = c.params;
  if (c.kind === "heal") return healBlemishes(image, points, p);
  if (c.kind === "lines") return softenLines(image, points, p);
  return brightenUnderEyes(image, points, { strength: p.strength, includeBags: p.include_bags ?? true });
}

for (const c of V.cases) {
  test(`TypeScript matches Python: ${c.kind} ${JSON.stringify(c.params)}`, () => {
    const got = run(c), want = bytes(c.out), src = bytes(c.image);
    assert.equal(got.status, c.status);
    assert.equal(got.reasonCode, c.reason_code);
    assert.equal(got.message, MESSAGES[c.reason_code]);
    if (c.kind === "heal") {
      assert.deepEqual(got.report.spots.map((s) => [s.kind, s.action, s.area]), c.actions);
      assert.deepEqual(got.report.taps.map((t) => t.code), c.taps);
    }
    if (c.kind === "under_eye") {
      assert.deepEqual(Object.fromEntries(Object.entries(got.report.sides).map(([k, v]) => [k, v.action])), c.sides);
    }
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
  for (const c of [V.cases[0], V.cases[4], V.cases[6]]) {
    const r = run({ ...c, params: { ...c.params, strength: 0 } });
    assert.equal(r.status, "not_applicable");
    assert.equal(r.reasonCode, "zero_strength");
    assert.deepEqual(Array.from(r.image.data), Array.from(bytes(c.image)));
    assert.ok(r.alpha.every((v) => v === 0));
  }
});

test("a broken face mesh is refused with the core refusal codes", () => {
  const c = V.cases[0];
  const dup = c.points.map((p) => [...p]); dup[10] = [...dup[11]];
  assert.equal(healBlemishes(photo(c), dup).reasonCode, "duplicate_points");
  const off = c.points.map(([x, y]) => [x + 1000, y]);
  assert.equal(softenLines(photo(c), off).reasonCode, "outside_frame");
  assert.equal(brightenUnderEyes(photo(c), c.points.slice(0, 400)).reasonCode, "wrong_shape");
  assert.equal(meshRefusal(c.points, c.height, c.width), null);
  assert.throws(() => softenLines(photo(c), c.points, { zones: ["cheekbone"] }), /zones must be/);
  assert.throws(() => healBlemishes(photo(c), c.points, { strength: 101 }), /0\.\.100/);
});

test("natural marks are found as marks and only red spots are healed by default", () => {
  const c = V.cases[0], m = measure(photo(c), c.points);
  assert.equal(m.spots.filter((s) => s.kind === "blemish").length, 2);
  assert.ok(m.spots.filter((s) => s.kind === "mark").length >= 5);
  const r = healBlemishes(photo(c), c.points, { auto: false });
  assert.equal(r.reasonCode, "nothing_to_heal");
});
