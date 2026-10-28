// Holiday Engine: what's coming up, opt-in for cultural and religious days, a look per occasion
// (her own kept look first), the studio's try route and the Home rail. Local only.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import * as E from "../dist/js/layout/holiday/engine.js";
import * as V from "../dist/js/layout/holiday/view.js";
import { tryStep } from "../dist/js/layout/holiday/try-look.js";
import { occasions } from "../dist/js/layout/holiday/calendar.js";
import { parseHash, applySteps } from "../dist/js/layout/editor-chrome.js";
import { LookStore } from "../dist/js/layout/my-looks.js";
import { MemoryStore } from "../dist/js/session.js";
import { catalogue } from "../dist/js/filters/recipe/registry.js";
import { portraitLook } from "../dist/js/filters/portrait/looks.js";
import { installDOM } from "./helpers/dom.mjs";

const clock = () => new Date("2026-10-20T10:00:00Z");
const look = (store, name, recipe = "C02") => store.save(name, [{ kind: "filters", strength: 30, params: { recipe } }]);

test("by default only secular days come up; cultural and religious ones only after she ticks them", () => {
  const prefs = new E.HolidayPrefsStore(new MemoryStore());
  assert.deepEqual(prefs.get().follow, ["halloween", "thanksgiving", "new_year"]);
  const tags = new E.OccasionTags(null);
  const first = E.comingUp("2026-10-28", prefs.get(), [], tags);
  assert.deepEqual(first.map((c) => c.occurrence.occasion), ["halloween"], "Diwali is not shown unasked");
  prefs.follow("diwali", true);
  const next = E.comingUp("2026-10-28", prefs.get(), [], tags);
  assert.deepEqual(next.map((c) => [c.occurrence.occasion, c.daysUntil, c.kind]), [["halloween", 3, "secular"], ["diwali", 11, "religious"]]);
  assert.match(next[1].dateNote, /hasn't been checked/);
  assert.equal(next[0].dateNote, "");
  for (const o of occasions()) assert.ok(["secular", "cultural", "religious"].includes(E.kindOf(o.id)), o.id);
  assert.equal(E.kindOf("not-listed"), "religious", "an unknown day is never shown unasked");
});

test("region and Western or Orthodox dates follow her choice, and settings survive a reload", () => {
  const kv = new MemoryStore();
  const prefs = new E.HolidayPrefsStore(kv);
  assert.equal(E.comingUp("2026-11-01", prefs.get(), [], new E.OccasionTags(null))[0]?.occurrence.occasion, undefined,
    "Canadian Thanksgiving has passed, Halloween too; New Year is 61 days out");
  prefs.setRegion("US");
  assert.deepEqual(E.comingUp("2026-11-01", prefs.get(), [], new E.OccasionTags(null)).map((c) => c.occurrence.start), ["2026-11-26"]);
  prefs.follow("easter", true);
  prefs.setVariant("easter", "orthodox");
  const again = new E.HolidayPrefsStore(kv).get();
  assert.deepEqual([again.region, again.variants.easter, again.follow.includes("easter")], ["US", "orthodox", true]);
  assert.equal(E.comingUp("2027-04-01", again, [], new E.OccasionTags(null))[0].occurrence.start, "2027-05-02");
  assert.throws(() => prefs.setRegion("FR"), E.HolidayError);
  assert.throws(() => prefs.setVariant("halloween", "eve"), E.HolidayError);
  assert.deepEqual(prefs.reset().follow, ["halloween", "thanksgiving", "new_year"]);
});

test("damaged or blocked storage falls back to the defaults and never throws", () => {
  const kv = new MemoryStore();
  kv.setItem(E.PREFS_KEY, "{not json");
  kv.setItem(E.TAGS_KEY, JSON.stringify({ "look-1234abcd": "nope", "bad id": "halloween", "look-0000ffff": "christmas" }));
  assert.deepEqual(new E.HolidayPrefsStore(kv).get(), E.defaultPrefs());
  const tags = new E.OccasionTags(kv);
  assert.equal(tags.of("look-1234abcd"), null); assert.equal(tags.of("look-0000ffff"), "christmas");
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
  const p = new E.HolidayPrefsStore(blocked);
  assert.equal(p.follow("diwali", true).follow.includes("diwali"), true, "kept for the visit");
  assert.throws(() => E.validatePrefs({ ...E.defaultPrefs(), follow: ["nope"] }), E.HolidayError);
  assert.throws(() => E.validatePrefs({ ...E.defaultPrefs(), format: "other/1" }), E.HolidayError);
});

test("her own look kept for an occasion comes first; otherwise a built look that exists in this build", () => {
  const looks = new LookStore(new MemoryStore(), clock);
  const older = look(looks, "Party one");
  const newer = new LookStore(new MemoryStore(), () => new Date("2026-10-25T10:00:00Z"));
  const kv = new MemoryStore();
  const tags = new E.OccasionTags(kv);
  const all = [older, look(newer, "Party two", "C25")];
  tags.tag(older.id, "halloween"); tags.tag(all[1].id, "halloween");
  const s = E.suggestionFor("halloween", all, tags);
  assert.deepEqual([s.source, s.name, s.hash], ["saved", "Party two", `look=${all[1].id}`], "newest kept look");
  assert.equal(E.suggestionFor("christmas", all, tags).source, "built-in");
  assert.equal(tags.prune([older]), 1);
  assert.equal(E.suggestionFor("halloween", [older], tags).name, "Party one");
  assert.equal(new E.OccasionTags(kv).of(all[1].id), null, "a removed look's tag is gone from storage");
  assert.throws(() => tags.tag("not-a-look", "halloween"), E.HolidayError);
  assert.throws(() => tags.tag(older.id, "nope"), E.HolidayError);
  for (const o of occasions()) {
    const b = E.OCCASION_LOOKS[o.id];
    assert.ok(b, `${o.id} has a look`);
    if (b.studio === "filters") assert.equal(catalogue().get(b.id).name, b.name, o.id);
    else { assert.equal(portraitLook(b.id)?.name, b.name, o.id); assert.equal(b.needsFace, true); }
    assert.doesNotMatch(b.reason, /blessed|holy|sacred|tradition/i, "light only, no claim about the day");
  }
});

test("the try route adds exactly one built look at its own default, and refuses anything else", () => {
  assert.deepEqual(parseHash("#try=filters:C40"), { kind: "try", value: "try=filters:C40" });
  assert.deepEqual(parseHash("#try=portrait:PL13"), { kind: "try", value: "try=portrait:PL13" });
  assert.deepEqual(parseHash("#try=youcam:X1"), { kind: "none" });
  assert.deepEqual(parseHash("#try=filters:C40;x"), { kind: "none" });
  const f = tryStep("try=filters:C40");
  assert.equal(f.name, "Uzès"); assert.equal(f.step.kind, "filters"); assert.equal(f.step.params.recipe, "C40");
  assert.equal(f.step.strength, catalogue().get("C40").defaults.strength);
  const p = tryStep("try=portrait:PL13");
  assert.deepEqual([p.name, p.step.kind, p.step.params.look, p.step.strength], ["Vence", "portrait", "PL13", 30]);
  assert.equal(tryStep("try=filters:C999"), null);
  assert.equal(tryStep("try=portrait:PL99"), null);
  const added = [];
  const editor = { add: (kind, params, strength) => { added.push([kind, params.recipe, strength]); return {}; } };
  assert.deepEqual(applySteps(editor, [f.step]), { added: 1, skipped: [] });
  assert.deepEqual(added, [["filters", "C40", f.step.strength]]);
  assert.equal(E.tryHash("filters", "C40"), "try=filters:C40");
  assert.throws(() => E.tryHash("filters", "<x>"), E.HolidayError);
});

function home() {
  const dom = installDOM();
  const rail = dom.document.createElement("section"); rail.setAttribute("id", "lg-editorial-calendar-rail"); rail.hidden = true;
  const slot = dom.document.createElement("section"); slot.setAttribute("id", "lg-holiday-engine-slot"); slot.hidden = true;
  const season = dom.document.createElement("section"); season.setAttribute("id", "lg-season-book-root"); season.hidden = true;
  rail.append(slot, season); dom.root.append(rail);
  return { ...dom, rail, slot, season };
}

test("Home shows Coming up in the rail, with dates, an unchecked-date note and a look link", () => {
  const page = home();
  try {
    const looks = new LookStore(new MemoryStore(), clock);
    const kv = new MemoryStore();
    const mount = V.mountHolidayEngine(page.document, looks, { store: kv, today: () => "2026-10-28" });
    assert.equal(page.slot.hidden, false); assert.equal(page.rail.hidden, false); assert.equal(page.season.hidden, true);
    const items = page.slot.querySelectorAll(".lg-holiday-item");
    assert.equal(items.length, 1);
    assert.match(items[0].textContent, /Halloween/); assert.match(items[0].textContent, /Sat 31 Oct · in 3 days/);
    assert.equal(items[0].querySelector("a").getAttribute("href"), "studio.html#try=filters:C23");
    const diwali = page.slot.querySelectorAll(".lg-holiday-follow").find((b) => b.value === "diwali");
    assert.equal(diwali.checked, false, "not ticked for her");
    diwali.checked = true; diwali.dispatch("change");
    const now = page.slot.querySelectorAll(".lg-holiday-item");
    assert.equal(now.length, 2); assert.match(now[1].textContent, /hasn't been checked/);
    const saved = looks.save("Night out", [{ kind: "filters", strength: 40, params: { recipe: "C25" } }]);
    mount.tags.tag(saved.id, "halloween"); mount.refresh();
    const first = page.slot.querySelectorAll(".lg-holiday-item")[0];
    assert.match(first.textContent, /Use Night out/);
    assert.equal(first.querySelector("a").getAttribute("href"), `studio.html#look=${saved.id}`);
    assert.match(page.slot.textContent, /Nothing is sent anywhere/);
  } finally { page.restore(); }
});

test("an empty window says so plainly and still offers the chooser; dates format the same everywhere", () => {
  const page = home();
  try {
    V.mountHolidayEngine(page.document, new LookStore(new MemoryStore(), clock), { store: new MemoryStore(), today: () => "2026-11-05" });
    assert.match(page.slot.querySelector(".lg-holiday-empty").textContent, /Nothing you follow in the next 45 days/);
    assert.ok(page.slot.querySelector(".lg-holiday-choose"));
  } finally { page.restore(); }
  assert.equal(V.shortDay("2026-12-05"), "Sat 5 Dec");
  assert.equal(V.mountHolidayEngine({ getElementById: () => null }, new LookStore(null)), null);
});

test("holiday code is local: no network, timers, notifications or HTML injection", () => {
  const dir = new URL("../src/layout/holiday/", import.meta.url);
  for (const name of readdirSync(dir).filter((n) => n.endsWith(".ts"))) {
    const text = readFileSync(new URL(name, dir), "utf8");
    assert.doesNotMatch(text, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|Notification|setInterval|innerHTML/, name);
  }
  const home = readFileSync(new URL("../home.html", import.meta.url), "utf8");
  assert.ok(home.indexOf('id="lg-looks"') < home.indexOf('id="lg-editorial-calendar-rail"'));
});
