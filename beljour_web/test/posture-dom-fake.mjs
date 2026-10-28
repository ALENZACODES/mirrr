/** Minimal DOM double for posture panel and studio tests (no jsdom dependency).
 * Supports the subset the posture UI uses: elements, attributes, text, events, a 2D canvas
 * stub and a fetch tripwire that fails the test if any network request is attempted.
 * Author: John Khan.
 */

export class FakeEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.defaultPrevented = false;
    Object.assign(this, init);
  }
  preventDefault() { this.defaultPrevented = true; }
}

class FakeContext2D {
  constructor(canvas) {
    this.canvas = canvas;
    this.drawn = [];
  }
  createImageData(width, height) {
    return { width, height, data: new Uint8ClampedArray(width * height * 4) };
  }
  putImageData(image, x, y) { this.drawn.push({ kind: "putImageData", width: image.width, height: image.height, x, y }); }
  clearRect(...args) { this.drawn.push({ kind: "clearRect", args }); }
  fillRect(...args) { this.drawn.push({ kind: "fillRect", args }); }
  beginPath() {}
  moveTo() {}
  lineTo() {}
  closePath() {}
  stroke() { this.drawn.push({ kind: "stroke" }); }
  fill() { this.drawn.push({ kind: "fill" }); }
  arc() {}
}

export class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = String(tagName).toUpperCase();
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.listeners = new Map();
    this.ownText = "";
    this.value = "";
    this.disabled = false;
    this.hidden = false;
    this.checked = false;
    this.type = "";
    this.className = "";
    this.title = "";
    this.files = null;
    this.width = 0;
    this.height = 0;
    this.removed = false;
    this.context = null;
  }
  get textContent() {
    return this.ownText + this.children.map((child) => child.textContent).join("");
  }
  set textContent(value) {
    this.ownText = String(value);
    for (const child of this.children) child.parentNode = null;
    this.children = [];
  }
  set innerHTML(_value) { throw new Error("posture UI must not assign innerHTML"); }
  get innerHTML() { throw new Error("posture UI must not read innerHTML"); }
  append(...nodes) {
    for (const node of nodes) {
      const child = typeof node === "string" ? this.ownerDocument.createTextNode(node) : node;
      child.parentNode?.removeChild(child);
      child.parentNode = this;
      this.children.push(child);
    }
  }
  prepend(...nodes) {
    const current = this.children;
    this.children = [];
    this.append(...nodes);
    this.children.push(...current);
  }
  replaceChildren(...nodes) {
    for (const child of this.children) child.parentNode = null;
    this.children = [];
    this.ownText = "";
    this.append(...nodes);
  }
  removeChild(child) {
    this.children = this.children.filter((item) => item !== child);
    child.parentNode = null;
    return child;
  }
  remove() {
    this.parentNode?.removeChild(this);
    this.removed = true;
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  removeAttribute(name) { this.attributes.delete(name); }
  hasAttribute(name) { return this.attributes.has(name); }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  dispatchEvent(event) {
    for (const listener of [...(this.listeners.get(event.type) ?? [])]) listener.call(this, event);
    return !event.defaultPrevented;
  }
  emit(type, init = {}) { return this.dispatchEvent(new FakeEvent(type, { target: this, ...init })); }
  click() { if (!this.disabled) this.emit("click"); }
  /** Set an input's value and fire input (drag) or change (release). */
  input(value, type = "input") {
    this.value = String(value);
    this.emit(type);
  }
  getContext(kind) {
    if (this.tagName !== "CANVAS" || kind !== "2d") return null;
    this.context ??= new FakeContext2D(this);
    return this.context;
  }
  focus() { this.ownerDocument.activeElement = this; }
  walk() {
    return [this, ...this.children.flatMap((child) => (child instanceof FakeElement ? child.walk() : []))];
  }
  findAll(predicate) { return this.walk().filter(predicate); }
  find(predicate) { return this.walk().find(predicate); }
  byTag(tag) { return this.findAll((node) => node.tagName === String(tag).toUpperCase()); }
  byText(text) {
    return this.find((node) => node instanceof FakeElement && node.ownText.includes(text));
  }
  button(text) {
    return this.find((node) => node.tagName === "BUTTON" && node.textContent.includes(text));
  }
}

class FakeText {
  constructor(text) {
    this.ownText = String(text);
    this.parentNode = null;
  }
  get textContent() { return this.ownText; }
  set textContent(value) { this.ownText = String(value); }
  walk() { return []; }
}

export class FakeDocument {
  constructor() {
    this.created = [];
    this.activeElement = null;
    this.body = this.createElement("body");
  }
  createElement(tag) {
    const element = new FakeElement(tag, this);
    this.created.push(element);
    return element;
  }
  createTextNode(text) { return new FakeText(text); }
}

/** Install a fake document (and a fetch tripwire) for the duration of `fn`. */
export async function withFakeDocument(fn) {
  const previous = { document: globalThis.document, fetch: globalThis.fetch };
  const document = new FakeDocument();
  const requests = [];
  globalThis.document = document;
  globalThis.fetch = (...args) => {
    requests.push(args);
    throw new Error("posture UI must not make network requests");
  };
  try {
    return await fn(document, requests);
  } finally {
    globalThis.document = previous.document;
    globalThis.fetch = previous.fetch;
  }
}

/** Resolve every queued microtask and timer-free promise chain. */
export async function settle(rounds = 6) {
  for (let i = 0; i < rounds; i++) await new Promise((resolve) => setImmediate(resolve));
}

/** A drawn figure frame with a head marking: the person above the shoulder line.
 * Lazily imports the compiled engine so DOM-only tests do not need it. */
export async function drawnPostureFrame(kind = "front", options = {}) {
  const figures = await import("../dist/js/engines/local/figures.js");
  const figure = kind === "front"
    ? figures.frontFigure({ lean: 4, shoulderDrop: 2, ...options })
    : figures.sideFigure({ headForward: 8, roundShoulder: 10, slouch: 6, sway: 4, ...options });
  const { width, height } = figure.image;
  const points = figure.controls.points;
  const top = kind === "front" ? Math.min(points.right_shoulder[1], points.left_shoulder[1]) : points.neck_base[1];
  const head = { width, height, channels: 1, data: new Float32Array(width * height) };
  for (let y = 0; y < Math.floor(top - 2); y++) {
    for (let x = 0; x < width; x++) if (figure.person.data[y * width + x] >= 0.5) head.data[y * width + x] = 1;
  }
  return { image: figure.image, person: figure.person, head, controls: figure.controls };
}

/** Identity guard double: returns the edited pixels with a fixed similarity. */
export function echoGuard(similarity = 0.99) {
  const guard = { calls: 0, guard(_before, after) {
    guard.calls++;
    return { image: { ...after, data: new Uint8Array(after.data) }, similarity };
  } };
  return guard;
}

/** Wait (bounded) until `predicate()` is true; fails the test instead of hanging. */
export async function until(predicate, rounds = 500) {
  for (let i = 0; i < rounds; i++) {
    if (predicate()) return;
    await new Promise((resolve) => setImmediate(resolve));
  }
  throw new Error("condition not reached");
}
