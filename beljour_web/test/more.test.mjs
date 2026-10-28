import assert from "node:assert/strict";
import { test } from "node:test";

import { bmi, circumference, ellipsePerimeter, estimateBody, posture, rowWidth, verticalExtent, waistToHeight } from "../dist/js/body/measure.js";
import { readExpression } from "../dist/js/face/expression.js";
import { applyDeltas, labToRgb, mixDeltas, regionDelta, rgbToLab } from "../dist/js/reel/colour.js";
import { blendWeights, histDistance, lumaHistogram, poseFromMesh, sceneCuts, selectKeyframes } from "../dist/js/reel/keyframes.js";
import { LandmarkSmoother, OneEuro } from "../dist/js/reel/oneEuro.js";
import { simulationDefaults } from "../dist/js/screens/skin.js";

const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg ?? ""} ${a} vs ${b}`);

test("BMI bands follow WHO cut offs", () => {
  assert.equal(bmi(70, 175).value, 22.9);
  assert.equal(bmi(70, 175).band, "healthy weight range");
  assert.equal(bmi(56, 175).band, "underweight range");     // 18.3
  assert.equal(bmi(77, 175).band, "overweight range");      // 25.1
  assert.equal(bmi(92, 175).band, "obesity range");         // 30.0
  assert.equal(bmi(0, 175), null);
});

test("waist to height uses NICE bands and flags BMI 35 and over", () => {
  assert.equal(waistToHeight(80, 175).band, "healthy range");      // 0.46
  assert.equal(waistToHeight(90, 175).band, "increased range");    // 0.51
  assert.equal(waistToHeight(110, 175).band, "high range");        // 0.63
  assert.match(waistToHeight(110, 175, 36).source, /BMI under 35/);
});

test("ellipse perimeter is exact for a circle and sensible for an ellipse", () => {
  near(ellipsePerimeter(10, 10), 2 * Math.PI * 10, 1e-9);
  near(ellipsePerimeter(10, 5), 48.4422, 1e-3, "Ramanujan II");
  near(circumference(30, 1), Math.PI * 30, 1e-9);
});

function bodyMask(w, h) {
  // a crude standing figure: head, torso narrowing at the waist, two legs
  const m = new Float32Array(w * h);
  const fill = (y0, y1, half) => { for (let y = y0; y < y1; y++) for (let x = w / 2 - half(y); x < w / 2 + half(y); x++) m[y * w + Math.round(x)] = 1; };
  fill(20, 70, () => 18);                                         // head
  fill(70, 230, (y) => (y < 150 ? 50 - (y - 70) * 0.15 : 38 + (y - 150) * 0.2));   // torso, narrowest near y=150
  fill(230, 420, () => 40);                                       // legs block
  return m;
}

test("rowWidth and verticalExtent read the person mask", () => {
  const w = 200, h = 440, m = bodyMask(w, h);
  assert.deepEqual(verticalExtent(m, w, h), [20, 419]);
  near(rowWidth(m, w, 100, 100), 2 * (50 - 30 * 0.15), 1, "torso width at row 100");
  assert.equal(rowWidth(m, w, 5, 100), 0);
});

test("estimateBody scales by height and gives ranges", () => {
  const w = 200, h = 440, m = bodyMask(w, h);
  const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5 }));
  lm[11] = { x: 0.62, y: 75 / h }; lm[12] = { x: 0.38, y: 75 / h };
  lm[23] = { x: 0.56, y: 225 / h }; lm[24] = { x: 0.44, y: 225 / h };
  lm[25] = { x: 0.56, y: 320 / h }; lm[26] = { x: 0.44, y: 320 / h };
  const e = estimateBody(lm, m, w, h, 175);
  near(e.cmPerPx, 175 / 399, 1e-9);
  for (const k of ["chest", "waist", "hips", "inseam", "shoulders"]) {
    const [est, lo, hi] = e[k];
    assert.ok(lo <= est && est <= hi, `${k} range ${lo} ${est} ${hi}`);
  }
  assert.ok(e.waist[0] < e.chest[0], "waist narrower than chest in this figure");
  assert.equal(estimateBody(lm, new Float32Array(w * h), w, h, 175), null);
});

test("posture reads level and tilted shoulders", () => {
  const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5 }));
  lm[11] = { x: 0.6, y: 0.3 }; lm[12] = { x: 0.4, y: 0.3 };
  lm[23] = { x: 0.55, y: 0.6 }; lm[24] = { x: 0.45, y: 0.6 };
  lm[7] = { x: 0.53, y: 0.1 }; lm[8] = { x: 0.47, y: 0.1 };
  assert.equal(posture(lm, 400, 800)[0].note, "level");
  lm[11] = { x: 0.6, y: 0.32 };
  assert.match(posture(lm, 400, 800)[0].note, /lower on your left/);
});

test("expression read stays non diagnostic and responds to a smile", () => {
  const neutral = readExpression({});
  const smiling = readExpression({ mouthSmileLeft: 0.8, mouthSmileRight: 0.8, cheekSquintLeft: 0.5, cheekSquintRight: 0.5 });
  const score = (r, l) => r.impressions.find((i) => i.label === l).score;
  assert.ok(score(smiling, "Approachable") > score(neutral, "Approachable"));
  assert.equal(smiling.smileType, "full (eyes and mouth)");
  assert.equal(neutral.smileType, "none");
  const words = JSON.stringify(smiling).toLowerCase();
  for (const w of ["depress", "anxious", "attractive", "ugly", "personality"]) assert.ok(!words.includes(w));
});

test("One Euro filter smooths jitter but follows a real move", () => {
  const f = new OneEuro(1.0, 0.01);
  let out = 0;
  for (let i = 0; i < 60; i++) out = f.filter(10 + (i % 2 ? 0.5 : -0.5), i / 30);
  near(out, 10, 0.3, "jitter averaged");
  for (let i = 60; i < 120; i++) out = f.filter(50, i / 30);
  near(out, 50, 0.5, "catches up after a step");
  const s = new LandmarkSmoother();
  assert.equal(s.smooth([{ x: 0.2, y: 0.4 }], 0)[0].x, 0.2);
});

test("keyframes: first face frame, scene cuts, then distinct poses", () => {
  const A = Array(32).fill(0); A[5] = 1;
  const B = Array(32).fill(0); B[25] = 1;
  const frames = [];
  for (let i = 0; i < 40; i++) {
    frames.push({ t: i / 4, hist: i < 20 ? A : B, pose: i === 0 ? null : [i === 10 ? 0.3 : 0, 0, i === 30 ? 15 : 0] });
  }
  assert.equal(histDistance(A, B), 1);
  assert.deepEqual(sceneCuts(frames), [20]);
  const picks = selectKeyframes(frames, 4);
  assert.equal(picks[0], 1);           // frame 0 has no face
  assert.ok(picks.includes(20));       // first frame of the new scene
  assert.ok(picks.includes(10) && picks.includes(30), `distinct poses picked: ${picks}`);
  assert.deepEqual(selectKeyframes(frames, 2).length, 2);
});

test("blend weights interpolate inside a scene and never across a cut", () => {
  assert.deepEqual(blendWeights(1, [0, 2], []), [0.5, 0.5]);
  assert.deepEqual(blendWeights(3, [0, 2, 5], [2.5]), [0, 0, 1]);
  assert.deepEqual(blendWeights(9, [0, 2], []), [0, 1]);
});

test("luma histogram and head pose", () => {
  const px = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]);
  const hgram = lumaHistogram(px, 4);
  assert.deepEqual(hgram, [0.5, 0, 0, 0.5]);
  const p = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  p[234] = { x: 0.3, y: 0.5 }; p[454] = { x: 0.7, y: 0.5 }; p[1] = { x: 0.5, y: 0.55 };
  p[33] = { x: 0.4, y: 0.42 }; p[263] = { x: 0.6, y: 0.42 }; p[152] = { x: 0.5, y: 0.8 };
  const [yaw, , roll] = poseFromMesh(p, 9 / 16);
  near(yaw, 0, 1e-9); near(roll, 0, 1e-9);
});

test("Lab maths matches the Python implementation", () => {
  const [L, a, b] = rgbToLab(0xC4, 0x96, 0x7A);
  near(L, 65.7141, 0.01); near(a, 13.4749, 0.02); near(b, 21.4360, 0.02);
  assert.deepEqual(labToRgb([60, 20, 30]), [193, 130, 93]);
  for (const rgb of [[10, 20, 30], [200, 150, 120], [255, 0, 128]]) {
    const back = labToRgb(rgbToLab(...rgb));
    rgb.forEach((v, i) => near(back[i], v, 1));
  }
});

test("colour transfer learns a region change and applies it only inside the mask", () => {
  const n = 4;
  const before = new Uint8ClampedArray(n * 4).fill(150);
  const after = new Uint8ClampedArray(before);
  for (let i = 0; i < n; i++) { after[i * 4] = 190; after[i * 4 + 1] = 120; }   // redder
  const full = new Float32Array(n).fill(1), none = new Float32Array(n);
  const d = regionDelta(before, after, full);
  assert.ok(d[1] > 10, `a* rises: ${d}`);
  const deltas = { skin: [0, 0, 0], lips: d, cheeks: [0, 0, 0] };
  const mask = { skin: none, lips: new Float32Array([1, 1, 0, 0]), cheeks: none };
  const out = applyDeltas(before, mask, deltas);
  near(out[0], 190, 2); near(out[1], 120, 2);
  assert.equal(out[8], 150);
  const mixed = mixDeltas([deltas, { skin: [10, 0, 0], lips: [0, 0, 0], cheeks: [0, 0, 0] }], [0.5, 0.5]);
  near(mixed.skin[0], 5, 1e-9);
});

test("simulation defaults match the server rule", () => {
  const raw = { acne: 84.2, moisture: 52.7, oiliness: 63.1, pore: 71.5, redness: 68.4, texture: 77.9,
    wrinkle: 81.0, dark_circle_v2: 58.3, eye_bag: 74.0, age_spot: 88.0, radiance: 70.5, firmness: 86.1 };
  const scores = Object.entries(raw).map(([concern, raw_score]) => ({ concern, raw_score }));
  // value printed by plumb_api.state.simulation_defaults for the same scores
  assert.deepEqual(simulationDefaults(scores), { dark_circle: 0.5, oiliness: 0.5 });
});
