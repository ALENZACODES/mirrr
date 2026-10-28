import assert from "node:assert/strict";
import test from "node:test";
import { defaultRecipe, makeCropGeometry, projectSource } from "../../../dist/js/pro/index.js";

function recordingContext(failure = false) {
  const calls = [];
  const context = {
    fillStyle: "",
    imageSmoothingEnabled: false,
    imageSmoothingQuality: "low",
    save() { calls.push("save"); },
    restore() { calls.push("restore"); },
    setTransform(...args) { calls.push(["transform", ...args]); },
    clearRect(...args) { calls.push(["clear", ...args]); },
    fillRect(...args) { calls.push(["fill", ...args]); },
    translate(...args) { calls.push(["translate", ...args]); },
    scale(...args) { calls.push(["scale", ...args]); },
    rotate(...args) { calls.push(["rotate", ...args]); },
    beginPath() { calls.push("begin"); },
    rect(...args) { calls.push(["rect", ...args]); },
    clip() { calls.push("clip"); },
    drawImage(...args) {
      calls.push(["draw", ...args]);
      if (failure) throw new Error("local input decode failed");
    },
  };
  return { context, calls };
}

test("projector: neutral output preserves size, resets and restores context", () => {
  const { context, calls } = recordingContext();
  const source = { image: { name: "synthetic" }, width: 400, height: 300 };
  const geometry = makeCropGeometry(400, 300, defaultRecipe().crop);
  projectSource(context, source, geometry, false);
  assert.equal(calls[0], "save");
  assert.equal(calls.at(-1), "restore");
  assert.ok(calls.some((row) => row[0] === "clear" && row[4] === 300));
  assert.ok(calls.some((row) => row[0] === "draw" && row[1] === source.image));
  assert.ok(calls.some((row) => row[0] === "rotate" && row[1] === 0));
  assert.equal(context.imageSmoothingQuality, "high");
});

test("projector: rotated crop translates the source and clips before painting", () => {
  const { context, calls } = recordingContext();
  const source = { image: {}, width: 100, height: 80 };
  const crop = { x: 0.25, y: 0.1, width: 0.6, height: 0.7, aspect: "square", rotation: 45 };
  const geometry = makeCropGeometry(source.width, source.height, crop);
  projectSource(context, source, geometry, true);
  const fill = calls.find((row) => row[0] === "fill");
  assert.deepEqual(fill.slice(1), [0, 0, geometry.width, geometry.height]);
  assert.ok(calls.some((row) => row[0] === "rotate" && row[1] === Math.PI / 4));
  assert.ok(calls.some((row) => row[0] === "rect" && row[3] === geometry.rect.width));
  assert.ok(calls.findIndex((row) => row === "clip") < calls.findIndex((row) => row[0] === "draw"));
  assert.equal(calls.at(-1), "restore");
});

test("projector: context is restored when input drawing fails", () => {
  const { context, calls } = recordingContext(true);
  const source = { image: {}, width: 120, height: 90 };
  const geometry = makeCropGeometry(120, 90, defaultRecipe().crop);
  assert.throws(() => projectSource(context, source, geometry, true), /decode failed/);
  assert.equal(calls.at(-1), "restore");
});
