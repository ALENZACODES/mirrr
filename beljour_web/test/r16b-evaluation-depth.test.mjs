/** Browser-side R16B numerical quality tests. Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bounded,
  changedPixels,
  evaluateCommon,
  evaluateProtectedFeature,
  evaluateTextureFeature,
  evaluationReport,
  integrity,
  locality,
  mergeEvaluation,
  monotonic,
  protectedIdentity,
  texture,
  zeroIdentity,
} from "../dist/js/engines/r16b_evaluation.js";

function fixture(width = 48, height = 40) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      data[offset] = 105 + (x * 3 + y) % 85;
      data[offset + 1] = 78 + (x + y * 2) % 72;
      data[offset + 2] = 64 + (x * 2 + y * 3) % 66;
      data[offset + 3] = 255;
    }
  }
  return {
    width,
    height,
    channels: 4,
    data,
  };
}

function rectangle(width, height, left, top, right, bottom) {
  const mask = new Float32Array(width * height);
  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      mask[y * width + x] = 1;
    }
  }
  return mask;
}

function recolourInside(source, width, height, support, channel, value) {
  const output = source.slice();
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    if (support[pixel] <= 0.05) continue;
    output[pixel * 4 + channel] = value;
  }
  return output;
}

function commonFixture() {
  const image = fixture();
  const shape = {
    width: image.width,
    height: image.height,
    channels: 4,
  };
  const support = rectangle(
    image.width,
    image.height,
    10,
    8,
    38,
    32,
  );
  const protectedMask = rectangle(
    image.width,
    image.height,
    18,
    14,
    28,
    22,
  );
  return {
    image,
    shape,
    support,
    protectedMask,
  };
}

test("integrity identity has zero error", () => {
  const { image, shape } = commonFixture();
  const row = integrity(image.data, image.data.slice(), shape);
  assert.equal(row.sameLength, true);
  assert.equal(row.alphaIdentity, true);
  assert.equal(row.meanAbsoluteError, 0);
  assert.equal(row.changedFraction, 0);
  assert.equal(row.finite, true);
});

test("integrity detects alpha-only changes", () => {
  const { image, shape } = commonFixture();
  const after = image.data.slice();
  after[3] = 0;
  const row = integrity(image.data, after, shape);
  assert.equal(row.alphaIdentity, false);
  assert.equal(row.meanAbsoluteError, 0);
  assert.equal(row.changedFraction, 0);
});

test("integrity detects changed RGB pixels", () => {
  const { image, shape } = commonFixture();
  const after = image.data.slice();
  after[0] = 0;
  after[4] = 0;
  const row = integrity(image.data, after, shape);
  assert.equal(row.alphaIdentity, true);
  assert.ok(row.meanAbsoluteError > 0);
  assert.ok(row.changedFraction > 0);
});

test("locality passes change inside support", () => {
  const { image, shape, support } = commonFixture();
  const after = recolourInside(
    image.data,
    image.width,
    image.height,
    support,
    0,
    40,
  );
  const row = locality(
    image.data,
    after,
    shape,
    support,
  );
  assert.ok(row.insideError > 0);
  assert.equal(row.outsideError, 0);
  assert.equal(row.protectedError, 0);
  assert.ok(row.supportFraction > 0);
  assert.equal(row.passed, true);
});

test("locality fails a changed pixel outside support", () => {
  const { image, shape, support } = commonFixture();
  const after = image.data.slice();
  after[0] = 0;
  const row = locality(
    image.data,
    after,
    shape,
    support,
    undefined,
    0,
  );
  assert.ok(row.outsideError > 0);
  assert.equal(row.passed, false);
});

test("locality fails protected changes", () => {
  const { image, shape, support, protectedMask } = commonFixture();
  const after = recolourInside(
    image.data,
    image.width,
    image.height,
    protectedMask,
    1,
    5,
  );
  const row = locality(
    image.data,
    after,
    shape,
    support,
    protectedMask,
  );
  assert.ok(row.protectedError > 0);
  assert.equal(row.passed, false);
});

test("texture identity has perfect correlation", () => {
  const { image, shape, support } = commonFixture();
  const row = texture(
    image.data,
    image.data.slice(),
    shape,
    support,
    0.78,
  );
  assert.ok(Math.abs(row.correlation - 1) < 1e-12);
  assert.ok(Math.abs(row.gradientRatio - 1) < 1e-12);
  assert.ok(Math.abs(row.varianceRatio - 1) < 1e-12);
  assert.equal(row.passed, true);
});

test("texture rejects an invalid floor", () => {
  const { image, shape, support } = commonFixture();
  assert.throws(
    () => texture(image.data, image.data, shape, support, -0.1),
    /minimum/,
  );
  assert.throws(
    () => texture(image.data, image.data, shape, support, 1.1),
    /minimum/,
  );
});

test("zeroIdentity checks every channel", () => {
  const { image } = commonFixture();
  const same = image.data.slice();
  assert.equal(zeroIdentity(image.data, same), true);
  same[same.length - 1] = 0;
  assert.equal(zeroIdentity(image.data, same), false);
});

test("changedPixels creates one bit per image pixel", () => {
  const { image, shape } = commonFixture();
  const after = image.data.slice();
  after[0] = 0;
  after[8] = 0;
  const changed = changedPixels(
    image.data,
    after,
    shape,
  );
  assert.equal(changed.length, image.width * image.height);
  assert.equal(changed[0], 1);
  assert.equal(changed[1], 0);
  assert.equal(changed[2], 1);
});

test("protectedIdentity passes untouched protected pixels", () => {
  const { image, shape, protectedMask } = commonFixture();
  assert.equal(
    protectedIdentity(
      image.data,
      image.data.slice(),
      shape,
      protectedMask,
    ),
    true,
  );
});

test("protectedIdentity catches a protected RGB change", () => {
  const { image, shape, protectedMask } = commonFixture();
  const after = recolourInside(
    image.data,
    image.width,
    image.height,
    protectedMask,
    2,
    1,
  );
  assert.equal(
    protectedIdentity(
      image.data,
      after,
      shape,
      protectedMask,
    ),
    false,
  );
});

const monotonicCases = [
  {
    name: "empty increasing",
    values: [],
    direction: "increasing",
    strict: false,
    expected: true,
  },
  {
    name: "single increasing",
    values: [1],
    direction: "increasing",
    strict: false,
    expected: true,
  },
  {
    name: "flat non-strict increasing",
    values: [1, 1, 1],
    direction: "increasing",
    strict: false,
    expected: true,
  },
  {
    name: "flat strict increasing",
    values: [1, 1, 1],
    direction: "increasing",
    strict: true,
    expected: false,
  },
  {
    name: "strict increasing",
    values: [0.1, 0.2, 0.3],
    direction: "increasing",
    strict: true,
    expected: true,
  },
  {
    name: "reverse increasing",
    values: [0.3, 0.2, 0.1],
    direction: "increasing",
    strict: false,
    expected: false,
  },
  {
    name: "flat non-strict decreasing",
    values: [1, 1, 1],
    direction: "decreasing",
    strict: false,
    expected: true,
  },
  {
    name: "flat strict decreasing",
    values: [1, 1, 1],
    direction: "decreasing",
    strict: true,
    expected: false,
  },
  {
    name: "strict decreasing",
    values: [0.3, 0.2, 0.1],
    direction: "decreasing",
    strict: true,
    expected: true,
  },
  {
    name: "reverse decreasing",
    values: [0.1, 0.2, 0.3],
    direction: "decreasing",
    strict: false,
    expected: false,
  },
  {
    name: "nan increasing",
    values: [0.1, Number.NaN, 0.3],
    direction: "increasing",
    strict: false,
    expected: false,
  },
  {
    name: "infinity decreasing",
    values: [0.3, Number.POSITIVE_INFINITY, 0.1],
    direction: "decreasing",
    strict: false,
    expected: false,
  },
];

for (const row of monotonicCases) {
  test(`monotonic: ${row.name}`, () => {
    assert.equal(
      monotonic(
        row.values,
        row.direction,
        row.strict,
      ),
      row.expected,
    );
  });
}

const boundedCases = [
  {
    value: 0,
    minimum: 0,
    maximum: 1,
    expected: true,
  },
  {
    value: 1,
    minimum: 0,
    maximum: 1,
    expected: true,
  },
  {
    value: 0.5,
    minimum: 0,
    maximum: 1,
    expected: true,
  },
  {
    value: -0.1,
    minimum: 0,
    maximum: 1,
    expected: false,
  },
  {
    value: 1.1,
    minimum: 0,
    maximum: 1,
    expected: false,
  },
  {
    value: Number.NaN,
    minimum: 0,
    maximum: 1,
    expected: false,
  },
  {
    value: Number.POSITIVE_INFINITY,
    minimum: 0,
    maximum: 1,
    expected: false,
  },
];

for (const row of boundedCases) {
  test(`bounded ${String(row.value)} in [${row.minimum}, ${row.maximum}]`, () => {
    assert.equal(
      bounded(
        row.value,
        row.minimum,
        row.maximum,
      ),
      row.expected,
    );
  });
}

test("evaluateCommon passes a local supported edit", () => {
  const { image, shape, support } = commonFixture();
  const after = recolourInside(
    image.data,
    image.width,
    image.height,
    support,
    0,
    150,
  );
  const row = evaluateCommon(
    "W77",
    image.data,
    after,
    image.data.slice(),
    shape,
    support,
  );
  assert.equal(row.feature, "W77");
  assert.equal(row.passed, true);
  assert.deepEqual(row.failures, []);
  assert.equal(row.metrics.alpha_identity, true);
  assert.equal(row.metrics.zero_identity, true);
  assert.equal(row.metrics.outside_error, 0);
});

test("evaluateCommon fails a non-identity zero render", () => {
  const { image, shape, support } = commonFixture();
  const zero = image.data.slice();
  zero[0] = 0;
  const row = evaluateCommon(
    "W77",
    image.data,
    image.data.slice(),
    zero,
    shape,
    support,
  );
  assert.equal(row.passed, false);
  assert.ok(row.failures.includes("zero-strength render is not identity"));
});

test("evaluateProtectedFeature protects selected pixels", () => {
  const { image, shape, support, protectedMask } = commonFixture();
  const row = evaluateProtectedFeature(
    "W54",
    image.data,
    image.data.slice(),
    image.data.slice(),
    shape,
    support,
    protectedMask,
  );
  assert.equal(row.passed, true);
  assert.equal(row.metrics.protected_identity, true);
});

test("evaluateProtectedFeature fails changed protected pixels", () => {
  const { image, shape, support, protectedMask } = commonFixture();
  const after = recolourInside(
    image.data,
    image.width,
    image.height,
    protectedMask,
    0,
    0,
  );
  const row = evaluateProtectedFeature(
    "W54",
    image.data,
    after,
    image.data.slice(),
    shape,
    support,
    protectedMask,
  );
  assert.equal(row.passed, false);
  assert.equal(row.metrics.protected_identity, false);
  assert.ok(row.failures.includes("protected pixels changed"));
});

test("evaluateTextureFeature records texture metrics", () => {
  const { image, shape, support } = commonFixture();
  const row = evaluateTextureFeature(
    "W92",
    image.data,
    image.data.slice(),
    image.data.slice(),
    shape,
    support,
    0.78,
  );
  assert.equal(row.passed, true);
  assert.equal(row.metrics.texture_retention, 1);
  assert.equal(row.metrics.gradient_ratio, 1);
  assert.equal(row.metrics.variance_ratio, 1);
});

test("mergeEvaluation adds metrics notes and failures", () => {
  const { image, shape, support } = commonFixture();
  const base = evaluateCommon(
    "W83",
    image.data,
    image.data.slice(),
    image.data.slice(),
    shape,
    support,
  );
  const merged = mergeEvaluation(
    base,
    {
      prediction: false,
      local_only: true,
    },
    ["consent missing"],
    ["Local diary only."],
  );
  assert.equal(merged.passed, false);
  assert.equal(merged.metrics.prediction, false);
  assert.equal(merged.metrics.local_only, true);
  assert.ok(merged.failures.includes("consent missing"));
  assert.ok(merged.notes.includes("Local diary only."));
});

test("evaluationReport counts pass and fail rows", () => {
  const { image, shape, support } = commonFixture();
  const passing = evaluateCommon(
    "W77",
    image.data,
    image.data.slice(),
    image.data.slice(),
    shape,
    support,
  );
  const failing = mergeEvaluation(
    passing,
    {},
    ["synthetic failure"],
  );
  const report = evaluationReport([
    passing,
    failing,
  ]);
  assert.equal(report.rows, 2);
  assert.equal(report.passed, 1);
  assert.equal(report.failed, 1);
  assert.equal(report.realFaceClaim, false);
  assert.equal(report.byFeature.W77.feature, "W77");
  assert.match(report.note, /frozen real-face/i);
});

test("image shape validation rejects wrong pixel length", () => {
  const { image, shape } = commonFixture();
  const wrong = image.data.slice(0, -4);
  assert.throws(
    () => integrity(wrong, image.data, shape),
    /pixel buffer length/,
  );
});

test("mask shape validation rejects wrong mask length", () => {
  const { image, shape, support } = commonFixture();
  const wrong = support.slice(0, -1);
  assert.throws(
    () => locality(image.data, image.data, shape, wrong),
    /mask length/,
  );
});
