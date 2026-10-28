/** C18 snapshots in the browser: digests agree with Python; changes are reported.
 * In-house reference data only. Author: John Khan.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as C from "../dist/js/engines/shade/c18.js";
import { loadShadeCatalogue } from "../dist/js/engines/shade/loaders.js";

const P = JSON.parse(readFileSync(new URL("../../parity/skn03-calibration-r35f.json", import.meta.url), "utf8"));

test("three snapshots with the Python digests", async () => {
  for (const kind of C.C18_KINDS) {
    const snap = await C.loadC18Shades(kind);
    assert.equal(snap.digest, P.c18[kind], kind);
    assert.equal(snap.count, { skin: 96, base: 80, hair: 90 }[kind]);
    assert.equal(snap.shades.length, snap.count);
  }
  assert.equal((await C.loadC18Shades("skin")).shades, loadShadeCatalogue("reference").records);
  assert.equal(await C.loadC18Shades(), await C.loadC18Shades("skin"));
});

test("the digest is SHA-256 of the documented text", async () => {
  const snap = await C.loadC18Shades("skin");
  const text = C.canonicalText("skin", snap.shades);
  const lines = text.trimEnd().split("\n");
  assert.equal(lines[0], "beljour-c18-snapshot/1|skin|96");
  assert.equal(lines[1], "LG-01C|Reference 1C|skin|cool|1|1||81.000000|10.270000|9.250000");
  assert.equal(snap.digest, createHash("sha256").update(text, "utf8").digest("hex"));
});

test("current snapshots pass; changed values, order and provenance are reported", async () => {
  for (const kind of C.C18_KINDS) assert.equal((await C.checkC18Shades(await C.loadC18Shades(kind))).ok, true);
  const snap = await C.loadC18Shades("skin");
  const changed = [{ ...snap.shades[0], lab: [81, 10.27, 9.26] }, ...snap.shades.slice(1)];
  const honest = { ...snap, shades: changed, digest: await C.snapshotDigest("skin", changed) };
  assert.deepEqual((await C.checkC18Shades(honest)).problems, ["record_changed:LG-01C", "digest_differs_from_source"]);
  assert.ok((await C.checkC18Shades({ ...snap, shades: changed })).problems.includes("digest_mismatch"));
  const swapped = [snap.shades[1], snap.shades[0], ...snap.shades.slice(2)];
  assert.ok((await C.checkC18Shades({ ...snap, shades: swapped })).problems.includes("order_or_ids_changed"));
  assert.deepEqual((await C.checkC18Shades({ ...snap, source: "elsewhere.json" })).problems, ["source_changed"]);
  const bad = [{ ...snap.shades[0], name: "Reference|1C" }, ...snap.shades.slice(1)];
  assert.ok((await C.checkC18Shades({ ...snap, shades: bad })).problems.includes("record_text_invalid"));
});

test("unknown kinds are refused", async () => {
  for (const kind of ["reference", "", "SKIN"]) await assert.rejects(C.loadC18Shades(kind), RangeError);
});
