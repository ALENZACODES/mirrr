import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { GenderLevelEngine, checkedLevel, namedLevel, signalAt } from "../dist/js/engines/gender_look/levels.js";
import { SIGNAL_PRESETS } from "../dist/js/engines/gender_look/presets.js";

const vectors = JSON.parse(readFileSync(new URL("../../parity/gender-levels-r25c.json", import.meta.url), "utf8"));
function scene(tone) {
  const data = new Uint8ClampedArray(32 * 32 * 4);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const index = (y * 32 + x) * 4;
    data[index] = (tone + 2 * x + 3 * y) % 256;
    data[index + 1] = (tone + x + 4 * y) % 256;
    data[index + 2] = (tone + 3 * x + 2 * y) % 256;
    data[index + 3] = (x + y + 167) % 256;
  }
  return { width: 32, height: 32, channels: 4, data };
}
function marks() {
  const brow = new Float32Array(32 * 32);
  const skin = new Float32Array(32 * 32);
  const stubble = new Float32Array(32 * 32);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const index = y * 32 + x;
    brow[index] = y >= 5 && y <= 9 && x >= 5 && x <= 26 ? 1 : 0;
    skin[index] = y >= 8 && y <= 27 && x >= 6 && x <= 25 ? 1 : 0;
    stubble[index] = y >= 21 && y <= 26 && x >= 8 && x <= 23 ? 1 : 0;
  }
  return { brow, skin, stubble };
}
const passthrough = {
  guard(_before, after) {
    return { image: new Uint8ClampedArray(after), similarity: 1, blendedBack: false };
  },
};

test("R25c levels accept the 41 exact tenths and reject off-step/out-of-range", () => {
  for (let tick = 10; tick <= 50; tick++) assert.equal(checkedLevel(tick / 10), tick / 10);
  for (const bad of [0.95, 5.1, 2.25, Infinity, NaN, 0]) assert.throws(() => checkedLevel(bad));
  assert.equal(namedLevel("normal"), 2);
  assert.equal(namedLevel("extra"), 3.5);
  assert.equal(namedLevel("hyper"), 5);
});

test("R25c anchors interpolate every local presentation signal monotonically", () => {
  let previous = signalAt(1);
  for (let tick = 11; tick <= 50; tick++) {
    const row = signalAt(tick / 10);
    for (const key of ["browTint", "browDensity", "skinTexture", "stubbleSignal"]) {
      assert.ok(row[key] + 1e-12 >= previous[key], key);
    }
    assert.equal(row.geometryChange, 0);
    previous = row;
  }
  for (const [level, name] of [[2,"normal"],[3.5,"extra"],[5,"hyper"]]) {
    const actual = signalAt(level);
    for (const field of ["browTint", "browDensity", "skinTexture", "stubbleSignal"]) {
      assert.equal(actual[field], SIGNAL_PRESETS[name][field]);
    }
  }
});

test("R25c generated local Python/TypeScript vectors agree to 1/255", () => {
  for (const row of vectors.cases) {
    const provider = { masks() { return marks(); } };
    const engine = new GenderLevelEngine(provider, passthrough);
    const result = engine.render(scene(row.tone), `tone-${row.tone}`, row.direction, row.level, {
      primaryBox: [0,0,1,1],
    });
    for (let index = 0; index < vectors.samples.length; index++) {
      const [y,x] = vectors.samples[index];
      const got = [...result.data.slice((y * 32 + x) * 4,(y * 32 + x) * 4 + 4)];
      const expected = row.sample[index];
      for (let channel = 0; channel < 4; channel++) {
        assert.ok(Math.abs(got[channel] - expected[channel]) <= (channel === 3 ? 0 : 1),
          `${row.tone} ${row.direction} ${row.level} at ${x},${y}: ` +
          `${channel} ${got[channel]} vs ${expected[channel]}`);
      }
    }
    assert.ok(Math.abs(result.changedShare - row.share) <= 0.07);
  }
});

test("R25c cache observes photo once across five levels; masked second face unchanged", () => {
  let calls = 0;
  const provider = { masks() { calls++; return marks(); } };
  const engine = new GenderLevelEngine(provider, passthrough);
  const image = scene(120);
  for (const level of [1,1.7,2,3.5,5]) {
    const result = engine.render(image,"local-hash","masculine",level,{primaryBox:[0,0,.5,1]});
    for (let y = 0; y < 32; y++) for (let x = 16; x < 32; x++) {
      const offset = (y * 32 + x) * 4;
      assert.deepEqual([...result.data.slice(offset,offset+4)], [...image.data.slice(offset,offset+4)]);
    }
  }
  assert.equal(calls,1);
  const refused = engine.render(image,"local-hash","masculine",5,{primaryBox:null});
  assert.equal(refused.status,"no_mesh");
});

test("R25c all 41 numeric signal levels match Python interpolation", () => {
  const all = JSON.parse(readFileSync(new URL("../../parity/gender-signals-r25c.json",import.meta.url),"utf8"));
  const names = ["browTint","browDensity","skinTexture","stubbleSignal","geometryChange"];
  assert.equal(all.cases.length,41);
  for (const reference of all.cases) {
    const actual = signalAt(reference.level);
    for (let index=0; index<names.length; index++) {
      assert.ok(Math.abs(actual[names[index]]-reference.signals[index])<1e-12,
        `level ${reference.level}: ${names[index]}`);
    }
  }
});
