import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultRecipe,
  GpuProSurface,
  makeCropGeometry,
  makeCurveLuts,
  packedCurveTable,
  ProGpuPass,
  ProGpuError,
  threePointCurve,
} from "../../../dist/js/pro/index.js";
import { PRO_FRAGMENT_SHADER, PRO_VERTEX_SHADER } from "../../../dist/js/pro/gpu-shaders.js";

class FakeGl {
  VERTEX_SHADER = 1;
  FRAGMENT_SHADER = 2;
  COMPILE_STATUS = 3;
  LINK_STATUS = 4;
  TEXTURE_2D = 5;
  TEXTURE_MIN_FILTER = 6;
  TEXTURE_MAG_FILTER = 7;
  TEXTURE_WRAP_S = 8;
  TEXTURE_WRAP_T = 9;
  NEAREST = 10;
  CLAMP_TO_EDGE = 11;
  ARRAY_BUFFER = 12;
  STATIC_DRAW = 13;
  FLOAT = 14;
  TEXTURE0 = 15;
  TEXTURE1 = 16;
  TEXTURE2 = 17;
  UNPACK_FLIP_Y_WEBGL = 18;
  UNPACK_PREMULTIPLY_ALPHA_WEBGL = 19;
  UNPACK_ALIGNMENT = 20;
  RGBA = 21;
  RGBA8 = 22;
  R8 = 23;
  RED = 24;
  UNSIGNED_BYTE = 25;
  TRIANGLE_STRIP = 26;
  BLEND = 27;
  COLOR_BUFFER_BIT = 28;
  NO_ERROR = 0;
  failCompile = false;
  failLink = false;
  failAllocation = "";
  lost = false;
  nextError = 0;
  commands = [];
  objects = { shaders: [], programs: [], textures: [], buffers: [], arrays: [] };
  removed = { shaders: [], programs: [], textures: [], buffers: [], arrays: [] };
  uploads = [];

  allocation(name) {
    if (this.failAllocation === name) return null;
    const object = { id: this.objects[name].length + 1, name };
    this.objects[name].push(object);
    return object;
  }
  createShader() { return this.allocation("shaders"); }
  createProgram() { return this.allocation("programs"); }
  createTexture() { return this.allocation("textures"); }
  createBuffer() { return this.allocation("buffers"); }
  createVertexArray() { return this.allocation("arrays"); }
  shaderSource(shader, text) {
    assert.ok(text.startsWith("#version 300 es"));
    assert.ok(shader);
  }
  compileShader() {}
  getShaderParameter() { return !this.failCompile; }
  attachShader() {}
  linkProgram() {}
  getProgramParameter() { return !this.failLink; }
  getUniformLocation(program, name) {
    assert.ok(program);
    return { name };
  }
  uniform1i(location, index) { this.commands.push(["uniform", location.name, index]); }
  uniform3fv() {}
  enableVertexAttribArray() {}
  vertexAttribPointer() {}
  bindVertexArray(target) { this.commands.push(["vao", target?.id ?? null]); }
  bindBuffer() {}
  bufferData() {}
  useProgram() {}
  bindTexture() {}
  texParameteri() {}
  viewport(_x, _y, width, height) { this.commands.push(["viewport", width, height]); }
  disable() {}
  clearColor() {}
  clear() {}
  activeTexture(slot) { this.commands.push(["texture-unit", slot]); }
  pixelStorei(setting, value) { this.commands.push(["pixel-store", setting, value]); }
  texImage2D(...args) { this.uploads.push(args); }
  drawArrays(_kind, _offset, vertices) { this.commands.push(["draw", vertices]); }
  getError() { return this.nextError; }
  isContextLost() { return this.lost; }
  deleteShader(object) { this.removed.shaders.push(object); }
  deleteProgram(object) { this.removed.programs.push(object); }
  deleteTexture(object) { this.removed.textures.push(object); }
  deleteBuffer(object) { this.removed.buffers.push(object); }
  deleteVertexArray(object) { this.removed.arrays.push(object); }
}

function tables() {
  const neutral = defaultRecipe().curves;
  return makeCurveLuts({ ...neutral, master: threePointCurve(0.75) });
}

function verifyReleased(gl) {
  for (const name of Object.keys(gl.objects)) {
    assert.equal(gl.removed[name].length, gl.objects[name].length,
      `${name}: allocated and freed must agree`);
    assert.equal(new Set(gl.removed[name]).size, gl.removed[name].length,
      `${name}: no double free`);
  }
}

test("gpu: original shaders are deterministic and use integer LUT/mask texels", () => {
  assert.match(PRO_VERTEX_SHADER, /^#version 300 es/);
  assert.match(PRO_FRAGMENT_SHADER, /texelFetch\(curveTable/);
  assert.match(PRO_FRAGMENT_SHADER, /maskHeight - 1 - position\.y/);
  assert.match(PRO_FRAGMENT_SHADER, /original\.a <= 0\.0/);
  assert.doesNotMatch(PRO_FRAGMENT_SHADER, /fetch\(|https?:|samplerExternal/);
});

test("gpu: packed LUT uses the same byte mapping as the CPU oracle", () => {
  const curve = tables();
  const bytes = packedCurveTable(curve);
  assert.equal(bytes.length, 1024);
  for (const index of [0, 1, 13, 63, 127, 128, 190, 254, 255]) {
    assert.deepEqual(Array.from(bytes.subarray(index * 4, index * 4 + 4)),
      [curve.red[index], curve.green[index], curve.blue[index], 255]);
  }
});

test("gpu: upload dimensions, mask byteplane and explicit cleanup", () => {
  const gl = new FakeGl();
  const gpu = new ProGpuPass(gl);
  const mask = Uint8Array.from([0, 64, 128, 255, 1, 2, 3, 4]);
  const frame = { canvas: "synthetic" };
  gpu.draw(frame, 4, 2, tables(), mask);
  assert.equal(gpu.renderCount, 1);
  assert.ok(gl.commands.some(([kind, w, h]) => kind === "viewport" && w === 4 && h === 2));
  assert.ok(gl.commands.some(([kind, count]) => kind === "draw" && count === 4));
  assert.equal(gl.uploads.length, 3);
  assert.equal(gl.uploads[0].at(-1), frame);
  assert.deepEqual(Array.from(gl.uploads[1].at(-1).subarray(0, 4)),
    [tables().red[0], tables().green[0], tables().blue[0], 255]);
  assert.deepEqual(Array.from(gl.uploads[2].at(-1)), Array.from(mask));
  assert.ok(gl.commands.some((command) => command.join(",") === `pixel-store,${gl.UNPACK_ALIGNMENT},1`));
  gpu.dispose();
  gpu.dispose();
  verifyReleased(gl);
  assert.deepEqual(gpu.stats, {
    releasedShaders: 2,
    releasedPrograms: 1,
    releasedTextures: 3,
    releasedBuffers: 1,
    releasedVertexArrays: 1,
  });
  assert.throws(() => gpu.draw(frame, 4, 2, tables(), mask),
    (error) => error instanceof ProGpuError && error.code === "PRO_GPU_DISPOSED");
});

test("gpu: invalid mask and curve inputs reject before upload", () => {
  const gl = new FakeGl();
  const gpu = new ProGpuPass(gl);
  assert.throws(() => gpu.draw({}, 2, 2, tables(), new Uint8Array(3)), /dimensions/);
  assert.throws(() => gpu.draw({}, 2, 2, { ...tables(), red: new Uint8Array(4) },
    new Uint8Array(4)), /256/);
  assert.equal(gl.uploads.length, 0);
  gpu.dispose();
  verifyReleased(gl);
});

test("gpu: construction failure releases every partially allocated object", () => {
  for (const defect of ["shaders", "programs", "buffers", "textures", "arrays"]) {
    const gl = new FakeGl();
    gl.failAllocation = defect;
    assert.throws(() => new ProGpuPass(gl), ProGpuError);
    verifyReleased(gl);
  }
  for (const flag of ["failCompile", "failLink"]) {
    const gl = new FakeGl();
    gl[flag] = true;
    assert.throws(() => new ProGpuPass(gl), ProGpuError);
    verifyReleased(gl);
  }
});

test("gpu: render errors and context loss do not suppress the error or leak", () => {
  for (const fault of ["lost", "nextError"]) {
    const gl = new FakeGl();
    const gpu = new ProGpuPass(gl);
    gl[fault] = fault === "lost" ? true : 1280;
    assert.throws(() => gpu.draw({}, 2, 2, tables(), new Uint8Array(4)),
      (error) => error instanceof ProGpuError && error.code === "PRO_GPU_RENDER_FAILED");
    gpu.dispose();
    verifyReleased(gl);
  }
});

test("gpu: twenty draws release all GL allocations and submitted buffers", () => {
  for (let index = 0; index < 20; index++) {
    const gl = new FakeGl();
    const gpu = new ProGpuPass(gl);
    gpu.draw({}, 2, 2, tables(), new Uint8Array([0, 85, 170, 255]));
    gpu.dispose();
    verifyReleased(gl);
  }
});

function fakeContext() {
  return {
    operations: [],
    fillStyle: "",
    imageSmoothingEnabled: false,
    imageSmoothingQuality: "low",
    save() {}, restore() {}, setTransform() {}, clearRect() {}, fillRect() {},
    translate() {}, scale() {}, rotate() {}, beginPath() {}, rect() {}, clip() {},
    drawImage() { this.operations.push("image"); },
    getImageData(_x, _y, width, height) {
      return { data: new Uint8ClampedArray(width * height * 4) };
    },
    putImageData() { this.operations.push("pixels"); },
    measureText() { return { width: 40 }; },
    fillText(text) { this.operations.push(text); },
  };
}

test("gpu: GPU absence falls back to fully labelled original CPU renderer", () => {
  const previous = globalThis.OffscreenCanvas;
  const canvases = [];
  class FakeCanvas {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.ctx = fakeContext();
      canvases.push(this);
    }
    getContext(kind) { return kind === "2d" ? this.ctx : null; }
    async convertToBlob(options) { return new Blob(["fake"], { type: options.type }); }
  }
  globalThis.OffscreenCanvas = FakeCanvas;
  try {
    const surface = new GpuProSurface(8, 8);
    const recipe = defaultRecipe();
    const geometry = makeCropGeometry(8, 8, recipe.crop);
    const source = { image: {}, width: 8, height: 8 };
    surface.draw(source, geometry, tables(), "Simulation", false);
    assert.equal(surface.backend, "cpu");
    assert.ok(surface.canvas.ctx.operations.includes("pixels"));
    assert.ok(surface.canvas.ctx.operations.includes("Simulation"));
    assert.equal(canvases.length, 3);
  } finally {
    if (previous === undefined) delete globalThis.OffscreenCanvas;
    else globalThis.OffscreenCanvas = previous;
  }
});
