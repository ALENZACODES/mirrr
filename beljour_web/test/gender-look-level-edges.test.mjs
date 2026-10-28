import assert from "node:assert/strict";
import { test } from "node:test";
import { GenderLevelEngine } from "../dist/js/engines/gender_look/levels.js";

function photo(seed) {
  const data = new Uint8ClampedArray(32 * 32 * 4);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const index = (y * 32 + x) * 4;
    data[index] = (seed + y * 4 + x) % 256;
    data[index+1] = (seed + y * 2 + x * 3) % 256;
    data[index+2] = (seed + y + x * 5) % 256;
    data[index+3] = (x * 7 + y) % 256;
  }
  return { width: 32, height: 32, channels: 4, data };
}
function masks() {
  const area = new Float32Array(32 * 32);
  for (let i = 0; i < area.length; i++) area[i] = 1;
  return { brow: area, skin: area, stubble: area };
}

test("R25c malicious lock implementation cannot alter alpha or another face", () => {
  const source = { masks };
  const guard = { guard(_before,after) {
    const result = new Uint8ClampedArray(after);
    result.fill(250);
    return { image: result, similarity: 0.5, blendedBack: false };
  } };
  const original = photo(110);
  const engine = new GenderLevelEngine(source,guard);
  const result = engine.render(original,"sha-mock","feminine",5,{primaryBox:[0,0,.5,1]});
  for (let y=0; y<32; y++) for (let x=0; x<32; x++) {
    const offset=(y*32+x)*4;
    assert.equal(result.data[offset+3],original.data[offset+3]);
    if (x>=16) assert.deepEqual([...result.data.slice(offset,offset+3)],
      [...original.data.slice(offset,offset+3)]);
  }
});

test("R25c incorrect masks and incorrect guard byte lengths fail closed", () => {
  const brokenProvider = { masks() { return {brow:new Float32Array(4),skin:new Float32Array(4)}; } };
  const sample = photo(70);
  assert.throws(() => new GenderLevelEngine(brokenProvider).render(sample,"a","feminine",2,{
    primaryBox:[0,0,1,1],
  }),/invalid mask length/);
  const badGuard = { guard() { return {image:new Uint8ClampedArray(10),similarity:1,blendedBack:false}; } };
  assert.throws(() => new GenderLevelEngine({masks},badGuard).render(sample,"b","feminine",2,{
    primaryBox:[0,0,1,1],
  }),/incompatible guarded image/);
});

test("R25c changing the photo hash invalidates cached observations", () => {
  let count = 0;
  const provider = { masks() { count++; return masks(); } };
  const engine = new GenderLevelEngine(provider);
  for (const [hash,seed] of [["hash-1",40],["hash-2",70],["hash-1",40]]) {
    const result = engine.render(photo(seed),hash,"masculine",2,{primaryBox:[0,0,1,1]});
    assert.equal(result.status,"rendered");
  }
  assert.equal(count,2);
});
