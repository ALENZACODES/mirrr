/** Local fibre-colour reading and planning on drawn hair under coloured light, in the browser.
 * Drawn rectangles only; no photographs, product data or supplier names. Author: John Khan.
 */
import assert from "node:assert/strict";
import test from "node:test";
import * as S from "../dist/js/commerce/shade-support.js";
import { delta_e } from "../dist/js/engines/shade/distance.js";
import { COOL, DAY, WARM, drawnHair } from "./r30f-scene.mjs";

test("a neutral card removes most of a colour cast", () => {
  const day = drawnHair(DAY);
  const reference = S.readFibreColour(day.image, day.hair, { neutralMask: day.card });
  for (const cast of [WARM, COOL]) {
    const { image, hair, card } = drawnHair(cast);
    const fixed = S.readFibreColour(image, hair, { neutralMask: card });
    const raw = S.readFibreColour(image, hair);
    assert.equal(fixed.white_mode, "neutral");
    assert.equal(raw.white_mode, "none");
    assert.equal(fixed.pixels, 400);
    assert.ok(delta_e(fixed.lab, reference.lab) < 1);
    assert.ok(delta_e(raw.lab, reference.lab) > 3);
  }
  const warm = drawnHair(WARM);
  assert.equal(S.readFibreColour(warm.image, warm.hair, { backgroundMask: warm.card }).white_mode, "grey_world");
});

test("reading refuses bad inputs", () => {
  const { image, hair, card } = drawnHair(DAY);
  const few = new Uint8Array(hair.length);
  few[29] = 1;
  assert.throws(() => S.readFibreColour(image, few, { neutralMask: card }), RangeError);
  assert.throws(() => S.readFibreColour(image, hair.slice(1)), RangeError);
  assert.throws(() => S.readFibreColour({ ...image, channels: 2 }, hair), RangeError);
  for (const args of [[[30, 8], "neutral"], [[30, 8, 12], "daylight"], [[30, 8, 12], "neutral", 1],
    [[30, 8, 12], "neutral", false, -1]]) assert.throws(() => S.fibreReading(...args), RangeError);
});

test("plans stay at or below the measured level unless a lighter swatch is approved", () => {
  const reading = S.fibreReading([25.4, 7.23, 3.96], "neutral");
  const held = S.planFibreColour(reading);
  assert.equal(held.refused, false);
  assert.equal(held.matches.length, 3);
  assert.ok(held.matches.every((m) => m.record.level <= m.measured_level));
  assert.ok(held.lighter_option.record.level > held.lighter_option.measured_level);
  const approved = S.planFibreColour(reading, { approveLighter: true });
  assert.equal(approved.matches[0].record.id, held.lighter_option.record.id);
  assert.equal(approved.lighter_option, null);
  assert.equal(held.label, S.LABEL);
});

test("drawn photo under warm light plans a hair swatch", () => {
  const { image, hair, card } = drawnHair(WARM);
  const plan = S.planFibreColour(S.readFibreColour(image, hair, { neutralMask: card }), { count: 5 });
  assert.equal(plan.matches.length, 5);
  assert.equal(plan.matches[0].record.surface, "hair");
  assert.ok(plan.matches[0].delta_e < 6);
});

test("coded refusals name no swatch; options are checked", () => {
  const uncorrected = S.planFibreColour(S.fibreReading([30, 8, 12], "none"));
  assert.deepEqual([uncorrected.code, uncorrected.matches.length], ["uncorrected_lighting", 0]);
  const far = S.planFibreColour(S.fibreReading([50, -60, 60], "neutral"));
  assert.deepEqual([far.code, far.matches.length, far.lighter_option], ["too_far", 0, null]);
  const ok = S.fibreReading([30, 8, 12], "neutral");
  for (const options of [{ approveLighter: 1 }, { count: 0 }, { count: 11 }, { count: 2.5 }]) {
    assert.throws(() => S.planFibreColour(ok, options), RangeError);
  }
});
