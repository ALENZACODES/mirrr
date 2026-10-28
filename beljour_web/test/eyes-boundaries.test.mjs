// Runtime rejection, bounded diagnostics and technician map exports. Author: John Khan.
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRequest, renderEyes } from "../dist/js/engines/eyes/index.js";
import { parseTrace, validatePhoto, validatePoints } from "../dist/js/engines/eyes/contracts.js";
import { extensionMap } from "../dist/js/engines/eyes/lashes.js";
import { frames } from "../dist/js/engines/eyes/geometry.js";
import { lashMapCsv, lashMapSvg, mapDocument, validateMap } from "../dist/js/engines/eyes/maps.js";
import { photometricTraceEvidence, resampleTrace, traceSummary } from "../dist/js/engines/eyes/observations.js";
import { occlusionField } from "../dist/js/engines/eyes/visibility.js";
import { fixture } from "./eyes-fixtures.mjs";

for (const [field, value] of [
  ["amount", -1], ["amount", 1.01], ["amount", NaN], ["amount", true], ["amount", "0.5"],
  ["curl", Infinity], ["length", 0], ["length", .41], ["thickness", .051], ["angle", 91],
  ["transparency", -1], ["smudge", 2], ["seed", .5], ["seed", 2 ** 32], ["lower", 1],
  ["skin_depth", -1], ["glasses_clearance", 2], ["natural_density", NaN],
  ["colour", [0, 0]], ["colour", [0, 0, 256]], ["colour", [0, 0, .2]],
  ["secondary_colour", "red"], ["style", 3], ["style", "unknown"],
  ["anatomy", { right: "open" }], ["anatomy", { right: "unknown", left: "open" }],
  ["observed_lashes", new Array(257).fill({})],
]) {
  test(`eye request rejects invalid ${field}: ${JSON.stringify(value)}`, () => {
    assert.throws(() => parseRequest({ feature: "W59", [field]: value }), RangeError);
  });
}

test("unknown features, fields and malformed trace objects fail closed", () => {
  assert.throws(() => parseRequest({ feature: "W68" }), /unsupported/);
  assert.throws(() => parseRequest({ feature: "W59", send_photo: true }), /unknown/);
  assert.throws(() => parseRequest(null), /object/);
  assert.throws(() => parseTrace({ side: "right", points: [[.1, .1], [.1, .1]] }), /nonzero/);
  assert.throws(() => parseTrace({ side: "left", points: [[.1, .1], [.2, .2]], hidden: true }), /unknown/);
  assert.throws(() => parseTrace({ side: "up", points: [[.1, .1], [.2, .2]] }), /side/);
});

test("photo size, byte and landmark boundaries are checked at runtime", () => {
  const { image, mesh } = fixture();
  assert.throws(() => validatePhoto({ ...image, width: 3 }), /budget|pixels/);
  assert.throws(() => validatePhoto({ ...image, channels: 2 }), /RGB/);
  assert.throws(() => validatePhoto({ ...image, data: [1, 2, 3] }), /size/);
  const invalid = Array.from(image.data);
  invalid[10] = .1;
  assert.throws(() => validatePhoto({ ...image, data: invalid }), /bytes/);
  assert.throws(() => validatePoints(mesh.slice(0, 10)), /points/);
  const bad = structuredClone(mesh);
  bad[20][0] = NaN;
  assert.throws(() => validatePoints(bad), /finite/);
});

test("amount zero does not bypass style, dimension or geometric validation", () => {
  const { image, mesh } = fixture();
  assert.throws(() => renderEyes(image, mesh, { feature: "W64", amount: 0, style: "unknown" }), /unsupported style/);
  mesh[33] = [...mesh[133]];
  assert.throws(() => renderEyes(image, mesh, { feature: "W59", amount: 0 }), /degenerate/);
});

test("lash-map exports have relative units, one diagram per eye and no biometric geometry", () => {
  const { image, mesh } = fixture();
  const maps = frames(mesh, image.width, image.height).map(frame => extensionMap(frame, parseRequest({ feature: "W59", style: "hybrid" })));
  const document = mapDocument(maps), svg = lashMapSvg(maps), csv = lashMapCsv(maps);
  assert.equal(document.unit, "share_of_measured_eye_width");
  assert.equal(document.photo_included, false);
  assert.equal(document.face_coordinates_included, false);
  assert.ok(document.eyes.every(e => e.zones.every(z => !("length_px" in z))));
  assert.match(svg, /<svg/);
  assert.match(svg, /role="img"/);
  assert.match(svg, /John Khan/);
  assert.ok((svg.match(/<path /g) ?? []).length > 14);
  assert.equal(csv.trim().split("\n").length, 15);
  assert.ok(csv.trim().split("\n").slice(1).every(line => line.startsWith("yes,")));
});

test("map label XML is escaped and invalid map spans or fan counts are refused", () => {
  const { image, mesh } = fixture();
  const map = extensionMap(frames(mesh, image.width, image.height)[0], parseRequest({ feature: "W59" }));
  map.style = "<script>x</script>";
  assert.ok(lashMapSvg([map]).includes("&lt;script&gt;"));
  assert.ok(!lashMapSvg([map]).includes("<script>"));
  const bad = structuredClone(map);
  bad.zones[0].end = .9;
  assert.throws(() => validateMap(bad), /cover/);
  bad.zones[0].end = 1 / 7;
  bad.zones[0].fan_count = 1.5;
  assert.throws(() => validateMap(bad), /integer/);
  assert.throws(() => mapDocument([map, map]), /duplicate/);
});

test("trace evidence counts sides, lower line, confidence and duplicates independently", () => {
  const { image, mesh, traces } = fixture();
  const parsed = traces.map(parseTrace), summary = traceSummary([...parsed, { ...parsed[0], confidence: .2 }], image.width, image.height);
  assert.deepEqual(summary.observed, { right_upper: 5, right_lower: 3, left_upper: 5, left_lower: 3 });
  assert.equal(summary.duplicate_traces, 1);
  assert.equal(summary.low_confidence, 1);
  assert.equal(summary.automatic_lash_count, null);
  assert.throws(() => renderEyes(image, mesh, { feature: "W61", observed_lashes: [parsed[0], parsed[0]] }), /duplicate/);
});

test("trace resampling retains endpoints and catches zero-length evidence", () => {
  const path = [[0, 0], [3, 0], [3, 4]], sampled = resampleTrace(path, 8);
  assert.deepEqual(sampled[0], path[0]);
  assert.deepEqual(sampled.at(-1), path.at(-1));
  assert.equal(sampled.length, 8);
  for (let i = 1; i < sampled.length; i++) assert.ok(Math.hypot(sampled[i][0] - sampled[i - 1][0], sampled[i][1] - sampled[i - 1][1]) <= 1 + 1e-12);
  assert.throws(() => resampleTrace([[1, 1], [1, 1]]), /zero-length/);
});

test("low-contrast or grey trace diagnostics cannot delete observed hairs", () => {
  const photo = { width: 40, height: 40, channels: 3, data: new Uint8ClampedArray(40 * 40 * 3).fill(180) };
  const trace = parseTrace({ side: "right", points: [[.4, .3], [.4, .7]] });
  const flat = photometricTraceEvidence(photo, trace);
  assert.equal(flat.median_dark_line_contrast, 0);
  assert.equal(flat.trace_removed, false);
  for (let y = 12; y <= 28; y++) for (let c = 0; c < 3; c++) photo.data[(y * 40 + 16) * 3 + c] = 80;
  const dark = photometricTraceEvidence(photo, trace);
  assert.ok(dark.median_dark_line_contrast > 50);
  assert.equal(dark.classification, "diagnostic_only");
});

test("occlusion fields must match and remain bounded; malformed masks cannot disable validation", () => {
  const source = new Float64Array(30 * 20), copy = occlusionField(source, 30, 20);
  copy[0] = 1;
  assert.equal(source[0], 0);
  assert.throws(() => occlusionField([0], 30, 20), /match/);
  source[1] = NaN;
  assert.throws(() => occlusionField(source, 30, 20), /0..1/);
});

test("a fully covered eye is explicitly unavailable and preserves the original", () => {
  const { image, mesh, traces } = fixture();
  const occlusion = new Float64Array(image.width * image.height).fill(1);
  const result = renderEyes(image, mesh, { feature: "W61", observed_lashes: traces }, occlusion);
  assert.equal(result.report.status, "unavailable");
  assert.deepEqual(result.image, image.data);
  assert.ok(result.report.visibility.sides.every(side => !side.eligible));
  assert.ok(result.report.warnings.some(w => /occlusion mask/.test(w)));
});

test("partial occlusion reduces coverage and output contrast without inventing a realism score", () => {
  const { image, mesh } = fixture();
  const request = { feature: "W66", colour: [220, 160, 190] };
  const clear = renderEyes(image, mesh, request);
  const mask = new Float64Array(image.width * image.height).fill(.25);
  const partial = renderEyes(image, mesh, request, mask);
  assert.ok(partial.coverage.some((v, i) => v < clear.coverage[i]));
  assert.ok(partial.report.display_support.every(side => side.realism_score === null));
  assert.ok(partial.report.display_support[0].mean_rgb_change < clear.report.display_support[0].mean_rgb_change);
});
