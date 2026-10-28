// Capability checks (plan §4D, Animal Sniffer role) and device context loss. No real GPU.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { probe, tolerance, MIN_TEXTURE_SIZE } from "../dist/js/engines/gpu/capabilities.js";
import { Device, CONTEXT_ATTRIBUTES } from "../dist/js/engines/gpu/device.js";
import { chooseRenderer } from "../dist/js/engines/gpu/index.js";
import { fakeGL, fakeCanvas } from "./helpers/fake-gl.mjs";

test("no WebGL2 means the CPU path, with a plain reason", () => {
  const caps = probe(null);
  assert.equal(caps.path, "cpu");
  assert.equal(caps.webgl2, false);
  assert.match(caps.reasons[0], /WebGL2 is not available/);
});

test("a healthy GPU with half floats takes the GPU path", () => {
  const caps = probe(fakeGL({ maxTextureSize: 8192 }), { width: 4000, height: 3000 });
  assert.equal(caps.path, "gpu");
  assert.equal(caps.targetFormat, "rgba16f");
  assert.equal(caps.reasons.length, 0);
});

test("a photo larger than one texture renders in tiles", () => {
  const caps = probe(fakeGL({ maxTextureSize: 4096 }), { width: 6000, height: 4000 });
  assert.equal(caps.path, "gpu-tiled");
  assert.equal(caps.tile, 2048);
  assert.match(caps.reasons.join(" "), /tiles/);
});

test("tiny texture limits or missing floats are reported honestly", () => {
  const small = probe(fakeGL({ maxTextureSize: MIN_TEXTURE_SIZE - 1 }));
  assert.equal(small.path, "cpu");
  const bytes = probe(fakeGL({ float: false }));
  assert.equal(bytes.path, "gpu");
  assert.equal(bytes.targetFormat, "rgba8");
  assert.match(bytes.reasons[0], /8 bits/);
  assert.ok(tolerance(bytes, 4) > tolerance(probe(fakeGL()), 4));
  assert.equal(probe(fakeGL({ lost: true })).path, "cpu");
  assert.throws(() => probe(fakeGL(), { width: 0, height: 10 }), /positive/);
});

test("device: context loss is handled, restored and disposed cleanly", () => {
  const gl = fakeGL();
  const canvas = fakeCanvas(gl);
  const device = new Device(canvas);
  assert.equal(device.state, "ready");
  assert.equal(canvas.attrs, CONTEXT_ATTRIBUTES);
  assert.equal(canvas.attrs.premultipliedAlpha, true);
  assert.equal(canvas.attrs.preserveDrawingBuffer, false);
  const seen = [];
  device.subscribe((s) => seen.push(s));
  const { pipeline } = chooseRenderer(device, { width: 10, height: 10 });
  assert.equal(pipeline.backend.kind, "webgl2");
  device.pool.own("texture", {}, () => { throw new Error("must not call into a lost context"); });
  gl.state.lost = true;
  assert.equal(canvas.fire("webglcontextlost"), true, "default prevented so the browser can restore");
  assert.equal(device.state, "lost");
  assert.equal(device.gl, null);
  assert.equal(device.pool.counts().live, 0, "dead handles forgotten without touching the context");
  assert.equal(chooseRenderer(device).pipeline.backend.kind, "cpu", "CPU fallback while lost");
  gl.state.lost = false;
  canvas.fire("webglcontextrestored");
  assert.equal(device.state, "ready");
  assert.equal(device.generation, 1);
  device.dispose();
  assert.deepEqual(seen, ["lost", "ready", "disposed"]);
  assert.equal((canvas.listeners.get("webglcontextlost") ?? []).length, 0, "listeners removed");
  assert.equal(device.gl, null);
});

test("a canvas without WebGL2 gives an unavailable device and the CPU path", () => {
  const canvas = fakeCanvas(null);
  canvas.getContext = () => null;
  const device = new Device(canvas);
  assert.equal(device.state, "unavailable");
  assert.equal(chooseRenderer(device).capabilities.path, "cpu");
});
