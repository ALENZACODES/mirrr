// Free-library plan §6 P0 step 6: the network and privacy boundary.
// 1. Dynamic: with fetch, XMLHttpRequest, WebSocket, EventSource and sendBeacon replaced by
//    recorders, a full local edit (decode, GPU pipeline on both backends, editor session,
//    Save System, batch, export, album) makes zero network calls.
// 2. Static: the local modules (image, engines, filters, save, state, studio chrome) can never
//    reach src/api.ts through their imports, and only api.ts and the pinned model loader call
//    the network at all. Photos reach a server only through api.ts, from screens the user
//    opens and taps (the YouCam adapter path and the older server screens listed below).
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { fakeGL } from "./helpers/fake-gl.mjs";
import { jpeg } from "./helpers/images.mjs";

const SRC = fileURLToPath(new URL("../src/", import.meta.url));

function recordNetwork() {
  const calls = [];
  const saved = {};
  const names = ["fetch", "XMLHttpRequest", "WebSocket", "EventSource"];
  for (const n of names) saved[n] = globalThis[n];
  globalThis.fetch = (...a) => { calls.push(["fetch", String(a[0])]); return Promise.reject(new Error("network blocked in test")); };
  globalThis.XMLHttpRequest = class { open(m, u) { calls.push(["xhr", u]); } send() { calls.push(["xhr-send"]); } setRequestHeader() {} };
  globalThis.WebSocket = class { constructor(u) { calls.push(["ws", u]); } send() { calls.push(["ws-send"]); } close() {} };
  globalThis.EventSource = class { constructor(u) { calls.push(["sse", u]); } close() {} };
  const nav = globalThis.navigator;
  const beacon = nav?.sendBeacon;
  if (nav) { try { Object.defineProperty(nav, "sendBeacon", { configurable: true, value: (u) => { calls.push(["beacon", u]); return true; } }); } catch { /* read-only */ } }
  return { calls, restore() {
    for (const n of names) { if (saved[n] === undefined) delete globalThis[n]; else globalThis[n] = saved[n]; }
    if (nav) { try { Object.defineProperty(nav, "sendBeacon", { configurable: true, value: beacon }); } catch { /* ignore */ } }
  } };
}

test("a full local edit, save and export makes no network call", async () => {
  const net = recordNetwork();
  try {
    const D = await import("../dist/js/image/decode.js");
    const O = await import("../dist/js/engines/gpu/shaders/ops.js");
    const P = await import("../dist/js/engines/gpu/pipeline.js");
    const { EditorSession } = await import("../dist/js/state/editor.js");
    const L = await import("../dist/js/save/looks.js");
    const B = await import("../dist/js/save/batch.js");
    const X = await import("../dist/js/save/export.js");
    const { MemoryLookStorage } = await import("../dist/js/save/storage.js");

    const decoded = await D.decodePhoto(jpeg(32, 24, { orientation: 6 }), async (_b, h) =>
      ({ width: h.width, height: h.height, data: new Uint8ClampedArray(h.width * h.height * 4).fill(180) }));
    const image = O.fromBytes(decoded.width, decoded.height, decoded.data);
    const steps = [{ op: "exposure", params: { stops: 0.3 } }, { op: "saturation", params: { amount: 0.2 }, mask: new Float32Array(32 * 24).fill(0.5) }];
    for (const backend of [new P.CpuBackend(), new P.WebGL2Backend(fakeGL(), "rgba16f")]) {
      const pipe = new P.Pipeline(backend);
      const session = new EditorSession(async (photo, recipe, { signal, revision }) => pipe.render(photo, recipe, { signal, revision: revision.id }), { display() {} });
      session.setPhoto(image, "synthetic");
      assert.equal(await session.edit(steps), "shown");
      session.dispose(); pipe.dispose();
    }
    const lib = new L.LookLibrary(new MemoryLookStorage());
    const look = await lib.saveLook("Local only", [{ tool: "tan", strength: 30, settings: {}, provider: "local" }]);
    const engine = { tan: (p) => ({ ...p, data: Uint8Array.from(p.data) }) };
    const px = { width: 4, height: 4, channels: 4, data: new Uint8Array(64).fill(90) };
    const run = new B.BatchRun(look, [{ name: "a", photo: px }, { name: "b", photo: px }], { engine, findFaces: () => [{ id: "f", box: [0, 0, 1, 1] }] });
    await run.run();
    const encoder = { async encode() { return jpeg(4, 4, { orientation: 1, comment: true }); } };
    const files = await Promise.all(run.finished().map((item, i) => X.exportPhoto(item.after, encoder, { lookName: look.name, index: i + 1, simulationLabel: true, isSimulation: true })));
    X.album(files);
  } finally {
    net.restore();
  }
  assert.deepEqual(net.calls, [], "no fetch, XHR, WebSocket, EventSource or beacon");
});

// --- static import graph ----------------------------------------------------------------------

function tsFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...tsFiles(p));
    else if (p.endsWith(".ts")) out.push(p);
  }
  return out;
}
const files = tsFiles(SRC);
const code = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));
function imports(file) {
  const out = [];
  for (const m of code.get(file).matchAll(/(?:import|export)\s[^"';]*?from\s*["'](\.[^"']+)["']|import\(\s*["'](\.[^"']+)["']\s*\)/g)) {
    const spec = m[1] ?? m[2];
    const target = resolve(dirname(file), spec.replace(/\.js$/, ".ts"));
    if (code.has(target)) out.push(target);
  }
  return out;
}
const rel = (f) => relative(SRC, f).split("\\").join("/");
function reaches(start, goal) {
  const seen = new Set([start]), stack = [start], parent = new Map();
  while (stack.length) {
    const f = stack.pop();
    if (f === goal) { const path = [f]; let p = f; while (parent.has(p)) { p = parent.get(p); path.unshift(p); } return path.map(rel); }
    for (const n of imports(f)) if (!seen.has(n)) { seen.add(n); parent.set(n, f); stack.push(n); }
  }
  return null;
}
const API = join(SRC, "api.ts");

test("local modules can never reach the API client through their imports", () => {
  const local = files.filter((f) => /^(image|engines|filters|save|state)\//.test(rel(f))
    || ["layout/editor-chrome.ts", "layout/my-looks.ts", "layout/still-you.ts", "screens/paywall.ts", "screens/export.ts"].includes(rel(f)));
  assert.ok(local.length > 40, `checked ${local.length} local modules`);
  const leaks = local.map((f) => reaches(f, API)).filter(Boolean);
  assert.deepEqual(leaks, [], "an import path from a local module to api.ts");
});

test("only api.ts and the pinned model loader touch the network", () => {
  const callers = files.filter((f) => /\bfetch\s*\(|new XMLHttpRequest|new WebSocket|new EventSource|sendBeacon\s*\(/.test(code.get(f).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "")))
    .map(rel).sort();
  assert.deepEqual(callers, ["api.ts"], "network calls outside the API client");
  // The model loader takes `fetch` as an injected default, for pinned and hash-checked public
  // model files only; it never sends photos.
  assert.match(code.get(join(SRC, "vision/model-registry.ts")), /fetcher: FetchLike = fetch/);
});

test("the files that import the API client are a known, reviewed list", () => {
  const direct = files.filter((f) => imports(f).includes(API)).map(rel).sort();
  // Each of these sends data only after the person picks a photo and taps an action:
  // the YouCam makeup/hair flow (consent-gated) and the older server screens. The Trust Centre
  // only sends delete requests for photo ids she already uploaded.
  // commerce/page.ts: reads API configuration to hide provider mode when unset.
  // It does not initiate requests; the typed provider capability is opt-in.
  // commerce/remote.ts: uploads only after controller verifies the user's
  // per-photo consent; all network calls route through api.ts and are removable.
  const reviewed = ["commerce/page.ts", "commerce/remote.ts", "ctx.ts", "layout/trust-view.ts", "main.ts", "screens/body.ts", "screens/bodyphoto.ts", "screens/hair.ts", "screens/photo.ts",
    "screens/previews.ts", "screens/proportions.ts", "screens/reel.ts", "screens/shade.ts", "screens/skin.ts",
    "screens/skin-match.ts", "screens/tryon.ts",
    "ui/styling-tasks.ts", "ui/widgets.ts"];
  const unexpected = direct.filter((f) => !reviewed.includes(f));
  assert.deepEqual(unexpected, [], "a new module imports api.ts; review its data flow and add it here");
});
