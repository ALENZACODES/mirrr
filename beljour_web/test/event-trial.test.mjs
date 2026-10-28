// Event trial: one saved look on several photos of the day, each with its own face points, with
// an honest account of what ran where. Drawn faces only; nothing sent. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { symmetricFace } from "../dist/js/engines/local/face-synthetic.js";
import { facePhoto } from "../dist/js/engines/local/beard.js";
import { runEventTrial, EventTrialError, MAX_PHOTOS } from "../dist/js/save/event-trial.js";
import { reapply } from "../dist/js/save/reapply.js";
import { upgradeMyLook } from "../dist/js/save/validate.js";
import { eventTrialScreen } from "../dist/js/screens/event-trial.js";
import { Editor } from "../dist/js/ui/shell/controller.js";
import { ShellGpuRenderer } from "../dist/js/ui/shell/gpu-renderer.js";
import { EditorChrome } from "../dist/js/layout/editor-chrome.js";
import { defaultFilterParams } from "../dist/js/filters/runtime/layer.js";
import { installDOM, Element } from "./helpers/dom.mjs";

const drawn = (w, h, fw, fh, seed, withFace = true) => {
  const face = symmetricFace(w, h, fw, fh);
  return { id: `upload:event-${seed}`, kind: "uploaded", label: "Drawn", image: facePhoto(face, w, h, seed), disposable: true, ...(withFace ? { face } : {}) };
};
const myLook = {
  format: "beljour-my-look/1", id: "look-0a1b2c3d", name: "Wedding day", created: "2026-10-20T10:00:00.000Z",
  steps: [{ kind: "gender", strength: 40, params: { slider: -33 } }, { kind: "filters", strength: 40, params: defaultFilterParams("C40") },
    { kind: "portrait", strength: 30, params: { look: "PL08" } }],
};
const withMakeup = () => {
  const look = upgradeMyLook(myLook);
  look.versions[0].steps.push({ tool: "makeup", strength: 50, settings: { style: "soft" }, provider: "youcam" });
  return look;
};
const photos = () => [
  { id: "p1", label: "Photo 1", source: drawn(272, 336, 168, 218, 5) },
  { id: "p2", label: "Photo 2", source: drawn(300, 360, 180, 230, 9) },
  { id: "p3", label: "Photo 3", source: drawn(280, 340, 170, 220, 7, false) },
];

test("each photo gets the whole look on its own face points; one without points says what was left out", () => {
  const calls = [];
  const saved = globalThis.fetch;
  globalThis.fetch = (...a) => { calls.push(a); throw new Error("blocked"); };
  try {
    const ps = photos();
    const before = ps.map((p) => Uint8Array.from(p.source.image.data));
    const trial = runEventTrial(withMakeup(), ps);
    assert.deepEqual(trial.rows.map((r) => r.applied), [["gender", "filters", "portrait"], ["gender", "filters", "portrait"], ["filters"]]);
    assert.deepEqual(trial.rows.map((r) => r.face), ["this-photo", "this-photo", "none"]);
    assert.ok(trial.rows.every((r) => r.skipped.some((s) => s.tool === "makeup" && /styling screen.*nothing is sent/.test(s.reason))));
    assert.ok(trial.rows[2].skipped.some((s) => s.tool === "portrait" && /face points/i.test(s.reason)));
    assert.deepEqual(trial.coverage.map((c) => [c.tool, c.ranOn, c.provider]), [["gender", 2, false], ["filters", 3, false], ["portrait", 2, false], ["makeup", 0, true]]);
    assert.equal(trial.even, false);
    assert.match(trial.summary, /uneven across these photos: Gender appearance ran on 2 of 3; Portrait look ran on 2 of 3/);
    for (const [i, r] of trial.rows.entries()) {
      assert.deepEqual(Array.from(r.after.data), Array.from(reapply(withMakeup(), ps[i].source).photo.data), "same bytes as a single re-apply");
      assert.deepEqual(Array.from(ps[i].source.image.data), Array.from(before[i]), "her photos are untouched");
    }
    assert.match(trial.label, /simulations.*Not a prediction/);
    const even = runEventTrial(withMakeup(), photos().slice(0, 2));
    assert.equal(even.even, true); assert.match(even.summary, /ran on all 2 photos/);
  } finally { globalThis.fetch = saved; }
  assert.deepEqual(calls, [], "nothing left the device");
});

test("refusals are coded", () => {
  const one = photos().slice(0, 1);
  assert.throws(() => runEventTrial(withMakeup(), one), (e) => e instanceof EventTrialError && e.code === "too_few_photos");
  const many = Array.from({ length: MAX_PHOTOS + 1 }, (_, i) => ({ id: `p${i}`, label: `P${i}`, source: drawn(64, 76, 40, 50, i, false) }));
  assert.throws(() => runEventTrial(withMakeup(), many), (e) => e.code === "too_many_photos");
  const styling = upgradeMyLook(myLook);
  styling.versions[0].steps = [{ tool: "makeup", strength: 50, settings: {}, provider: "youcam" }];
  assert.throws(() => runEventTrial(styling, photos()), (e) => e.code === "nothing_local");
});

test("the panel tries a saved look on the chosen photos, and the studio opens it", async () => {
  const dom = installDOM();
  try {
    const ps = photos();
    const files = ps.map((_, i) => ({ type: "image/png", size: 10, index: i }));
    const screen = eventTrialScreen(() => [myLook], { consent: () => true, read: async (f) => ps[f.index].source.image,
      points: async (img) => ps.find((p) => p.source.image === img).source.face ?? null, paint: () => {} });
    const input = screen.querySelector("input");
    input.files = files;
    await input.dispatch("change");
    assert.equal(screen.querySelectorAll("li").filter((li) => li.getAttribute("data-id")).length, 3);
    assert.match(screen.textContent, /uneven/);
    assert.match(screen.textContent, /Gender appearance: 2 of 3 photos/);
    const empty = eventTrialScreen(() => [], {});
    assert.match(empty.textContent, /Save a look first/);
    for (const id of ["lg-deliverable", "lg-close-deliverable", "lg-chrome-status"]) {
      const node = new Element(id === "lg-deliverable" ? "section" : "div"); node.setAttribute("id", id); dom.root.append(node);
    }
    const chrome = new EditorChrome({ editor: new Editor("portrait", new ShellGpuRenderer(null)), draw() {}, afterSource() {} }, document);
    chrome.openDeliverable("event");
    assert.match(document.getElementById("lg-deliverable").textContent, /Event trial/);
  } finally { dom.restore(); }
});
