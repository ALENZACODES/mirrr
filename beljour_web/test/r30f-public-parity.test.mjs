/** Browser modules against the Python r30f contract vectors (parity/shade-contract-r30f.json,
 * written by api/tests/test_r30f_public_parity.py). Synthetic data only. Author: John Khan.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as L from "../dist/js/engines/shade/loaders.js";
import * as D from "../dist/js/engines/shade/distance.js";
import * as R from "../dist/js/engines/shade/readiness.js";
import { fibreReading, planFibreColour, readFibreColour } from "../dist/js/commerce/shade-support.js";
import { assessColourStability } from "../dist/js/commerce/colour-stability.js";

const P = JSON.parse(readFileSync(new URL("../../parity/shade-contract-r30f.json", import.meta.url), "utf8"));
const TOL = P.tolerance.delta_e;
const near = (a, b, what, tol = TOL) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} vs ${b}`);
const bytes = (b64) => new Uint8Array(Buffer.from(b64, "base64"));

test("vector set shape", () => {
  assert.equal(P.format, "beljour-shade-contract-r30f/1");
  assert.equal(P.nearest.length, 35);
  assert.equal(P.distances.length, 4);
});

test("catalogues serialise identically", () => {
  for (const kind of L.KINDS) {
    const py = P.catalogues[kind], ts = L.loadShadeCatalogue(kind);
    assert.deepEqual([ts.kind, ts.count, ts.source, ts.note], [py.kind, py.count, py.source, py.note]);
    assert.deepEqual(ts.records.map((r) => ({ ...r, lab: [...r.lab] })), py.records);
  }
});

test("35 nearest selections and four scalar distances", () => {
  for (const c of P.nearest) {
    const ranked = D.rankShades(c.lab, c.kind, { allowLighter: c.allow_lighter });
    assert.equal(ranked.length, c.count, `${c.kind} ${c.lab}`);
    const top = ranked[0] ?? null;
    assert.equal(top?.record.id ?? null, c.id);
    if (top === null) continue;
    near(top.delta_e, c.delta_e, "delta_e");
    near(top.lighter_by, c.lighter_by, "lighter_by");
    assert.equal(top.measured_level, c.measured_level);
  }
  for (const pair of P.distances) {
    near(D.delta_e(pair.first, pair.second), pair.delta_e, `pair ${pair.pair}`);
    near(D.delta_e(pair.first, pair.second), pair.published, `published ${pair.pair}`, 1e-4);
  }
});

test("reference inventory audit", () => {
  for (const kind of ["reference", "base"]) assert.deepEqual(R.checkReferenceCoverage(kind), P.coverage[kind]);
});

test("SKN-03 reports", () => {
  for (const s of P.skn03) {
    const cases = s.cases.map((c) => R.skinCheckCase(c.case_id, c.readings, c.group));
    const [independentLabels, compatibleBaseline, humanReview] = s.evidence;
    assert.deepEqual(R.measureSKN03(cases, { independentLabels, compatibleBaseline, humanReview }), s.report);
  }
});

test("fibre reading from the drawn photo", () => {
  const f = P.fibre_photo;
  const image = { width: f.width, height: f.height, channels: f.channels, data: bytes(f.image) };
  const hair = bytes(f.hair), card = bytes(f.card);
  const got = { neutral: readFibreColour(image, hair, { neutralMask: card }),
    grey_world: readFibreColour(image, hair, { backgroundMask: card }), none: readFibreColour(image, hair) };
  for (const [mode, reading] of Object.entries(got)) {
    const py = f.readings[mode];
    assert.deepEqual([reading.white_mode, reading.clamped, reading.pixels], [py.white_mode, py.clamped, py.pixels]);
    reading.lab.forEach((v, i) => near(v, py.lab[i], `${mode} lab[${i}]`, P.tolerance.lab));
  }
});

test("fibre plans", () => {
  for (const row of P.fibre_plans) {
    const plan = planFibreColour(fibreReading(row.lab, row.white_mode),
      { approveLighter: row.approve_lighter, count: row.count });
    assert.equal(plan.code, row.code);
    assert.deepEqual(plan.matches.map((m) => m.record.id), row.ids);
    plan.matches.forEach((m, i) => near(m.delta_e, row.delta_e[i], "plan delta_e"));
    assert.equal(plan.lighter_option?.record.id ?? null, row.lighter_option);
  }
});

test("colour stability cases", () => {
  for (const row of P.stability) {
    const result = assessColourStability(row.readings.map((r) => fibreReading(r.lab, r.white_mode)),
      { approveLighter: row.approve_lighter });
    assert.equal(result.code, row.code);
    near(result.spread_delta_e, row.spread, "spread");
    assert.deepEqual(result.picks, row.picks);
    assert.equal(result.plan?.matches[0]?.record.id ?? null, row.best);
  }
});
