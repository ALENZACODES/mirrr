/**
 * Save an edited photo the way the phone saves photos, all on the device.
 *
 *  - iPhone and Android: the Web Share API with a File, so iPhone offers "Save Image" into Photos and
 *    Android can save to Gallery or Photos. Anywhere else, or when sharing files is not supported,
 *    a normal download.
 *  - Full resolution and the photo's upright orientation, as a JPEG at quality 0.92, named the way
 *    the camera names photos: IMG_YYYYMMDD_HHMMSS.jpg (iPhone and most Android), PXL_YYYYMMDD_HHMMSSmmm.jpg
 *    on a Pixel.
 *  - The user's own EXIF is copied from the original file into the export, byte for byte, with only
 *    what must change to stay true: Orientation becomes 1 (the pixels are already upright, so keeping
 *    6 or 8 would turn the photo twice), the pixel dimensions follow the export, and the embedded
 *    thumbnail is dropped (it would still show the unedited photo). Nothing is added: no camera, no
 *    date, no software tag the photo did not have. Photos without EXIF are saved without it.
 *  - Browsers cannot write HEIC, so the export is always JPEG. EXIF is read from JPEG originals; a
 *    HEIC, PNG or WebP original is saved without camera metadata rather than with invented metadata.
 *
 * The byte functions work on Uint8Array and run the same in the page and in Node tests.
 */

export const JPEG_QUALITY = 0.92;
/** iOS Safari refuses canvases above about 16.7 million pixels. */
export const MAX_CANVAS_PIXELS = 16_777_216;

// ---- device and names ------------------------------------------------------------------------------
export function detectPlatform({ userAgent = '', maxTouchPoints = 0, platform = '' } = {}) {
  if (/iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1 && !/Android/i.test(userAgent))) return 'ios';
  if (/Android/i.test(userAgent)) return /Pixel/i.test(userAgent) ? 'pixel' : 'android';
  return /iPhone|iPad/i.test(platform) ? 'ios' : 'other';
}

const pad = (n, w = 2) => String(n).padStart(w, '0');
/** Camera-style file name for the device, from a local Date. */
export function cameraFileName(platform, date = new Date()) {
  const d = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const t = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  if (platform === 'pixel') return `PXL_${d}_${t}${pad(date.getMilliseconds(), 3)}.jpg`;
  return `IMG_${d}_${t}.jpg`;
}

// ---- JPEG structure ----------------------------------------------------------------------------------
/** Marker segments before the image data: [{ marker, start, end }] (end exclusive, includes header). */
export function jpegSegments(bytes) {
  if (!(bytes?.[0] === 0xff && bytes[1] === 0xd8)) return null;
  const out = []; let i = 2;
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xff) return out;
    let m = bytes[i + 1];
    while (m === 0xff && i + 2 < bytes.length) { i++; m = bytes[i + 1]; }
    if (m === 0xd9 || m === 0xda) { out.push({ marker: m, start: i, end: bytes.length }); return out; }
    if (m >= 0xd0 && m <= 0xd7) { i += 2; continue; }
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    out.push({ marker: m, start: i, end: i + 2 + len });
    i += 2 + len;
  }
  return out;
}

/** { width, height } from the JPEG frame header. */
export function jpegSize(bytes) {
  for (const s of jpegSegments(bytes) ?? []) {
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(s.marker)) {
      return { height: (bytes[s.start + 5] << 8) | bytes[s.start + 6], width: (bytes[s.start + 7] << 8) | bytes[s.start + 8] };
    }
  }
  return null;
}

const isExif = (bytes, s) => s.marker === 0xe1 && bytes[s.start + 4] === 0x45 && bytes[s.start + 5] === 0x78 && bytes[s.start + 6] === 0x69 && bytes[s.start + 7] === 0x66 && bytes[s.start + 8] === 0 && bytes[s.start + 9] === 0;

/** The original APP1 Exif segment (marker included), or null. */
export function extractExif(bytes) {
  const seg = (jpegSegments(bytes) ?? []).find(s => isExif(bytes, s));
  return seg ? bytes.slice(seg.start, seg.end) : null;
}

// ---- TIFF/EXIF reading and the few in-place edits ---------------------------------------------------
const TIFF = 10; // offset of the TIFF header inside the APP1 segment
function tiff(app1) {
  const v = new DataView(app1.buffer, app1.byteOffset, app1.byteLength);
  const le = v.getUint16(TIFF) === 0x4949;
  const u16 = o => v.getUint16(TIFF + o, le), u32 = o => v.getUint32(TIFF + o, le);
  return { v, le, u16, u32, size: app1.byteLength - TIFF };
}
function entries(t, ifd) {
  if (!ifd || ifd + 2 > t.size) return [];
  const n = t.u16(ifd), out = [];
  for (let i = 0; i < n; i++) { const o = ifd + 2 + i * 12; if (o + 12 > t.size) break; out.push({ o, tag: t.u16(o), type: t.u16(o + 2), count: t.u32(o + 4) }); }
  return out;
}
const SIZES = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
function valueOf(t, e) {
  const bytes = (SIZES[e.type] ?? 1) * e.count, at = bytes <= 4 ? e.o + 8 : t.u32(e.o + 8);
  if (e.type === 2) { let s = ''; for (let i = 0; i < e.count - 1 && at + i < t.size; i++) s += String.fromCharCode(t.v.getUint8(TIFF + at + i)); return s; }
  if (e.type === 3) return t.u16(at);
  if (e.type === 4 || e.type === 9) return t.u32(at);
  return null;
}
const TAGS = { 0x010f: 'make', 0x0110: 'model', 0x0112: 'orientation', 0x0132: 'dateTime', 0x0131: 'software', 0x9003: 'dateTimeOriginal', 0x9004: 'dateTimeDigitized', 0xa002: 'pixelX', 0xa003: 'pixelY', 0x829a: 'exposureTime', 0x8827: 'iso', 0x920a: 'focalLength', 0xa434: 'lensModel' };

/** The readable fields of an APP1 Exif segment, plus whether it carries a thumbnail IFD. */
export function readExif(app1) {
  if (!app1) return null;
  const t = tiff(app1), out = {};
  const ifd0 = t.u32(4), e0 = entries(t, ifd0);
  for (const e of e0) if (TAGS[e.tag]) out[TAGS[e.tag]] = valueOf(t, e);
  const exifPtr = e0.find(e => e.tag === 0x8769);
  if (exifPtr) for (const e of entries(t, valueOf(t, exifPtr))) if (TAGS[e.tag]) out[TAGS[e.tag]] = valueOf(t, e);
  const next = ifd0 + 2 + e0.length * 12;
  out.hasThumbnail = next + 4 <= t.size && t.u32(next) !== 0;
  out.tags = e0.map(e => e.tag);
  return out;
}

/**
 * The original Exif, ready for the edited file: a copy with Orientation set to 1, the pixel
 * dimensions set to the export's (only where those tags already exist), and the thumbnail IFD
 * unlinked. Every other byte is the user's own.
 */
export function exifForExport(app1, { width, height } = {}) {
  if (!app1) return null;
  const out = app1.slice(), t = tiff(out);
  const set = (e, val) => { if (e.type === 3) t.v.setUint16(TIFF + e.o + 8, val, t.le); else if (e.type === 4) t.v.setUint32(TIFF + e.o + 8, val, t.le); };
  const ifd0 = t.u32(4), e0 = entries(t, ifd0);
  for (const e of e0) if (e.tag === 0x0112 && e.count === 1) set(e, 1);
  const exifPtr = e0.find(e => e.tag === 0x8769);
  if (exifPtr && width && height) for (const e of entries(t, valueOf(t, exifPtr))) {
    if (e.tag === 0xa002 && e.count === 1) set(e, width);
    if (e.tag === 0xa003 && e.count === 1) set(e, height);
  }
  const next = ifd0 + 2 + e0.length * 12;
  if (next + 4 <= t.size) t.v.setUint32(TIFF + next, 0, t.le);
  return out;
}

/** The JPEG with the Exif segment placed right after SOI (any Exif or JFIF APP0 in it removed). */
export function insertExif(jpeg, app1) {
  if (!app1) return jpeg;
  const segs = jpegSegments(jpeg); if (!segs || !segs.length) return jpeg;
  const parts = [jpeg.subarray(0, 2), app1];
  for (const seg of segs) if (!(isExif(jpeg, seg) || seg.marker === 0xe0)) parts.push(jpeg.subarray(seg.start, seg.end));
  const out = new Uint8Array(parts.reduce((n, x) => n + x.length, 0)); let o = 0;
  for (const x of parts) { out.set(x, o); o += x.length; }
  return out;
}

/** Edited JPEG bytes plus the user's own (adjusted) Exif from the original file bytes, if it had any. */
export function withOriginalExif(editedJpeg, originalBytes) {
  const app1 = originalBytes ? extractExif(originalBytes) : null;
  if (!app1) return { bytes: editedJpeg, exif: null };
  const size = jpegSize(editedJpeg);
  const fixed = exifForExport(app1, size ?? {});
  return { bytes: insertExif(editedJpeg, fixed), exif: readExif(fixed) };
}

// ---- saving -------------------------------------------------------------------------------------------
/**
 * Hand the file to the phone's share sheet (iPhone: Save Image; Android: Gallery/Photos) when the
 * device is a phone and can share files; otherwise download it. Returns 'share', 'cancelled' or
 * 'download'. nav and doc are injectable for tests.
 */
export async function savePhotoFile(file, { nav = globalThis.navigator, doc = globalThis.document, platform } = {}) {
  const p = platform ?? detectPlatform(nav ?? {});
  if ((p === 'ios' || p === 'android' || p === 'pixel') && typeof nav?.share === 'function' && nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file] }); return 'share'; }
    catch (e) { if (e?.name === 'AbortError') return 'cancelled'; /* fall through to a download */ }
  }
  const url = URL.createObjectURL(file);
  const a = doc.createElement('a'); a.href = url; a.download = file.name; a.rel = 'noopener';
  doc.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000)?.unref?.();
  return 'download';
}

/**
 * Canvas (already holding the full-resolution edit) -> phone-style JPEG File with the original's
 * Exif. Browser only (needs canvas.toBlob).
 */
export async function canvasToPhotoFile(canvas, { originalBytes = null, platform = 'other', date = new Date() } = {}) {
  const blob = await new Promise((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('Could not encode the photo'))), 'image/jpeg', JPEG_QUALITY));
  const edited = new Uint8Array(await blob.arrayBuffer());
  const { bytes, exif } = withOriginalExif(edited, originalBytes);
  return { file: new File([bytes], cameraFileName(platform, date), { type: 'image/jpeg', lastModified: date.getTime() }), exif, size: jpegSize(bytes) };
}
