// Holiday Engine calendar in the browser: the same dates as the Python seasonal calendar.
// Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as Cal from "../dist/js/layout/holiday/calendar.js";

const checks = JSON.parse(readFileSync(new URL("./helpers/holiday-checks.json", import.meta.url), "utf8"));

test("every sampled day gives the next date Python's calendar gives, or none where Python has none", () => {
  assert.equal(checks.format, "beljour-holiday-checks/1");
  let dated = 0, unknown = 0;
  for (const [region, occasion, variant, offsets] of checks.series) {
    const info = Cal.occasion(occasion);
    const variants = variant ? { [occasion]: variant } : {};
    assert.ok(info, occasion);
    checks.days.forEach((day, i) => {
      const found = Cal.nextOccurrence(occasion, day, region, variants);
      const want = offsets[i];
      if (want === null) { assert.equal(found, null, `${region} ${occasion} ${variant} ${day}`); unknown++; return; }
      assert.ok(found, `${region} ${occasion} ${variant} ${day}`);
      assert.equal(Cal.daysBetween(day, found.start), want, `${region} ${occasion} ${variant} ${day}`);
      dated++;
    });
  }
  assert.ok(dated > 10_000 && unknown > 500, `${dated} dated, ${unknown} unknown`);
});

test("known dates: Thanksgiving by region, both Easters, Hanukkah's eight days, Kwanzaa over New Year", () => {
  assert.equal(Cal.nextOccurrence("thanksgiving", "2026-10-01", "CA").start, "2026-10-12");
  assert.equal(Cal.nextOccurrence("thanksgiving", "2026-10-01", "US").start, "2026-11-26");
  assert.equal(Cal.nextOccurrence("thanksgiving", "2026-10-01", "UK"), null, "no Thanksgiving date in the UK");
  assert.equal(Cal.nextOccurrence("easter", "2027-01-01", "CA").start, "2027-03-28");
  assert.equal(Cal.nextOccurrence("easter", "2027-01-01", "CA", { easter: "orthodox" }).start, "2027-05-02");
  const hanukkah = Cal.nextOccurrence("hanukkah", "2026-12-07", "GLOBAL");
  assert.deepEqual([hanukkah.start, hanukkah.end], ["2026-12-05", "2026-12-12"], "under way counts");
  assert.equal(Cal.nextOccurrence("kwanzaa", "2027-01-01", "CA").start, "2026-12-26");
  assert.equal(Cal.nextOccurrence("new_year", "2026-12-20", "CA", { new_year: "eve" }).start, "2026-12-31");
});

test("table dates stay marked unverified and stop where the cited table stops; nothing is guessed", () => {
  const diwali = Cal.nextOccurrence("diwali", "2026-10-28", "CA");
  assert.equal(diwali.start, "2026-11-08");
  assert.equal(diwali.verified, false);
  assert.match(diwali.source, /^timeanddate\.com/);
  assert.equal(Cal.nextOccurrence("diwali", "2031-01-01", "CA"), null);
  assert.equal(Cal.nextOccurrence("halloween", "2031-01-01", "CA").start, "2031-10-31", "rule dates run on");
  assert.equal(Cal.nextOccurrence("halloween", "2036-01-01", "CA"), null, "past the data, no guess");
});

test("upcoming lists only the wanted occasions inside the window, soonest first", () => {
  const all = Cal.occasions().map((o) => o.id);
  const soon = Cal.upcoming("2026-10-28", "CA", all, 45);
  assert.deepEqual(soon.map((u) => u.occurrence.occasion), ["halloween", "diwali", "bandi_chhor_divas", "gurpurab", "hanukkah"]);
  assert.deepEqual(soon.map((u) => u.daysUntil), [3, 11, 11, 27, 38]);
  assert.deepEqual(Cal.upcoming("2026-10-28", "CA", ["halloween", "christmas"], 45).map((u) => u.occurrence.occasion), ["halloween"]);
  const during = Cal.upcoming("2026-12-08", "CA", ["hanukkah"], 0);
  assert.equal(during.length, 1); assert.equal(during[0].underWay, true); assert.equal(during[0].daysUntil, 0);
});

test("bad input is refused plainly", () => {
  assert.throws(() => Cal.nextOccurrence("halloween", "2026-02-30", "CA"), Cal.CalendarError);
  assert.throws(() => Cal.nextOccurrence("halloween", "28/10/2026", "CA"), Cal.CalendarError);
  assert.throws(() => Cal.nextOccurrence("nope", "2026-10-28", "CA"), Cal.CalendarError);
  assert.throws(() => Cal.occurrencesFor("FR"), Cal.CalendarError);
  assert.throws(() => Cal.occurrencesFor("CA", { easter: "eastern" }), Cal.CalendarError);
  assert.throws(() => Cal.upcoming("2026-10-28", "CA", ["halloween"], 401), Cal.CalendarError);
  assert.equal(Cal.localToday(new Date(2026, 0, 5, 23, 30)), "2026-01-05", "her own calendar day");
});
