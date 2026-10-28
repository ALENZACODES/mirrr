// The combined system on drawn faces, end to end, in the order she uses it:
// open a photo -> appearance edit -> filter look + portrait look -> skin tool -> save the face and
// the recipe -> re-apply to a second photo -> HD export with the face lock -> Decision Layer spec
// sheet -> nothing left the device. Each hand-off asserts what the next piece relies on.
// Drawn faces only; no photograph of a person, no network. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import { symmetricFace } from "../dist/js/engines/local/face-synthetic.js";
import { facePhoto } from "../dist/js/engines/local/beard.js";
import { precheck } from "../dist/js/ui/shell/precheck.js";
import { readiness } from "../dist/js/ui/shell/catalogue.js";
import { applyLocalLayer, renderLayers } from "../dist/js/ui/shell/pipeline.js";
import { SKIN_DEFAULTS } from "../dist/js/ui/shell/skin-layer.js";
import { defaultFilterParams } from "../dist/js/filters/runtime/layer.js";
import { LABEL as PORTRAIT_LABEL } from "../dist/js/filters/portrait/compose.js";
import { regionMask } from "../dist/js/data/regions/index.js";
import { stillYou } from "../dist/js/layout/still-you.js";
import { stepsFromLayers } from "../dist/js/layout/my-looks.js";
import { recipeSteps } from "../dist/js/layout/editor-chrome.js";
import { LookLibrary } from "../dist/js/save/looks.js";
import { MemoryLookStorage } from "../dist/js/save/storage.js";
import { SavedFaceSessions } from "../dist/js/save/saved-face.js";
import { reapply } from "../dist/js/save/reapply.js";
import { hashModel } from "../dist/js/vision/model-registry.js";
import { QualitySession } from "../dist/js/pro/quality-session.js";
import { cpuResize, cpuResizer, QUALITY_LABEL } from "../dist/js/engines/upscale/quality-generator.js";
import { planFixedTier } from "../dist/js/engines/upscale/quality-tier.js";
import { hasMetadata } from "../dist/js/save/export.js";
import { findReliableShade } from "../dist/js/engines/shade/finder.js";
import { SHADE_DATA } from "../dist/js/engines/shade/generated/data.js";
import { foundationDecision, sheetText, SHEET_LABEL } from "../dist/js/salon/spec.js";
import { FOUNDATION_NOTE } from "../dist/js/engines/workflow_w/decision.js";

/* ---------- no network: every way out of the process is trapped and counted ---------- */
const attempts = [];
const trap = (name) => function trapped(...args) { attempts.push([name, String(args[0] ?? "")]); throw new Error(`network blocked: ${name}`); };
const saved = { fetch: globalThis.fetch, XMLHttpRequest: globalThis.XMLHttpRequest, WebSocket: globalThis.WebSocket,
  EventSource: globalThis.EventSource, navigator: globalThis.navigator, connect: net.Socket.prototype.connect };
globalThis.fetch = trap("fetch");
globalThis.XMLHttpRequest = trap("XMLHttpRequest");
globalThis.WebSocket = trap("WebSocket");
globalThis.EventSource = trap("EventSource");
Object.defineProperty(globalThis, "navigator", { configurable: true, value: { sendBeacon: trap("sendBeacon"), onLine: true } });
net.Socket.prototype.connect = trap("socket");

/* ---------- drawn photos ---------- */
const layer = (kind, strength, parameters) => ({ id: `j-${kind}`, kind, name: kind, enabled: true, opacity: 1, strength,
  parameters, provenance: "local", simulation: kind !== "filters", origin: "photo" });
async function openDrawn(width, height, faceW, faceH, seed, rgba) {
  const face = symmetricFace(width, height, faceW, faceH);
  const rgb = facePhoto(face, width, height, seed);
  let image = rgb;
  if (rgba) {
    const data = new Uint8Array(width * height * 4);
    for (let p = 0; p < width * height; p++) {
      for (let c = 0; c < 3; c++) data[p * 4 + c] = rgb.data[p * 3 + c];
      data[p * 4 + 3] = 255 - ((p * 13) % 97);          // a varied alpha, so any change shows
    }
    image = { width, height, channels: 4, data };
  }
  const digest = await hashModel(image.data.buffer.slice(0));
  return { id: `upload:${digest.slice(0, 12)}`, kind: "uploaded", label: "Drawn photo", image, face, disposable: false,
    fileSha256: digest, fileDimensions: [width, height] };
}
const lab = (img, mask) => {
  let s = 0, n = 0;
  for (let q = 0; q < mask.length; q++) {
    if (mask[q] < 0.5) continue;
    const c = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const [r, g, b] = [0, 1, 2].map((k) => c(img.data[q * img.channels + k]));
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    s += y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (24389 / 27) * y; n++;
  }
  return s / n;
};

test("one journey through the combined system, on drawn faces, entirely on this device", async (t) => {
  const state = {};
  try {
    await t.test("open: the photo is read on device, checked, and its own face points are ready", async () => {
      state.a = await openDrawn(272, 336, 168, 218, 5, false);
      const report = precheck(state.a.image, { purpose: "local", face: state.a.face });
      assert.ok(report && typeof report === "object");
      assert.match(state.a.fileSha256, /^[0-9a-f]{64}$/);
      for (const kind of ["gender", "filters", "portrait", "skin"]) assert.equal(readiness(kind, state.a).ready, true, kind);
      state.originalA = Uint8Array.from(state.a.image.data);
    });

    await t.test("appearance edit: guarded, labelled, and it says where the face now is", () => {
      const out = applyLocalLayer(state.a.image, state.a, layer("gender", 60, { slider: -33 }));
      assert.match(out.label, /simulation, not a measure of identity or sex/);
      assert.equal(out.metrics.refused, false);
      assert.ok(out.metrics.min_jacobian > 0, "no fold");
      assert.equal(out.metrics.validated_on_released_photos, false);
      assert.equal(out.face.length, 478);
      const moved = Math.max(...out.face.map((p, i) => Math.hypot(p[0] - state.a.face[i][0], p[1] - state.a.face[i][1])));
      assert.ok(moved > 0.5 && moved < 0.12 * 70, `moved ${moved.toFixed(2)} px, inside the shape cap`);
      state.gender = out;
    });

    await t.test("filter look and portrait look on top: skin guard on, identity guard passed, labelled", () => {
      state.layers = [layer("gender", 60, { slider: -33 }), layer("filters", 40, defaultFilterParams("C02")),
        layer("portrait", 30, { look: "PL13" })];
      const stack = renderLayers(state.a, state.layers);
      const [, filter, portrait] = stack.metrics;
      assert.deepEqual(stack.face, state.gender.face, "the portrait look got the moved face, not the original");
      assert.equal(filter.guard, true); assert.equal(filter.recipe, "C02");
      assert.equal(portrait.status, "applied");
      assert.equal(portrait.marks_kept, portrait.marks_found, "every freckle and mole it found is kept");
      assert.ok(portrait.skin_lift <= 1, "skin not lightened");
      assert.equal(portrait.label, PORTRAIT_LABEL);
      assert.match(stack.labels[2], /Local simulation · Vence/);
      // The portrait look puts the irises back from its own input (the graded photo), so it never
      // changes eye colour; the colour grade before it is a whole-photo grade and may.
      const input = renderLayers(state.a, state.layers.slice(0, 2)).image;
      const irises = regionMask("irises", stack.face, 272, 336, { normalized: false, supersample: 2 }).data;
      let irisPixels = 0;
      for (let q = 0; q < irises.length; q++) {
        if (irises[q] < 1) continue;
        irisPixels++;
        for (let c = 0; c < 3; c++) assert.equal(stack.image.data[q * 3 + c], input.data[q * 3 + c], "eye colour never changes");
      }
      assert.ok(irisPixels > 50);
      state.graded = stack;
    });

    await t.test("skin tool last: changes skin only where the skin now is, never lightens, marks kept", () => {
      state.layers.push(layer("skin", 40, { ...SKIN_DEFAULTS }));
      const stack = renderLayers(state.a, state.layers);
      const skin = regionMask("skin", stack.face, 272, 336, { normalized: false, supersample: 2 }).data;
      let outside = 0;
      for (let q = 0; q < skin.length; q++) {
        if (skin[q] > 0) continue;
        if ([0, 1, 2].some((c) => stack.image.data[q * 3 + c] !== state.graded.image.data[q * 3 + c])) outside++;
      }
      assert.equal(outside, 0, "the tone tool stays inside the face's current skin");
      assert.ok(lab(stack.image, skin) - lab(state.graded.image, skin) <= 0.5, "not lightened");
      assert.match(stack.labels[3], /never lightened, marks kept\. Simulation, not medical advice/);
      assert.ok(stack.metrics.every((m) => m.source === "local"), "every layer is local");
      const check = stillYou(state.a.image, stack.image, { skin: regionMask("skin", state.a.face, 272, 336, { normalized: false, supersample: 2 }), face: state.a.face, edited: true });
      assert.equal(check.lightened, false); assert.equal(check.marksKept, check.marksFound);
      state.final = stack;
      assert.deepEqual(Array.from(state.a.image.data), Array.from(state.originalA), "her original is untouched");
    });

    await t.test("save: the recipe holds settings only; her face points go to their own local record", async () => {
      const storage = new MemoryLookStorage();
      const library = new LookLibrary(storage, () => new Date("2026-10-28T10:00:00Z"));
      const sessions = new SavedFaceSessions(library, storage, () => new Date("2026-10-28T10:00:00Z"));
      const steps = [...recipeSteps(stepsFromLayers(state.layers)), { tool: "makeup", strength: 40, settings: { style: "soft" }, provider: "youcam" }];
      const session = await sessions.save("Evening journey", steps, { mesh: state.a.face.map(([x, y]) => [x, y]),
        identity: { reference: state.a.fileSha256, model: "local-mesh", dimensions: [272, 336] },
        strengths: { gender: 60, filters: 40, portrait: 30, skin: 40 }, settings: { look: "PL13" }, activeVersion: 1 });
      const record = JSON.stringify(await storage.get(session.look.id));
      assert.doesNotMatch(record, /mesh|"data"|base64|\d+\.\d{5,}/, "no pixels, points or measurements in the recipe");
      assert.deepEqual(JSON.parse(record).versions[0].steps.map((s) => s.tool), ["gender", "filters", "portrait", "skin", "makeup"]);
      const resumed = await sessions.resume(session.look.id);
      assert.deepEqual(resumed.face.mesh, state.a.face.map(([x, y]) => [x, y]), "points come back exactly");
      assert.equal(resumed.face.identity.reference, state.a.fileSha256);
      state.look = resumed.look; state.savedFace = resumed.face; state.sessions = sessions;
    });

    await t.test("re-apply to a second photo: its own points, same bytes as the editor, alpha kept, YouCam not called", async () => {
      state.b = await openDrawn(300, 360, 180, 230, 9, true);
      const borrowed = reapply(state.look, { ...state.b, face: undefined }, { savedFace: state.savedFace });
      assert.equal(borrowed.face, "none", "photo A's points are never used on photo B");
      assert.deepEqual(borrowed.applied, ["filters"], "only the step that needs no face runs");
      const out = reapply(state.look, state.b, { savedFace: state.savedFace });
      assert.equal(out.face, "this-photo");
      assert.deepEqual(out.applied, ["gender", "filters", "portrait", "skin"]);
      assert.deepEqual(out.skipped.map((s) => s.tool), ["makeup"]);
      assert.match(out.skipped[0].reason, /never calls/);
      const editor = renderLayers(state.b, state.layers);
      for (let p = 0; p < 300 * 360; p++) {
        for (let c = 0; c < 3; c++) assert.equal(out.photo.data[p * 4 + c], editor.image.data[p * 3 + c]);
        assert.equal(out.photo.data[p * 4 + 3], state.b.image.data[p * 4 + 3], "alpha untouched");
      }
      state.bFinal = out.photo; state.bFace = editor.face;
    });

    await t.test("HD export with the face lock: face pixels are the resized original, labelled, metadata scrubbed", async () => {
      const session = new QualitySession({ resizer: cpuResizer });
      const raster = { width: 300, height: 360, data: new Uint8ClampedArray(state.bFinal.data) };
      const plan = session.open(await hashModel(raster.data.buffer.slice(0)), raster);
      assert.deepEqual([plan.tier, plan.width, plan.height], ["hd1080", 1080, 1920]);
      assert.throws(() => planFixedTier(300, 360, "uhd4k"), /4K output is not available yet/);
      const oval = regionMask("face_oval", state.bFace, 300, 360, { normalized: false, supersample: 2 }).data;
      const mask = Uint8Array.from(oval, (v) => (v >= 1 ? 255 : 0));
      session.markFace(mask);
      session.setLevels(3, 5);
      const render = await session.release();
      const audit = render.audit;
      assert.equal(audit.label, QUALITY_LABEL); assert.equal(audit.generator, "classical-local"); assert.equal(audit.release, true);
      assert.ok(audit.protectedPixels > 0 && audit.fullyLockedPixels > 0);
      const reference = cpuResize(raster, plan.contentWidth, plan.contentHeight);
      const coverage = (x, y) => mask[Math.min(359, Math.floor((y + 0.5) * 360 / plan.contentHeight)) * 300 + Math.min(299, Math.floor((x + 0.5) * 300 / plan.contentWidth))];
      let locked = 0;
      for (let y = 0; y < plan.contentHeight; y++) for (let x = 0; x < plan.contentWidth; x++) {
        const out = ((y + plan.offsetY) * plan.width + x + plan.offsetX) * 4, ref = (y * plan.contentWidth + x) * 4;
        assert.equal(render.image.data[out + 3], reference[ref + 3], "alpha is the resized original's");
        if (coverage(x, y) !== 255) continue;
        locked++;
        for (let c = 0; c < 3; c++) assert.equal(render.image.data[out + c], reference[ref + c], "locked face pixel equals the reference");
      }
      assert.equal(locked, audit.fullyLockedPixels);
      const calls = [];
      const encoder = { encode: async (pixels, options) => { calls.push(options); return Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x04, 0x45, 0x78, 0xff, 0xda, 0x00, 0x02, 0xff, 0xd9]); } };
      const file = await session.export(render, "BELJOUR_HD1080", {}, encoder);
      assert.equal(calls[0].label, "Simulation", "the Simulation label is on by default");
      assert.equal(hasMetadata(new Uint8Array(await file.blob.arrayBuffer())), false, "metadata scrubbed");
      session.dispose();
    });

    await t.test("Decision Layer: a foundation spec from her unedited photo, never lighter, settings only", () => {
      const reading = findReliableShade(state.a.image, state.a.face.map(([x, y]) => [x, y, 0])).result;
      assert.equal(reading.refused, false);
      const sheet = foundationDecision(reading, { name: "Evening journey", date: "2026-10-28" });
      assert.equal(sheet.label, SHEET_LABEL); assert.equal(sheet.hosted, false);
      assert.equal(sheet.photosIncluded, false); assert.deepEqual(sheet.photos, []);
      assert.ok(sheet.spec.nearest.length > 0);
      for (const n of sheet.spec.nearest) {
        const row = SHADE_DATA.shades.find((s) => s.id === n.id);
        assert.ok(row.lab[0] - sheet.spec.measured_lab[0] <= SHADE_DATA.thresholds.never_lighter_allowance, `${n.id} is not lighter than her skin`);
      }
      const text = sheetText(sheet);
      assert.equal(sheet.spec.note, FOUNDATION_NOTE);
      assert.ok(text.includes(FOUNDATION_NOTE));
      assert.match(text, /Photos: none\. Settings only\./);
      assert.match(text, /estimate/i);
      const json = JSON.stringify(sheet);
      assert.ok(!json.includes(state.a.fileSha256), "no photo digest");
      assert.ok(!state.a.face.slice(0, 20).some(([x]) => json.includes(String(x))), "no face point");
    });

    await t.test("privacy: nothing left the device at any step", () => {
      assert.deepEqual(attempts, []);
    });
  } finally {
    Object.assign(globalThis, { fetch: saved.fetch, XMLHttpRequest: saved.XMLHttpRequest, WebSocket: saved.WebSocket, EventSource: saved.EventSource });
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: saved.navigator });
    net.Socket.prototype.connect = saved.connect;
  }
});

test("the traps are real: a blocked call is counted and refused", () => {
  const before = attempts.length;
  const blocked = trap("fetch");
  assert.throws(() => blocked("https://example.org"), /network blocked/);
  assert.equal(attempts.length, before + 1);
  attempts.length = before;
});
