/** Source-bound encrypted posture recovery on synthetic settings. Author: John Khan. */

import assert from "node:assert/strict";
import test from "node:test";

import { newSessionKey } from "../dist/js/engines/upscale/protected-artifact.js";
import { PostureEditHistory } from "../dist/js/body/posture-history.js";
import { saveProtectedPostureHistory, restoreProtectedPostureHistory } from
  "../dist/js/body/posture-history-protected.js";

const photo = "a".repeat(64);
const salt = crypto.getRandomValues(new Uint8Array(24));

function store() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
}

test("source-bound encrypted settings restore without readable strengths", async () => {
  const key = await newSessionKey();
  const history = new PostureEditHistory();
  history.open(photo);
  history.commit(photo, { fix: "lean", view: "front", level: 3.3, lockLevel: 5 });
  const local = store();
  await saveProtectedPostureHistory(local, "posture", photo, salt, history, "OperatorKey98", key);
  const written = local.getItem("posture");
  assert.ok(written);
  assert.equal(written.includes('"level":3.3'), false);
  assert.equal(written.includes(photo), false);
  const recovered = new PostureEditHistory();
  recovered.open(photo);
  assert.equal(await restoreProtectedPostureHistory(local, "posture", photo, salt,
    recovered, "OperatorKey98", key), true);
  assert.deepEqual(recovered.snapshot.selected, history.snapshot.selected);
});

test("wrong photo and altered storage are rejected", async () => {
  const key = await newSessionKey();
  const history = new PostureEditHistory();
  history.open(photo);
  const local = store();
  await saveProtectedPostureHistory(local, "posture", photo, salt, history, "OperatorKey98", key);
  const other = new PostureEditHistory();
  other.open("b".repeat(64));
  await assert.rejects(restoreProtectedPostureHistory(local, "posture", "b".repeat(64), salt,
    other, "OperatorKey98", key), /context/);
  const value = JSON.parse(local.getItem("posture"));
  value.encrypted = "00".repeat(4);
  local.setItem("posture", JSON.stringify(value));
  await assert.rejects(restoreProtectedPostureHistory(local, "posture", photo, salt,
    history, "OperatorKey98", key), /Malformed/);
});
