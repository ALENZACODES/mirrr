/** BELJOUR Quality Generator lab: recorder page wiring and a local, fake-DOM run.
 * Author: John Khan.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { cpuResizer } from "../../../dist/js/engines/upscale/quality-generator.js";
import { ellipseMask, mountQualityLab } from "../../../dist/js/pro/quality-lab.js";

const html = readFileSync(new URL("../../../recorder.html", import.meta.url), "utf8");
const source = readFileSync(new URL("../quality-lab.ts", import.meta.url), "utf8");

class FakeNode {
  constructor(tag) {
    this.tagName = tag.toUpperCase(); this.children = []; this.attributes = {}; this.listeners = {};
    this.textContent = ""; this.value = ""; this.disabled = false; this.checked = false; this.parent = null;
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  append(...nodes) { for (const node of nodes) { node.parent = this; this.children.push(node); } }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(node => node !== this); }
  addEventListener(type, listener) { (this.listeners[type] ??= []).push(listener); }
  emit(type) { for (const listener of this.listeners[type] ?? []) listener({ type }); }
  click() { this.emit("click"); }
  get ownerDocument() { return fakeDocument; }
  get text() { return [this.textContent, ...this.children.map(child => child.text)].join(" "); }
}
const fakeDocument = { createElement: tag => new FakeNode(tag) };

function drawnDecoder() {
  return async () => {
    const width = 480, height = 270, data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) data.set([(i * 7) % 256, (i * 3) % 256, 140, 255], i * 4);
    return { digest: "c".repeat(64), image: { width, height, data } };
  };
}

test("the recorder page hosts the lab section and loads its module", () => {
  assert.match(html, /data-quality-lab/);
  assert.match(html, /js\/pro\/quality-lab\.js/);
});

test("the lab source stays local", () => {
  assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|WebSocket|localStorage|indexedDB|sendBeacon/);
  assert.match(source, /revokeObjectURL/);
});

test("lab defaults: label on, lock 5.0, 4K experimental, nothing to render yet", () => {
  const host = new FakeNode("section");
  const lab = mountQualityLab(host, { decoder: drawnDecoder(), resizer: cpuResizer });
  const { controls } = lab;
  assert.equal(controls.label.checked, true);
  assert.equal(controls.lock.value, "5");
  assert.equal(controls.detail.getAttribute("step"), "0.1");
  const fourK = controls.tier.children.find(option => option.getAttribute("value") === "uhd4k");
  assert.equal(fourK.disabled, false);
  assert.match(fourK.textContent, /experimental/);
  assert.equal(controls.denoise.getAttribute("max"), "5");
  assert.equal(controls.render.disabled, true);
  assert.equal(controls.save.disabled, true);
  assert.match(host.text, /not identity verification/);
  lab.dispose();
  assert.equal(host.children.length, 0);
});

test("open, confirm face, preview, render and save locally", async () => {
  const host = new FakeNode("section");
  const previews = [], saved = [];
  const lab = mountQualityLab(host, {
    decoder: drawnDecoder(), resizer: cpuResizer,
    encoder: { encode: async () => Uint8Array.from([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0xff, 0xd9]) },
    onPreview: render => previews.push(render), onSave: file => saved.push(file),
  });
  await lab.openFile(new Blob(["drawn"], { type: "image/png" }));
  await lab.confirmFace();
  assert.equal(previews.length, 1);
  assert.ok(Math.max(previews[0].image.width, previews[0].image.height) <= 640);
  assert.ok(previews[0].audit.protectedPixels > 0);
  lab.controls.detail.value = "4.2";
  lab.controls.detail.emit("input");
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(previews.at(-1).audit.detailLevel, 4.2);
  const render = await lab.renderRelease();
  assert.deepEqual([render.image.width, render.image.height], [1920, 1080]);
  assert.equal(lab.controls.save.disabled, false);
  assert.equal(await lab.save(), true);
  assert.equal(saved[0].label, "Simulation");
  assert.equal(saved[0].name, "BELJOUR_HD1080.jpg");
  assert.match(lab.controls.budget.textContent, /Quality: UNVERIFIED/);
  const report = await lab.runDiagnostics();
  assert.equal(report.humanQuality, "NOT_RUN");
  assert.match(lab.controls.diagnostics.textContent, /Not a quality or release pass/);
  lab.dispose();
});

test("bad input shows fixed copy and does not render", async () => {
  const host = new FakeNode("section");
  const lab = mountQualityLab(host, {
    decoder: async () => ({ digest: "d".repeat(64), image: { width: 100, height: 60, data: new Uint8ClampedArray(24000) } }),
    resizer: cpuResizer,
  });
  await assert.rejects(lab.openFile(new Blob(["x"])));
  assert.match(lab.controls.status.textContent, /fourfold/);
  await lab.confirmFace();
  assert.match(lab.controls.status.textContent, /Open a photo/);
  assert.equal(await lab.renderRelease(), null);
  lab.dispose();
});

test("4K keeps the photo aspect, is labelled experimental and saves under its own name", async () => {
  const host = new FakeNode("section");
  const saved = [];
  const lab = mountQualityLab(host, {
    decoder: async () => ({ digest: "e".repeat(64), image: { width: 960, height: 540,
      data: new Uint8ClampedArray(960 * 540 * 4).fill(160) } }),
    resizer: cpuResizer, encoder: { encode: async () => Uint8Array.from([0xff, 0xd8, 0xff, 0xda, 0x00, 0x02, 0xff, 0xd9]) },
    onSave: file => saved.push(file),
  });
  await lab.openFile(new Blob(["drawn"], { type: "image/png" }));
  await lab.declareNoPerson();
  await lab.chooseTier("uhd4k");
  assert.match(lab.controls.status.textContent, /4K \(experimental\): 3840 x 2160/);
  const result = await lab.renderRelease();
  assert.deepEqual([result.image.width, result.image.height, result.audit.experimental], [3840, 2160, true]);
  assert.equal(await lab.save(), true);
  assert.equal(saved[0].name, "BELJOUR_4K_experimental.jpg");
  lab.dispose();
});

test("ellipse masks follow percentages", () => {
  const mask = ellipseMask(100, 50, 50, 50, 20, 40);
  assert.equal(mask[25 * 100 + 50], 255);
  assert.equal(mask[0], 0);
  assert.throws(() => ellipseMask(10, 10, 50, 50, 0, 10), /percentages/);
});
