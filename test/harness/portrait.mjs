/**
 * Synthetic portraits for the per-slice harness (docs/SCORECARD.md). Skin, lips and hair are set
 * in CIELAB from measured references (the Monk Skin Tone scale, incl. its low-chroma deep end), and
 * the "camera" then applies the lighting the photo was taken in: an illuminant the phone only
 * partly white-balances, an exposure error, and sensor noise. The ground truth (eye centres, mouth,
 * face ellipse, true skin colour under daylight) comes back with the picture.
 *
 * Every number this produces is SYNTHETIC. It is a regression instrument, not proof on real faces.
 */
import { rgbToLab, labToRgb } from '../../public/photo-engine.js';

export function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }

const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const enc = v => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

/** CIE xy chromaticities of the lights the harness photographs under. */
export const ILLUMINANTS = {
  daylight: [0.31271, 0.32902],      // D65
  tungsten: [0.44757, 0.40745],      // CIE A, 2856 K
  fluorescent: [0.37208, 0.37529],   // CIE F2, cool white
  shade: [0.29902, 0.31485],         // D75, open shade / overcast
  warm_led: [0.43390, 0.40330],      // ~3000 K LED
};
/** Linear-sRGB gains a camera records under a light, after a phone's partial auto white balance. */
export function cameraGains(name, awb = 0.5) {
  const [x, y] = ILLUMINANTS[name]; const X = x / y, Z = (1 - x - y) / y;
  const g = [3.2406 * X - 1.5372 - 0.4986 * Z, -0.9689 * X + 1.8758 + 0.0415 * Z, 0.0557 * X - 0.2040 + 1.0570 * Z];
  return g.map(v => (v / g[1]) ** (1 - awb));
}

/**
 * skin: [L, a, b] true skin colour (daylight). opts: geometry and capture.
 *   dx, dy: face offset as a fraction of frame width/height; scale: face size multiplier;
 *   background: 'grey' | 'bright' | 'dark'; light: ILLUMINANTS key; ev: exposure error in stops.
 */
export function portrait(skin, { w = 480, h = 600, seed = 7, dx = 0, dy = 0, scale = 1, background = 'grey', light = 'daylight', ev = 0, noise = 1.6 } = {}) {
  const r = rand(seed), data = new Uint8ClampedArray(w * h * 4);
  const [sL, sa, sb] = skin;
  // Lips: darker and redder than the skin around them; on deep skin the lip is close in lightness.
  const lip = [Math.max(9, sL * 0.86 - 2), sa + 9 + 0.05 * sL, sb + 1];
  const hair = [Math.min(16, sL * 0.4 + 4), 1.5, 2.5];
  const bg = { grey: [76, 0, 1], bright: [93, 0, 0.5], dark: [24, 0, 1] }[background];
  const cx = w / 2 + dx * w, d = w * 0.2 * scale, eyeY = h * 0.42 + dy * h;
  const gains = cameraGains(light), expo = 2 ** ev;
  const raw = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = y * w + x, n = (r() - 0.5) * 2.4;
    let L = bg[0] + n * 0.6, a = bg[1], b = bg[2];
    const fu = (x - cx) / (d * 1.25), fv = (y - (eyeY + d * 0.19)) / (d * 1.75);
    const inHair = ((x - cx) / (d * 1.45)) ** 2 + ((y - (eyeY - d * 0.3)) / (d * 1.6)) ** 2 < 1 && y < eyeY - d * 0.1;
    if (inHair) { L = hair[0] + n; a = hair[1]; b = hair[2]; }
    const rr = fu * fu + fv * fv;
    if (rr < 1) {
      // Gentle fall-off toward the face's edge only; cheeks and forehead read the true colour.
      const shade = 1 - 0.18 * Math.max(0, Math.sqrt(rr) - 0.6);
      L = sL * shade + n * (0.5 + sL / 120); a = sa + n * 0.15; b = sb + n * 0.15;
    }
    for (const s of [-1, 1]) {
      const ex = cx + s * d / 2;
      if (((x - ex) / (d * 0.2)) ** 2 + ((y - eyeY) / (d * 0.08)) ** 2 < 1) { const iris = ((x - ex) / (d * 0.07)) ** 2 + ((y - eyeY) / (d * 0.07)) ** 2 < 1; L = iris ? 12 + n : Math.max(sL + 8, 82) + n; a = 0; b = iris ? 6 : 2; }
      if (((x - ex) / (d * 0.24)) ** 2 + ((y - (eyeY - d * 0.34)) / (d * 0.045)) ** 2 < 1) { L = Math.min(hair[0] + 4, sL * 0.6) + n; a = 2; b = 3; }
    }
    const my = eyeY + d * 1.08;
    const up = ((x - cx) / (d * 0.36)) ** 2 + ((y - (my - d * 0.06)) / (d * 0.07)) ** 2 < 1 && y < my;
    const dn = ((x - cx) / (d * 0.34)) ** 2 + ((y - (my + d * 0.07)) / (d * 0.09)) ** 2 < 1 && y >= my;
    if (up || dn) { L = lip[0] + n; a = lip[1]; b = lip[2]; }
    if (Math.abs(y - my) < 1.5 && Math.abs(x - cx) < d * 0.34) { L = Math.max(4, lip[0] - 12); a = lip[1] * 0.6; b = lip[2]; }
    const c = labToRgb(L, a, b);
    for (let i = 0; i < 3; i++) raw[k * 3 + i] = lin(c[i]) * gains[i] * expo;
  }
  const sig = noise * (ev < 0 ? 2 ** (-ev * 0.5) : 1);
  for (let k = 0; k < w * h; k++) for (let i = 0; i < 3; i++) data[k * 4 + i] = Math.round(Math.max(0, Math.min(255, enc(Math.min(1, raw[k * 3 + i])) + (r() - 0.5) * 2 * sig)));
  for (let k = 0; k < w * h; k++) data[k * 4 + 3] = 255;
  return {
    width: w, height: h, data,
    truth: { eyes: [[cx - d / 2, eyeY], [cx + d / 2, eyeY]], mouthY: eyeY + d * 1.08, d, cx, face: { cx, cy: eyeY + d * 0.19, ru: d * 1.25, rv: d * 1.75 }, skin: [...skin], lip },
  };
}

export const labOf = (img, x, y) => { const o = (Math.round(y) * img.width + Math.round(x)) * 4; return rgbToLab(img.data[o], img.data[o + 1], img.data[o + 2]); };
