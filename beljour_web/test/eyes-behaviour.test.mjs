// Independent browser invariants and feature promises. Author: John Khan.
import assert from "node:assert/strict";
import { test } from "node:test";
import { FEATURES, parseRequest, renderEyes } from "../dist/js/engines/eyes/index.js";
import { eyeProtection, frames, interpolate, lidHeight, nativePlacement, visibleCanvas } from "../dist/js/engines/eyes/geometry.js";
import { extensionMap, extensionStrokes, liftedPath, mascaraPath, observedPaths, styleProfile } from "../dist/js/engines/eyes/lashes.js";
import { polylineLength } from "../dist/js/engines/eyes/contracts.js";
import { filled } from "../dist/js/engines/eyes/raster.js";
import { graphicMask, colourRecommendations, wingGeometry } from "../dist/js/engines/eyes/liner.js";
import { flipColour, pigmentPayoff } from "../dist/js/engines/eyes/shadow.js";
import { fixture, defaultStyles } from "./eyes-fixtures.mjs";

for (const feature of FEATURES) {
  test(`${feature}: exact neutral, fresh buffers and immutable points`, () => {
    const { image, mesh, traces } = fixture(1), source = image.data.slice(), points = structuredClone(mesh);
    const result = renderEyes(image, mesh, { feature, amount: 0, observed_lashes: traces });
    assert.deepEqual(result.image, source);
    assert.notEqual(result.image, image.data);
    assert.deepEqual(image.data, source);
    assert.deepEqual(mesh, points);
    assert.ok(result.coverage.every(v => v === 0));
    assert.equal(result.report.status, "identity");
  });
  test(`${feature}: protected eyeball, alpha, original geometry and bounded local coverage`, () => {
    const { image, mesh, traces } = fixture(1);
    const protection = eyeProtection(image.height, image.width, frames(mesh, image.width, image.height));
    const result = renderEyes(image, mesh, { feature, style: defaultStyles[feature], observed_lashes: traces, anatomy: { right: "hooded", left: "monolid" } });
    assert.ok(result.report.changed_pixels > 0);
    assert.equal(result.report.real_face_quality, "Not tested");
    assert.match(result.report.label, /simulation/);
    assert.equal(result.report.geometry_changed, false);
    assert.equal(result.report.eye_colour_changed, false);
    for (let i = 0; i < protection.length; i++) {
      assert.ok(Number.isFinite(result.coverage[i]) && result.coverage[i] >= 0 && result.coverage[i] <= 1);
      const offset = i * image.channels;
      assert.equal(result.image[offset + 3], image.data[offset + 3]);
      if (protection[i] > 0 || result.coverage[i] === 0) {
        assert.deepEqual(Array.from(result.image.slice(offset, offset + 4)), Array.from(image.data.slice(offset, offset + 4)));
      }
    }
  });
}

test("W59 maps every extension root onto this person's upper lash line", () => {
  const { image, mesh } = fixture(2);
  for (const frame of frames(mesh, image.width, image.height)) {
    const { paths, report } = extensionStrokes(frame, parseRequest({ feature: "W59", style: "volume" }));
    assert.equal(paths.length, 84);
    assert.equal(report.physical_mm, null);
    assert.equal(report.zones.length, 7);
    for (const path of paths) {
      const [u, v] = frame.local(...path[0]);
      assert.ok(Math.abs(v - interpolate(frame.upper, u) - .008) < 1e-10);
    }
  }
});

test("W59 flags sparse volume and unknown density without claiming suitability", () => {
  const { image, mesh } = fixture();
  const sparse = renderEyes(image, mesh, { feature: "W59", style: "mega", natural_density: .1 });
  assert.ok(sparse.report.warnings.some(w => /Unrealistic/.test(w)));
  const unknown = renderEyes(image, mesh, { feature: "W59" });
  assert.ok(unknown.report.warnings.some(w => /unknown/.test(w)));
});

test("W60 has genuinely different cat, central, wispy and shortened-tail length maps", () => {
  assert.ok(styleProfile("cat", .9) > styleProfile("cat", .1));
  assert.ok(styleProfile("doll", .5) > styleProfile("doll", .9));
  assert.ok(styleProfile("kitten", .73) > styleProfile("kitten", 1));
  const { image, mesh } = fixture();
  const frame = frames(mesh, image.width, image.height)[0];
  const patterns = ["cat", "doll", "wispy", "kitten", "fox"].map(style => extensionMap(frame, parseRequest({ feature: "W60", style })).zones.map(z => z.length_eye_width));
  assert.equal(new Set(patterns.map(v => JSON.stringify(v))).size, 5);
});

for (const curl of [0, .35, .7, 1]) {
  test(`W61 curl ${curl} retains root, count and observed arc length`, () => {
    const { image, mesh, traces } = fixture();
    const request = parseRequest({ feature: "W61", observed_lashes: traces, curl, lower: true });
    for (const frame of frames(mesh, image.width, image.height)) {
      for (const { trace, path } of observedPaths(frame, request, image.width, image.height)) {
        const lifted = liftedPath(frame, path, curl, trace.lower);
        assert.deepEqual(lifted[0], path[0]);
        assert.ok(Math.abs(polylineLength(lifted) - polylineLength(path)) < 1e-10);
      }
    }
    const result = renderEyes(image, mesh, request);
    assert.equal(result.report.observed_count, result.report.rendered_count);
    assert.equal(result.report.observed_count, 16);
    assert.equal(result.report.invented_natural_lashes, 0);
  });
}

for (const feature of ["W61", "W63"]) {
  test(`${feature} does not synthesize natural lashes when observations are missing`, () => {
    const { image, mesh } = fixture();
    const result = renderEyes(image, mesh, { feature });
    assert.equal(result.report.status, "unavailable");
    assert.deepEqual(result.image, image.data);
    assert.match(result.report.reason, /Trace your visible lashes/);
  });
}

test("W62 generic clusters are fitted to measured eye width and warn about glasses", () => {
  const { image, mesh } = fixture(2);
  const result = renderEyes(image, mesh, { feature: "W62", style: "cluster", glasses_clearance: .03 });
  assert.ok(result.report.warnings.some(w => /glasses collision/.test(w)));
  for (const map of result.report.maps) {
    assert.equal(map.groups, 7);
    assert.ok(map.eye_width_px > 0);
    assert.match(map.product, /no product availability/);
  }
});

for (const style of ["lengthening", "volumising", "tubing"]) {
  test(`W63 ${style} keeps sparse observations sparse and lower lashes opt-in`, () => {
    const { image, mesh, traces } = fixture();
    const sparse = renderEyes(image, mesh, { feature: "W63", style, observed_lashes: traces.slice(0, 2), smudge: .7 });
    assert.equal(sparse.report.observed_count, 2);
    assert.equal(sparse.report.rendered_count, 2);
    const lower = renderEyes(image, mesh, { feature: "W63", style, observed_lashes: traces, lower: true });
    assert.equal(lower.report.rendered_count, 16);
  });
}

test("W63 lengthening extends at most 12 percent while tubing keeps observed length", () => {
  const path = [[10, 10], [11, 12], [12, 14]];
  const actual = polylineLength(mascaraPath(path, "lengthening", 1));
  assert.ok(Math.abs(actual - polylineLength(path) * 1.12) < 1e-10);
  assert.deepEqual(mascaraPath(path, "tubing", 1), path);
});

test("W64 solves native hooded batwing and deep-set connectors independently", () => {
  const { image, mesh } = fixture();
  const frame = frames(mesh, image.width, image.height)[0];
  const open = wingGeometry(frame, "open", .2, .012);
  const hood = wingGeometry(frame, "hooded", .2, .012);
  const mono = wingGeometry(frame, "monolid", .2, .012);
  assert.equal(open.polygon.length, 3);
  assert.equal(hood.polygon.length, 6);
  assert.notDeepEqual(hood.polygon, mono.polygon);
  assert.equal(hood.fold_estimate, true);
});

for (const anatomy of ["open", "hooded", "monolid", "deep_set"]) {
  test(`W65 graphic shapes stay inside the ${anatomy} mobile lid canvas`, () => {
    const { image, mesh } = fixture(2);
    const frame = frames(mesh, image.width, image.height)[0];
    const canvas = filled(image.height, image.width, visibleCanvas(frame, anatomy));
    for (const style of ["floating", "double_wing", "smoked_pencil", "gel", "shadow"]) {
      const { mask } = graphicMask(image.height, image.width, frame, parseRequest({ feature: "W65", style, anatomy: { right: anatomy, left: anatomy }, blend: .85 }));
      for (let i = 0; i < mask.length; i++) if (canvas[i] === 0) assert.equal(mask[i], 0);
      assert.ok(mask.some(v => v > 0));
    }
  });
}

test("W66 deep-lid pastel payoff increases with a disclosed transparency limit", () => {
  const pale = pigmentPayoff(.1, [240, 210, 225], .4), deep = pigmentPayoff(.9, [240, 210, 225], .4);
  assert.ok(deep.opacity > pale.opacity && deep.opacity <= .95);
  assert.ok(pigmentPayoff(.9, [240, 210, 225], .9).warnings.length);
});

test("W67 uses a smooth angle-dependent flip and preserves the footprint", () => {
  const { image, mesh } = fixture();
  const request = { feature: "W67", style: "duochrome", colour: [150, 48, 133], secondary_colour: [45, 165, 110], transparency: .2 };
  const before = renderEyes(image, mesh, { ...request, angle: -75 });
  const after = renderEyes(image, mesh, { ...request, angle: 75 });
  assert.deepEqual(before.coverage, after.coverage);
  assert.notDeepEqual(before.image, after.image);
  assert.deepEqual(flipColour([150, 50, 100], [50, 160, 110], -90, "duochrome"), [150, 50, 100]);
  assert.deepEqual(flipColour([150, 50, 100], [50, 160, 110], 90, "duochrome"), [50, 160, 110]);
  assert.ok(after.report.sides.every(side => side.glitter_particles === 0));
});

test("W75 never calls an anatomy selection a correction or expert-validated result", () => {
  const { image, mesh } = fixture();
  const result = renderEyes(image, mesh, { feature: "W75", anatomy: { right: "hooded", left: "monolid" } });
  assert.match(result.report.artist_validation, /Not tested/);
  assert.equal(result.report.sides[0].style, "batwing");
  assert.equal(result.report.sides[1].style, "soft_wing");
  const frame = frames(mesh, image.width, image.height)[0];
  assert.ok(lidHeight(frame, "hooded", .5) < lidHeight(frame, "monolid", .5));
  assert.match(nativePlacement(frame, "monolid").why, /no crease/);
});

test("W76 gives brown eyes all three colours and discloses missing mascara evidence", () => {
  const options = colourRecommendations([91, 65, 43]);
  assert.deepEqual(options.map(o => o.name), ["navy", "burgundy", "forest"]);
  assert.ok(options.every(o => /brown eyes/.test(o.why)));
  const { image, mesh } = fixture();
  const result = renderEyes(image, mesh, { feature: "W76", style: "forest" });
  assert.ok(result.report.changed_pixels > 0);
  assert.equal(result.report.mascara.status, "unavailable");
  assert.ok(result.report.warnings.some(w => /Trace your visible lashes/.test(w)));
});

test("extension fit measurements expose actual anchor error and retain the image-plane limitation", async () => {
  const { fitMetrics } = await import("../dist/js/engines/eyes/lashes.js");
  const { image, mesh } = fixture(2), frame = frames(mesh, image.width, image.height)[0];
  const { paths } = extensionStrokes(frame, parseRequest({ feature: "W59", length: .2 }));
  const fit = fitMetrics(frame, paths);
  assert.equal(fit.strokes, paths.length);
  assert.ok(fit.root_error_px_max < 1e-10);
  assert.equal(fit.projection_kind, "image_plane");
  assert.equal(fit.physical_fit_verified, false);
  assert.ok(fit.maximum_arc_length_eye_width > .1);
  const result = renderEyes(image, mesh, { feature: "W59", length: .2 });
  assert.equal(result.report.maps[0].fit.strokes, paths.length);
});

test("an excessive simulated lash tail reports both brow overlap and outer overhang", async () => {
  const { fitMetrics } = await import("../dist/js/engines/eyes/lashes.js");
  const { image, mesh } = fixture(), frame = frames(mesh, image.width, image.height)[0];
  const root = frame.point(.9, interpolate(frame.upper, .9) + .008);
  const path = [root, frame.point(1.3, frame.brow_space + .2)];
  const fit = fitMetrics(frame, [path]);
  assert.ok(Math.abs(fit.brow_clearance_eye_width + .2) < 1e-10);
  assert.ok(Math.abs(fit.outer_overhang_eye_width - .3) < 1e-10);
  assert.equal(fit.warnings.length, 2);
  assert.equal(fitMetrics(frame, []).root_error_px_max, null);
});

test("fit inspection rejects invalid paths and never changes measured anchor coordinates", async () => {
  const { fitMetrics } = await import("../dist/js/engines/eyes/lashes.js");
  const { image, mesh } = fixture(), frame = frames(mesh, image.width, image.height)[0];
  assert.throws(() => fitMetrics(frame, [[[1, 1]]]), /complete/);
  assert.throws(() => fitMetrics(frame, [[[1, 1], [NaN, 2]]]), /finite/);
  const { paths } = extensionStrokes(frame, parseRequest({ feature: "W59" }));
  const snapshot = structuredClone(paths);
  fitMetrics(frame, paths);
  assert.deepEqual(paths, snapshot);
});
