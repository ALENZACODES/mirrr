/** Settings-only board receipts in the browser, including the Python-issued vector.
 * Author: John Khan.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { compareLevels } from "../dist/js/commerce/level-board.js";
import { MAX_RECEIPT_BYTES, RECEIPT_VERSION, ReceiptError, dumpsReceipt, issueReceipt, loadsReceipt,
  validateReceipt } from "../dist/js/commerce/board-receipt.js";
import { CHOICES, PYTHON_RECEIPT, noPause, scene } from "./r29f-scene.mjs";

const issued = async (kind = "palette") =>
  issueReceipt(await compareLevels(scene(), CHOICES[kind], { pause: noPause }));

test("receipts round trip and stay unverified", async () => {
  for (const kind of ["fibre", "palette", "short-sides"]) {
    const receipt = await issued(kind);
    assert.equal(receipt.version, RECEIPT_VERSION);
    assert.equal(receipt.verification, "unverified");
    assert.equal(receipt.real_face_status, "not_tested");
    assert.deepEqual(loadsReceipt(dumpsReceipt(receipt)), receipt);
  }
});

test("the Python-issued receipt validates in the browser and matches browser numbers", async () => {
  const python = loadsReceipt(PYTHON_RECEIPT);
  const browser = await issued("palette");
  assert.deepEqual(python.totals, browser.totals);
  assert.deepEqual(python.choice, browser.choice);
  for (let i = 0; i < 5; i++) {
    for (const key of ["status", "changed_pixels", "region_pixels", "max_delta", "identity_blended",
      "guard_applied", "refusal_code"]) assert.equal(python.levels[i][key], browser.levels[i][key], key);
    for (const key of ["changed_share", "mean_delta", "identity_similarity"]) {
      assert.ok(Math.abs(python.levels[i][key] - browser.levels[i][key]) <= 1e-4, key);
    }
  }
});

test("browser-issued text holds no image or private data", async () => {
  const text = dumpsReceipt(await issued("fibre"));
  for (const forbidden of ['"image', '"pixels"', '"mask', '"photo_hash"', '"photoHash"', '"landmarks"',
    '"account', '"secret']) assert.ok(!text.includes(forbidden), forbidden);
  assert.ok(text.length < MAX_RECEIPT_BYTES);
});

test("private fields, forged totals and verification claims are refused", async () => {
  const receipt = await issued();
  for (const extra of [{ photo_hash: "x" }, { image: "x" }, { landmarks: [] }]) {
    assert.throws(() => validateReceipt({ ...receipt, ...extra }), ReceiptError);
  }
  assert.throws(() => validateReceipt({ ...receipt, totals: { ...receipt.totals, rendered: 5, unchanged: 0 } }),
    /totals/);
  for (const change of [{ verification: "verified" }, { real_face_status: "passed" }, { provider_calls: 1 }]) {
    assert.throws(() => validateReceipt({ ...receipt, ...change }), ReceiptError);
  }
});

test("level rows are checked field by field", async () => {
  const receipt = await issued();
  for (const change of [{ level: 2.5 }, { status: "great" }, { changed_pixels: -1 }, { changed_share: 0.12345 },
    { identity_similarity: 2 }, { guard_applied: false }, { refusal_code: "no_mesh" }, { changed_pixels: 0 },
    { max_delta: 300 }, { extra: 1 }]) {
    const levels = receipt.levels.map((row, i) => (i === 2 ? { ...row, ...change } : row));
    assert.throws(() => validateReceipt({ ...receipt, levels }), ReceiptError, JSON.stringify(change));
  }
});

test("text imports refuse duplicate keys, invalid JSON and oversize input", () => {
  assert.throws(() => loadsReceipt(PYTHON_RECEIPT.replace('"kind":"palette"', '"kind":"palette","kind":"palette"')),
    /Duplicate/);
  assert.throws(() => loadsReceipt(PYTHON_RECEIPT.replace('"changed_share":0.0', '"changed_share":NaN')),
    /not valid JSON/);
  assert.throws(() => loadsReceipt(PYTHON_RECEIPT + " ".repeat(MAX_RECEIPT_BYTES)), /too large/);
  assert.throws(() => loadsReceipt(42), ReceiptError);
});
