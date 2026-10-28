// Sticker pack: cut-out from a real mask only, white outline, caption line, four animations as
// valid PNG / APNG files that decode back to the exact frames. Drawn photos. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { inflateSync } from "node:zlib";
import * as S from "../dist/js/save/sticker.js";
import { encodePng } from "../dist/js/save/apng.js";
import { crc32 } from "../dist/js/save/export.js";
import { stickersScreen } from "../dist/js/screens/stickers.js";
import { Editor } from "../dist/js/ui/shell/controller.js";
import { ShellGpuRenderer } from "../dist/js/ui/shell/gpu-renderer.js";
import { EditorChrome } from "../dist/js/layout/editor-chrome.js";
import { installDOM, Element } from "./helpers/dom.mjs";

const photo = (w, h) => ({ width: w, height: h, channels: 3, data: Uint8Array.from({ length: w * h * 3 }, (_, i) => 30 + (i * 13) % 200) });
const disc = (w, h, cx, cy, r) => ({ width: w, height: h, channels: 1, data: Float32Array.from({ length: w * h }, (_, p) => (Math.hypot(p % w - cx, Math.floor(p / w) - cy) <= r ? 1 : 0)) });

function chunks(png) {
  assert.deepEqual(Array.from(png.slice(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10]);
  const out = [];
  for (let o = 8; o < png.length;) {
    const len = new DataView(png.buffer, png.byteOffset + o).getUint32(0);
    const type = String.fromCharCode(...png.slice(o + 4, o + 8));
    const crc = new DataView(png.buffer, png.byteOffset + o + 8 + len).getUint32(0);
    assert.equal(crc, crc32(png.slice(o + 4, o + 8 + len)), `${type} CRC`);
    out.push({ type, body: png.slice(o + 8, o + 8 + len) });
    o += 12 + len;
  }
  return out;
}
function frameOf(body, w, h) {
  const raw = inflateSync(Buffer.from(body));
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) { assert.equal(raw[y * (w * 4 + 1)], 0); data.set(raw.subarray(y * (w * 4 + 1) + 1, (y + 1) * (w * 4 + 1)), y * w * 4); }
  return data;
}

test("the cut-out comes from a real mask, in order: device person mask, her marked area, her face outline", () => {
  const img = photo(120, 100), m = disc(120, 100, 60, 50, 30);
  assert.equal(S.chooseCutout(img, { person: m, marked: disc(120, 100, 10, 10, 5) }).from, "person");
  assert.equal(S.chooseCutout(img, { marked: m }).from, "marked");
  const editor = new Editor("portrait", new ShellGpuRenderer(null));
  const face = S.chooseCutout(editor.source.image, { face: editor.source.face });
  assert.equal(face.from, "face"); assert.match(face.note, /face outline only/);
  assert.throws(() => S.chooseCutout(img, {}), (e) => e instanceof S.StickerRefused && e.code === "no_cutout");
  assert.throws(() => S.chooseCutout(img, { person: disc(50, 50, 1, 1, 1) }), (e) => e.code === "no_cutout", "a mask of another size is not used");
});

test("the sticker keeps her pixels inside, is clear outside and has a white outline", () => {
  const img = photo(120, 100);
  const cut = S.chooseCutout(img, { marked: disc(120, 100, 60, 50, 30) });
  const st = S.cutSticker(img, cut, 3);
  assert.deepEqual([st.width, st.height], [61 + 6, 61 + 6]);
  const at = (x, y) => Array.from(st.data.slice((y * st.width + x) * 4, (y * st.width + x) * 4 + 4));
  assert.equal(at(0, 0)[3], 0, "corner transparent");
  const c = 3 + 30, src = (50 * 120 + 60) * 3;
  assert.deepEqual(at(c, c), [img.data[src], img.data[src + 1], img.data[src + 2], 255], "centre is her pixel");
  assert.deepEqual(at(c, 1), [255, 255, 255, 255], "outline above the top edge");
  const big = S.cutSticker(photo(900, 900), S.chooseCutout(photo(900, 900), { marked: disc(900, 900, 450, 450, 440) }));
  assert.ok(Math.max(big.width, big.height) <= S.STICKER_SIDE);
});

test("captions: one plain line, with the simulation note when it applies", () => {
  assert.equal(S.captionLine("Best day", true, true), "Best day · Simulation");
  assert.equal(S.captionLine("Best day", false, true), "Best day");
  assert.equal(S.captionLine("", true, true), "Simulation");
  assert.equal(S.captionLine("", true, false), "");
  assert.throws(() => S.captionLine("x".repeat(41), true, true), (e) => e.code === "bad_caption");
  assert.throws(() => S.captionLine("two\nlines", true, true), (e) => e.code === "bad_caption");
  const st = { width: 10, height: 10, data: new Uint8ClampedArray(400).fill(9) };
  const both = S.withCaption(st, { width: 10, height: 4, data: new Uint8ClampedArray(160).fill(200) });
  assert.deepEqual([both.width, both.height], [10, 14]);
  assert.equal(both.data[(12 * 10 + 5) * 4], 200);
});

test("animations loop inside a padded canvas; the pack's PNG and APNG files decode to the exact frames", () => {
  const img = photo(120, 100);
  const st = S.cutSticker(img, S.chooseCutout(img, { marked: disc(120, 100, 60, 50, 30) }), 3);
  assert.equal(S.animate(st, "still").length, 1);
  for (const kind of ["bounce", "wiggle", "pulse"]) {
    const frames = S.animate(st, kind);
    assert.equal(frames.length, S.LOOP_FRAMES);
    assert.ok(frames.every((f) => f.data[3] === 0), `${kind}: corners stay clear`);
    assert.ok(frames.some((f) => f.data.some((v, i) => v !== frames[0].data[i])), `${kind} moves`);
  }
  const pack = S.stickerPack(st, { from: "marked", note: "n" });
  assert.deepEqual(pack.files.map((f) => [f.name, f.frames]), [["BELJOUR_Sticker_still.png", 1], ["BELJOUR_Sticker_bounce.png", 12],
    ["BELJOUR_Sticker_wiggle.png", 12], ["BELJOUR_Sticker_pulse.png", 12]]);
  const still = chunks(pack.files[0].bytes);
  assert.deepEqual(still.map((c) => c.type), ["IHDR", "IDAT", "IEND"]);
  assert.deepEqual(Array.from(frameOf(still[1].body, st.width, st.height)), Array.from(st.data));
  const bounce = chunks(pack.files[1].bytes), frames = S.animate(st, "bounce");
  assert.equal(new DataView(bounce.find((c) => c.type === "acTL").body.buffer).getUint32(0), 12);
  const fd = bounce.filter((c) => c.type === "fdAT");
  assert.equal(fd.length, 11);
  assert.deepEqual(Array.from(frameOf(fd[4].body.slice(4), frames[5].width, frames[5].height)), Array.from(frames[5].data));
  assert.ok(!bounce.some((c) => ["tEXt", "iTXt", "zTXt", "tIME", "eXIf"].includes(c.type)), "no metadata chunk");
  assert.match(new TextDecoder("latin1").decode(pack.zip), /BELJOUR Stickers\/BELJOUR_Sticker_pulse\.png/);
  assert.throws(() => encodePng([]), RangeError);
});

test("the panel makes the pack from the edited photo; the studio opens it", async () => {
  const dom = installDOM();
  try {
    const editor = new Editor("portrait", new ShellGpuRenderer(null));
    editor.add("enhance", { mode: "natural" }, 40);
    const saved = [], captions = [];
    const panel = stickersScreen(editor, { personMask: async () => null, paint: () => {}, download: (n, t, b) => saved.push([n, t, b.length]),
      drawCaption: (text, width) => { captions.push(text); return { width, height: 12, data: new Uint8ClampedArray(width * 48).fill(255) }; } });
    panel.querySelector("input").value = "Ready";
    await panel.querySelector("button").click();
    assert.deepEqual(saved.map((s) => s.slice(0, 2)), [["BELJOUR Stickers.zip", "application/zip"]]);
    assert.deepEqual(captions, ["Ready"], "enhance alone is not a simulation");
    assert.match(panel.textContent, /4 stickers.*Cut out along the area you marked/, "the portrait sample carries a marked person area, which takes precedence over the face outline");
    for (const id of ["lg-deliverable", "lg-close-deliverable", "lg-chrome-status"]) {
      const node = new Element(id === "lg-deliverable" ? "section" : "div"); node.setAttribute("id", id); dom.root.append(node);
    }
    new EditorChrome({ editor, draw() {}, afterSource() {} }, document).openDeliverable("stickers");
    assert.match(document.getElementById("lg-deliverable").textContent, /Sticker pack/);
  } finally { dom.restore(); }
});
