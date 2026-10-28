// R5 parity (CONTRACTS.md §16, check Q5): the TypeScript warp, fill and Q12 kernels
// reproduce every Python vector in parity/warp-fill-r5.json, and the TypeScript warp/fill
// quality reports match the Python ones (Q3, Q4, Q12 on synthetic grids). Author: John Khan.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { checkVectorsR5, KERNELS_R5, validateR5 } from "../dist/js/quality/warp-parity.js";
import { maxAbsDifference } from "../dist/js/quality/metrics.js";
import { validateReport } from "../dist/js/quality/report.js";
import { reports, runFill, runWarp } from "../dist/js/quality/warpfill.js";

const doc = JSON.parse(readFileSync(new URL("../../parity/warp-fill-r5.json", import.meta.url), "utf8"));
const python = JSON.parse(readFileSync(new URL("../../parity/warpfill-report-python.json", import.meta.url), "utf8"));
const TOL = 1 / 255;

test("R5 parity file is well formed and covers every TypeScript kernel", () => {
  assert.deepEqual(validateR5(doc), []);
  assert.ok(doc.vectors.length >= 80, `${doc.vectors.length} vectors`);
  assert.deepEqual([...new Set(doc.vectors.map((v) => v.kernel))].sort(), Object.keys(KERNELS_R5).sort());
});

test("TypeScript and Python agree within 1/255 on every R5 vector; integer outputs exactly", () => {
  const results = checkVectorsR5(doc);
  const failures = results.filter((r) => !(r.diff <= TOL));
  assert.deepEqual(failures, [], failures.slice(0, 5).map((f) => `${f.id}: ${f.diff} ${f.error ?? ""}`).join("\n"));
  for (const r of results) {
    if (["warp.delaunay", "warp.triangle_flips", "fill.patchmatch", "fill.onion_peel", "fill.xorshift", "quality.grid_scene"].includes(r.kernel)) {
      assert.equal(r.diff, 0, r.id);
    }
  }
  const worst = Math.max(...results.map((r) => r.diff));
  assert.ok(worst < 1e-5, `largest difference ${worst}`);
});

test("a tampered R5 expectation is caught", () => {
  const vector = structuredClone(doc.vectors.find((v) => v.kernel === "warp.delaunay"));
  vector.expected[0][1] += 1;
  assert.ok(checkVectorsR5({ ...doc, vectors: [vector] })[0].diff >= 1);
  const [broken] = checkVectorsR5({ ...doc, vectors: [{ ...vector, kernel: "warp.nope" }] });
  assert.equal(broken.diff, Infinity);
});

test("warp scenarios pass Q3, Q4, Q12 and Q1 on the synthetic grid body", () => {
  for (const s of runWarp()) {
    for (const c of s.checks) assert.ok(c.passed, `${s.id} ${c.code} ${JSON.stringify(c.measured)}`);
    assert.ok(s.extra.max_move > 1, s.id);
  }
});

test("fill scenarios pass Q1, Q4 (and Q12 through the hole on the grid)", () => {
  for (const s of runFill()) for (const c of s.checks) assert.ok(c.passed, `${s.id} ${c.code} ${JSON.stringify(c.measured)}`);
});

test("TypeScript warp and fill reports match the Python reports", () => {
  const ts = reports();
  for (const tool of ["warp", "fill"]) {
    assert.deepEqual(validateReport(ts[tool]), []);
    assert.deepEqual(validateReport(python[tool]), []);
    assert.equal(python[tool].language, "python");
    assert.deepEqual(ts[tool].summary, python[tool].summary);
    assert.equal(ts[tool].summary.failed, 0);
    ts[tool].photos.forEach((photo, i) => {
      const other = python[tool].photos[i];
      assert.equal(photo.photo, other.photo);
      photo.checks.forEach((c, j) => {
        assert.equal(c.code, other.checks[j].code);
        assert.equal(c.passed, other.checks[j].passed);
        for (const [key, value] of Object.entries(c.measured)) {
          if (typeof value === "string") assert.equal(value, other.checks[j].measured[key]);
          else assert.ok(maxAbsDifference(value, other.checks[j].measured[key]) <= TOL, `${photo.photo} ${c.code} ${key}`);
        }
      });
    });
  }
});
