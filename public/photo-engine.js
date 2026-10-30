/**
 * MIRRR photo engine: makeup and hair colour on the user's own photo, entirely in the browser.
 *
 * Everything works on plain { width, height, data } pixel buffers (an ImageData or the same shape),
 * so the same code runs in the page and in Node tests. No library, no model download, no upload.
 *
 * How it keeps the photo real:
 *  - Colour is worked in CIELAB (D65), so a red stays red on deep skin instead of drifting to maroon
 *    the way an RGB multiply does, and out-of-gamut colours are brought back by lowering chroma
 *    (keeping hue and lightness) instead of clipping channels.
 *  - Each change is made on a low-frequency copy of the lightness and the photo's own detail
 *    (pores, lip lines, grain) is added back on top, so texture survives.
 *  - New colour is shaded by the photo's own light: a lipstick's lightness follows the lip's
 *    existing shading, so the lower lip stays lit and the corners stay in shadow.
 *  - Every mask is feathered with a gaussian-like blur sized to the face, follows the face found in
 *    the photo (eyes, mouth, skin), and for the lips and hair it is cut by the photo's own colour,
 *    so edges follow the real lip line and hair strands rather than a drawn shape.
 *
 * Face finding is a geometric and colour method (skin model, the eye pair inside the skin, the lip
 * band below them). It wants a front-facing photo with the face reasonably large; when it cannot find
 * a face it says so instead of painting in the wrong place.
 */

// ---- colour: sRGB <-> CIELAB (D65) ----------------------------------------------------------------
const TO_LIN = new Float32Array(256);
for (let i = 0; i < 256; i++) { const v = i / 255; TO_LIN[i] = v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }
const LUT_N = 4096;
const TO_8 = new Uint8ClampedArray(LUT_N + 1);
for (let i = 0; i <= LUT_N; i++) { const v = i / LUT_N; TO_8[i] = Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)); }
const XN = 0.95047, ZN = 1.08883, EPS = 216 / 24389, KAPPA = 24389 / 27;
const fLab = t => (t > EPS ? Math.cbrt(t) : (KAPPA * t + 16) / 116);
const fInv = t => { const t3 = t * t * t; return t3 > EPS ? t3 : (116 * t - 16) / KAPPA; };

/** sRGB bytes to [L, a, b]. */
export function rgbToLab(r, g, b) {
  const R = TO_LIN[r], G = TO_LIN[g], B = TO_LIN[b];
  const x = fLab((0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / XN);
  const y = fLab(0.2126729 * R + 0.7151522 * G + 0.0721750 * B);
  const z = fLab((0.0193339 * R + 0.1191920 * G + 0.9503041 * B) / ZN);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

function labToLinear(L, a, b) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const X = XN * fInv(fx), Y = fInv(fy), Z = ZN * fInv(fz);
  return [3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z, -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z, 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z];
}
const inGamut = c => c[0] >= -1e-4 && c[0] <= 1.0001 && c[1] >= -1e-4 && c[1] <= 1.0001 && c[2] >= -1e-4 && c[2] <= 1.0001;

/**
 * [L, a, b] to sRGB bytes. Out-of-gamut colours keep their lightness and hue and lose chroma
 * (a short binary search) instead of having channels clipped, which is what shifts hue on deep tones.
 */
export function labToRgb(L, a, b) {
  L = L < 0 ? 0 : L > 100 ? 100 : L;
  let c = labToLinear(L, a, b);
  if (!inGamut(c)) {
    let lo = 0, hi = 1;
    for (let i = 0; i < 7; i++) { const m = (lo + hi) / 2; if (inGamut(labToLinear(L, a * m, b * m))) lo = m; else hi = m; }
    c = labToLinear(L, a * lo, b * lo);
  }
  const q = v => TO_8[Math.round((v < 0 ? 0 : v > 1 ? 1 : v) * LUT_N)];
  return [q(c[0]), q(c[1]), q(c[2])];
}

export function hexToLab(hex) {
  const s = String(hex).replace('#', ''); const f = s.length === 3 ? [...s].map(ch => ch + ch).join('') : s;
  return rgbToLab(parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16));
}

/** Delta E 2000 between two Lab colours (used by tests and by the tone check). */
export function deltaE2000([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180, C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cm = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const ap1 = (1 + G) * a1, ap2 = (1 + G) * a2, Cp1 = Math.hypot(ap1, b1), Cp2 = Math.hypot(ap2, b2);
  const h = (x, y) => { const v = Math.atan2(y, x) / rad; return v < 0 ? v + 360 : v; };
  const hp1 = h(ap1, b1), hp2 = h(ap2, b2), dL = L2 - L1, dC = Cp2 - Cp1;
  let dh = hp2 - hp1; if (Cp1 * Cp2 === 0) dh = 0; else if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin((dh / 2) * rad), Lm = (L1 + L2) / 2, Cpm = (Cp1 + Cp2) / 2;
  let hm = hp1 + hp2; if (Cp1 * Cp2 !== 0) hm = Math.abs(hp1 - hp2) > 180 ? (hp1 + hp2 + (hp1 + hp2 < 360 ? 360 : -360)) / 2 : (hp1 + hp2) / 2;
  const T = 1 - 0.17 * Math.cos((hm - 30) * rad) + 0.24 * Math.cos(2 * hm * rad) + 0.32 * Math.cos((3 * hm + 6) * rad) - 0.2 * Math.cos((4 * hm - 63) * rad);
  const SL = 1 + (0.015 * (Lm - 50) ** 2) / Math.sqrt(20 + (Lm - 50) ** 2), SC = 1 + 0.045 * Cpm, SH = 1 + 0.015 * Cpm * T;
  const RT = -2 * Math.sqrt(Cpm ** 7 / (Cpm ** 7 + 25 ** 7)) * Math.sin(60 * Math.exp(-(((hm - 275) / 25) ** 2)) * rad);
  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
}

// ---- buffers --------------------------------------------------------------------------------------
/** Lab planes for a rectangle of an image. */
export function labPlanes(img, rect = { x: 0, y: 0, w: img.width, h: img.height }) {
  const { x: X, y: Y, w, h } = rect, n = w * h, L = new Float32Array(n), A = new Float32Array(n), B = new Float32Array(n), d = img.data;
  for (let y = 0; y < h; y++) {
    let o = ((Y + y) * img.width + X) * 4, k = y * w;
    for (let x = 0; x < w; x++, o += 4, k++) { const c = rgbToLab(d[o], d[o + 1], d[o + 2]); L[k] = c[0]; A[k] = c[1]; B[k] = c[2]; }
  }
  return { w, h, L, A, B, rect };
}

/** Write Lab planes back, only where they changed, so untouched pixels stay bit-identical. */
export function writeLab(img, P, L0, A0, B0) {
  const { x: X, y: Y } = P.rect, d = img.data;
  for (let y = 0; y < P.h; y++) {
    let o = ((Y + y) * img.width + X) * 4, k = y * P.w;
    for (let x = 0; x < P.w; x++, o += 4, k++) {
      if (Math.abs(P.L[k] - L0[k]) + Math.abs(P.A[k] - A0[k]) + Math.abs(P.B[k] - B0[k]) < 0.05) continue;
      const c = labToRgb(P.L[k], P.A[k], P.B[k]); d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2];
    }
  }
}

/** Separable box blur repeated three times (close to a gaussian), on a float plane. */
export function blur(src, w, h, r, passes = 3) {
  r = Math.max(0, Math.round(r));
  let a = Float32Array.from(src);
  if (r === 0) return a;
  let b = new Float32Array(src.length);
  const line = (inp, out, start, step, len) => {
    const win = 2 * r + 1; let acc = 0;
    for (let i = -r; i <= r; i++) acc += inp[start + Math.min(len - 1, Math.max(0, i)) * step];
    for (let i = 0; i < len; i++) {
      out[start + i * step] = acc / win;
      acc += inp[start + Math.min(len - 1, i + r + 1) * step] - inp[start + Math.max(0, i - r) * step];
    }
  };
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) line(a, b, y * w, 1, w);
    for (let x = 0; x < w; x++) line(b, a, x, w, h);
  }
  return a;
}

const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const median = arr => { const s = Float32Array.from(arr).sort(); return s.length ? s[s.length >> 1] : 0; };
const percentile = (arr, p) => { const s = Float32Array.from(arr).sort(); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };

// ---- face finding -------------------------------------------------------------------------------------
/** Downscale an image buffer (area average) for analysis. */
export function downscale(img, maxSide = 360) {
  const s = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * s)), h = Math.max(1, Math.round(img.height * s));
  const out = new Uint8ClampedArray(w * h * 4), fx = img.width / w, fy = img.height / h;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const x0 = Math.floor(x * fx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * fx)), y0 = Math.floor(y * fy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * fy));
    let r = 0, g = 0, b = 0, n = 0;
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { const o = (yy * img.width + xx) * 4; r += img.data[o]; g += img.data[o + 1]; b += img.data[o + 2]; n++; }
    const o = (y * w + x) * 4; out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = 255;
  }
  return { width: w, height: h, data: out, scale: s };
}

function components(mask, w, h) {
  const lab = new Int32Array(w * h).fill(-1), comps = [], stack = [];
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || lab[i] >= 0) continue;
    const c = { id: comps.length, n: 0, x0: w, x1: 0, y0: h, y1: 0, sx: 0, sy: 0, px: [] };
    lab[i] = c.id; stack.push(i);
    while (stack.length) {
      const j = stack.pop(), x = j % w, y = (j - x) / w;
      c.n++; c.sx += x; c.sy += y; c.px.push(j);
      if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const k = ny * w + nx; if (mask[k] && lab[k] < 0) { lab[k] = c.id; stack.push(k); }
      }
    }
    c.cx = c.sx / c.n; c.cy = c.sy / c.n; comps.push(c);
  }
  return { comps, lab };
}

/**
 * Find the face: skin model, eyes, brows, mouth, and the face frame (origin between the eyes,
 * unit = distance between the eye centres, rotated with the eye line). Coordinates are returned in
 * the original image's pixels. { ok: false, reason } when no face is clear enough to edit.
 */
export function findFace(img) {
  const s = downscale(img, 360), { width: w, height: h } = s, P = labPlanes(s);
  // Skin model from the middle of the frame, where a selfie's face is.
  const seed = [];
  for (let y = Math.round(h * 0.36); y < h * 0.6; y++) for (let x = Math.round(w * 0.36); x < w * 0.64; x++) {
    const k = y * w + x; if (P.L[k] > 8 && P.L[k] < 97) seed.push(k);
  }
  if (seed.length < 50) return { ok: false, reason: 'The photo is too small or too dark to find a face.' };
  const ma = median(seed.map(k => P.A[k])), mb = median(seed.map(k => P.B[k])), mL = median(seed.map(k => P.L[k]));
  const dist = k => Math.hypot(P.A[k] - ma, P.B[k] - mb);
  const mad = median(seed.map(dist));
  const thr = Math.max(5, Math.min(14, 3 * mad + 2.5));
  const chroma = Math.hypot(ma, mb);
  // Only a greyscale photo is rejected here: real skin runs down to C* about 4 at Monk 10, and lower
  // in cool shade, so a higher gate turned away the lightest and the deepest skin.
  if (chroma < 1.5) return { ok: false, reason: 'Could not find skin in the middle of the photo. Use a colour, front-facing photo with your face centred.' };
  const skin = new Uint8Array(w * h);
  for (let k = 0; k < w * h; k++) skin[k] = dist(k) < thr && P.L[k] > mL * 0.3 && P.L[k] < Math.min(99, mL * 1.7 + 12) ? 1 : 0;
  // The skin region holding the centre of the frame.
  const { comps, lab } = components(skin, w, h);
  let face = null, best = Infinity;
  for (const c of comps) {
    if (c.n < w * h * 0.02) continue;
    const dc = Math.hypot(c.cx - w / 2, c.cy - h * 0.48);
    if (dc < best) { best = dc; face = c; }
  }
  if (!face) return { ok: false, reason: 'Could not find a face large enough. Use a closer, front-facing photo.' };
  // Row extents of the face region; holes inside them are the features (eyes, brows, nostrils, mouth).
  const minX = new Int32Array(h).fill(w), maxX = new Int32Array(h).fill(-1);
  for (const j of face.px) { const x = j % w, y = (j - x) / w; if (x < minX[y]) minX[y] = x; if (x > maxX[y]) maxX[y] = x; }
  const holes = new Uint8Array(w * h);
  for (let y = face.y0; y <= face.y1; y++) for (let x = minX[y] + 1; x < maxX[y]; x++) if (lab[y * w + x] !== face.id) holes[y * w + x] = 1;
  const feats = components(holes, w, h).comps.filter(c => c.n >= 4 && c.x0 > face.x0 && c.x1 < face.x1);
  for (const c of feats) {
    let lo = 100, hi = 0, sa = 0;
    for (const j of c.px) { if (P.L[j] < lo) lo = P.L[j]; if (P.L[j] > hi) hi = P.L[j]; sa += P.A[j]; }
    c.contrast = hi - lo; c.minL = lo; c.meanA = sa / c.n; c.cw = c.x1 - c.x0 + 1; c.ch = c.y1 - c.y0 + 1;
  }
  // Eye pair: two features side by side, similar size, in the upper part of the face, most contrast
  // (iris and lashes against the white of the eye).
  const fw = Math.max(...Array.from(maxX).map((v, y) => (v >= 0 ? v - minX[y] : 0)));
  let eyes = null, eyeScore = -Infinity;
  for (let i = 0; i < feats.length; i++) for (let j = i + 1; j < feats.length; j++) {
    let a = feats[i], b = feats[j]; if (a.cx > b.cx) [a, b] = [b, a];
    const dx = b.cx - a.cx, dy = Math.abs(b.cy - a.cy);
    if (dx < fw * 0.2 || dx > fw * 0.7 || dy > dx * 0.25) continue;
    const sizeRatio = Math.min(a.n, b.n) / Math.max(a.n, b.n); if (sizeRatio < 0.25) continue;
    const midY = (a.cy + b.cy) / 2; if (midY > face.y0 + (face.y1 - face.y0) * 0.7) continue;
    const rowMid = (minX[Math.round(midY)] + maxX[Math.round(midY)]) / 2, sym = Math.abs((a.cx + b.cx) / 2 - rowMid) / dx;
    if (sym > 0.25) continue;
    const score = a.contrast + b.contrast + 20 * sizeRatio - 60 * sym - (Math.min(a.minL, b.minL) / Math.max(1, mL)) * 10;
    if (score > eyeScore) { eyeScore = score; eyes = [a, b]; }
  }
  if (!eyes) return { ok: false, reason: 'Could not find both eyes. Use a front-facing photo with both eyes open and visible.' };
  const k = 1 / s.scale;
  const [El, Er] = eyes;
  const E = c => ({ x: c.cx * k, y: c.cy * k, w: c.cw * k, h: c.ch * k, x0: c.x0 * k, x1: (c.x1 + 1) * k, y0: c.y0 * k, y1: (c.y1 + 1) * k });
  const eL = E(El), eR = E(Er);
  const d = Math.hypot(eR.x - eL.x, eR.y - eL.y), ang = Math.atan2(eR.y - eL.y, eR.x - eL.x);
  const frame = { ox: (eL.x + eR.x) / 2, oy: (eL.y + eR.y) / 2, d, cos: Math.cos(ang), sin: Math.sin(ang) };
  const toUV = (x, y) => { const dx = x - frame.ox, dy = y - frame.oy; return [(dx * frame.cos + dy * frame.sin) / d, (-dx * frame.sin + dy * frame.cos) / d]; };
  // Brows: features right above each eye.
  const brows = [El, Er].map(eye => feats.filter(c => c !== El && c !== Er && c.cy < eye.cy && eye.cy - c.cy < (Er.cx - El.cx) * 0.6 && Math.abs(c.cx - eye.cx) < (Er.cx - El.cx) * 0.22 && c.cw >= eye.cw * 0.6)
    .sort((p, q) => q.n - p.n)[0] ?? null).map(c => (c ? E(c) : null));
  // Mouth: the band below the eyes where colour turns from skin toward lip (redder, less yellow).
  const lipScore = j => (P.A[j] - ma) - 0.6 * (P.B[j] - mb) + Math.max(0, mL - P.L[j]) * 0.15;
  const dS = d * s.scale, oxS = frame.ox * s.scale, oyS = frame.oy * s.scale;
  let bestV = 0, bestSum = -Infinity;
  for (let v = 0.75; v <= 1.45; v += 0.02) {
    let sum = 0, n = 0;
    for (let u = -0.32; u <= 0.32; u += 0.04) {
      const x = Math.round(oxS + (u * frame.cos - v * frame.sin) * dS), y = Math.round(oyS + (u * frame.sin + v * frame.cos) * dS);
      if (x < 0 || y < 0 || x >= w || y >= h) continue; sum += lipScore(y * w + x); n++;
    }
    if (n && sum / n > bestSum) { bestSum = sum / n; bestV = v; }
  }
  // Lip extent at that band: walk out from the centre while the lip score stays high.
  const scoresAt = (u, v) => { const x = Math.round(oxS + (u * frame.cos - v * frame.sin) * dS), y = Math.round(oyS + (u * frame.sin + v * frame.cos) * dS); return x < 0 || y < 0 || x >= w || y >= h ? -99 : lipScore(y * w + x); };
  const peak = Math.max(...[-0.05, 0, 0.05].map(u => scoresAt(u, bestV)));
  const cut = Math.max(2, peak * 0.4);
  let uL = 0, uR = 0; while (uL > -0.6 && scoresAt(uL - 0.02, bestV) > cut) uL -= 0.02; while (uR < 0.6 && scoresAt(uR + 0.02, bestV) > cut) uR += 0.02;
  let vT = bestV, vB = bestV; while (vT > bestV - 0.3 && scoresAt(0, vT - 0.02) > cut) vT -= 0.02; while (vB < bestV + 0.3 && scoresAt(0, vB + 0.02) > cut) vB += 0.02;
  const halfW = Math.max(0.22, Math.min(0.5, (uR - uL) / 2)), halfH = Math.max(0.1, Math.min(0.3, (vB - vT) / 2));
  const mouth = { u: (uL + uR) / 2, v: (vT + vB) / 2, rw: halfW, rh: halfH, contrast: peak };
  const eyeUV = [eL, eR].map(e => { const [u, v] = toUV(e.x, e.y); return { u, v, rw: e.w / d / 2, rh: e.h / d / 2 }; });
  const browUV = brows.map((b, i) => { if (!b) return { u: eyeUV[i].u, v: eyeUV[i].v - 0.36, rw: eyeUV[i].rw * 1.3, rh: 0.06 }; const [u, v] = toUV(b.x, b.y); return { u, v, rw: b.w / d / 2, rh: b.h / d / 2 }; });
  return {
    ok: true, width: img.width, height: img.height, frame,
    skin: { L: mL, a: ma, b: mb, thr }, eyes: eyeUV, brows: browUV, mouth,
    faceBox: { x0: face.x0 * k, y0: face.y0 * k, x1: (face.x1 + 1) * k, y1: (face.y1 + 1) * k },
    confidence: Math.max(0, Math.min(1, (eyeScore / 60) * 0.6 + Math.min(1, peak / 10) * 0.4)),
  };
}

// ---- masks in the face frame ---------------------------------------------------------------------
function frameMapper(face, rect) {
  const { ox, oy, d, cos, sin } = face.frame;
  return (k) => { const x = rect.x + (k % rect.w) + 0.5, y = rect.y + Math.floor(k / rect.w) + 0.5, dx = x - ox, dy = y - oy; return [(dx * cos + dy * sin) / d, (-dx * sin + dy * cos) / d]; };
}
/** Pixel rectangle covering a box in face units (u0..u1, v0..v1), clipped to the image. */
function rectFor(face, u0, u1, v0, v1) {
  const { ox, oy, d, cos, sin } = face.frame; const xs = [], ys = [];
  for (const u of [u0, u1]) for (const v of [v0, v1]) { xs.push(ox + (u * cos - v * sin) * d); ys.push(oy + (u * sin + v * cos) * d); }
  const x = Math.max(0, Math.floor(Math.min(...xs))), y = Math.max(0, Math.floor(Math.min(...ys)));
  const X = Math.min(face.width, Math.ceil(Math.max(...xs))), Y = Math.min(face.height, Math.ceil(Math.max(...ys)));
  return { x, y, w: Math.max(1, X - x), h: Math.max(1, Y - y) };
}
const ellipse = (u, v, cu, cv, ru, rv) => ((u - cu) / ru) ** 2 + ((v - cv) / rv) ** 2;

/** Skin likelihood for a pixel, soft at the model's edge so the mask has no hard line. */
function skinAlpha(face, L, A, B) {
  const dd = Math.hypot(A - face.skin.a, B - face.skin.b);
  const byColour = 1 - smooth(face.skin.thr * 0.7, face.skin.thr * 1.5, dd);
  const byLight = smooth(face.skin.L * 0.2, face.skin.L * 0.4, L) * (1 - smooth(Math.min(99, face.skin.L * 1.7 + 10), 100, L));
  return byColour * byLight;
}

/** Openings of the eyes (and brows), which makeup must never cover. */
function eyeOpening(face, u, v, grow = 1) {
  let m = 0;
  for (const e of face.eyes) m = Math.max(m, 1 - smooth(0.75, 1.15, ellipse(u, v, e.u, e.v, e.rw * 1.05 * grow, e.rh * 1.1 * grow)));
  return m;
}


/** Bilinear sample of a plane at face coordinates (u, v). */
function sampler(face, P) {
  const { ox, oy, d, cos, sin } = face.frame, { x: X, y: Y } = P.rect;
  return (plane, u, v) => {
    const x = ox + (u * cos - v * sin) * d - X - 0.5, y = oy + (u * sin + v * cos) * d - Y - 0.5;
    const x0 = Math.max(0, Math.min(P.w - 2, Math.floor(x))), y0 = Math.max(0, Math.min(P.h - 2, Math.floor(y)));
    const fx = Math.max(0, Math.min(1, x - x0)), fy = Math.max(0, Math.min(1, y - y0)), k = y0 * P.w + x0;
    return (plane[k] * (1 - fx) + plane[k + 1] * fx) * (1 - fy) + (plane[k + P.w] * (1 - fx) + plane[k + P.w + 1] * fx) * fy;
  };
}

/**
 * The lips' own outline. Finds the dark line between the lips in each column across the mouth, then
 * walks up and down from it, classing each sample as nearer the lip's colour (measured right by the
 * line) or the skin's (measured above the upper lip and below the lower lip), so the edge is wherever
 * this photo's lip actually ends, on any skin tone. Returns a mask (0..1) over the working rectangle.
 */
export function lipMask(face, P, Llow, uv) {
  const n = P.w * P.h, at = sampler(face, P), mo = face.mouth, d = face.frame.d;
  const Ls = blur(P.L, P.w, P.h, Math.max(1, d * 0.006)), As = blur(P.A, P.w, P.h, Math.max(1, d * 0.006)), Bs = blur(P.B, P.w, P.h, Math.max(1, d * 0.006));
  const step = 0.004, cols = [], N = 90, span = Math.min(0.62, mo.rw * 1.6);
  let wL = 0.6; const dist = (p, q) => Math.hypot((p[0] - q[0]) * wL, p[1] - q[1], p[2] - q[2]);
  const px = (u, v) => [at(Ls, u, v), at(As, u, v), at(Bs, u, v)];
  // Line between the lips: a thin dark valley (darker than just above and below it), which a broad
  // shadow under the lower lip is not. Searched near the centre, then followed column by column.
  const sk = face.skin, lipness = (u, v) => Math.max(-4, (at(As, u, v) - sk.a) - 0.6 * (at(Bs, u, v) - sk.b));
  const valley = (u, v) => at(Ls, u, v) - (at(Ls, u, v - 0.035) + at(Ls, u, v + 0.035)) / 2;
  let vc = mo.v, best = Infinity;
  for (let v = Math.max(0.75, mo.v - 0.25); v <= Math.min(1.55, mo.v + 0.3); v += step) {
    let m = 0; for (let u = -0.1; u <= 0.1; u += 0.02) m += valley(mo.u + u, v) - lipness(mo.u + u, v - 0.04) - lipness(mo.u + u, v + 0.05);
    if (m < best) { best = m; vc = v; }
  }
  const half = []; // [{u, line, up, down, ok}]
  for (const dir of [-1, 1]) {
    let line = vc;
    for (let i = 0; i <= N / 2; i++) {
      const u = mo.u + dir * span * (i / (N / 2));
      let bv = line, bl = Infinity;
      for (let v = line - 0.008; v <= line + 0.008; v += step) { const l = valley(u, v); if (l < bl) { bl = l; bv = v; } }
      line = bv;
      const lipUp = px(u, line - 0.035), lipDn = px(u, line + 0.05);
      const skinUp = px(u, line - Math.max(0.24, mo.rh * 2.2)), skinDn = px(u, line + Math.max(0.3, mo.rh * 2.8));
      // The edge is where the colour stops being lip fastest: the biggest rise in distance from
      // the lip's own colour along the walk, mildly preferring a usual lip thickness.
      const edgeAt = (sign, lip, t0, max, skinRef) => {
        const g = []; for (let t = 0; t <= max + 3 * step; t += step) g.push(dist(px(u, line + sign * t), lip));
        // Halfway from the lip's colour to the skin's: where a soft lip edge stops reading as lip.
        const half = dist(skinRef, lip) * 0.5; let cross = Infinity;
        for (let i = Math.ceil(0.025 / step); i < g.length - 1; i++) if (g[i] > half && g[i + 1] > half) { cross = i * step; break; }
        let bt = t0, bs = -Infinity;
        for (let i = 4; i < g.length - 3; i++) {
          const t = i * step; if (t < 0.025 || t > max) continue;
          const rise = (g[i + 2] + g[i + 3]) / 2 - (g[i - 2] + g[i - 3]) / 2;
          const sc = rise * (0.6 + 0.4 * Math.exp(-(((t - t0) / 0.07) ** 2)));
          if (sc > bs) { bs = sc; bt = t; }
        }
        return cross >= bt * 0.8 ? Math.min(bt, cross) : bt;
      };
      const contrast = Math.min(dist(lipUp, skinUp), dist(lipDn, skinDn));
      // The lower lip catches the light (a bright band), so its edge is judged mostly by colour, not lightness.
      wL = 0.6; const up = edgeAt(-1, lipUp, 0.09, 0.2, skinUp);
      wL = face.skin.L < 45 ? 0.6 : 0.25; const down = edgeAt(1, lipDn, 0.13, 0.26, skinDn); wL = 0.6;
      half.push({ u, line, up, down, contrast, i, dir });
    }
  }
  // Order columns left to right, smooth the outline, and end the lips where they thin out.
  const colsAll = half.filter((c, k) => !(c.i === 0 && c.dir === 1)).sort((p, q) => p.u - q.u);
  const med = (arr, k, key) => { const w = arr.slice(Math.max(0, k - 4), k + 5).map(c => c[key]).sort((a, b) => a - b); return w[w.length >> 1]; };
  for (const key of ['up', 'down', 'line']) { const m = colsAll.map((_, k) => med(colsAll, k, key)); colsAll.forEach((c, k) => { c[key + 'S'] = m[k]; }); }
  for (const key of ['upS', 'downS', 'lineS']) { const m = colsAll.map((_, k) => { const w = colsAll.slice(Math.max(0, k - 2), k + 3); return w.reduce((a, c) => a + c[key], 0) / w.length; }); colsAll.forEach((c, k) => { c[key] = m[k]; }); }
  const ci = colsAll.findIndex(c => c.i === 0), refC = Math.max(4, colsAll[ci].contrast);
  const mid = colsAll.slice(Math.max(0, ci - 8), ci + 9), mUp = mid.map(c => c.upS).sort((a, b) => a - b)[mid.length >> 1], mDn = mid.map(c => c.downS).sort((a, b) => a - b)[mid.length >> 1];
  for (const c of colsAll) { c.upS = Math.min(c.upS, mUp * 1.25); c.downS = Math.min(c.downS, mDn * 1.25); }
  let l = ci, r = ci;
  const alive = c => c.contrast > refC * 0.3 && c.upS + c.downS > 0.035;
  while (l > 0 && alive(colsAll[l - 1])) l--;
  while (r < colsAll.length - 1 && alive(colsAll[r + 1])) r++;
  cols.push(...colsAll.slice(l, r + 1));
  // No holes: a column can't be much thinner than the lip's own profile there (elliptical taper).
  const cu = (cols[0].u + cols[cols.length - 1].u) / 2, hw = Math.max(1e-3, (cols[cols.length - 1].u - cols[0].u) / 2);
  for (const c of cols) { const e = Math.sqrt(Math.max(0, 1 - ((c.u - cu) / hw) ** 2)); c.upS = Math.max(c.upS, mUp * 0.6 * e); c.downS = Math.max(c.downS, mDn * 0.65 * e); }
  const u0 = cols[0].u, u1 = cols[cols.length - 1].u, du = (u1 - u0) / Math.max(1, cols.length - 1), edge = 1.2 / d;
  const m = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    const u = uv[2 * k], v = uv[2 * k + 1];
    if (u < u0 - 0.02 || u > u1 + 0.02) continue;
    const f = Math.max(0, Math.min(cols.length - 1.001, (u - u0) / du)), i = Math.floor(f), t = f - i, A = cols[i], B = cols[Math.min(cols.length - 1, i + 1)];
    // Lips thin to a point at the corners.
    const ecc = Math.sqrt(Math.max(0, 1 - ((u - (u0 + u1) / 2) / ((u1 - u0) / 2 + 1e-3)) ** 2)), taper = Math.min(1, 0.15 + ecc * 2.2);
    const line = A.lineS * (1 - t) + B.lineS * t, up = (A.upS * (1 - t) + B.upS * t) * taper, dn = (A.downS * (1 - t) + B.downS * t) * taper;
    if (v < line - up - 0.02 || v > line + dn + 0.02) continue;
    const inside = Math.min(smooth(-edge, edge, v - (line - up)), smooth(-edge, edge, (line + dn) - v));
    const ends = Math.min(smooth(u0 - edge, u0 + 0.03, u), smooth(u1 + edge, u1 - 0.03, u));
    m[k] = inside * ends;
  }
  return m;
}

// ---- the edits ------------------------------------------------------------------------------------
/**
 * A look's palette, as the server describes it (src/photo/palette.js):
 * { lip, lipFinish: 'matte'|'satin'|'gloss'|'shine', lipSheer, lid: [hex...], liner, linerStyle,
 *   blush, highlight, baseFinish: 'matte'|'satin'|'luminous', intensity 0..1 }
 * strength 0..1 is the user's slider; finish is the chip: natural | soft | bold | luminous.
 */
export function applyLook(img, face, palette, { strength = 0.7, finish = 'natural' } = {}) {
  if (!face?.ok) return { changed: 0 };
  const scale = { natural: 0.85, soft: 0.6, bold: 1.15, luminous: 0.85 }[finish] ?? 0.85;
  const s = Math.max(0, Math.min(1.2, strength * scale)) * (0.75 + 0.25 * (palette.intensity ?? 0.6));
  const d = face.frame.d;
  // One working rectangle around the face; all layers are worked in Lab on it.
  const rect = rectFor(face, -1.45, 1.45, -1.05, 2.0);
  const P = labPlanes(img, rect), n = P.w * P.h;
  const L0 = Float32Array.from(P.L), A0 = Float32Array.from(P.A), B0 = Float32Array.from(P.B);
  const uv = new Float32Array(n * 2), map = frameMapper(face, rect);
  for (let k = 0; k < n; k++) { const [u, v] = map(k); uv[2 * k] = u; uv[2 * k + 1] = v; }
  // Detail split: the photo's own texture lives in L - Llow and is added back after each change.
  const Llow = blur(P.L, P.w, P.h, Math.max(1, d * 0.035));
  const skin = new Float32Array(n);
  for (let k = 0; k < n; k++) skin[k] = skinAlpha(face, P.L[k], P.A[k], P.B[k]);
  const skinSoft = blur(skin, P.w, P.h, Math.max(1, d * 0.02));
  const feather = (m, r) => blur(m, P.w, P.h, Math.max(1, d * r));
  // Colour layers move the low-pass chroma and add the photo's own chroma detail back, the same way
  // lightness detail is kept, so freckles, lip lines and pigment variation still show through.
  const lowAB = () => [blur(P.A, P.w, P.h, Math.max(1, d * 0.02)), blur(P.B, P.w, P.h, Math.max(1, d * 0.02))];
  // Deeper skin needs more pigment for the same visible result, as with real products.
  const deepBoost = 1 + 0.6 * smooth(0, 1, (58 - face.skin.L) / 30);

  // 1. Base: even out blotchy colour (redness, sallowness) in the skin, keep the light and pores.
  {
    const m = new Float32Array(n), mo = face.mouth;
    for (let k = 0; k < n; k++) {
      const u = uv[2 * k], v = uv[2 * k + 1];
      const inFace = 1 - smooth(0.85, 1.2, ellipse(u, v, 0, 0.45, 1.05, 1.25));
      const lips = 1 - smooth(0.8, 1.3, ellipse(u, v, mo.u, mo.v, mo.rw * 1.15, mo.rh * 1.3));
      const brows = Math.max(...face.brows.map(b => 1 - smooth(0.7, 1.3, ellipse(u, v, b.u, b.v, b.rw * 1.15, Math.max(b.rh, 0.05) * 1.5))));
      m[k] = inFace * skinSoft[k] * (1 - lips) * (1 - eyeOpening(face, u, v, 1.4)) * (1 - brows);
    }
    const M = feather(m, 0.03);
    // Evening works on the blotch band only (between about 3% and 18% of the eye spacing): freckles,
    // moles and pores sit below that scale, so their colour and contrast are the person's own afterwards.
    const Abig = blur(P.A, P.w, P.h, d * 0.18), Bbig = blur(P.B, P.w, P.h, d * 0.18);
    const Amid = blur(P.A, P.w, P.h, Math.max(1, d * 0.03)), Bmid = blur(P.B, P.w, P.h, Math.max(1, d * 0.03));
    const Lmid = blur(P.L, P.w, P.h, Math.max(1, d * 0.008));
    const even = 0.55 * s;
    const matte = palette.baseFinish === 'matte' ? 0.35 : palette.baseFinish === 'luminous' || finish === 'luminous' ? -0.25 : 0.1;
    for (let k = 0; k < n; k++) {
      const a = M[k] * even; if (a < 0.002) continue;
      P.A[k] += (Abig[k] - Amid[k]) * a; P.B[k] += (Bbig[k] - Bmid[k]) * a;
      // Matte calms the broad shine only; the pore-scale grain (L - Lmid) is never touched.
      const shine = Lmid[k] - Llow[k];
      if (shine > 0) P.L[k] -= shine * matte * M[k] * s;
    }
  }

  // 2. Blush: soft colour on the apples of the cheeks, shaded by the photo's light.
  if (palette.blush) {
    const T = hexToLab(palette.blush), m = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const u = uv[2 * k], v = uv[2 * k + 1];
      let g = 0;
      for (const sx of [-1, 1]) { const du = u - sx * 0.6, dv = v - 0.62; const ru = du * Math.cos(0.35 * sx) + dv * Math.sin(0.35 * sx), rv = -du * Math.sin(0.35 * sx) + dv * Math.cos(0.35 * sx); g = Math.max(g, Math.exp(-((ru / 0.27) ** 2 + (rv / 0.16) ** 2) * 1.6)); }
      m[k] = g * skinSoft[k] * (1 - eyeOpening(face, u, v, 1.6));
    }
    const a0 = Math.min(0.45, 0.32 * s * Math.min(1.4, deepBoost)), [Al, Bl] = lowAB();
    for (let k = 0; k < n; k++) {
      const a = m[k] * a0; if (a < 0.002) continue;
      const shade = Math.min(1.15, Math.max(0.5, Llow[k] / face.skin.L));
      P.A[k] += (T[1] * shade - Al[k]) * a; P.B[k] += (T[2] * shade - Bl[k]) * a;
      P.L[k] += (Math.min(T[0], Llow[k] + 6) - Llow[k]) * a * 0.25;
    }
  }

  // 3. Highlight: lift on the cheekbones and down the nose, as light catching, not paint.
  if (palette.highlight) {
    // Highlighter is extra sheen where the face already catches light: the photo's own shine is
    // strengthened (its own pores and grain stay in it) and the high points lift and take the
    // product's tint. Where the face is in shadow it catches less, as a real highlighter does.
    const T = hexToLab(palette.highlight), amt = (finish === 'luminous' ? 1.0 : 0.75) * s, [Al, Bl] = lowAB();
    const Lsheen = blur(P.L, P.w, P.h, Math.max(1, d * 0.01));
    for (let k = 0; k < n; k++) {
      const u = uv[2 * k], v = uv[2 * k + 1];
      let g = 0;
      for (const sx of [-1, 1]) { const du = u - sx * 0.6, dv = v - 0.36; const ru = du * Math.cos(0.3 * sx) + dv * Math.sin(0.3 * sx), rv = -du * Math.sin(0.3 * sx) + dv * Math.cos(0.3 * sx); g = Math.max(g, Math.exp(-((ru / 0.22) ** 2 + (rv / 0.075) ** 2) * 1.4)); }
      g = Math.max(g, Math.exp(-((u / 0.045) ** 2 + ((v - 0.42) / 0.2) ** 2) * 1.4) * 0.75);
      const lit = 0.55 + 0.45 * smooth(0.85, 1.15, Llow[k] / face.skin.L);
      const a = g * skinSoft[k] * amt * lit * (1 - eyeOpening(face, u, v, 1.5)); if (a < 0.002) continue;
      const room = 100 - Llow[k], sheen = Lsheen[k] - Llow[k];
      P.L[k] += a * (14 + 0.1 * room) + (sheen > 0 ? sheen * 0.8 * a : 0);
      P.A[k] += (T[1] * 0.6 - Al[k]) * a * 0.3; P.B[k] += (T[2] * 0.6 - Bl[k]) * a * 0.3;
    }
  }

  // 4. Eyeshadow: on the lid between lash line and brow, inner to outer through the look's shades.
  if (palette.lid?.length) {
    const T = palette.lid.map(hexToLab), m = new Float32Array(n), t = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const u = uv[2 * k], v = uv[2 * k + 1];
      let best = 0, tt = 0;
      face.eyes.forEach((e, i) => {
        const side = i === 0 ? -1 : 1, b = face.brows[i];
        // Lid and crease: from the lash line up to just past the crease (a little over half way to the
        // brow), fading out above it, so the brow bone keeps the person's own skin.
        const lash = e.v - e.rh * 0.2, browLow = b.v + Math.max(b.rh, 0.05) * 0.8;
        const top = lash - Math.max(0.07, (lash - browLow) * 0.6), cv = (lash + top) / 2;
        const rv = Math.max(0.05, (lash - top) / 2 + 0.02), ru = e.rw * 1.35;
        const g = 1 - smooth(0.55, 1.2, ellipse(u, v, e.u + side * e.rw * 0.15, cv, rv > 0 ? ru : ru, rv));
        const nearLash = 0.35 + 0.65 * smooth(top - 0.01, lash - 0.03, v);
        const val = g * nearLash;
        if (val > best) { best = val; tt = Math.min(1, Math.max(0, ((u - e.u) * side + ru) / (2 * ru))); }
      });
      // Brows keep their own hair colour: shadow stops under them.
      const brow = Math.max(...face.brows.map(b => 1 - smooth(0.8, 1.25, ellipse(u, v, b.u, b.v, b.rw * 1.1, Math.max(b.rh, 0.05) * 1.3))));
      m[k] = best * (1 - eyeOpening(face, u, v, 1.0)) * (1 - brow); t[k] = tt;
    }
    const M = feather(m, 0.025), a0 = Math.min(0.95, 1.2 * s * Math.min(1.3, deepBoost)), [Al, Bl] = lowAB();
    for (let k = 0; k < n; k++) {
      const a = M[k] * a0; if (a < 0.002) continue;
      const pos = t[k] * (T.length - 1), i0 = Math.floor(pos), i1 = Math.min(T.length - 1, i0 + 1), f = pos - i0;
      const c = [0, 1, 2].map(j => T[i0][j] * (1 - f) + T[i1][j] * f);
      const shade = Math.min(1.1, Math.max(0.45, Llow[k] / face.skin.L));
      const det = P.L[k] - Llow[k];
      const Lt = c[0] * shade;
      P.L[k] = Llow[k] + (Lt - Llow[k]) * a + det;
      P.A[k] += (c[1] * Math.min(1, shade) - Al[k]) * a; P.B[k] += (c[2] * Math.min(1, shade) - Bl[k]) * a;
    }
  }

  // 5. Liner: along the upper lash line, thin, with a wing when the look has one.
  if (palette.liner) {
    const T = hexToLab(palette.liner), m = new Float32Array(n), wing = /wing|cat|graphic/.test(palette.linerStyle ?? '') ? 1 : 0;
    const smudge = /smudge|kohl/.test(palette.linerStyle ?? '');
    // Deep skin gives a black line less contrast, so the line is drawn a little bolder, as artists do.
    const deepness = smooth(0, 1, (58 - face.skin.L) / 30);
    const th = (palette.linerStyle === 'thin' ? 0.011 : smudge ? 0.03 : 0.015) * (1 + 0.4 * deepness);
    // Both eyes are the same size: use their mean width, never less than a typical eye.
    const rwL = Math.max(0.17, (face.eyes[0].rw + face.eyes[1].rw) / 2);
    // A drawn line has a crisp edge; only kohl is smudged. Thin at the inner corner, fuller outside.
    const profile = dist => (smudge ? Math.exp(-dist * dist * 2) : 1 - smooth(0.65, 1.05, dist));
    // The photo's own upper lash line: in each column across the eye, the darkest row near the eye's
    // top edge (lash roots are the darkest band there on every skin tone), smoothed along the eye.
    const at = sampler(face, P), Ls = blur(P.L, P.w, P.h, Math.max(1, d * 0.005)), NC = 41;
    const lash = face.eyes.map(e => {
      const rows = [];
      for (let i = 0; i < NC; i++) {
        const du = -1.05 + 2.1 * i / (NC - 1), pred = e.v - e.rh * Math.sqrt(Math.max(0, 1 - Math.min(1, du * du))) * 0.95;
        let bv = pred, bl = Infinity;
        for (let v = pred - 0.04; v <= pred + 0.05; v += 0.003) { const l = at(Ls, e.u + du * Math.max(0.17, (face.eyes[0].rw + face.eyes[1].rw) / 2), v); if (l < bl) { bl = l; bv = v; } }
        rows.push(bv);
      }
      return rows.map((_, i) => { const w = rows.slice(Math.max(0, i - 3), i + 4).sort((a, b) => a - b); return w[w.length >> 1]; });
    });
    const lashAt = (i, du) => { const f = Math.max(0, Math.min(NC - 1.001, (du + 1.05) / 2.1 * (NC - 1))), j = Math.floor(f), t = f - j; return lash[i][j] * (1 - t) + lash[i][j + 1] * t; };
    for (let k = 0; k < n; k++) {
      const u = uv[2 * k], v = uv[2 * k + 1];
      let g = 0;
      face.eyes.forEach((e, i) => {
        const side = i === 0 ? -1 : 1, du = (u - e.u) / rwL;
        if (Math.abs(du) <= 1.05) {
          const lashV = lashAt(i, du);
          const thk = th * (0.55 + 0.45 * Math.min(1, Math.max(0, (du * side + 1) / 2)));
          const dist = Math.abs(v - (lashV - thk * 0.35)) / thk;
          g = Math.max(g, profile(dist) * smooth(1.08, 0.75, Math.abs(du)));
        }
        if (wing) {
          const x0 = e.u + side * rwL, y0 = lashAt(i, side * 1.0) - th * 0.2, len = rwL * 0.7, wx = (u - x0) * side;
          if (wx >= 0 && wx <= len) { const vy = y0 - wx * 0.45, w2 = th * 1.15 * (1 - wx / len) + 0.003; const dist = Math.abs(v - vy) / w2; g = Math.max(g, profile(dist)); }
        }
      });
      m[k] = g;
    }
    const M = feather(m, 0.003), a0 = Math.min(1, 0.65 + 0.6 * s);
    for (let k = 0; k < n; k++) {
      const a = M[k] * a0; if (a < 0.002) continue;
      const det = P.L[k] - Llow[k];
      P.L[k] += (Math.min(P.L[k], T[0] + 2 + det * (det < 0 ? 0.2 : 0.1)) - P.L[k]) * a;
      P.A[k] += (T[1] - P.A[k]) * a; P.B[k] += (T[2] - P.B[k]) * a;
    }
  }

  // 6. Lips: the photo's own lip outline, traced column by column from the line between the lips
  // (each sample is classed as nearer the lip's colour or the skin's), then coloured with the lip's
  // own light, texture and lip lines kept, gloss as a lift of the lip's existing highlights.
  if (palette.lip) {
    const T = hexToLab(palette.lip), M0 = lipMask(face, P, Llow, uv), CT = Math.hypot(T[1], T[2]), hT = Math.atan2(T[2], T[1]);
    // The traced outline is used as is (its own edge is ~1.5 px wide), so the edge stays as crisp as a
    // lipstick edge; no extra blur that would read as a soft halo.
    const M = M0;
    let sw = 0, sL = 0; for (let k = 0; k < n; k++) { sw += M[k]; sL += M[k] * Llow[k]; }
    const lipL = sw > 0 ? sL / sw : face.skin.L;
    const sheer = palette.lipSheer ? 0.55 : 0.92;
    const gloss = palette.lipFinish === 'gloss' ? 1.6 : palette.lipFinish === 'shine' ? 2.2 : palette.lipFinish === 'satin' ? 1.0 : 0.7;
    const a0 = Math.min(1, sheer * (0.75 + 0.3 * s)), [Al, Bl] = lowAB();
    // Dark lips: a lighter shade shows less lift and less of a lit hot spot than on pale lips.
    const lipDeep = smooth(0, 1, (45 - lipL) / 25), cover = 0.8 - 0.3 * lipDeep, roll = 0.7 * (1 - 0.5 * lipDeep);
    for (let k = 0; k < n; k++) {
      const a = M[k] * a0; if (a < 0.002) continue;
      const light = Math.min(1.45, Math.max(0.45, Llow[k] / lipL));
      const det = P.L[k] - Llow[k];
      // Shadows follow the lip's own shading; highlights roll off gently so pale shades on deep lips
      // don't turn chalky or white where the lip catches light.
      let Lt = Math.min(98, T[0] * (light <= 1 ? light ** 1.4 : 1 + (light ** 0.9 - 1) * roll));
      // A shade lighter than the lip never fully covers it: some of the lip's own depth shows through.
      if (Lt > Llow[k]) Lt = Llow[k] + (Lt - Llow[k]) * cover;
      P.L[k] = Llow[k] + (Lt - Llow[k]) * a + (det > 0 ? Math.min(det * (1.1 + (gloss - 1) * a), det + 8) : det * 1.1);
      // Lit areas lose a little chroma (light reflecting off the surface), shadows keep it, so the
      // lower lip reads lit red, not orange. Hue moves along the shortest way round (no detour via brown).
      const cs = light <= 1 ? Math.max(0.55, light) : Math.max(0.75, 1 / Math.sqrt(light));
      const C0 = Math.hypot(Al[k], Bl[k]), h0 = Math.atan2(Bl[k], Al[k]);
      let dh = hT - h0; if (dh > Math.PI) dh -= 2 * Math.PI; if (dh < -Math.PI) dh += 2 * Math.PI;
      // The colour is worked out at full coverage, then blended in by the outline's alpha in a/b, so the
      // edge fades straight from lip to lipstick with no rainbow fringe through other hues.
      const h = h0 + dh * Math.min(1, a0 * 1.25), C = C0 + (CT * cs - C0) * a0, keep = 1 - 0.35 * a, m = M[k];
      P.A[k] = Al[k] + (C * Math.cos(h) - Al[k]) * m + (P.A[k] - Al[k]) * keep; P.B[k] = Bl[k] + (C * Math.sin(h) - Bl[k]) * m + (P.B[k] - Bl[k]) * keep;
    }
  }

  let changed = 0;
  for (let k = 0; k < n; k++) if (Math.abs(P.L[k] - L0[k]) + Math.abs(P.A[k] - A0[k]) + Math.abs(P.B[k] - B0[k]) >= 0.05) changed++;
  writeLab(img, P, L0, A0, B0);
  return { changed, rect };
}

/**
 * Hair colour: a hair mask grown from above the brows, cut by colour against the background and
 * the skin, then refined with a guided filter on the photo's lightness so the edge follows strands.
 * The new colour keeps the hair's own light and shine; dark hair holds less chroma, as dye does.
 */
export function recolourHair(img, face, hex, { strength = 0.7 } = {}) {
  if (!face?.ok) return { changed: 0 };
  const d = face.frame.d, rect = rectFor(face, -2.1, 2.1, -2.1, 1.6), P = labPlanes(img, rect), n = P.w * P.h;
  const L0 = Float32Array.from(P.L), A0 = Float32Array.from(P.A), B0 = Float32Array.from(P.B);
  const map = frameMapper(face, rect);
  // Background from the top corners of the working area.
  const bg = []; const cw = Math.max(2, Math.round(P.w * 0.08)), chh = Math.max(2, Math.round(P.h * 0.08));
  for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) { bg.push(y * P.w + x); bg.push(y * P.w + P.w - 1 - x); }
  const bL = median(bg.map(k => P.L[k])), bA = median(bg.map(k => P.A[k])), bB = median(bg.map(k => P.B[k]));
  const hard = new Uint8Array(n);
  for (let k = 0; k < n; k++) {
    const [u, v] = map(k);
    if (v > 1.25 || Math.abs(u) > 1.9) continue;
    const dSkin = Math.hypot(P.A[k] - face.skin.a, P.B[k] - face.skin.b);
    const inOval = ellipse(u, v, 0, 0.35, 1.05, 1.3) < 1.2;
    // Pale or shiny skin near the hairline is still skin: close to the skin's colour and not darker.
    const isSkin = (inOval && skinAlpha(face, P.L[k], P.A[k], P.B[k]) > 0.5) || (dSkin < face.skin.thr * 2.2 && P.L[k] > face.skin.L * 0.8);
    const isBg = Math.hypot(P.L[k] - bL, (P.A[k] - bA) * 2, (P.B[k] - bB) * 2) < 9;
    if (!isSkin && !isBg && eyeOpening(face, u, v, 1.3) < 0.5 && ellipse(u, v, 0, 0.9, 0.55, 0.45) > 1) hard[k] = 1;
  }
  // Keep the part connected to the crown (the region straight above the brows).
  const { comps, lab } = components(hard, P.w, P.h);
  const keep = new Set();
  for (const c of comps) {
    const [u, v] = map(Math.round(c.cy) * P.w + Math.round(c.cx));
    if (c.n > n * 0.004 && (c.y0 < P.h * 0.35 || v < -0.6) && Math.abs(u) < 1.9) keep.add(c.id);
  }
  const p = new Float32Array(n); for (let k = 0; k < n; k++) p[k] = keep.has(lab[k]) ? 1 : 0;
  // Guided filter (He et al.) with the lightness as guide: alpha follows strands and soft edges.
  const r = Math.max(2, Math.round(d * 0.03)), eps = 0.0025;
  const I = new Float32Array(n); for (let k = 0; k < n; k++) I[k] = P.L[k] / 100;
  const mI = blur(I, P.w, P.h, r, 1), mp = blur(p, P.w, P.h, r, 1);
  const Ip = new Float32Array(n), II = new Float32Array(n); for (let k = 0; k < n; k++) { Ip[k] = I[k] * p[k]; II[k] = I[k] * I[k]; }
  const mIp = blur(Ip, P.w, P.h, r, 1), mII = blur(II, P.w, P.h, r, 1);
  const ca = new Float32Array(n), cb = new Float32Array(n);
  for (let k = 0; k < n; k++) { const v = mII[k] - mI[k] * mI[k]; ca[k] = (mIp[k] - mI[k] * mp[k]) / (v + eps); cb[k] = mp[k] - ca[k] * mI[k]; }
  const ma = blur(ca, P.w, P.h, r, 1), mb = blur(cb, P.w, P.h, r, 1);
  const T = hexToLab(hex), Llow = blur(P.L, P.w, P.h, Math.max(1, d * 0.03));
  let hairL = 0, hw = 0; for (let k = 0; k < n; k++) if (p[k]) { hairL += Llow[k]; hw++; }
  hairL = hw ? hairL / hw : 20;
  const lift = Math.max(-30, Math.min(35, T[0] - hairL));
  const s = Math.max(0, Math.min(1, strength));
  // The dyed colour is worked out once for the hair as a whole. Dark hair lifted only part of the way
  // shows warm underlying pigment (brassy, not olive): the shortfall turns the hue toward orange-brown.
  const LtHair = Math.max(2, Math.min(95, hairL + lift * 0.75));
  const short = Math.max(0, Math.min(1, (T[0] - LtHair - 6) / 30));
  const hold = Math.min(1, Math.max(0.25, LtHair / Math.max(20, T[0]))) * (1 - 0.35 * short);
  const hT = Math.atan2(T[2], T[1]), warm = 55 * Math.PI / 180, hue = hT + (warm - hT) * short * 0.8;
  const C = Math.hypot(T[1], T[2]) * hold, tA = C * Math.cos(hue), tB = C * Math.sin(hue);
  for (let k = 0; k < n; k++) {
    let alpha = Math.max(0, Math.min(1, ma[k] * I[k] + mb[k]));
    // Where a pixel is much brighter than the hair it is mostly skin or sky between strands: dye only the strand share.
    alpha *= Math.max(0, Math.min(1, 1 - (Llow[k] - (hairL + 18)) / 22));
    const a = alpha * s; if (a < 0.01) continue;
    // Dye changes how much light each strand reflects, so it scales the hair's own lightness pixel by
    // pixel (L* follows reflectance to the 1/3 power, so a reflectance ratio is close to an L* ratio):
    // lit coil tops lift most, the gaps between coils stay deep, and the strand pattern is the
    // person's own at every scale. Chroma follows the new lightness, so shadows hold less colour.
    // Pixels much lighter than the hair are mostly skin or background seen between strands at the
    // hairline: they take only a share of the dye and never more than the hair's own lift.
    const edge = 1 - smooth(hairL + 10, hairL + 32, Llow[k]), ae = a * edge;
    const ratio = LtHair / Math.max(4, hairL), r = 1 + (ratio - 1) * ae;
    // Shading and strand detail scale together, so strand contrast relative to the hair's lightness is
    // the person's own. Only pixels lighter than the hair (skin or sky between strands) are capped.
    const Lold = P.L[k];
    const cap = Llow[k] > hairL + 4 ? Lold + Math.abs(lift) * 0.75 * 1.3 * ae : 97;
    const Lnew = Math.max(0, Math.min(97, Lold * r, cap));
    P.L[k] = Lnew;
    const cs = Math.min(1, Math.max(0.15, Lnew / Math.max(4, LtHair)) ** 0.8);
    P.A[k] += (tA * cs - P.A[k]) * ae; P.B[k] += (tB * cs - P.B[k]) * ae;
  }
  writeLab(img, P, L0, A0, B0);
  let changed = 0; for (let k = 0; k < n; k++) if (Math.abs(P.L[k] - L0[k]) + Math.abs(P.A[k] - A0[k]) + Math.abs(P.B[k] - B0[k]) >= 0.05) changed++;
  return { changed, rect, hairPixels: hw };
}

/** The same face found on a resized copy of the photo (k = new size / old size). */
export function scaleFace(face, k) {
  if (!face?.ok) return face;
  return {
    ...face, width: Math.round(face.width * k), height: Math.round(face.height * k),
    frame: { ...face.frame, ox: face.frame.ox * k, oy: face.frame.oy * k, d: face.frame.d * k },
    faceBox: { x0: face.faceBox.x0 * k, y0: face.faceBox.y0 * k, x1: face.faceBox.x1 * k, y1: face.faceBox.y1 * k },
  };
}
