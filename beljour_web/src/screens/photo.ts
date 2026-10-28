/** Local-first photo opening and explicit app-server preparation. User files are
 * header-bounded, oriented once, flattened onto white and re-encoded before any
 * upload. Owned resources have a screen or app lifetime. Author: John Khan.
 */
import { api, apiBase, store } from "../api.js";
import { rememberPhotoId } from "../layout/trust.js";
import { type Ctx, releaseLocalPhoto } from "../ctx.js";
import { announce, h, loadImage } from "../dom.js";
import { readFace, type FaceReading } from "../face/landmarks.js";
import { lighting, runChecks } from "../face/quality.js";
import { appConsent, VISIT_STATEMENTS, type ConsentGate } from "../ui/shell/consent.js";
import { decodePhoto, browserDecoder, readHeader, DEFAULT_LIMITS, type PixelDecoder, type DecodedPhoto } from "../image/decode.js";
import { canvasEncoder, stripJpegMetadata, type CanvasEncoder } from "../save/export.js";
import { makeSample } from "../ui/shell/demo.js";
import { toRGBA, resize } from "../engines/core/buffer.js";
import type { Photo } from "../types.js";

// Match the inherited API limits; a large local photo is never secretly rescaled
// just to fit an upload. Existing server-side storage normalization still applies.
export const SERVER_PHOTO_BYTES = 8_000_000, SERVER_PHOTO_MIN_SIDE = 480;
export interface NormalizedPhoto { blob: Blob; width: number; height: number; flattened: boolean; orientationApplied: number }
export interface PhotoScreenDeps {
  consent?: ConsentGate;
  base?: () => string;
  decoder?: PixelDecoder;
  encoder?: CanvasEncoder;
  loadImage?: typeof loadImage;
  readFace?: typeof readFace;
  upload?: (blob: Blob) => Promise<Photo>;
  deletePhoto?: (id: string) => Promise<unknown>;
  remember?: (id: string) => void;
  createURL?: (blob: Blob) => string;
  revokeURL?: (url: string) => void;
  getCamera?: () => Promise<MediaStream>;
  capture?: (video: HTMLVideoElement) => Promise<Blob>;
}
export interface PhotoScreen { element: HTMLElement; dispose(): void }
interface ServerOwnership { pending: Set<symbol>; stale: Map<string, Photo>; deleting: Promise<void> }
const serverOwnership = new WeakMap<Ctx, ServerOwnership>();
function ownership(ctx: Ctx): ServerOwnership {
  let value = serverOwnership.get(ctx);
  if (!value) { value = { pending: new Set(), stale: new Map(), deleting: Promise.resolve() }; serverOwnership.set(ctx, value); }
  return value;
}
/** An explicit app-level deletion must finish before a newly selected identical
 * photo is uploaded again; the API uses content hashes as photo IDs. */
export function beforeNextPhotoUpload<T>(ctx: Ctx, deletion: () => Promise<T>): Promise<T> {
  const owned = ownership(ctx), result = owned.deleting.then(deletion);
  owned.deleting = result.then(() => undefined, () => undefined);
  return result;
}

async function encodeNormalized(photo: DecodedPhoto, encoder: CanvasEncoder, label: string | null = null): Promise<NormalizedPhoto> {
  const encoded = stripJpegMetadata(await encoder.encode(photo, { type: "image/jpeg", quality: .92, label }));
  const header = readHeader(encoded);
  if (header.format !== "jpeg" || header.orientation !== 1 || header.width !== photo.width || header.height !== photo.height) {
    throw new Error("The normalized photo does not match its pixels. Please choose another photo.");
  }
  return { blob: new Blob([Uint8Array.from(encoded)], { type: "image/jpeg" }), width: photo.width, height: photo.height,
    flattened: photo.flattened, orientationApplied: photo.orientationApplied };
}
export async function normalizePhoto(file: Blob, decoder: PixelDecoder = browserDecoder(), encoder: CanvasEncoder = canvasEncoder(), signal?: AbortSignal): Promise<NormalizedPhoto> {
  if (file.size > DEFAULT_LIMITS.maxBytes) throw new Error("Choose a photo no larger than 25 MB for local tools.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const photo = await decodePhoto(bytes, decoder, { signal, flattenOn: [255, 255, 255] });
  if (signal?.aborted) throw new Error("Photo opening was cancelled.");
  return encodeNormalized(photo, encoder);
}
function faceLight(img: HTMLImageElement, points: FaceReading["points"]): ReturnType<typeof lighting> | null {
  const xs = points.map(point => point.x * img.naturalWidth), ys = points.map(point => point.y * img.naturalHeight);
  const x = Math.max(0, Math.min(...xs)), y = Math.max(0, Math.min(...ys));
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 96;
  const drawing = canvas.getContext("2d"); if (!drawing) return null;
  drawing.drawImage(img, x, y, Math.max(1, Math.max(...xs) - x), Math.max(1, Math.max(...ys) - y), 0, 0, 96, 96);
  return lighting(drawing.getImageData(0, 0, 96, 96).data);
}
function cameraFrame(video: HTMLVideoElement): Promise<Blob> {
  const width = video.videoWidth, height = video.videoHeight;
  if (Math.min(width, height) < DEFAULT_LIMITS.minSide || Math.max(width, height) > DEFAULT_LIMITS.maxSide || width * height > DEFAULT_LIMITS.maxPixels) {
    return Promise.reject(new Error("The camera frame is outside the supported photo size."));
  }
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const drawing = canvas.getContext("2d"); if (!drawing) return Promise.reject(new Error("The camera frame could not be read."));
  drawing.drawImage(video, 0, 0);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("The camera frame could not be saved.")), "image/jpeg", .92));
}

export function photoScreen(ctx: Ctx, deps: PhotoScreenDeps = {}): PhotoScreen {
  const gate = deps.consent ?? appConsent, base = deps.base ?? apiBase;
  const upload = deps.upload ?? api.uploadPhoto, remove = deps.deletePhoto ?? api.deletePhoto;
  const remember = deps.remember ?? (id => rememberPhotoId(store, id));
  const createURL = deps.createURL ?? (blob => URL.createObjectURL(blob)), revokeURL = deps.revokeURL ?? (url => URL.revokeObjectURL(url));
  const encoder = deps.encoder ?? canvasEncoder(), urls = new Set<string>();
  const owned = ownership(ctx);
  let disposed = false, generation = 0, serverGeneration = 0, cameraGeneration = 0;
  let opening: AbortController | null = null, stream: MediaStream | null = null, activeUpload: symbol | null = null;
  let lastVisit = gate.hasVisit, lastLocalOnly = gate.localOnly;
  let consentInitialised = false;
  const status = h("div", { class: "status", "aria-live": "polite" });
  const ready = h("div", { class: "photo-ready", "aria-live": "polite" });
  const prepare = h("button", { type: "button", class: "btn", disabled: true }, "Prepare photo on app server");
  const prepareNote = h("p", { class: "fine" });
  const file = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp", id: "file", class: "visually-hidden", "aria-label": "Open a photo from this device" });
  const video = h("video", { playsinline: true, muted: true, class: "cam", "aria-label": "Camera preview" });
  const start = h("button", { type: "button", class: "btn btn-quiet" }, "Use my camera");
  const take = h("button", { type: "button", class: "btn", disabled: true }, "Take photo");
  const stop = h("button", { type: "button", class: "btn btn-quiet", disabled: true }, "Stop camera");
  const say = (message: string): void => { status.replaceChildren(h("p", {}, message)); };
  const stopCamera = (): void => {
    cameraGeneration++; stream?.getTracks().forEach(track => track.stop()); stream = null;
    video.srcObject = null; video.pause?.(); take.disabled = stop.disabled = true; start.disabled = false;
  };
  const releasePending = (): void => { for (const url of urls) revokeURL(url); urls.clear(); };
  const flushServerCleanup = (): void => {
    if (owned.pending.size) return;
    for (const [id] of owned.stale) {
      owned.stale.delete(id);
      if (ctx.photo?.photo_id === id) continue;
      // Content-addressed IDs can repeat when a new selection has the same pixels.
      // Finish pending uploads first and retain the currently adopted ID. New
      // uploads await this deletion queue so a late delete cannot erase their copy.
      owned.deleting = owned.deleting.then(async () => { if (ctx.photo?.photo_id !== id) await remove(id); }).catch(() => undefined);
    }
  };
  const forgetServer = (photo: Photo | null): void => {
    if (!photo || photo.sample) return;
    gate.revokePhoto(photo.photo_id);
    owned.stale.set(photo.photo_id, photo); flushServerCleanup();
  };
  const clearCurrent = (): void => {
    const old = ctx.photo; ctx.photo = null; releaseLocalPhoto(ctx);
    ctx.photoSrc = null; ctx.face = null; ctx.size = null; ctx.shade = null; ctx.localShade = null; ctx.tryon = {}; ctx.faceShape = null;
    forgetServer(old); ctx.refreshPhotoPanel();
  };
  const syncPrepare = (): void => {
    const local = ctx.localPhoto;
    prepare.disabled = disposed || !!activeUpload || !local || !gate.hasVisit || gate.localOnly || !base() || !!ctx.photo;
    prepareNote.textContent = gate.localOnly ? "On-device only is on. This photo stays on this device; app-server preparation is unavailable."
      : !base() ? "No app server is configured. Local tools remain available."
      : ctx.photo ? "This photo is prepared on the app server. Each YouCam action still asks for its own consent."
      : "Optional: this button uploads a metadata-free JPEG to the BELJOUR server. YouCam receives it only after separate consent for makeup, hair styling or approved Skin AI product matching. App-server uploads are deleted within an hour.";
  };
  const drawReady = (): void => {
    ready.replaceChildren();
    if (ctx.photoSrc) {
      ready.append(h("p", { class: "source" }, ctx.localPhoto?.synthetic ? "Drawn sample ready. This is not a real person's photo." : ctx.photo ? "Photo ready on this device and the app server." : "Photo ready on this device. Nothing was uploaded."),
        h("div", { class: "row" }, h("button", { type: "button", class: "btn", onclick: () => ctx.go("shade") }, "Find my shade on this device"),
          h("button", { type: "button", class: "btn btn-quiet", onclick: () => ctx.go("palettes") }, "Open my colour palettes")));
      if (ctx.photo) ready.append(h("div", { class: "row" },
        h("button", { type: "button", class: "btn", onclick: () => ctx.go("hair") }, "Open Hair Studio"),
        h("button", { type: "button", class: "btn btn-quiet", onclick: () => ctx.go("skin") }, "Continue to skin")));
    }
    syncPrepare();
  };
  const begin = (): { version: number; signal: AbortSignal } | null => {
    if (disposed || !gate.hasVisit) { say("Confirm both visit statements before opening a photo."); return null; }
    generation++; serverGeneration++; activeUpload = null; opening?.abort(); opening = new AbortController(); stopCamera(); releasePending(); clearCurrent(); drawReady();
    say("Checking and preparing the photo on this device. Nothing is uploaded.");
    return { version: generation, signal: opening.signal };
  };
  const current = (version: number): boolean => !disposed && generation === version && gate.hasVisit;
  const adopt = async (normalized: NormalizedPhoto, version: number, synthetic = false, knownFace: FaceReading | null = null): Promise<void> => {
    if (!current(version)) return;
    const url = createURL(normalized.blob); urls.add(url);
    try {
      const image = await (deps.loadImage ?? loadImage)(url); if (!current(version)) return;
      let face = knownFace;
      if (!face) { try { face = await (deps.readFace ?? readFace)(image); } catch { face = null; } }
      if (!current(version)) return;
      const checks = runChecks(face?.points ?? null, normalized.width, normalized.height, face ? faceLight(image, face.points) : null);
      let released = false;
      ctx.localPhoto = { blob: normalized.blob, src: url, synthetic, release() { if (!released) { released = true; revokeURL(url); } } };
      urls.delete(url); // ownership transfers to the app until replacement/deletion/pagehide
      ctx.photoSrc = url; ctx.face = face; ctx.size = { w: normalized.width, h: normalized.height }; ctx.photo = null;
      ctx.refreshPhotoPanel();
      status.replaceChildren(h("p", { class: "fine" }, "The photo is upright and re-encoded without file metadata. Transparent pixels are flattened onto white."),
        !face ? h("p", { class: "notice notice-warn" }, "Face points could not be read. Features that need a mesh will explain what is missing; no face points are invented.") : "",
        h("ul", { class: "checks" }, ...checks.map(check => h("li", { class: check.ok ? "ok" : "fix" },
          h("span", { class: "visually-hidden" }, check.ok ? "Passed: " : "Needs a fix: "), check.message))));
      drawReady(); announce("Photo ready on this device.");
    } finally { if (urls.delete(url)) revokeURL(url); }
  };
  const open = async (blob: Blob): Promise<void> => {
    const job = begin(); if (!job) return;
    try { await adopt(await normalizePhoto(blob, deps.decoder ?? browserDecoder(), encoder, job.signal), job.version); }
    catch (error) { if (current(job.version)) { say(error instanceof Error ? error.message : "This photo could not be opened."); drawReady(); } }
  };
  file.addEventListener("change", async () => { const chosen = file.files?.[0]; file.value = ""; if (chosen) await open(chosen); });
  prepare.addEventListener("click", async () => {
    const local = ctx.localPhoto, version = generation, permissionVersion = serverGeneration;
    if (disposed || activeUpload || !local || !gate.hasVisit || gate.localOnly || !base()) { syncPrepare(); return; }
    if (ctx.photo) return;
    if (local.blob.size > SERVER_PHOTO_BYTES) { say("The normalized photo is over the app server's 8 MB limit. It stays ready locally. Choose a smaller photo to use server tools."); return; }
    if (!ctx.size || Math.min(ctx.size.w, ctx.size.h) < SERVER_PHOTO_MIN_SIDE) { say("Server tools need at least 480 pixels on the short side. This photo remains available for local tools."); return; }
    const ticket = Symbol("photo preparation"); activeUpload = ticket; owned.pending.add(ticket);
    syncPrepare(); say("Preparing this photo on the app server. It has not been sent to YouCam.");
    try {
      await owned.deleting;
      if (!current(version) || permissionVersion !== serverGeneration || gate.localOnly || ctx.localPhoto !== local) return;
      const photo = await upload(local.blob); remember(photo.photo_id);
      if (!current(version) || permissionVersion !== serverGeneration || gate.localOnly || ctx.localPhoto !== local || ctx.photoSrc !== local.src) {
        forgetServer(photo); return;
      }
      ctx.photo = photo; ctx.refreshPhotoPanel(); drawReady();
      say(`Photo prepared on the app server (${photo.width} × ${photo.height}). The local preview remains ${ctx.size.w} × ${ctx.size.h}; the server may resize its stored copy. Choose a tool next; YouCam consent is requested with that action.`);
    } catch (error) { if (current(version) && permissionVersion === serverGeneration) say(error instanceof Error ? error.message : "The photo could not be prepared. Local tools remain available."); }
    finally {
      owned.pending.delete(ticket); flushServerCleanup();
      if (activeUpload === ticket) activeUpload = null;
      if (!disposed) syncPrepare();
    }
  });
  start.addEventListener("click", async () => {
    if (disposed || !gate.hasVisit) return;
    stopCamera(); const version = cameraGeneration; start.disabled = true; stop.disabled = false;
    try {
      const acquired = await (deps.getCamera ?? (() => navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1600 } } })))();
      if (disposed || version !== cameraGeneration || !gate.hasVisit) { acquired.getTracks().forEach(track => track.stop()); return; }
      stream = acquired; video.srcObject = acquired; await video.play();
      if (disposed || version !== cameraGeneration || !gate.hasVisit) { acquired.getTracks().forEach(track => track.stop()); return; }
      take.disabled = false;
    } catch { if (!disposed && version === cameraGeneration) { stopCamera(); say("The camera is unavailable. You can open a photo from your device."); } }
  });
  stop.addEventListener("click", stopCamera);
  take.addEventListener("click", async () => {
    if (!stream || disposed || !gate.hasVisit) return;
    const version = cameraGeneration; take.disabled = true;
    try {
      const blob = await (deps.capture ?? cameraFrame)(video);
      if (!disposed && version === cameraGeneration && gate.hasVisit) await open(blob);
    } catch (error) { if (!disposed && version === cameraGeneration) { stopCamera(); say(error instanceof Error ? error.message : "The camera frame could not be read."); } }
  });
  const sample = h("button", { type: "button", class: "btn btn-quiet", onclick: async () => {
    const job = begin(); if (!job) return;
    try {
      const sample = makeSample("portrait"), image = resize(sample.image, sample.image.width * 2, sample.image.height * 2);
      const photo: DecodedPhoto = { format: "png", width: image.width, height: image.height, data: toRGBA(image), orientationApplied: 1, hadAlpha: false, flattened: false, metadata: {} };
      const face: FaceReading = { points: sample.face!.map(([x, y]) => ({ x: x / sample.image.width, y: y / sample.image.height })), blendshapes: {} };
      await adopt(await encodeNormalized(photo, encoder, "Drawn sample"), job.version, true, face);
    } catch (error) { if (current(job.version)) say(error instanceof Error ? error.message : "The drawn sample could not be opened."); }
  } }, "Use a drawn sample");
  const agree = h("input", { type: "checkbox", id: "agree" }), adult = h("input", { type: "checkbox", id: "adult" });
  const continueButton = h("button", { type: "button", class: "btn", disabled: true }, "Agree and continue");
  const consent = h("section", {}, h("p", { class: "lede" }, "Confirm these statements before opening a photo. Opening and checking it happens on this device."),
    h("p", { class: "check" }, agree, h("label", { for: "agree" }, VISIT_STATEMENTS[1].text)),
    h("p", { class: "check" }, adult, h("label", { for: "adult" }, VISIT_STATEMENTS[0].text)), continueButton);
  const controls = h("section", {}, h("p", { class: "lede" }, "Face the camera in soft, even light. Keep your whole face in view. JPEG, PNG or WEBP: up to 25 MB and 24 megapixels."),
    h("div", { class: "capture" }, h("div", { class: "cam-box" }, video), h("div", { class: "row" }, start, take, stop)),
    h("div", { class: "row" }, h("button", { type: "button", class: "btn btn-quiet", onclick: () => file.click() }, "Open a photo"), file, sample),
    status, ready, prepareNote, prepare);
  const syncConsent = (): void => {
    const visit = gate.hasVisit, localOnly = gate.localOnly, changed = !consentInitialised || lastVisit !== visit || lastLocalOnly !== localOnly;
    consentInitialised = true; lastVisit = visit; lastLocalOnly = localOnly; ctx.consent = visit;
    consent.hidden = visit; controls.hidden = !visit;
    if (changed && !visit) { generation++; serverGeneration++; opening?.abort(); releasePending(); stopCamera(); clearCurrent(); drawReady(); }
    else if (changed && localOnly) { serverGeneration++; const old = ctx.photo; ctx.photo = null; forgetServer(old); drawReady(); }
    syncPrepare();
  };
  const tick = (): void => { continueButton.disabled = !agree.checked || !adult.checked; };
  agree.addEventListener("change", tick); adult.addEventListener("change", tick);
  continueButton.addEventListener("click", () => {
    if (gate === appConsent) appConsent.acceptVisit({ adult: adult.checked, understood: agree.checked });
    else gate.acceptVisit({ adult: adult.checked, understood: agree.checked });
    syncConsent();
  });
  const unsubscribe = gate.subscribe(syncConsent);
  syncConsent(); drawReady();
  return { element: h("section", { class: "photo-screen" }, h("h1", {}, "Start with one clear photo"), consent, controls), dispose() {
    if (disposed) return; disposed = true; generation++; serverGeneration++; opening?.abort(); releasePending(); stopCamera(); unsubscribe();
  } };
}

export function renderPhoto(main: HTMLElement, ctx: Ctx, deps: PhotoScreenDeps = {}): () => void {
  const screen = photoScreen(ctx, deps); main.replaceChildren(screen.element); return () => screen.dispose();
}
