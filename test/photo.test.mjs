/**
 * Photo engine, palettes and phone-style saving. Pure Node: the engine and the save helpers work on
 * plain pixel and byte buffers, so the same code that runs in the page is tested here.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { rgbToLab, labToRgb, hexToLab, deltaE2000, findFace, applyLook, recolourHair, scaleFace, blur } from '../public/photo-engine.js';
import { detectPlatform, cameraFileName, jpegSegments, jpegSize, extractExif, readExif, exifForExport, insertExif, withOriginalExif, savePhotoFile } from '../public/photo-save.js';
import { photoPalette, photoLooks, paletteFromPicture, linerStyle, lipFinish } from '../src/photo/palette.js';
import { LOOKS } from '../src/look_engine.js';

// ---- a synthetic portrait: skin, two eyes, brows, lips, hair, grey background, with grain ---------
function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }
function portrait(skinHex, { w = 480, h = 600, lipHex = null, seed = 7 } = {}) {
  const r = rand(seed), data = new Uint8ClampedArray(w * h * 4), skin = hexToLab(skinHex);
  const lip = lipHex ? hexToLab(lipHex) : [Math.max(10, skin[0] - 8), skin[1] + 14, skin[2] - 2];
  const cx = w / 2, eyeY = h * 0.42, d = w * 0.2;
  const put = (k, L, a, b) => { const c = labToRgb(L, a, b); data[k * 4] = c[0]; data[k * 4 + 1] = c[1]; data[k * 4 + 2] = c[2]; data[k * 4 + 3] = 255; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = y * w + x, n = (r() - 0.5) * 3;
    let L = 78 + n, a = 0, b = 0; // background
    const fu = (x - cx) / (d * 1.25), fv = (y - h * 0.5) / (d * 1.75);
    const inHair = ((x - cx) / (d * 1.45)) ** 2 + ((y - h * 0.36) / (d * 1.6)) ** 2 < 1 && y < h * 0.4;
    if (inHair) { L = 12 + n; a = 1; b = 2; }
    if (fu * fu + fv * fv < 1) { const shade = 1 - 0.12 * Math.abs(fu); L = skin[0] * shade + n; a = skin[1]; b = skin[2]; }
    for (const s of [-1, 1]) {
      const ex = cx + s * d / 2;
      if (((x - ex) / (d * 0.2)) ** 2 + ((y - eyeY) / (d * 0.08)) ** 2 < 1) { const iris = ((x - ex) / (d * 0.07)) ** 2 + ((y - eyeY) / (d * 0.07)) ** 2 < 1; L = iris ? 15 + n : 88 + n; a = 0; b = iris ? 8 : 1; }
      if (((x - ex) / (d * 0.24)) ** 2 + ((y - (eyeY - d * 0.34)) / (d * 0.045)) ** 2 < 1) { L = 18 + n; a = 2; b = 4; }
    }
    const my = eyeY + d * 1.08;
    const up = ((x - cx) / (d * 0.36)) ** 2 + ((y - (my - d * 0.06)) / (d * 0.07)) ** 2 < 1 && y < my;
    const dn = ((x - cx) / (d * 0.34)) ** 2 + ((y - (my + d * 0.07)) / (d * 0.09)) ** 2 < 1 && y >= my;
    if (up || dn) { L = lip[0] + n; a = lip[1]; b = lip[2]; }
    if (Math.abs(y - my) < 1.5 && Math.abs(x - cx) < d * 0.34) { L = Math.max(4, lip[0] - 22); a = lip[1] * 0.6; b = lip[2]; }
    put(k, L, a, b);
  }
  return { width: w, height: h, data, truth: { eyes: [[cx - d / 2, eyeY], [cx + d / 2, eyeY]], mouthY: eyeY + d * 1.08, d } };
}
const TONES = { light: '#e8c4a8', medium: '#b07a55', deep: '#4a2c20' };
const copy = img => ({ width: img.width, height: img.height, data: new Uint8ClampedArray(img.data) });
const hueOf = ([, a, b]) => (Math.atan2(b, a) * 180) / Math.PI;

test('Lab round trip is lossless to one level across the sRGB cube', () => {
  let worst = 0;
  for (let r = 0; r < 256; r += 15) for (let g = 0; g < 256; g += 15) for (let b = 0; b < 256; b += 15) {
    const back = labToRgb(...rgbToLab(r, g, b));
    worst = Math.max(worst, Math.abs(back[0] - r), Math.abs(back[1] - g), Math.abs(back[2] - b));
  }
  assert.ok(worst <= 1, `worst channel error ${worst}`);
});

test('out-of-gamut colours keep their hue instead of clipping toward another hue', () => {
  const [L, a, b] = [40, 90, 60];
  const rgb = labToRgb(L, a, b), back = rgbToLab(...rgb);
  assert.ok(Math.abs(hueOf(back) - hueOf([L, a, b])) < 3, `hue moved ${hueOf(back)} vs ${hueOf([L, a, b])}`);
  assert.ok(Math.abs(back[0] - L) < 2.5, 'lightness kept');
});

test('delta E 2000 matches a published pair', () => {
  // Sharma et al. test data, pair 1: 2.0425
  assert.ok(Math.abs(deltaE2000([50, 2.6772, -79.7751], [50, 0, -82.7485]) - 2.0425) < 1e-3);
});

for (const [tone, hex] of Object.entries(TONES)) {
  test(`finds the eyes and mouth on a ${tone} synthetic portrait`, () => {
    const img = portrait(hex), f = findFace(img);
    assert.equal(f.ok, true, f.reason);
    const tol = img.truth.d * 0.12;
    const [L, R] = img.truth.eyes;
    assert.ok(Math.abs(f.frame.ox - (L[0] + R[0]) / 2) < tol && Math.abs(f.frame.oy - L[1]) < tol, 'eye midpoint');
    assert.ok(Math.abs(f.frame.d - img.truth.d) < tol, `eye distance ${f.frame.d} vs ${img.truth.d}`);
    const mouthY = f.frame.oy + f.mouth.v * f.frame.d;
    assert.ok(Math.abs(mouthY - img.truth.mouthY) < img.truth.d * 0.25, `mouth ${mouthY} vs ${img.truth.mouthY}`);
  });

  test(`lipstick on ${tone} skin keeps the shade's hue (no maroon drift), keeps texture, and leaves the background alone`, () => {
    const img = portrait(hex), f = findFace(img), out = copy(img);
    const target = '#c1121f';
    applyLook(out, f, { lip: target, lipFinish: 'satin' }, { strength: 0.7 });
    const { width: w } = img, cx = Math.round(w / 2), my = Math.round(img.truth.mouthY), d = img.truth.d;
    const lab = (im, x, y) => { const o = (y * w + x) * 4; return rgbToLab(im.data[o], im.data[o + 1], im.data[o + 2]); };
    const samples = []; for (let x = cx - Math.round(d * 0.15); x <= cx + Math.round(d * 0.15); x += 2) samples.push(lab(out, x, my + Math.round(d * 0.07)));
    const mean = [0, 1, 2].map(i => samples.reduce((s, c) => s + c[i], 0) / samples.length);
    assert.ok(Math.abs(hueOf(mean) - hueOf(hexToLab(target))) < 8, `hue ${hueOf(mean).toFixed(1)} vs ${hueOf(hexToLab(target)).toFixed(1)}`);
    assert.ok(Math.hypot(mean[1], mean[2]) > 35, 'reads as a red, not brown');
    // grain survives: lightness still varies pixel to pixel inside the lip
    const Ls = samples.map(c => c[0]), m = Ls.reduce((a, b) => a + b, 0) / Ls.length;
    assert.ok(Math.sqrt(Ls.reduce((a, b) => a + (b - m) ** 2, 0) / Ls.length) > 0.3, 'texture kept');
    // nothing outside the face changes
    for (const [x, y] of [[5, 5], [w - 5, 5], [5, img.height - 5], [w - 5, img.height - 5]]) {
      const o = (y * w + x) * 4; assert.deepEqual([...out.data.slice(o, o + 4)], [...img.data.slice(o, o + 4)]);
    }
  });
}

test('the lip edge is feathered, not a hard cut', () => {
  const img = portrait(TONES.medium), f = findFace(img), out = copy(img);
  applyLook(out, f, { lip: '#6e1426' }, { strength: 1 });
  const { width: w } = img, cx = Math.round(w / 2);
  const diffAt = y => { const o = (y * w + cx) * 4; return Math.abs(out.data[o] - img.data[o]) + Math.abs(out.data[o + 1] - img.data[o + 1]) + Math.abs(out.data[o + 2] - img.data[o + 2]); };
  const col = []; for (let y = Math.round(img.truth.mouthY) - 40; y < img.truth.mouthY + 40; y++) col.push(diffAt(y));
  const max = Math.max(...col), steps = col.slice(1).map((v, i) => Math.abs(v - col[i]));
  assert.ok(max > 40, 'lips changed');
  assert.ok(Math.max(...steps) < max * 0.85, 'no single-pixel jump from untouched to full colour');
});

test('applyLook and recolourHair say no face rather than paint blind', () => {
  const flat = { width: 200, height: 200, data: new Uint8ClampedArray(200 * 200 * 4).fill(128) };
  const f = findFace(flat);
  assert.equal(f.ok, false); assert.match(f.reason, /face|skin|photo/i);
  assert.equal(applyLook(copy(flat), f, { lip: '#c1121f' }).changed, 0);
  assert.equal(recolourHair(copy(flat), f, '#a0522d').changed, 0);
});

test('hair colour changes the hair, not the skin or the background', () => {
  const img = portrait(TONES.deep), f = findFace(img), out = copy(img);
  const r = recolourHair(out, f, '#a0522d', { strength: 0.8 });
  assert.ok(r.hairPixels > 500, `hair found: ${r.hairPixels}`);
  const { width: w } = img, at = (im, x, y) => { const o = (y * w + x) * 4; return rgbToLab(im.data[o], im.data[o + 1], im.data[o + 2]); };
  const hairY = Math.round(img.height * 0.2), cx = Math.round(w / 2);
  assert.ok(deltaE2000(at(out, cx, hairY), at(img, cx, hairY)) > 5, 'hair recoloured');
  const cheek = [cx + Math.round(img.truth.d * 0.5), Math.round(img.truth.mouthY - img.truth.d * 0.4)];
  assert.ok(deltaE2000(at(out, ...cheek), at(img, ...cheek)) < 2, 'skin untouched');
});

// ---- realism: the person's own surface must survive every layer (texture, freckles, light) --------
const freckled = (hex) => {
  const img = portrait(hex), { width: w } = img, d = img.truth.d, r = rand(99), spots = [];
  for (let i = 0; i < 40; i++) {
    const x = Math.round(w / 2 + (r() - 0.5) * d * 1.4), y = Math.round(img.truth.eyes[0][1] + d * (0.45 + r() * 0.35));
    spots.push([x, y]);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const o = ((y + dy) * w + x + dx) * 4; const c = rgbToLab(img.data[o], img.data[o + 1], img.data[o + 2]); const q = labToRgb(c[0] - 9, c[1] + 4, c[2] + 6); img.data[o] = q[0]; img.data[o + 1] = q[1]; img.data[o + 2] = q[2]; }
  }
  return { img, spots };
};
const contrastAt = (im, [x, y]) => { const w = im.width, L = (xx, yy) => { const o = (yy * w + xx) * 4; return rgbToLab(im.data[o], im.data[o + 1], im.data[o + 2]); }; const c = L(x, y), ring = [L(x - 4, y), L(x + 4, y), L(x, y - 4), L(x, y + 4)]; return [0, 1, 2].map(i => ring.reduce((s, v) => s + v[i], 0) / 4 - c[i]); };

for (const [tone, hex] of Object.entries(TONES)) {
  test(`base and blush keep the person's own freckles and moles on ${tone} skin (no donor-smooth skin)`, () => {
    const { img, spots } = freckled(hex), f = findFace(img), out = copy(img);
    applyLook(out, f, { baseFinish: 'matte', blush: '#d9706a' }, { strength: 1 });
    let before = 0, after = 0, chromaB = 0, chromaA = 0;
    for (const p of spots) { const a = contrastAt(img, p), b = contrastAt(out, p); before += a[0]; after += b[0]; chromaB += Math.hypot(a[1], a[2]); chromaA += Math.hypot(b[1], b[2]); }
    assert.ok(after > before * 0.85, `freckle lightness contrast kept: ${(after / before).toFixed(2)}`);
    assert.ok(chromaA > chromaB * 0.75, `freckle colour kept: ${(chromaA / chromaB).toFixed(2)}`);
  });
}

test('liner follows the photo\'s own lash line and is opaque in its core', () => {
  const img = portrait(TONES.medium), f = findFace(img), out = copy(img);
  applyLook(out, f, { liner: '#111111', linerStyle: 'wing' }, { strength: 0.7 });
  const { width: w } = img, [ex, ey] = img.truth.eyes[0], d = img.truth.d;
  // darkest changed pixel in the column through the eye's centre sits at the top edge of the eye
  let best = -1, by = 0;
  for (let y = Math.round(ey - d * 0.3); y < ey; y++) { const o = (y * w + Math.round(ex)) * 4; const dd = Math.abs(out.data[o] - img.data[o]) + Math.abs(out.data[o + 1] - img.data[o + 1]) + Math.abs(out.data[o + 2] - img.data[o + 2]); if (dd > best) { best = dd; by = y; } }
  assert.ok(Math.abs(by - (ey - d * 0.08)) < d * 0.06, `liner at ${by}, eye top ${ey - d * 0.08}`);
  const o = (by * w + Math.round(ex)) * 4; assert.ok(rgbToLab(out.data[o], out.data[o + 1], out.data[o + 2])[0] < 22, 'liner core is dark, not a grey wash');
});

test('hair dye keeps the depth between strands (shadows lift less than lit hair)', () => {
  const img = portrait(TONES.deep), w = img.width;
  for (let y = 20; y < img.height * 0.3; y++) for (let x = 0; x < w; x++) if ((x >> 2) % 2) { const o = (y * w + x) * 4; const c = rgbToLab(img.data[o], img.data[o + 1], img.data[o + 2]); if (c[0] < 20) { const q = labToRgb(6, 1, 1); img.data[o] = q[0]; img.data[o + 1] = q[1]; img.data[o + 2] = q[2]; } }
  const f = findFace(img), out = copy(img); recolourHair(out, f, '#b5562a', { strength: 0.7 });
  const y = Math.round(img.height * 0.2), Lat = (im, x) => { const o = (y * w + x) * 4; return rgbToLab(im.data[o], im.data[o + 1], im.data[o + 2])[0]; };
  let gap0 = 0, gap1 = 0, nn = 0; for (let x = w / 2 - 40; x < w / 2 + 40; x += 8) { gap0 += Lat(img, x) - Lat(img, x + 4); gap1 += Lat(out, x) - Lat(out, x + 4); nn++; }
  assert.ok(Math.abs(gap1) > Math.abs(gap0) * 0.8, `strand contrast kept: ${(gap1 / gap0).toFixed(2)}`);
});

test('the face found on a preview scales to the full-size photo', () => {
  const f = findFace(portrait(TONES.light)), g = scaleFace(f, 4);
  assert.equal(g.width, f.width * 4); assert.equal(g.frame.d, f.frame.d * 4); assert.deepEqual(g.mouth, f.mouth);
});

test('blur keeps a flat field flat and spreads a step', () => {
  const w = 20, h = 1, step = Float32Array.from({ length: w }, (_, i) => (i < 10 ? 0 : 1));
  const b = blur(step, w, h, 2);
  assert.ok(b[9] > 0 && b[9] < 1 && b[0] === 0 && b[w - 1] === 1);
});

// ---- palettes --------------------------------------------------------------------------------------
test('every look has a usable photo palette, built from its own products', () => {
  const hex = /^#[0-9a-f]{6}$/;
  for (const l of LOOKS) {
    const p = photoPalette(l.id, '6b4430');
    assert.ok(p, l.id); assert.match(p.lip, hex); assert.ok(p.lid.length >= 1 && p.lid.every(c => hex.test(c)), l.id);
    assert.ok(p.liner === null || hex.test(p.liner)); assert.match(p.blush, hex);
    assert.ok(['matte', 'satin', 'gloss', 'shine'].includes(p.lipFinish)); assert.ok(p.intensity >= 0.2 && p.intensity <= 1);
  }
  assert.equal(photoPalette('no_such_look'), null);
  assert.equal(photoLooks().length, LOOKS.length);
  const red = photoPalette('chinese_new_year'); assert.equal(red.lipFinish, 'gloss');
  assert.ok(hueOf(hexToLab(red.lip)) < 45 && hueOf(hexToLab(red.lip)) > 15, 'bold glossy red is a red');
});

test('nudes follow the user\'s own skin colour', () => {
  const light = photoPalette('clean_minimal', 'e8c4a8').lip, deep = photoPalette('clean_minimal', '4a2c20').lip;
  assert.notEqual(light, deep);
  assert.ok(hexToLab(light)[0] > hexToLab(deep)[0]);
});

test('studio pictures become checked palettes; bad colours are dropped', () => {
  const p = paletteFromPicture({ lip: '#C1121F', lid: [{ hex: '#a0522d' }, 'nope', '#111111'], liner: 'wing', linerColour: 'red', blush: 'javascript:', intensity: 7 });
  assert.equal(p.lip, '#c1121f'); assert.deepEqual(p.lid, ['#a0522d', '#111111']); assert.equal(p.liner, '#111111');
  assert.equal(p.linerStyle, 'wing'); assert.equal(p.blush, null); assert.equal(p.intensity, 1);
  assert.equal(linerStyle('graphic geometric art'), 'graphic'); assert.equal(lipFinish('jelly gloss'), 'gloss'); assert.equal(lipFinish('matte or satin'), 'satin');
});

// ---- saving like the phone -------------------------------------------------------------------------
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const PIXEL = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';
const GALAXY = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';

test('detects iPhone, iPad, Pixel and other Android', () => {
  assert.equal(detectPlatform({ userAgent: IPHONE }), 'ios');
  assert.equal(detectPlatform({ userAgent: IPAD, maxTouchPoints: 5 }), 'ios');
  assert.equal(detectPlatform({ userAgent: IPAD, maxTouchPoints: 0 }), 'other');
  assert.equal(detectPlatform({ userAgent: PIXEL }), 'pixel');
  assert.equal(detectPlatform({ userAgent: GALAXY }), 'android');
});

test('camera-style file names', () => {
  const d = new Date(2026, 9, 30, 7, 5, 9, 42);
  assert.equal(cameraFileName('ios', d), 'IMG_20261030_070509.jpg');
  assert.equal(cameraFileName('android', d), 'IMG_20261030_070509.jpg');
  assert.equal(cameraFileName('pixel', d), 'PXL_20261030_070509042.jpg');
});

// A camera-like original: Exif APP1 (big- or little-endian TIFF) with IFD0, Exif IFD and a thumbnail IFD1.
function exifSegment({ le = false, orientation = 6, make = 'Apple', model = 'iPhone 15', dto = '2026:10:29 18:42:07', px = 4032, py = 3024 } = {}) {
  const t = []; const u16 = v => (le ? [v & 255, v >> 8] : [v >> 8, v & 255]); const u32 = v => (le ? [v & 255, (v >> 8) & 255, (v >> 16) & 255, v >>> 24] : [v >>> 24, (v >> 16) & 255, (v >> 8) & 255, v & 255]);
  const str = s => [...Buffer.from(s + '\0', 'latin1')];
  // layout: header(8) IFD0 at 8 with 4 entries -> 2+48+4=54 -> data at 62; ExifIFD; IFD1
  const makeB = str(make), modelB = str(model), dtoB = str(dto);
  const ifd0 = 8, ifd0Len = 2 + 4 * 12 + 4, data0 = ifd0 + ifd0Len, makeAt = data0, modelAt = makeAt + makeB.length;
  const exifIfd = modelAt + modelB.length + ((modelAt + modelB.length) % 2), exifLen = 2 + 3 * 12 + 4, dtoAt = exifIfd + exifLen;
  const ifd1 = dtoAt + dtoB.length + ((dtoAt + dtoB.length) % 2);
  t.push(...(le ? [0x49, 0x49] : [0x4d, 0x4d]), ...u16(42), ...u32(ifd0));
  t.push(...u16(4));
  t.push(...u16(0x010f), ...u16(2), ...u32(makeB.length), ...u32(makeAt));
  t.push(...u16(0x0110), ...u16(2), ...u32(modelB.length), ...u32(modelAt));
  t.push(...u16(0x0112), ...u16(3), ...u32(1), ...u16(orientation), 0, 0);
  t.push(...u16(0x8769), ...u16(4), ...u32(1), ...u32(exifIfd));
  t.push(...u32(ifd1));
  t.push(...makeB, ...modelB); while (t.length < exifIfd) t.push(0);
  t.push(...u16(3));
  t.push(...u16(0x9003), ...u16(2), ...u32(dtoB.length), ...u32(dtoAt));
  t.push(...u16(0xa002), ...u16(4), ...u32(1), ...u32(px));
  t.push(...u16(0xa003), ...u16(3), ...u32(1), ...u16(py), 0, 0);
  t.push(...u32(0));
  t.push(...dtoB); while (t.length < ifd1) t.push(0);
  t.push(...u16(1), ...u16(0x0103), ...u16(3), ...u32(1), ...u16(6), 0, 0, ...u32(0)); // IFD1: Compression=6 (thumbnail)
  const body = [0x45, 0x78, 0x69, 0x66, 0, 0, ...t];
  return Uint8Array.from([0xff, 0xe1, (body.length + 2) >> 8, (body.length + 2) & 255, ...body]);
}
// A canvas-like JPEG: SOI, JFIF APP0, DQT, SOF0 (dims), SOS + scan bytes, EOI.
function canvasJpeg(w, h) {
  const app0 = [0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0];
  const dqt = [0xff, 0xdb, 0, 67, 0, ...Array(64).fill(1)];
  const sof = [0xff, 0xc0, 0, 17, 8, h >> 8, h & 255, w >> 8, w & 255, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1];
  const sos = [0xff, 0xda, 0, 12, 3, 1, 0, 2, 0x11, 3, 0x11, 0, 63, 0, 0x12, 0x34, 0x56, 0xff, 0x00, 0x78];
  return Uint8Array.from([0xff, 0xd8, ...app0, ...dqt, ...sof, ...sos, 0xff, 0xd9]);
}
const withExif = (jpeg, app1) => Uint8Array.from([...jpeg.subarray(0, 2), ...app1, ...jpeg.subarray(2)]);

for (const le of [false, true]) {
  test(`EXIF round-trips into the edited JPEG (${le ? 'little' : 'big'}-endian), with only orientation, size and thumbnail adjusted`, () => {
    const original = withExif(canvasJpeg(3024, 4032), exifSegment({ le }));
    const before = readExif(extractExif(original));
    assert.equal(before.orientation, 6); assert.equal(before.hasThumbnail, true);
    const edited = canvasJpeg(3024, 4032);
    const { bytes, exif } = withOriginalExif(edited, original);
    const after = readExif(extractExif(bytes));
    for (const k of ['make', 'model', 'dateTimeOriginal']) assert.equal(after[k], before[k], k);
    assert.equal(after.orientation, 1, 'pixels are already upright');
    assert.equal(after.pixelX, 3024); assert.equal(after.pixelY, 4032);
    assert.equal(after.hasThumbnail, false, 'old thumbnail would show the unedited photo');
    assert.deepEqual(after.tags, before.tags, 'no tag added or removed');
    assert.deepEqual(exif, after);
    assert.deepEqual(jpegSize(bytes), { width: 3024, height: 4032 }, 'dimensions unchanged');
    const segs = jpegSegments(bytes);
    assert.equal(segs[0].marker, 0xe1, 'Exif right after SOI'); assert.ok(!segs.some(s => s.marker === 0xe0), 'JFIF APP0 replaced');
    // image data identical
    const scan = b => b.subarray(jpegSegments(b).find(s => s.marker === 0xda).start);
    assert.deepEqual([...scan(bytes)], [...scan(edited)]);
    // the original is not modified
    assert.equal(readExif(extractExif(original)).orientation, 6);
  });
}

test('a photo with no EXIF is saved with none: nothing invented', () => {
  const edited = canvasJpeg(800, 600);
  const { bytes, exif } = withOriginalExif(edited, canvasJpeg(800, 600));
  assert.equal(exif, null); assert.deepEqual([...bytes], [...edited]);
  assert.equal(withOriginalExif(edited, null).exif, null);
  assert.equal(insertExif(edited, null), edited);
  assert.equal(exifForExport(null), null);
});

function fakeDom() {
  const clicks = [];
  return { clicks, doc: { createElement: () => ({ click() { clicks.push(this.download); }, remove() {} }), body: { appendChild() {} } } };
}
const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], 'IMG_20261030_070509.jpg', { type: 'image/jpeg' });

test('iPhone and Android use the share sheet with the file when it is supported', async () => {
  for (const platform of ['ios', 'android', 'pixel']) {
    const shared = []; const { doc, clicks } = fakeDom();
    const nav = { canShare: o => Array.isArray(o.files), share: async o => { shared.push(o); } };
    assert.equal(await savePhotoFile(file, { nav, doc, platform }), 'share');
    assert.equal(shared.length, 1); assert.equal(shared[0].files[0], file); assert.equal(clicks.length, 0);
  }
});

test('falls back to a download where sharing files is not supported, or on desktop', async () => {
  for (const [platform, nav] of [['ios', {}], ['android', { canShare: () => false, share: async () => {} }], ['other', { canShare: () => true, share: async () => { throw new Error('should not share on desktop'); } }]]) {
    const { doc, clicks } = fakeDom();
    assert.equal(await savePhotoFile(file, { nav, doc, platform }), 'download');
    assert.deepEqual(clicks, [file.name]);
  }
});

test('cancelling the share sheet does not also download; a share error does', async () => {
  const { doc, clicks } = fakeDom();
  const abort = Object.assign(new Error('cancel'), { name: 'AbortError' });
  assert.equal(await savePhotoFile(file, { nav: { canShare: () => true, share: async () => { throw abort; } }, doc, platform: 'ios' }), 'cancelled');
  assert.equal(clicks.length, 0);
  assert.equal(await savePhotoFile(file, { nav: { canShare: () => true, share: async () => { throw new Error('NotAllowed'); } }, doc, platform: 'ios' }), 'download');
  assert.equal(clicks.length, 1);
});
