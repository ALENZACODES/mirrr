/**
 * MIRRR live try-on: the pure geometry and colour maths behind the camera view.
 *
 * No DOM, no camera, no model: every function takes plain numbers or arrays, so the same code runs
 * in the browser and in Node tests. Landmark indices are the 478-point face mesh used by the
 * on-device face landmarker (468 mesh points plus 10 iris points); points arrive normalised to 0..1
 * of the frame and are turned into pixels here.
 */

// ---- landmark index sets (face mesh topology) ----------------------------------------------------
export const LIPS_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146];
export const LIPS_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];
// Eyes are named as the person sees them: her right eye is on the left of an unmirrored frame.
export const EYE = {
  right: { upper: [33, 246, 161, 160, 159, 158, 157, 173, 133], lower: [33, 7, 163, 144, 145, 153, 154, 155, 133], outer: 33, inner: 133, top: 159, bottom: 145 },
  left: { upper: [263, 466, 388, 387, 386, 385, 384, 398, 362], lower: [263, 249, 390, 373, 374, 380, 381, 382, 362], outer: 263, inner: 362, top: 386, bottom: 374 },
};
// Brow outlines, outer end first: the upper edge, then the lower edge.
export const BROW = {
  right: { upper: [70, 63, 105, 66, 107], lower: [46, 53, 52, 65, 55] },
  left: { upper: [300, 293, 334, 296, 336], lower: [276, 283, 282, 295, 285] },
};
// Cheek apples (centre, and a point toward the ear that sets the blush direction).
export const CHEEK = { right: { centre: 205, toward: 123 }, left: { centre: 425, toward: 352 } };
export const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
export const ANCHOR = { forehead: 10, chin: 152, rightTemple: 127, leftTemple: 356, rightCheek: 234, leftCheek: 454, noseTip: 1 };

/** Normalised landmarks ({x, y} in 0..1) at these indices, in pixels. */
export function toPixels(landmarks, indices, width, height) {
  return indices.map(i => { const p = landmarks[i]; return [p.x * width, p.y * height]; });
}

/** Signed polygon area (shoelace); positive for clockwise in screen coordinates. */
export function polygonArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i]; const [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; }
  return a / 2;
}

export function bbox(pts, pad = 0) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
}

export function pointInPolygon([x, y], pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]; const [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * A closed Catmull-Rom curve through the points as cubic Bezier segments
 * [[c1x, c1y, c2x, c2y, x, y], ...], starting from pts[0]. Smooths the mesh's straight edges
 * so a lip line reads as a curve, not a polygon.
 */
export function smoothClosed(pts, tension = 0.5) {
  const n = pts.length; const out = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const k = tension / 3;
    out.push([p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]]);
  }
  return out;
}

/** The open version for a line (a lash line, a liner stroke). */
export function smoothOpen(pts, tension = 0.5) {
  const n = pts.length; const out = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const k = tension / 3;
    out.push([p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]]);
  }
  return out;
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** How open an eye is: lid gap over eye width (about 0.25-0.35 open, under 0.12 closed). */
export function eyeOpenness(landmarks, side, width = 1, height = 1) {
  const e = EYE[side];
  const [o, i, t, b] = toPixels(landmarks, [e.outer, e.inner, e.top, e.bottom], width, height);
  const w = dist(o, i);
  return w > 0 ? dist(t, b) / w : 0;
}

/** Head pose from the mesh: roll (radians, from the eye line), face width in px, and a yaw estimate (-1..1). */
export function headPose(landmarks, width, height) {
  const [ro, lo, rc, lc, nose] = toPixels(landmarks, [EYE.right.outer, EYE.left.outer, ANCHOR.rightCheek, ANCHOR.leftCheek, ANCHOR.noseTip], width, height);
  const roll = Math.atan2(lo[1] - ro[1], lo[0] - ro[0]);
  const faceWidth = dist(rc, lc);
  const mid = lerp(rc, lc, 0.5);
  // Nose tip offset from the cheek midpoint, measured along the eye line, as a share of half the face.
  const ux = Math.cos(roll), uy = Math.sin(roll);
  const yaw = faceWidth > 0 ? Math.max(-1, Math.min(1, (((nose[0] - mid[0]) * ux + (nose[1] - mid[1]) * uy) / (faceWidth / 2)))) : 0;
  return { roll, faceWidth, yaw };
}

/**
 * Upper lash line points from inner to outer corner, and for each point the outward normal (away from
 * the eyeball, i.e. "up" the lid) as a unit vector. Lashes grow along these normals.
 */
export function lashLine(landmarks, side, width, height) {
  const e = EYE[side];
  const upper = toPixels(landmarks, [...e.upper].reverse(), width, height); // inner -> outer
  const [t, b] = toPixels(landmarks, [e.top, e.bottom], width, height);
  const centre = lerp(t, b, 0.5);
  return upper.map((p, k) => {
    const prev = upper[Math.max(0, k - 1)], next = upper[Math.min(upper.length - 1, k + 1)];
    let nx = -(next[1] - prev[1]), ny = next[0] - prev[0];
    const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
    // Point away from the eye centre.
    if ((p[0] - centre[0]) * nx + (p[1] - centre[1]) * ny < 0) { nx = -nx; ny = -ny; }
    return { p, n: [nx, ny], t: upper.length > 1 ? k / (upper.length - 1) : 0 };
  });
}

/**
 * The eyeliner wing: from the outer corner, continuing the lower lash line's direction upward toward
 * the brow tail. Returns [base, tip] in pixels. `length` is a share of eye width.
 */
export function wingTip(landmarks, side, width, height, length = 0.35) {
  const e = EYE[side]; const b = BROW[side];
  const [o, i, browTail] = toPixels(landmarks, [e.outer, e.inner, b.upper[0]], width, height);
  const w = dist(o, i);
  // Direction: blend of "away from the inner corner" and "toward the brow tail".
  const away = [(o[0] - i[0]) / w, (o[1] - i[1]) / w];
  const tb = dist(browTail, o) || 1; const up = [(browTail[0] - o[0]) / tb, (browTail[1] - o[1]) / tb];
  let d = [away[0] * 0.6 + up[0] * 0.4, away[1] * 0.6 + up[1] * 0.4];
  const dl = Math.hypot(d[0], d[1]) || 1; d = [d[0] / dl, d[1] / dl];
  return [o, [o[0] + d[0] * w * length, o[1] + d[1] * w * length]];
}

/**
 * The lid (eyeshadow) region: the upper lash line, then back along a crease line raised toward the
 * brow by `height` of the lid-to-brow gap. Returns a closed polygon in pixels.
 */
export function lidPolygon(landmarks, side, width, height, rise = 0.55) {
  const e = EYE[side]; const b = BROW[side];
  const lash = toPixels(landmarks, e.upper, width, height); // outer -> inner
  const brow = toPixels(landmarks, b.lower, width, height); // outer -> inner
  const crease = lash.map((p, k) => {
    const q = brow[Math.round((k / (lash.length - 1)) * (brow.length - 1))];
    const taper = Math.sin(Math.PI * (0.15 + 0.7 * (k / (lash.length - 1)))); // lower at the corners
    return lerp(p, q, rise * taper);
  });
  return [...lash, ...crease.reverse()];
}

/** Brow polygon (upper edge outer->inner, then lower edge inner->outer). */
export function browPolygon(landmarks, side, width, height) {
  const b = BROW[side];
  return [...toPixels(landmarks, b.upper, width, height), ...toPixels(landmarks, b.lower, width, height).reverse()];
}

/** Blush ellipse on the cheek apple: centre, radii and angle, sized by face width. */
export function blushEllipse(landmarks, side, width, height) {
  const c = CHEEK[side];
  const [centre, toward] = toPixels(landmarks, [c.centre, c.toward], width, height);
  const { faceWidth } = headPose(landmarks, width, height);
  const centreLifted = lerp(centre, toward, 0.35);
  return { cx: centreLifted[0], cy: centreLifted[1], rx: faceWidth * 0.16, ry: faceWidth * 0.11, angle: Math.atan2(toward[1] - centre[1], toward[0] - centre[0]) };
}

/**
 * Similarity transform taking two anchor points of a wig cutout (its model's forehead and chin) onto
 * the user's: returns a canvas transform [a, b, c, d, e, f] (as for ctx.setTransform), so the wig
 * scales with the face, turns with head roll and moves with the head. Forehead-to-chin is used rather
 * than the eye line because it barely changes as the head turns left or right. `yaw` (-1..1) with
 * `yawShift` slides the wig sideways (perpendicular to that axis) to follow a turned head.
 */
export function wigTransform(srcA, srcB, dstA, dstB, yaw = 0, yawShift = 0) {
  const sv = [srcB[0] - srcA[0], srcB[1] - srcA[1]];
  const dv = [dstB[0] - dstA[0], dstB[1] - dstA[1]];
  const sl = Math.hypot(...sv), dl = Math.hypot(...dv);
  const s = sl > 0 ? dl / sl : 1;
  const rot = Math.atan2(dv[1], dv[0]) - Math.atan2(sv[1], sv[0]);
  const a = s * Math.cos(rot), b = s * Math.sin(rot);
  const shift = [-dv[1] * yaw * yawShift, dv[0] * yaw * yawShift];
  // Map srcA -> dstA (+ shift):  [x', y'] = [a -b; b a][x y] + [e f]
  const e = dstA[0] + shift[0] - (a * srcA[0] - b * srcA[1]);
  const f = dstA[1] + shift[1] - (b * srcA[0] + a * srcA[1]);
  return [a, b, -b, a, e, f];
}

/**
 * The affine transform taking three cutout points onto three face points exactly (both outer eye
 * corners and the chin): scale, face width, tilt and position in one. Returns [a, b, c, d, e, f] for
 * ctx.setTransform. A gentle limit on shear keeps a hairstyle from skewing on a turned head.
 */
export function wigAffine(src, dst) {
  const [[x1, y1], [x2, y2], [x3, y3]] = src;
  const det = x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2);
  if (Math.abs(det) < 1e-9) return wigTransform(src[0], src[2], dst[0], dst[2]);
  const solve = (u1, u2, u3) => [
    (u1 * (y2 - y3) + u2 * (y3 - y1) + u3 * (y1 - y2)) / det,
    (u1 * (x3 - x2) + u2 * (x1 - x3) + u3 * (x2 - x1)) / det,
    (u1 * (x2 * y3 - x3 * y2) + u2 * (x3 * y1 - x1 * y3) + u3 * (x1 * y2 - x2 * y1)) / det,
  ];
  const [a, c, e] = solve(dst[0][0], dst[1][0], dst[2][0]);
  const [b, d, f] = solve(dst[0][1], dst[1][1], dst[2][1]);
  return [a, b, c, d, e, f];
}

export function applyTransform(m, [x, y]) { return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }

// ---- smoothing -----------------------------------------------------------------------------------
/**
 * One Euro filter (Casiez, Roussel & Vogel, CHI 2012): heavy smoothing when a point is still (no
 * jitter), light smoothing when it moves fast (no lag).
 */
export class OneEuro {
  constructor({ minCutoff = 1.2, beta = 0.02, dCutoff = 1.0 } = {}) { Object.assign(this, { minCutoff, beta, dCutoff }); this.x = null; this.dx = 0; this.t = null; }
  static alpha(cutoff, dt) { const tau = 1 / (2 * Math.PI * cutoff); return 1 / (1 + tau / dt); }
  filter(value, tSeconds) {
    if (this.x === null || this.t === null || !(tSeconds > this.t)) { this.x = value; this.t = tSeconds; this.dx = 0; return value; }
    const dt = tSeconds - this.t; this.t = tSeconds;
    const dx = (value - this.x) / dt;
    this.dx += OneEuro.alpha(this.dCutoff, dt) * (dx - this.dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    this.x += OneEuro.alpha(cutoff, dt) * (value - this.x);
    return this.x;
  }
}

/** Smooths a whole landmark set; filters are created on first use. Coordinates are scaled to pixels for the speed term. */
export class LandmarkSmoother {
  constructor(opts = {}, scale = 640) { this.opts = opts; this.scale = scale; this.fx = []; this.fy = []; }
  reset() { this.fx = []; this.fy = []; }
  apply(landmarks, tSeconds) {
    const s = this.scale;
    return landmarks.map((p, i) => {
      if (!this.fx[i]) { this.fx[i] = new OneEuro(this.opts); this.fy[i] = new OneEuro(this.opts); }
      return { x: this.fx[i].filter(p.x * s, tSeconds) / s, y: this.fy[i].filter(p.y * s, tSeconds) / s, z: p.z };
    });
  }
}

// ---- colour --------------------------------------------------------------------------------------
export function hexToRgb(h) {
  const s = String(h).replace('#', ''); const f = s.length === 3 ? [...s].map(c => c + c).join('') : s;
  return [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16));
}
const clamp8 = v => (v < 0 ? 0 : v > 255 ? 255 : v);
/** Rec. 709 luma of 0..255 RGB. */
export const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Photoshop-style blends, per channel, 0..255. */
export const blend = {
  multiply: (b, c) => (b * c) / 255,
  screen: (b, c) => 255 - ((255 - b) * (255 - c)) / 255,
  softLight: (b, c) => { const B = b / 255, C = c / 255; const D = B <= 0.25 ? ((16 * B - 12) * B + 4) * B : Math.sqrt(B); return 255 * (C <= 0.5 ? B - (1 - 2 * C) * B * (1 - B) : B + (2 * C - 1) * (D - B)); },
};

// sRGB <-> CIELAB (D65), small and exact enough for a lip-sized patch per frame.
const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const gam = v => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const fL = t => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
const fI = t => (t * t * t > 216 / 24389 ? t * t * t : (116 * t - 16) / (24389 / 27));
export function rgbToLab(r, g, b) {
  const R = lin(r), G = lin(g), B = lin(b);
  const x = fL((0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047), y = fL(0.2126729 * R + 0.7151522 * G + 0.0721750 * B), z = fL((0.0193339 * R + 0.1191920 * G + 0.9503041 * B) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
function labToLinear(L, a, b) {
  const fy = (L + 16) / 116; const X = 0.95047 * fI(fy + a / 500), Y = fI(fy), Z = 1.08883 * fI(fy - b / 200);
  return [3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z, -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z, 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z];
}
/** Lab to sRGB bytes; out-of-gamut colours keep hue and lightness and lose chroma instead of clipping. */
export function labToRgb(L, a, b) {
  let k = 1; let c = labToLinear(L, a, b);
  for (let i = 0; i < 8 && !c.every(v => v >= -1e-4 && v <= 1.0001); i++) { k *= 0.8; c = labToLinear(L, a * k, b * k); }
  return c.map(v => Math.round(clamp8(gam(Math.max(0, Math.min(1, v))))));
}

/**
 * Lipstick on one pixel, keeping the lip's own light and texture. Worked in CIELAB:
 *  - Lightness: the lip's mean lightness (`meanL`) moves part of the way toward the lipstick's, and
 *    each pixel keeps its own offset from that mean, so lip lines, the lit lower lip and the shaded
 *    corners all survive, and a red on a deep lip reads as a deep red, not a sticker.
 *  - Colour (a, b): the lipstick's hue and chroma, eased down where the result is darker than the
 *    lipstick so dark lips do not glow.
 *  - creme: as above.  matte: texture and shine flattened.  gloss: sheerer, with the pixel's own
 *    highlights pushed into shine.
 * `amount` is the mask strength 0..1 (feathered edges), `opacity` the product's coverage.
 */
export function tintPixel(r, g, b, shade, meanL, finish = 'creme', amount = 1, opacity = 0.85) {
  if (amount <= 0) return [r, g, b];
  const [Lp] = rgbToLab(r, g, b);
  const [Ls, as, bs] = rgbToLab(shade[0], shade[1], shade[2]);
  // Depth: the lip's own lightness anchors the result. A lipstick only moves it part of the way, and
  // less so when the shade is lighter than the lip (a pigment on a deep lip does not glow).
  const lighter = Ls > meanL;
  const toward = (finish === 'gloss' ? 0.55 : finish === 'matte' ? 0.85 : 0.75) * (lighter ? 0.6 : 1);
  // Texture gain: each pixel keeps (and slightly strengthens) its offset from the lip's mean, so
  // lip lines, the lit lower lip and the shaded corners survive under the colour.
  const gain = finish === 'matte' ? 0.7 : finish === 'gloss' ? 1.2 : 1.05;
  const base = meanL + (Ls - meanL) * toward - (finish === 'gloss' ? 0 : 2); // pigment absorbs a little light
  const off = Lp - meanL;
  // Shadows deepen fully; lit areas brighten less, since pigment absorbs light (no orange glow).
  let L = base + (off < 0 ? off * gain : off * gain * (finish === 'gloss' ? 1 : 0.35));
  if (finish === 'gloss') L += Math.max(0, Lp - meanL - 12) * 1.5; // highlights become shine
  if (finish === 'matte') L = Math.min(L, base + 6);
  L = Math.max(2, Math.min(96, L));
  // Chroma follows depth: darker result, proportionally less chroma, and never more than a real
  // pigment can show at that lightness, so a red reads as deep red rather than neon.
  const C = Math.hypot(as, bs);
  const ck = Math.min(1, ((L + 6) / (Ls + 6)) ** 1.15, C > 0 ? (1.25 * L + 10) / C : 1);
  const glossFade = finish === 'gloss' ? Math.max(0.55, 1 - Math.max(0, Lp - meanL - 12) / 30) : 1;
  const out = labToRgb(L, as * ck * glossFade, bs * ck * glossFade);
  const cover = Math.max(0, Math.min(1, amount * (finish === 'gloss' ? opacity * 0.85 : opacity)));
  return [clamp8(r + (out[0] - r) * cover), clamp8(g + (out[1] - g) * cover), clamp8(b + (out[2] - b) * cover)];
}

/** Brow tint on one pixel: darkens toward the tint by multiply, strongest on the darker (hair) pixels. */
export function browPixel(r, g, b, tint, amount = 1, opacity = 0.5) {
  if (amount <= 0) return [r, g, b];
  const y = luma(r, g, b) / 255;
  const hairWeight = 0.55 + 0.45 * (1 - y); // more on hair than on the skin between hairs
  const t = amount * opacity * hairWeight;
  return [r, g, b].map((v, i) => clamp8(v + (blend.multiply(v, tint[i]) - v) * t));
}

/** Mean CIELAB lightness over the pixels the mask covers (mask alpha > half), for tintPixel. */
export function maskedMeanL(data, mask, n) {
  let s = 0, k = 0;
  for (let i = 0; i < n; i += 1) { if (mask[i * 4 + 3] > 127) { s += rgbToLab(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])[0]; k++; } }
  return k ? s / k : 50;
}
