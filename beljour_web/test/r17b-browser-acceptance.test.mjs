/** Browser-style event acceptance for r17b-studio.html without a new dependency. Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderJob } from "../dist/js/ui/r17b/render.js";

class ClassList {
  values = new Set();
  toggle(name, enabled) {
    if (enabled) this.values.add(name);
    else this.values.delete(name);
  }
  contains(name) { return this.values.has(name); }
}

class FakeElement {
  constructor(tagName = "div", id = "") {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.value = "";
    this.textContent = "";
    this.children = [];
    this.listeners = new Map();
    this.classList = new ClassList();
    this.files = null;
    this.width = 96;
    this.height = 112;
    this.label = new FakeElementLabel();
    this.context = null;
  }
  addEventListener(name, listener) {
    const rows = this.listeners.get(name) ?? [];
    rows.push(listener);
    this.listeners.set(name, rows);
  }
  dispatch(name) {
    for (const listener of this.listeners.get(name) ?? []) {
      listener({ currentTarget: this, target: this, type: name });
    }
  }
  append(...children) {
    for (const child of children) {
      this.children.push(child);
      if (!this.value && typeof child.value === "string") this.value = child.value;
    }
  }
  replaceChildren(...children) {
    this.children = [...children];
    this.value = children[0]?.value ?? "";
  }
  closest(selector) { return selector === "label" ? this.label : null; }
  getContext(kind) {
    if (this.tagName !== "CANVAS" || kind !== "2d") return null;
    if (!this.context) {
      this.context = {
        putImageData: (value, x, y) => { this.lastImage = { value, x, y }; },
        fillRect: () => {},
        fillText: () => {},
        fillStyle: "",
        font: "",
      };
    }
    return this.context;
  }
  set innerHTML(value) { this._innerHTML = value; }
  get innerHTML() { return this._innerHTML ?? ""; }
}

class FakeElementLabel {
  constructor() { this.classList = new ClassList(); }
}

class FakeRoot extends FakeElement {
  constructor() {
    super("main", "r17b-root");
    this.registry = new Map();
  }
  set innerHTML(value) {
    this._innerHTML = value;
    const ids = [...value.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
    for (const id of ids) {
      let tag = "div";
      if (["r17-feature", "r17-style", "r17-direction", "r17-level"].includes(id)) tag = "select";
      else if (["r17-amount", "r17-humidity", "r17-file"].includes(id)) tag = "input";
      else if (id === "r17-canvas") tag = "canvas";
      else if (id.includes("out")) tag = "output";
      else if (["r17-fixture", "r17-run", "r17-cancel", "r17-compare", "r17-save"].includes(id)) tag = "button";
      else if (id === "r17-metrics") tag = "pre";
      const element = new FakeElement(tag, id);
      if (id === "r17-amount") element.value = "55";
      if (id === "r17-humidity") element.value = "55";
      if (id === "r17-direction") element.value = "neutral";
      if (id === "r17-level") element.value = "normal";
      if (id === "r17-compare") element.textContent = "Show original";
      this.registry.set(id, element);
    }
  }
  get innerHTML() { return this._innerHTML ?? ""; }
  querySelector(selector) {
    if (!selector.startsWith("#")) return null;
    return this.registry.get(selector.slice(1)) ?? null;
  }
}

class FakeDocument {
  constructor(root) { this.root = root; }
  getElementById(id) { return id === "r17b-root" ? this.root : null; }
  createElement(tag) { return new FakeElement(tag); }
}

class FakeImageData {
  constructor(data, width, height) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}

let workerDelay = 0;
class FakeWorker {
  static created = [];
  constructor() {
    this.onmessage = null;
    this.onerror = null;
    this.terminated = false;
    FakeWorker.created.push(this);
  }
  postMessage(value) {
    const deliver = () => {
      if (this.terminated) return;
      try {
        const result = renderJob(value.job);
        this.onmessage?.({ data: { id: value.job.id, ok: true, result } });
      } catch (error) {
        this.onmessage?.({ data: { id: value.job.id, ok: false, error: String(error) } });
      }
    };
    setTimeout(deliver, workerDelay);
  }
  terminate() { this.terminated = true; }
}

const root = new FakeRoot();
const windowListeners = new Map();
globalThis.document = new FakeDocument(root);
globalThis.window = {
  addEventListener(name, listener) { windowListeners.set(name, listener); },
};
globalThis.ImageData = FakeImageData;
globalThis.Worker = FakeWorker;

await import(`../dist/js/ui/r17b/entry.js?browser-acceptance=${Date.now()}`);

const byId = id => {
  const value = root.querySelector(`#${id}`);
  assert.ok(value, id);
  return value;
};
const tick = (ms = 5) => new Promise(resolve => setTimeout(resolve, ms));

test("studio mounts all R17B cards into the actual entry event surface", () => {
  assert.match(root.innerHTML, /Hair, makeup and finish lab/);
  assert.equal(byId("r17-feature").children.length, 46);
  assert.ok(windowListeners.has("pagehide"));
  assert.equal(byId("r17-canvas").width, 96);
  assert.equal(byId("r17-canvas").height, 112);
});

test("synthetic fixture button visibly labels synthetic evidence", () => {
  byId("r17-fixture").dispatch("click");
  assert.match(byId("r17-status").textContent, /Synthetic drawn fixture/);
  assert.match(byId("r17-copy").innerHTML, /Clip-in length/);
});

test("run button executes through Worker and paints a local result", async () => {
  workerDelay = 0;
  byId("r17-run").dispatch("click");
  await tick();
  assert.match(byId("r17-status").textContent, /Local hair simulation/);
  assert.match(byId("r17-metrics").textContent, /changed_fraction/);
  assert.ok(byId("r17-canvas").lastImage);
  assert.ok(FakeWorker.created.at(-1).terminated);
});

test("amount slider invalidates then next run uses the new amount", async () => {
  const amount = byId("r17-amount");
  amount.value = "83";
  amount.dispatch("input");
  assert.equal(byId("r17-amount-out").value, "83 %");
  byId("r17-run").dispatch("click");
  await tick();
  assert.match(byId("r17-status").textContent, /Local hair simulation/);
});

test("feature change exercises workflow path through actual select event", async () => {
  const feature = byId("r17-feature");
  feature.value = "W99";
  feature.dispatch("change");
  assert.match(byId("r17-copy").innerHTML, /Maintenance calendar/);
  byId("r17-run").dispatch("click");
  await tick();
  assert.match(byId("r17-status").textContent, /Local workflow output/);
  assert.match(byId("r17-metrics").textContent, /estimated maintenance schedule/);
});

test("upscale changes canvas dimensions through the actual UI path", async () => {
  const feature = byId("r17-feature");
  feature.value = "UPSCALE2";
  feature.dispatch("change");
  byId("r17-run").dispatch("click");
  await tick(20);
  assert.equal(byId("r17-canvas").width, 192);
  assert.equal(byId("r17-canvas").height, 224);
  assert.match(byId("r17-status").textContent, /Classical local upscale/);
});

test("compare button toggles the actual canvas back to original dimensions", () => {
  const compare = byId("r17-compare");
  compare.dispatch("click");
  assert.equal(compare.textContent, "Show simulation");
  assert.equal(byId("r17-canvas").width, 96);
  assert.equal(byId("r17-canvas").height, 112);
  compare.dispatch("click");
  assert.equal(compare.textContent, "Show original");
  assert.equal(byId("r17-canvas").width, 192);
});

test("cancel button terminates an in-flight worker and retains original", async () => {
  workerDelay = 40;
  const feature = byId("r17-feature");
  feature.value = "W19";
  feature.dispatch("change");
  byId("r17-run").dispatch("click");
  const active = FakeWorker.created.at(-1);
  byId("r17-cancel").dispatch("click");
  assert.equal(active.terminated, true);
  assert.match(byId("r17-status").textContent, /cancelled; original retained/i);
  await tick(50);
  assert.match(byId("r17-status").textContent, /cancelled; original retained/i);
  workerDelay = 0;
});

test("gender controls reveal only for gender card and run locally", async () => {
  const feature = byId("r17-feature");
  feature.value = "GENDER";
  feature.dispatch("change");
  assert.equal(byId("r17-direction").label.classList.contains("hidden"), false);
  assert.equal(byId("r17-level").label.classList.contains("hidden"), false);
  byId("r17-direction").value = "masculine";
  byId("r17-direction").dispatch("change");
  byId("r17-level").value = "hyper";
  byId("r17-level").dispatch("change");
  byId("r17-run").dispatch("click");
  await tick();
  assert.match(byId("r17-status").textContent, /Full-look signal simulation/);
  assert.match(byId("r17-metrics").textContent, /identity_geometry_changed/);
});

test("pagehide cleanup cancels owned worker without network primitives", () => {
  windowListeners.get("pagehide")?.();
  const source = root.innerHTML;
  assert.doesNotMatch(source, /fetch\s*\(/);
  assert.doesNotMatch(source, /XMLHttpRequest|WebSocket|sendBeacon/);
});
