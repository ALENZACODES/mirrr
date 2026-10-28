/** R29E local evidence file import: bounded, strict UTF-8 JSON, latest read wins.
 * Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { EvidenceFileReader, EvidenceFileRefused, MAX_EVIDENCE_FILE_BYTES,
  parseEvidenceFile } from "../dist/js/body/posture-evidence-file.js";

const json = (value, type = "application/json") => new Blob([JSON.stringify(value)], { type });
const refused = (code) => (error) => error instanceof EvidenceFileRefused && error.code === code;

test("a JSON file parses to its value", async () => {
  assert.deepEqual(await parseEvidenceFile(json({ format: "x", rows: [1, 2] })), { format: "x", rows: [1, 2] });
  assert.deepEqual(await parseEvidenceFile(json([1], "")), [1], "files without a media type are allowed");
});

test("wrong types, empty, oversized, bad UTF-8 and bad JSON are refused", async () => {
  await assert.rejects(parseEvidenceFile(json({}, "text/html")), refused("unsupported_evidence_file"));
  await assert.rejects(parseEvidenceFile(new Blob([], { type: "application/json" })), refused("empty_evidence_file"));
  const big = { type: "application/json", size: MAX_EVIDENCE_FILE_BYTES + 1, arrayBuffer: async () => assert.fail("read") };
  await assert.rejects(parseEvidenceFile(big), refused("evidence_file_too_large"));
  await assert.rejects(parseEvidenceFile(new Blob([new Uint8Array([0x7b, 0xff, 0x7d])], { type: "application/json" })),
    refused("invalid_utf8"));
  await assert.rejects(parseEvidenceFile(new Blob(["{not json"], { type: "application/json" })), refused("invalid_json"));
});

test("a slow older read is stale once a newer file is chosen", async () => {
  const reader = new EvidenceFileReader();
  let release;
  const slow = { type: "application/json", size: 2,
    arrayBuffer: () => new Promise((resolve) => { release = () => resolve(new TextEncoder().encode("{}").buffer); }) };
  const first = reader.read(slow);
  const second = reader.read(json({ newer: true }));
  release();
  assert.deepEqual(await second, { status: "done", value: { newer: true } });
  assert.deepEqual(await first, { status: "stale" });
});

test("cancel and dispose make outstanding reads stale; a stale failure is not reported", async () => {
  const reader = new EvidenceFileReader();
  const pending = reader.read(json({ a: 1 }));
  reader.cancel();
  assert.deepEqual(await pending, { status: "stale" });
  const broken = reader.read(new Blob(["{bad"], { type: "application/json" }));
  reader.cancel();
  assert.deepEqual(await broken, { status: "stale" });
  reader.dispose();
  await assert.rejects(reader.read(json({})), /disposed/);
});
