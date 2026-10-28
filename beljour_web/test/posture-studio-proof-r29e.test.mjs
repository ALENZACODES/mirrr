/** R29E studio evidence import: local JSON files, strict verification, stale protection,
 * coverage display, and no effect on the photo, fixes or save. Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { NOT_RUN_COPY } from "../dist/js/body/posture-proof.js";
import { mountBodyPostureStudio } from "../dist/js/body/posture-studio.js";
import { annotate, drawnDecoder, drawnPhoto, jpegEncoder, photoBlob } from "./posture-fixtures-r27e.mjs";
import { cellReport, pythonOutputs } from "./posture-public-fixture-r29e.mjs";
import { withFakeDocument } from "./posture-dom-fake.mjs";

const python = pythonOutputs();
const file = (value) => new Blob([JSON.stringify(value)], { type: "application/json" });

test("an evidence file imports, verifies and shows per-fix counts", () => withFakeDocument(async (document, requests) => {
  const studio = mountBodyPostureStudio(document.createElement("div"));
  assert.ok(studio.element.textContent.includes(NOT_RUN_COPY));
  assert.ok(studio.element.textContent.includes("read on this device only and are not verified"));
  const report = await studio.importEvidenceFile(file(cellReport()));
  assert.equal(report.numeric_status, "CHECKS_OK");
  assert.ok(studio.element.textContent.includes("J16 Ease pelvic tilt: 44 CHECKS_OK."));
  assert.ok(studio.element.textContent.includes("Release: NOT_RUN"));
  studio.dispose();
  assert.equal(requests.length, 0);
}));

test("an internally inconsistent file is refused and the view returns to NOT_RUN", () => withFakeDocument(async (document) => {
  const errors = [];
  const studio = mountBodyPostureStudio(document.createElement("div"), { onError: (m) => errors.push(m) });
  await studio.importEvidenceFile(file(cellReport()));
  const broken = cellReport();
  const index = broken.rows.findIndex((row) => row.slice === "monk" && row.group === "4");
  broken.rows[index] = { ...broken.rows[index], bodies: 61, expected_jobs: 61, measured_jobs: 61, passed_jobs: 61 };
  await assert.rejects(studio.importEvidenceFile(file(broken)));
  assert.equal(studio.evidence, null);
  assert.ok(studio.element.textContent.includes(NOT_RUN_COPY));
  await assert.rejects(studio.importEvidenceFile(new Blob(["{oops"], { type: "application/json" })));
  assert.deepEqual(errors, ["That evidence report was refused.", "That file is not a readable JSON evidence file."]);
  studio.dispose();
}));

test("a slow earlier file never replaces a newer choice", () => withFakeDocument(async (document) => {
  const studio = mountBodyPostureStudio(document.createElement("div"));
  let release;
  const slow = { type: "application/json", size: 2,
    arrayBuffer: () => new Promise((resolve) => { release = () => resolve(new TextEncoder().encode("{}").buffer); }) };
  const first = studio.importEvidenceFile(slow);
  const second = studio.importEvidenceFile(file(cellReport(5)));
  release();
  assert.equal((await second).numeric_status, "UNPROVEN");
  assert.equal(await first, null);
  assert.equal(studio.evidence.numeric_status, "UNPROVEN");
  studio.dispose();
}));

test("evidence and coverage never change the photo, the fixes or the save", () => withFakeDocument(async (document) => {
  const photo = drawnPhoto("side");
  const studio = mountBodyPostureStudio(document.createElement("div"), { decoder: drawnDecoder(photo), encoder: jpegEncoder() });
  await studio.openFile(photoBlob("side"), "side", photo.facing);
  annotate(studio.annotation.intake, photo);
  studio.element.button("J14").click();
  const frame = await studio.release();
  const before = { readiness: studio.readiness, source: new Uint8Array(studio.annotation.intake.source.data),
    buttons: studio.element.byTag("button").map((button) => [button.textContent, button.disabled]) };
  await studio.importEvidenceFile(file(cellReport()));
  if (python) studio.setCoveragePlan(python.coverage);
  assert.deepEqual(studio.readiness, before.readiness);
  assert.deepEqual(studio.annotation.intake.source.data, before.source);
  assert.deepEqual(studio.element.byTag("button").map((button) => [button.textContent, button.disabled]), before.buttons);
  assert.equal(studio.screen.latest(), frame);
  assert.equal((await studio.export()).name, "Posture_J14.jpg");
  studio.dispose();
}));

test("Python evidence and coverage files import into the studio", { skip: !python && "python3 unavailable" }, () =>
  withFakeDocument(async (document) => {
    const studio = mountBodyPostureStudio(document.createElement("div"));
    assert.equal((await studio.importEvidenceFile(file(python.evidence))).numeric_status, "UNPROVEN");
    const plan = await studio.importCoverageFile(file(python.coverage));
    assert.equal(plan.additionalNeeded, 1140);
    assert.ok(studio.element.textContent.includes("at least 1140 more needed"));
    await assert.rejects(studio.importCoverageFile(file({ ...python.coverage, additional_needed: 0 })));
    assert.equal(studio.coverage, null);
    studio.dispose();
  }));

test("the built-in evidence control reads the chosen file", () => withFakeDocument(async (document) => {
  const studio = mountBodyPostureStudio(document.createElement("div"));
  const input = studio.element.find((node) => node.getAttribute?.("aria-label") === "Load a body evidence report (JSON)");
  input.files = [file(cellReport())];
  input.emit("change");
  for (let i = 0; i < 200 && !studio.evidence; i++) await new Promise((resolve) => setImmediate(resolve));
  assert.equal(studio.evidence.numeric_status, "CHECKS_OK");
  studio.dispose();
}));
