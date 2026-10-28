/** W69-W74 browser tests and Python parity. Author: John Khan. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FEATURES, renderBrows, observeBrows, browFrames, progressSeries, validateDiary,
  diaryTrend, compareMethods, designShape, shapeOptions, photoMeasurements, compareBrowPhotos } from "../dist/js/engines/brows/index.js";
import { noise } from "../dist/js/engines/brows/pigment.js";
import { pointAt, project, curvePoints } from "../dist/js/engines/brows/geometry.js";
import { components } from "../dist/js/engines/brows/evidence.js";

const corpus = JSON.parse(readFileSync(new URL("../../parity/brows-r15b.json", import.meta.url), "utf8"));
const decode = value => new Uint8Array(Buffer.from(value, "base64"));
const fixture = (name = "neutral_W69") => {
  const entry = corpus.cases.find(item => item.name === name);
  assert.ok(entry, name);
  return { entry, image: { width: entry.width, height: entry.height, channels: entry.channels, data: decode(entry.image) },
    face: entry.landmarks.map(p => [...p]), evidence: { coverage: Float64Array.from(decode(entry.coverage)),
      grey: Float64Array.from(decode(entry.grey)), origin: "manual", confidence: 1, notes: ["Drawn fixture observations."] } };
};
function compare(actual, expected, where = "root") {
  if (typeof expected === "number") {
    assert.ok(Math.abs(actual - expected) <= corpus.float_tolerance, `${where}: ${actual} != ${expected}`);
  } else if (Array.isArray(expected)) {
    assert.equal(actual.length, expected.length, where);
    expected.forEach((value, i) => compare(actual[i], value, `${where}[${i}]`));
  } else if (expected && typeof expected === "object") {
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), where);
    for (const key of Object.keys(expected)) compare(actual[key], expected[key], `${where}.${key}`);
  } else assert.equal(actual, expected, where);
}
function pixelDifference(a, b) {
  assert.equal(a.length, b.length);
  let maximum = 0;
  for (let i = 0; i < a.length; i++) maximum = Math.max(maximum, Math.abs(a[i] - b[i]));
  return maximum;
}
function assertOutside(image, result) {
  for (let i = 0; i < result.support.length; i++) {
    if (result.support[i] !== 0) continue;
    for (let c = 0; c < image.channels; c++) assert.equal(result.image[i * image.channels + c], image.data[i * image.channels + c]);
  }
}

for (const entry of corpus.cases) {
  test(`brow Python/TypeScript parity: ${entry.name}`, () => {
    const { image, face, evidence } = fixture(entry.name);
    const before = image.data.slice();
    const result = renderBrows(image, face, entry.feature, entry.settings, evidence);
    assert.ok(pixelDifference(result.image, decode(entry.output)) <= corpus.byte_tolerance, "image parity");
    assert.ok(pixelDifference(result.support, entry.support) <= corpus.float_tolerance, "support parity");
    compare(result.metrics, entry.metrics, "metrics");
    compare(result.details, entry.details, "details");
    assert.equal(result.status, entry.status);
    assert.deepEqual(image.data, before);
    assert.match(result.label, /simulation/i);
  });
}

test("brow progress and diary parity include all monthly values", () => {
  compare(progressSeries({ months: 12, lengthChange: 15, densityChange: 10 }), corpus.progress);
  compare(diaryTrend(corpus.diary), corpus.trend);
});

for (const feature of FEATURES) {
  test(`${feature}: zero amount is identity, output owned and alpha unchanged`, () => {
    const { image, face, evidence } = fixture("deep_grey_rolled_W69");
    const settings = { amount: 0 };
    if (["W71", "W72"].includes(feature)) settings.adultConfirmed = true;
    const result = renderBrows(image, face, feature, settings, evidence);
    assert.equal(pixelDifference(result.image, image.data), 0);
    assert.notEqual(result.image.buffer, image.data.buffer);
    assert.equal(result.metrics.alpha_unchanged, true);
    assert.equal(result.metrics.changed_pixels, 0);
    assert.equal(result.support.some(value => value !== 0), false);
  });
  test(`${feature}: invalid scalar and unknown fields reject`, () => {
    const { image, face, evidence } = fixture();
    for (const amount of [NaN, Infinity, -1, 1.01, true, "0.5"]) {
      const settings = { amount };
      if (["W71", "W72"].includes(feature)) settings.adultConfirmed = true;
      assert.throws(() => renderBrows(image, face, feature, settings, evidence), /amount/);
    }
    assert.throws(() => renderBrows(image, face, feature, { irrelevant: true }, evidence), /unknown brow option/);
  });
}

test("tint greys resist independently while gaps remain exact", () => {
  const { image, face, evidence } = fixture("deep_grey_rolled_W69");
  const opts = { amount: 1, colour: [12, 12, 12] };
  const resistant = renderBrows(image, face, "W69", { ...opts, greyResistance: 1 }, evidence);
  const receptive = renderBrows(image, face, "W69", { ...opts, greyResistance: 0 }, evidence);
  let changedGrey = 0;
  for (let i = 0; i < evidence.coverage.length; i++) {
    for (let c = 0; c < 3; c++) {
      const offset = i * image.channels + c;
      if (evidence.grey[i] > 0) {
        assert.equal(resistant.image[offset], image.data[offset]);
        if (receptive.image[offset] !== image.data[offset]) changedGrey++;
      }
      if (evidence.coverage[i] === 0) assert.equal(resistant.image[offset], image.data[offset]);
    }
  }
  assert.ok(changedGrey > 0);
  assert.equal(resistant.metrics.added_hairs, 0);
});

test("first-week tint is darker than settled and faded with fixed target", () => {
  const { image, face, evidence } = fixture();
  const totals = ["first_week", "settled", "faded"].map(state => {
    const result = renderBrows(image, face, "W69", { state, amount: 1, colour: [0, 0, 0] }, evidence);
    return result.image.reduce((sum, value) => sum + value, 0);
  });
  assert.ok(totals[0] < totals[1] && totals[1] < totals[2]);
});

test("missing hair evidence refuses observed operations", () => {
  const { image, face, evidence } = fixture();
  evidence.coverage.fill(0); evidence.grey.fill(0);
  for (const feature of ["W69", "W70"]) {
    const result = renderBrows(image, face, feature, {}, evidence);
    assert.equal(result.status, "unavailable");
    assert.equal(pixelDifference(result.image, image.data), 0);
    assert.equal(result.metrics.added_hairs, 0);
  }
});

test("lamination is an exact pixel permutation without smoothing", () => {
  const { image, face, evidence } = fixture();
  const result = renderBrows(image, face, "W70", { amount: 1, angle: 75 }, evidence);
  const channel = (data, c) => Array.from({ length: image.width * image.height }, (_, i) => data[i * image.channels + c]).sort((a, b) => a - b);
  for (let c = 0; c < 3; c++) assert.deepEqual(channel(result.image, c), channel(image.data, c));
  assert.ok(result.metrics.transported_pixels > 0);
  assert.equal(result.metrics.smoothing_applied, false);
  assert.equal(result.metrics.length_scale, 1);
  assert.equal(result.metrics.added_hairs, 0);
  assertOutside(image, result);
});

test("contrast observations are bounded, labelled and contained", () => {
  const { image, face } = fixture();
  const evidence = observeBrows(image, face);
  const frames = browFrames(face, image.width, image.height);
  assert.equal(evidence.origin, "contrast");
  assert.ok(evidence.confidence >= 0 && evidence.confidence <= 0.85);
  for (let i = 0; i < evidence.coverage.length; i++) {
    assert.ok(evidence.grey[i] <= evidence.coverage[i]);
    if (frames.every(frame => frame.mask[i] === 0)) assert.equal(evidence.coverage[i], 0);
  }
  assert.match(evidence.notes.join(" "), /estimate/);
});

test("a flat skin photo does not invent brow hairs", () => {
  const { image, face } = fixture();
  image.data.fill(70);
  const result = observeBrows(image, face);
  assert.equal(result.coverage.some(value => value > 0), false);
  assert.equal(result.confidence, 0);
});

test("manual observations cannot paint outside the brow or claim extra grey", () => {
  const { image, face, evidence } = fixture();
  evidence.coverage[0] = 1;
  assert.throws(() => renderBrows(image, face, "W69", {}, evidence), /inside/);
  evidence.coverage[0] = 0; evidence.grey[0] = 1;
  assert.throws(() => renderBrows(image, face, "W69", {}, evidence), /grey coverage/);
});

test("adult attestation is exact true and healed is the default", () => {
  const { image, face } = fixture();
  for (const feature of ["W71", "W72"]) {
    for (const adultConfirmed of [false, 1, "true", undefined]) {
      assert.throws(() => renderBrows(image, face, feature, { adultConfirmed }), /adult|boolean/);
    }
    const result = renderBrows(image, face, feature, { adultConfirmed: true });
    assert.equal(result.metrics.state, "healed");
    assert.equal(result.metrics.prediction, false);
    assert.ok(result.metrics.maximum_opacity <= 0.28);
    assert.match(result.warnings.join(" "), /professional consultation/);
    assertOutside(image, result);
  }
});

test("powder, nano and microblading render distinct original pigment", () => {
  const { image, face } = fixture();
  const outputs = compareMethods(image, browFrames(face, image.width, image.height), { adultConfirmed: true, amount: 1 });
  assert.ok(pixelDifference(outputs.microblading.image, outputs.powder.image) > 0);
  assert.ok(pixelDifference(outputs.nano.image, outputs.powder.image) > 0);
  assert.ok(pixelDifference(outputs.microblading.support, outputs.nano.support) > 0);
  assert.equal(outputs.powder.metrics.pigment_strokes, 0);
  assert.ok(outputs.nano.metrics.pigment_strokes > 0);
  assert.throws(() => renderBrows(image, face, "W72", { adultConfirmed: true, density: 1 }), /density/);
});

test("PMU fresh, healed and faded change amount is ordered", () => {
  const { image, face } = fixture();
  const changed = ["fresh", "healed", "faded"].map(state => {
    const result = renderBrows(image, face, "W71", { adultConfirmed: true, state, amount: 1, colour: [10, 10, 10] });
    return result.image.reduce((sum, value, i) => sum + Math.abs(value - image.data[i]), 0);
  });
  assert.ok(changed[0] > changed[1] && changed[1] > changed[2] && changed[2] > 0);
});

test("powder noise is deterministic and stays fractional for large indices", () => {
  assert.equal(noise(37, 17), noise(37, 17));
  assert.notEqual(noise(37, 17), noise(37, 89));
  assert.ok(noise(2147483647, 2147483647) >= 0 && noise(2147483647, 2147483647) < 1);
});

test("independent brow guides preserve measured asymmetry and forbid thinning", () => {
  const { image, face } = fixture("asymmetric_sparse_W73");
  const frames = browFrames(face, image.width, image.height);
  const base = designShape(frames), altered = designShape(frames, { leftArch: 0.15 });
  assert.equal(base.automatic_thinning, false);
  assert.equal(base.thickness_scale, 1);
  assert.notEqual(base.brows[0].width_px, base.brows[1].width_px);
  assert.deepEqual(base.brows[0], altered.brows[0]);
  assert.notDeepEqual(base.brows[1].centreline, altered.brows[1].centreline);
  assert.throws(() => designShape(frames, { thickness: 0.8 }), /thickness/);
  const curve = curvePoints(frames[0], 0.1, 0.5, 0.1, 101);
  compare(curve[0], frames[0].inner);
  compare(curve[100], pointAt(frames[0], 1.1, 0));
  compare(project(frames[0], ...curve[50]), [0.55, 0.1]);
});

test("geometry alternatives are optional and explain measurable inputs", () => {
  const { image, face } = fixture("asymmetric_sparse_W73");
  const choices = shapeOptions(face, image.width, image.height);
  assert.equal(choices.automatic_selection, false);
  assert.equal(choices.alternatives.length, 4);
  assert.ok(choices.alternatives.every(item => item.thickness >= 1 && item.reason));
  assert.ok(choices.brow_width_difference_px > 0);
});

test("serum scenarios default to zero and do not edit photographs", () => {
  const { image, face, evidence } = fixture();
  const series = progressSeries();
  assert.ok(series.rows.every(row => row.length_scale === 1 && row.density_scale === 1));
  assert.equal(series.empirical, false);
  assert.match(series.note, /no product efficacy/);
  assert.match(series.safety_note, /iris pigmentation/);
  const result = renderBrows(image, face, "W74", { lengthChange: 30, densityChange: 30 }, evidence);
  assert.equal(pixelDifference(result.image, image.data), 0);
  assert.equal(result.metrics.photo_prediction, false);
  assert.equal(result.details.rows.at(-1).length_scale, 1.3);
});

test("scenario trajectories end exactly at user-selected values for both sites", () => {
  for (const site of ["brows", "lashes"]) {
    for (const months of [0, 1, 6, 12]) {
      const result = progressSeries({ site, months, lengthChange: 20, densityChange: -10, baselineLength: 5, baselineDensity: 100 });
      assert.equal(result.rows.length, months + 1);
      assert.equal(result.rows[0].length_scale, 1);
      if (months) {
        assert.equal(result.rows.at(-1).length_from_user_baseline, 6);
        assert.equal(result.rows.at(-1).density_from_user_baseline, 90);
      }
    }
  }
});

test("diary measurements are sorted, bounded, noncausal and do not store photos", () => {
  const input = structuredClone(corpus.diary).reverse();
  const snapshot = structuredClone(input);
  const parsed = validateDiary(input);
  assert.deepEqual(input, snapshot);
  assert.equal(parsed[0].date, "2026-01-01");
  assert.equal(diaryTrend(input).attribution, false);
  assert.equal(diaryTrend([], "lashes").status, "insufficient");
  for (const field of ["photo", "email", "notes", "product"]) {
    assert.throws(() => validateDiary([{ ...input[0], [field]: "private" }]), /unknown/);
  }
  assert.throws(() => validateDiary(Array(121).fill(input[0])), /120/);
  assert.throws(() => validateDiary([input[0], input[0]]), /duplicate/);
  for (const date of ["2026-02-30", "2026-1-01", "0000-01-01", "20260201"]) {
    assert.throws(() => validateDiary([{ ...input[0], date }]), /date/);
  }
});

test("paired photo measurements reject lighting changes without a growth claim", () => {
  const { image, face, evidence } = fixture();
  const same = compareBrowPhotos(image, face, image, face, evidence, evidence);
  assert.equal(same.comparable, true);
  assert.equal(same.attribution, false);
  assert.equal(same.photos_stored, false);
  const lit = { ...image, data: Uint8Array.from(image.data, value => Math.min(255, value + 30)) };
  const changed = compareBrowPhotos(image, face, lit, face, evidence, evidence);
  assert.equal(changed.comparable, false);
  assert.ok(changed.reasons.some(reason => /lighting/.test(reason)));
  assert.ok(changed.sides.every(side => side.biological_growth_claim === false));
  const measurements = photoMeasurements(image, face, evidence);
  assert.equal(measurements.biological_count, null);
  assert.equal(measurements.photo_stored, false);
});

test("connected pixel groups are not mistaken for a biological hair count", () => {
  const mask = new Float64Array(64);
  mask[9] = mask[10] = mask[11] = mask[28] = 1;
  const groups = components(mask, 8, 8);
  assert.deepEqual(groups.map(group => group.length).sort(), [1, 3]);
  assert.throws(() => components(mask, 8, 8, 0.5, 1), /too many/);
});

test("invalid byte photos and missing mesh data are refused", () => {
  const { image, face } = fixture();
  assert.throws(() => renderBrows({ ...image, data: new Float32Array(image.data) }, face, "W69"), /byte image/);
  assert.throws(() => renderBrows({ ...image, channels: 2 }, face, "W69"), /RGB/);
  assert.throws(() => renderBrows({ ...image, width: 1 }, face, "W69"), /8..4096/);
  assert.throws(() => renderBrows(image, face.slice(0, 100), "W69"), /468/);
  assert.throws(() => renderBrows(image, face, "W68"), /feature/);
});

test("manually drawn coverage, grey and erase masks match the Python reference", async () => {
  const { annotateBrows, observationDocument } = await import("../dist/js/engines/brows/index.js");
  const { image, face } = fixture();
  for (const item of corpus.auxiliary.manual) {
    const observed = annotateBrows(image, face, item.marks, undefined, true);
    assert.ok(pixelDifference(observed.coverage, item.coverage) < corpus.float_tolerance);
    assert.ok(pixelDifference(observed.grey, item.grey) < corpus.float_tolerance);
    compare(observationDocument(image.width, image.height, item.marks, true), item.document);
  }
});

test("geometry-led alternatives and observed photo measurements match Python", () => {
  const { image, face, evidence } = fixture();
  compare(shapeOptions(face, image.width, image.height), corpus.auxiliary.shape);
  compare(photoMeasurements(image, face, evidence), corpus.auxiliary.measurements);
  compare(compareBrowPhotos(image, face, image, face, evidence, evidence), corpus.auxiliary.comparison);
});

test("portable diary document and both-site summaries agree across implementations", async () => {
  const { diaryDocument, summarizeDiary } = await import("../dist/js/engines/brows/index.js");
  compare(diaryDocument(corpus.diary), corpus.auxiliary.diary_document);
  compare(summarizeDiary(corpus.diary), corpus.auxiliary.diary_summary);
});

test("explicit null values cannot become unnoticed default edits", () => {
  const { image, face, evidence } = fixture();
  for (const feature of FEATURES) assert.throws(() => renderBrows(image, face, feature, { amount: null }, evidence), /null/);
});

test("evidence notes and image dimensions have strict bounded contracts", () => {
  const { image, face, evidence } = fixture();
  for (const notes of [["x".repeat(201)], Array(9).fill("a"), [123]]) {
    assert.throws(() => renderBrows(image, face, "W69", {}, { ...evidence, notes }), /notes/);
  }
  assert.throws(() => renderBrows({ width: 4097, height: 8, channels: 3, data: new Uint8Array(4097 * 8 * 3) }, face, "W69"), /4096/);
});

test("rotated asymmetric brow coordinate frames round-trip without a symmetry constraint", () => {
  const { image, face } = fixture("deep_grey_rolled_W73");
  const frames = browFrames(face, image.width, image.height);
  for (const frame of frames) {
    for (const uv of [[0, 0], [0.3, 0.1], [1, 0], [0.65, -0.05]]) {
      const result = project(frame, ...pointAt(frame, ...uv));
      assert.ok(Math.abs(result[0] - uv[0]) < 1e-12);
      assert.ok(Math.abs(result[1] - uv[1]) < 1e-12);
    }
    assert.ok(Math.abs(frame.across[0] * frame.up[0] + frame.across[1] * frame.up[1]) < 1e-12);
  }
});
