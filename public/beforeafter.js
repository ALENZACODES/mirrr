/**
 * MIRRR Before & After studio. She uses her own photo (or one of MIRRR's natural-look, bare-faced
 * model photos), plays with foundation, brows, eyes, lips and blush on it, and compares before and
 * after with a slider. "How she got the look" builds a look one step at a time on the same photo.
 *
 * Everything runs in this browser tab: her photo is never uploaded. The face tracker is the same
 * MediaPipe Face Landmarker the live try-on uses (its files download once). The painting reuses the
 * try-on's geometry and colour maths from tryon-geometry.js; tryon.js itself is left alone.
 * Nothing is pre-selected: no photo, no colour and no look is chosen until she picks one.
 */
import {
  LIPS_OUTER, LIPS_INNER, EYE, FACE_OVAL, toPixels, bbox, smoothClosed, smoothOpen, eyeOpenness,
  lashLine, wingTip, lidPolygon, browPolygon, blushEllipse, hexToRgb, tintPixel, browPixel,
  maskedMeanL, lightnessDetail, rgbToLab, labToRgb,
} from './tryon-geometry.js';
import { MODEL_FACES } from './model-faces.js';
import { LAYERS, LOOKS, choiceAfter as rawChoiceAfter, describeStep, loadManifest, adaptForDepth } from './beforeafter-core.js';

const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const S = { landmarker: null, loading: null, photo: null, L: null, choice: {}, split: 50, look: null, source: null, base: null };
const before = document.createElement('canvas'); const bctx = before.getContext('2d', { willReadFrequently: true });
const after = document.createElement('canvas');
let W = after.getContext('2d', { willReadFrequently: true }); // the canvas being painted on
const layer = document.createElement('canvas'); const lctx = layer.getContext('2d');
const mask = document.createElement('canvas'); const mctx = mask.getContext('2d', { willReadFrequently: true });

/** A look's layers after step k, in shades that show on her skin depth. */
const choiceAfter = (look, k) => adaptForDepth(rawChoiceAfter(look, k), S.skinL);

function status(msg) { const s = $('baStatus'); if (s) s.textContent = msg; }

async function landmarker() {
  if (S.landmarker) return S.landmarker;
  if (!S.loading) {
    S.loading = (async () => {
      status('Loading the face tracker (about 4 MB, once). It runs on this device.');
      const vision = await import(`${VISION}/vision_bundle.mjs`);
      const files = await vision.FilesetResolver.forVisionTasks(`${VISION}/wasm`);
      const make = delegate => vision.FaceLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'IMAGE', numFaces: 1 });
      try { S.landmarker = await make('GPU'); } catch { S.landmarker = await make('CPU'); }
      return S.landmarker;
    })();
    S.loading.catch(() => { S.loading = null; });
  }
  return S.loading;
}

// ---- photo in --------------------------------------------------------------------------------
async function useImage(src, source, okMsg) {
  const img = new Image(); img.src = src;
  try { await img.decode(); } catch { status('That file could not be opened as a photo.'); return; }
  let lm; try { lm = await landmarker(); } catch { status('The face tracker could not load. Check your connection and try again.'); return; }
  const k = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
  before.width = after.width = layer.width = w; before.height = after.height = layer.height = h;
  bctx.drawImage(img, 0, 0, w, h);
  const r = lm.detect(before);
  S.photo = img; S.L = r.faceLandmarks?.[0] ?? null; S.source = source; S.base = null;
  if (S.L) { const prev = W; W = bctx; S.skinL = skinLab(S.L, w, h)[0]; W = prev; } else S.skinL = null;
  $('baWork').hidden = false;
  const c = $('baCanvas'); c.width = w; c.height = h;
  status(S.L ? okMsg : 'No face found in that photo. Try a front-facing photo in good light.');
  render(); renderSteps();
}

// ---- painting (the try-on's methods, on a still photo, with an amount for each layer) -------------
function tracePath(ctx, pts, closed = true) {
  const seg = closed ? smoothClosed(pts) : smoothOpen(pts);
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const s of seg) ctx.bezierCurveTo(s[0], s[1], s[2], s[3], s[4], s[5]);
  if (closed) ctx.closePath();
}
function pixelPass(cv, region, drawMask, feather, perPixel) {
  const x = Math.max(0, Math.floor(region.x)), y = Math.max(0, Math.floor(region.y));
  const w = Math.min(cv.width - x, Math.ceil(region.w)), h = Math.min(cv.height - y, Math.ceil(region.h));
  if (w < 2 || h < 2) return;
  mask.width = w; mask.height = h; mctx.clearRect(0, 0, w, h);
  mctx.save(); mctx.translate(-x, -y);
  if ('filter' in mctx) mctx.filter = `blur(${Math.max(0.6, feather).toFixed(1)}px)`;
  mctx.fillStyle = '#fff'; drawMask(mctx); mctx.restore(); mctx.filter = 'none';
  const m = mctx.getImageData(0, 0, w, h).data;
  const img = W.getImageData(x, y, w, h);
  perPixel(img.data, m, w * h, w, h);
  W.putImageData(img, x, y);
}
function overlay(cv, draw, op, alpha) {
  layer.width = cv.width; layer.height = cv.height;
  lctx.clearRect(0, 0, layer.width, layer.height); lctx.save(); draw(lctx); lctx.restore(); lctx.filter = 'none';
  W.save(); W.globalCompositeOperation = op; W.globalAlpha = alpha; W.drawImage(layer, 0, 0); W.restore();
}
const amt = (c, id, d = 80) => Math.max(0, Math.min(100, Number(c[id + 'Amt'] ?? d))) / 100;
const eyeWidth = (L, side, w, h) => { const [o, i] = toPixels(L, [EYE[side].outer, EYE[side].inner], w, h); return Math.hypot(o[0] - i[0], o[1] - i[1]); };

/** Her own skin colour, read from both cheeks and the forehead of this photo. */
function skinLab(L, w, h) {
  const pts = toPixels(L, [205, 425, 151], w, h); let r = 0, g = 0, b = 0, n = 0;
  for (const [x, y] of pts) {
    const d = W.getImageData(Math.max(0, Math.round(x) - 5), Math.max(0, Math.round(y) - 5), 11, 11).data;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
  }
  return rgbToLab(r / n, g / n, b / n);
}

/**
 * Colour a feathered region in CIELAB: her own light, shadow and skin texture stay (each pixel keeps
 * its lightness offset), the hue moves toward the shade, and lightness moves only part way (and is
 * capped at `maxUp` brighter, so skin is never lightened by colour makeup).
 */
function labTint(cv, region, drawMask, feather, hex, { ab = 0.7, l = 0.3, maxUp = 4, amount = 1 }) {
  const [Ls, As, Bs] = rgbToLab(...hexToRgb(hex));
  pixelPass(cv, region, drawMask, feather, (d, m, n) => {
    for (let i = 0; i < n; i++) {
      const a = (m[i * 4 + 3] / 255) * amount; if (a < 0.01) continue;
      const [l0, A, B] = rgbToLab(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
      const dl = Math.min(maxUp, (Ls - l0) * l) * a;
      const o = labToRgb(l0 + dl, A + (As - A) * ab * a, B + (Bs - B) * ab * a);
      d[i * 4] = o[0]; d[i * 4 + 1] = o[1]; d[i * 4 + 2] = o[2];
    }
  });
}

/** Contour: a soft shadow under the cheekbones and at the temples, a few shades deeper than her own skin. */
function paintContour(cv, L, a0) {
  const w = cv.width, h = cv.height;
  const prev = W; const [sl, sa, sb] = skinLab(L, w, h); W = prev;
  const rgb = labToRgb(Math.max(4, sl - 22), sa + 3, sb + 4);
  const hex = '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const fw = Math.hypot(...[0, 1].map(j => toPixels(L, [454], w, h)[0][j] - toPixels(L, [234], w, h)[0][j]));
  for (const [ear, mouth, temple] of [[234, 61, 127], [454, 291, 356]]) {
    const [e, m, t] = toPixels(L, [ear, mouth, temple], w, h);
    // from the ear toward the corner of the mouth, stopping under the middle of the eye
    const sx = e[0] + (m[0] - e[0]) * 0.05, sy = e[1] + (m[1] - e[1]) * 0.05 + fw * 0.05;
    const ex = e[0] + (m[0] - e[0]) * 0.5, ey = e[1] + (m[1] - e[1]) * 0.42 + fw * 0.02;
    const cx = (sx + ex) / 2, cy = (sy + ey) / 2; const len = Math.hypot(ex - sx, ey - sy); const ang = Math.atan2(ey - sy, ex - sx);
    labTint(cv, { x: Math.min(sx, ex, t[0]) - fw * 0.1, y: Math.min(sy, ey, t[1]) - fw * 0.15, w: Math.abs(ex - sx) + fw * 0.3, h: Math.abs(ey - t[1]) + fw * 0.35 }, x => {
      x.save(); x.translate(cx, cy); x.rotate(ang); x.scale(1, 0.28);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, len * 0.6); g.addColorStop(0, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, len * 0.6, 0, Math.PI * 2); x.fill(); x.restore();
      const g2 = x.createRadialGradient(t[0], t[1] - fw * 0.05, 0, t[0], t[1] - fw * 0.05, fw * 0.12); g2.addColorStop(0, 'rgba(255,255,255,0.45)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g2; x.beginPath(); x.arc(t[0], t[1] - fw * 0.05, fw * 0.12, 0, Math.PI * 2); x.fill();
    }, fw * 0.02, hex, { ab: 0.4, l: 1, maxUp: 0, amount: a0 });
  }
}

/** A soft sheen on the high points (cheekbones, nose bridge): fresh skin after prep, or highlighter. */
function paintGlow(cv, L, hex, strength) {
  const w = cv.width, h = cv.height; const col = hexToRgb(hex).join(',');
  const fw = Math.hypot(...[0, 1].map(j => toPixels(L, [454], w, h)[0][j] - toPixels(L, [234], w, h)[0][j]));
  const [cr, cl, nb1, nb2] = toPixels(L, [117, 346, 6, 197], w, h);
  const draw = x => {
    const spot = ([px, py], rx, ry, ang) => {
      x.save(); x.translate(px, py); x.rotate(ang); x.scale(1, ry / rx);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, `rgba(${col},0.9)`); g.addColorStop(1, `rgba(${col},0)`);
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, rx, 0, Math.PI * 2); x.fill(); x.restore();
    };
    spot([cr[0] - fw * 0.05, cr[1] - fw * 0.01], fw * 0.1, fw * 0.045, -0.5);
    spot([cl[0] + fw * 0.05, cl[1] - fw * 0.01], fw * 0.1, fw * 0.045, 0.5);
    spot([(nb1[0] + nb2[0]) / 2, (nb1[1] + nb2[1]) / 2], fw * 0.05, fw * 0.025, Math.PI / 2);
  };
  overlay(cv, draw, 'soft-light', 0.55 * strength); overlay(cv, draw, 'screen', 0.07 * strength);
}

function paintFoundation(cv, L, c) {
  const w = cv.width, h = cv.height; const a0 = amt(c, 'foundation', 60);
  const oval = toPixels(L, FACE_OVAL, w, h);
  const cx = oval.reduce((s, p) => s + p[0], 0) / oval.length, cy = oval.reduce((s, p) => s + p[1], 0) / oval.length;
  const inner = oval.map(([x, y]) => [cx + (x - cx) * 0.96, cy + (y - cy) * 0.97]);
  const fw = Math.hypot(oval[8][0] - oval[28][0], oval[8][1] - oval[28][1]);
  const own = skinLab(L, w, h);
  const target = c.foundation === 'match' ? own : rgbToLab(...hexToRgb(c.foundation));
  pixelPass(cv, bbox(inner, fw * 0.05), m => {
    m.beginPath(); tracePath(m, inner); m.fill();
    m.globalCompositeOperation = 'destination-out';
    for (const side of ['right', 'left']) {
      const ring = [...toPixels(L, EYE[side].upper, w, h), ...toPixels(L, EYE[side].lower, w, h).reverse()];
      const ex = ring.reduce((s, p) => s + p[0], 0) / ring.length, ey = ring.reduce((s, p) => s + p[1], 0) / ring.length;
      m.beginPath(); tracePath(m, ring.map(([x, y]) => [ex + (x - ex) * 1.35, ey + (y - ey) * 1.9])); m.fill();
      m.beginPath(); tracePath(m, browPolygon(L, side, w, h)); m.fill();
    }
    m.beginPath(); tracePath(m, toPixels(L, LIPS_OUTER, w, h)); m.fill();
    m.globalCompositeOperation = 'source-over';
  }, fw * 0.03, (d, m, n) => {
    const mean = maskedMeanL(d, m, n);
    for (let i = 0; i < n; i++) {
      const a = (m[i * 4 + 3] / 255) * a0; if (a < 0.01) continue;
      const [l, A, B] = rgbToLab(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
      // Shade moves her mean lightness and undertone toward the foundation; a little evening of
      // blotches, while her own light, shadow and texture stay.
      // Never lightens her skin: a matched base only evens it; a picked shade can deepen, and lifts at most a touch.
      const shift = c.foundation === 'match' ? 0 : Math.min(3, (target[0] - mean) * 0.7);
      const lOut = l + (shift + (mean + (l - mean) * 0.9 - l)) * a;
      const o = labToRgb(lOut, A + (target[1] - A) * a * 0.3, B + (target[2] - B) * a * 0.3);
      d[i * 4] = o[0]; d[i * 4 + 1] = o[1]; d[i * 4 + 2] = o[2];
    }
  });
}

function paintBrows(cv, L, c) {
  const w = cv.width, h = cv.height; const tint = hexToRgb(c.brow); const a0 = amt(c, 'brow', 75);
  for (const side of ['right', 'left']) {
    const poly = browPolygon(L, side, w, h); const bw = Math.hypot(poly[0][0] - poly[4][0], poly[0][1] - poly[4][1]);
    pixelPass(cv, bbox(poly, bw * 0.15), m => { m.beginPath(); tracePath(m, poly); m.fill(); }, bw * 0.05, (d, m, n) => {
      for (let i = 0; i < n; i++) { const a = m[i * 4 + 3] / 255; if (a < 0.01) continue; const o = browPixel(d[i * 4], d[i * 4 + 1], d[i * 4 + 2], tint, a, 0.35 + 0.6 * a0); d[i * 4] = o[0]; d[i * 4 + 1] = o[1]; d[i * 4 + 2] = o[2]; }
    });
  }
}

function paintShadow(cv, L, c) {
  const w = cv.width, h = cv.height; const a0 = amt(c, 'shadow', 80);
  for (const side of ['right', 'left']) {
    const ew = eyeWidth(L, side, w, h); const crease = lidPolygon(L, side, w, h, 0.7); const top = lidPolygon(L, side, w, h, 0.95);
    // Built like a brush: a soft wash up to the crease, more colour toward the lash line (a gradient).
    labTint(cv, bbox(top, ew * 0.3), x => {
      x.globalAlpha = 0.3; x.beginPath(); tracePath(x, lidPolygon(L, side, w, h, 0.95)); x.fill();
      x.globalAlpha = 0.45; x.beginPath(); tracePath(x, crease); x.fill();
      x.globalAlpha = 0.6; x.beginPath(); tracePath(x, lidPolygon(L, side, w, h, 0.45)); x.fill();
      x.globalAlpha = 0.8; x.beginPath(); tracePath(x, lidPolygon(L, side, w, h, 0.22)); x.fill(); x.globalAlpha = 1;
    }, ew * 0.12, c.shadow, { ab: 0.92, l: 0.6, maxUp: 8, amount: Math.min(1, a0 * 1.15) });
  }
}

function paintLiner(cv, L, c) {
  const w = cv.width, h = cv.height; const col = c.liner; const style = c.linerStyle || 'tight'; const a0 = amt(c, 'liner', 90);
  const draw = x => {
    for (const side of ['right', 'left']) {
      const ew = eyeWidth(L, side, w, h); const line = lashLine(L, side, w, h);
      const up = line.map(({ p, n, t: k }) => { const th = ew * (0.018 + 0.05 * k * k); return [p[0] + n[0] * th, p[1] + n[1] * th]; });
      const band = [...line.map(l => l.p), ...up.reverse()];
      if ('filter' in x) x.filter = `blur(${Math.max(0.5, ew * 0.012).toFixed(1)}px)`;
      x.fillStyle = col; x.beginPath(); tracePath(x, band); x.fill();
      if (style === 'wing') {
        const [base, tip] = wingTip(L, side, w, h, 0.38); const last = line[line.length - 1]; const th = ew * 0.068;
        const top = [last.p[0] + last.n[0] * th, last.p[1] + last.n[1] * th]; const prev = line[line.length - 3].p;
        x.beginPath(); x.moveTo(prev[0], prev[1]); x.lineTo(top[0], top[1]); x.lineTo(tip[0], tip[1]); x.lineTo(base[0], base[1]); x.closePath(); x.fill();
      }
      if (style === 'kohl') {
        x.lineWidth = ew * 0.03; x.lineCap = 'round'; x.strokeStyle = col;
        if ('filter' in x) x.filter = `blur(${(ew * 0.02).toFixed(1)}px)`;
        x.beginPath(); tracePath(x, toPixels(L, EYE[side].lower, w, h), false); x.stroke();
      }
    }
  };
  overlay(cv, draw, 'source-over', Math.min(1, (style === 'kohl' ? 0.9 : 1) * (0.4 + 0.65 * a0)));
}

const LASH_STYLE = { natural: { n: 30, len: 0.17, wid: 0.016, curl: 0.35, jitter: 0.2 }, wispy: { n: 38, len: 0.22, wid: 0.014, curl: 0.42, jitter: 0.6 }, dramatic: { n: 44, len: 0.27, wid: 0.02, curl: 0.45, jitter: 0.25 } };
const rnd = i => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
function paintLashes(cv, L, c) {
  const w = cv.width, h = cv.height; const st = LASH_STYLE[c.lashes]; if (!st) return;
  W.save(); W.strokeStyle = 'rgba(12,10,10,0.85)'; W.fillStyle = 'rgb(14,11,11)'; W.lineCap = 'round';
  if ('filter' in W) W.filter = 'blur(0.35px)';
  for (const side of ['right', 'left']) {
    if (eyeOpenness(L, side, w, h) < 0.13) continue;
    const ew = eyeWidth(L, side, w, h); const line = lashLine(L, side, w, h); const seg = smoothOpen(line.map(l => l.p));
    const outward = [line[line.length - 1].p[0] - line[0].p[0], line[line.length - 1].p[1] - line[0].p[1]]; const ol = Math.hypot(...outward) || 1;
    for (let k = 0; k < st.n; k++) {
      const u = Math.min(0.995, Math.max(0.005, (k + 0.5 + (rnd(k + 31) - 0.5) * 0.8) / st.n)); const si = Math.min(seg.length - 1, Math.floor(u * seg.length)); const tt = u * seg.length - si;
      const p0 = si === 0 ? line[0].p : [seg[si - 1][4], seg[si - 1][5]]; const s = seg[si];
      const p = [0, 1].map(j => (1 - tt) ** 3 * p0[j] + 3 * (1 - tt) ** 2 * tt * s[j] + 3 * (1 - tt) * tt ** 2 * s[2 + j] + tt ** 3 * s[4 + j]);
      const n = line[Math.min(line.length - 1, Math.round(u * (line.length - 1)))].n;
      const prof = 0.45 + 0.55 * Math.sin(Math.PI * Math.min(1, u * 0.85 + 0.12));
      const len = ew * st.len * prof * (1 - st.jitter * 0.5 + st.jitter * rnd(k + (side === 'left' ? 99 : 0)));
      const lean = (u - 0.3) * 0.9 + (rnd(k + 53) - 0.5) * 0.35;
      const dir = [n[0] + (outward[0] / ol) * lean, n[1] + (outward[1] / ol) * lean]; const dl = Math.hypot(...dir) || 1;
      const tip = [p[0] + (dir[0] / dl) * len, p[1] + (dir[1] / dl) * len];
      const ctrl = [p[0] + n[0] * len * 0.55 - (outward[0] / ol) * len * st.curl * 0.2, p[1] + n[1] * len * 0.55 - (outward[1] / ol) * len * st.curl * 0.2];
      const bw = Math.max(0.8, ew * st.wid * (1.1 - 0.4 * u)) / 2; const tx = -(dir[1] / dl), ty = dir[0] / dl;
      W.globalAlpha = 0.78 + 0.2 * rnd(k + 7); W.beginPath();
      W.moveTo(p[0] - tx * bw, p[1] - ty * bw);
      W.quadraticCurveTo(ctrl[0] - tx * bw * 0.6, ctrl[1] - ty * bw * 0.6, tip[0], tip[1]);
      W.quadraticCurveTo(ctrl[0] + tx * bw * 0.6, ctrl[1] + ty * bw * 0.6, p[0] + tx * bw, p[1] + ty * bw);
      W.closePath(); W.fill();
    }
    W.globalAlpha = 1; W.lineWidth = Math.max(1, ew * 0.025); W.beginPath(); tracePath(W, line.map(l => l.p), false); W.stroke();
  }
  W.restore();
}

function paintLips(cv, L, c) {
  const w = cv.width, h = cv.height; const outer = toPixels(L, LIPS_OUTER, w, h), inner = toPixels(L, LIPS_INNER, w, h);
  const mw = Math.hypot(outer[10][0] - outer[0][0], outer[10][1] - outer[0][1]);
  const shade = hexToRgb(c.lip); const fin = c.lipFinish || 'creme'; const a0 = amt(c, 'lip', 90);
  pixelPass(cv, bbox(outer, mw * 0.08), m => {
    m.beginPath(); tracePath(m, outer); m.fill();
    m.globalCompositeOperation = 'destination-out'; m.beginPath(); tracePath(m, inner); m.fill(); m.globalCompositeOperation = 'source-over';
  }, mw * 0.025, (d, m, n, pw, ph) => {
    const mean = maskedMeanL(d, m, n); const det = lightnessDetail(d, pw, ph, Math.max(1, Math.round(mw * 0.012)));
    for (let i = 0; i < n; i++) { const a = m[i * 4 + 3] / 255; if (a < 0.01) continue; const o = tintPixel(d[i * 4], d[i * 4 + 1], d[i * 4 + 2], shade, mean, fin, a, 0.5 + 0.5 * a0, det[i]); d[i * 4] = o[0]; d[i * 4 + 1] = o[1]; d[i * 4 + 2] = o[2]; }
  });
  if (fin === 'gloss') {
    const ang = Math.atan2(outer[10][1] - outer[0][1], outer[10][0] - outer[0][0]);
    const [lo1, lo2] = toPixels(L, [14, 17], w, h); const [up1, up2] = toPixels(L, [13, 0], w, h);
    const g = (x, y, rx, ry, a) => { W.save(); W.globalCompositeOperation = 'screen'; if ('filter' in W) W.filter = `blur(${(mw * 0.02).toFixed(1)}px)`; W.fillStyle = `rgba(255,255,255,${a})`; W.beginPath(); W.ellipse(x, y, rx, ry, ang, 0, Math.PI * 2); W.fill(); W.restore(); };
    g((lo1[0] + lo2[0]) / 2, lo1[1] * 0.45 + lo2[1] * 0.55, mw * 0.13, mw * 0.03, 0.38 * a0);
    g((up1[0] + up2[0]) / 2 - mw * 0.1, (up1[1] + up2[1]) / 2, mw * 0.06, mw * 0.015, 0.25 * a0);
  }
}

function paintBlush(cv, L, c) {
  const w = cv.width, h = cv.height; const a0 = amt(c, 'blush', 80);
  for (const side of ['right', 'left']) {
    const e = blushEllipse(L, side, w, h); const r = e.rx * 1.25;
    labTint(cv, { x: e.cx - r * 1.2, y: e.cy - r * 1.2, w: r * 2.4, h: r * 2.4 }, x => {
      x.save(); x.translate(e.cx, e.cy); x.rotate(e.angle); x.scale(1, e.ry / e.rx);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, 'rgba(255,255,255,0.7)'); g.addColorStop(0.45, 'rgba(255,255,255,0.4)'); g.addColorStop(0.8, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill(); x.restore();
    }, 1, c.blush, { ab: 0.62, l: 0.2, maxUp: 0, amount: a0 });
  }
}

/** Paints choice `c` onto canvas `cv`, which already holds the bare photo. */
function paintOn(cv, L, c) {
  const prev = W; W = cv.getContext('2d', { willReadFrequently: true });
  try {
    if (c.prep) paintGlow(cv, L, '#fff8ef', 1);
    if (c.foundation) paintFoundation(cv, L, c);
    if (c.brow) paintBrows(cv, L, c);
    if (c.shadow) paintShadow(cv, L, c);
    if (c.liner) paintLiner(cv, L, c);
    if (c.lashes) paintLashes(cv, L, c);
    if (c.lip) paintLips(cv, L, c);
    if (c.contour) paintContour(cv, L, Math.min(1, amt(c, 'contour', 75) * ({ soft: 0.7, defined: 1, sculpted: 1.25 }[c.contour] ?? 1)));
    if (c.blush) paintBlush(cv, L, c);
    if (c.highlight) paintGlow(cv, L, c.highlight, amt(c, 'highlight', 70));
  } finally { W = prev; }
}

// ---- stage -----------------------------------------------------------------------------------
function render() {
  if (!S.photo) return;
  const w = before.width, h = before.height; const actx = after.getContext('2d', { willReadFrequently: true });
  actx.drawImage(before, 0, 0);
  if (S.L) paintOn(after, S.L, S.choice);
  compose();
}
function compose() {
  const c = $('baCanvas'); if (!c || !before.width) return;
  const x = c.getContext('2d'); const w = c.width, h = c.height; const cut = Math.round(w * S.split / 100);
  x.drawImage(before, 0, 0);
  x.save(); x.beginPath(); x.rect(cut, 0, w - cut, h); x.clip(); x.drawImage(after, 0, 0); x.restore();
  x.fillStyle = 'rgba(255,255,255,0.92)'; x.fillRect(cut - 1, 0, 2, h);
}

function readChoice() {
  const c = {};
  for (const l of LAYERS) {
    const v = $(`ba-${l.id}`)?.value; if (v && v !== 'none') c[l.id] = v;
    if (l.amount) { const a = $(`ba-${l.id}-amt`); if (a) { c[l.id + 'Amt'] = Number(a.value); a.disabled = !c[l.id]; } }
  }
  S.choice = c; render(); renderShop();
}

function controls() {
  const sel = l => `<label class="to-field" for="ba-${l.id}"><span>${esc(l.label)}</span><select id="ba-${l.id}"><option value="" disabled selected>Choose…</option><option value="none">None</option>${[...(l.extra || []), ...l.values].map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join('')}</select></label>`;
  const amtIn = l => l.amount ? `<label class="to-field ba-amt" for="ba-${l.id}-amt"><span>${esc(l.label.replace(/ (shade|colour|tint).*$/i, ''))} amount</span><input type="range" id="ba-${l.id}-amt" min="0" max="100" step="1" value="80" disabled></label>` : '';
  const groups = [['Skin', ['foundation']], ['Eyes & brows', ['brow', 'shadow', 'liner', 'linerStyle', 'lashes']], ['Lips & cheeks', ['lip', 'lipFinish', 'blush', 'contour', 'highlight']]];
  return groups.map(([g, ids]) => `<fieldset class="to-group"><legend>${esc(g)}</legend>${ids.map(id => { const l = LAYERS.find(x => x.id === id); return sel(l) + amtIn(l); }).join('')}</fieldset>`).join('');
}

function clearAll() {
  for (const l of LAYERS) { const s = $(`ba-${l.id}`); if (s) s.value = ''; }
  readChoice();
}
function setControls(c) {
  for (const l of LAYERS) {
    const s = $(`ba-${l.id}`); if (s) s.value = c[l.id] ?? 'none';
    const a = $(`ba-${l.id}-amt`); if (a && c[l.id + 'Amt'] != null) a.value = c[l.id + 'Amt'];
  }
  readChoice();
}

// ---- real products for what she is trying ------------------------------------------------------
const shopCache = {};
async function products(routine) {
  if (!routine) return [];
  if (!shopCache[routine]) shopCache[routine] = fetch(`/api/shop/routine/${routine}`).then(r => r.json()).then(d => d.products || []).catch(() => []);
  return shopCache[routine];
}
const productLinks = (ps, tag, n = 3) => ps.slice(0, n).map(p => `<a class="shop-link earn-chip" href="${esc(String(p.shop_url).replace(/utm_content=[^&]*/, 'utm_content=beforeafter_' + tag))}" target="_blank" rel="noopener"><strong>${esc(p.brand)}</strong> ${esc(p.name)}<span>${esc(String(p.category))} · ${esc(p.price_text)}${p.ownership ? ` · ${esc(p.ownership)}` : ''}</span></a>`).join('');
const SHOP_NOTE = '<p class="lib-note">Real products from brands&rsquo; own stores in these categories, not matched to the exact colour on screen. Prices as listed on each brand&rsquo;s store on Oct 30, 2026. No affiliate deal: MIRRR earns nothing from these links today.</p>';

let shopKey = '';
async function renderShop() {
  const el = $('baShop'); if (!el) return; const c = S.choice; const r = [];
  if (c.foundation) r.push(['complexion', 'Base']);
  if (c.shadow || c.lashes) r.push(['eyes', 'Eyes']); else if (c.liner || c.brow) r.push(['brow_kohl', 'Brows & liner']);
  if (c.lip) r.push(['lips', 'Lips']);
  if (c.blush || c.highlight) r.push(['glow', 'Cheeks & glow']);
  const key = r.map(x => x[0]).join(','); if (key === shopKey) return; shopKey = key;
  if (!r.length) { el.innerHTML = ''; return; }
  const parts = [];
  for (const [id, title] of r) { const ps = await products(id); if (ps.length) parts.push(`<h4>${esc(title)}</h4><div class="earn-xs">${productLinks(ps, id)}</div>`); }
  el.innerHTML = parts.length ? `<h3 class="st-h">Shop what you tried</h3>${parts.join('')}${SHOP_NOTE}` : '';
}

// ---- how she got the look (step by step, on this photo) ----------------------------------------
function thumb(c) {
  const k = Math.min(1, 360 / before.width); const cv = document.createElement('canvas');
  cv.width = Math.round(before.width * k); cv.height = Math.round(before.height * k);
  cv.getContext('2d', { willReadFrequently: true }).drawImage(before, 0, 0, cv.width, cv.height);
  if (S.L && c) paintOn(cv, S.L, c);
  return cv.toDataURL('image/jpeg', 0.86);
}
async function renderSteps() {
  const el = $('baSteps'); if (!el) return;
  const look = LOOKS.find(l => l.id === S.look);
  $('baApplyLook').disabled = !look || !S.photo;
  if (!look) { el.innerHTML = '<p class="lib-note choose-first">Choose a look above to see it built one step at a time.</p>'; return; }
  if (!S.photo) { el.innerHTML = '<p class="lib-note choose-first">Choose a photo first (yours or a natural-look model).</p>'; return; }
  const cards = [`<li class="ba-card"><img src="${thumb(null)}" alt="Before: the bare face" width="180" height="225"><h4>Before</h4><p class="lib-note">Bare face, nothing on.</p></li>`];
  for (let k = 0; k < look.steps.length; k++) {
    const s = look.steps[k]; const ps = (await products(s.routine)).filter(p => !s.cats || s.cats.includes(p.category));
    const last = k === look.steps.length - 1;
    cards.push(`<li class="ba-card${last ? ' ba-card--after' : ''}"><img src="${thumb(choiceAfter(look, k))}" alt="${last ? 'After, the finished look' : `After step ${k + 1}: ${esc(s.name)}`}" width="180" height="225"><h4>${last ? `After &middot; ${k + 1}. ${esc(s.name)}` : `${k + 1}. ${esc(s.name)}`}</h4>${s.note ? `<p class="lib-note">${esc(s.note)}</p>` : ''}${describeStep(s).length ? `<ul class="ba-what">${describeStep(s).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${ps.length ? `<div class="earn-xs">${productLinks(ps, s.routine, 2)}</div>` : ''}</li>`);
  }
  el.innerHTML = `<ol class="ba-cards">${cards.join('')}</ol>${SHOP_NOTE}`;
}

// ---- real photo sets (shown only once the manifest has complete sets) -------------------------
async function renderGallery() {
  const el = $('baGallery'); if (!el) return;
  let m; try { m = loadManifest(await (await fetch('/beforeafter/manifest.json')).json()); } catch { m = { enabled: false, models: [] }; }
  if (!m.enabled) { el.hidden = true; return; }
  el.hidden = false;
  const sets = [];
  for (const s of m.models) {
    const steps = [];
    for (const st of s.steps) { const ps = await products(st.routine); steps.push(`<li class="ba-card"><img src="${esc(st.image)}" alt="${esc(st.name)}" width="180" height="225" loading="lazy"><h4>${esc(st.name)}</h4>${st.note ? `<p class="lib-note">${esc(st.note)}</p>` : ''}${ps.length ? `<div class="earn-xs">${productLinks(ps, st.routine, 2)}</div>` : ''}</li>`); }
    sets.push(`<article class="ba-set"><h4>${esc(s.name || 'Her look')}</h4><ol class="ba-cards"><li class="ba-card"><img src="${esc(s.before)}" alt="Before, bare face" width="180" height="225" loading="lazy"><h4>Before</h4></li>${steps.join('')}<li class="ba-card"><img src="${esc(s.after)}" alt="After, the finished look" width="180" height="225" loading="lazy"><h4>After</h4></li></ol></article>`);
  }
  $('baGallerySets').innerHTML = sets.join('') + SHOP_NOTE;
}

// ---- save ------------------------------------------------------------------------------------
function save() {
  const c = $('baCanvas'); if (!c.width || !S.photo) return;
  c.toBlob(b => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'mirrr-before-after.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); status('Saved to this device only.'); }, 'image/png');
}

// ---- view ------------------------------------------------------------------------------------
function mount() {
  const root = $('baRoot'); if (!root || root.dataset.ready) return; root.dataset.ready = '1';
  $('baControls').innerHTML = controls();
  $('baControls').addEventListener('change', readChoice);
  $('baControls').addEventListener('input', e => { if (e.target.type === 'range') readChoice(); });
  const file = e => { const f = e.target.files?.[0]; if (!f) return; $('baModels').querySelectorAll('.to-sample').forEach(x => x.setAttribute('aria-pressed', 'false')); useImage(URL.createObjectURL(f), 'own', 'Your photo is open on this device. It is not uploaded and not saved.'); e.target.value = ''; };
  $('baFile').addEventListener('change', file); $('baCam').addEventListener('change', file);
  const grid = $('baModels');
  grid.innerHTML = MODEL_FACES.map((f, i) => `<button type="button" class="to-sample" aria-pressed="false" data-ba-model="${esc(f.id)}" aria-label="Natural-look model ${i + 1}"><img src="${esc(f.src)}" alt="" width="54" height="72" loading="lazy" decoding="async"></button>`).join('');
  $('baPickModel').addEventListener('click', () => { grid.hidden = !grid.hidden; $('baPickModel').setAttribute('aria-expanded', String(!grid.hidden)); });
  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-ba-model]'); if (!b) return;
    grid.querySelectorAll('.to-sample').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    const f = MODEL_FACES.find(x => x.id === b.dataset.baModel); if (f) useImage(f.src, f.id, 'Natural-look model open. No makeup on her yet; the makeup is drawn in this browser tab.');
  });
  $('baSplit').addEventListener('input', e => { S.split = Number(e.target.value); compose(); });
  $('baClear').addEventListener('click', clearAll);
  $('baSave').addEventListener('click', save);
  $('baLook').innerHTML = `<option value="" disabled selected>Choose…</option>${LOOKS.map(l => `<option value="${esc(l.id)}">${esc(l.name)}</option>`).join('')}`;
  $('baLook').addEventListener('change', e => { S.look = e.target.value || null; renderSteps(); });
  $('baApplyLook').addEventListener('click', () => { const l = LOOKS.find(x => x.id === S.look); if (l) setControls(choiceAfter(l, l.steps.length - 1)); });
  renderSteps(); renderGallery();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
// For the automated check: state only, never pixels of her photo.
window.__mirrrBA = { state: () => ({ skinL: S.skinL == null ? null : Math.round(S.skinL), photo: !!S.photo, source: S.source, face: !!S.L, choice: { ...S.choice }, look: S.look, split: S.split }) };
