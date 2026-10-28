// R5 E06 warp in TypeScript: fields, spline, MLS, Delaunay, piecewise affine, fold guard,
// falloff and the warp engine. Synthetic inputs only. Author: John Khan.
import assert from "node:assert/strict";
import { test } from "node:test";

import { byteImage, floatImage } from "../dist/js/engines/core/buffer.js";
import { runEngine } from "../dist/js/engines/core/engine.js";
import { bandFromPoints, bandWeights, CURVES, curve, radialWeights } from "../dist/js/engines/warp/falloff.js";
import * as F from "../dist/js/engines/warp/field.js";
import { foldReport, safeStrength, scaledBuilder, triangleFlips } from "../dist/js/engines/warp/fold.js";
import { deform, MODES, mlsField } from "../dist/js/engines/warp/mls.js";
import { affineBetween, coveredShare, piecewiseAffine, triangleAreas } from "../dist/js/engines/warp/piecewise.js";
import { borderPins, ThinPlateSpline, tpsField } from "../dist/js/engines/warp/tps.js";
import { barycentric, circumcircle, delaunay, hullEdges, ring, signedArea } from "../dist/js/engines/warp/triangulate.js";
import { WarpEngine } from "../dist/js/engines/warp/engine.js";
import { anchorRing, layout, meshWarp, RING_POINTS } from "../dist/js/engines/warp/mesh.js";
import { targets } from "../dist/js/engines/proportions/symmetry.js";
import { readFileSync } from "node:fs";
import * as J from "../dist/js/engines/core/jobs.js";
import { defaultRegistry } from "../dist/js/engines/core/worker.js";

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ""} ${a} vs ${b}`);

function checker(w, h, cell = 4) {
  const img = byteImage(w, h, 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const on = (Math.floor(x / cell) + Math.floor(y / cell)) % 2, p = (y * w + x) * 3;
    img.data[p] = 40 + 180 * on; img.data[p + 1] = 90 + 60 * on; img.data[p + 2] = 200 - 120 * on;
  }
  return img;
}

function similarity([x, y], angle, s, tx, ty) {
  const c = Math.cos(angle) * s, d = Math.sin(angle) * s;
  return [c * x - d * y + tx, d * x + c * y + ty];
}

test("grid nodes, exact affine fields and the identity", () => {
  assert.deepEqual(F.gridNodes(13, 10, 4), { xs: [0, 4, 8, 12, 16], ys: [0, 4, 8, 12] });
  assert.equal(F.gridNodes(5, 3, 1).xs.length, 5);
  assert.throws(() => F.gridNodes(4, 4, 0), RangeError);
  const fn = (x, y) => [0.9 * x + 0.1 * y + 2, -0.05 * x + 1.1 * y - 1];
  const coarse = F.fromFunction(23, 17, fn, 4), exact = F.fromFunction(23, 17, fn, 1);
  for (let i = 0; i < coarse.mapX.data.length; i++) {
    near(coarse.mapX.data[i], exact.mapX.data[i], 1e-9);
    near(coarse.mapY.data[i], exact.mapY.data[i], 1e-9);
  }
  const ident = F.identity(7, 6);
  assert.equal(F.moveStats(ident).maxMove, 0);
  assert.ok(F.jacobian(ident).data.every((v) => Math.abs(v - 1) < 1e-12));
  const img = checker(10, 12);
  assert.deepEqual(F.apply(img, F.identity(10, 12)).data, img.data);
});

test("scale, weights and composition", () => {
  const ident = F.identity(9, 9);
  const shift = F.makeField(Float64ArrayImage(ident.mapX, 1.25), ident.mapY);
  const half = F.scale(shift, 0.5);
  near(half.mapX.data[10] - ident.mapX.data[10], 0.625, 1e-12);
  const w = floatImage(9, 9, 1, true);
  w.data[40] = 1;
  const only = F.weighted(shift, w);
  assert.equal(only.mapX.data[0], 0);
  near(only.mapX.data[40], 4 + 1.25, 1e-12);
  w.data[1] = 2;
  assert.throws(() => F.weighted(shift, w), RangeError);
  const down = F.makeField(ident.mapX, Float64ArrayImage(ident.mapY, 0.5));
  const both = F.compose(shift, down);
  near(both.mapX.data[40] - 4, 1.25, 1e-12);
  near(both.mapY.data[40] - 4, 0.5, 1e-12);
  assert.throws(() => F.makeField(floatImage(2, 2, 1), floatImage(3, 2, 1)), RangeError);
});

function Float64ArrayImage(plane, add) {
  const out = floatImage(plane.width, plane.height, 1, true);
  for (let i = 0; i < out.data.length; i++) out.data[i] = plane.data[i] + add;
  return out;
}

test("thin plate spline interpolates, reproduces affine maps and has the right Jacobian", () => {
  const r = rng(5);
  const src = Array.from({ length: 9 }, () => [r() * 60, r() * 60]);
  const dst = src.map(([x, y]) => [x + (r() - 0.5) * 8, y + (r() - 0.5) * 8]);
  const spline = ThinPlateSpline.fit(src, dst);
  src.forEach(([x, y], i) => { const [fx, fy] = spline.map(x, y); near(fx, dst[i][0], 1e-8); near(fy, dst[i][1], 1e-8); });
  const h = 1e-5;
  for (const [x, y] of [[12.3, 20.7], [33.1, 5.5]]) {
    const j = spline.jacobian(x, y);
    const [ax, ay] = spline.map(x + h, y), [bx, by] = spline.map(x - h, y);
    near(j[0][0], (ax - bx) / (2 * h), 1e-6); near(j[1][0], (ay - by) / (2 * h), 1e-6);
    const [cx, cy] = spline.map(x, y + h), [dx, dy] = spline.map(x, y - h);
    near(j[0][1], (cx - dx) / (2 * h), 1e-6); near(j[1][1], (cy - dy) / (2 * h), 1e-6);
    near(spline.determinant(x, y), j[0][0] * j[1][1] - j[0][1] * j[1][0], 1e-12);
  }
  const affine = ThinPlateSpline.fit(src, src.map(([x, y]) => [1.1 * x + 0.2 * y + 3, -0.15 * x + 0.95 * y - 2]));
  near(affine.bendingEnergy(), 0, 1e-8);
  const [px, py] = affine.map(55, 40);
  near(px, 1.1 * 55 + 0.2 * 40 + 3, 1e-8); near(py, -0.15 * 55 + 0.95 * 40 - 2, 1e-8);
  const smooth = ThinPlateSpline.fit(src, dst, 50);
  assert.ok(smooth.bendingEnergy() < spline.bendingEnergy());
  assert.throws(() => ThinPlateSpline.fit([[0, 0], [1, 1], [2, 2], [3, 3]], [[0, 0], [1, 1], [2, 2], [3, 3]]), /degenerate/);
  assert.throws(() => ThinPlateSpline.fit(src.slice(0, 2), dst.slice(0, 2)), RangeError);
  assert.throws(() => ThinPlateSpline.fit(src, dst.slice(1)), RangeError);
});

test("spline field moves the handle and pins the corners", () => {
  const f = tpsField(50, 40, [[25, 20]], [[29, 18]], { step: 1 });
  near(f.mapX.data[18 * 50 + 29], 25, 1e-6);
  near(f.mapY.data[18 * 50 + 29], 20, 1e-6);
  for (const [x, y] of [[0, 0], [49, 0], [0, 39], [49, 39]]) {
    near(f.mapX.data[y * 50 + x], x, 1e-6); near(f.mapY.data[y * 50 + x], y, 1e-6);
  }
  assert.equal(borderPins(50, 40).length, 16);
});

test("moving least squares: every mode reproduces its own transform", () => {
  const r = rng(11);
  const p = Array.from({ length: 7 }, () => [r() * 100, r() * 100]);
  const v = Array.from({ length: 30 }, () => [r() * 100, r() * 100]);
  const aff = ([x, y]) => [1.2 * x + 0.3 * y + 5, -0.1 * x + 0.8 * y + 7];
  deform(v, p, p.map(aff), "affine").forEach((out, i) => { const e = aff(v[i]); near(out[0], e[0], 1e-8); near(out[1], e[1], 1e-8); });
  deform(v, p, p.map((q) => similarity(q, 0.4, 1.3, -6, 2)), "similarity").forEach((out, i) => {
    const e = similarity(v[i], 0.4, 1.3, -6, 2); near(out[0], e[0], 1e-8); near(out[1], e[1], 1e-8);
  });
  deform(v, p, p.map((q) => similarity(q, -0.7, 1, 3, 9)), "rigid").forEach((out, i) => {
    const e = similarity(v[i], -0.7, 1, 3, 9); near(out[0], e[0], 1e-8); near(out[1], e[1], 1e-8);
  });
  const q = p.map(([x, y]) => [x + r() * 4, y - r() * 4]);
  for (const mode of MODES) deform(p, p, q, mode).forEach((out, i) => { near(out[0], q[i][0], 1e-9); near(out[1], q[i][1], 1e-9); });
  const moved = deform([[3, 4]], [[10, 10]], [[13, 6]], "rigid")[0];
  assert.deepEqual(moved, [6, 0]);
  assert.throws(() => deform(v, [[0, 0], [1, 1], [2, 2]], [[0, 0], [1, 1], [2, 2]], "affine"), /three handles/);
  assert.throws(() => deform(v, [[1, 1], [1, 1]], [[0, 0], [2, 2]]), /distinct/);
  assert.throws(() => deform(v, p, p, "rigid", 0), /alpha/);
  const f = mlsField(48, 48, [[24, 24]], [[27, 24]], { mode: "rigid", pins: [[4, 4], [44, 4], [4, 44], [44, 44]] });
  assert.ok(foldReport(f).passed);
});

test("Delaunay: empty circumcircles, Euler count and a full grid", () => {
  const r = rng(4);
  const pts = Array.from({ length: 40 }, () => [r() * 50, r() * 50]);
  const tris = delaunay(pts);
  for (const [a, b, c] of tris) {
    assert.ok(signedArea(pts[a], pts[b], pts[c]) > 0);
    const [cx, cy, r2] = circumcircle(pts[a], pts[b], pts[c]);
    pts.forEach(([x, y], k) => { if (k !== a && k !== b && k !== c) assert.ok((x - cx) ** 2 + (y - cy) ** 2 >= r2 * (1 - 1e-9)); });
  }
  assert.equal(tris.length, 2 * pts.length - 2 - hullEdges(tris).length);
  const grid = [];
  for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++) grid.push([x * 10, y * 10]);
  const gt = delaunay(grid);
  assert.equal(gt.length, 40);
  near(gt.reduce((s, [a, b, c]) => s + signedArea(grid[a], grid[b], grid[c]) / 2, 0), 2000, 1e-9);
  assert.throws(() => delaunay([[0, 0], [1, 1], [2, 2], [3, 3]]), /one line/);
  assert.throws(() => delaunay([[0, 0], [5, 0], [0, 5], [5, 0]]), /distinct/);
  const [, l2] = barycentric(1, 1, [0, 0], [4, 0], [0, 4]);
  near(l2, 0.25, 1e-12);
  assert.equal(barycentric(0, 0, [0, 0], [1, 1], [2, 2]), null);
  assert.equal(ring(10, 10, 5, 3, 8).length, 8);
});

test("piecewise affine: identity, global affine, locality and helpers", () => {
  const w = 44, h = 36;
  const src = [...borderPins(w, h), [20, 15], [25, 22], [12, 24]];
  const tris = delaunay(src);
  const same = piecewiseAffine(w, h, src, src, tris);
  assert.equal(coveredShare(same), 1);
  for (let i = 0; i < same.field.mapX.data.length; i++) near(same.field.mapX.data[i], i % w, 1e-9);
  const dst = src.map((p) => [p[0], p[1]]);
  dst[src.length - 3] = [22, 16];
  const res = piecewiseAffine(w, h, src, dst, tris);
  const touching = new Set(tris.map((t, i) => (t.includes(src.length - 3) ? i : -1)).filter((i) => i >= 0));
  const move = F.moveMagnitude(res.field).data;
  let moved = 0;
  for (let i = 0; i < move.length; i++) if (move[i] > 1e-9) { moved++; assert.ok(touching.has(res.owner[i])); }
  assert.ok(moved > 0);
  const m = affineBetween([[0, 0], [2, 0], [0, 2]], [[1, 1], [3, 1], [1, 3]]);
  m.flat().forEach((v, i) => near(v, [1, 0, -1, 0, 1, -1][i], 1e-12));
  near(triangleAreas(src, tris).reduce((a, b) => a + b, 0), (w - 1) * (h - 1), 1e-9);
  assert.throws(() => piecewiseAffine(4, 4, src, src, [[0, 0, 1]]), RangeError);
});

test("fold report, triangle flips and the strength guard", () => {
  const ident = F.identity(10, 10);
  assert.ok(foldReport(ident).passed);
  const flipped = F.makeField(floatImage(10, 10, 1, true), ident.mapY);
  for (let i = 0; i < 100; i++) flipped.mapX.data[i] = 9 - (i % 10);
  const rep = foldReport(flipped);
  assert.equal(rep.passed, false); assert.equal(rep.foldedShare, 1);
  const sq = [[0, 0], [10, 0], [0, 10], [10, 10]], st = delaunay(sq);
  assert.equal(triangleFlips(sq, [[0, 0], [10, 0], [0, 10], [-4, -4]], st).passed, false);
  assert.ok(triangleFlips(sq, sq, st).passed);
  const big = tpsField(48, 48, [[20, 24], [28, 24]], [[34, 24], [14, 24]], { step: 2 });
  assert.equal(foldReport(big).passed, false);
  const safe = safeStrength(scaledBuilder(big));
  assert.ok(safe.reduced && safe.report.passed && safe.strength > 0 && safe.strength < 1);
  assert.equal(safeStrength(scaledBuilder(ident)).strength, 1);
  assert.throws(() => safeStrength(scaledBuilder(big), { requested: 2 }), RangeError);
});

test("falloff curves and band weights", () => {
  for (const kind of CURVES) {
    near(curve(0, kind), 0, 1e-15); near(curve(1, kind), 1, 1e-15);
    let prev = -1;
    for (let t = 0; t <= 1; t += 0.1) { const v = curve(t, kind); assert.ok(v >= prev); prev = v; }
  }
  near(curve(0.5, "smootherstep"), 0.5, 1e-15);
  assert.throws(() => curve(0.5, "step"), RangeError);
  const band = floatImage(30, 30, 1);
  for (let y = 5; y < 25; y++) for (let x = 5; x < 25; x++) band.data[y * 30 + x] = 1;
  const w = bandWeights(band, 6);
  for (let i = 0; i < band.data.length; i++) if (band.data[i] === 0) assert.equal(w.data[i], 0);
  assert.equal(w.data[15 * 30 + 15], 1);
  assert.ok(w.data[5 * 30 + 15] > 0 && w.data[5 * 30 + 15] < 0.1);
  const radial = radialWeights(21, 21, 10, 10, 8);
  assert.equal(radial.data[10 * 21 + 10], 1); assert.equal(radial.data[10 * 21 + 18], 0);
  const pb = bandFromPoints(20, 20, [[5, 5], [15, 15]], 3);
  assert.equal(pb.data[5 * 20 + 5], 1); assert.equal(pb.data[10 * 20 + 10], 0);
});

test("warp engine: every method, band protection and the guard", () => {
  const w = 48, h = 40, img = checker(w, h);
  const band = bandFromPoints(w, h, [[24, 20]], 12);
  for (const method of ["tps", "mls-affine", "mls-similarity", "mls-rigid", "piecewise"]) {
    const res = runEngine(new WarpEngine(), img, null, { band },
      { method, from: [24, 20, 16, 14, 31, 27], to: [26, 21, 16, 14, 31, 27], band: "band", ramp: 5 });
    assert.ok(res.metrics.min_det > 0.2, method);
    for (let i = 0; i < w * h; i++) {
      if (band.data[i] === 0) for (let c = 0; c < 3; c++) assert.equal(res.image.data[i * 3 + c], img.data[i * 3 + c]);
    }
  }
  const sq = checker(40, 40);
  const guarded = runEngine(new WarpEngine(), sq, null, {}, { method: "tps", from: [16, 20, 24, 20], to: [30, 20, 10, 20] });
  assert.ok(guarded.metrics.strength_used < 1 && guarded.metrics.min_det > 0.2);
  const raw = runEngine(new WarpEngine(), sq, null, {}, { method: "tps", from: [16, 20, 24, 20], to: [30, 20, 10, 20], guard: false });
  assert.ok(raw.metrics.min_det <= 0.2);
  for (const params of [{ method: "x", from: [1, 1], to: [2, 2] }, { from: [1, 1, 2], to: [1, 1, 2] },
    { from: [1, 1], to: [2, 2, 3, 3] }, { from: [1, 1], to: [2, 2], band: "missing" }, { from: [1, 1], to: [2, 2], strength: 2 }]) {
    assert.throws(() => runEngine(new WarpEngine(), checker(20, 20), null, {}, params), RangeError);
  }
});

test("face-mesh warp: layout, identity, symmetry targets, ring hold and the flip guard", () => {
  const doc = JSON.parse(readFileSync(new URL("../../parity/warp-fill-r5.json", import.meta.url), "utf8"));
  const face = doc.vectors.find((v) => v.kernel === "proportions.symmetry" && v.args.regions).args.points;
  const lay = layout(face, 400, 500);
  assert.equal(lay.meshCount, 478);
  assert.equal(lay.points.length, 478 + RING_POINTS + 16);
  const same = meshWarp(400, 500, face, face, { lay });
  assert.equal(same.strengthUsed, 1);
  assert.ok(F.moveStats(same.result.field).maxMove < 1e-9);
  const moved = meshWarp(400, 500, face, targets(face, 0.8), { lay });
  assert.ok(moved.flips.passed && moved.strengthUsed > 0.5);
  assert.ok(foldReport(moved.result.field).passed);
  const ring = anchorRing(face);
  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cy = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const reach = Math.max(...ring.map(([x, y]) => Math.hypot(x - cx, y - cy))) + 2;
  const move = F.moveMagnitude(moved.result.field).data;
  let far = 0;
  for (let y = 0; y < 500; y++) for (let x = 0; x < 400; x++) {
    if (Math.hypot(x - cx, y - cy) > reach) { far++; assert.ok(move[y * 400 + x] < 1e-9); }
  }
  assert.ok(far > 0);
  const crushed = face.map((p, i) => (i % 2 === 0 && i + 1 < face.length ? face[i + 1] : p));
  const guarded = meshWarp(400, 500, face, crushed, { lay });
  assert.ok(guarded.reduced && guarded.flips.passed && guarded.strengthUsed < 1);
  assert.throws(() => meshWarp(400, 500, face, face.slice(0, 400), { lay }), RangeError);
  assert.throws(() => anchorRing(face, 1), RangeError);
});

test("warp and fill engines run through the worker job protocol", () => {
  const img = checker(24, 20);
  const band = bandFromPoints(24, 20, [[12, 10]], 7);
  const warp = J.runJob(defaultRegistry(), { kind: "run", id: 7, engine: "warp", image: J.packBytes(img), masks: { band: J.packMask(band) },
    params: { method: "mls-rigid", from: [12, 10, 6, 6], to: [13, 10, 6, 6], band: "band", ramp: 3 }, seed: "0" });
  assert.equal(warp.result.ok, true, warp.result.error);
  assert.equal(warp.result.pipelineVersion, "warp-1.0.0");
  const hole = bandFromPoints(24, 20, [[12, 10]], 3);
  const fill = J.runJob(defaultRegistry(), { kind: "run", id: 8, engine: "fill", image: J.packBytes(img), masks: { hole: J.packMask(hole) },
    params: { method: "fast-marching" }, seed: "3" });
  assert.equal(fill.result.ok, true, fill.result.error);
  assert.ok(fill.result.metrics.hole_pixels > 0);
});

test("face-mesh warp: a frame-filling face gets the same duplicate-free layout as Python", async () => {
  const { execFileSync } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  const root = fileURLToPath(new URL("../..", import.meta.url));
  const script = [
    "import json", "from plumb_api.engines.proportions.synthetic import symmetric_face",
    "from plumb_api.engines.warp import mesh", "out = []",
    "for w, h in ((400, 500), (225, 305), (222, 303), (221, 302)):",
    "    pts = symmetric_face(w, h, face_width=220, face_length=300)",
    "    lay = mesh.layout(pts, w, h)",
    "    out.append({'w': w, 'h': h, 'mesh': pts.tolist(), 'points': lay.points.tolist(), 'triangles': len(lay.triangles)})",
    "print(json.dumps(out))"].join("\n");
  const cases = JSON.parse(execFileSync(process.env.PYTHON || "python3", ["-c", script],
    { cwd: root, env: { ...process.env, PYTHONPATH: `${root}/api` }, encoding: "utf8", maxBuffer: 64 << 20 }));
  for (const c of cases) {
    const lay = layout(c.mesh, c.w, c.h);
    assert.equal(lay.points.length, c.points.length, `${c.w}x${c.h}`);
    lay.points.forEach((p, i) => { assert.ok(Math.abs(p[0] - c.points[i][0]) < 1e-9 && Math.abs(p[1] - c.points[i][1]) < 1e-9); });
    assert.equal(lay.triangles.length, c.triangles);
    const keys = new Set(lay.points.map((p) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`));
    assert.equal(keys.size, lay.points.length, `duplicate layout points at ${c.w}x${c.h}`);
  }
  assert.equal(cases[0].points.length, cases[0].mesh.length + RING_POINTS + 16, "a ring inside the photo keeps all its points");
});
