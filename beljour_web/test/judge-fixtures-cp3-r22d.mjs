// Synthetic-only helpers: image headers are metadata bytes, never real face samples.
import { JudgeSession } from '../dist/js/layout/judge-session.js';
import { judgeDOM } from './judge-fixtures-r22d.mjs';

export function clockHarness(start = 1000) {
  let current = start;
  return {
    port: { now: () => current },
    advance(milliseconds) { current += milliseconds; },
    rewind(milliseconds) { current -= milliseconds; },
    set(value) { current = value; },
    time() { return current; },
  };
}

export function availableSession() {
  const session = new JudgeSession();
  session.selectSource('sample');
  session.consent('local', true);
  session.consent('hair', true);
  session.consent('face', true);
  session.consent('mock', true);
  session.setHair('chestnut');
  session.setFace('warm');
  session.setMock(true);
  return session;
}

export function sampleBytesPng(width = 512, height = 640) {
  const bytes = new Uint8Array(33);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13], 0);
  bytes.set([73, 72, 68, 82], 12);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  bytes[24] = 8;
  bytes[25] = 2;
  return bytes;
}

export function sampleBytesJpeg(width = 512, height = 640, extraMetadata = false) {
  const soi = [255, 216];
  const app = extraMetadata ? [255, 225, 0, 8, 1, 2, 3, 4, 5, 6] : [];
  const sof = [255, 192, 0, 11, 8, height >> 8, height & 255, width >> 8, width & 255];
  return new Uint8Array([...soi, ...app, ...sof, 1, 1, 0x11, 0, 255, 217]);
}

export function sampleBytesWebp(width = 512, height = 640) {
  const bytes = new Uint8Array(30);
  bytes.set([82, 73, 70, 70, 22, 0, 0, 0, 87, 69, 66, 80, 86, 80, 56, 88], 0);
  bytes[16] = 10;
  const w = width - 1;
  const h = height - 1;
  bytes[24] = w & 255;
  bytes[25] = (w >> 8) & 255;
  bytes[26] = (w >> 16) & 255;
  bytes[27] = h & 255;
  bytes[28] = (h >> 8) & 255;
  bytes[29] = (h >> 16) & 255;
  return bytes;
}

export function headerFile(bytes, type = 'image/png') {
  return new File([bytes], 'synthetic-image.bin', { type });
}

export function keyEvent(key, target = null, additional = {}) {
  let prevented = false;
  return {
    key,
    target,
    ...additional,
    preventDefault() { prevented = true; },
    get prevented() { return prevented; },
  };
}

export function eventSource() {
  const listeners = new Map();
  return {
    addEventListener(type, fn) {
      const list = listeners.get(type) ?? new Set();
      list.add(fn);
      listeners.set(type, list);
    },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    fire(type, properties = {}) {
      const event = keyEvent(type, properties.target, properties);
      for (const listener of listeners.get(type) ?? []) listener(event);
      return event;
    },
    count(type) { return listeners.get(type)?.size ?? 0; },
  };
}

export function reportPage() {
  const dom = judgeDOM();
  return { ...dom, teardown: () => dom.close() };
}
