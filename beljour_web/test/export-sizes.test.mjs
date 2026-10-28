// One-tap export sizes: shape kept, face kept, honest about size, no watermark, metadata stripped.
// Drawn photos only. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as S from "../dist/js/save/size-presets.js";
import { hasMetadata } from "../dist/js/save/export.js";
import { exportSizesScreen } from "../dist/js/screens/export-sizes.js";
import { Editor } from "../dist/js/ui/shell/controller.js";
import { ShellGpuRenderer } from "../dist/js/ui/shell/gpu-renderer.js";
import { EditorChrome } from "../dist/js/layout/editor-chrome.js";
import { installDOM, Element } from "./helpers/dom.mjs";

const JPEG_WITH_EXIF = Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x04, 0x45, 0x78, 0xff, 0xda, 0x00, 0x02, 0xff, 0xd9]);
const encoder = (calls) => ({ encode: async (pixels, options) => { calls.push({ pixels, options }); return JPEG_WITH_EXIF; } });
const photo = (w, h, channels = 3) => {
  const data = new Uint8Array(w * h * channels);
  for (let p = 0; p < w * h; p++) { data[p * channels] = p % 251; data[p * channels + 1] = (p >> 3) % 241; data[p * channels + 2] = 90; if (channels === 4) data[p * 4 + 3] = (p * 7) % 256; }
  return { width: w, height: h, channels, data };
};
const faceAt = (cx, cy, r) => Array.from({ length: 478 }, (_, i) => [cx + r * Math.cos(i), cy + r * Math.sin(i)]);

test("every preset keeps its shape; a big enough photo gets the exact size", () => {
  for (const p of S.PRESETS.filter((q) => q.height)) {
    const plan = S.planSize(2400, 2400, p.id);
    assert.deepEqual([plan.width, plan.height, plan.reduced], [p.width, p.height, false], p.id);
    assert.ok(Math.abs(plan.crop.width / plan.crop.height - p.width / p.height) < 0.01, `${p.id} not squashed`);
  }
  assert.deepEqual([S.planSize(800, 600, "web").width, S.planSize(800, 600, "web").height], [1600, 1200]);
  assert.deepEqual([S.planSize(640, 480, "original").width, S.planSize(640, 480, "original").height], [640, 480]);
});

test("the editor's 640-pixel copy is enlarged at most 2x and the file says its real size", () => {
  const plan = S.planSize(640, 480, "square");
  assert.deepEqual([plan.crop.width, plan.crop.height, plan.width, plan.height, plan.reduced], [480, 480, 960, 960, true]);
  assert.match(plan.note, /Saved at 960 x 960.*HD export/);
  assert.ok(plan.scale <= S.MAX_ENLARGE);
});

test("the crop follows the face, and a size that would cut the face is refused with a code", () => {
  const face = faceAt(560, 240, 60);
  const plan = S.planSize(640, 480, "square", face);
  assert.equal(plan.faceKept, true);
  assert.ok(plan.crop.x > 0 && plan.crop.x + plan.crop.width === 640, "slid right toward the face");
  assert.equal(S.planSize(640, 480, "square").crop.x, 80, "no face: centred");
  const big = faceAt(320, 240, 230);
  assert.throws(() => S.planSize(640, 480, "story", big), (e) => e instanceof S.SizeRefused && e.code === "face_would_be_cut");
  assert.throws(() => S.planSize(640, 480, "billboard"), (e) => e.code === "unknown_preset");
});

test("pixels: a crop without resizing is the exact source; alpha is carried through", () => {
  const img = photo(640, 480, 4);
  const plan = { ...S.planSize(640, 480, "square"), width: 480, height: 480 };
  const out = S.renderSize(img, plan);
  for (const [r, c] of [[0, 0], [100, 37], [479, 479]]) {
    const from = (r * 640 + c + 80) * 4, to = (r * 480 + c) * 4;
    assert.deepEqual(Array.from(out.data.slice(to, to + 4)), Array.from(img.data.slice(from, from + 4)));
  }
});

test("export: no watermark, the label only when asked and simulated, metadata gone", async () => {
  const img = photo(640, 480);
  const calls = [];
  const { file, plan } = await S.exportSize(img, "square", encoder(calls), { lookName: "Date night", simulationLabel: true, isSimulation: true });
  assert.equal(calls[0].options.label, "Simulation");
  assert.deepEqual(Array.from(calls[0].pixels.data), Array.from(S.renderSize(img, plan).data), "the encoder gets the photo and nothing drawn on it");
  assert.equal(hasMetadata(file.bytes), false);
  assert.equal(file.name, "GoodLookin_DateNight_SquarePost_960x960.jpg");
  const off = [];
  await S.exportSize(img, "wide", encoder(off), { lookName: "x", simulationLabel: false, isSimulation: true });
  await S.exportSize(img, "wide", encoder(off), { lookName: "x", simulationLabel: true, isSimulation: false });
  assert.deepEqual(off.map((c) => c.options.label), [null, null]);
});

test("the panel saves one file per tap and the studio opens it under the photo", async () => {
  const dom = installDOM();
  try {
    const saved = [];
    const source = { rendered: () => ({ image: photo(640, 480), labels: ["Look · Biarritz"], face: undefined }) };
    const panel = exportSizesScreen(source, "Soft day", { encoder: encoder([]), download: (name, type, bytes) => saved.push([name, type, bytes.length]) });
    const buttons = panel.querySelectorAll("button");
    assert.equal(buttons.length, S.PRESETS.length);
    await buttons.find((b) => b.getAttribute("data-size") === "portrait").click();
    assert.equal(saved.length, 1); assert.match(saved[0][0], /PortraitPost_768x960\.jpg$/); assert.equal(saved[0][1], "image/jpeg");
    assert.match(panel.textContent, /No watermark, free or paid/);
    for (const id of ["lg-deliverable", "lg-close-deliverable", "lg-chrome-status", "lg-export-sizes"]) {
      const node = new Element(id === "lg-deliverable" ? "section" : "button"); node.setAttribute("id", id); dom.root.append(node);
    }
    const editor = new Editor("portrait", new ShellGpuRenderer(null));
    const chrome = new EditorChrome({ editor, draw() {}, afterSource() {} }, document);
    chrome.openDeliverable("sizes");
    const shown = document.getElementById("lg-deliverable");
    assert.equal(shown.hidden, false);
    assert.match(shown.textContent, /Export sizes/);
  } finally { dom.restore(); }
});
