// DOM contract for local screen integration tests. Real listeners and controls,
// no browser dependency or network. Author: John Khan.
export class Element {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase(); this.children = []; this.attributes = new Map();
    this.listeners = new Map(); this.style = {}; this.dataset = {}; this.value = '';
    this.disabled = false; this.hidden = false; this.checked = false; this.files = [];
    this.className = ''; this.parentNode = null; this._text = '';
  }
  set textContent(value) { this._text = String(value ?? ''); this.children = []; }
  get textContent() { return this._text + this.children.map(c => typeof c === 'string' ? c : c.textContent).join(''); }
  get firstChild() { return this.children[0] ?? null; }
  get childElementCount() { return this.children.filter(c => c instanceof Element).length; }
  get isConnected() { return true; }
  append(...children) { for (const child of children) { if (child instanceof Element) child.parentNode = this; this.children.push(child instanceof Element ? child : String(child)); } }
  prepend(...children) { this.children.unshift(...children); }
  appendChild(child) { this.append(child); return child; }
  replaceChildren(...children) { this._text = ''; this.children = []; this.append(...children); }
  removeChild(child) { this.children.splice(this.children.indexOf(child), 1); return child; }
  remove() { this.parentNode?.removeChild(this); }
  setAttribute(key, value) {
    this.attributes.set(key, String(value));
    if (key === 'id') this.id = String(value);
    if (key === 'value') this.value = String(value);
    if (key === 'class') this.className = String(value);
    if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value);
  }
  getAttribute(key) { return this.attributes.get(key) ?? null; }
  removeAttribute(key) { this.attributes.delete(key); }
  addEventListener(type, fn) { const list = this.listeners.get(type) ?? []; list.push(fn); this.listeners.set(type, list); }
  removeEventListener(type, fn) { this.listeners.set(type, (this.listeners.get(type) ?? []).filter(f => f !== fn)); }
  async dispatch(type, extra = {}) { const event = { type, target: this, currentTarget: this, preventDefault() {}, stopPropagation() {}, ...extra }; for (const fn of this.listeners.get(type) ?? []) await fn(event); }
  click() { if (!this.disabled) return this.dispatch('click'); }
  focus() { this.focused = true; }
  scrollIntoView() {}
  getBoundingClientRect() { return { left: 0, top: 0, width: this.width ?? 100, height: this.height ?? 100 }; }
  querySelectorAll(selector) {
    const match = node => {
      if (selector.startsWith('#')) return node.id === selector.slice(1);
      if (selector.startsWith('.')) return node.className.split(/\s+/).includes(selector.slice(1));
      const attr = /^(\w+)?\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(selector);
      if (attr) return (!attr[1] || node.tagName === attr[1].toUpperCase()) && node.getAttribute(attr[2]) !== null && (attr[3] === undefined || node.getAttribute(attr[2]) === attr[3]);
      return node.tagName === selector.toUpperCase();
    };
    const results = [];
    const visit = node => { for (const child of node.children ?? []) if (child instanceof Element) { if (match(child)) results.push(child); visit(child); } };
    visit(this); return results;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  getContext() { return null; }
}
export function installDOM() {
  const previous = { Node: globalThis.Node, document: globalThis.document }, root = new Element('body');
  const document = { body: root, createElement: tag => new Element(tag), createElementNS: (_ns, tag) => new Element(tag),
    getElementById: id => root.querySelector(`#${id}`), querySelector: selector => root.querySelector(selector),
    querySelectorAll: selector => root.querySelectorAll(selector), addEventListener() {}, removeEventListener() {} };
  globalThis.Node = Element; globalThis.document = document;
  return { root, document, restore() {
    if (previous.Node === undefined) delete globalThis.Node; else globalThis.Node = previous.Node;
    if (previous.document === undefined) delete globalThis.document; else globalThis.document = previous.document;
  } };
}
export function buttonNamed(root, name) { return root.querySelectorAll('button').find(button => button.textContent === name); }
