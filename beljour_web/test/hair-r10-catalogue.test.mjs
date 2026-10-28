// R10 Hair Studio: source integrity, filtering, quick looks, 0-100 and no fake outputs.
// Offline: catalogue entries are locally authored structured data. No reference-app or other third-party assets.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import * as C from "../dist/js/ui/studios/hair/model.js";
import { HairSession, ONE_TAP_HAIR } from "../dist/js/ui/studios/hair/session.js";
import * as R from "../dist/js/ui/studios/hair/replay.js";
import * as V from "../dist/js/ui/studios/hair/variants.js";

const RECORD = JSON.parse(readFileSync("../api/plumb_api/styling/catalogue.json", "utf8"));
const sha = (buf) => createHash("sha256").update(buf).digest("hex");

function offline(fn) {
  const prev = globalThis.fetch;
  let sent = 0;
  globalThis.fetch = () => { sent++; throw new Error("Network calls forbidden in R10 catalogue tests"); };
  try { fn(); } finally { globalThis.fetch = prev; }
  assert.equal(sent, 0);
}

test("catalogue matches the authored source across the documented groups", () => {
  assert.equal(C.HAIR_STYLES.length, RECORD.styles.length);
  assert.deepEqual([...C.HAIR_STYLES], RECORD.styles);
  assert.equal(C.HAIR_GROUPS.length, 8);
  assert.equal(C.guardCatalogue().length, 0);
  assert.equal(C.catalogueSummary().s1Synthetic, 12);
  assert.equal(C.catalogueSummary().concepts, RECORD.styles.filter((s) => s.source === "inspiration").length);
  assert.equal(C.catalogueSummary().verifiedLive, 0);
  const counts = Object.fromEntries(RECORD.groups.map((group) => [group.id,
    RECORD.styles.filter((row) => row.group === group.id).length]));
  for (const group of RECORD.groups) {
    const min = group.id === "short-sides" ? 80 : 4;
    assert.ok(counts[group.id] >= min, `${group.id} needs at least ${min} vetted concepts`);
  }
  assert.ok(RECORD.styles.filter((row) => row.tags.includes("fade")).length >= 10);
  assert.ok(RECORD.styles.filter((row) => row.group === "pixie").length >= 5);

});

test("single authored catalogue compiles from Python data without a runtime fetch", () => offline(() => {
  assert.ok(C.HAIR_STYLES.every((item) => item.id && item.name && item.group));
  assert.equal(new Set(C.HAIR_STYLES.map((item) => item.id)).size, RECORD.styles.length);
  assert.ok(C.HAIR_GROUPS.every((g) => C.HAIR_STYLES.some((s) => s.group === g.id)));
}));

test("short sides, pixies, bobs, protective styles and long cuts exist", () => {
  for (const name of ["short-sides", "pixie", "bob", "layers", "curls", "bangs", "protective", "formal"]) {
    assert.ok(C.groupCounts().find((g) => g.name === name)?.count >= 4, name);
  }
  assert.ok(C.catalogueSummary().shortStyles >= 24);
  assert.ok(C.catalogueSummary().shortSides >= 10);
});

for (const group of C.HAIR_GROUPS) {
  test(`group '${group.title}' selector produces only styles from that group`, () => offline(() => {
    const got = C.filteredStyles({ ...C.DEFAULT_QUERY, group: group.id });
    assert.ok(got.length > 0);
    assert.ok(got.every((s) => s.group === group.id));
    assert.ok(got.every((s) => s.name.length > 2));
  }));
}

for (const texture of C.HAIR_TEXTURES) {
  test(`${texture} hair texture filter includes only compatible references`, () => {
    const got = C.filteredStyles({ ...C.DEFAULT_QUERY, texture });
    assert.ok(got.length > 0);
    assert.ok(got.every((style) => style.textures.includes(texture)));
  });
}

for (const length of C.HAIR_LENGTHS) {
  test(`${length} cut length filter is not a gender restriction`, () => {
    const got = C.filteredStyles({ ...C.DEFAULT_QUERY, length });
    assert.ok(got.length > 0);
    assert.ok(got.every((s) => s.lengths.includes(length)));
    assert.ok(got.every((s) => !["male-only", "female-only"].some((tag) => s.tags.includes(tag))));
  });
}

test("search is case-insensitive, combinations intersect and impossible queries are empty", () => {
  assert.ok(C.filteredStyles({ ...C.DEFAULT_QUERY, term: "FADE" }).length > 0);
  assert.ok(C.filteredStyles({ ...C.DEFAULT_QUERY, term: "bob" }).length > 0);
  assert.ok(C.filteredStyles({ ...C.DEFAULT_QUERY, group: "short-sides", length: "short" }).length > 0);
  assert.equal(C.filteredStyles({ ...C.DEFAULT_QUERY, term: "no-match-abc-987" }).length, 0);
  assert.throws(() => C.filteredStyles({ ...C.DEFAULT_QUERY, term: "x".repeat(81) }), RangeError);
});

test("source types are never silently treated as live YouCam templates", () => {
  const recorded = C.HAIR_STYLES.filter((s) => s.source === "synthetic-s1");
  const ideas = C.HAIR_STYLES.filter((s) => s.source === "inspiration");
  assert.equal(recorded.length, 12);
  assert.equal(ideas.length, RECORD.styles.filter((s) => s.source === "inspiration").length);
  assert.ok(recorded.every((s) => C.liveTemplateId(s.id, new Set()) === null));
  assert.ok(ideas.every((s) => C.liveTemplateId(s.id, new Set([s.id])) === null));
  assert.ok(ideas.every((s) => s.template_id === null));
  assert.ok(ideas.every((s) => /no YouCam template|Cut idea/i.test(C.sourceLabel(s))));
  assert.ok(recorded.every((s) => /unverified/i.test(C.sourceLabel(s))));
});

test("verified IDs are explicit test inputs, never the default project setting", () => {
  assert.equal(C.liveTemplateId("tpl-bob", new Set()), null);
  assert.equal(C.liveTemplateId("tpl-bob", new Set(["tpl-bob"])), "tpl-bob");
  assert.equal(C.liveTemplateId("not-a-style", new Set(["not-a-style"])), null);
});

test("strength clamps to 0..100; non-finite strength is rejected", () => {
  for (const [raw, expected] of [[0, 0], [12.6, 13], [25, 25], [100, 100], [200, 100], [-100, 0]]) {
    assert.equal(C.clampStrength(raw), expected);
  }
  for (const value of [NaN, Infinity, -Infinity]) assert.throws(() => C.clampStrength(value), RangeError);
  const selection = C.defaultSelection();
  assert.equal(selection.strength, 30);
  assert.equal(selection.keepColour, true);
  assert.equal(selection.referenceRights, false);
  assert.deepEqual(selection.adjuncts, { bangs: 0, curl: 0, extension: 0, volume: 0 });
});

test("ten one-tap looks are deliberate opt-in planning actions", () => offline(() => {
  assert.equal(ONE_TAP_HAIR.length, 10);
  assert.ok(ONE_TAP_HAIR.every((s) => C.styleById(s.style)));
  assert.ok(ONE_TAP_HAIR.every((s) => s.strength <= 30));
  const session = new HairSession();
  for (const look of ONE_TAP_HAIR) {
    session.oneTap(look.id);
    assert.equal(session.state.selection.styleId, look.style);
    assert.equal(session.state.selection.strength, look.strength);
    assert.equal(session.state.preview.synthetic, true);
    assert.match(session.state.note, /one synthetic sample|quick styling plan/i);
  }
}));

test("a new selection never fabricates an image for an unrendered inspiration", () => offline(() => {
  const session = new HairSession();
  const idea = C.HAIR_STYLES.find((s) => s.source === "inspiration");
  session.choose(idea.id);
  assert.equal(session.state.preview.image, null);
  assert.equal(session.state.preview.status, "none");
  assert.match(session.state.note, /reference concept/i);
  session.choose("tpl-bob");
  assert.equal(session.state.preview.status, "sample");
  assert.equal(session.state.preview.synthetic, true);
  assert.match(session.state.preview.provenance, /Synthetic/);
}));

test("subscribers receive independent selection snapshots and can unsubscribe", () => {
  const session = new HairSession();
  let calls = 0;
  const unbind = session.subscribe((s) => {
    calls++;
    s.selection.adjuncts.bangs = 999;
    s.favourites.push("local-only-copy");
  });
  session.setAdjunct("bangs", 25);
  assert.equal(session.state.selection.adjuncts.bangs, 25);
  assert.equal(session.state.favourites.includes("local-only-copy"), false);
  assert.ok(calls >= 2);
  unbind();
  const before = calls;
  session.setStrength(33);
  assert.equal(calls, before);
});

test("selection and favourites do not leak reference bytes or photos into history", () => {
  const session = new HairSession();
  session.toggleFavourite("tpl-bob");
  session.setReference({ fileName: "reference.jpg", mime: "image/jpeg", size: 1234, localPreview: "blob:local" });
  assert.equal(session.state.selection.referenceRights, false);
  session.setReferenceRights(true);
  assert.equal(session.state.selection.referenceRights, true);
  session.choose("tpl-pixie");
  assert.equal(session.state.selection.referenceRights, false);
  assert.equal(session.state.selection.reference, null);
  assert.ok(session.state.favourites.includes("tpl-bob"));
  assert.ok(!JSON.stringify(session.state).includes("YOUCAM_API_KEY"));
});

test("reference rights always reset on a new reference image", () => {
  const session = new HairSession();
  const reference = { fileName: "one.png", mime: "image/png", size: 199, localPreview: "blob:abc" };
  session.setReference(reference);
  session.setReferenceRights(true);
  assert.equal(session.state.selection.referenceRights, true);
  session.setReference({ ...reference, fileName: "two.png" });
  assert.equal(session.state.selection.referenceRights, false);
  session.setReference(null);
  session.setReferenceRights(true);
  assert.equal(session.state.selection.referenceRights, false);
});

test("reset undoes opt-in styling strength and removes a temporary reference", () => {
  const session = new HairSession();
  session.setAdjunct("volume", 99);
  session.setKeepColour(false);
  session.setStrength(100);
  session.setReference({ fileName: "ref", mime: "image/jpeg", size: 4, localPreview: "blob:ref" });
  session.reset();
  assert.equal(session.state.selection.strength, 30);
  assert.deepEqual(session.state.selection.adjuncts, { bangs: 0, curl: 0, extension: 0, volume: 0 });
  assert.equal(session.state.selection.keepColour, true);
  assert.equal(session.state.selection.referenceRights, false);
});

test("one synthetic cassette is installed as a static image and has a before source", () => {
  assert.equal(R.HAIR_REPLAY.source, "synthetic");
  assert.equal(R.replayChecklist().providerCalls, 0);
  assert.equal(R.replayChecklist().score, null);
  assert.equal(R.replayChecklist().resultCount, 1);
  assert.equal(R.replaySample().synthetic, true);
  assert.match(R.replaySample().provenance, /Synthetic/);
  assert.ok(existsSync("dist/hair-assets/s2-hairstyle-synthetic.jpeg"));
  assert.ok(existsSync("dist/hair-assets/before-hairstyle-synthetic.jpeg"));
  assert.equal(sha(readFileSync("dist/hair-assets/s2-hairstyle-synthetic.jpeg")),
    sha(readFileSync("../api/plumb_api/demo/cassettes/s2_hairstyle.blob1.jpeg")));
});

test("a real result needs affirmative provider provenance, not a data URL alone", () => {
  const valid = { status: "done", image: "data:image/jpeg;base64,QUJD", provenance: { provider: "youcam", synthetic: false } };
  assert.equal(R.liveHairResult(valid, "Test").status, "live");
  assert.throws(() => R.liveHairResult({ ...valid, provenance: { provider: "local" } }, "Test"), /no approved YouCam/);
  assert.throws(() => R.liveHairResult({ ...valid, image: "https://remote.example/portrait.jpg" }, "Test"), /Unexpected image data/);
  assert.equal(R.liveHairResult({ ...valid, status: "running" }, "Test").status, "error");
  assert.equal(R.liveHairResult({ ...valid, provenance: { provider: "youcam", synthetic: true } }, "Test").synthetic, true);
});

test("a 2x2 planning board never copies one synthetic replay across four hairstyles", () => offline(() => {
  const state = new HairSession().state;
  assert.equal(state.board.size, 4);
  assert.equal(state.board.tiles.length, 4);
  assert.equal(state.board.ready, 0);
  assert.equal(state.board.unrendered, 4);
  assert.ok(state.board.tiles.every((s) => s.resultUrl === null));
}));

test("9-slot board after selecting extra ideas leaves empty slots honestly empty", () => {
  const session = new HairSession();
  session.setGridSize(9);
  assert.equal(session.state.board.tiles.length, 9);
  assert.ok(session.state.board.tiles.some((s) => s.state === "empty"));
  session.addToBoard("idea-001");
  assert.ok(session.state.board.tiles.some((s) => s.state === "inspiration"));
  assert.equal(session.state.board.unrendered, 9);
  assert.equal(session.state.board.ready, 0);
});

test("missing, duplicate and unknown variant slots are defended", () => {
  const board = V.variants({ gridSize: 4, selected: ["tpl-bob", "tpl-bob", "tpl-pixie", "wrong"] });
  assert.deepEqual(board.tiles.map((t) => t.styleId), ["tpl-bob", "tpl-pixie", "", ""]);
  assert.throws(() => V.variants({ gridSize: 5, selected: [] }), RangeError);
  assert.throws(() => V.withResult(board, 5, "hair-assets/sample.jpg", "synthetic"), RangeError);
  assert.throws(() => V.withResult(board, 0, "https://cdn.example/result.jpg", "youcam"), RangeError);
  assert.throws(() => V.withResult(board, 0, "hair-assets/sample.jpg", "youcam"), RangeError);
});

test("positive adjuncts only count explicitly nonzero controls; preview is free", () => {
  assert.deepEqual(V.positiveAdjuncts({ bangs: 0, curl: 25, extension: 0, volume: 45 }), ["curl", "volume"]);
  assert.deepEqual(V.positiveAdjuncts({ bangs: 0 }), []);
  assert.throws(() => V.positiveAdjuncts({ skin: 77 }), RangeError);
  assert.ok(V.estimateHairUnits(2, ["curl", "volume"]) > 2);
  assert.equal(V.variants({ gridSize: 9, selected: ["tpl-bob"] }).ready, 0);
});
