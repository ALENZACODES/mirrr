/** The slice of WebGL2 this app uses, as a structural type, plus the numeric constants.
 * Keeping it small lets tests run the real pipeline code against a recording fake in node,
 * and makes it obvious which GPU features the editor depends on. Author: John Khan.
 */

export const GL = Object.freeze({
  TEXTURE_2D: 0x0de1, TEXTURE0: 0x84c0, RGBA: 0x1908, RGBA8: 0x8058, RGBA16F: 0x881a, R8: 0x8229, R16F: 0x822d, RED: 0x1903,
  UNSIGNED_BYTE: 0x1401, FLOAT: 0x1406, HALF_FLOAT: 0x140b, TEXTURE_MIN_FILTER: 0x2801, TEXTURE_MAG_FILTER: 0x2800,
  TEXTURE_WRAP_S: 0x2802, TEXTURE_WRAP_T: 0x2803, NEAREST: 0x2600, LINEAR: 0x2601, CLAMP_TO_EDGE: 0x812f,
  FRAMEBUFFER: 0x8d40, COLOR_ATTACHMENT0: 0x8ce0, FRAMEBUFFER_COMPLETE: 0x8cd5, ARRAY_BUFFER: 0x8892,
  STATIC_DRAW: 0x88e4, TRIANGLES: 0x0004, VERTEX_SHADER: 0x8b31, FRAGMENT_SHADER: 0x8b30,
  COMPILE_STATUS: 0x8b81, LINK_STATUS: 0x8b82, MAX_TEXTURE_SIZE: 0x0d33, MAX_RENDERBUFFER_SIZE: 0x84e8,
  UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241, UNPACK_FLIP_Y_WEBGL: 0x9240, PACK_ALIGNMENT: 0x0d05,
  UNPACK_ALIGNMENT: 0x0cf5, NO_ERROR: 0,
});

export type GLHandle = object;

export interface GLLike {
  isContextLost(): boolean;
  getParameter(name: number): unknown;
  getExtension(name: string): unknown;
  getError(): number;
  createTexture(): GLHandle | null;
  deleteTexture(t: GLHandle | null): void;
  bindTexture(target: number, t: GLHandle | null): void;
  activeTexture(unit: number): void;
  texParameteri(target: number, name: number, value: number): void;
  texImage2D(target: number, level: number, internal: number, width: number, height: number, border: number,
    format: number, type: number, pixels: ArrayBufferView | null): void;
  pixelStorei(name: number, value: number | boolean): void;
  createFramebuffer(): GLHandle | null;
  deleteFramebuffer(f: GLHandle | null): void;
  bindFramebuffer(target: number, f: GLHandle | null): void;
  framebufferTexture2D(target: number, attachment: number, textarget: number, t: GLHandle | null, level: number): void;
  checkFramebufferStatus(target: number): number;
  createShader(type: number): GLHandle | null;
  shaderSource(s: GLHandle, source: string): void;
  compileShader(s: GLHandle): void;
  getShaderParameter(s: GLHandle, name: number): unknown;
  getShaderInfoLog(s: GLHandle): string | null;
  deleteShader(s: GLHandle | null): void;
  createProgram(): GLHandle | null;
  attachShader(p: GLHandle, s: GLHandle): void;
  linkProgram(p: GLHandle): void;
  getProgramParameter(p: GLHandle, name: number): unknown;
  getProgramInfoLog(p: GLHandle): string | null;
  deleteProgram(p: GLHandle | null): void;
  useProgram(p: GLHandle | null): void;
  getUniformLocation(p: GLHandle, name: string): GLHandle | null;
  getAttribLocation(p: GLHandle, name: string): number;
  uniform1f(loc: GLHandle | null, v: number): void;
  uniform1i(loc: GLHandle | null, v: number): void;
  createBuffer(): GLHandle | null;
  deleteBuffer(b: GLHandle | null): void;
  bindBuffer(target: number, b: GLHandle | null): void;
  bufferData(target: number, data: ArrayBufferView, usage: number): void;
  createVertexArray(): GLHandle | null;
  deleteVertexArray(v: GLHandle | null): void;
  bindVertexArray(v: GLHandle | null): void;
  enableVertexAttribArray(index: number): void;
  vertexAttribPointer(index: number, size: number, type: number, normalized: boolean, stride: number, offset: number): void;
  viewport(x: number, y: number, w: number, h: number): void;
  drawArrays(mode: number, first: number, count: number): void;
  readPixels(x: number, y: number, w: number, h: number, format: number, type: number, out: ArrayBufferView): void;
}
