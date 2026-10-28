// A recording WebGL2 stand-in for node tests. It implements the GLLike slice the pipeline uses,
// stores textures as float arrays quantised to their internal format (RGBA8 to 1/255 steps,
// RGBA16F to half precision), and on drawArrays runs the CPU reference for the bound program's
// op with the uniforms the pipeline actually set. So these tests exercise the real WebGL2
// backend code path (uploads, framebuffers, program cache, uniforms, ping-pong, readback);
// they do not prove a real GPU's shader compiler, which the browser smoke run covers.
// Author: John Khan.
import { GL } from "../../dist/js/engines/gpu/gl.js";
import { SHADERS, cpuOp, cpuComposite } from "../../dist/js/engines/gpu/shaders/ops.js";
import { toHalf } from "../../dist/js/engines/gpu/pipeline.js";

let nextId = 1;
const handle = (kind) => ({ kind, id: nextId++ });

export function fakeGL({ maxTextureSize = 4096, float = true, lost = false } = {}) {
  const state = {
    lost, textures: new Map(), framebuffers: new Map(), programs: new Map(), shaders: new Map(),
    boundTexture: null, units: [], activeUnit: 0, framebuffer: null, program: null, uniforms: new Map(),
    created: { texture: 0, framebuffer: 0, program: 0, shader: 0, buffer: 0, vao: 0 },
    deleted: { texture: 0, framebuffer: 0, program: 0, shader: 0, buffer: 0, vao: 0 },
    draws: [], compiles: 0, viewport: null,
  };
  const quant = (internal, v) => internal === GL.RGBA8 || internal === GL.R8 ? Math.round(Math.min(1, Math.max(0, v)) * 255) / 255 : toHalf(v);
  const opOf = (source) => Object.values(SHADERS).find((s) => s.fragment === source)?.id;
  const gl = {
    state,
    isContextLost: () => state.lost,
    getParameter: (name) => name === GL.MAX_TEXTURE_SIZE ? maxTextureSize : null,
    getExtension: (name) => name === "EXT_color_buffer_float" && float ? {} : null,
    getError: () => GL.NO_ERROR,
    createTexture: () => { const t = handle("texture"); state.textures.set(t, null); state.created.texture++; return t; },
    deleteTexture: (t) => { if (state.textures.delete(t)) state.deleted.texture++; },
    bindTexture: (_target, t) => { state.boundTexture = t; state.units[state.activeUnit] = t; },
    activeTexture: (unit) => { state.activeUnit = unit - GL.TEXTURE0; },
    texParameteri: () => {},
    pixelStorei: () => {},
    texImage2D: (_t, _l, internal, width, height, _b, format, type, pixels) => {
      const channels = format === GL.RED ? 1 : 4;
      const data = new Float32Array(width * height * channels);
      if (pixels) for (let i = 0; i < data.length; i++) data[i] = quant(internal, type === GL.UNSIGNED_BYTE ? pixels[i] / 255 : pixels[i]);
      state.textures.set(state.boundTexture, { width, height, internal, channels, data });
    },
    createFramebuffer: () => { const f = handle("framebuffer"); state.framebuffers.set(f, null); state.created.framebuffer++; return f; },
    deleteFramebuffer: (f) => { if (state.framebuffers.delete(f)) state.deleted.framebuffer++; },
    bindFramebuffer: (_t, f) => { state.framebuffer = f; },
    framebufferTexture2D: (_t, _a, _tt, tex) => { state.framebuffers.set(state.framebuffer, tex); },
    checkFramebufferStatus: () => GL.FRAMEBUFFER_COMPLETE,
    createShader: (type) => { const s = handle("shader"); state.shaders.set(s, { type, source: "" }); state.created.shader++; return s; },
    shaderSource: (s, source) => { state.shaders.get(s).source = source; },
    compileShader: () => { state.compiles++; },
    getShaderParameter: () => true,
    getShaderInfoLog: () => "",
    deleteShader: (s) => { if (state.shaders.delete(s)) state.deleted.shader++; },
    createProgram: () => { const p = handle("program"); state.programs.set(p, { shaders: [] }); state.created.program++; return p; },
    attachShader: (p, s) => { state.programs.get(p).shaders.push(state.shaders.get(s)); },
    linkProgram: (p) => { const prog = state.programs.get(p); prog.op = opOf(prog.shaders.find((s) => s.type === GL.FRAGMENT_SHADER).source); },
    getProgramParameter: () => true,
    getProgramInfoLog: () => "",
    deleteProgram: (p) => { if (state.programs.delete(p)) state.deleted.program++; },
    useProgram: (p) => { state.program = p; },
    getUniformLocation: (p, name) => ({ program: p, name }),
    getAttribLocation: () => 0,
    uniform1f: (loc, v) => { state.uniforms.set(loc.name, v); },
    uniform1i: (loc, v) => { state.uniforms.set(loc.name, v); },
    createBuffer: () => { state.created.buffer++; return handle("buffer"); },
    deleteBuffer: () => { state.deleted.buffer++; },
    bindBuffer: () => {},
    bufferData: () => {},
    createVertexArray: () => { state.created.vao++; return handle("vao"); },
    deleteVertexArray: () => { state.deleted.vao++; },
    bindVertexArray: () => {},
    enableVertexAttribArray: () => {},
    vertexAttribPointer: () => {},
    viewport: (x, y, w, h) => { state.viewport = [x, y, w, h]; },
    drawArrays: () => {
      const op = state.programs.get(state.program).op;
      const dstTex = state.textures.get(state.framebuffers.get(state.framebuffer));
      const tex = (name) => state.textures.get(state.units[state.uniforms.get(name)]);
      const src = tex("u_src");
      const params = {};
      for (const key of Object.keys(SHADERS[op].bounds)) params[key] = state.uniforms.get("u_" + key);
      let out;
      if (op === "composite") {
        const layer = tex("u_layer"), mask = tex("u_mask");
        out = cpuComposite({ width: src.width, height: src.height, data: src.data }, { width: layer.width, height: layer.height, data: layer.data }, mask.data, params);
      } else out = cpuOp(op, { width: src.width, height: src.height, data: src.data }, params);
      for (let i = 0; i < out.data.length; i++) dstTex.data[i] = quant(dstTex.internal, out.data[i]);
      state.draws.push(op);
    },
    readPixels: (_x, _y, w, h, _f, type, out) => {
      const t = state.textures.get(state.framebuffers.get(state.framebuffer));
      for (let i = 0; i < w * h * 4; i++) out[i] = type === GL.UNSIGNED_BYTE ? Math.round(t.data[i] * 255) : t.data[i];
    },
  };
  return gl;
}

export function fakeCanvas(gl) {
  const listeners = new Map();
  return {
    gl, listeners, requested: 0,
    getContext(type, attrs) { this.requested++; this.attrs = attrs; return type === "webgl2" ? gl : null; },
    addEventListener(type, fn) { listeners.set(type, [...(listeners.get(type) ?? []), fn]); },
    removeEventListener(type, fn) { listeners.set(type, (listeners.get(type) ?? []).filter((f) => f !== fn)); },
    fire(type) { let prevented = false; for (const fn of listeners.get(type) ?? []) fn({ preventDefault: () => { prevented = true; } }); return prevented; },
  };
}
