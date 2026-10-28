// R7 LS4-LS8 unit tests on drawn inputs: posture, hair fibre, enhance, beard and budget.
// No photos, no model weights, no network. Author: John Khan.
import assert from "node:assert/strict";
import { test } from "node:test";

import { byteImage, floatImage } from "../dist/js/engines/core/buffer.js";
import { ellipse } from "../dist/js/engines/core/mask.js";
import { foldReport } from "../dist/js/engines/warp/fold.js";
import { q1OutsideMask, q12StraightLines, digest, q9Monotonic } from "../dist/js/quality/metrics.js";
import { BrowserModelRegistry } from "../dist/js/vision/model-registry.js";
import * as Po from "../dist/js/engines/local/posture.js";
import { figureCases, frontFigure, sideFigure, approximatePerson, capsule } from "../dist/js/engines/local/figures.js";
import * as Fi from "../dist/js/engines/local/fibre.js";
import * as St from "../dist/js/engines/local/strands.js";
import * as E from "../dist/js/engines/local/enhance.js";
import * as B from "../dist/js/engines/local/beard.js";
import * as Bu from "../../lab/dist/lab/web/budget.js";
import { beardFacePoints, rolledFace, symmetricFace } from "../dist/js/engines/local/face-synthetic.js";

const pose = (overrides = {}) => Array.from({ length: 33 }, (_, i) => ({ x: 0.5, y: 0.1 + i * 0.02, visibility: 0.9, ...(overrides[i] ?? {}) }));

// LS4 --------------------------------------------------------------------------------------
test("LS4 control points validate views, order, sizes and facing", () => {
  const fig = frontFigure();
  assert.throws(() => Po.makeControls("front", { ...fig.controls.points, navel: [NaN, 1] }, 160, 200), /two finite/);
  const { navel, ...missing } = fig.controls.points;
  assert.throws(() => Po.makeControls("front", missing, 160, 200), /missing/);
  assert.throws(() => Po.makeControls("front", { ...fig.controls.points, ear: [1, 1] }, 160, 200), /unknown/);
  assert.throws(() => Po.makeControls("front", fig.controls.points, 160, 200, 1), /no facing/);
  assert.throws(() => Po.makeControls("front", { ...fig.controls.points, right_shoulder: [40, 150] }, 160, 200), /above both hips/);
  assert.throws(() => Po.makeControls("front", { ...fig.controls.points, left_hip: [400, 100] }, 160, 200), /outside the photo/);
  assert.throws(() => Po.makeControls("diagonal", fig.controls.points, 160, 200), /front or side/);
  const side = sideFigure();
  assert.throws(() => Po.makeControls("side", side.controls.points, 160, 200, 0), /facing/);
  assert.throws(() => Po.makeControls("side", { ...side.controls.points, ankle: [80, 100] }, 160, 200, 1), /below the knee/);
  assert.throws(() => Po.makeControls("side", { ...side.controls.points, ear: [80, 190] }, 160, 200, 1), /top to bottom/);
  assert.equal(navel.length, 2);
});

test("LS4 fromPose prefills front and side points and flags estimated and manual ones", () => {
  const front = Po.fromPose(pose({ 11: { x: 0.6, y: 0.3 }, 12: { x: 0.4, y: 0.3 }, 23: { x: 0.56, y: 0.6, visibility: 0.2 }, 24: { x: 0.44, y: 0.6 } }), 200, 300, "front");
  assert.deepEqual(front.estimated, ["mid_chest", "navel"]);
  assert.deepEqual(front.manual, ["left_hip"]);
  assert.ok(front.points.navel[1] > front.points.mid_chest[1]);
  const marks = pose({ 0: { x: 0.62, y: 0.15 }, 7: { x: 0.5, y: 0.16 }, 11: { x: 0.5, y: 0.3 }, 23: { x: 0.5, y: 0.6 }, 25: { x: 0.52, y: 0.8 },
    27: { x: 0.5, y: 0.95 }, 8: { visibility: 0.1 }, 12: { visibility: 0.1 }, 24: { visibility: 0.1 }, 26: { visibility: 0.1 } });
  const side = Po.fromPose(marks, 200, 300, "side");
  assert.equal(side.facing, 1);
  assert.ok("ankle" in side.points);
  assert.ok(side.points.mid_back[0] < side.points.shoulder[0], "mid-back sits behind the shoulder");
  assert.deepEqual(side.manual, ["ear", "shoulder", "hip", "knee"]);
  assert.throws(() => Po.fromPose(pose().slice(1), 200, 300, "front"), /33/);
});

test("LS4 plans: each fix moves only its points, reduces its measure and respects the cap", () => {
  for (const fig of figureCases()) {
    for (const fix of Po.fixesFor(fig.controls.view)) {
      let previous = -1;
      for (const stop of ["subtle", "normal", "full"]) {
        const p = Po.plan(fig.controls, fix, stop);
        for (const n of p.pins) assert.deepEqual(p.after.points[n], fig.controls.points[n], `${fix} pin ${n}`);
        const largest = Math.max(...p.moves.map((n) => Math.hypot(p.after.points[n][0] - p.before.points[n][0], p.after.points[n][1] - p.before.points[n][1])));
        assert.ok(largest <= p.capPx + 1e-9, `${fix} cap`);
        if (Math.abs(p.measureBefore) > 0 && largest > 0) assert.ok(Math.abs(p.measureAfter) < Math.abs(p.measureBefore), `${fix} reduces`);
        assert.ok(largest >= previous - 1e-9, `${fix} grows with strength`);
        previous = largest;
        assert.match(p.label, /not medical advice/);
      }
    }
  }
  assert.throws(() => Po.plan(frontFigure().controls, "slouch"), /side view/);
  assert.throws(() => Po.plan(frontFigure().controls, "lean", 1.5), /0\.\.1/);
  assert.throws(() => Po.plan(frontFigure().controls, "twist"), /unknown fix/);
});

test("LS4 lean turns the torso toward vertical and uneven shoulders honours the shoulder choice", () => {
  const fig = frontFigure({ lean: 2, shoulderDrop: 2 });
  const p = Po.plan(fig.controls, "lean", "full");
  assert.ok(Math.abs(Po.torsoTilt(p.after)) < Math.abs(Po.torsoTilt(fig.controls)));
  const higher = Po.plan(fig.controls, "uneven_shoulders", "full", { shoulder: "higher" });
  assert.deepEqual(higher.after.points.left_shoulder, fig.controls.points.left_shoulder);
  const lower = Po.plan(fig.controls, "uneven_shoulders", "full", { shoulder: "lower" });
  assert.deepEqual(lower.after.points.right_shoulder, fig.controls.points.right_shoulder);
  const both = Po.plan(fig.controls, "uneven_shoulders", "normal", { shoulder: "both" });
  assert.equal(Po.j11Check(both).passed, true);
  assert.throws(() => Po.j11Check(p), /uneven_shoulders/);
});

test("LS4 render keeps everything outside the band, stays fold-free and keeps grid lines straight", () => {
  const fig = frontFigure({ lean: 4, shoulderDrop: 4 });
  const p = Po.plan(fig.controls, "lean", "normal");
  const out = Po.renderPosture(fig.image, fig.person, p);
  assert.ok(q1OutsideMask(fig.image, out.image, out.band).passed);
  assert.ok(foldReport(out.field).passed);
  assert.ok(q12StraightLines(out.image, out.band, fig.grid).passed);
  assert.ok(out.strengthUsed > 0 && out.strengthUsed <= 1);
  const wide = Po.renderPosture(fig.image, fig.person, p, { bandShare: 0.05, fillMethod: "none" });
  assert.ok(wide.strengthUsed >= out.strengthUsed, "a wider band never needs a smaller strength here");
  const side = sideFigure({ headForward: 10 });
  const head = Po.renderPosture(side.image, side.person, Po.plan(side.controls, "forward_head", "full"), { fillMethod: "fast-marching" });
  assert.ok(q1OutsideMask(side.image, head.image, head.band).passed);
  const none = Po.renderPosture(side.image, side.person, Po.plan(side.controls, "rounded_shoulders"));
  assert.equal(none.metrics.strip_pixels, 0);
  assert.throws(() => Po.renderPosture(side.image, floatImage(160, 200, 1), Po.plan(side.controls, "forward_head")), /empty/);
  assert.throws(() => Po.renderPosture(byteImage(100, 100, 3), side.person, Po.plan(side.controls, "forward_head")), /another size/);
});

test("LS4 approximate body area covers the skeleton and drawn figures are deterministic", () => {
  const fig = frontFigure();
  const area = approximatePerson(fig.controls);
  for (const n of ["right_shoulder", "left_shoulder", "navel"]) {
    const [x, y] = fig.controls.points[n].map(Math.round);
    assert.ok(area.data[y * 160 + x] > 0.5, n);
  }
  assert.equal(digest(frontFigure().image), digest(fig.image));
  const c = capsule(20, 20, [5, 10], [15, 10], 2);
  assert.equal(c.data[10 * 20 + 10], 1);
  assert.equal(c.data[0], 0);
});

// LS5 --------------------------------------------------------------------------------------
const crown = Fi.syntheticCrown({ width: 160, height: 160, seed: 6 });
const region = ellipse(160, 160, 80, 83, 42, 39);

test("LS5 two-means is stable, orders dark first and rejects tiny regions", () => {
  const rows = [[10, 0, 0], [12, 1, 0], [80, 5, 5], [82, 4, 6], [11, 0, 1]];
  const { labels, centres } = Fi.twoMeans(rows);
  assert.deepEqual([...labels], [0, 0, 1, 1, 0]);
  assert.ok(centres[0][0] < centres[1][0]);
  assert.throws(() => Fi.twoMeans([[1, 1, 1]]), /two pixels/);
});

test("LS5 zone grid covers six zones, honours frontal side and validates cuts", () => {
  const grid = Fi.zoneGrid([0, 0, 60, 100]);
  const index = Fi.zoneIndex(grid, 60, 100);
  assert.deepEqual([...new Set(index)].sort(), [0, 1, 2, 3, 4, 5]);
  assert.equal(index[5 * 60 + 5], 0);
  const flipped = Fi.zoneIndex(Fi.zoneGrid([0, 0, 60, 100], undefined, undefined, "bottom"), 60, 100);
  assert.equal(flipped[95 * 60 + 5], 0);
  assert.throws(() => Fi.zoneGrid([0, 0, 2, 100]), /4 px/);
  assert.throws(() => Fi.zoneGrid([0, 0, 60, 100], [0.5, 0.4, 0.8]), /row cuts/);
  assert.throws(() => Fi.gridFor(floatImage(10, 10, 1)), /brush/);
  assert.equal(Fi.level(0.05), "Full"); assert.equal(Fi.level(0.3), "Moderate"); assert.equal(Fi.level(0.6), "Visible scalp");
});

test("LS5 crown reading finds the drawn scalp exactly and the coverage map tints by level", () => {
  const reading = Fi.readCrown(crown.image, region);
  let truth = 0, count = 0;
  for (let i = 0; i < region.data.length; i++) if (region.data[i] >= 0.5) { count++; truth += crown.scalp[i]; }
  assert.ok(Math.abs(reading.overall_scalp_share - truth / count) < 0.01);
  assert.equal(reading.copy, Fi.COPY);
  const map = Fi.coverageMap(reading, region);
  assert.equal(map.channels, 4);
  assert.equal(map.data[3], 0, "outside the region stays clear");
  const light = Fi.syntheticCrown({ width: 96, height: 96, hair: [205, 178, 132], scalp: [150, 104, 86] });
  const split = Fi.split(light.image, ellipse(96, 96, 48, 50, 30, 28), false);
  let agree = 0, total = 0;
  for (let i = 0; i < split.hair.length; i++) if (split.hair[i] || split.scalp[i]) { total++; agree += split.hair[i] === light.hair[i] ? 1 : 0; }
  assert.ok(agree / total > 0.98, "light hair on darker scalp splits with hairIsDarker false");
});

test("LS5 shade card: library, top three, two-shade mix only above delta E 3", () => {
  assert.equal(Fi.SHADES.length, 14);
  assert.equal(new Set(Fi.SHADES.map((s) => s[0])).size, 14);
  const exact = Fi.shadeCard(Fi.shadeLab("S05"));
  assert.equal(exact.top[0].id, "S05");
  assert.ok(exact.top[0].delta_e < 1e-9);
  assert.equal(exact.mix, null);
  const between = Fi.shadeCard([30, 30, 25]);
  assert.ok(between.top[0].delta_e > 3 && between.mix && between.mix.delta_e <= between.top[0].delta_e);
  assert.throws(() => Fi.shadeLab("S99"), /unknown shade/);
  assert.throws(() => Fi.hairColour(crown.image, new Uint8Array(crown.hair.length)), /too few/);
});

test("LS5 fibres hit the scalp-share target, keep colour, stay inside the zone and repeat exactly", () => {
  const reading = Fi.readCrown(crown.image, region);
  let previous = Infinity;
  for (const level of ["light", "medium", "full"]) {
    const out = St.renderFibres(crown.image, region, reading.split.scalp, [22, 4, 6], { amount: level });
    const m = out.metrics;
    assert.ok(Math.abs(m.scalp_share_after - m.scalp_share_target) <= 0.07, level);
    assert.ok(m.fibre_delta_e <= 2, `${level} colour ${m.fibre_delta_e}`);
    assert.ok(q1OutsideMask(crown.image, out.image, out.editMask).passed);
    assert.ok(m.scalp_share_after < previous);
    previous = m.scalp_share_after;
  }
  const a = St.renderFibres(crown.image, region, reading.split.scalp, [22, 4, 6], { amount: 50, seed: 3 });
  const b = St.renderFibres(crown.image, region, reading.split.scalp, [22, 4, 6], { amount: 50, seed: 3 });
  assert.equal(digest(a.image), digest(b.image));
  for (const product of ["spray", "powder"]) {
    const out = St.renderFibres(crown.image, region, reading.split.scalp, [22, 4, 6], { product });
    assert.ok(out.metrics.reached && q1OutsideMask(crown.image, out.image, out.editMask).passed, product);
  }
  const none = St.renderFibres(crown.image, region, reading.split.scalp, [22, 4, 6], { amount: 0 });
  assert.equal(none.metrics.fibres_used, 0);
  assert.throws(() => St.cutFor(120), /0\.\.100/);
  assert.throws(() => St.renderFibres(crown.image, region, reading.split.scalp, [22, 4, 6], { product: "paint" }), /product/);
  assert.throws(() => St.renderFibres(crown.image, floatImage(160, 160, 1), reading.split.scalp, [22, 4, 6]), /empty/);
});

test("LS5 strand orientation follows the drawn flow on coherent hair", () => {
  const big = Fi.syntheticCrown({ width: 320, height: 320, seed: 6 });
  const o = St.orientation(big.image, big.hair, 9);
  const errors = [];
  for (let i = 0; i < big.hair.length; i += 7) {
    if (!big.hair[i] || o.coherence[i] < 0.2) continue;
    const d = Math.abs((((o.theta[i] - big.flow[i]) % Math.PI) + Math.PI + Math.PI / 2) % Math.PI - Math.PI / 2);
    errors.push(d);
  }
  errors.sort((x, y) => x - y);
  assert.ok(errors[Math.floor(errors.length / 2)] < 0.35, "median orientation error under 20 degrees (window radius 9)");
});

// LS6 --------------------------------------------------------------------------------------
const clean = E.scene();
test("LS6 estimators land within 15% of the drawn ground truth", () => {
  const share = Math.hypot(0.299, 0.587, 0.114);
  for (const s of [5, 10, 20]) {
    const got = E.noiseSigma(E.luma255(E.addNoise(clean, s, 2)));
    assert.ok(Math.abs(got - s * share) / (s * share) <= 0.15, `noise ${s}: ${got}`);
  }
  const base = E.blurSigma(E.luma255(clean));
  for (const b of [1.5, 2, 3]) {
    const truth = Math.hypot(b, base), got = E.blurSigma(E.luma255(E.blur(clean, b)));
    assert.ok(Math.abs(got - truth) / truth <= 0.15, `blur ${b}: ${got} vs ${truth}`);
  }
  const blk = E.blockiness(E.luma255(E.blocking(clean, 9)));
  assert.ok(Math.abs(blk - 6) / 6 <= 0.15, `block ${blk}`);
  const m = E.analyse(E.motionBlur(clean, 9, 1));
  assert.equal(m.blur_type, "motion");
  assert.ok(Math.abs(m.motion_degrees) < 10);
  assert.equal(E.analyse(clean).blur_type, "none");
  assert.throws(() => E.noiseSigma(E.luma255(byteImage(3, 3, 3))), /too small/);
});

test("LS6 denoise auto choice, Q11 rows and every mode run", () => {
  assert.equal(E.choose(1), "none"); assert.equal(E.choose(5), "guided"); assert.equal(E.choose(10), "bilateral"); assert.equal(E.choose(30), "nlm");
  assert.throws(() => E.choose(-1), /non-negative/);
  const noisy = E.addNoise(clean, 20, 6), sigma = E.noiseSigma(E.luma255(noisy));
  const den = E.denoise(noisy, sigma);
  const q = E.q11("M4", { psnrBefore: E.psnr(clean, noisy), psnrAfter: E.psnr(clean, den.image), sigmaBefore: sigma, sigmaAfter: E.noiseSigma(E.luma255(den.image)) });
  assert.equal(den.method, "bilateral", "luma sigma of colour noise 20 is about 13.4, under the 16 cut");
  assert.equal(q.passed, true, JSON.stringify(q.measured));
  assert.equal(E.denoise(noisy, sigma, { strength: 0 }).method, "none");
  assert.throws(() => E.denoise(noisy, sigma, { method: "median" }), /method/);
  for (const mode of Object.keys(E.MODES)) {
    const out = E.enhance(E.lowLight(clean, 0.4), mode, { strength: 0.8 });
    assert.equal(out.image.width, 192);
    assert.ok(out.after.mean_luminance > out.before.mean_luminance, mode);
  }
  assert.throws(() => E.enhance(clean, "magic"), /mode/);
  assert.throws(() => E.enhance(clean, "natural", { steps: { glow: true } }), /unknown steps/);
  const off = E.enhance(clean, "natural", { steps: { white_balance: false, exposure: false, colour: false, denoise: false, deblur: false, sharpen: false } });
  assert.equal(digest(off.image), digest(clean));
  assert.equal(E.psnr(clean, clean), Infinity);
});

test("LS6 unsharp boosts detail without leaving the 3x3 range (halo control)", () => {
  const soft = E.blur(clean, 1.5), out = E.unsharp(soft, 1.5, 2);
  assert.ok(E.laplacianVariance(E.luma255(out)) > E.laplacianVariance(E.luma255(soft)));
  assert.throws(() => E.unsharp(soft, 1, 5), /0\.\.3/);
  assert.throws(() => E.motionBlur(clean, 4), /odd/);
});

// LS7 --------------------------------------------------------------------------------------
const pts = beardFacePoints(240, 270), face = B.facePhoto(pts, 240, 270, 2);
test("LS7 beard area: neckline grows downward, moustache stays small, lips are cut out", () => {
  const high = B.beardArea(pts, 240, 270, { neckline: "high" }), low = B.beardArea(pts, 240, 270, { neckline: "low" });
  const area = (m) => m.hard.data.reduce((s, v) => s + v, 0);
  assert.ok(area(low) > area(high));
  const moustache = B.beardArea(pts, 240, 270, { region: "moustache" });
  assert.ok(area(moustache) < area(high) / 3);
  const lip = pts[14];
  assert.equal(high.hard.data[Math.round(lip[1]) * 240 + Math.round(lip[0])], 0);
  assert.throws(() => B.beardArea(pts, 240, 270, { neckline: "chest" }), /neckline/);
});

test("LS7 strands: density raises coverage, colour within 3, nothing outside, repeatable", () => {
  for (const style of Object.keys(B.STYLES)) {
    const coverage = [];
    let last;
    for (const density of [1, 2, 3, 4]) { last = B.renderBeard(face, pts, { style, density, colour: B.HAIR_LAB }); coverage.push(last.metrics.coverage); }
    assert.ok(q9Monotonic(coverage).passed, `${style} ${coverage}`);
    assert.ok(last.metrics.strand_delta_e <= 3, style);
    assert.ok(q1OutsideMask(face, last.image, last.editMask).passed, style);
    assert.equal(digest(B.renderBeard(face, pts, { style, colour: B.HAIR_LAB }).image), digest(last.image));
  }
  const hex = B.renderBeard(face, pts, { colour: "#5A4030", edge: "sharp", length: 5 });
  assert.equal(hex.metrics.edge, "sharp");
  assert.throws(() => B.renderBeard(face, pts, { style: "goatee" }), /style/);
  assert.throws(() => B.renderBeard(face, pts, { density: 7 }), /density/);
  assert.throws(() => B.targetLab([1, 2]), /hex/);
  const turned = rolledFace(pts, 6);
  assert.ok(B.renderBeard(B.facePhoto(turned, 240, 270), turned, { colour: B.HAIR_LAB }).metrics.strands > 0);
});

test("LS7 synthetic face port is symmetric", () => {
  const p = symmetricFace();
  assert.equal(p.length, 478);
  assert.ok(Math.abs((p[33][0] + p[263][0]) / 2 - 200) < 1e-9);
});

// LS8 --------------------------------------------------------------------------------------
test("LS8 catalogue distinguishes cleared pins from pending bundles without live probes", async () => {
  const rows = Bu.catalogueRows();
  const expected = {
    "face-detector-short": ["allowed", 229746, true, "PASS"],
    "face-landmarker-478": ["allowed", 3758596, true, "PASS"],
    "pose-landmarker-lite": ["pending", 5777746, false, "PASS"],
    "hair-segmenter": ["allowed", 781618, true, "PASS"],
    "selfie-multiclass": ["allowed", 16371837, true, "PASS"],
    "migan-512-places2": ["pending", null, false, "NOT_PINNED"],
  };
  assert.equal(rows.length, Object.keys(expected).length);
  assert.deepEqual(rows.map((row) => row.id).sort(), Object.keys(expected).sort());
  let calls = 0;
  for (const r of rows) {
    const [status, bytes, fetchable, downloadGate] = expected[r.id];
    assert.deepEqual([r.status, r.fetchable, r.q13_download], [status, fetchable, downloadGate], r.id);
    assert.equal(r.download_mb, bytes === null ? null : bytes / (1024 * 1024), r.id);
    if (r.fetchable) continue;
    const probe = await Bu.probeModel(r.id, undefined, async () => { calls++; throw new Error("network"); });
    assert.equal(probe.fetched, false);
    assert.equal(probe.q13_download, downloadGate);
    assert.equal(probe.q13_load, "NOT_MEASURED");
  }
  assert.equal(calls, 0);
});

test("LS8 probes an approved model through the verified path and times it", async () => {
  const bytes = new TextEncoder().encode("synthetic model bytes for a budget test");
  const { createHash } = await import("node:crypto");
  const sha = createHash("sha256").update(bytes).digest("hex");
  const url = "https://storage.googleapis.com/mediapipe-models/face_landmarker/mock/1/x.task";
  const reg = new BrowserModelRegistry({ format: "beljour-models/1", version: 1, models: [{ id: "probe-model", task: "face-landmarks", filename: "x.task", url,
    sha256: sha, bytes: bytes.length, licenceName: "Probe licence", licence: "MIT", status: "allowed", runsOn: "browser", note: "test" }] },
  { "Probe licence": { licence: "MIT", status: "allowed", urls: ["https://storage.googleapis.com/mediapipe-models/face_landmarker/"] } });
  let t = 0;
  const probe = await Bu.probeModel("probe-model", reg, async () => new Response(bytes, { status: 200 }), () => (t += 250));
  assert.equal(probe.fetched, true);
  assert.equal(probe.q13_download, "PASS");
  assert.equal(probe.q13_load, "PASS");
  const check = await Bu.checkLocalFile("x.task", bytes.slice().buffer, reg);
  assert.equal(check.verdict, "matches pinned model");
  const other = await Bu.checkLocalFile("x.task", new Uint8Array(4).buffer, reg);
  assert.equal(other.verdict, "differs from pinned model");
  const pending = await Bu.checkLocalFile("migan_pipeline_v2.onnx", new Uint8Array(4).buffer);
  assert.equal(pending.verdict, "model not pinned yet");
  assert.equal((await Bu.checkLocalFile("x.bin", new Uint8Array(1).buffer)).verdict, "unknown model file");
  const bad = await Bu.probeModel("probe-model", reg, async () => new Response(new Uint8Array(3), { status: 200 }));
  assert.equal(bad.fetched, false);
});

test("LS8 memory snapshot, timings and report", () => {
  const snap = Bu.memorySnapshot({ performance: { memory: { usedJSHeapSize: 2 ** 21, jsHeapSizeLimit: 2 ** 30 } }, navigator: { deviceMemory: 4, hardwareConcurrency: 8 } });
  assert.deepEqual(snap, { js_heap_used_mb: 2, js_heap_limit_mb: 1024, device_memory_gb: 4, cores: 8 });
  assert.deepEqual(Bu.memorySnapshot({}), { js_heap_used_mb: null, js_heap_limit_mb: null, device_memory_gb: null, cores: null });
  const timings = Bu.engineTimings(128);
  assert.deepEqual(timings.map((t) => t.tool), ["enhance", "fibre", "beard", "posture", "fill"]);
  assert.ok(timings.every((t) => t.ms >= 0 && t.q8 === "NOT_MEASURED"));
  const report = Bu.budgetReport({ deviceLabel: "test laptop", created: "2026-10-22T00:00:00Z", timings });
  assert.equal(report.format, Bu.FORMAT);
  assert.equal(report.decision, "UNVERIFIED");
  assert.throws(() => Bu.budgetReport({ deviceLabel: " ", created: "x" }), /label/);
  assert.throws(() => Bu.engineTimings(50), /128/);
});
