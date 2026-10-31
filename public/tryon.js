/**
 * MIRRR live try-on: makeup, lashes and wigs on her own face, through the camera or a photo,
 * entirely in this browser tab. Frames never leave the device: the face tracker runs here (its
 * files download once), and MIRRR's server never sees the camera or the photo.
 *
 * Nothing starts on its own: the camera starts only when she taps "Start camera", every control
 * opens on "Choose…", and leaving the view switches the camera off.
 */
import {
  LIPS_OUTER, LIPS_INNER, EYE, toPixels, bbox, smoothClosed, smoothOpen, eyeOpenness, headPose,
  lashLine, wingTip, lidPolygon, browPolygon, blushEllipse, wigAffine, LandmarkSmoother, FACE_OVAL,
  hexToRgb, tintPixel, browPixel, maskedMeanL, lightnessDetail,
} from './tryon-geometry.js';
import { MODEL_FACES } from './model-faces.js';

const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
// Hair/background segmenter, loaded only when she picks a wig, so her own hair can be hidden where the wig does not cover it.
const SEG_MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';

// Colour words the MIRRR guides use (the same swatches as the Colour & Lip Studio). Swatches, not product shades.
const LIP = [['Nude-pink', '#d9a3a0'], ['Dusty rose', '#c48b8b'], ['Mauve', '#b07a8c'], ['Caramel', '#b5733c'], ['Toffee', '#9a5b2e'], ['Mocha', '#7a4e36'], ['Terracotta', '#c0603d'], ['Coral', '#f07c5f'], ['Classic red', '#c0202a'], ['Blue-red', '#b0213f'], ['Brick red', '#9c3426'], ['Berry', '#8e2f5a'], ['Fuchsia', '#c8227a'], ['Plum', '#6e2f55'], ['Wine', '#62182f'], ['Oxblood', '#5a1a1f'], ['Chocolate', '#5a3020']];
const LIP_FINISH = [['creme', 'Creme'], ['gloss', 'Gloss'], ['matte', 'Matte']];
const LINER = [['#141414', 'Black kohl'], ['#3b2016', 'Dark chocolate'], ['#1d2a5b', 'Navy'], ['#1f4d2b', 'Forest green'], ['#6e2f55', 'Plum']];
const LINER_STYLE = [['tight', 'Upper lash line'], ['kohl', 'Kohl, upper and lower'], ['wing', 'Winged']];
const LASHES = [['natural', 'Natural'], ['wispy', 'Wispy'], ['dramatic', 'Dramatic']];
const BROW = [['#141414', 'Soft black'], ['#3b2016', 'Dark brown'], ['#6b4030', 'Warm brown'], ['#8d7b6d', 'Taupe']];
const BLUSH = [['#f4ae86', 'Peach'], ['#f07c5f', 'Coral'], ['#d9798a', 'Rose'], ['#8e2f5a', 'Berry'], ['#c0603d', 'Terracotta'], ['#a8432a', 'Brick']];
const SHADOW = [['#a8743a', 'Bronze'], ['#d9aa4c', 'Gold'], ['#b8693a', 'Copper'], ['#6e2f55', 'Plum'], ['#8d7b6d', 'Taupe'], ['#1f8a5b', 'Emerald']];
// Hair-only cutouts made from MIRRR's Wig Match portraits; the model's outer eye corners, forehead and chin in cutout pixels.
export const WIGS = [{"id":"blunt_lob","name":"Blunt Lob (Long Bob)","forehead":[219.9,130.5],"chin":[226.1,435.5],"right":[136.6,227.9],"left":[307.9,224.3]},{"id":"silk_press_natural","name":"Silk Press (Natural Hair)","forehead":[176.4,134.9],"chin":[199.3,392.7],"right":[122.7,220],"left":[266.8,212]},{"id":"sleek_bob","name":"Sleek Bob","forehead":[153.1,125.8],"chin":[133.3,380.7],"right":[84.2,200.5],"left":[225.5,213.8]},{"id":"bone_straight_long","name":"Bone Straight (Long)","forehead":[104,107.1],"chin":[166.4,284.1],"right":[89.9,177],"left":[179.8,143]},{"id":"curtain_bang_layers","name":"Curtain-Bang Silk Layers","forehead":[126.1,86.6],"chin":[178.5,244.9],"right":[113.3,150.4],"left":[191.6,121.3]},{"id":"loose_deep_wave","name":"Loose Deep Wave","forehead":[136,90.6],"chin":[182.8,240.1],"right":[123.1,148.2],"left":[196.4,123.6]},{"id":"water_wave","name":"Water Wave","forehead":[165.9,88.2],"chin":[210.5,238.2],"right":[152.9,146.8],"left":[225.8,121]},{"id":"highlighted_balayage","name":"Balayage / Highlighted","forehead":[227.6,70.6],"chin":[175.1,229.9],"right":[175.5,112.6],"left":[263,136]},{"id":"kinky_coily_afro","name":"Kinky Coily Afro","forehead":[230,248.4],"chin":[244.3,519.5],"right":[159.4,339.1],"left":[315.3,331.1]},{"id":"big_chop_fro","name":"Big Chop Fro","forehead":[204.4,141.5],"chin":[209.6,428.9],"right":[116.3,238.1],"left":[284.9,233.1]},{"id":"twist_out_natural","name":"Twist-Out Natural","forehead":[163.8,142],"chin":[217,387.4],"right":[124.5,234.5],"left":[257.9,205.3]},{"id":"butterfly_locs","name":"Butterfly Locs","forehead":[186.2,107.6],"chin":[196.6,347.4],"right":[134,190.9],"left":[265.7,181.2]},{"id":"faux_locs","name":"Faux Locs (Long)","forehead":[226.7,87.4],"chin":[233.4,300.8],"right":[175.5,161.9],"left":[295.3,154.5]},{"id":"sister_locs","name":"Sisterlocks / Micro Locs","forehead":[156.2,141.2],"chin":[236.8,357],"right":[138.2,227.2],"left":[251.8,188]},{"id":"senegalese_twists","name":"Senegalese Twists","forehead":[208.1,97.5],"chin":[215.5,343.1],"right":[150,180],"left":[286.7,176.2]},{"id":"passion_twists","name":"Passion Twists","forehead":[164.1,101.6],"chin":[215.4,253.2],"right":[152.4,161.8],"left":[226.9,133]},{"id":"jumbo_box_braids","name":"Jumbo Box Braids","forehead":[167,121.6],"chin":[229.8,326.9],"right":[148.5,201.7],"left":[248.8,164.6]},{"id":"fulani_braids","name":"Fulani Braids","forehead":[124.4,127.8],"chin":[198,332],"right":[105.4,207.9],"left":[214,169.8]},{"id":"goddess_braids","name":"Goddess Braids","forehead":[91.9,125.4],"chin":[162.6,328.8],"right":[74.4,205.8],"left":[179.3,166.4]}];

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = {
  landmarker: null, mode: null, stream: null, video: null, photo: null, running: false, raf: 0,
  smoother: new LandmarkSmoother({ minCutoff: 1.0, beta: 0.03 }), lastTs: -1, frames: 0, fpsT: 0, fps: 0,
  scale: 1, wigImgs: {}, landmarks: null, mirrored: false, choice: {},
  segmenter: null, segLoading: null, segMode: null, hair: null, segFrame: 0,
};
const segIn = document.createElement('canvas'); const segInCtx = segIn.getContext('2d');
const work = document.createElement('canvas');
const wctx = work.getContext('2d', { willReadFrequently: true });
const layer = document.createElement('canvas');
const lctx = layer.getContext('2d');
const mask = document.createElement('canvas');
const mctx = mask.getContext('2d', { willReadFrequently: true });
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function select(id, label, values) {
  return `<label class="to-field" for="${id}"><span>${esc(label)}</span><select id="${id}"><option value="" disabled selected>Choose…</option><option value="none">None</option>${values.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></label>`;
}

function controls() {
  return `
    <fieldset class="to-group"><legend>Lips</legend>
      ${select('toLip', 'Lip colour', LIP.map(([l, h]) => [h, l]))}${select('toLipFinish', 'Lip finish', LIP_FINISH)}</fieldset>
    <fieldset class="to-group"><legend>Eyes</legend>
      ${select('toLiner', 'Liner / kohl colour', LINER)}${select('toLinerStyle', 'Liner style', LINER_STYLE)}
      ${select('toLashes', 'Lashes', LASHES)}${select('toShadow', 'Eyeshadow', SHADOW)}</fieldset>
    <fieldset class="to-group"><legend>Brows &amp; cheeks</legend>
      ${select('toBrow', 'Brow tint', BROW)}${select('toBlush', 'Blush', BLUSH)}</fieldset>
    <fieldset class="to-group"><legend>Wig</legend>
      ${select('toWig', 'Wig style', WIGS.map(w => [w.id, w.name]))}
      <p class="lib-note to-wig-note">Preview: placement follows your head; for an exact look see <a href="#" data-to-view="wig">Wig Match</a>. Wig shapes are cut from MIRRR's own wig photos. Your own hair outside the wig is softly painted over with the background behind you, on this device; some may still show.</p></fieldset>`;
}

function readChoice() {
  const v = id => { const x = $(id)?.value; return x && x !== 'none' ? x : null; };
  t.choice = {
    lip: v('toLip'), lipFinish: v('toLipFinish') ?? 'creme', liner: v('toLiner'), linerStyle: v('toLinerStyle') ?? 'tight',
    lashes: v('toLashes'), shadow: v('toShadow'), brow: v('toBrow'), blush: v('toBlush'), wig: v('toWig'),
  };
  if (t.choice.wig && !t.wigImgs[t.choice.wig]) {
    const img = new Image(); img.onload = () => { if (!t.running && t.photo) drawPhoto(); };
    img.src = `/tryon/wigs/${t.choice.wig}.webp`; t.wigImgs[t.choice.wig] = img;
  }
  if (t.choice.wig) {
    ensureSegmenter(t.running ? 'VIDEO' : 'IMAGE').then(sg => { if (sg && !t.running && t.photo && !t.hair) drawPhoto(); });
  }
  if (!t.running && t.photo) drawPhoto();
  renderShop();
}

function status(msg) { const s = $('toStatus'); if (s) s.textContent = msg; }

async function ensureLandmarker(mode) {
  if (!t.landmarker) {
    status('Loading the face tracker (about 4 MB, once). It runs on this device.');
    const vision = await import(`${VISION}/vision_bundle.mjs`);
    const files = await vision.FilesetResolver.forVisionTasks(`${VISION}/wasm`);
    t.vision = vision; t.files = files;
    const make = delegate => vision.FaceLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: mode, numFaces: 1,
      outputFaceBlendshapes: false, outputFacialTransformationMatrixes: false,
    });
    try { t.landmarker = await make('GPU'); } catch { t.landmarker = await make('CPU'); }
    t.mode = mode;
  }
  if (t.mode !== mode) { await t.landmarker.setOptions({ runningMode: mode }); t.mode = mode; }
  return t.landmarker;
}

async function startCamera() {
  stopCamera();
  if (!navigator.mediaDevices?.getUserMedia) { status('This browser cannot open a camera here. Use a photo instead.'); return; }
  try {
    status('Asking for your camera…');
    t.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } }, audio: false });
  } catch (e) { status('The camera did not start (' + (e?.name || 'blocked') + '). You can use a photo instead.'); return; }
  try { await ensureLandmarker('VIDEO'); } catch { status('The face tracker could not load. Check your connection and try again.'); stopCamera(); return; }
  t.video = t.video || document.createElement('video');
  Object.assign(t.video, { muted: true, playsInline: true, autoplay: true });
  t.video.setAttribute('playsinline', '');
  t.video.srcObject = t.stream; await t.video.play();
  t.photo = null; t.hair = null; t.mirrored = true; t.smoother.reset(); t.scale = 1;
  if (t.choice.wig) ensureSegmenter('VIDEO');
  $('toCanvas').classList.add('to-mirror');
  $('toStop').hidden = false; $('toSnap').disabled = false;
  t.running = true; status('Camera on. Everything is processed on this device; nothing is uploaded.');
  loop();
}

function stopCamera() {
  t.running = false; cancelAnimationFrame(t.raf);
  if (t.stream) { t.stream.getTracks().forEach(tr => tr.stop()); t.stream = null; }
  if (t.video) t.video.srcObject = null;
  const st = $('toStop'); if (st) st.hidden = true;
}

function sizeTo(w, h) {
  if (work.width !== w || work.height !== h) { work.width = layer.width = w; work.height = layer.height = h; const c = $('toCanvas'); c.width = w; c.height = h; }
}

function loop() {
  if (!t.running) return;
  const v = t.video;
  if (v.readyState >= 2 && v.videoWidth) {
    const w = Math.round(Math.min(960, v.videoWidth) * t.scale), h = Math.round(w * v.videoHeight / v.videoWidth);
    sizeTo(w, h);
    wctx.drawImage(v, 0, 0, w, h);
    const now = performance.now();
    if (now > t.lastTs) {
      t.lastTs = now;
      const r = t.landmarker.detectForVideo(v, now);
      const raw = r.faceLandmarks?.[0];
      t.landmarks = raw ? t.smoother.apply(raw, now / 1000) : null;
      if (!raw) t.smoother.reset();
      // Her own hair, a few times a second (less on a slow device), only while a wig is on.
      if (t.choice.wig && t.segmenter && t.segMode === 'VIDEO' && now - t.segFrame > Math.max(180, (t.segCost || 0) * 6)) {
        // A small copy of the frame is enough for a 256×256 model, and keeps the camera smooth.
        t.segFrame = now; segIn.width = 256; segIn.height = Math.round(256 * v.videoHeight / v.videoWidth);
        segInCtx.drawImage(v, 0, 0, segIn.width, segIn.height);
        const a0 = performance.now(); segmentHair(segIn, now); t.segCost = performance.now() - a0;
      }
    }
    paint(w, h);
    $('toCanvas').getContext('2d').drawImage(work, 0, 0);
    // Frame rate, and a lighter working size if this device is struggling.
    t.frames++;
    if (now - t.fpsT > 1000) {
      t.fps = Math.round(t.frames * 1000 / (now - t.fpsT)); t.frames = 0; t.fpsT = now;
      if (t.fps < 18 && t.scale > 0.55) t.scale = Math.max(0.55, t.scale - 0.15);
      $('toFps').textContent = `${t.fps} fps · ${w}×${h}${t.landmarks ? '' : ' · looking for a face'}`;
    }
  }
  t.raf = requestAnimationFrame(loop);
}

async function usePhoto(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  await useImage(url, 'Photo loaded on this device. Nothing is uploaded.');
}

/** A sample photo (MIRRR's own AI-generated model faces), for trying it with no camera and no upload. */
async function useSample(id) {
  const f = MODEL_FACES.find(x => x.id === id); if (!f) return;
  await useImage(f.src, 'Sample photo loaded. The makeup is drawn in this browser tab.');
}

async function useImage(src, okMsg) {
  stopCamera();
  const img = new Image(); img.src = src;
  try { await img.decode(); } catch { status('That file could not be opened as a photo.'); return; }
  try { await ensureLandmarker('IMAGE'); } catch { status('The face tracker could not load. Check your connection and try again.'); return; }
  const k = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
  sizeTo(w, h);
  t.photo = img; t.hair = null; t.mirrored = false; $('toCanvas').classList.remove('to-mirror');
  if (t.choice.wig) await ensureSegmenter('IMAGE');
  wctx.drawImage(img, 0, 0, w, h);
  const r = t.landmarker.detect(work);
  t.landmarks = r.faceLandmarks?.[0] ?? null;
  status(t.landmarks ? okMsg : 'No face found in that photo. Try a front-facing photo in good light.');
  $('toSnap').disabled = false;
  drawPhoto();
}

function drawPhoto() {
  const w = work.width, h = work.height;
  wctx.drawImage(t.photo, 0, 0, w, h);
  if (t.choice.wig && t.segmenter && !t.hair) segmentHair(work, 0);
  paint(w, h);
  $('toCanvas').getContext('2d').drawImage(work, 0, 0);
}


/** The hair segmenter (about 16 MB, once), loaded only after she picks a wig. Runs on this device. */
function ensureSegmenter(mode) {
  if (t.segmenter) {
    if (t.segMode !== mode) { t.segMode = mode; return t.segmenter.setOptions({ runningMode: mode }).then(() => t.segmenter); }
    return Promise.resolve(t.segmenter);
  }
  if (!t.segLoading) {
    t.segLoading = (async () => {
      if (!t.vision) return null;
      const make = delegate => t.vision.ImageSegmenter.createFromOptions(t.files, {
        baseOptions: { modelAssetPath: SEG_MODEL, delegate }, runningMode: mode, outputConfidenceMasks: true, outputCategoryMask: false,
      });
      t.segmenter = await make('CPU'); // a 256×256 model: CPU is quick and avoids GPU read-back stalls
      t.segMode = mode; return t.segmenter;
    })().catch(() => null);
  }
  return t.segLoading;
}

/**
 * Her own hair, as a small mask (hair confidence 0..1) plus a background estimate at the same size,
 * so hair the wig does not cover can be painted over with the background behind her.
 */
function segmentHair(source, now) {
  const seg = t.segmenter; if (!seg) return;
  if ((t.running ? 'VIDEO' : 'IMAGE') !== t.segMode) return;
  const r = t.running ? seg.segmentForVideo(source, now) : seg.segment(source);
  const masks = r.confidenceMasks; if (!masks?.length) return;
  const W0 = masks[0].width, H0 = masks[0].height;
  const k = Math.min(1, 192 / Math.max(W0, H0)); const mw = Math.max(2, Math.round(W0 * k)), mh = Math.max(2, Math.round(H0 * k));
  const B = masks[0].getAsFloat32Array(), Hm = masks[1].getAsFloat32Array();
  const bg = new Float32Array(mw * mh), hair = new Float32Array(mw * mh);
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
    const j = Math.min(H0 - 1, Math.floor((y + 0.5) * H0 / mh)) * W0 + Math.min(W0 - 1, Math.floor((x + 0.5) * W0 / mw));
    bg[y * mw + x] = B[j]; hair[y * mw + x] = Hm[j];
  }
  masks.forEach(m => m.close?.());
  t.hair = { mw, mh, bg, hair, ver: (t.hair?.ver ?? 0) + 1 };
}

// Small scratch canvases for the hair hiding.
const small = document.createElement('canvas'); const sctx = small.getContext('2d', { willReadFrequently: true });
const fillC = document.createElement('canvas'); const fctx = fillC.getContext('2d');

/** Paint over her own hair (outside the face) with a smooth estimate of the background, before the wig goes on. */
let fillKey = '';
function hideOwnHair(L, w, h) {
  const H = t.hair; if (!H) return;
  // The fill is rebuilt only when a new hair mask arrives; frames in between reuse it.
  const key = `${H.ver}:${w}x${h}`;
  if (key === fillKey) { wctx.drawImage(fillC, 0, 0); return; }
  fillKey = key;
  const { mw, mh, bg, hair } = H;
  small.width = mw; small.height = mh;
  sctx.drawImage(work, 0, 0, mw, mh);
  const px = sctx.getImageData(0, 0, mw, mh); const d = px.data;
  // Normalised blur of the background pixels fills the whole frame with "what is behind her".
  const n = mw * mh; let acc = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const m = bg[i] > 0.85 && hair[i] < 0.05 ? 1 : 0; acc[i * 4] = d[i * 4] * m; acc[i * 4 + 1] = d[i * 4 + 1] * m; acc[i * 4 + 2] = d[i * 4 + 2] * m; acc[i * 4 + 3] = m; }
  const box = (src, r) => {
    const out = new Float32Array(src.length); const tmp = new Float32Array(src.length);
    for (let y = 0; y < mh; y++) for (let c = 0; c < 4; c++) { let s = 0; for (let x = -r; x <= r; x++) s += src[(y * mw + Math.min(mw - 1, Math.max(0, x))) * 4 + c]; for (let x = 0; x < mw; x++) { tmp[(y * mw + x) * 4 + c] = s; s += src[(y * mw + Math.min(mw - 1, x + r + 1)) * 4 + c] - src[(y * mw + Math.max(0, x - r)) * 4 + c]; } }
    for (let x = 0; x < mw; x++) for (let c = 0; c < 4; c++) { let s = 0; for (let y = -r; y <= r; y++) s += tmp[(Math.min(mh - 1, Math.max(0, y)) * mw + x) * 4 + c]; for (let y = 0; y < mh; y++) { out[(y * mw + x) * 4 + c] = s; s += tmp[(Math.min(mh - 1, y + r + 1) * mw + x) * 4 + c] - tmp[(Math.max(0, y - r) * mw + x) * 4 + c]; } }
    return out;
  };
  for (const r of [3, 8, 20]) {
    const b = box(acc, r);
    for (let i = 0; i < n; i++) if (acc[i * 4 + 3] < 0.5 && b[i * 4 + 3] > 0) { const k = b[i * 4 + 3]; acc[i * 4] = b[i * 4] / k; acc[i * 4 + 1] = b[i * 4 + 1] / k; acc[i * 4 + 2] = b[i * 4 + 2] / k; acc[i * 4 + 3] = 1; }
  }
  // The face itself is never painted over (hair on the forehead and cheeks stays; the wig covers it).
  // A slightly grown face outline, so her own hairline stays under the wig's edge (it reads as hair,
  // where a painted-over band would read as a bald strip).
  const raw0 = toPixels(L, FACE_OVAL, mw, mh);
  const cx = raw0.reduce((a, p) => a + p[0], 0) / raw0.length, cy = raw0.reduce((a, p) => a + p[1], 0) / raw0.length;
  const oval = raw0.map(([x, y]) => [cx + (x - cx) * 1.15, cy + (y - cy) * (y < cy ? 1.32 : 1.04)]);
  const faceMask = document.createElement('canvas'); faceMask.width = mw; faceMask.height = mh;
  const fm = faceMask.getContext('2d'); fm.fillStyle = '#fff'; fm.beginPath(); tracePath(fm, oval); fm.fill();
  const fd = fm.getImageData(0, 0, mw, mh).data;
  // Just above the forehead, hair is replaced with her own forehead skin, not the background, so a wig
  // with a higher hairline shows a forehead, not a grey band.
  fm.clearRect(0, 0, mw, mh); fm.beginPath(); tracePath(fm, raw0.map(([x, y]) => [cx + (x - cx) * 1.08, cy + (y - cy) * (y < cy ? 1.45 : 1)])); fm.fill();
  const zd = fm.getImageData(0, 0, mw, mh).data;
  const [fx, fy] = toPixels(L, [151], w, h)[0]; const sk = wctx.getImageData(Math.max(0, Math.round(fx) - 4), Math.max(0, Math.round(fy) - 4), 9, 9).data;
  let sr = 0, sg = 0, sb = 0; for (let i = 0; i < sk.length; i += 4) { sr += sk[i]; sg += sk[i + 1]; sb += sk[i + 2]; }
  const skin = [sr / (sk.length / 4), sg / (sk.length / 4), sb / (sk.length / 4)];
  for (let i = 0; i < n; i++) { const z = zd[i * 4 + 3] / 255; if (z > 0) { acc[i * 4] += (skin[0] - acc[i * 4]) * z; acc[i * 4 + 1] += (skin[1] - acc[i * 4 + 1]) * z; acc[i * 4 + 2] += (skin[2] - acc[i * 4 + 2]) * z; } }
  // Hair strength, grown by two mask pixels so no dark fringe of her own hair is left at the edge.
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) raw[i] = Math.max(0, Math.min(1, (hair[i] - 0.12) / 0.3));
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
    let a = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < mh && xx >= 0 && xx < mw) { const v = raw[yy * mw + xx]; if (v > a) a = v; } }
    const i = y * mw + x; a *= 1 - fd[i * 4 + 3] / 255;
    d[i * 4] = acc[i * 4]; d[i * 4 + 1] = acc[i * 4 + 1]; d[i * 4 + 2] = acc[i * 4 + 2]; d[i * 4 + 3] = Math.round(a * 255);
  }
  sctx.putImageData(px, 0, 0);
  fillC.width = w; fillC.height = h;
  fctx.clearRect(0, 0, w, h); fctx.imageSmoothingQuality = 'high';
  if ('filter' in fctx) fctx.filter = `blur(${Math.max(1, w / mw).toFixed(1)}px)`;
  fctx.drawImage(small, 0, 0, w, h); fctx.filter = 'none';
  wctx.drawImage(fillC, 0, 0);
}

// ---- painting ----------------------------------------------------------------------------------
function tracePath(ctx, pts, closed = true) {
  const seg = closed ? smoothClosed(pts) : smoothOpen(pts);
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const s of seg) ctx.bezierCurveTo(s[0], s[1], s[2], s[3], s[4], s[5]);
  if (closed) ctx.closePath();
}

/** Recolour pixels under a feathered mask, pixel by pixel, so the skin's own light and texture stay. */
function pixelPass(region, drawMask, feather, perPixel) {
  const x = Math.max(0, Math.floor(region.x)), y = Math.max(0, Math.floor(region.y));
  const w = Math.min(work.width - x, Math.ceil(region.w)), h = Math.min(work.height - y, Math.ceil(region.h));
  if (w < 2 || h < 2) return;
  mask.width = w; mask.height = h;
  mctx.clearRect(0, 0, w, h);
  mctx.save(); mctx.translate(-x, -y);
  if ('filter' in mctx) mctx.filter = `blur(${Math.max(0.6, feather).toFixed(1)}px)`;
  mctx.fillStyle = '#fff'; drawMask(mctx);
  mctx.restore(); mctx.filter = 'none';
  const m = mctx.getImageData(0, 0, w, h).data;
  const img = wctx.getImageData(x, y, w, h); const d = img.data;
  perPixel(d, m, w * h, w, h);
  wctx.putImageData(img, x, y);
}

function paintLips(L, w, h) {
  const outer = toPixels(L, LIPS_OUTER, w, h), inner = toPixels(L, LIPS_INNER, w, h);
  const mw = Math.hypot(outer[10][0] - outer[0][0], outer[10][1] - outer[0][1]);
  const shade = hexToRgb(t.choice.lip); const fin = t.choice.lipFinish;
  pixelPass(bbox(outer, mw * 0.08), c => {
    c.beginPath(); tracePath(c, outer); c.fill();
    c.globalCompositeOperation = 'destination-out'; c.beginPath(); tracePath(c, inner); c.fill(); c.globalCompositeOperation = 'source-over';
  }, mw * 0.025, (d, m, n, pw, ph) => {
    const mean = maskedMeanL(d, m, n);
    const det = lightnessDetail(d, pw, ph, Math.max(1, Math.round(mw * 0.012)));
    for (let i = 0; i < n; i++) {
      const a = m[i * 4 + 3] / 255; if (a < 0.01) continue;
      const o = tintPixel(d[i * 4], d[i * 4 + 1], d[i * 4 + 2], shade, mean, fin, a, 0.94, det[i]);
      d[i * 4] = o[0]; d[i * 4 + 1] = o[1]; d[i * 4 + 2] = o[2];
    }
  });
  if (fin === 'gloss') {
    // A soft wet highlight on the centre of the lower lip and a small one on the upper lip.
    const ang = Math.atan2(outer[10][1] - outer[0][1], outer[10][0] - outer[0][0]);
    const [lo1, lo2] = toPixels(L, [14, 17], w, h); const [up1, up2] = toPixels(L, [13, 0], w, h);
    const g = (cx, cy, rx, ry, a) => { wctx.save(); wctx.globalCompositeOperation = 'screen'; if ('filter' in wctx) wctx.filter = `blur(${(mw * 0.02).toFixed(1)}px)`; wctx.fillStyle = `rgba(255,255,255,${a})`; wctx.beginPath(); wctx.ellipse(cx, cy, rx, ry, ang, 0, Math.PI * 2); wctx.fill(); wctx.restore(); };
    g((lo1[0] + lo2[0]) / 2, lo1[1] * 0.45 + lo2[1] * 0.55, mw * 0.13, mw * 0.03, 0.38);
    g((up1[0] + up2[0]) / 2 - mw * 0.1, (up1[1] + up2[1]) / 2, mw * 0.06, mw * 0.015, 0.25);
  }
}

function paintBrows(L, w, h) {
  const tint = hexToRgb(t.choice.brow);
  for (const side of ['right', 'left']) {
    const poly = browPolygon(L, side, w, h);
    const bw = Math.hypot(poly[0][0] - poly[4][0], poly[0][1] - poly[4][1]);
    pixelPass(bbox(poly, bw * 0.15), c => { c.beginPath(); tracePath(c, poly); c.fill(); }, bw * 0.05, (d, m, n) => {
      for (let i = 0; i < n; i++) {
        const a = m[i * 4 + 3] / 255; if (a < 0.01) continue;
        const o = browPixel(d[i * 4], d[i * 4 + 1], d[i * 4 + 2], tint, a, 0.6);
        d[i * 4] = o[0]; d[i * 4 + 1] = o[1]; d[i * 4 + 2] = o[2];
      }
    });
  }
}

function overlay(draw, op, alpha) {
  lctx.clearRect(0, 0, layer.width, layer.height);
  lctx.save(); draw(lctx); lctx.restore(); lctx.filter = 'none';
  wctx.save(); wctx.globalCompositeOperation = op; wctx.globalAlpha = alpha; wctx.drawImage(layer, 0, 0); wctx.restore();
}

function eyeWidth(L, side, w, h) { const [o, i] = toPixels(L, [EYE[side].outer, EYE[side].inner], w, h); return Math.hypot(o[0] - i[0], o[1] - i[1]); }

function paintShadow(L, w, h) {
  const col = t.choice.shadow;
  const draw = c => {
    for (const side of ['right', 'left']) {
      const ew = eyeWidth(L, side, w, h);
      if ('filter' in c) c.filter = `blur(${(ew * 0.09).toFixed(1)}px)`;
      // Built up like a brush does: a soft wash to the crease, then more colour near the lash line.
      c.fillStyle = col; c.globalAlpha = 0.55; c.beginPath(); tracePath(c, lidPolygon(L, side, w, h, 0.6)); c.fill();
      c.globalAlpha = 0.45; c.beginPath(); tracePath(c, lidPolygon(L, side, w, h, 0.3)); c.fill(); c.globalAlpha = 1;
    }
  };
  overlay(draw, 'multiply', 0.4);
  overlay(draw, 'soft-light', 0.3);
}

function paintBlush(L, w, h) {
  const col = hexToRgb(t.choice.blush).join(',');
  const draw = c => {
    for (const side of ['right', 'left']) {
      const e = blushEllipse(L, side, w, h);
      c.save(); c.translate(e.cx, e.cy); c.rotate(e.angle); c.scale(1, e.ry / e.rx);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, e.rx);
      g.addColorStop(0, `rgba(${col},0.8)`); g.addColorStop(0.5, `rgba(${col},0.35)`); g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, e.rx, 0, Math.PI * 2); c.fill(); c.restore();
    }
  };
  overlay(draw, 'soft-light', 0.4);
  overlay(draw, 'multiply', 0.1);
}

function paintLiner(L, w, h) {
  const col = t.choice.liner; const style = t.choice.linerStyle;
  const draw = c => {
    for (const side of ['right', 'left']) {
      const ew = eyeWidth(L, side, w, h);
      const line = lashLine(L, side, w, h); // inner -> outer, normals point up the lid
      // A band from the lash line up the lid, thin at the inner corner and fuller at the outer.
      const up = line.map(({ p, n, t: k }) => { const th = ew * (0.018 + 0.05 * k * k); return [p[0] + n[0] * th, p[1] + n[1] * th]; });
      const band = [...line.map(l => l.p), ...up.reverse()];
      if ('filter' in c) c.filter = `blur(${Math.max(0.5, ew * 0.012).toFixed(1)}px)`;
      c.fillStyle = col; c.beginPath(); tracePath(c, band); c.fill();
      if (style === 'wing') {
        const [base, tip] = wingTip(L, side, w, h, 0.38);
        const last = line[line.length - 1]; const th = ew * 0.068;
        const top = [last.p[0] + last.n[0] * th, last.p[1] + last.n[1] * th];
        const prev = line[line.length - 3].p;
        c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(top[0], top[1]); c.lineTo(tip[0], tip[1]); c.lineTo(base[0], base[1]); c.closePath(); c.fill();
      }
      if (style === 'kohl') {
        const lower = toPixels(L, EYE[side].lower, w, h);
        c.lineWidth = ew * 0.03; c.lineCap = 'round'; c.strokeStyle = col;
        if ('filter' in c) c.filter = `blur(${(ew * 0.02).toFixed(1)}px)`;
        c.beginPath(); tracePath(c, lower, false); c.stroke();
      }
    }
  };
  overlay(draw, 'source-over', style === 'kohl' ? 0.82 : 0.92);
}

const LASH_STYLE = { natural: { n: 30, len: 0.17, wid: 0.016, curl: 0.35, jitter: 0.2 }, wispy: { n: 38, len: 0.22, wid: 0.014, curl: 0.42, jitter: 0.6 }, dramatic: { n: 44, len: 0.27, wid: 0.02, curl: 0.45, jitter: 0.25 } };
// A fixed pseudo-random pattern per lash, so lashes do not shimmer frame to frame.
const rnd = i => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };

function paintLashes(L, w, h) {
  const st = LASH_STYLE[t.choice.lashes];
  wctx.save(); wctx.strokeStyle = 'rgba(12,10,10,0.85)'; wctx.fillStyle = 'rgb(14,11,11)'; wctx.lineCap = 'round';
  if ('filter' in wctx) wctx.filter = 'blur(0.35px)'; // hair is never razor-edged on camera
  for (const side of ['right', 'left']) {
    const open = eyeOpenness(L, side, w, h);
    if (open < 0.13) continue; // the eye is closed: hide the lashes
    const ew = eyeWidth(L, side, w, h);
    const line = lashLine(L, side, w, h);
    const seg = smoothOpen(line.map(l => l.p));
    const pts = [];
    for (let k = 0; k < st.n; k++) {
      const u = Math.min(0.995, Math.max(0.005, (k + 0.5 + (rnd(k + 31) - 0.5) * 0.8) / st.n)); const si = Math.min(seg.length - 1, Math.floor(u * seg.length)); const tt = u * seg.length - si;
      const p0 = si === 0 ? line[0].p : [seg[si - 1][4], seg[si - 1][5]]; const s = seg[si];
      const q = [0, 1].map(j => (1 - tt) ** 3 * p0[j] + 3 * (1 - tt) ** 2 * tt * s[j] + 3 * (1 - tt) * tt ** 2 * s[2 + j] + tt ** 3 * s[4 + j]);
      const li = Math.min(line.length - 1, Math.round(u * (line.length - 1)));
      pts.push({ p: q, n: line[li].n, u });
    }
    const outward = [line[line.length - 1].p[0] - line[0].p[0], line[line.length - 1].p[1] - line[0].p[1]];
    const ol = Math.hypot(...outward) || 1;
    pts.forEach(({ p, n, u }, k) => {
      const prof = 0.45 + 0.55 * Math.sin(Math.PI * Math.min(1, u * 0.85 + 0.12)); // short inner, longest past the middle
      const len = ew * st.len * prof * (1 - st.jitter * 0.5 + st.jitter * rnd(k + (side === 'left' ? 99 : 0)));
      const lean = (u - 0.3) * 0.9 + (rnd(k + 53) - 0.5) * 0.35; // inner lashes stand up, outer lashes sweep outward; each a little different
      const dir = [n[0] + (outward[0] / ol) * lean, n[1] + (outward[1] / ol) * lean]; const dl = Math.hypot(...dir) || 1;
      const tip = [p[0] + (dir[0] / dl) * len, p[1] + (dir[1] / dl) * len];
      const ctrl = [p[0] + n[0] * len * 0.55 - (outward[0] / ol) * len * st.curl * 0.2, p[1] + n[1] * len * 0.55 - (outward[1] / ol) * len * st.curl * 0.2];
      // Each lash is a tapered strand: full width at the root, a fine point at the tip, like real hair.
      const bw = Math.max(0.8, ew * st.wid * (1.1 - 0.4 * u)) / 2;
      const tx = -(dir[1] / dl), ty = dir[0] / dl;
      wctx.globalAlpha = 0.78 + 0.2 * rnd(k + 7);
      wctx.beginPath();
      wctx.moveTo(p[0] - tx * bw, p[1] - ty * bw);
      wctx.quadraticCurveTo(ctrl[0] - tx * bw * 0.6, ctrl[1] - ty * bw * 0.6, tip[0], tip[1]);
      wctx.quadraticCurveTo(ctrl[0] + tx * bw * 0.6, ctrl[1] + ty * bw * 0.6, p[0] + tx * bw, p[1] + ty * bw);
      wctx.closePath(); wctx.fill();
    });
    wctx.globalAlpha = 1;
    wctx.lineWidth = Math.max(1, ew * 0.025); wctx.beginPath(); tracePath(wctx, line.map(l => l.p), false); wctx.stroke();
  }
  wctx.restore();
}

function paintWig(L, w, h) {
  const meta = WIGS.find(x => x.id === t.choice.wig); const img = t.wigImgs[t.choice.wig];
  if (!meta || !img?.complete || !img.naturalWidth) return;
  hideOwnHair(L, w, h);
  // Three anchors (both outer eye corners and the chin) fix scale, width, tilt and position, so the
  // wig's face opening is fitted to her face and follows her head as it tilts or moves.
  const dst = toPixels(L, [EYE.right.outer, EYE.left.outer, 152], w, h);
  const m = wigAffine([meta.right, meta.left, meta.chin], dst);
  wctx.save(); wctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]); wctx.drawImage(img, 0, 0); wctx.restore();
}

function paint(w, h) {
  const L = t.landmarks; if (!L) return;
  const c = t.choice;
  if (c.brow) paintBrows(L, w, h);
  if (c.shadow) paintShadow(L, w, h);
  if (c.liner) paintLiner(L, w, h);
  if (c.lashes) paintLashes(L, w, h);
  if (c.lip) paintLips(L, w, h);
  if (c.blush) paintBlush(L, w, h);
  if (c.wig) paintWig(L, w, h);
}

// ---- snapshot and shop -------------------------------------------------------------------------
function snapshot() {
  const src = $('toCanvas'); if (!src.width) return;
  const out = document.createElement('canvas'); out.width = src.width; out.height = src.height;
  const c = out.getContext('2d');
  if (t.mirrored) { c.translate(out.width, 0); c.scale(-1, 1); }
  c.drawImage(src, 0, 0);
  out.toBlob(b => {
    if (!b) return;
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'mirrr-try-on.png';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    status('Snapshot saved to this device only.');
  }, 'image/png');
  window.MirrrMoney?.count?.('tryon_snapshot');
}

let shopKey = '';
async function renderShop() {
  const el = $('toShop'); if (!el) return;
  const c = t.choice; const routines = [];
  if (c.lip) routines.push(['lips', 'Lips']);
  if (c.liner || c.brow || c.lashes || c.shadow) routines.push(['brow_kohl', 'Eyes & brows']);
  const key = routines.map(r => r[0]).join(',');
  if (key === shopKey) return; shopKey = key;
  if (!routines.length) { el.innerHTML = ''; return; }
  const parts = [];
  for (const [id, title] of routines) {
    try {
      const d = await (await fetch(`/api/shop/routine/${id}`)).json();
      if (d.products?.length) parts.push(`<h4>${esc(title)}</h4><div class="earn-xs">${d.products.map(p => `<a class="shop-link earn-chip" href="${esc(String(p.shop_url).replace(/utm_content=[^&]*/, 'utm_content=tryon_' + id))}" target="_blank" rel="noopener"><strong>${esc(p.brand)}</strong> ${esc(p.name)}<span>${esc(String(p.category))} · ${esc(p.price_text)}${p.ownership ? ` · ${esc(p.ownership)}` : ''}</span></a>`).join('')}</div>`);
    } catch { /* offline: no shop strip */ }
  }
  el.innerHTML = parts.length ? `<h3 class="st-h">Shop this look</h3><p class="earn-meta">Real products from brands&rsquo; own stores in the categories you tried. They are not matched to the exact colour on screen. Pick any, or none.</p>${parts.join('')}<p class="lib-note">Prices as listed on each brand&rsquo;s store on Oct 30, 2026. No affiliate deal: MIRRR earns nothing from these links today. <a href="#money">How MIRRR makes money</a></p>` : '';
  el.querySelectorAll('a.shop-link').forEach(a => a.addEventListener('click', () => window.MirrrMoney?.count?.('product_click')));
}

// ---- view ---------------------------------------------------------------------------------------
function mount() {
  const root = $('toRoot'); if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';
  $('toControls').innerHTML = controls();
  $('toControls').addEventListener('change', readChoice);
  $('toStart').addEventListener('click', startCamera);
  $('toStop').addEventListener('click', () => { stopCamera(); status('Camera off.'); });
  $('toFile').addEventListener('change', e => usePhoto(e.target.files?.[0]));
  const samples = $('toSamples');
  if (samples) {
    samples.innerHTML = MODEL_FACES.map((f, i) => `<button type="button" class="to-sample" data-to-sample="${esc(f.id)}" aria-label="Sample photo ${i + 1}"><img src="${esc(f.src)}" alt="" width="54" height="72" loading="lazy" decoding="async"></button>`).join('');
    samples.addEventListener('click', e => {
      const b = e.target.closest('[data-to-sample]'); if (!b) return;
      samples.querySelectorAll('.to-sample').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      useSample(b.dataset.toSample);
    });
  }
  $('toSnap').addEventListener('click', snapshot);
  root.addEventListener('click', e => { const a = e.target.closest('[data-to-view]'); if (a) { e.preventDefault(); document.querySelector(`.nav-link[data-view="${a.dataset.toView}"]`)?.click(); } });
  // Leaving the view switches the camera off.
  const view = $('view-tryon');
  new MutationObserver(() => { if (view.classList.contains('hidden') && t.running) { stopCamera(); status('Camera off.'); } }).observe(view, { attributes: true, attributeFilter: ['class'] });
}

document.addEventListener('click', e => {
  const b = e.target.closest?.('[data-tryon-open]'); if (!b) return;
  e.preventDefault();
  document.querySelector('.nav-link[data-view="tryon"]')?.click();
  window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
});
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
// For the automated check: the current state, never frames.
window.__mirrrTryon = { state: () => ({ running: t.running, face: !!t.landmarks, fps: t.fps, size: [work.width, work.height], choice: { ...t.choice } }) };
