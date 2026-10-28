// Free-library plan §6 P0 step 4: GPU correctness against the CPU reference.
// Neutral identity, empty and full masks, no alpha halos, tiled == full frame, CPU vs the
// WebGL2 backend (driven through a recording fake GL that runs the reference per draw),
// cancellation and resource release. Synthetic pixels only. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as O from "../dist/js/engines/gpu/shaders/ops.js";
import * as P from "../dist/js/engines/gpu/pipeline.js";
import { probe, tolerance } from "../dist/js/engines/gpu/capabilities.js";
import { fakeGL } from "./helpers/fake-gl.mjs";

function photo(width = 23, height = 17, alphaEdge = false) {
  const bytes = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    bytes[i] = (x * 11 + y * 3) % 256; bytes[i + 1] = (x * 5 + y * 13 + 40) % 256; bytes[i + 2] = (200 - x * 7 + y) & 255;
    bytes[i + 3] = alphaEdge ? (x < width / 3 ? 0 : x < width / 2 ? 128 : 255) : 255;
  }
  return O.fromBytes(width, height, bytes);
}
const maxDiff = (a, b) => { let m = 0; for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i])); return m; };
const recipe = [
  { op: "exposure", params: { stops: 0.6 } },
  { op: "contrast", params: { amount: 0.25 } },
  { op: "saturation", params: { amount: -0.3 } },
  { op: "balance", params: { warmth: 0.4, tint: -0.2 } },
];

test("every shader op is original GLSL ES 3.00 with an exact CPU neutral", () => {
  for (const spec of Object.values(O.SHADERS)) {
    assert.match(spec.fragment, /^#version 300 es/);
    assert.match(spec.fragment, /precision highp float/);
    assert.ok(O.isNeutral(spec.id, spec.neutral), spec.id);
  }
  assert.match(O.VERTEX, /^#version 300 es/);
  const img = photo();
  for (const op of ["exposure", "contrast", "saturation", "balance"]) {
    const out = O.cpuOp(op, img, O.SHADERS[op].neutral);
    assert.ok(maxDiff(out.data, img.data) < 1e-6, `${op} neutral is the identity`);
  }
});

test("parameters are bounded and unknown settings are refused", () => {
  assert.throws(() => O.checkParams("exposure", { stops: 3 }), /-2 to 2/);
  assert.throws(() => O.checkParams("contrast", { amount: Number.NaN }), /number/);
  assert.throws(() => O.checkParams("balance", { warmth: 0, hue: 1 }), /unknown setting hue/);
  assert.throws(() => O.checkParams("nope", {}), /unknown GPU op/);
});

test("exposure works in linear light and is monotone; saturation -1 is grey", () => {
  const img = photo();
  const up = O.cpuOp("exposure", img, { stops: 1 }), down = O.cpuOp("exposure", img, { stops: -1 });
  for (let i = 0; i < img.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      assert.ok(up.data[i + c] >= img.data[i + c] - 1e-7);
      assert.ok(down.data[i + c] <= img.data[i + c] + 1e-7);
    }
  }
  // one stop doubles linear light for a mid value
  const mid = O.toSrgb(0.2);
  const one = O.cpuOp("exposure", { width: 1, height: 1, data: Float32Array.of(mid, mid, mid, 1) }, { stops: 1 });
  assert.ok(Math.abs(O.toLinear(one.data[0]) - 0.4) < 1e-5);
  const grey = O.cpuOp("saturation", img, { amount: -1 });
  for (let i = 0; i < grey.data.length; i += 4) {
    assert.ok(Math.abs(grey.data[i] - grey.data[i + 1]) < 1e-6 && Math.abs(grey.data[i + 1] - grey.data[i + 2]) < 1e-6);
  }
});

test("a neutral recipe returns the photo unchanged with no GPU work", () => {
  const pipe = new P.Pipeline(new P.CpuBackend());
  const img = photo();
  const neutral = [{ op: "exposure", params: { stops: 0 } }, { op: "contrast", params: { amount: 0.5 }, opacity: 0 },
    { op: "saturation", params: { amount: 0.5 }, mask: new Float32Array(img.width * img.height) }];
  const res = pipe.render(img, neutral);
  assert.equal(res.passes, 0);
  assert.equal(res.skipped, 3);
  assert.deepEqual(res.image.data, img.data);
  assert.notEqual(res.image.data, img.data, "a copy, never the caller's array");
  assert.equal(pipe.backend.pool.counts().live, 0, "nothing allocated for a no-op");
});

test("empty and full masks: empty leaves the photo, full equals the unmasked op", () => {
  const pipe = new P.Pipeline(new P.CpuBackend());
  const img = photo();
  const n = img.width * img.height;
  const full = pipe.render(img, [{ op: "contrast", params: { amount: 0.5 }, mask: new Float32Array(n).fill(1) }]);
  const plain = pipe.render(img, [{ op: "contrast", params: { amount: 0.5 } }]);
  assert.ok(maxDiff(full.image.data, plain.image.data) < 1e-6);
  const half = new Float32Array(n);
  for (let i = 0; i < n; i++) half[i] = i % img.width < img.width / 2 ? 1 : 0;
  const part = pipe.render(img, [{ op: "contrast", params: { amount: 0.5 }, mask: half }]);
  for (let i = 0; i < n; i++) {
    const src = half[i] ? plain.image.data : img.data;
    for (let c = 0; c < 4; c++) assert.ok(Math.abs(part.image.data[i * 4 + c] - src[i * 4 + c]) < 1e-6);
  }
});

test("premultiplied ops add no halo: transparent pixels stay zero, alpha never changes", () => {
  const img = photo(24, 9, true);
  const pipe = new P.Pipeline(new P.CpuBackend());
  const out = pipe.render(img, recipe).image;
  for (let i = 0; i < img.data.length; i += 4) {
    assert.equal(out.data[i + 3], img.data[i + 3], "alpha unchanged");
    if (img.data[i + 3] === 0) assert.deepEqual([...out.data.subarray(i, i + 4)], [0, 0, 0, 0]);
    // colour never exceeds alpha (would show as a bright fringe after compositing)
    for (let c = 0; c < 3; c++) assert.ok(out.data[i + c] <= out.data[i + 3] + 1e-7);
  }
  // un-premultiplied colour at half alpha equals the opaque result for the same straight colour
  const bytes = O.toBytes(out);
  const opaque = O.toBytes(pipe.render(photo(24, 9, false), recipe).image);
  for (let y = 0; y < 9; y++) for (let x = 8; x < 12; x++) {
    const i = (y * 24 + x) * 4;
    for (let c = 0; c < 3; c++) assert.ok(Math.abs(bytes[i + c] - opaque[i + c]) <= 1, "no dark edge at partial alpha");
  }
});

test("tiled rendering equals the full frame, masks included", () => {
  const img = photo(53, 41);
  const mask = new Float32Array(53 * 41).map((_, i) => ((i * 7) % 11) / 10);
  const steps = [...recipe, { op: "saturation", params: { amount: 0.8 }, mask, opacity: 0.7 }];
  const pipe = new P.Pipeline(new P.CpuBackend());
  const full = pipe.render(img, steps).image;
  const tiled = pipe.renderTiled(img, steps, 16).image;
  assert.ok(maxDiff(full.data, tiled.data) < 1e-7);
  assert.throws(() => pipe.renderTiled(img, steps, 8), /at least 16/);
});

for (const float of [true, false]) {
  test(`WebGL2 backend agrees with the CPU reference (${float ? "rgba16f" : "rgba8"} targets)`, () => {
    const gl = fakeGL({ float });
    const caps = probe(gl, { width: 40, height: 30 });
    assert.equal(caps.path, "gpu");
    const img = photo(40, 30, true);
    const mask = new Float32Array(40 * 30).map((_, i) => (i % 40) / 39);
    const steps = [...recipe, { op: "contrast", params: { amount: -0.4 }, mask }];
    const gpu = new P.Pipeline(new P.WebGL2Backend(gl, caps.targetFormat));
    const cpu = new P.Pipeline(new P.CpuBackend());
    const a = gpu.render(img, steps), b = cpu.render(img, steps);
    assert.equal(a.backend, "webgl2");
    assert.equal(a.passes, b.passes);
    assert.deepEqual(gl.state.draws, ["exposure", "contrast", "saturation", "balance", "contrast", "composite"]);
    const diff = maxDiff(a.image.data, b.image.data);
    assert.ok(diff <= tolerance(caps, a.passes), `max diff ${diff}`);
    // the same programs are reused on the next render: no recompiles
    const compiles = gl.state.compiles;
    gpu.render(img, steps);
    assert.equal(gl.state.compiles, compiles);
  });
}

test("cancellation stops before the next pass and leaks nothing", () => {
  const gl = fakeGL();
  const backend = new P.WebGL2Backend(gl, "rgba16f");
  const pipe = new P.Pipeline(backend);
  const img = photo();
  const done = new AbortController(); done.abort();
  assert.throws(() => pipe.render(img, recipe, { signal: done.signal }), (e) => e instanceof P.RenderAborted && e.name === "AbortError");
  const live = backend.pool.counts().live;
  // abort mid-render: the signal flips after the first draw
  const mid = new AbortController();
  const realDraw = gl.drawArrays;
  gl.drawArrays = (...args) => { realDraw(...args); mid.abort(); };
  assert.throws(() => pipe.render(img, recipe, { signal: mid.signal }), P.RenderAborted);
  gl.drawArrays = realDraw;
  const counts = backend.pool.counts();
  assert.equal(counts.byKind.texture, 3, "only the three reusable targets stay; the upload was released");
  assert.ok(counts.live >= live);
});

test("100 edits keep a flat resource count, and dispose releases everything", () => {
  const gl = fakeGL();
  const backend = new P.WebGL2Backend(gl, "rgba16f");
  const pipe = new P.Pipeline(backend);
  const img = photo(16, 16);
  const mask = new Float32Array(256).fill(0.5);
  pipe.render(img, recipe);
  pipe.render(img, [{ op: "saturation", params: { amount: 0.1 }, mask }]); // compiles the composite program once
  const baseline = backend.pool.counts().live;
  for (let i = 0; i < 100; i++) {
    pipe.render(img, [{ op: "exposure", params: { stops: (i % 20) / 10 - 1 } }, { op: "saturation", params: { amount: 0.2 }, mask }]);
  }
  const after = backend.pool.counts();
  assert.equal(after.live, baseline, "no growth over 100 edits");
  assert.ok(after.created > 100, "uploads and masks were made and released");
  pipe.dispose();
  backend.pool.dispose();
  assert.equal(backend.pool.counts().live, 0);
  assert.equal(gl.state.created.texture, gl.state.deleted.texture, "every GL texture deleted");
  assert.equal(gl.state.created.framebuffer, gl.state.deleted.framebuffer);
  assert.equal(gl.state.created.program, gl.state.deleted.program);
  assert.throws(() => pipe.render(img, recipe), /disposed/);
});

test("a size change releases the old reusable targets", () => {
  const backend = new P.CpuBackend();
  const pipe = new P.Pipeline(backend);
  pipe.render(photo(20, 20), recipe);
  pipe.render(photo(30, 10), recipe);
  assert.equal(backend.pool.counts().live, 3);
});

test("a lost context stops GPU work with a plain error instead of drawing garbage", () => {
  const gl = fakeGL();
  const pipe = new P.Pipeline(new P.WebGL2Backend(gl, "rgba8"));
  gl.state.lost = true;
  assert.throws(() => pipe.render(photo(), recipe), /context was lost/);
});

test("steps are validated at the boundary", () => {
  const pipe = new P.Pipeline(new P.CpuBackend());
  const img = photo();
  assert.throws(() => pipe.render(img, [{ op: "composite", params: {} }]), /unknown colour op/);
  assert.throws(() => pipe.render(img, [{ op: "exposure", params: { stops: 0.1 }, mask: new Float32Array(3) }]), /mask must match/);
  assert.throws(() => pipe.render(img, [{ op: "exposure", params: { stops: 0.1 }, opacity: 2 }]), /opacity/);
  assert.throws(() => pipe.render({ width: 2, height: 2, data: new Float32Array(3) }, []), /premultiplied RGBA/);
  const bad = new Float32Array(img.width * img.height); bad[0] = 2;
  assert.throws(() => pipe.render(img, [{ op: "exposure", params: { stops: 0.1 }, mask: bad }]), /0 to 1/);
});

test("byte conversion round-trips straight RGBA through premultiplied floats", () => {
  const bytes = Uint8ClampedArray.from([10, 200, 30, 255, 100, 50, 25, 128, 9, 9, 9, 0]);
  const back = O.toBytes(O.fromBytes(3, 1, bytes));
  assert.deepEqual([...back.subarray(0, 8)], [...bytes.subarray(0, 8)]);
  assert.deepEqual([...back.subarray(8)], [0, 0, 0, 0]);
  assert.equal(P.toHalf(1 / 3).toFixed(4), "0.3333");
});
