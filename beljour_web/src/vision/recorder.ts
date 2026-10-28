/** R4 recorder: local photo annotation, released-photo landmark capture, mask
 * export and face selection. Never uploads or persists the source image.
 * Works in manual mode while MediaPipe model licences are pending.
 * Face-mapping credits (licences.json "concepts"): runtime MediaPipe Face Landmarker
 * (Bucket A); concept only, no code copied: iBUG 300-W (manual landmark annotation
 * practice), from its published description. Author: John Khan.
 */
import { polygon } from "../engines/core/mask.js";
import type { Mask } from "../engines/core/buffer.js";
import { regionMask, type Region } from "../data/regions/index.js";
import { defaultVisionClient } from "./client.js";
import type { DetectedFace, Point3 } from "./geometry.js";
import { createFixture } from "./fixtures.js";
import { hashModel } from "./model-registry.js";

const element = <T extends HTMLElement>(id: string) => {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Recorder control ${id} is missing`);
  return found as T;
};
const canvas = element<HTMLCanvasElement>("preview");
const context = canvas.getContext("2d");
if (!context) throw new Error("This browser does not offer a 2D canvas");
const ctx = context;
const photoInput = element<HTMLInputElement>("photo");
const release = element<HTMLInputElement>("release");
const consent = element<HTMLInputElement>("consent");
const message = element<HTMLElement>("fixture-status");
const modelStatus = element<HTMLElement>("model-status");
const count = element<HTMLElement>("point-count");
const region = element<HTMLSelectElement>("region");
const faceBtn = element<HTMLButtonElement>("detect-face");
const poseBtn = element<HTMLButtonElement>("detect-pose");
const vision = defaultVisionClient();
let bitmap: ImageBitmap | null = null;
let imageHash = "";
let points: [number, number][] = [];
let layers: { name: string; mask: Mask }[] = [];
let faces: DetectedFace[] = [];
let bodyPose: Point3[] | null = null;
let mode: "manual" | "local-model" = "manual";
let chosenId: string | null = null;
const READY_FACE = vision.ready("face-landmarks");
const READY_POSE = vision.ready("pose");
faceBtn.disabled = !READY_FACE;
poseBtn.disabled = !READY_POSE;
modelStatus.textContent = READY_FACE || READY_POSE
  ? "Approved local models are available. All model processing runs in a worker."
  : "MediaPipe weights are pending licence checks. Manual polygons work now; there will be no model download.";

function status(text: string): void { message.textContent = text; }
function viewScale(sourceWidth: number, sourceHeight: number): number {
  return Math.min(1, 768 / Math.max(sourceWidth, sourceHeight));
}
function redraw(): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (bitmap) ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  for (const [layerIndex, layer] of layers.entries()) {
    ctx.save();
    ctx.fillStyle = layerIndex % 2 ? "rgba(206,17,38,.20)" : "rgba(0,85,164,.25)";
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < layer.mask.data.length; i++) {
      if (layer.mask.data[i] < 0.1) continue;
      const alpha = layer.mask.data[i] * 0.18;
      const offset = i * 4;
      const target = layerIndex % 2 ? [206, 17, 38] : [0, 85, 164];
      for (let k = 0; k < 3; k++) data.data[offset + k] = Math.round(data.data[offset + k] * (1 - alpha) + target[k] * alpha);
    }
    ctx.putImageData(data, 0, 0);
    ctx.restore();
  }
  if (faces.length) {
    for (const f of faces) {
      const b = f.bounds;
      ctx.strokeStyle = f.id === chosenId ? "#E1000F" : "#000091";
      ctx.lineWidth = f.id === chosenId ? 3 : 1.5;
      ctx.strokeRect(b.left * canvas.width, b.top * canvas.height,
                     (b.right - b.left) * canvas.width, (b.bottom - b.top) * canvas.height);
      ctx.fillStyle = "#000091";
      ctx.fillText(f.id, b.left * canvas.width, Math.max(12, b.top * canvas.height - 4));
    }
  }
  if (points.length) {
    ctx.save(); ctx.strokeStyle = "#E1000F"; ctx.fillStyle = "#E1000F"; ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke();
    for (const [x, y] of points) { ctx.beginPath(); ctx.arc(x, y, 3, 0, 2 * Math.PI); ctx.fill(); }
    ctx.restore();
  }
  count.textContent = `${points.length} polygon points, ${layers.length} saved masks, ${faces.length} detected faces.`;
}

photoInput.addEventListener("change", () => { void (async () => {
  const file = photoInput.files?.[0];
  if (!file) return;
  if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 20_000_000) {
    status("Choose a JPG or PNG no larger than 20 MB."); return;
  }
  const old = bitmap;
  try {
    const bytes = await file.arrayBuffer();
    const candidate = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = viewScale(candidate.width, candidate.height);
    const w = Math.max(1, Math.round(candidate.width * scale));
    const h = Math.max(1, Math.round(candidate.height * scale));
    if (w * h > 4_194_304) throw new RangeError("Photo is too large for a fixture");
    bitmap = candidate; imageHash = await hashModel(bytes);
    canvas.width = w; canvas.height = h;
    old?.close();
    points = []; layers = []; faces = []; bodyPose = null; mode = "manual"; chosenId = null;
    vision.resetFaces(); redraw();
    status("Photo loaded locally. Click around a region; close the polygon and save the fixture.");
  } catch (error) { status(`Unable to read photo: ${error instanceof Error ? error.message : "Unknown error"}`); }
})().catch((error) => status(String(error))); });

canvas.addEventListener("pointerdown", (event) => {
  if (!bitmap) { status("Choose a released photo first."); return; }
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * canvas.width / rect.width;
  const y = (event.clientY - rect.top) * canvas.height / rect.height;
  if (faces.length && event.shiftKey) {
    const picked = vision.pick(faces, x / canvas.width, y / canvas.height);
    chosenId = picked?.id ?? null; redraw(); return;
  }
  if (x >= 0 && y >= 0 && x <= canvas.width && y <= canvas.height) {
    points.push([x, y]); redraw();
  }
});

element<HTMLButtonElement>("close-polygon").addEventListener("click", () => {
  if (points.length < 3) { status("Draw at least three points before closing a polygon."); return; }
  try {
    const mask = polygon(canvas.width, canvas.height, points, 4);
    const name = region.value;
    layers = layers.filter((layer) => layer.name !== name);
    layers.push({ name, mask }); points = []; redraw();
    status(`Saved ${name} mask locally. Add another mask or save the JSON fixture.`);
  } catch (error) { status(String(error)); }
});
element<HTMLButtonElement>("undo-point").addEventListener("click", () => { points.pop(); redraw(); });
element<HTMLButtonElement>("clear-points").addEventListener("click", () => { points = []; redraw(); });
element<HTMLButtonElement>("reset-masks").addEventListener("click", () => {
  layers = []; points = []; redraw(); status("Cleared manual mask annotations.");
});
faceBtn.addEventListener("click", () => { void (async () => {
  if (!bitmap) return;
  status("Checking locally in the vision worker…");
  // Use the clean photo, never the preview with manual strokes/overlays.
  const clean = document.createElement("canvas");
  clean.width = canvas.width; clean.height = canvas.height;
  clean.getContext("2d")?.drawImage(bitmap, 0, 0, clean.width, clean.height);
  const result = await vision.detectImage("face-landmarks", clean, canvas.width, canvas.height, { maxFaces: 6 });
  if (!result.ok || !result.faces?.length) { status(result.error ?? "No faces detected. Draw a manual mask."); return; }
  faces = result.faces;
  chosenId = faces[0].id; mode = "local-model";
  const person = faces[0];
  for (const name of ["face_oval", "lips", "eyes", "brows", "irises", "skin"] as Region[]) {
    const mask = regionMask(name, person.landmarks, canvas.width, canvas.height);
    layers = layers.filter((item) => item.name !== name);
    layers.push({ name, mask });
  }
  redraw(); status(`${faces.length} faces found. Hold Shift and click one to select it. Masks stay on this device.`);
})().catch((error) => status(String(error))); });
poseBtn.addEventListener("click", () => { void (async () => {
  if (!bitmap) return;
  const clean = document.createElement("canvas");
  clean.width = canvas.width; clean.height = canvas.height;
  clean.getContext("2d")?.drawImage(bitmap, 0, 0, clean.width, clean.height);
  const result = await vision.detectImage("pose", clean, canvas.width, canvas.height, { maxFaces: 2 });
  if (!result.ok) { status(result.error ?? "Pose unavailable. Use a manual mask."); return; }
  bodyPose = result.output?.poses?.[0] ?? null;
  if (bodyPose) mode = "local-model";
  status(bodyPose ? "33 pose landmarks captured locally; not a posture assessment or medical advice." : "No pose detected.");
})().catch((error) => status(String(error))); });

element<HTMLButtonElement>("save-fixture").addEventListener("click", () => { void (async () => {
  if (!bitmap || !imageHash) { status("Load a released photo first."); return; }
  if (!consent.checked) { status("A signed release is required to save biometric landmarks or masks."); return; }
  try {
    const fixture = await createFixture({
      releaseRef: release.value.trim(), released: consent.checked, imageHash,
      width: canvas.width, height: canvas.height, mode, faces, bodyPose, masks: layers,
    });
    const blob = new Blob([JSON.stringify(fixture)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `beljour-vision-${fixture.source.releaseRef}.json`;
    document.body.appendChild(link); link.click(); link.remove();
    // No photo data, cookies, network, IndexedDB or localStorage are involved.
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
    status("Fixture saved. Keep the JSON and the signed release in secure storage.");
  } catch (error) { status(`Fixture not saved: ${error instanceof Error ? error.message : "invalid data"}`); }
})().catch((error) => status(String(error))); });
redraw();
