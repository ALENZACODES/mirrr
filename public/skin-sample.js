/**
 * Skin colour sampling for the photo shade match. Pure functions on { width, height, data }
 * buffers, so the same code runs in the page and in the Node harness (test/harness/).
 */
import { downscale, findFace, rgbToLab, labToRgb, deltaE2000 } from './photo-engine.js';

/** v1: the centre of the frame, luma 25-245, skin-like hues, middle 60% by luma, averaged. */
export function sampleSkinV1(img) {
  const s = downscale(img, Math.round(240 * Math.max(img.width, img.height) / img.width));
  const W = s.width, H = s.height;
  const x0 = Math.round(W * 0.32), x1 = Math.round(W * 0.68), y0 = Math.round(H * 0.32), y1 = Math.round(H * 0.62);
  const px = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const o = (y * W + x) * 4, r = s.data[o], g = s.data[o + 1], b = s.data[o + 2];
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (l < 25 || l > 245) continue;
    if (!(r > g && g > b * 0.8)) continue;
    px.push([r, g, b, l]);
  }
  if (px.length < 200) return null;
  px.sort((p, q) => p[3] - q[3]);
  const mid = px.slice(Math.floor(px.length * 0.2), Math.ceil(px.length * 0.8));
  const avg = k => Math.round(mid.reduce((a, p) => a + p[k], 0) / mid.length);
  return { r: avg(0), g: avg(1), b: avg(2) };
}

export const sampleSkin = sampleSkinV1;  // kept for the harness's before/after

// ---- v2: white balance + exposure pre-pass, multi-point sampling with confidence ------------------
const toLin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const toEnc = c => { c = Math.max(0, Math.min(1, c)); return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055); };
const Yof = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const med = a => { const s = Float64Array.from(a).sort(); return s.length ? s[(s.length - 1) >> 1] : NaN; };
const LtoY = L => (L > 8 ? ((L + 16) / 116) ** 3 : L / 903.3);

/** Points sampled in the face frame (u across, v down, in eye-distance units). */
export const SKIN_POINTS = [
  { id: 'cheek_l', u: -0.55, v: 0.55, w: 1 }, { id: 'cheek_r', u: 0.55, v: 0.55, w: 1 },
  { id: 'forehead', u: 0, v: -0.62, w: 1 }, { id: 'nose_bridge', u: 0, v: 0.3, w: 0.6 }, { id: 'chin', u: 0, v: 1.5, w: 0.6 },
];

/**
 * Measure skin colour from a photo buffer { width, height, data }.
 *   1. Find the face (photo-engine findFace). No face: fall back to the frame centre, low confidence.
 *   2. White balance: the brightest unclipped pixels inside each eye (the whites of the eyes) are
 *      taken as near-neutral and the channel gains that neutralise them are applied to the samples.
 *   3. Exposure: a dark photo is flagged. Correction from the eye whites (to L* 82, at most x2.2) is
 *      off by default: on real portraits the lids shade the eye whites and it over-brightened skin.
 *   4. Five skin patches (cheeks, forehead, nose bridge, chin); in each, pixels near the face's skin
 *      colour, not clipped and not specular, give a median. The patches' agreement gives confidence.
 * No luma floor and no darkest-pixel discard, so deep skin is measured as it is.
 * Returns { rgb, lab, confidence (0-1), flags[], method, patches } or null.
 */
export function measureSkin(img, { face, exposure = false, whiteBalance = true } = {}) {
  const f = face ?? findFace(img);
  const W = img.width, H = img.height, D = img.data, flags = [];
  const px = (x, y) => { const o = ((y | 0) * W + (x | 0)) * 4; return [D[o], D[o + 1], D[o + 2]]; };
  if (!f?.ok) {
    const lab = [];
    for (let y = Math.round(H * 0.36); y < H * 0.6; y += 2) for (let x = Math.round(W * 0.38); x < W * 0.62; x += 2) {
      const [r, g, b] = px(x, y); if (r >= 250 || g >= 250 || b >= 250) continue; if (!(r >= g && g >= b * 0.75)) continue;
      lab.push(rgbToLab(r, g, b));
    }
    if (lab.length < 100) return null;
    const L = [0, 1, 2].map(i => med(lab.map(c => c[i])));
    const [r, g, b] = labToRgb(...L).map(Math.round);
    return { rgb: { r, g, b }, lab: L, confidence: 0.2, flags: ['no-face: measured the frame centre'], method: 'centre', patches: [] };
  }
  const { ox, oy, d, cos, sin } = f.frame;
  const at = (u, v) => [ox + (u * cos - v * sin) * d, oy + (u * sin + v * cos) * d];
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;

  // 2-3. Eye whites -> gains and exposure.
  const whites = [];
  for (const e of f.eyes ?? []) {
    const cand = [];
    const ru = Math.max(0.08, e.rw), rv = Math.max(0.04, e.rh);
    for (let v = e.v - rv; v <= e.v + rv; v += 0.01) for (let u = e.u - ru; u <= e.u + ru; u += 0.01) {
      const [x, y] = at(u, v); if (!inside(x, y)) continue;
      const [r, g, b] = px(x, y); if (r >= 252 || g >= 252 || b >= 252) continue;
      // An eye white is brighter than the face's skin and far less saturated; anything else here is
      // lid, lash or skin around the eye and must not set the white balance.
      const el = rgbToLab(r, g, b);
      if (el[0] < f.skin.L + 4 || Math.hypot(el[1] - f.skin.a, el[2] - f.skin.b) < 4) continue;
      cand.push([toLin(r), toLin(g), toLin(b)]);
    }
    cand.sort((p, q) => Yof(...q) - Yof(...p));
    whites.push(...cand.slice(0, Math.max(3, Math.floor(cand.length * 0.2))));
  }
  let gains = [1, 1, 1], expo = 1;
  if (whites.length >= 8) {
    const m = [0, 1, 2].map(i => med(whites.map(p => p[i])));
    const Ym = Yof(...m);
    const chroma = Math.max(...m) / Math.max(1e-6, Math.min(...m));
    // Eye whites are a warm white (about a* 1, b* 4), not neutral. Correct only a clear cast away
    // from that (more than ΔE 4), and 90% of the way, so skin warmth is kept.
    const wl = rgbToLab(...m.map(c => Math.round(toEnc(c))));
    const cast = Math.hypot(wl[1] - 1, wl[2] - 4);
    if (whiteBalance && chroma < 3.5 && cast > 4) {
      const tgt = labToRgb(wl[0], 1, 4).map(toLin), k = 0.9;
      gains = m.map((c, i) => (tgt[i] / Math.max(1e-6, c)) ** k);
      const gm = Yof(...gains); gains = gains.map(g => g / gm);
      flags.push(`colour cast corrected from the eye whites (cast ΔE ${cast.toFixed(0)})`);
    } else if (chroma >= 3.5) flags.push('eye whites too coloured to use for white balance');
    const Lw = 116 * Math.cbrt(Ym) - 16;
    // Eye whites in real portraits sit in lid shadow (L* 40-66 on our template photos), so they are
    // not a safe exposure reference: by default a dark reading is only reported, not corrected.
    if (Lw < 50) flags.push('photo looks dark; retake in daylight for a better match');
    if (exposure && Lw < 72) { expo = Math.min(2.2, LtoY(82) / Ym); flags.push(`brightened x${expo.toFixed(2)} from the eye whites`); }
  } else flags.push('eye whites not found; no white balance');
  const correct = ([r, g, b]) => [toLin(r) * gains[0] * expo, toLin(g) * gains[1] * expo, toLin(b) * gains[2] * expo];
  const toLabC = l => rgbToLab(...l.map(v => Math.round(toEnc(v))));

  // 4. Patches.
  const sk = f.skin, thr = Math.max(8, sk.thr * 1.6);
  const patches = [];
  for (const p of SKIN_POINTS) {
    const labs = [], clippedLabs = []; let clipped = 0, n = 0;
    for (let v = p.v - 0.12; v <= p.v + 0.12; v += 0.02) for (let u = p.u - 0.12; u <= p.u + 0.12; u += 0.02) {
      const [x, y] = at(u, v); if (!inside(x, y)) continue; n++;
      const raw = px(x, y);
      const rl = rgbToLab(...raw);
      if (Math.hypot(rl[1] - sk.a, rl[2] - sk.b) > thr) continue;       // not skin (brow, hair, lip, shadow edge)
      if (raw.some(c => c >= 252)) { clipped++; clippedLabs.push(toLabC(correct(raw))); continue; }
      labs.push(toLabC(correct(raw)));
    }
    // A channel clipped across the whole patch (bright light on light skin): use it, but say so.
    if (labs.length < 12 && clippedLabs.length >= 12) { labs.push(...clippedLabs); if (!flags.includes('a colour channel is clipped on the face; the reading may be off')) flags.push('a colour channel is clipped on the face; the reading may be off'); }
    if (labs.length < 12) continue;
    const Lm = med(labs.map(c => c[0]));
    const keep = labs.filter(c => c[0] < Lm + 12);                       // drop specular highlights
    patches.push({ id: p.id, w: p.w, n: keep.length, of: n, clipped, lab: [0, 1, 2].map(i => med(keep.map(c => c[i]))) });
  }
  if (!patches.length) return null;
  const wsum = patches.reduce((a, p) => a + p.w, 0);
  // Robust centre: weighted mean of the patches closest to the patch median.
  // Robust centre: the per-channel median of the patches (side light and highlights move single
  // patches; the median keeps the face's typical colour).
  const pm = [0, 1, 2].map(i => med(patches.map(p => p.lab[i])));
  const dist = p => deltaE2000(p.lab, pm);
  const lab = pm;
  const spread = med(patches.map(dist));
  const clipFrac = patches.reduce((a, p) => a + p.clipped, 0) / Math.max(1, patches.reduce((a, p) => a + p.of, 0));
  if (clipFrac > 0.1) flags.push('highlights clipped on the face');
  if (patches.length < 3) flags.push('few skin patches visible');
  const confidence = Math.max(0, Math.min(1,
    (f.confidence ?? 0.5) * 0.3 + (patches.length / SKIN_POINTS.length) * 0.25 + Math.max(0, 1 - spread / 4) * 0.25
    + (whites.length >= 8 ? 0.2 : 0) - clipFrac - (expo > 1.6 ? 0.1 : 0)));
  const [r, g, b] = labToRgb(...lab).map(v => Math.round(Math.max(0, Math.min(255, v))));
  return { rgb: { r, g, b }, lab: lab.map(v => +v.toFixed(1)), confidence: +confidence.toFixed(2), flags, method: 'face', gains: gains.map(g => +g.toFixed(3)), exposure: +expo.toFixed(2), patches: patches.map(p => ({ id: p.id, n: p.n, lab: p.lab.map(v => +v.toFixed(1)) })), sampledFrom: Math.round(wsum * 100) / 100 };
}
