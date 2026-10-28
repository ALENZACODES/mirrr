/** Guided local demo path through the shipped editor and compare interface.
 * Synthetic scene previews never contact the provider or reveal face data.
 * Author: John Khan.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { Editor } from "../../dist/js/ui/shell/controller.js";
import { CompareSession } from "../../dist/js/ui/shell/compare-session.js";
import { renderCompare } from "../../dist/js/ui/shell/compare-render.js";
import { stageBox } from "../../dist/js/ui/shell/compare-layout.js";
import { DemoTour, parseDemoHash } from "../../dist/js/demo/loader.js";
import { DEMO_SCENES } from "../../dist/js/demo/scenes.js";

function checksum(image) {
  let value = 2166136261;
  for (const byte of image.data) {
    value ^= byte;
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function blockExternalCalls(run) {
  const previousFetch = globalThis.fetch;
  const previousXHR = globalThis.XMLHttpRequest;
  let attempts = 0;
  globalThis.fetch = () => {
    attempts++;
    throw new Error("external calls are forbidden during local judge mode");
  };
  globalThis.XMLHttpRequest = class {
    constructor() {
      attempts++;
      throw new Error("external calls are forbidden during local judge mode");
    }
  };
  try {
    return run();
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.XMLHttpRequest = previousXHR;
    assert.equal(attempts, 0);
  }
}

function render(editor, compare, width, height) {
  const dimension = stageBox(width, height);
  const frames = editor.frames(compare.state.mode);
  return renderCompare(compare.state, frames, {
    box: dimension.box,
    phone: dimension.phone,
  });
}

test("guided ten-step judge tour executes real editor layers without external traffic", () => {
  blockExternalCalls(() => {
    const editor = new Editor("portrait");
    const compare = new CompareSession();
    const tour = new DemoTour(editor, compare);
    const seen = new Set();
    assert.equal(tour.position, -1);
    assert.equal(tour.length, DEMO_SCENES.length);
    assert.ok(tour.length >= 10);
    for (let index = 0; index < tour.length; index++) {
      const response = tour.next();
      assert.equal(response.id, DEMO_SCENES[index].id);
      assert.equal(tour.position, index);
      assert.equal(tour.current.id, response.id);
      assert.equal(parseDemoHash(`#demo=${response.id}`), response.id);
      assert.ok(response.title);
      assert.ok(response.line);
      assert.ok(response.layers >= 1);
      assert.equal(response.layers, editor.document.layers.length);
      assert.equal(editor.document.selected, response.selected);
      assert.ok(editor.summary().localOnly);
      assert.match(tour.label(), /^Scene \d+ of \d+:/);
      seen.add(response.id);
      const original = checksum(editor.source.image);
      const preview = editor.preview();
      assert.equal(preview.image.data.length, editor.source.image.data.length);
      assert.equal(checksum(editor.source.image), original);
      assert.ok(preview.image.data.every(Number.isFinite));
      const image = render(editor, compare, 390, 844);
      assert.ok(image.image.data.length > 0);
      assert.ok(image.description.length > 10);
      assert.equal(checksum(editor.source.image), original);
      assert.ok(image.layout.width > 0);
      assert.ok(image.layout.height > 0);
      assert.ok(image.layout.width <= 390);
      assert.ok(image.layout.height <= 844);
    }
    assert.equal(seen.size, tour.length);
    assert.equal(tour.next().id, DEMO_SCENES[0].id);
    assert.equal(tour.previous().id, DEMO_SCENES.at(-1).id);
    editor.dispose();
  });
});

test("the selected scene remains stable at mobile and desktop sizes", () => {
  blockExternalCalls(() => {
    const editor = new Editor("crown");
    const compare = new CompareSession();
    const tour = new DemoTour(editor, compare);
    const scene = tour.open("spray-side-by-side");
    assert.equal(scene.id, "spray-side-by-side");
    assert.equal(compare.state.mode, "side-by-side");
    const original = checksum(editor.source.image);
    for (const [width, height] of [[390, 844], [1280, 800]]) {
      const first = render(editor, compare, width, height);
      const second = render(editor, compare, width, height);
      assert.equal(checksum(first.image), checksum(second.image));
      assert.ok(first.layout.width <= width);
      assert.ok(first.layout.height <= height);
      assert.equal(checksum(editor.source.image), original);
    }
    editor.dispose();
  });
});

test("advancing the guided demo replaces stale layers and history", () => {
  blockExternalCalls(() => {
    const editor = new Editor("crown");
    const compare = new CompareSession();
    const tour = new DemoTour(editor, compare);
    tour.open("stack-grid");
    assert.equal(editor.document.layers.length, 2);
    const oldSource = checksum(editor.source.image);
    tour.open("dark-photo-split");
    assert.equal(editor.document.layers.length, 1);
    assert.equal(compare.state.mode, "split-vertical");
    assert.notEqual(checksum(editor.source.image), oldSource);
    assert.equal(editor.history.canUndo, true);
    assert.equal(editor.summary().localOnly, true);
    editor.dispose();
  });
});
