import assert from "node:assert/strict";
import test from "node:test";
import { ColourPass, ReelGpuError } from "../../../dist/js/reel/index.js";

class ReelGl {
  VERTEX_SHADER = 1;
  FRAGMENT_SHADER = 2;
  COMPILE_STATUS = 3;
  LINK_STATUS = 4;
  TEXTURE_2D = 5;
  TEXTURE_MIN_FILTER = 6;
  TEXTURE_MAG_FILTER = 7;
  TEXTURE_WRAP_S = 8;
  TEXTURE_WRAP_T = 9;
  LINEAR = 10;
  CLAMP_TO_EDGE = 11;
  ARRAY_BUFFER = 12;
  STATIC_DRAW = 13;
  FLOAT = 14;
  RGBA = 15;
  UNSIGNED_BYTE = 16;
  TEXTURE0 = 17;
  TEXTURE1 = 18;
  TRIANGLE_STRIP = 19;
  NO_ERROR = 0;
  broken = "";
  lost = false;
  error = 0;
  allocated = { shaders: [], programs: [], buffers: [], textures: [], arrays: [] };
  deleted = { shaders: [], programs: [], buffers: [], textures: [], arrays: [] };
  calls = [];

  make(name) {
    if (this.broken === `allocate:${name}`) return null;
    const object = { name, id: this.allocated[name].length };
    this.allocated[name].push(object);
    return object;
  }
  createShader() { return this.make("shaders"); }
  createProgram() { return this.make("programs"); }
  createBuffer() { return this.make("buffers"); }
  createTexture() { return this.make("textures"); }
  createVertexArray() { return this.make("arrays"); }
  deleteShader(object) { this.deleted.shaders.push(object); }
  deleteProgram(object) { this.deleted.programs.push(object); }
  deleteTexture(object) { this.deleted.textures.push(object); }
  deleteBuffer(object) { this.deleted.buffers.push(object); }
  deleteVertexArray(object) { this.deleted.arrays.push(object); }
  getShaderParameter() { return this.broken !== "compile"; }
  getProgramParameter() { return this.broken !== "link"; }
  getAttribLocation() { return this.broken === "attribute" ? -1 : 0; }
  getUniformLocation(_program, name) {
    if (this.broken === `uniform:${name}`) return null;
    return { name };
  }
  shaderSource(_shader, source) { assert.match(source, /#version 300 es/); }
  compileShader() {}
  attachShader() {}
  linkProgram() {}
  bindVertexArray(object) { this.calls.push(["vao", object?.id ?? null]); }
  bindBuffer() {}
  bufferData() {}
  enableVertexAttribArray() {}
  vertexAttribPointer() {}
  bindTexture() {}
  texParameteri() {}
  useProgram() {}
  uniform1i(location, slot) { this.calls.push(["uniform", location.name, slot]); }
  uniform3fv(location, value) {
    assert.equal(value.length, 3);
    this.calls.push(["delta", location.name]);
  }
  viewport(_x, _y, width, height) { this.calls.push(["viewport", width, height]); }
  activeTexture(slot) { this.calls.push(["texture", slot]); }
  texImage2D(...args) { this.calls.push(["upload", args.at(-1)]); }
  drawArrays(_mode, _first, count) { this.calls.push(["draw", count]); }
  isContextLost() { return this.lost; }
  getError() { return this.error; }
}

function canvas(gl) {
  return { width: 640, height: 480, getContext: (kind) => kind === "webgl2" ? gl : null };
}

const deltas = {
  skin: [1, 0, 0],
  lips: [0, 1, 0],
  cheeks: [0, 0, 1],
};

function assertClean(gl) {
  for (const key of Object.keys(gl.allocated)) {
    assert.equal(gl.allocated[key].length, gl.deleted[key].length, `${key} leaked`);
    assert.equal(new Set(gl.deleted[key]).size, gl.deleted[key].length, `${key} double released`);
  }
}

test("reel GPU: cannot create a pass without WebGL2", () => {
  assert.throws(() => new ColourPass(canvas(null)),
    (error) => error instanceof ReelGpuError && error.code === "REEL_GPU_UNAVAILABLE");
});

test("reel GPU: uploads frames, applies three deltas and deletes resources", () => {
  const gl = new ReelGl();
  const pass = new ColourPass(canvas(gl));
  const frame = { id: "image" };
  const mask = { id: "mask" };
  pass.render(frame, mask, deltas);
  assert.ok(gl.calls.some((row) => row[0] === "viewport" && row[1] === 640));
  assert.ok(gl.calls.some((row) => row[0] === "upload" && row[1] === frame));
  assert.ok(gl.calls.some((row) => row[0] === "upload" && row[1] === mask));
  assert.equal(gl.calls.filter((row) => row[0] === "delta").length, 3);
  assert.ok(gl.calls.some((row) => row[0] === "draw" && row[1] === 4));
  pass.dispose();
  pass.dispose();
  assertClean(gl);
  assert.deepEqual(pass.resources, {
    shaders: 2,
    programs: 1,
    buffers: 1,
    textures: 2,
    vertexArrays: 1,
    disposed: true,
  });
  assert.throws(() => pass.render(frame, mask, deltas),
    (error) => error instanceof ReelGpuError && error.code === "REEL_GPU_DISPOSED");
});

test("reel GPU: compile and link failures release partial allocations", () => {
  for (const failure of ["compile", "link", "attribute", "uniform:frame",
    "uniform:dSkin", "allocate:shaders", "allocate:programs",
    "allocate:buffers", "allocate:textures", "allocate:arrays"]) {
    const gl = new ReelGl();
    gl.broken = failure;
    assert.throws(() => new ColourPass(canvas(gl)), ReelGpuError, failure);
    assertClean(gl);
  }
});

test("reel GPU: context loss and GL errors fail closed", () => {
  for (const reason of ["lost", "error"]) {
    const gl = new ReelGl();
    const pass = new ColourPass(canvas(gl));
    if (reason === "lost") gl.lost = true;
    else gl.error = 1282;
    assert.throws(() => pass.render({}, {}, deltas),
      (error) => error instanceof ReelGpuError);
    pass.dispose();
    assertClean(gl);
  }
});

test("reel GPU: twenty sequential passes have no retained GL allocations", () => {
  const retired = [];
  for (let i = 0; i < 20; i++) {
    const gl = new ReelGl();
    const pass = new ColourPass(canvas(gl));
    pass.render({}, {}, deltas);
    pass.dispose();
    assertClean(gl);
    retired.push(pass);
  }
  assert.ok(retired.every((pass) => pass.resources.disposed));
  assert.equal(retired.reduce((total, pass) => total + pass.resources.textures, 0), 40);
});
