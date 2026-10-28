/** The complete local studio boundary, controls and lifecycle. Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { FEATURES, featureById, unavailableReasons } from "../dist/js/ui/eyes-brows/catalogue.js";
import { CONTROLS, initialControls, checkedControl } from "../dist/js/ui/eyes-brows/controls.js";
import { PreviewSession } from "../dist/js/ui/eyes-brows/session.js";
import { PreviewCancelled, PreviewClient } from "../dist/js/ui/eyes-brows/client.js";
import { Observations, paintDisc, paintSegment, canvasPoint } from "../dist/js/ui/eyes-brows/observations.js";
import { parseEvidence, pixelFingerprint, validateTrace, validateLandmarks, validateImage } from "../dist/js/ui/eyes-brows/input.js";
import { renderJob, validateJob } from "../dist/js/ui/eyes-brows/render.js";
import { wrappedLines } from "../dist/js/ui/eyes-brows/files.js";
import { tableData } from "../dist/js/ui/eyes-brows/present.js";
import { fixture as eyeFixture } from "./eyes-fixtures.mjs";

function fixture() {
  const drawn = eyeFixture();
  const { width, height, channels, data } = drawn.image;
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba.set(data.slice(i * channels, i * channels + 3), i * 4);
    rgba[i * 4 + 3] = channels === 4 ? data[i * 4 + 3] : 255;
  }
  return { ...drawn, image: { width, height, channels: 4, data: rgba } };
}

function sessionFor(id = "W59") {
  const source = fixture(), session = new PreviewSession();
  session.load(source.image, true); session.setMesh(source.mesh); session.select(id);
  session.observations.setTraces(source.traces); session.observations.declareNoHair();
  if (featureById(id).requiresAdult) session.confirmAdult(true);
  for (const [key, value] of Object.entries(initialControls(id))) session.setControl(key, value);
  return { source, session };
}

function response(job, changes = {}) {
  return { pixels: job.image.data.slice(), label: "Local simulation.", warnings: [], metrics: {}, elapsedMs: 2, ...changes };
}

function evidence(source, sha) {
  return { format: "beljour-eyes-brows-input/1", width: source.image.width, height: source.image.height,
    pixel_sha256: sha, landmarks: source.mesh, observed_lashes: source.traces,
    hair_mask: Array(source.image.width * source.image.height).fill(0), anatomy: { right: "open", left: "hooded" } };
}

class FakeWorker {
  onmessage = null;
  onerror = null;
  terminated = 0;
  sent = [];
  postMessage(job, transfer) { this.sent.push({ job, transfer }); }
  terminate() { this.terminated++; }
  deliver(data) { this.onmessage?.({ data }); }
}

test("catalogue covers exactly 17 W features, the combined eye makeup look and four original filters", () => {
  assert.equal(FEATURES.length, 22);
  assert.equal(new Set(FEATURES.map(item => item.id)).size, 22);
  assert.equal(FEATURES.filter(item => item.id.startsWith("W")).length, 17);
  assert.equal(FEATURES.some(item => item.id === "W68"), false);
  assert.throws(() => featureById("unknown"));
  for (const item of FEATURES) assert.ok(item.summary.length > 30 && item.limitation.length > 30);
});

test("empty studio disables requested evidence-dependent operations", () => {
  for (const feature of FEATURES) {
    const reasons = unavailableReasons(feature.id, { photo: false, mesh: false, hair: false, traces: 0, adultConfirmed: false });
    assert.ok(reasons.some(reason => /photo/.test(reason)));
    if (feature.requiresHair) assert.ok(reasons.some(reason => /hair/.test(reason)));
    if (feature.requiresTraces) assert.ok(reasons.some(reason => /lash/.test(reason)));
    if (feature.requiresAdult) assert.ok(reasons.some(reason => /18\+/.test(reason)));
  }
});

for (const feature of FEATURES) {
  test(`${feature.id}: studio boundary reaches its engine with zero identity`, () => {
    const { source, session } = sessionFor(feature.id);
    session.setAmount(0);
    const job = session.job();
    validateJob(job);
    const result = renderJob(job);
    assert.deepEqual(result.pixels, source.image.data);
    assert.match(result.label, /simulation/i);
    assert.equal(session.complete(job.id, result), true);
    assert.deepEqual(session.image.data, source.image.data);
  });
}

test("local job input is owned; editing or transferring it cannot mutate the original", () => {
  const { source, session } = sessionFor();
  const job = session.job();
  job.image.data[0] ^= 255; job.landmarks[0][0] = 0;
  assert.deepEqual(session.image.data, source.image.data);
  assert.deepEqual(session.landmarks, source.mesh);
  const copy = session.image; copy.data.fill(0);
  assert.notDeepEqual(session.image.data, copy.data);
});

test("stale completion from an old feature, amount or photo cannot display", () => {
  const { source, session } = sessionFor();
  const old = session.job(); session.setAmount(.2);
  assert.equal(session.complete(old.id, response(old)), false);
  const later = session.job(); session.select("W60");
  assert.equal(session.complete(later.id, response(later)), false);
  const last = session.job(); session.load(source.image);
  assert.equal(session.complete(last.id, response(last)), false);
  assert.equal(session.hasMesh, false);
  assert.equal(session.observations.count, 0);
});

test("adult confirmation cannot survive replacing or deleting the photo", () => {
  const { source, session } = sessionFor("W71");
  assert.equal(session.adultConfirmed, true);
  session.load(source.image); assert.equal(session.adultConfirmed, false);
  session.confirmAdult(true); session.clear(); assert.equal(session.adultConfirmed, false);
  assert.throws(() => session.confirmAdult("true"));
});

test("a preview needs a simulation label and exact source alpha", () => {
  const { session } = sessionFor();
  let job = session.job();
  assert.throws(() => session.complete(job.id, response(job, { label: "Real result" })), /label/);
  job = session.job();
  const result = response(job); result.pixels[3] ^= 255;
  assert.throws(() => session.complete(job.id, result), /transparency/);
  assert.equal(session.result, null);
});

test("stored results and metrics are not caller-mutable", () => {
  const { session } = sessionFor();
  const job = session.job(), result = response(job, { metrics: { a: [1, 2] } });
  session.complete(job.id, result); result.pixels.fill(0); result.metrics.a[0] = 99;
  const first = session.result; first.pixels.fill(0); first.metrics.a[0] = 77;
  assert.deepEqual(session.result.metrics, { a: [1, 2] });
  assert.notDeepEqual(session.result.pixels, first.pixels);
});

test("each active numeric control has a validated finite default", () => {
  for (const [id, values] of Object.entries(CONTROLS)) {
    for (const item of values) {
      assert.equal(checkedControl(id, item.key, item.initial), item.initial);
      assert.throws(() => checkedControl(id, item.key, NaN));
      assert.throws(() => checkedControl(id, item.key, item.max + 1));
    }
  }
  assert.throws(() => checkedControl("W59", "not_a_control", .5));
  assert.throws(() => checkedControl("pigment-oil", "radius", 2.5));
});

test("untrusted worker jobs cannot import consent or unbounded controls", () => {
  const { session } = sessionFor("W71");
  const job = session.job();
  assert.throws(() => validateJob({ ...job, adultConfirmed: false }));
  assert.throws(() => validateJob({ ...job, controls: { url: "https://example.invalid" } }));
  assert.throws(() => validateJob({ ...job, controls: { density: Infinity } }));
  assert.throws(() => validateJob({ ...job, amount: -1 }));
  assert.throws(() => validateJob({ ...job, hairMask: new Float64Array([1]) }));
});

test("cancelling a paint stroke restores the exact previous mask", () => {
  const observations = new Observations(60, 80);
  observations.begin("hair", [.25, .2], 8); observations.move([.6, .25], 8);
  assert.ok(observations.mask.some(value => value > 0));
  observations.cancel();
  assert.equal(observations.mask.some(value => value > 0), false);
  assert.equal(observations.hairDeclared, false);
});

test("completed and erased hair strokes remain finite and bounded", () => {
  const observations = new Observations(60, 80);
  observations.begin("hair", [.25, .2], 8); observations.move([.6, .25], 8); observations.end();
  const sum = observations.mask.reduce((a, b) => a + b, 0);
  assert.equal(observations.hairDeclared, true);
  observations.begin("erase", [.25, .2], 8); observations.move([.6, .25], 8); observations.end();
  assert.ok(observations.mask.reduce((a, b) => a + b, 0) < sum);
  assert.ok(observations.mask.every(value => value >= 0 && value <= 1));
  observations.clearHair(); assert.equal(observations.hairDeclared, false);
  observations.declareNoHair(); assert.equal(observations.hairDeclared, true);
  assert.equal(observations.mask.some(Boolean), false);
});

test("manual strokes produce only the observations actually drawn", () => {
  const observations = new Observations(100, 100);
  observations.begin("right-upper", [.3, .4], 5);
  assert.equal(observations.end(), false);
  assert.equal(observations.count, 0);
  observations.begin("right-upper", [.3, .4], 5); observations.move([.31, .37], 5); observations.end();
  assert.equal(observations.count, 1);
  assert.equal(observations.traces[0].lower, false);
  observations.begin("left-lower", [.6, .4], 5); observations.move([.61, .42], 5); observations.cancel();
  assert.equal(observations.count, 1);
  observations.removeLastTrace(); assert.equal(observations.count, 0);
});

test("manual masks and traces are copied and malformed traces fail", () => {
  const { traces } = fixture();
  const observations = new Observations(20, 20);
  const mask = new Float64Array(400); mask[1] = .5; observations.setHair(mask); mask[1] = 1;
  assert.equal(observations.mask[1], .5);
  observations.setTraces(traces); traces[0].points[0][0] = 0;
  assert.notEqual(observations.traces[0].points[0][0], 0);
  assert.throws(() => observations.setHair(new Float64Array(399)));
  assert.throws(() => validateTrace({ side: "right", lower: false, confidence: 1, points: [[0, 0], [1, 1]] }));
  assert.throws(() => validateTrace({ side: "right", lower: false, confidence: 1, points: [[.2, .2], [.2, .2]] }));
});

test("pointer mapping handles layout scale and edge clamping", () => {
  assert.deepEqual(canvasPoint(150, 90, { left: 50, top: 40, width: 200, height: 100 }), [.5, .5]);
  assert.deepEqual(canvasPoint(-50, 250, { left: 0, top: 0, width: 100, height: 100 }), [0, 1]);
  assert.throws(() => canvasPoint(1, 1, { left: 0, top: 0, width: 0, height: 5 }));
});

test("brush interpolation makes a continuous stroke with no overflow", () => {
  const mask = new Float64Array(50 * 30);
  paintSegment(mask, 50, 30, [.1, .5], [.9, .5], 2);
  for (let x = 5; x < 45; x++) assert.ok(mask[15 * 50 + x] > 0);
  assert.equal(mask[0], 0);
  assert.throws(() => paintDisc(mask, 50, 30, [.5, .5], NaN));
  assert.throws(() => paintSegment(mask, 50, 30, [2, .5], [.5, .5], 2));
});

test("imported observations must match exact preview pixels and never set adult consent", async () => {
  const source = fixture(), sha = await pixelFingerprint(source.image);
  const data = evidence(source, sha);
  const parsed = parseEvidence(JSON.stringify(data), source.image, sha);
  assert.equal(parsed.landmarks.length, 478);
  assert.equal(parsed.observed_lashes.length, source.traces.length);
  assert.throws(() => parseEvidence(JSON.stringify({ ...data, pixel_sha256: "0".repeat(64) }), source.image, sha));
  assert.throws(() => parseEvidence(JSON.stringify({ ...data, adultConfirmed: true }), source.image, sha));
  assert.throws(() => parseEvidence(JSON.stringify({ ...data, height: 1 }), source.image, sha));
  assert.throws(() => parseEvidence(JSON.stringify({ ...data, hair_mask: [1] }), source.image, sha));
});

test("pixel fingerprints bind dimensions, alpha and every channel", async () => {
  const { image } = fixture(), original = await pixelFingerprint(image);
  const altered = { ...image, data: image.data.slice() }; altered.data[3] ^= 255;
  assert.notEqual(original, await pixelFingerprint(altered));
  assert.equal(original, await pixelFingerprint({ ...image, data: image.data.slice() }));
  assert.match(original, /^[a-f0-9]{64}$/);
});

test("landmark and image inputs reject collapsed geometry and nonfinite data", () => {
  const { mesh, image } = fixture();
  assert.equal(validateLandmarks(mesh).length, 478);
  const bad = structuredClone(mesh); bad[33] = bad[133];
  assert.throws(() => validateLandmarks(bad));
  assert.throws(() => validateLandmarks(Array(478).fill([NaN, 0])));
  assert.throws(() => validateImage({ ...image, channels: 3 }));
  assert.throws(() => validateImage({ ...image, width: 641 }));
  assert.throws(() => validateImage({ ...image, data: new Uint8ClampedArray(10) }));
});

test("worker replacement rejects old work and only accepts the new job", async () => {
  const created = [], client = new PreviewClient(() => { const worker = new FakeWorker(); created.push(worker); return worker; });
  const { session } = sessionFor();
  const first = session.job(), a = client.run(first); const rejection = assert.rejects(a, PreviewCancelled);
  const oldHandler = created[0].onmessage;
  const second = session.job(), b = client.run(second);
  oldHandler({ data: { id: first.id, ok: true, result: response(first) } });
  assert.equal(client.running, true);
  created[1].deliver({ id: second.id, ok: true, result: response(second) });
  assert.deepEqual((await b).pixels, second.image.data); await rejection;
  assert.equal(created[0].terminated, 1); assert.equal(created[1].terminated, 1);
  client.dispose(); assert.equal(client.running, false);
});

test("worker errors and timeouts preserve bounded ownership", async () => {
  const created = [], client = new PreviewClient(() => { const worker = new FakeWorker(); created.push(worker); return worker; }, 5);
  const { session } = sessionFor();
  const pending = client.run(session.job());
  await assert.rejects(pending, /time limit/);
  assert.equal(created[0].terminated, 1);
  const failure = client.run(session.job());
  created[1].onerror({}); await assert.rejects(failure, /original photo is safe/);
  client.dispose(); await assert.rejects(client.run(session.job()), /closed/);
});

test("unknown reply IDs cannot resolve a pending preview", async () => {
  const fake = new FakeWorker(), client = new PreviewClient(() => fake);
  const { session } = sessionFor();
  const job = session.job(), pending = client.run(job);
  fake.deliver({ id: job.id + 20, ok: true, result: response(job) });
  assert.equal(client.running, true);
  fake.deliver({ id: job.id, ok: false, message: "missing observation" });
  await assert.rejects(pending, /missing observation/);
  assert.equal(client.running, false); client.dispose();
});

test("export label wrapping keeps every word and readable bounded rows", () => {
  const text = "Simulation. Drawn fixture only. Author John Khan.";
  const lines = wrappedLines(text, 20, text => text.length);
  assert.equal(lines.join(" "), text);
  assert.ok(lines.every(line => line.length <= 20));
  assert.throws(() => wrappedLines(text, 0, text => text.length));
});

test("rendered tables show scalar results without exposing raw coordinate arrays", () => {
  const data = tableData([{ month: 0, hypothetical: true, point: [1, 2] }, { month: 1, hypothetical: true, point: [2, 3] }]);
  assert.deepEqual(data.columns, ["month", "hypothetical"]);
  assert.deepEqual(data.rows[1], ["1", "yes"]);
  assert.equal(tableData(Array(100).fill({ a: 1 })), null);
  assert.equal(tableData([1, 2, 3]), null);
});

test("new studio files preserve local processing labels and additive build wiring", () => {
  const html = readFileSync(new URL("../eyes-brows.html", import.meta.url), "utf8");
  const entry = readFileSync(new URL("../src/ui/eyes-brows/entry.ts", import.meta.url), "utf8");
  const worker = readFileSync(new URL("../src/ui/eyes-brows/worker.ts", import.meta.url), "utf8");
  const copy = readFileSync(new URL("../scripts/copy-static.mjs", import.meta.url), "utf8");
  assert.match(html, /Author: John Khan/); assert.match(html, /Real-face and expert quality review remain unverified/);
  assert.match(entry, /adultLabel.hidden/); assert.match(entry, /checked local geometry/i);
  assert.match(copy, /eyes-brows\.html/); assert.match(copy, /eyes-brows\.css/);
  assert.doesNotMatch(worker, /fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|indexedDB/);
});
