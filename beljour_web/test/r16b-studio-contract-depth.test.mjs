/** Deep studio contract acceptance for R16 Lane B. Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { CARDS, card } from "../dist/js/ui/r16b/catalogue.js";
import { Session } from "../dist/js/ui/r16b/session.js";
import { renderJob } from "../dist/js/ui/r16b/render.js";
import { fixture } from "../dist/js/ui/r16b/fixture.js";

const R16_IDS = [
  "W45", "W46", "W47", "W48", "W49", "W50", "W51", "W52", "W53", "W54",
  "W55", "W56", "W57", "W58", "W77", "W78", "W79", "W80", "W81", "W82",
  "W83", "W84", "W85", "W86", "W87", "W88", "W89", "W90", "W91", "W92",
];

const ADULT_ROWS = new Set(["W45", "W47", "W48", "W49", "W50", "W51", "W52", "W53", "W58"]);
const REGION_ROWS = new Set(["W50", "W51", "W52", "W53", "W58", "W79", "W80", "W81", "W82", "W85", "W86", "W87", "W88", "W90", "W91"]);
const MESH_ROWS = new Set(["W45", "W46", "W47", "W48", "W49", "W54", "W55", "W56", "W57"]);
const SEQUENCE_ROWS = new Set(["W58"]);

function makeSession(id, options = {}) {
  const f = fixture();
  const s = new Session();
  s.load(f.image, options.withoutLandmarks ? null : f.landmarks);
  s.select(id);
  const c = card(id);
  s.style = c.styles[0] ?? "";
  s.adult = options.adult ?? c.adult;
  s.health_consent = options.healthConsent ?? (id === "W83");
  if (c.region && !options.withoutRegions) {
    for (const region of f.region) {
      s.setRegion(region.name, region.points);
    }
  }
  return { f, s, c };
}

function countPixelDifferences(a, b) {
  assert.equal(a.length, b.length);
  let changed = 0;
  for (let i = 0; i < a.length; i += 4) {
    if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) {
      changed += 1;
    }
  }
  return changed;
}

test("catalogue contains exactly the required R16 rows", () => {
  assert.deepEqual(CARDS.map((entry) => entry.id), R16_IDS);
  assert.equal(CARDS.length, 30);
  assert.equal(new Set(CARDS.map((entry) => entry.id)).size, 30);
});

test("catalogue prerequisite flags match the reviewed R16 studio contract", () => {
  for (const entry of CARDS) {
    assert.equal(entry.adult, ADULT_ROWS.has(entry.id), `${entry.id} adult flag`);
    assert.equal(entry.region, REGION_ROWS.has(entry.id), `${entry.id} region flag`);
    assert.equal(entry.mesh, MESH_ROWS.has(entry.id), `${entry.id} mesh flag`);
    assert.equal(entry.sequence, SEQUENCE_ROWS.has(entry.id), `${entry.id} sequence flag`);
  }
});

test("every catalogue row has explicit user-facing scope and limitation copy", () => {
  for (const entry of CARDS) {
    assert.ok(entry.name.length >= 5, `${entry.id} name`);
    assert.ok(entry.summary.length >= 25, `${entry.id} summary`);
    assert.ok(entry.limitation.length >= 25, `${entry.id} limitation`);
    assert.ok(entry.styles.length >= 1, `${entry.id} styles`);
    assert.equal(new Set(entry.styles).size, entry.styles.length, `${entry.id} unique styles`);
  }
});

test("catalogue lookup fails closed on an unknown row", () => {
  assert.throws(() => card("W999"), /unknown R16B feature/);
  assert.throws(() => card(""), /unknown R16B feature/);
});

for (const id of R16_IDS) {
  test(`${id}: job snapshots immutable photo, region and diary inputs`, () => {
    const { f, s, c } = makeSession(id);
    const sourceFirst = f.image.data[0];
    const sourceDiary = s.diary_values[0];
    const job = s.job();
    job.image.data[0] = sourceFirst === 255 ? 254 : sourceFirst + 1;
    assert.equal(s.image.data[0], sourceFirst);
    if (c.region) {
      const originalPoint = s.regions[0].points[0][0];
      job.regions[0].points[0] = [0.01, 0.01];
      assert.equal(s.regions[0].points[0][0], originalPoint);
    }
    job.diary_values[0] = 999;
    assert.equal(s.diary_values[0], sourceDiary);
  });

  test(`${id}: zero-strength preview is pixel-identical and alpha-preserving`, () => {
    const { f, s } = makeSession(id);
    s.amount = 0;
    s.invalidate();
    const job = s.job();
    const result = renderJob(job, (() => {
      let tick = 100;
      return () => tick += 3;
    })());
    assert.deepEqual(result.pixels, f.image.data);
    assert.equal(result.pixels.length, f.image.data.length);
    for (let i = 3; i < result.pixels.length; i += 4) {
      assert.equal(result.pixels[i], f.image.data[i], `alpha byte ${i}`);
    }
    assert.ok(result.elapsedMs >= 0);
    assert.match(result.label, /simulation|preview|consultation|cosmetic/i);
    assert.equal(s.complete(job.id, result), true);
  });

  test(`${id}: result storage is isolated from later caller mutation`, () => {
    const { s } = makeSession(id);
    s.amount = 0;
    s.invalidate();
    const job = s.job();
    const result = renderJob(job, () => 5);
    const expectedPixel = result.pixels[0];
    assert.equal(s.complete(job.id, result), true);
    result.pixels[0] = expectedPixel === 255 ? 254 : expectedPixel + 1;
    result.warnings.push("caller mutation");
    result.metrics.mutated = true;
    assert.equal(s.result.pixels[0], expectedPixel);
    assert.ok(!s.result.warnings.includes("caller mutation"));
    assert.equal(s.result.metrics.mutated, undefined);
  });
}

for (const id of MESH_ROWS) {
  test(`${id}: checked face points are mandatory`, () => {
    const { s } = makeSession(id, { withoutLandmarks: true });
    assert.ok(s.reasons().some((reason) => /Checked face points/.test(reason)));
    assert.throws(() => s.job(), /Checked face points/);
  });
}

for (const id of REGION_ROWS) {
  test(`${id}: a checked local region is mandatory`, () => {
    const { s } = makeSession(id, { withoutRegions: true });
    assert.ok(s.reasons().some((reason) => /Mark a local region/.test(reason)));
    assert.throws(() => s.job(), /Mark a local region/);
  });

  test(`${id}: clearing regions invalidates an in-flight result`, () => {
    const { f, s } = makeSession(id);
    const job = s.job();
    s.clearRegions();
    const accepted = s.complete(job.id, {
      pixels: f.image.data.slice(),
      label: "Local cosmetic simulation",
      warnings: [],
      metrics: {},
      elapsedMs: 1,
    });
    assert.equal(accepted, false);
    assert.ok(s.reasons().some((reason) => /Mark a local region/.test(reason)));
  });
}

for (const id of ADULT_ROWS) {
  test(`${id}: adult consultation confirmation is mandatory and revocable`, () => {
    const { s } = makeSession(id, { adult: false });
    assert.ok(s.reasons().some((reason) => /18\+/.test(reason)));
    assert.throws(() => s.job(), /18\+/);
    s.adult = true;
    s.invalidate();
    assert.deepEqual(s.reasons(), []);
  });
}

test("W83 requires explicit local health-data diary consent", () => {
  const { s } = makeSession("W83", { healthConsent: false });
  assert.ok(s.reasons().some((reason) => /health-data diary consent/.test(reason)));
  assert.throws(() => s.job(), /health-data diary consent/);
  s.health_consent = true;
  s.invalidate();
  assert.deepEqual(s.reasons(), []);
});

test("W83 consent requirement is isolated from non-health rows", () => {
  for (const id of R16_IDS.filter((candidate) => candidate !== "W83")) {
    const { s } = makeSession(id, { healthConsent: false });
    assert.ok(!s.reasons().some((reason) => /health-data diary consent/.test(reason)), id);
  }
});

test("session rejects malformed image buffers before any rendering state exists", () => {
  const s = new Session();
  assert.throws(() => s.load({
    width: 10,
    height: 10,
    channels: 4,
    data: new Uint8ClampedArray(12),
  }), /invalid image/);
  assert.equal(s.image, null);
});

test("region creation enforces a polygon rather than a point or line", () => {
  const { s } = makeSession("W77");
  assert.throws(() => s.setRegion("bad", [[0.1, 0.1]]), /at least 3 points/);
  assert.throws(() => s.setRegion("bad", [[0.1, 0.1], [0.2, 0.2]]), /at least 3 points/);
});

test("replacing a named checked region does not duplicate it", () => {
  const { s } = makeSession("W77");
  const first = [[0.1, 0.1], [0.2, 0.1], [0.2, 0.2]];
  const second = [[0.3, 0.3], [0.4, 0.3], [0.4, 0.4]];
  s.setRegion("teeth", first);
  s.setRegion("teeth", second);
  const named = s.regions.filter((region) => region.name === "teeth");
  assert.equal(named.length, 1);
  assert.deepEqual(named[0].points, second);
});

test("selecting another feature clears prior checked regions and stale results", () => {
  const { s } = makeSession("W50");
  assert.ok(s.regions.length > 0);
  s.select("W77");
  assert.equal(s.regions.length, 0);
  assert.equal(s.result, null);
});

test("job identifiers increase monotonically across rerenders", () => {
  const { s } = makeSession("W77");
  const first = s.job();
  s.fail(first.id);
  const second = s.job();
  assert.ok(second.id > first.id);
  s.fail(second.id);
  const third = s.job();
  assert.ok(third.id > second.id);
});

test("failure only clears the matching active job", () => {
  const { s } = makeSession("W77");
  const first = s.job();
  assert.equal(s.fail(first.id + 99), false);
  assert.equal(s.fail(first.id), true);
  assert.equal(s.fail(first.id), false);
});

test("completed results must carry a visible simulation or consultation label", () => {
  const { f, s } = makeSession("W77");
  const job = s.job();
  assert.throws(() => s.complete(job.id, {
    pixels: f.image.data.slice(),
    label: "Done",
    warnings: [],
    metrics: {},
    elapsedMs: 1,
  }), /invalid labelled result/);
});

test("completed results must have exactly one RGBA buffer matching the photo", () => {
  const { s } = makeSession("W77");
  const job = s.job();
  assert.throws(() => s.complete(job.id, {
    pixels: new Uint8ClampedArray(4),
    label: "Local cosmetic simulation",
    warnings: [],
    metrics: {},
    elapsedMs: 1,
  }), /invalid labelled result/);
});

test("fixture supplies the full checked lip mesh expected by local lip previews", () => {
  const f = fixture();
  assert.equal(f.landmarks.length, 478);
  for (const point of f.landmarks) {
    assert.equal(point.length, 2);
    assert.ok(Number.isFinite(point[0]));
    assert.ok(Number.isFinite(point[1]));
    assert.ok(point[0] >= 0 && point[0] <= 1);
    assert.ok(point[1] >= 0 && point[1] <= 1);
  }
});

test("fixture checked dental regions are bounded polygons", () => {
  const f = fixture();
  assert.ok(f.region.length >= 2);
  for (const region of f.region) {
    assert.ok(region.points.length >= 3, region.name);
    for (const [x, y] of region.points) {
      assert.ok(x >= 0 && x <= 1, `${region.name} x`);
      assert.ok(y >= 0 && y <= 1, `${region.name} y`);
    }
  }
});

test("fixture itself is opaque RGBA and internally sized", () => {
  const f = fixture();
  assert.equal(f.image.data.length, f.image.width * f.image.height * 4);
  for (let i = 3; i < f.image.data.length; i += 4) {
    assert.equal(f.image.data[i], 255);
  }
});

test("representative nonzero previews make bounded RGB changes without changing dimensions", () => {
  const representatives = ["W45", "W54", "W50", "W58", "W77", "W81", "W85", "W90", "W92"];
  for (const id of representatives) {
    const { f, s } = makeSession(id);
    s.amount = 0.35;
    s.invalidate();
    const result = renderJob(s.job(), () => 1);
    assert.equal(result.pixels.length, f.image.data.length, id);
    const changed = countPixelDifferences(result.pixels, f.image.data);
    assert.ok(changed >= 0, id);
    for (let i = 3; i < result.pixels.length; i += 4) {
      assert.equal(result.pixels[i], f.image.data[i], `${id} alpha`);
    }
  }
});

test("W58 local motion contract reports checked-frame stability metrics", () => {
  const { s } = makeSession("W58");
  s.amount = 0.35;
  s.invalidate();
  const result = renderJob(s.job(), () => 2);
  assert.ok(Object.keys(result.metrics).length > 0);
  assert.match(result.label, /simulation|preview|consultation|cosmetic/i);
  assert.ok(result.warnings.some((warning) => /Approximation|static|movement|predict/i.test(warning)));
});

test("W88 keeps the cultural co-design release limitation visible in the studio result", () => {
  const { s, c } = makeSession("W88");
  const result = renderJob(s.job(), () => 2);
  assert.match(c.limitation, /Cultural co-design validation remains required/);
  assert.ok(result.warnings.includes(c.limitation));
});

test("health and medical-adjacent rows keep non-diagnostic limitation copy in result warnings", () => {
  for (const id of ["W50", "W53", "W80", "W82", "W83", "W84", "W92"]) {
    const { s, c } = makeSession(id);
    const result = renderJob(s.job(), () => 2);
    assert.ok(result.warnings.includes(c.limitation), id);
  }
});

test("every feature exposes its catalogue limitation in the rendered result", () => {
  for (const id of R16_IDS) {
    const { s, c } = makeSession(id);
    const result = renderJob(s.job(), () => 2);
    assert.deepEqual(result.warnings, [c.limitation], id);
  }
});
