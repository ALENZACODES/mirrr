/** Browser-like drawn replay fixtures; all generated in memory. Author: John Khan. */
import { Element } from './dom.mjs';
import { judgeDOM } from '../judge-fixtures-r22d.mjs';
import { syntheticPng } from './synthetic-png.mjs';

export function sequencePage(options = {}) {
  const page = judgeDOM();
  const clock = { now: 500, hidden: false, reducedMotion: Boolean(options.reducedMotion) };
  const timers = new Map();
  const canvasCalls = [];
  const network = [];
  let nextId = 0;
  let canvasOrdinal = 0;
  let downloads = 0;
  const previous = {
    context: Element.prototype.getContext,
    blob: Element.prototype.toBlob,
    imageData: globalThis.ImageData,
    fetch: globalThis.fetch,
    createObjectURL: URL.createObjectURL,
    revokeObjectURL: URL.revokeObjectURL,
  };
  const contexts = new WeakMap();
  Element.prototype.getContext = function (type) {
    if (type !== '2d' || this.tagName !== 'CANVAS') return null;
    if (contexts.has(this)) return contexts.get(this);
    const tone = 25 + (canvasOrdinal++ * 23) % 160;
    const ctx = new Proxy({}, {
      get(_source, method) {
        if (method === 'getImageData') return (_x, _y, width, height) => {
          const data = new Uint8ClampedArray(width * height * 4);
          for (let i = 0; i < data.length; i += 4) {
            data[i] = tone;
            data[i + 1] = tone;
            data[i + 2] = tone;
            data[i + 3] = 255;
          }
          return { width, height, data };
        };
        if (method === 'createLinearGradient' || method === 'createRadialGradient') {
          return () => ({ addColorStop() {} });
        }
        if (method === 'putImageData') return frame => {
          canvasCalls.push({ kind: 'put', width: frame.width, height: frame.height });
        };
        if (method === 'fillText') return value => {
          canvasCalls.push({ kind: 'label', content: String(value) });
        };
        return (...args) => {
          canvasCalls.push({ kind: String(method), count: args.length });
        };
      },
      set() { return true; },
    });
    contexts.set(this, ctx);
    return ctx;
  };
  Element.prototype.toBlob = function (callback, type) {
    if (type !== 'image/png') throw new Error('Only PNG is permitted');
    callback(syntheticPng(this.width, this.height));
  };
  globalThis.ImageData = class {
    constructor(data, width, height) {
      this.data = data;
      this.width = width;
      this.height = height;
    }
  };
  globalThis.fetch = async (...args) => {
    network.push(args);
    throw new Error('Network refused by drawn-only test');
  };
  URL.createObjectURL = () => {
    downloads += 1;
    return `blob:local-${downloads}`;
  };
  URL.revokeObjectURL = () => {};
  const timer = {
    schedule(fn, ms) {
      if (ms < 250 || ms > 2000) throw new Error('Unsafe autoplay interval');
      const id = ++nextId;
      timers.set(id, fn);
      return id;
    },
    cancel(handle) { timers.delete(handle); },
  };
  page.document.hidden = clock.hidden;
  page.document.defaultView = {
    matchMedia: () => ({ matches: clock.reducedMotion }),
  };
  const flush = (duration = 650) => {
    const first = timers.entries().next().value;
    clock.now += duration;
    if (!first) return false;
    const [id, callback] = first;
    timers.delete(id);
    callback();
    return true;
  };
  const action = name => page.host.querySelectorAll('button')
    .find(item => item.dataset.tourAction === name);
  const input = name => page.host.querySelectorAll('input')
    .find(item => item.dataset.tourAction === name);
  const press = async name => {
    const target = action(name);
    if (!target) throw new Error(`Missing action ${name}`);
    if (target.disabled) throw new Error(`Disabled action ${name}`);
    await target.click();
  };
  const tick = async (name, next) => {
    const target = input(name);
    if (!target) throw new Error(`Missing input ${name}`);
    if (target.type === 'checkbox') target.checked = Boolean(next);
    else target.value = String(next);
    await target.dispatch(target.type === 'checkbox' ? 'change' : 'input');
  };
  return {
    ...page, timer, timers, clock, flush, press, tick, action, input,
    canvasCalls, network,
    get downloads() { return downloads; },
    cleanup() {
      Element.prototype.getContext = previous.context;
      Element.prototype.toBlob = previous.blob;
      if (previous.imageData === undefined) delete globalThis.ImageData;
      else globalThis.ImageData = previous.imageData;
      if (previous.fetch === undefined) delete globalThis.fetch;
      else globalThis.fetch = previous.fetch;
      URL.createObjectURL = previous.createObjectURL;
      URL.revokeObjectURL = previous.revokeObjectURL;
      page.close();
    },
  };
}
