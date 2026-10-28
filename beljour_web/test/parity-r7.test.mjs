// R7 Python <-> TypeScript vectors (parity/spikes-r7.json): LS4 posture plans and renders,
// LS5 crown reading, shade card and fibre renders, LS6 analysis/denoise/enhance, LS7 beard
// strands and the MI-GAN wrapper crop and tensor rules. Bytes within one level, numbers
// within 1/255, counts exact (fibre counts within one strand). Author: John Khan.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { byteImage } from "../dist/js/engines/core/buffer.js";
import { ellipse } from "../dist/js/engines/core/mask.js";
import { XorShift32 } from "../dist/js/engines/fill/patchmatch.js";
import { holeBox, cropBox, buildFeeds, decodeOutput } from "../dist/js/engines/fill/onnx/migan.js";
import { maxAbsDifference } from "../dist/js/quality/metrics.js";
import { figureCases, frontFigure, approximatePerson } from "../dist/js/engines/local/figures.js";
import { fixesFor, plan, renderPosture, STOPS } from "../dist/js/engines/local/posture.js";
import { syntheticCrown, readCrown, hairColour, shadeCard } from "../dist/js/engines/local/fibre.js";
import { renderFibres, poissonSeeds } from "../dist/js/engines/local/strands.js";
import * as E from "../dist/js/engines/local/enhance.js";
import { renderBeard, facePhoto, HAIR_LAB } from "../dist/js/engines/local/beard.js";
import { beardFacePoints } from "../dist/js/engines/local/face-synthetic.js";

const P = JSON.parse(readFileSync(new URL("../../parity/spikes-r7.json", import.meta.url), "utf8"));
const TOL = 1 / 255;
const sample = (img, stride) => {
  const out = [];
  const n = img.width * img.height, ch = img.channels;
  const flat = ch === 3 ? img.data : Uint8Array.from({ length: n * 3 }, (_, i) => img.data[Math.floor(i / 3) * ch + (i % 3)]);
  for (let i = 0; i < flat.length; i += stride) out.push(flat[i]);
  return out;
};
const sampleMask = (m, stride) => { const out = []; for (let i = 0; i < m.data.length; i += stride) out.push(m.data[i]); return out; };
const bytesClose = (a, b, what) => {
  assert.equal(a.length, b.length, `${what}: sample length`);
  let worst = 0;
  for (let i = 0; i < a.length; i++) worst = Math.max(worst, Math.abs(a[i] - b[i]));
  assert.ok(worst <= 1, `${what}: byte difference ${worst}`);
};
const close = (a, b, what, tol = TOL) => assert.ok(maxAbsDifference(a, b) <= tol, `${what}: ${JSON.stringify(a).slice(0, 80)} vs ${JSON.stringify(b).slice(0, 80)}`);

test("R7 parity file is synthetic and complete", () => {
  assert.equal(P.format, "beljour-r7-parity/1");
  assert.equal(P.synthetic_only, true);
  for (const key of ["posture", "fibre", "enhance", "beard", "migan"]) assert.ok(P[key], key);
});

test("LS4 figures, masks, approximate body area and every fix plan match Python", () => {
  const figs = figureCases();
  for (const vec of P.posture.filter((v) => v.case !== "render")) {
    const fig = figs[vec.case];
    bytesClose(sample(fig.image, 41), vec.image, `figure ${vec.case}`);
    close(sampleMask(fig.person, 37), vec.person, `person ${vec.case}`);
    close(sampleMask(approximatePerson(fig.controls), 37), vec.approximate_person, `approximate ${vec.case}`);
    assert.deepEqual(fixesFor(fig.controls.view).sort(), Object.keys(vec.plans).sort());
    for (const [fix, stops] of Object.entries(vec.plans)) {
      assert.deepEqual(Object.keys(stops).sort(), Object.keys(STOPS).sort());
      for (const [stop, want] of Object.entries(stops)) {
        const p = plan(fig.controls, fix, stop);
        const after = Object.fromEntries(Object.keys(want.after).map((n) => [n, [...p.after.points[n]]]));
        close(after, want.after, `${fix}:${stop} points`, 1e-6);
        close([p.measureBefore, p.measureAfter, p.capScale], [want.measure_before, want.measure_after, want.cap_scale], `${fix}:${stop} measures`, 1e-6);
      }
    }
  }
});

test("LS4 band render with biharmonic strip fill matches Python", () => {
  const vec = P.posture.find((v) => v.case === "render");
  const fig = frontFigure({ width: 96, height: 120, lean: 5, shoulderDrop: 3, seed: 2 });
  const out = renderPosture(fig.image, fig.person, plan(fig.controls, "lean", "full"), { fillMethod: "biharmonic" });
  close(out.strengthUsed, vec.strength_used, "strength used", 1e-6);
  assert.equal(out.metrics.strip_pixels, vec.strip_pixels);
  bytesClose(sample(out.image, 13), vec.output, "posture render");
});

test("LS5 crown drawing, zone reading, shade card, seeds and fibre renders match Python", () => {
  const v = P.fibre, [w, h] = v.size;
  const c = syntheticCrown({ width: w, height: h, seed: v.seed });
  bytesClose(sample(c.image, 31), v.image, "crown");
  close(c.scalp.reduce((s, x) => s + x, 0) / c.scalp.length, v.scalp_share, "truth share", 1e-6);
  const [cx, cy, rx, ry] = c.thin, region = ellipse(w, h, cx * w, cy * h, rx * w * 1.1, ry * h * 1.1);
  const reading = readCrown(c.image, region);
  for (let k = 0; k < 6; k++) {
    const a = reading.zones[k], b = v.zones[k];
    assert.equal(a.zone, b.zone); assert.equal(a.pixels, b.pixels); assert.equal(a.level, b.level);
    close([a.scalp_share, a.strand_density], [b.scalp_share, b.strand_density], `zone ${a.zone}`, 1e-4);
  }
  const hair = hairColour(c.image, reading.split.hair), card = shadeCard(hair);
  close(hair, v.hair_lab, "hair colour", 1e-5);
  assert.deepEqual(card.top.map((t) => t.id), v.card_top.map((t) => t.id));
  close(card.top.map((t) => t.delta_e), v.card_top.map((t) => t.delta_e), "shade delta E", 1e-5);
  assert.deepEqual(card.mix ? { first: card.mix.first, second: card.mix.second, second_share: card.mix.second_share } : null, v.mix);
  const ones = new Float64Array(w * h).fill(1);
  assert.deepEqual(poissonSeeds(c.scalp, w, h, ones, 2, 40, new XorShift32(5)), v.seeds);
  for (const [key, want] of Object.entries(v.renders)) {
    const [product, level] = key.split(":");
    const o = renderFibres(c.image, region, reading.split.scalp, [22, 4, 6], { amount: level, product });
    assert.ok(Math.abs(o.metrics.fibres_used - want.fibres_used) <= 1, `${key} fibres`);
    assert.equal(o.metrics.target_px, want.target_px);
    assert.ok(Math.abs(o.metrics.covered_px - want.covered_px) <= 3, `${key} covered`);
    close(o.metrics.fibre_lab, want.fibre_lab, `${key} colour`, 1e-2);
    bytesClose(sample(o.image, 23), want.output, key);
  }
});

test("LS6 analysis, denoisers, enhance and unsharp match Python", () => {
  const v = P.enhance, clean = E.scene(96, 80), noisy = E.addNoise(clean, 12, 3);
  bytesClose(sample(clean, 13), v.scene, "scene");
  bytesClose(sample(noisy, 13), v.noisy, "noisy");
  const cases = { noisy, blur: E.blur(clean, 1.5), motion: E.motionBlur(clean, 7, 1), block: E.blocking(clean, 8),
    cast: E.cast(clean, [1.2, 1, 0.8]), dark: E.lowLight(clean, 0.3) };
  for (const [name, img] of Object.entries(cases)) {
    const a = E.analyse(img), want = v.analysis[name];
    assert.equal(a.blur_type, want.blur_type, `${name} blur type`);
    for (const k of ["noise_sigma", "blur_sigma", "motion_coherence", "blockiness", "mean_luminance"]) close(a[k], want[k], `${name}.${k}`, 1e-5);
    assert.ok(Math.abs(a.laplacian_variance - want.laplacian_variance) <= 1e-6 * Math.max(1, want.laplacian_variance), `${name} laplacian`);
    close(a.grey_gains, want.grey_gains, `${name} gains`, 1e-5);
  }
  const sigma = E.noiseSigma(E.luma255(noisy));
  for (const method of ["guided", "bilateral", "nlm"]) bytesClose(sample(E.denoise(noisy, sigma, { method }).image, 13), v.denoise[method], method);
  const e = E.enhance(noisy, "natural");
  assert.deepEqual(e.steps, v.enhance.steps);
  bytesClose(sample(e.image, 13), v.enhance.output, "enhance");
  bytesClose(sample(E.unsharp(E.blur(clean, 1.5), 1.5, 1), 13), v.unsharp, "unsharp");
  close(E.psnr(clean, noisy), v.psnr, "psnr", 1e-5);
});

test("LS7 drawn face, beard area and strands match Python for all three styles", () => {
  const v = P.beard, [w, h] = v.size, pts = beardFacePoints(w, h);
  close([0, 61, 152, 234, 291, 454, 468].map((i) => [...pts[i]]), v.points_probe, "face points", 1e-6);
  const img = facePhoto(pts, w, h, 3);
  bytesClose(sample(img, 29), v.photo, "face photo");
  for (const [style, want] of Object.entries(v.styles)) {
    const o = renderBeard(img, pts, { style, density: 3, colour: HAIR_LAB, neckline: "low" });
    assert.equal(o.metrics.strands, want.strands, `${style} strands`);
    assert.equal(o.metrics.area_px, want.area_px, `${style} area`);
    close(o.metrics.strand_lab, want.strand_lab, `${style} colour`, 1e-2);
    bytesClose(sample(o.image, 23), want.output, style);
  }
});

test("MI-GAN wrapper crop boxes, feeds and output decoding match Python", () => {
  const v = P.migan;
  for (const hole of v.holes) {
    const [w, h] = hole.size, [cx, cy, rx, ry] = hole.ellipse, m = ellipse(w, h, cx, cy, rx, ry);
    assert.deepEqual(holeBox(m), hole.hole_box);
    assert.deepEqual(cropBox(m), hole.crop);
  }
  const crop = byteImage(40, 30, 3), bits = new Uint8Array(40 * 30);
  for (let y = 0; y < 30; y++) for (let x = 0; x < 40; x++) {
    const p = (y * 40 + x) * 3;
    crop.data[p] = (x * 6) % 256; crop.data[p + 1] = (y * 8) % 256; crop.data[p + 2] = ((x + y) * 3) % 256;
    bits[y * 40 + x] = (x - 20) ** 2 + (y - 15) ** 2 <= 36 ? 1 : 0;
  }
  const gen = buildFeeds(crop, bits, "generator-512").input.data;
  let sum = 0;
  for (const value of gen) sum += value;
  close(sum, v.generator_sum, "generator sum", 0.05);
  close(Array.from({ length: v.generator_probe.length }, (_, k) => gen[k * 40000]), v.generator_probe, "generator probe", 1e-5);
  const pipe = buildFeeds(crop, bits, "pipeline-uint8");
  assert.deepEqual(Array.from({ length: v.pipeline_image_probe.length }, (_, k) => pipe.image.data[k * 97]), v.pipeline_image_probe);
  assert.equal(pipe.mask.data.reduce((s, x) => s + x, 0), v.pipeline_mask_sum);
  const tensor = { type: "float32", dims: [1, 3, 512, 512], data: Float32Array.from({ length: 3 * 512 * 512 }, (_, i) => Math.sin(i / 997)) };
  bytesClose(sample(decodeOutput(tensor, "generator-512", 40, 30), 7), v.decoded, "decoded output");
});
