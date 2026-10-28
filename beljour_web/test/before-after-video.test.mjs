// Before / after video: frames composed from her two images, recorded on the device through the
// clip job, labelled, tracks released, and refused plainly where the browser can't record.
// Drawn images; a recording fake stands in for the browser's MediaRecorder. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as V from "../dist/js/save/before-after-video.js";
import { beforeAfterScreen } from "../dist/js/screens/before-after-video.js";
import { Editor } from "../dist/js/ui/shell/controller.js";
import { ShellGpuRenderer } from "../dist/js/ui/shell/gpu-renderer.js";
import { EditorChrome } from "../dist/js/layout/editor-chrome.js";
import { installDOM, Element } from "./helpers/dom.mjs";

const flat = (w, h, rgb, channels = 3) => ({ width: w, height: h, channels,
  data: Uint8Array.from({ length: w * h * channels }, (_, i) => (channels === 4 && i % 4 === 3 ? 200 : rgb[i % channels] ?? 0)) });

function fakeBrowser({ supported = true, capture = true } = {}) {
  const log = { frames: [], texts: [], tracksStopped: 0, mime: null };
  const track = { stop() { log.tracksStopped++; } };
  const canvas = (w, h) => ({ width: w, height: h,
    getContext: () => ({ font: "", fillStyle: "", putImageData: (d) => log.frames.push(d), fillText: (t) => log.texts.push(t) }),
    ...(capture ? { captureStream: (fps) => { log.fps = fps; return { getTracks: () => [track] }; } } : {}) });
  const makeRecorder = (stream, options) => {
    log.mime = options.mimeType;
    const handlers = {};
    return { state: "inactive", addEventListener: (k, f) => { handlers[k] = f; }, removeEventListener: () => {},
      start() { this.state = "recording"; },
      stop() { this.state = "inactive"; handlers.dataavailable?.({ data: new Blob([new Uint8Array(log.frames.length)]) }); handlers.stop?.(); } };
  };
  return { log, deps: { canvas, makeRecorder, imageData: (data, w, h) => ({ data, width: w, height: h }),
    supported: (m) => supported && m.startsWith("video/webm"), tick: async () => {} } };
}

test("the wipe holds the original, moves left to right, then holds the edit", () => {
  const n = V.FPS * V.SECONDS;
  assert.equal(V.wipeAt(0, n), 0);
  assert.equal(V.wipeAt(Math.floor(V.HOLD * V.FPS) - 1, n), 0);
  assert.equal(V.wipeAt(n - 1, n), 1);
  for (let i = 1; i < n; i++) assert.ok(V.wipeAt(i, n) >= V.wipeAt(i - 1, n));
  const before = flat(40, 20, [10, 20, 30]), after = flat(40, 20, [200, 150, 100]);
  const mid = V.composeFrame(before, after, 0.5);
  assert.deepEqual(Array.from(mid.slice(0, 4)), [200, 150, 100, 255], "left of the divider is the edit");
  assert.deepEqual(Array.from(mid.slice(39 * 4, 40 * 4)), [10, 20, 30, 255], "right of it is the original");
  assert.deepEqual(Array.from(mid.slice(20 * 4, 21 * 4)), [255, 255, 255, 255], "a white divider");
  assert.deepEqual(Array.from(V.composeFrame(before, after, 0).slice(0, 4)), [10, 20, 30, 255]);
  const rgba = V.composeFrame(flat(4, 2, [1, 2, 3], 4), flat(4, 2, [9, 9, 9], 4), 1);
  assert.equal(rgba[3], 200, "alpha carried through");
  assert.throws(() => V.composeFrame(before, flat(20, 20, [0, 0, 0]), 0.5), (e) => e.code === "size_mismatch");
});

test("a recording draws every frame, labels the edit, saves one clip and releases the camera tracks", async () => {
  const { log, deps } = fakeBrowser();
  const clip = await V.recordBeforeAfter(flat(64, 48, [10, 20, 30]), flat(64, 48, [200, 150, 100]), deps, { simulationLabel: true, isSimulation: true });
  assert.equal(log.frames.length, V.FPS * V.SECONDS);
  assert.equal(log.fps, V.FPS);
  assert.equal(log.mime, "video/webm;codecs=vp9");
  assert.ok(log.texts.includes("Before") && log.texts.includes("After · Simulation"));
  assert.ok(clip.blob.size > 0); assert.equal(clip.label, "Simulation");
  assert.equal(log.tracksStopped, 1, "stream tracks released");
  const plain = fakeBrowser();
  await V.recordBeforeAfter(flat(64, 48, [1, 1, 1]), flat(64, 48, [2, 2, 2]), plain.deps, { simulationLabel: false, isSimulation: true });
  assert.ok(!plain.log.texts.some((t) => /Simulation/.test(t)) && plain.log.texts.includes("After"));
  assert.deepEqual(V.frameLabels(0.5, true, false).map((l) => l.text), ["After", "Before"]);
});

test("no recorder, or a canvas that can't stream: refused with a code, nothing recorded", async () => {
  for (const opts of [{ supported: false }, { capture: false }]) {
    const { log, deps } = fakeBrowser(opts);
    await assert.rejects(V.recordBeforeAfter(flat(8, 8, [0, 0, 0]), flat(8, 8, [1, 1, 1]), deps, { simulationLabel: true, isSimulation: true }),
      (e) => e instanceof V.VideoRefused && e.code === "no_recorder" && /compare image/.test(e.message));
    assert.equal(log.frames.length, 0);
  }
});

test("the panel saves the clip from the editor's photo and edit; the studio opens it", async () => {
  const dom = installDOM();
  try {
    const editor = new Editor("portrait", new ShellGpuRenderer(null));
    editor.add("enhance", { mode: "natural" }, 60);
    const { deps } = fakeBrowser();
    const saved = [];
    const panel = beforeAfterScreen(editor, "Soft day", { record: deps, download: (name, type, bytes) => saved.push([name, type, bytes.length]) });
    await panel.querySelector("button").click();
    assert.equal(saved.length, 1);
    assert.deepEqual(saved[0].slice(0, 2), ["GoodLookin_SoftDay_BeforeAfter.webm", "video/webm"]);
    assert.match(panel.textContent, /Saved GoodLookin_SoftDay_BeforeAfter\.webm \(4 s/);
    for (const id of ["lg-deliverable", "lg-close-deliverable", "lg-chrome-status"]) {
      const node = new Element(id === "lg-deliverable" ? "section" : "div"); node.setAttribute("id", id); dom.root.append(node);
    }
    new EditorChrome({ editor, draw() {}, afterSource() {} }, document).openDeliverable("video");
    assert.match(document.getElementById("lg-deliverable").textContent, /Before \/ after video/);
  } finally { dom.restore(); }
});
