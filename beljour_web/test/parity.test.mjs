// R3 parity (CONTRACTS.md §16, check Q5): the TypeScript core reproduces every Python
// vector in parity/core-r3.json within 1/255. Author: John Khan.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { KERNELS, TOLERANCE, checkVectors, validate } from "../dist/js/quality/parity.js";

const doc = JSON.parse(readFileSync(new URL("../../parity/core-r3.json", import.meta.url), "utf8"));

test("parity file is well formed and has at least 200 vectors", () => {
  assert.deepEqual(validate(doc), []);
  assert.ok(doc.vectors.length >= 200, `${doc.vectors.length} vectors`);
  assert.equal(TOLERANCE, 1 / 255);
});

test("every TypeScript kernel is exercised", () => {
  const used = new Set(doc.vectors.map((v) => v.kernel));
  assert.deepEqual([...used].sort(), Object.keys(KERNELS).sort());
});

test("TypeScript and Python agree within 1/255 on every vector", () => {
  const results = checkVectors(doc);
  const failures = results.filter((r) => !(r.diff <= TOLERANCE));
  assert.deepEqual(failures, [], failures.slice(0, 5).map((f) => `${f.id}: ${f.diff} ${f.error ?? ""}`).join("\n"));
  const worst = Math.max(...results.map((r) => r.diff));
  assert.ok(worst < 1e-5, `largest difference ${worst}`);
});

test("a tampered expectation is caught", () => {
  const vector = structuredClone(doc.vectors.find((v) => v.kernel === "mask.polygon"));
  const i = vector.expected.data.findIndex((v) => v > 0);
  vector.expected.data[i] += 0.01;
  const [result] = checkVectors({ ...doc, vectors: [vector] });
  assert.ok(result.diff > TOLERANCE);
  const [broken] = checkVectors({ ...doc, vectors: [{ ...vector, kernel: "nope.kernel" }] });
  assert.equal(broken.diff, Infinity);
  assert.match(broken.error, /unknown parity kernel/);
});
