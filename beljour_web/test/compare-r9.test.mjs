// R9 compare modes: pixel compositors, stop grid values, layout at 390 px and 1280 px, keyboard session.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../dist/js/ui/shell/compare.js";
import * as L from "../dist/js/ui/shell/compare-layout.js";
import { CompareSession, defaultCompareState, normaliseCompareState, LOUPE_ZOOMS } from "../dist/js/ui/shell/compare-session.js";
import { COMMON_STOPS, POSTURE_STOPS } from "../dist/js/ui/shell/stops.js";

function solid(width, height, rgb) {
  const data = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) data.set(rgb, i * 3);
  return { width, height, channels: 3, data };
}
function ramp(width, height, seed = 1) {
  const data = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 3;
    data[i] = (x * 7 + seed) % 256; data[i + 1] = (y * 11 + seed * 3) % 256; data[i + 2] = (x * y + seed) % 256;
  }
  return { width, height, channels: 3, data };
}
const px = (img, x, y) => Array.from(img.data.subarray((y * img.width + x) * img.channels, (y * img.width + x) * img.channels + 3));

test("there are exactly ten compare modes with unique digit shortcuts and the R8 hold is mode 1", () => {
  assert.equal(C.COMPARE_MODES.length, 10);
  assert.equal(C.COMPARE_MODES[0], "hold");
  const keys = C.COMPARE_MODES.map((m) => C.MODE_INFO[m].key);
  assert.deepEqual(keys, ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]);
  for (const m of C.COMPARE_MODES) {
    const info = C.MODE_INFO[m];
    assert.equal(info.id, m);
    assert.ok(info.title.length > 1 && info.summary.length > 20);
    assert.ok(["pair", "quad", "stops"].includes(info.inputs));
  }
  assert.deepEqual(C.COMPARE_MODES.filter((m) => C.MODE_INFO[m].board), ["side-by-side", "grid-2x2", "stop-grid"]);
  assert.equal(C.isCompareMode("split-vertical"), true);
  assert.equal(C.isCompareMode("swipe"), false);
  assert.equal(C.splitOrientation("split-diagonal"), "diagonal");
  assert.equal(C.splitOrientation("loupe"), null);
});

test("vertical and horizontal splits take each side from the right image and draw a brand divider", () => {
  const before = solid(40, 30, [10, 20, 30]), after = solid(40, 30, [200, 150, 100]);
  const v = C.composeSplit(before, after, "vertical", 0.5);
  assert.deepEqual(px(v, 5, 10), [10, 20, 30]);
  assert.deepEqual(px(v, 35, 10), [200, 150, 100]);
  assert.deepEqual(px(v, 19, 10), [255, 255, 255], "divider core is white");
  assert.deepEqual(px(v, 18, 10), [0, 85, 164], "divider edge is the theme blue");
  const h = C.composeSplit(before, after, "horizontal", 0.25);
  assert.deepEqual(px(h, 20, 2), [10, 20, 30]);
  assert.deepEqual(px(h, 20, 25), [200, 150, 100]);
  const none = C.composeSplit(before, after, "vertical", 0.5, { showLine: false });
  assert.deepEqual(px(none, 19, 10), [10, 20, 30]);
  assert.deepEqual(px(none, 20, 10), [200, 150, 100]);
});

test("split position 0 shows only the edit and 1 only the original, with no divider", () => {
  const before = ramp(24, 18, 1), after = ramp(24, 18, 9);
  for (const o of ["vertical", "horizontal", "diagonal"]) {
    assert.deepEqual(Array.from(C.composeSplit(before, after, o, 0).data), Array.from(after.data), o);
    assert.deepEqual(Array.from(C.composeSplit(before, after, o, 1).data), Array.from(before.data), o);
  }
  assert.throws(() => C.composeSplit(before, after, "vertical", NaN), /finite/);
  assert.throws(() => C.composeSplit(before, solid(10, 10, [0, 0, 0]), "vertical", 0.5), /same size/);
  assert.throws(() => C.composeSplit(before, after, "vertical", 0.5, { line: 40 }), /Divider/);
});

test("the diagonal split puts the original above the top-right to bottom-left line", () => {
  const before = solid(50, 50, [0, 0, 0]), after = solid(50, 50, [255, 0, 0]);
  const d = C.composeSplit(before, after, "diagonal", 0.5);
  assert.deepEqual(px(d, 3, 3), [0, 0, 0], "top-left corner is before");
  assert.deepEqual(px(d, 46, 46), [255, 0, 0], "bottom-right corner is after");
  assert.ok(Math.abs(C.splitDistance("diagonal", 24.5, 24.5, 50, 50, 0.5)) < 1e-9, "the centre lies on the line");
  assert.ok(C.splitDistance("diagonal", 0, 0, 50, 50, 0.5) < 0);
});

test("absolute difference is |after − before| per channel, and its stats count changed pixels", () => {
  const a = ramp(16, 12, 3), b = { ...a, data: new Uint8Array(a.data) };
  b.data[(5 * 16 + 7) * 3] = Math.min(255, a.data[(5 * 16 + 7) * 3] + 40);
  b.data[(2 * 16 + 1) * 3 + 2] = Math.max(0, a.data[(2 * 16 + 1) * 3 + 2] - 3);
  const diff = C.absoluteDifference(a, b);
  for (let i = 0; i < diff.data.length; i++) assert.equal(diff.data[i], Math.abs(a.data[i] - b.data[i]));
  const stats = C.differenceStats(a, b);
  assert.equal(stats.changed, 2);
  assert.deepEqual(stats.box, [1, 2, 7, 5]);
  assert.equal(stats.max, Math.abs(b.data[(5 * 16 + 7) * 3] - a.data[(5 * 16 + 7) * 3]));
  assert.equal(C.differenceStats(a, b, 5).changed, 1, "the threshold ignores the 3-step change");
  const same = C.differenceStats(a, a);
  assert.equal(same.changed, 0); assert.equal(same.box, null); assert.equal(same.mean, 0);
  assert.throws(() => C.differenceStats(a, b, 0), /Threshold/);
});

test("the difference map colours changes on the blue-white-red ramp over a dimmed grey copy", () => {
  const a = solid(10, 10, [100, 100, 100]), b = { ...a, data: new Uint8Array(a.data) };
  b.data.set([255, 100, 100], (3 * 10 + 3) * 3);
  b.data.set([101, 100, 100], (6 * 10 + 6) * 3);
  const { image, stats } = C.differenceMap(a, b, { gain: 4, context: 0.5 });
  assert.equal(stats.changed, 2);
  assert.deepEqual(px(image, 3, 3), [206, 17, 38], "a large change is full red");
  const small = px(image, 6, 6);
  assert.ok(small[2] > small[0], "a 1-step change reads as blue");
  assert.deepEqual(px(image, 0, 0), [50, 50, 50], "unchanged pixels are dimmed grey");
  assert.deepEqual(C.rampColour(0), [0, 85, 164]);
  assert.deepEqual(C.rampColour(0.5), [255, 255, 255]);
  assert.deepEqual(C.rampColour(1), [206, 17, 38]);
  assert.throws(() => C.differenceMap(a, b, { gain: 0 }), /Gain/);
});

test("the loupe shows the same crop of both images, magnified by nearest neighbour and kept inside the photo", () => {
  const a = ramp(80, 60, 2), b = ramp(80, 60, 50);
  const { image, crop } = C.composeLoupe(a, b, [40, 30], 4, 64, { gap: 4 });
  assert.equal(image.width, 64 * 2 + 4); assert.equal(image.height, 64);
  assert.equal(crop.side, 16); assert.equal(crop.left, 32); assert.equal(crop.top, 22);
  for (const [x, y] of [[0, 0], [5, 9], [63, 63], [17, 40]]) {
    const sx = crop.left + Math.floor(x / crop.scale), sy = crop.top + Math.floor(y / crop.scale);
    assert.deepEqual(px(image, x, y), px(a, sx, sy));
    assert.deepEqual(px(image, 64 + 4 + x, y), px(b, sx, sy));
  }
  assert.deepEqual(px(image, 65, 10), [255, 255, 255], "the gap is white");
  const corner = C.loupeCrop(80, 60, [-50, 999], 2, 64);
  assert.equal(corner.left, 0); assert.equal(corner.top, 60 - corner.side);
  const stacked = C.composeLoupe(a, b, [10, 10], 2, 32, { stacked: true, gap: 2 });
  assert.equal(stacked.image.width, 32); assert.equal(stacked.image.height, 66);
  assert.throws(() => C.loupeCrop(80, 60, [1, 1], 0.5, 64), /zoom/);
});

test("cells are fitted inside their boxes without stretching", () => {
  const wide = ramp(40, 20), tall = ramp(20, 40);
  const { image, placed } = C.composeCells(100, 50, [
    { image: wide, cell: { x: 0, y: 0, w: 50, h: 50 } }, { image: tall, cell: { x: 50, y: 0, w: 50, h: 50 } }]);
  assert.equal(image.width, 100);
  assert.deepEqual(placed[0], { x: 0, y: 12, w: 50, h: 25 });
  assert.deepEqual(placed[1], { x: 62, y: 0, w: 25, h: 50 });
  assert.deepEqual(px(image, 1, 1), [255, 255, 255]);
  assert.throws(() => C.composeCells(10, 10, [{ image: wide, cell: { x: 5, y: 0, w: 10, h: 10 } }]), /outside/);
  assert.deepEqual(C.fitInside(200, 100, 50, 50), { width: 50, height: 25, x: 0, y: 12 });
});

test("flicker never changes faster than 2.5 times a second and pauses on a manual frame", () => {
  assert.equal(C.flickerPeriod(50), C.MIN_FLICKER_MS);
  assert.equal(C.flickerPeriod(99999), C.MAX_FLICKER_MS);
  assert.ok(1000 / C.MIN_FLICKER_MS <= 2.5);
  assert.equal(C.flickerFrame(0, 700, true, "after"), "before");
  assert.equal(C.flickerFrame(701, 700, true, "after"), "after");
  assert.equal(C.flickerFrame(1401, 700, true, "after"), "before");
  assert.equal(C.flickerFrame(701, 700, false, "after"), "after");
  assert.equal(C.flickerFrame(701, 700, false, "before"), "before");
  assert.throws(() => C.flickerFrame(-1, 700, true, "after"), /negative/);
});

test("stop grid values: nine rising strengths that include every named stop", () => {
  const common = C.stopGridValues(COMMON_STOPS);
  assert.deepEqual(common, [0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100]);
  const posture = C.stopGridValues(POSTURE_STOPS);
  assert.equal(posture.length, 9);
  for (const stop of POSTURE_STOPS) assert.ok(posture.includes(stop.value), `${stop.name} stop is in the grid`);
  assert.ok(posture.every((v, i) => i === 0 || v > posture[i - 1]));
  assert.ok(posture.every((v) => Math.abs(v * 2 - Math.round(v * 2)) < 1e-9), "half-percent steps");
  assert.equal(C.stopGridValues(COMMON_STOPS, 3).length, 3);
  assert.throws(() => C.stopGridValues(COMMON_STOPS, 1), /2–25/);
});

const VIEWPORTS = [[390, 844], [1280, 800]];
const PHOTOS = [{ width: 240, height: 200 }, { width: 272, height: 336 }, { width: 200, height: 260 }, { width: 640, height: 360 }];
const CAPTIONS = ["Original", "All edits", "Hair fibres alone", "All edits without Hair fibres", "Beard · Natural", "Posture edit · 12.5%",
  "Enhance · Extra", "Enhance · 87.5%", "Hair fibres · Full"];

test("every mode lays out cleanly at 390 px and 1280 px for landscape and portrait photos", () => {
  for (const [vw, vh] of VIEWPORTS) {
    const stage = L.stageBox(vw, vh);
    assert.equal(stage.phone, vw <= L.PHONE_MAX);
    assert.ok(stage.box.width <= vw, "the stage fits inside the window");
    for (const image of PHOTOS) {
      for (const mode of C.COMPARE_MODES) {
        const layout = L.layoutCompare({ mode, image, captions: CAPTIONS, box: stage.box, phone: stage.phone });
        assert.deepEqual(L.layoutProblems(layout, stage.box), [], `${mode} at ${vw}px for ${image.width}×${image.height}`);
        assert.ok(layout.width * layout.displayScale <= stage.box.width + 0.5);
        const expected = C.MODE_INFO[mode].inputs === "quad" ? 4 : C.MODE_INFO[mode].inputs === "stops" ? 9 : mode === "side-by-side" || mode === "loupe" ? 2 : 1;
        assert.equal(layout.panes.length, expected, mode);
      }
    }
  }
});

test("phone layout: side by side stacks landscape photos, 3×3 keeps three readable columns", () => {
  const phone = L.stageBox(390, 844);
  const land = L.layoutCompare({ mode: "side-by-side", image: { width: 640, height: 360 }, captions: CAPTIONS, box: phone.box, phone: true });
  assert.equal(land.columns, 1); assert.equal(land.stacked, true);
  const portrait = L.layoutCompare({ mode: "side-by-side", image: { width: 272, height: 336 }, captions: CAPTIONS, box: phone.box, phone: true });
  assert.equal(portrait.columns, 2);
  const stops = L.layoutCompare({ mode: "stop-grid", image: { width: 272, height: 336 }, captions: CAPTIONS, box: phone.box, phone: true });
  assert.equal(stops.columns, 3);
  assert.ok(stops.panes.every((p) => p.w >= L.MIN_PANE));
  const desktop = L.stageBox(1280, 800);
  const d = L.layoutCompare({ mode: "stop-grid", image: { width: 272, height: 336 }, captions: CAPTIONS, box: desktop.box, phone: false });
  assert.equal(d.columns, 3); assert.equal(d.rows, 3);
  assert.ok(d.height <= desktop.box.height + 0.5, "the desktop 3×3 fits the stage without scrolling");
  const loupe = L.layoutCompare({ mode: "loupe", image: { width: 240, height: 200 }, captions: [], box: phone.box, phone: true });
  assert.ok(loupe.loupePane >= 150 || loupe.stacked);
});

test("captions wrap by measured width and break long words instead of clipping", () => {
  const lines = L.wrapText("All edits without Hair fibres", 90, 12);
  assert.ok(lines.length >= 2);
  for (const line of lines) assert.ok(L.estimateWidth(line, 12) <= 90);
  assert.equal(lines.join(" "), "All edits without Hair fibres");
  const long = L.wrapText("Supercalifragilisticexpialidocious", 60, 12);
  assert.ok(long.length > 1);
  assert.equal(long.join(""), "Supercalifragilisticexpialidocious");
  assert.deepEqual(L.wrapText("", 100, 12), [""]);
  assert.throws(() => L.wrapText("x", 4, 12), /too small/);
});

test("a custom browser measure is honoured, and a pointer maps back to the pane under it", () => {
  const wide = (text, font) => text.length * font;          // a very wide font
  const box = { width: 300, height: 500 };
  const layout = L.layoutCompare({ mode: "grid-2x2", image: { width: 100, height: 100 }, captions: CAPTIONS, box, phone: true, measure: wide });
  assert.deepEqual(L.layoutProblems(layout, box, wide), []);
  const hit = L.paneAt(layout, layout.panes[1].x + 3, layout.panes[1].y + 4);
  assert.equal(hit.pane.frame, 1); assert.equal(hit.x, 3); assert.equal(hit.y, 4);
  assert.equal(L.paneAt(layout, -5, -5), null);
  assert.throws(() => L.stageBox(200, 200), /Viewport/);
});

test("compare session: modes, split line, loupe and hold are display state with keyboard control", () => {
  const s = new CompareSession();
  assert.deepEqual(s.state, defaultCompareState());
  const seen = [];
  const off = s.subscribe((st) => seen.push(st.mode));
  s.setMode("split-vertical");
  assert.equal(s.key({ key: "ArrowRight" }).handled, true);
  assert.equal(s.state.position, 0.55);
  s.key({ key: "ArrowLeft", shiftKey: true });
  assert.equal(Math.round(s.state.position * 100), 54);
  assert.equal(s.key({ key: "Home" }).announce, "Showing only the edit");
  assert.equal(s.state.position, 0);
  s.key({ key: "End" }); assert.equal(s.state.position, 1);
  s.key({ key: "ArrowRight" }); assert.equal(s.state.position, 1, "clamped at the edge");
  assert.equal(s.key({ key: "ArrowRight", ctrlKey: true }).handled, false, "chords are left to the page");
  s.setMode("split-horizontal");
  assert.equal(s.key({ key: "ArrowLeft" }).handled, false, "left/right do nothing on a horizontal line");
  assert.equal(s.key({ key: "ArrowDown" }).handled, true);
  s.setMode("loupe");
  s.key({ key: "ArrowRight", shiftKey: true });
  assert.equal(Math.round(s.state.loupe.x * 100), 60);
  assert.match(s.key({ key: "+" }).announce, /4×/);
  for (let i = 0; i < 9; i++) s.key({ key: "+" });
  assert.equal(s.state.loupe.zoom, LOUPE_ZOOMS.at(-1));
  s.setMode("hold");
  assert.equal(s.showing(), "after");
  s.key({ key: " " }); assert.equal(s.showing(), "before");
  assert.match(s.describe(), /original/);
  s.key({ key: "Escape" }); assert.equal(s.showing(), "after");
  s.hold(true); s.setMode("difference");
  assert.equal(s.state.held, false, "changing mode never leaves the original stuck on screen");
  assert.equal(s.cycle(1), "hold", "cycle wraps from the last mode to the first");
  assert.equal(s.cycle(-1), "difference");
  off();
  const before = seen.length; s.setMode("grid-2x2");
  assert.equal(seen.length, before, "unsubscribed listeners are not called");
});

test("flicker respects reduced motion: it never autoplays and Space switches frames", () => {
  const moving = new CompareSession();
  moving.setMode("flicker");
  assert.equal(moving.state.playing, true);
  assert.equal(moving.key({ key: "p" }).announce, "Flicker paused");
  assert.equal(moving.showing(5000), "after");
  const still = new CompareSession({}, true);
  still.setMode("flicker");
  assert.equal(still.state.playing, false);
  assert.equal(still.showing(5000), "after");
  still.key({ key: " " });
  assert.equal(still.showing(5000), "before");
  assert.equal(still.togglePlay(), false);
  assert.equal(still.state.playing, false);
  assert.match(still.describe(), /paused/);
});

test("compare state is validated", () => {
  assert.throws(() => normaliseCompareState({ mode: "nope" }), /Unknown/);
  assert.throws(() => normaliseCompareState({ loupe: { x: 0.5, y: 0.5, zoom: 5 } }), /zoom/);
  assert.throws(() => normaliseCompareState({ differenceGain: 0 }), /gain/);
  assert.throws(() => normaliseCompareState({ manual: "both" }), /Manual/);
  assert.equal(normaliseCompareState({ position: 7 }).position, 1);
  assert.equal(normaliseCompareState({ flickerMs: 10 }).flickerMs, C.MIN_FLICKER_MS);
  for (const mode of C.COMPARE_MODES) {
    const s = new CompareSession({ mode });
    assert.ok(s.describe().length > 20, mode);
  }
});
