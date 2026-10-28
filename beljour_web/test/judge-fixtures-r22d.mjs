// Minimal Canvas/DOM fixture for local-only walkthrough tests. No external faces or network.
import { Element, installDOM } from './helpers/dom.mjs';

export function testCanvas() {
  const calls = [];
  const context = new Proxy({}, {
    get(_obj, prop) {
      if (prop === 'canvas') return null;
      return (...args) => { calls.push([prop, ...args]); };
    },
    set(obj, prop, value) {
      calls.push(['set', prop, value]);
      obj[prop] = value;
      return true;
    },
  });
  const previous = Element.prototype.getContext;
  const previousBlob = Element.prototype.toBlob;
  Element.prototype.getContext = function () { return this.tagName === 'CANVAS' ? context : null; };
  Element.prototype.toBlob = function (callback, type) {
    calls.push(['toBlob', type]);
    callback(new Blob(['illustrative-only'], { type }));
  };
  return { calls, context, restore() {
    Element.prototype.getContext = previous;
    if (previousBlob === undefined) delete Element.prototype.toBlob;
    else Element.prototype.toBlob = previousBlob;
  } };
}

export function judgeDOM() {
  const dom = installDOM();
  const canvas = testCanvas();
  const host = dom.document.createElement('section');
  host.id = 'judge-host';
  dom.root.append(host);
  return { ...dom, host, calls: canvas.calls, close() {
    canvas.restore();
    dom.restore();
  } };
}

export function control(root, action) {
  return root.querySelectorAll('button').find(b => b.dataset.judgeAction === action)
    ?? root.querySelectorAll('input').find(b => b.dataset.judgeAction === action)
    ?? root.querySelectorAll('select').find(b => b.dataset.judgeAction === action);
}

export function fakeBrowser(hash = '') {
  const listeners = new Map();
  return {
    location: { hash },
    addEventListener(name, cb) {
      const row = listeners.get(name) ?? new Set();
      row.add(cb);
      listeners.set(name, row);
    },
    removeEventListener(name, cb) { listeners.get(name)?.delete(cb); },
    fire(name, event = {}) { for (const cb of [...(listeners.get(name) ?? [])]) cb({ type: name, ...event }); },
    count(name) { return listeners.get(name)?.size ?? 0; },
  };
}
