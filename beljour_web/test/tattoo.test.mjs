// Tattoo try-on: her own art only, inked inside her face skin along the mesh, never over eyes,
// brows or lips, texture kept, mirrored selfies handled, faces-away triangles left uninked.
// Drawn portrait and drawn designs only. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "../dist/js/engines/local/tattoo.js";
import { regionMask } from "../dist/js/data/regions/index.js";
import { tattooScreen } from "../dist/js/screens/tattoo.js";
import { hasMetadata } from "../dist/js/save/export.js";
import { Editor } from "../dist/js/ui/shell/controller.js";
import { ShellGpuRenderer } from "../dist/js/ui/shell/gpu-renderer.js";
import { EditorChrome } from "../dist/js/layout/editor-chrome.js";
import { installDOM, Element } from "./helpers/dom.mjs";

const sample = new Editor("portrait", new ShellGpuRenderer(null)).source;
const { image, face } = sample;
const W = image.width, H = image.height;
/** A drawn design: a dark ring on a transparent background. */
const ring = (n = 64) => ({ width: n, height: n, data: Uint8ClampedArray.from({ length: n * n * 4 }, (_, i) => {
  const p = i >> 2, c = i & 3, d = Math.hypot(p % n - n / 2, Math.floor(p / n) - n / 2), on = d > n * 0.3 && d < n * 0.45;
  return c === 3 ? (on ? 255 : 0) : 20; }) });
const changed = (a, b) => { const out = []; for (let q = 0; q < a.width * a.height; q++) if ([0, 1, 2].some((c) => a.data[q * a.channels + c] !== b.data[q * b.channels + c])) out.push(q); return out; };
const mask = (name, pts) => regionMask(name, pts, W, H, { normalized: false, supersample: 2 }).data;

test("her art is inked only on visible skin, never on eyes, brows or lips, and only darkens", () => {
  const out = T.renderTattoo(image, face, ring(), T.DEFAULT_PLACEMENT, true);
  const moved = changed(out.image, image);
  assert.ok(out.inked > 50 && moved.length === out.inked);
  const skin = mask("skin", face);
  for (const name of ["eyes", "brows", "lips"]) { const m = mask(name, face); assert.ok(!moved.some((q) => m[q] >= 0.5), name); }
  assert.ok(moved.every((q) => skin[q] > 0), "inside the skin");
  assert.ok(moved.every((q) => [0, 1, 2].every((c) => out.image.data[q * 3 + c] <= image.data[q * 3 + c])), "multiply ink only darkens");
  const cx = moved.reduce((s, q) => s + q % W, 0) / moved.length, cy = moved.reduce((s, q) => s + Math.floor(q / W), 0) / moved.length;
  const anchor = face[T.ZONES.cheek_a.anchor];
  assert.ok(Math.hypot(cx - anchor[0], cy - anchor[1]) < 25, "centred on the chosen zone");
  assert.equal(out.label, T.LABEL); assert.match(out.zone, /^Cheek \(photo (left|right)\)$/);
});

test("the design follows the face: a moved and smaller face carries it along", () => {
  const small = face.map(([x, y]) => [x * 0.7 + 30, y * 0.7 + 20]);
  const a = changed(T.renderTattoo(image, face, ring(), T.DEFAULT_PLACEMENT, true).image, image);
  const b = changed(T.renderTattoo(image, small, ring(), T.DEFAULT_PLACEMENT, true).image, image);
  assert.ok(b.length < a.length * 0.7, "smaller on the smaller face");
  const bx = b.reduce((s, q) => s + q % W, 0) / b.length;
  assert.ok(Math.abs(bx - small[T.ZONES.cheek_a.anchor][0]) < 20);
});

test("a mirrored selfie inks the same and names the side it is really on", () => {
  const mirror = { width: W, height: H, channels: 3, data: new Uint8Array(W * H * 3) };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let c = 0; c < 3; c++) mirror.data[(y * W + x) * 3 + c] = image.data[(y * W + (W - 1 - x)) * 3 + c];
  const flipped = face.map(([x, y]) => [W - x, y]);
  const plain = T.renderTattoo(image, face, ring(), T.DEFAULT_PLACEMENT, true);
  const mirrored = T.renderTattoo(mirror, flipped, ring(), T.DEFAULT_PLACEMENT, true);
  assert.ok(Math.abs(mirrored.inked - plain.inked) <= plain.inked * 0.1, `mirrored ${mirrored.inked}, plain ${plain.inked}`);
  assert.equal(mirrored.hiddenTriangles, plain.hiddenTriangles);
  assert.notEqual(T.zoneLabel("cheek_a", flipped), T.zoneLabel("cheek_a", face));
});

test("where her face turns away, that part is left uninked; fully turned away, nothing is drawn", () => {
  const centre = (face[234][0] + face[454][0]) / 2;
  const side = face[T.ZONES.cheek_a.anchor][0] < centre ? -1 : 1;
  const fold = (off) => face.map(([x, y]) => ((x - centre) * side > off ? [centre + side * off - (x - centre - side * off) * 0.4, y] : [x, y]));
  const p = { ...T.DEFAULT_PLACEMENT, size: 0.9 };
  const plain = T.renderTattoo(image, face, ring(), p, true);
  const partly = T.renderTattoo(image, fold(50), ring(), p, true);
  assert.ok(partly.hiddenTriangles > plain.hiddenTriangles && partly.inked > 0 && partly.inked < plain.inked);
  assert.throws(() => T.renderTattoo(image, fold(8), ring(), p, true), (e) => e.code === "nothing_visible");
  // Only the turned-away side is refused: the cheek facing the camera on the same photo still inks.
  const near = T.renderTattoo(image, fold(8), ring(), { ...p, zone: side < 0 ? "cheek_b" : "cheek_a" }, true);
  assert.ok(near.inked > 0);
});

test("refusals: not confirmed as hers, no face points, nothing to ink, bad placement", () => {
  assert.throws(() => T.renderTattoo(image, face, ring(), T.DEFAULT_PLACEMENT, false), (e) => e.code === "not_her_art");
  assert.throws(() => T.renderTattoo(image, null, ring(), T.DEFAULT_PLACEMENT, true), (e) => e.code === "no_face_points");
  const white = { width: 16, height: 16, data: new Uint8ClampedArray(16 * 16 * 4).fill(255) };
  assert.throws(() => T.renderTattoo(image, face, white, T.DEFAULT_PLACEMENT, true), (e) => e.code === "bad_art", "an all-white sheet keys out to nothing");
  assert.throws(() => T.renderTattoo(image, face, ring(), { ...T.DEFAULT_PLACEMENT, size: 3 }, true), (e) => e.code === "bad_placement");
  const opaque = T.prepareArt({ width: 8, height: 8, data: Uint8ClampedArray.from({ length: 256 }, (_, i) => (i % 4 === 3 ? 255 : i < 128 ? 250 : 30)) });
  assert.equal(opaque.data[3], 0, "near-white background keyed out"); assert.equal(opaque.data[255], 255, "dark ink kept");
});

test("the panel inks after she confirms, saves labelled with no metadata; the studio opens it", async () => {
  const dom = installDOM();
  try {
    const editor = new Editor("portrait", new ShellGpuRenderer(null));
    const saved = [], calls = [];
    const encoder = { encode: async (px, o) => { calls.push(o); return Uint8Array.from([255, 216, 255, 225, 0, 4, 69, 120, 255, 218, 0, 2, 255, 217]); } };
    const panel = tattooScreen(editor, "Night", { readArt: async () => ring(), encoder, paint: () => {}, download: (n, t, b) => saved.push([n, b]) });
    const [mine, file] = panel.querySelectorAll("input");
    file.files = [{ type: "image/png", size: 10 }];
    await file.dispatch("change");
    assert.match(panel.textContent, /Confirm the design is yours/);
    mine.checked = true; await mine.dispatch("change");
    assert.match(panel.textContent, /design placed/);
    await panel.querySelectorAll("button")[0].click();
    assert.equal(saved.length, 1); assert.match(saved[0][0], /^GoodLookin_NightTattoo_01\.jpg$/);
    assert.equal(hasMetadata(saved[0][1]), false); assert.equal(calls[0].label, "Simulation");
    for (const id of ["lg-deliverable", "lg-close-deliverable", "lg-chrome-status"]) {
      const node = new Element(id === "lg-deliverable" ? "section" : "div"); node.setAttribute("id", id); dom.root.append(node);
    }
    new EditorChrome({ editor, draw() {}, afterSource() {} }, document).openDeliverable("tattoo");
    assert.match(document.getElementById("lg-deliverable").textContent, /Tattoo try-on/);
  } finally { dom.restore(); }
});
