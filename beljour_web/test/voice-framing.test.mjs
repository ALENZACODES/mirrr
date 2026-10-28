// Voice framing: one plain cue per frame from the face points, directions from her own point of
// view, a guide that speaks without nagging, and a panel that opens the framed photo with its
// own points. Drawn face points; the camera and speech are stand-ins. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { symmetricFace } from "../dist/js/engines/local/face-synthetic.js";
import * as V from "../dist/js/vision/framing-voice.js";
import { voiceFramingScreen } from "../dist/js/screens/voice-framing.js";
import { installDOM, buttonNamed } from "./helpers/dom.mjs";

const W = 640, H = 800;
const drawn = symmetricFace(W, H, 240, 320);
/** The drawn face moved up to the target height of a head-and-shoulders selfie. */
const base = drawn.map(([x, y]) => [x, y - 64]);
const moved = (dx, dy, s = 1) => base.map(([x, y]) => [320 + (x - 320) * s + dx, 336 + (y - 336) * s + dy]);
const turned = (deg) => { const t = deg * Math.PI / 180;
  return base.map(([x, y]) => { const d = x - 320, z = -Math.sqrt(Math.max(0, 140 * 140 - d * d)); return [320 + d * Math.cos(t) - z * Math.sin(t), y, d * Math.sin(t) + z * Math.cos(t)]; }); };
const rolled = (deg) => { const t = deg * Math.PI / 180;
  return base.map(([x, y]) => [320 + (x - 320) * Math.cos(t) - (y - 400) * Math.sin(t), 400 + (x - 320) * Math.sin(t) + (y - 400) * Math.cos(t)]); };

test("one cue at a time, in order: distance, side, height, level, facing, then hold", () => {
  assert.equal(V.framingCue(base, W, H).cue, "hold");
  assert.equal(V.framingCue(null, W, H).cue, "no_face");
  assert.equal(V.framingCue(moved(0, 0, 0.6), W, H).cue, "closer");
  assert.equal(V.framingCue(moved(0, 0, 1.7), W, H).cue, "further");
  assert.equal(V.framingCue(moved(0, 120), W, H).cue, "lower", "face low in the frame: lower the camera");
  assert.equal(V.framingCue(moved(0, -120), W, H).cue, "raise");
  assert.equal(V.framingCue(rolled(15), W, H).cue, "level");
  assert.equal(V.framingCue(turned(20), W, H).cue, "face_camera");
  assert.equal(V.framingCue(moved(140, 120, 0.6), W, H).cue, "closer", "distance comes first");
  assert.ok(Object.values(V.CUE_TEXT).every((t) => t.length < 70 && !/\bleft\b.*\bright\b/.test(t)), "short, one instruction each");
});

test("left and right are hers: the same picture gives the opposite cue only when the camera itself mirrors", () => {
  const towardImageRight = moved(130, 0);
  assert.equal(V.framingCue(towardImageRight, W, H).cue, "move_right", "unmirrored camera image: image right is her left, so she moves right");
  assert.equal(V.framingCue(towardImageRight, W, H, true).cue, "move_left");
  assert.equal(V.framingCue(moved(-130, 0), W, H).cue, "move_left");
  assert.match(V.CUE_TEXT.move_right, /your right/);
});

test("the guide speaks on change, never faster than the gap, repeats slowly and says ready once", () => {
  let t = 0;
  const spoken = [], shown = [];
  const g = new V.VoiceGuide((s) => spoken.push(s), (s) => shown.push(s), () => t);
  const f = (cue) => ({ cue, text: V.CUE_TEXT[cue] });
  g.update(f("closer"));
  t = 500; g.update(f("move_left"));
  t = 1600; g.update(f("move_left"));
  t = 2000; g.update(f("move_left"));
  t = 5700; g.update(f("move_left"));
  assert.deepEqual(spoken, [V.CUE_TEXT.closer, V.CUE_TEXT.move_left, V.CUE_TEXT.move_left]);
  t = 8000; g.update(f("hold")); t = 8500; g.update(f("hold")); assert.equal(g.ready, false);
  t = 9000; g.update(f("hold"));
  assert.equal(g.ready, true); assert.equal(spoken.at(-1), V.READY_TEXT);
  t = 12000; g.update(f("hold")); t = 20000; g.update(f("hold"));
  assert.equal(spoken.filter((s) => s === V.READY_TEXT).length, 1, "ready is said once");
  t = 21000; g.update(f("lower")); assert.equal(g.ready, false); assert.equal(spoken.at(-1), V.CUE_TEXT.lower);
  assert.deepEqual(shown, spoken, "every spoken cue is also on screen");
  const quiet = new V.VoiceGuide(null, (s) => shown.push(s), () => 99999);
  assert.equal(quiet.update(f("raise")), V.CUE_TEXT.raise, "no speech: the text line still updates");
});

test("the panel guides from the camera to ready, opens the framed photo with its points, and stops the camera", async () => {
  const dom = installDOM();
  try {
    const frames = [moved(0, 0, 0.6), moved(130, 0), base, base, base, base, base, base];
    let i = 0, clock = 0, stopped = 0;
    const spoken = [], opened = [];
    const image = { width: W, height: H, channels: 3, data: new Uint8Array(W * H * 3) };
    const screen = voiceFramingScreen((s) => opened.push(s), {
      consent: () => true, modelReady: () => true, speak: (s) => spoken.push(s), now: () => clock,
      getCamera: async () => ({ getTracks: () => [{ stop: () => stopped++ }] }),
      grab: () => image, points: async () => frames[Math.min(i++, frames.length - 1)],
      wait: () => new Promise((r) => { clock += 1600; setImmediate(r); }),
    });
    await buttonNamed(screen.element, "Start voice framing").click();
    for (let k = 0; k < 20 && !spoken.includes(V.READY_TEXT); k++) await new Promise((r) => setImmediate(r));
    assert.equal(spoken[0], V.CUE_TEXT.closer, "too far first");
    assert.ok(spoken.includes(V.CUE_TEXT.move_right) && spoken.includes(V.READY_TEXT));
    const use = buttonNamed(screen.element, "Use this photo");
    assert.equal(use.disabled, false);
    await use.click();
    assert.equal(opened.length, 1); assert.equal(opened[0].face.length, 478); assert.equal(opened[0].kind, "uploaded");
    assert.equal(stopped, 1, "camera released");
    screen.dispose();
  } finally { dom.restore(); }
});

test("without the face model the camera never starts; without speech the text line still guides", async () => {
  const dom = installDOM();
  try {
    let cameras = 0, halt = null;
    const off = voiceFramingScreen(() => {}, { consent: () => true, modelReady: () => false, getCamera: async () => { cameras++; return { getTracks: () => [] }; } });
    await buttonNamed(off.element, "Start voice framing").click();
    assert.match(off.element.textContent, /needs the on-device face model/);
    assert.equal(cameras, 0);
    const image = { width: W, height: H, channels: 3, data: new Uint8Array(W * H * 3) };
    const mute = voiceFramingScreen(() => {}, { consent: () => true, modelReady: () => true, speak: null, now: () => 1e6,
      getCamera: async () => ({ getTracks: () => [{ stop() {} }] }), grab: () => image, points: async () => moved(0, 0, 0.6),
      wait: () => new Promise((r) => { halt = r; }) });
    await buttonNamed(mute.element, "Start voice framing").click();
    await new Promise((r) => setImmediate(r));
    assert.match(mute.element.textContent, /Come a little closer/);
    mute.dispose(); halt?.();
    const refused = voiceFramingScreen(() => {}, { consent: () => false });
    await buttonNamed(refused.element, "Start voice framing").click();
    assert.match(refused.element.textContent, /Confirm adult photo consent/);
  } finally { dom.restore(); }
});
