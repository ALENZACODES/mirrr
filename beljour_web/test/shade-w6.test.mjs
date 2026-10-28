// W6 shade finder and W98 lighting simulator: Python -> TypeScript parity on parity/shade-w6.json
// (written by api/scripts/make_parity_shade.py), plus behaviour checks in the browser engine:
// never lighter than measured, refusal on weak readings, and a look that can fail.
// Synthetic data only. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as F from "../dist/js/engines/shade/finder.js";
import * as L from "../dist/js/engines/shade/lighting.js";
import * as CS from "../dist/js/engines/shade/colourspace.js";

const P = JSON.parse(readFileSync(new URL("../../parity/shade-w6.json", import.meta.url), "utf8"));
const TOL = P.tolerance;
const close = (a, b, tol, what) => {
  assert.equal(a.length, b.length, `${what}: length`);
  for (let i = 0; i < a.length; i++) assert.ok(Math.abs(a[i] - b[i]) <= tol, `${what}[${i}]: ${a[i]} vs ${b[i]}`);
};
const bytes = (b64) => new Uint8Array(Buffer.from(b64, "base64"));

test("sRGB to Lab and back match Python", () => {
  for (const c of P.rgb_to_lab) close(CS.srgbToLab(c.rgb), c.lab, TOL.lab, "rgb->lab");
  for (const c of P.lab_to_rgb) close(CS.labToSrgb(c.lab), c.rgb, 1e-6, "lab->rgb");
});

test("undertone, depth band and nearest shades match Python", () => {
  for (const c of P.classify) {
    const u = F.undertoneOf(c.lab);
    assert.equal(u.undertone, c.undertone.undertone);
    assert.ok(Math.abs(u.hue_angle - c.undertone.hue_angle) < 1e-6);
    assert.equal(u.low_chroma, c.undertone.low_chroma);
    assert.equal(F.depthBand(c.lab[0]), c.depth);
    const got = F.matchShades(c.lab).slice(0, 3);
    assert.deepEqual(got.map((m) => m.id), c.match.map((m) => m.id));
    close(got.map((m) => m.delta_e), c.match.map((m) => m.delta_e), TOL.delta_e, "match ΔE");
  }
});

test("white gains from neutral pixels match Python, including the clamp", () => {
  for (const c of P.white) {
    const w = F.whiteFromPixels(c.pixels, "neutral");
    assert.equal(w.mode, c.neutral.mode);
    assert.equal(w.clamped, c.neutral.clamped);
    close(w.gains, c.neutral.gains, 1e-6, "gains");
  }
  assert.ok(P.white.some((c) => c.neutral.clamped), "the fixture includes a clamped case");
});

test("zone measurement and match match Python", () => {
  for (const c of P.zones) {
    const r = F.findFromPixels(c.zones, c.white);
    assert.equal(r.refused, c.result.refused);
    assert.equal(r.reason, c.result.reason);
    if (c.result.measured_lab) close(r.measured_lab, c.result.measured_lab, 1e-4, "measured");
    assert.equal(r.best?.id ?? null, c.result.best?.id ?? null);
    assert.equal(r.alternative?.id ?? null, c.result.alternative?.id ?? null);
    assert.ok(Math.abs(r.confidence.overall - c.result.confidence.overall) < 1e-4);
    assert.equal(r.test_plan, c.result.test_plan);
  }
  assert.ok(P.zones.some((c) => c.result.refused) && P.zones.some((c) => !c.result.refused));
});

test("whole drawn faces: zones, lighting correction and shade match Python", () => {
  for (const face of P.faces) {
    const image = { width: face.width, height: face.height, channels: 3, data: bytes(face.image) };
    const r = F.findShade(image, face.points, { backgroundMask: bytes(face.background) });
    const want = face.result;
    assert.equal(r.refused, want.refused);
    assert.equal(r.white.mode, want.white.mode);
    close(r.white.gains, want.white.gains, 1e-5, "face gains");
    for (const z of F.ZONES) assert.ok(Math.abs(r.zones[z].pixels - want.zones[z].pixels) <= 2, `${z} pixel count`);
    close(r.measured_lab, want.measured_lab, TOL.face_lab, "face Lab");
    assert.equal(r.best.id, want.best.id);
    assert.equal(r.label, "Shade estimate from your photo. Not tested against real products.");
  }
});

test("never recommends a shade more than 1 L* lighter than measured", () => {
  for (const L0 of [80, 66.5, 51, 40.2, 29.7, 24.5]) {
    for (const m of F.matchShades([L0, 10, 15])) assert.ok(m.lab[0] - L0 <= 1 + 1e-12);
  }
  const r = F.findFromPixels({ cheek_right: Array(200).fill([18, 10, 8]), cheek_left: Array(200).fill([18, 10, 8]),
    forehead: Array(200).fill([18, 10, 8]) });
  assert.equal(r.refused, true, "deeper than every reference shade: refuse rather than suggest a lighter one");
  assert.match(r.reason, /deep enough/);
});

test("lighting chromaticities, matrices and relit colours match Python", () => {
  const LP = P.lighting;
  for (const c of LP.planckian) close(L.planckianXY(c.cct), c.xy, 1e-9, `planck ${c.cct}`);
  for (const c of LP.daylight) close(L.daylightXY(c.cct), c.xy, 1e-9, `daylight ${c.cct}`);
  for (const c of LP.duv) close(L.withDuv(c.cct, c.duv), c.xy, 1e-9, "duv");
  for (const [pid, m] of Object.entries(LP.matrices)) close(L.appearanceMatrix(L.preset(pid)).flat(), m.flat(), TOL.matrix, pid);
  for (const c of LP.relight) for (const [pid, lab] of Object.entries(c.by_preset)) close(L.relightLab(c.lab, pid), lab, TOL.lab, pid);
});

test("look report matches Python and can fail a look", () => {
  const LP = P.lighting;
  const items = { skin: [62, 14, 18], foundation: [62.5, 13.5, 18.5], "nude lip": [56, 22, 16], "red lip": [45, 55, 35] };
  const pairs = [{ a: "skin", b: "foundation", kind: "match" }, { a: "skin", b: "nude lip", kind: "contrast" },
    { a: "skin", b: "red lip", kind: "contrast" }];
  const all = L.simulateLook(items, pairs, L.presetIds());
  assert.deepEqual(all.failures, LP.look.failures);
  assert.equal(all.holds, LP.look.holds);
  assert.equal(all.holds, false, "a nude lip close to the skin must lose contrast in dim light");
  for (const [name, row] of Object.entries(LP.look.items)) {
    for (const [pid, v] of Object.entries(row.by_preset)) assert.ok(Math.abs(all.items[name].by_preset[pid].shift_delta_e - v.shift_delta_e) <= 1e-4);
  }
  const scene = L.estimateWhite(Array.from({ length: 1 }, () => [0, 0, 0]));
  assert.equal(scene, null, "too few pixels gives no white estimate");
  const withScene = L.simulateLook(items, pairs, undefined, LP.scene_white);
  assert.deepEqual(withScene.presets, ["daylight", "office", "evening"]);
  assert.deepEqual(withScene.failures, LP.look_scene.failures);
  assert.equal(all.caveat, L.CAVEAT);
  assert.ok(all.items.skin.by_preset.daylight.shift_delta_e < 1e-9, "daylight is the reference appearance");
});

test("relit image bytes match Python within one level and keep alpha", () => {
  const img = P.lighting.image;
  const rgb = { width: img.width, height: img.height, channels: 3, data: Uint8Array.from(img.rgb.flat(2)) };
  close(Array.from(L.relightImage(rgb, "evening")), img.evening.flat(2), TOL.byte, "evening bytes");
  close(Array.from(L.relightImage(rgb, "office", P.lighting.scene_white)), img.office_scene.flat(2), TOL.byte, "office bytes");
  const rgba = { width: 1, height: 1, channels: 4, data: Uint8Array.from([120, 90, 70, 77]) };
  assert.equal(L.relightImage(rgba, "evening")[3], 77);
  assert.throws(() => L.relightLab([50, 0, 0], "moonlight"), /unknown lighting preset/);
});
