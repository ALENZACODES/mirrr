// R8 background styling state machine; no provider client or live calls. John Khan.
import assert from "node:assert/strict";
import { test } from "node:test";
import { performStyling, finishedImage } from "../dist/js/ui/styling-tasks.js";

const quote = (rest = {}) => ({ feature: "makeup-vto", units: 1, cached: false, live: true,
  scope: "youcam", data_flow: "sent to YouCam, deleted after the result",
  visit_units_left: 6, visit_units_used: 0, visit_units_cap: 6, visit_units_after: 5,
  daily_units_left: 80, pricing_verified: true, can_apply: true, unavailable_reason: null,
  is_estimate: true, ...rest });
const choice = { photo_id: "photo0001", action: "makeup", lip_id: "L01" };

function fake({ price = quote(), start = { status: "running", request_key: "a1b2", ticket: null }, statuses = [] } = {}) {
  const calls = []; let n = 0;
  return { calls,
    quote: async (body) => { calls.push(["quote", body]); return price; },
    startTask: async (body) => { calls.push(["start", body]); return start; },
    task: async (key) => { calls.push(["poll", key]); return statuses[Math.min(n++, statuses.length - 1)]; },
  };
}

test("styling quotes happen before task creation, polls use the same request key", async () => {
  const t = fake({ statuses: [
    { status: "running", request_key: "a1b2" }, { status: "running", request_key: "a1b2" },
    { status: "done", request_key: "a1b2", image: "data:image/jpeg;base64,a" },
  ] });
  const updates = [];
  const result = await performStyling(t, choice, { sleep: async () => {}, onUpdate: (v) => updates.push(v) });
  assert.equal(result.status, "done");
  assert.equal(t.calls[0][0], "quote"); assert.equal(t.calls[1][0], "start");
  assert.deepEqual(t.calls.slice(2).map((item) => item[0]), ["poll", "poll", "poll"]);
  assert.equal(updates.at(-1), "Styling ready");
});

test("quote with disabled flag never starts a task", async () => {
  const t = fake({ price: quote({ can_apply: false, unavailable_reason: "Not available" }) });
  await assert.rejects(performStyling(t, choice), /Not available/);
  assert.deepEqual(t.calls.map((v) => v[0]), ["quote"]);
});

test("only YouCam makeup and styling can use the task transport", async () => {
  const t = fake({ price: quote({ scope: "local" }) });
  await assert.rejects(performStyling(t, choice), /approved/);
  assert.equal(t.calls.length, 1);
});

test("done start is fetched via task_get; no second creation and zero cached price", async () => {
  const t = fake({ price: quote({ units: 0, cached: true }),
    start: { status: "done", request_key: "cached1", ticket: null },
    statuses: [{ status: "done", request_key: "cached1", image: "data:image/jpeg;base64,b" }] });
  assert.equal((await performStyling(t, choice)).status, "done");
  assert.deepEqual(t.calls.map((v) => v[0]), ["quote", "start", "poll"]);
});

test("ticket is remembered while the task is pending and removed on success", async () => {
  const remembered = [], forgotten = [], ticket = { task_id: "x", request_key: "x", sig: "s" };
  const t = fake({ start: { status: "running", request_key: "x", ticket },
    statuses: [{ status: "done", request_key: "x", image: "data:image/jpeg;base64,QQ==" }] });
  await performStyling(t, choice, { remember: (t) => remembered.push(t.ticket), forget: (k) => forgotten.push(k) });
  assert.deepEqual(remembered, [ticket]); assert.deepEqual(forgotten, ["x"]);
});

test("still running after timeout leaves the recovery ticket in place", async () => {
  const forgotten = [], t = fake({ statuses: [{ status: "running", request_key: "a1b2" }] });
  await assert.rejects(performStyling(t, choice, { tries: 3, sleep: async () => {}, forget: (key) => forgotten.push(key) }), /still running/);
  assert.equal(forgotten.length, 0);
});

test("ambiguous failures are not retried or hidden from the user", async () => {
  const t = fake({ statuses: [{ status: "ambiguous", request_key: "a1b2", error: "lost creation acknowledgement" }] });
  await assert.rejects(performStyling(t, choice), /may have been charged/);
  assert.equal(t.calls.filter((v) => v[0] === "start").length, 1);
});

test("a missing image fails explicitly; failed and expired statuses are explanatory", () => {
  assert.throws(() => finishedImage({ status: "done", request_key: "1" }), /no image/);
  assert.throws(() => finishedImage({ status: "failed", request_key: "2", error: "provider unavailable" }), /provider unavailable/);
  assert.throws(() => finishedImage({ status: "expired", request_key: "3" }), /expired/);
  assert.equal(finishedImage({ status: "done", request_key: "4", image: "data:img" }), "data:img");
});
