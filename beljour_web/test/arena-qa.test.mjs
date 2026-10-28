// Quality arena judging page: bundle checks, the judging session and the judgement format the
// Python side validates (api/plumb_api/arena/judging.py). Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as S from "../dist/js/arena/session.js";
import { DIMENSIONS, JUDGE_DIMENSIONS, REASONS } from "../dist/js/arena/reasons.js";

const hex = (n, len) => n.toString(16).padStart(len, "0");
function bundle(n = 3, stillHer = [true, false, true]) {
  return {
    format: S.BUNDLE_FORMAT, run: "qa1", bundle: "judge-01", question: "Which result is the better version of this filter on this person?",
    reasons: [...REASONS], dimensions: [...DIMENSIONS],
    assignments: Array.from({ length: n }, (_, i) => ({ id: hex(i + 1, 12), filter: "old", label: "Older",
      ref: `images/${hex(100 + i, 16)}.png`, a: `images/${hex(200 + i, 16)}.png`, b: `images/${hex(300 + i, 16)}.png`,
      still_her: stillHer[i % stillHer.length] })),
  };
}

test("the page's fixed lists match the Python constants", () => {
  const py = readFileSync(new URL("../../api/plumb_api/arena/constants.py", import.meta.url), "utf8");
  const block = py.slice(py.indexOf("REASONS: tuple[str, ...] = ("), py.indexOf(")\n", py.indexOf("REASONS: tuple")));
  assert.deepEqual([...block.matchAll(/"([^"]+)",/g)].map((m) => m[1]), [...REASONS]);
  assert.equal(REASONS.length, 9);
  assert.ok(REASONS.includes("Not Her / Erased Marks"));
  assert.ok(!JUDGE_DIMENSIONS.includes("fairness"), "fairness is not scored per image");
  assert.equal(DIMENSIONS.length, 6);
});

test("bundles are checked before judging", () => {
  assert.equal(S.readBundle(bundle()).assignments.length, 3);
  assert.throws(() => S.readBundle({ ...bundle(), format: "x" }), S.BundleError);
  assert.throws(() => S.readBundle({ ...bundle(), reasons: REASONS.slice(1) }), /reasons/);
  const named = bundle(); named.assignments[0].a = "images/ours-v2-old.png";
  assert.throws(() => S.readBundle(named), /random bundle name/, "a producer in a file name is refused");
  const dup = bundle(); dup.assignments[1].id = dup.assignments[0].id;
  assert.throws(() => S.readBundle(dup), /repeated/);
});

test("a judging session records one valid judgement per pair, in order, with undo", () => {
  const s = new S.JudgingSession(S.readBundle(bundle()), "judge.07", true, () => new Date("2026-10-23T07:00:00Z"));
  assert.equal(s.current().id, hex(1, 12));
  assert.equal(s.stillHerAsked(s.current()), true);
  const first = s.answer({ winner: "B", reason: "Too Weak", scores: { A: { identity: 9, still_her: 8 }, B: { realism: 7 } } });
  assert.deepEqual(first, { format: "beljour-judgement/1", assignment: hex(1, 12), judge: "judge.07", kind: "human",
    winner: "B", reason: "Too Weak", scores: { A: { identity: 9, still_her: 8 }, B: { realism: 7 } }, woman_judge: true,
    at: "2026-10-23T07:00:00.000Z" });
  const second = s.answer({ winner: "A", reason: "Plastic Skin", scores: { A: { still_her: 9 } } });
  assert.deepEqual(second.scores, {}, "Still Her isn't recorded on a photo not labelled as a woman's");
  assert.throws(() => s.answer({ winner: "tie", reason: "Too Weak" }), S.SessionError);
  assert.throws(() => s.answer({ winner: "A", reason: "Ugly" }), S.SessionError);
  assert.throws(() => s.answer({ winner: "A", reason: "Too Weak", scores: { A: { identity: 11 } } }), /1 to 10/);
  assert.throws(() => s.answer({ winner: "A", reason: "Too Weak", scores: { A: { fairness: 5 } } }), /isn't scored/);
  assert.equal(s.undo().id, hex(2, 12));
  assert.equal(s.done, 1);
  s.answer({ winner: "A", reason: "Lost Identity" });
  s.answer({ winner: "B", reason: "Uncanny/Scary" });
  assert.equal(s.finished, true);
  assert.equal(s.current(), null);
  assert.throws(() => s.answer({ winner: "A", reason: "Too Weak" }), /Everything/);
  const lines = s.toJsonl().trim().split("\n").map((l) => JSON.parse(l));
  assert.equal(lines.length, 3);
  assert.ok(lines.every((l) => l.kind === "human" && REASONS.includes(l.reason)));
  assert.equal(s.fileName(), "qa1-judge-01-judge.07.jsonl");
});

test("a man judge is never asked Still Her, and answers restore after a reload", () => {
  const s = new S.JudgingSession(S.readBundle(bundle()), "judge.08", false);
  assert.equal(s.stillHerAsked(s.current()), false);
  const rec = s.answer({ winner: "A", reason: "Too Strong", scores: { A: { still_her: 9, identity: 6 } } });
  assert.deepEqual(rec.scores, { A: { identity: 6 } });
  const again = new S.JudgingSession(S.readBundle(bundle()), "judge.08", false);
  assert.equal(again.restore(s.toJsonl()), 1);
  assert.equal(again.done, 1);
  const other = new S.JudgingSession(S.readBundle(bundle()), "someone", false);
  assert.equal(other.restore(s.toJsonl()), 0, "answers of another judge are not restored");
  assert.throws(() => new S.JudgingSession(S.readBundle(bundle()), "x", false), /judge name/);
});

test("keyboard sides", () => {
  assert.equal(S.sideForKey("a"), "A");
  assert.equal(S.sideForKey("2"), "B");
  assert.equal(S.sideForKey("x"), null);
});

test("the judging page loads nothing from the network and hides producers", () => {
  const html = readFileSync(new URL("../arena.html", import.meta.url), "utf8");
  assert.doesNotMatch(html, /https?:\/\//);
  assert.match(html, /webkitdirectory/);
  const src = readFileSync(new URL("../src/arena/judge-view.ts", import.meta.url), "utf8");
  assert.doesNotMatch(src, /fetch\(|XMLHttpRequest|sendBeacon/);
  assert.doesNotMatch(src, /ours|baseline|reference.?app/i, "the page has no idea who made A or B");
});
