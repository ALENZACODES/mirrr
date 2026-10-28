// Bad Day Rescue with its under-eye step (#28) in the editor: the "under-eye" shell layer runs
// the existing engine through the real compositor, Rescue adds both steps on a photo with face
// points and skips the under-eye step (with a reason) on one without, and a face without a
// dark circle is left unchanged. Drawn scenes come live from api/tests/skin_touch_up_vectors.py
// (nothing written to disk); no photograph. Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Editor } from "../dist/js/ui/shell/controller.js";
import { layer } from "../dist/js/ui/shell/layers.js";
import { renderLayers, copyRGB } from "../dist/js/ui/shell/pipeline.js";
import { optionsFor, defaultParams } from "../dist/js/ui/shell/thumbnails.js";
import { readiness, tool } from "../dist/js/ui/shell/catalogue.js";
import { brightenUnderEyes } from "../dist/js/engines/skin/under-eye.js";
import { applySteps } from "../dist/js/layout/editor-chrome.js";
import { rescueSteps, RESCUE_NOT_BUILT } from "../dist/js/layout/rescue.js";
import { effect } from "../dist/js/layout/effects.js";
import { validateLook, LOOK_FORMAT, describe } from "../dist/js/layout/my-looks.js";
import { registryProblems } from "../dist/js/save/capabilities.js";
import { validateLayer } from "../dist/js/demo/schema.js";
import { srgbToLab } from "../dist/js/engines/shade/colourspace.js";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const V = JSON.parse(execFileSync(process.env.PYTHON || "python3", ["api/tests/skin_touch_up_vectors.py"], {
  cwd: repo, env: { ...process.env, PYTHONPATH: resolve(repo, "api") }, encoding: "utf8", maxBuffer: 64 << 20 }));
const bytes = (b64) => new Uint8Array(Buffer.from(b64, "base64"));
const shaded = V.cases.find((c) => c.kind === "under_eye" && c.status === "edited");
const plain = V.cases.find((c) => c.kind === "under_eye" && c.reason_code === "no_dark_circle");
const source = (c) => ({ id: "drawn-scene", kind: "uploaded", label: "Drawn scene", disposable: true,
  image: { width: c.width, height: c.height, channels: c.channels, data: bytes(c.image) }, face: c.points });
const underEye = (strength = 30, params = {}) => ({ ...layer("under-eye-1", "under-eye", "Under-eye", "photo", params), strength });

test("the under-eye layer is the engine's own result, on the face points of the photo", () => {
  const src = source(shaded);
  const preview = renderLayers(src, [underEye(60)]);
  const direct = brightenUnderEyes(copyRGB(src.image), src.face, { strength: 60, includeBags: true });
  assert.equal(direct.status, "edited");
  let max = 0, changed = 0;
  for (let i = 0; i < preview.image.data.length; i++) {
    max = Math.max(max, Math.abs(preview.image.data[i] - direct.image.data[i]));
    if (preview.image.data[i] !== src.image.data[(Math.floor(i / 3) * src.image.channels) + (i % 3)]) changed++;
  }
  assert.ok(max <= 1, `compositor differs from the engine by ${max}`);
  assert.ok(changed > 50);
  assert.equal(preview.metrics[0].status, "edited");
  assert.match(preview.labels[0], /own cheek/);
  const narrow = renderLayers(src, [underEye(60, { include_bags: false })]);
  assert.equal(narrow.metrics[0].include_bags, false);
});

test("with no dark circle the layer leaves the photo unchanged and says why", () => {
  const src = source(plain);
  const preview = renderLayers(src, [underEye(100)]);
  const rgb = copyRGB(src.image);
  assert.deepEqual(preview.image.data, rgb.data);
  assert.equal(preview.metrics[0].reason_code, "no_dark_circle");
  assert.match(preview.labels[0], /already matches the cheek/);
});

test("the under-eye layer never lifts the crescent past the cheek's lightness", () => {
  const src = source(shaded);
  const out = renderLayers(src, [underEye(100)]).image;
  const ch = src.image.channels;
  let rose = 0, maxRise = 0;
  for (let i = 0; i < src.image.width * src.image.height; i++) {
    const before = srgbToLab([src.image.data[i * ch], src.image.data[i * ch + 1], src.image.data[i * ch + 2]])[0];
    const after = srgbToLab([out.data[i * 3], out.data[i * 3 + 1], out.data[i * 3 + 2]])[0];
    if (after > before + 1e-9) { rose++; maxRise = Math.max(maxRise, after - before); }
  }
  assert.ok(rose > 0, "the drawn dark circle is brightened");
  assert.ok(maxRise <= 15 + 1e-6, `largest lift ${maxRise} exceeds the engine cap`);
});

test("Rescue adds the enhance and under-eye steps where there are face points, and skips with a reason where not", () => {
  const editor = new Editor("portrait");
  const res = applySteps(editor, rescueSteps());
  assert.equal(res.added, 2, res.skipped.join("; "));
  assert.deepEqual(editor.document.layers.map((l) => [l.kind, l.strength]), [["enhance", 30], ["under-eye", 30]]);
  const preview = editor.preview();
  assert.equal(preview.effective, 2);
  const noFace = new Editor("low-light");
  const partial = applySteps(noFace, rescueSteps());
  assert.equal(partial.added, 1);
  assert.match(partial.skipped[0], /^under-eye: /);
  assert.deepEqual([...RESCUE_NOT_BUILT], ["dull skin glow", "flyaway hair"]);
});

test("the under-eye studio is registered everywhere a local tool must be", () => {
  assert.deepEqual(registryProblems(), []);
  assert.equal(tool("under-eye").source, "local");
  assert.equal(readiness("under-eye", source(shaded)).ready, true);
  assert.equal(readiness("under-eye", { ...source(shaded), face: undefined }).ready, false);
  const fx = effect("dark-circles");
  assert.equal(fx.built, true);
  assert.equal(fx.studio, "under-eye");
  assert.equal(fx.optIn, false);
  assert.deepEqual(defaultParams("under-eye", source(shaded)), { include_bags: true });
  assert.deepEqual(optionsFor("under-eye", source(shaded)).map((o) => o.params.include_bags), [true, false]);
  const look = validateLook({ format: LOOK_FORMAT, id: "look-0000abcd", name: "Morning", created: new Date(0).toISOString(),
    steps: [{ kind: "under-eye", strength: 30, params: { include_bags: false } }] });
  assert.equal(describe(look), "Under-eye 30");
  assert.ok(validateLayer({ kind: "under-eye", params: { include_bags: false }, strength: 30 }, "portrait", 0));
  assert.throws(() => validateLayer({ kind: "under-eye", params: { include_bags: "yes" } }, "portrait", 0));
  assert.throws(() => validateLayer({ kind: "under-eye", params: {} }, "low-light", 0));
});
