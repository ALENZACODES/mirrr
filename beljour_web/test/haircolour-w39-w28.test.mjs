// W39 curl-respecting recolour and W28 balayage painter: Python -> TypeScript parity on
// parity/haircolour-w39-w28.json (api/scripts/make_parity_shade.py) and browser behaviour on drawn
// coils: geometry lock, outside pixels untouched, session-1 reality. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as R from "../dist/js/engines/haircolour/recolour.js";
import * as B from "../dist/js/engines/haircolour/balayage.js";

const P = JSON.parse(readFileSync(new URL("../../parity/haircolour-w39-w28.json", import.meta.url), "utf8"));
const bytes = (b64) => new Uint8Array(Buffer.from(b64, "base64"));
const img = (c) => ({ width: c.width, height: c.height, channels: 3, data: bytes(c.image) });
const maxGap = (a, b) => { let w = 0; for (let i = 0; i < a.length; i++) w = Math.max(w, Math.abs(a[i] - b[i])); return w; };

test("recolour bytes, gain and checks match Python", () => {
  for (const c of P.recolour) {
    const mask = Float64Array.from(bytes(c.mask));
    const r = R.recolourHair(img(c), mask, c.target);
    assert.ok(maxGap(r.image, bytes(c.out)) <= P.tolerance.byte, `period ${c.period}`);
    assert.ok(Math.abs(r.gain - c.gain) < P.tolerance.float);
    for (let k = 0; k < 3; k++) assert.ok(Math.abs(r.source_lab[k] - c.source_lab[k]) < 1e-6);
    assert.equal(r.checks.geometry_lock, c.checks.geometry_lock);
    assert.equal(r.checks.outside_unchanged, true);
    for (const key of ["structure_sign_agreement", "edge_map_iou", "structure_correlation"]) {
      assert.ok(Math.abs(r.checks[key] - c.checks[key]) <= P.tolerance.check, `${key}: ${r.checks[key]} vs ${c.checks[key]}`);
    }
    assert.equal(r.label, R.LABEL);
  }
});

test("balayage lift map, plan and bytes match Python", () => {
  for (const c of P.paint) {
    const mask = Float64Array.from(bytes(c.mask));
    const r = B.paint(img(c), mask, Float64Array.from(bytes(c.strokes)), {
      targetLevel: c.target_level, baseLevel: c.base_level, history: c.history, toner: c.toner,
      faceFrame: Float64Array.from(bytes(c.frame)), softness: 3 });
    assert.ok(maxGap(r.lift, c.lift.flat()) < 1e-9, "lift map");
    assert.deepEqual(r.plan, c.plan);
    for (let k = 0; k < 3; k++) assert.ok(Math.abs(r.colour_lab[k] - c.colour_lab[k]) < 1e-9);
    assert.ok(maxGap(r.image, bytes(c.out)) <= P.tolerance.byte);
    assert.equal(r.checks.geometry_lock, c.checks.geometry_lock);
    assert.equal(B.measureBaseLevel(img(c), mask), c.measured_level);
  }
});

test("session plans and level colours match Python", () => {
  for (const plan of P.plans) assert.deepEqual(B.sessionPlan(plan.base_level, plan.target_level, plan.history), plan);
  for (const [key, lab] of Object.entries(P.level_lab)) {
    const [level, toner] = key.split(":");
    const got = B.levelLab(Number(level), toner);
    for (let k = 0; k < 3; k++) assert.ok(Math.abs(got[k] - lab[k]) < 1e-9, key);
  }
});

test("a dark base never reaches the lightest blonde in one session", () => {
  const plan = B.sessionPlan(2, 10, "virgin");
  assert.equal(plan.session_1_level, 6);
  assert.equal(plan.reachable_in_one_session, false);
  assert.match(plan.note, /needs 2 sessions/);
  assert.throws(() => B.sessionPlan(7, 5), /lightens/);
});

test("pixels outside the hair are byte-identical and blurring is caught", () => {
  const c = P.recolour[1];
  const image = img(c), mask = Float64Array.from(bytes(c.mask));
  const r = R.recolourHair(image, mask, [50, 20, 25]);
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === 0) for (let k = 0; k < 3; k++) assert.equal(r.image[i * 3 + k], image.data[i * 3 + k]);
  }
  const blurred = Uint8ClampedArray.from(image.data);
  for (let ch = 0; ch < 3; ch++) {
    const plane = Float64Array.from({ length: mask.length }, (_, i) => image.data[i * 3 + ch]);
    const soft = R.boxBlur(plane, image.width, image.height, 3);
    for (let i = 0; i < mask.length; i++) if (mask[i] > 0) blurred[i * 3 + ch] = Math.round(soft[i]);
  }
  const checks = R.geometryChecks(image, { ...image, data: blurred }, mask);
  assert.equal(checks.geometry_lock, false, "straightening by blur must fail the lock");
  assert.throws(() => R.recolourHair(image, mask, [120, 0, 0]), /L\* in 0\.\.100/);
  assert.throws(() => R.recolourHair(image, new Float64Array(mask.length), [50, 0, 0]), /not enough hair/);
});
