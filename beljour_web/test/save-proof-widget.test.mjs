/** Proof view acceptance in a minimal fake DOM. No network, files or faces. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { mountProofWidget } from "../dist/js/save/proof-widget.js";
import { parsePortableProof } from "../dist/js/save/proof-receipt.js";
import { arrayBatchSource } from "../dist/js/save/proof-scheduler.js";

class Element {
  constructor(tag, ownerDocument) {
    this.tagName = tag;
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.listeners = new Map();
    this.attributes = new Map();
    this.textContent = "";
    this.className = "";
    this.disabled = false;
    this.type = "";
    this.parent = null;
  }
  appendChild(child) {
    this.children.push(child);
    child.parent = this;
    return child;
  }
  setAttribute(key, value) { this.attributes.set(key, value); }
  getAttribute(key) { return this.attributes.get(key); }
  addEventListener(name, listener) {
    const current = this.listeners.get(name) ?? [];
    current.push(listener);
    this.listeners.set(name, current);
  }
  removeEventListener(name, listener) {
    this.listeners.set(name, (this.listeners.get(name) ?? []).filter((row) => row !== listener));
  }
  click() {
    if (this.disabled) return;
    for (const listener of this.listeners.get("click") ?? []) listener();
  }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter((element) => element !== this);
    this.parent = null;
  }
  flatten() { return [this, ...this.children.flatMap((child) => child.flatten())]; }
}

function document() {
  const doc = { createElement(tag) { return new Element(tag, doc); } };
  const root = new Element("main", doc);
  return { doc, root };
}

function recipe() {
  const created = "2026-10-24T00:00:00.000Z";
  return {
    format: "beljour-look-recipe/1", id: "look-1234abcd", name: "Private", created,
    versions: [{ version: 1, created, steps: [{ tool: "enhance", provider: "local", strength: 20, settings: {} }] }],
  };
}

function input() {
  const data = new Uint8Array(4 * 4 * 4);
  for (let index = 0; index < data.length; index++) data[index] = (index + 10) % 256;
  return { pixels: { width: 4, height: 4, channels: 4, data } };
}

const engine = { enhance: (photo) => ({ ...photo, data: new Uint8Array(photo.data) }) };

function components(root) {
  const elements = root.flatten();
  const buttons = elements.filter((row) => row.tagName === "button");
  const status = elements.find((row) => row.className === "lg-proof-status");
  const counts = elements.find((row) => row.className === "lg-proof-counts");
  return { buttons, status, counts, section: root.children[0] };
}

async function settled(widget, expectedPhase = "unproven") {
  for (let index = 0; index < 500 && widget.state().phase !== expectedPhase; index++) {
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
  assert.equal(widget.state().phase, expectedPhase);
}

test("panel mounts accessible, opt-in native controls with no automatic proof", () => {
  const { root } = document();
  let reads = 0;
  const widget = mountProofWidget(root, { readSource: () => { reads++; return null; } });
  const { buttons, status, section } = components(root);
  assert.equal(reads, 0);
  assert.equal(buttons.length, 3);
  assert.equal(status.getAttribute("role"), "status");
  assert.equal(status.getAttribute("aria-live"), "polite");
  assert.equal(section.getAttribute("role"), "group");
  assert.equal(section.getAttribute("aria-busy"), "false");
  assert.equal(buttons[0].type, "button");
  assert.equal(buttons[1].disabled, true);
  assert.equal(buttons[2].disabled, true);
  assert.equal(widget.state().phase, "idle");
  widget.destroy();
  assert.equal(root.children.length, 0);
});

test("click starts actual local mechanical audit and displays only counts", async () => {
  const { root } = document();
  let calls = 0;
  const widget = mountProofWidget(root, {
    readSource() {
      calls++;
      return { recipe: recipe(), batch: arrayBatchSource([input()], 1), engine };
    },
  });
  const { buttons, status, counts } = components(root);
  buttons[0].click();
  await settled(widget);
  assert.equal(calls, 1);
  assert.equal(widget.state().audit.replay.report.counts.passed, 1);
  assert.match(counts.textContent, /local replay 1\/1 complete mechanical passes/i);
  assert.match(counts.textContent, /not a real-face/i);
  assert.match(status.textContent, /complete/i);
  assert.equal(buttons[2].disabled, true);
  assert.equal(JSON.stringify(widget.state()).includes('"data"'), false);
  widget.destroy();
});

test("no source produces clear help text, with no pretend evidence", async () => {
  const { root } = document();
  const widget = mountProofWidget(root, { readSource: () => null });
  const { buttons, status } = components(root);
  buttons[0].click();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(widget.state().phase, "idle");
  assert.match(status.textContent, /open a photo/i);
  widget.destroy();
});

test("permission or source reader failure uses generic, privacy-safe error text", async () => {
  const { root } = document();
  const widget = mountProofWidget(root, { readSource: () => { throw new Error("portrait-alice.png"); } });
  const { buttons, status } = components(root);
  buttons[0].click();
  await new Promise((resolve) => setImmediate(resolve));
  assert.match(status.textContent, /cannot check/i);
  assert(!status.textContent.includes("portrait-alice.png"));
  widget.destroy();
});

test("completed count-only result can be exported through explicit injected delivery", async () => {
  const { root } = document();
  const deliveries = [];
  const widget = mountProofWidget(root, {
    readSource: () => ({ recipe: recipe(), batch: arrayBatchSource([input()], 1), engine }),
    deliverReceipt: (name, text) => { deliveries.push({ name, text }); },
  });
  const { buttons, status } = components(root);
  buttons[0].click();
  await settled(widget);
  assert.equal(buttons[2].disabled, false);
  buttons[2].click();
  for (let index = 0; index < 500 && deliveries.length === 0; index++) {
    await new Promise((resolve) => setTimeout(resolve, 2));
  }
  assert.equal(deliveries.length, 1);
  assert.equal(deliveries[0].name, "LookProof-counts.json");
  const parsed = await parsePortableProof(deliveries[0].text, recipe());
  assert.equal(parsed.audit.replay.report.counts.passed, 1);
  assert.match(status.textContent, /count-only receipt exported/i);
  widget.destroy();
});

test("source invalidation revokes the old export and resets status", async () => {
  const { root } = document();
  let deliveries = 0;
  const widget = mountProofWidget(root, {
    readSource: () => ({ recipe: recipe(), batch: arrayBatchSource([input()], 1), engine }),
    deliverReceipt: () => { deliveries++; },
  });
  const { buttons, status } = components(root);
  buttons[0].click();
  await settled(widget);
  widget.invalidate();
  assert.equal(widget.state().phase, "idle");
  assert.equal(buttons[2].disabled, true);
  buttons[2].click();
  assert.equal(deliveries, 0);
  assert.match(status.textContent, /no local check/i);
  widget.destroy();
});

test("cancelling while source reader awaits prevents starting any obsolete work", async () => {
  const { root } = document();
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const widget = mountProofWidget(root, {
    readSource: () => pending,
  });
  const { buttons } = components(root);
  buttons[0].click();
  buttons[1].click();
  release({ recipe: recipe(), batch: arrayBatchSource([input()], 1), engine });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(widget.state().phase, "idle");
  widget.destroy();
});

test("destroy while asynchronously waiting leaves no controls or result", async () => {
  const { root } = document();
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const widget = mountProofWidget(root, { readSource: () => pending });
  const { buttons } = components(root);
  buttons[0].click();
  widget.destroy();
  release({ recipe: recipe(), batch: arrayBatchSource([input()], 1), engine });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(root.children.length, 0);
  assert.equal(widget.state().audit, null);
});

test("invalid heading and non-function injection fail without touching DOM", () => {
  const { root } = document();
  assert.throws(() => mountProofWidget(root, { readSource: () => null, title: "Bad <script>" }), /heading/);
  assert.throws(() => mountProofWidget(root, { readSource: 2 }), /DOM root/);
  assert.throws(() => mountProofWidget(root, { readSource: () => null, deliverReceipt: 1 }), /delivery/);
});

test("unavailable receipt receiver disables receipt button instead of offering a dead action", async () => {
  const { root } = document();
  const widget = mountProofWidget(root, {
    readSource: () => ({ recipe: recipe(), batch: arrayBatchSource([input()], 1), engine }),
  });
  const { buttons } = components(root);
  buttons[0].click();
  await settled(widget);
  assert.equal(buttons[2].disabled, true);
  widget.destroy();
});
