/** R29E coverage plan reader: recomputed needs, Python interop and a counts-only view.
 * Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { EvidenceRefused } from "../dist/js/body/posture-proof.js";
import { COVERAGE_FORMAT, checkedCoveragePlan, coveragePlanLines, mountCoveragePlan } from "../dist/js/body/posture-coverage-plan.js";
import { pythonOutputs } from "./posture-public-fixture-r29e.mjs";
import { withFakeDocument } from "./posture-dom-fake.mjs";

const python = pythonOutputs();

/** A plan in the command's shape with `admitted(view, size, tone)` bodies per group. */
function plan(admitted = () => 1) {
  const groups = [];
  for (const view of ["front", "side"]) {
    for (const size of ["small", "medium", "large"]) {
      for (let tone = 1; tone <= 10; tone++) {
        const count = admitted(view, size, String(tone));
        groups.push({ view, body_size: size, monk: String(tone), admitted: count, needed: Math.max(0, 20 - count) });
      }
    }
  }
  const views = {};
  for (const view of ["front", "side"]) {
    const own = groups.filter((group) => group.view === view);
    const sum = own.reduce((total, group) => total + group.admitted, 0);
    views[view] = { admitted: sum, needed: Math.max(own.reduce((total, group) => total + group.needed, 0), 600 - sum) };
  }
  const total = views.front.admitted + views.side.admitted;
  const additional = Math.max(views.front.needed + views.side.needed, 1200 - total);
  return { format: COVERAGE_FORMAT, run: "7".repeat(64), minimums: { per_group: 20, per_view: 600, total: 1200 },
    admitted: total, views, groups, groups_below_minimum: groups.filter((group) => group.needed).length,
    additional_needed: additional, status: additional ? "MORE_BODIES_NEEDED" : "ADMISSION_MINIMUMS_MET",
    measurement_status: "NOT_RUN" };
}

test("one body per group needs 1,140 more", () => {
  const read = checkedCoveragePlan(plan());
  assert.equal(read.additionalNeeded, 1140);
  assert.equal(read.groupsBelowMinimum, 60);
  assert.equal(read.status, "MORE_BODIES_NEEDED");
});

test("surplus cannot offset a gap and every derived number is recomputed", () => {
  const read = checkedCoveragePlan(plan((view, size, tone) => (view === "side" && size === "large" && tone === "9" ? 15 : 25)));
  assert.equal(read.additionalNeeded, 5);
  const lying = plan((view, size, tone) => (view === "side" && size === "large" && tone === "9" ? 15 : 25));
  lying.additional_needed = 0;
  lying.status = "ADMISSION_MINIMUMS_MET";
  assert.throws(() => checkedCoveragePlan(lying), EvidenceRefused);
  const wrongNeed = plan();
  wrongNeed.groups[0].needed = 0;
  assert.throws(() => checkedCoveragePlan(wrongNeed), /inconsistent_coverage_plan/);
});

test("extra attributes, wrong groups and measurement claims are refused", () => {
  assert.throws(() => checkedCoveragePlan({ ...plan(), photos: [] }), /unexpected_coverage_attributes/);
  const withHash = plan();
  withHash.groups[3] = { ...withHash.groups[3], photo_sha256: "a".repeat(64) };
  assert.throws(() => checkedCoveragePlan(withHash), /unexpected_coverage_attributes/);
  const reordered = plan();
  [reordered.groups[0], reordered.groups[1]] = [reordered.groups[1], reordered.groups[0]];
  assert.throws(() => checkedCoveragePlan(reordered), /unregistered_coverage_group/);
  assert.throws(() => checkedCoveragePlan({ ...plan(), measurement_status: "PASS" }), /unsupported_coverage_plan/);
});

test("the Python coverage plan is accepted with 1,140 missing", { skip: !python && "python3 unavailable" }, () => {
  assert.equal(checkedCoveragePlan(python.coverage).additionalNeeded, 1140);
});

test("the display shows counts and a lower-bound caveat only", () => withFakeDocument(async (document) => {
  const view = mountCoveragePlan(document.createElement("div"));
  assert.match(view.element.textContent, /no plan loaded/);
  view.show(plan());
  assert.match(view.element.textContent, /at least 1140 more needed/);
  assert.match(view.element.textContent, /lower bound/);
  assert.throws(() => view.show({}), EvidenceRefused);
  assert.equal(view.plan, null);
  assert.deepEqual(coveragePlanLines(null), ["Body-set coverage: no plan loaded."]);
  view.dispose();
}));
