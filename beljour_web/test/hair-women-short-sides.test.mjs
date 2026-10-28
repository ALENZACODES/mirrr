import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { renderStyle, STYLES, SIMULATION_LABEL } from "../dist/js/engines/hair_women/short-sides.js";
const fixtures = JSON.parse(readFileSync(
  new URL("../../parity/women-short-sides-r25c.json", import.meta.url), "utf8",
));
const geometry = {
  crown: [.5,.06], left_temple: [.25,.32], right_temple: [.75,.32], chin: [.5,.91],
};
function scene(tone=80) {
  const data = new Uint8ClampedArray(64*64*4);
  const hair = new Float32Array(64*64);
  for (let y=0; y<64; y++) for (let x=0; x<64; x++) {
    const index=y*64+x, offset=index*4;
    data[offset]=(tone+2*x+y)%256;
    data[offset+1]=(tone+x+3*y)%256;
    data[offset+2]=(tone+3*x+y)%256;
    data[offset+3]=255;
    hair[index]=y>=7&&y<=59&&x>=6&&x<=57?1:0;
  }
  return [{width:64,height:64,channels:4,data},hair];
}
const passThrough = {
  guard(_before, after) {
    return { image: new Uint8ClampedArray(after), similarity: 1, blendedBack: false };
  },
};

test("R25c style catalogue contains eight original bounded short-side designs", () => {
  assert.equal(STYLES.length,8);
  assert.equal(new Set(STYLES).size,8);
  assert.match(SIMULATION_LABEL,/simulation/);
});

test("R25c Python/TS rendered hair pixels match within one channel", () => {
  for (const row of fixtures.cases) {
    const [photo,hair]=scene();
    const result=renderStyle(photo,hair,geometry,row.style,5,{
      texture:row.texture,primaryFaceBox:[0,0,1,1],identityGuard:passThrough,
    });
    assert.equal(result.rendered,true);
    assert.equal(result.guardCalled,true);
    assert.equal(result.styleId,row.style);
    for (let index=0;index<fixtures.samples.length;index++) {
      const [y,x]=fixtures.samples[index];
      const offset=(y*64+x)*4;
      const expected=row.sample[index];
      for (let channel=0;channel<4;channel++) {
        const value=result.data[offset+channel];
        assert.ok(Math.abs(value-expected[channel])<=(channel===3?0:1),
          `${row.texture} ${row.style} ${x},${y} channel ${channel} ${value} != ${expected[channel]}`);
      }
    }
    assert.ok(Math.abs(result.changedPixelShare-row.share)<0.04);
  }
});

test("R25c level 1 preserves every pixel and higher levels grow permitted coverage", () => {
  for (const style of STYLES) {
    const [photo,hair]=scene();
    let previous=0;
    for (const level of [1,1.7,2,3.5,5]) {
      const result=renderStyle(photo,hair,geometry,style,level,{
        texture:"coily",primaryFaceBox:[0,0,1,1],identityGuard:passThrough,
      });
      const count=result.coverage.filter(value=>value>0).length;
      assert.ok(count>=previous);
      previous=count;
      if (level===1) assert.deepEqual(result.data,photo.data);
      for (let index=0;index<hair.length;index++) {
        if (hair[index]!==0) continue;
        const offset=index*4;
        assert.deepEqual(result.data.slice(offset,offset+4),photo.data.slice(offset,offset+4));
      }
    }
    assert.ok(previous>0);
  }
});

test("R25c separate face selection cannot edit another person", () => {
  const [photo,hair]=scene();
  const result=renderStyle(photo,hair,geometry,"pixie_taper",5,{
    primaryFaceBox:[0,0,.5,1],identityGuard:passThrough,
  });
  for (let y=0;y<64;y++) for (let x=32;x<64;x++) {
    const offset=(y*64+x)*4;
    assert.deepEqual(result.data.slice(offset,offset+4),photo.data.slice(offset,offset+4));
  }
  const refused=renderStyle(photo,hair,null,"pixie_taper",5,{primaryFaceBox:[0,0,1,1]});
  assert.equal(refused.status,"no_mesh");
  assert.equal(refused.rendered,false);
});

test("R25c hair geometry is computed only once through five slider moves", async () => {
  const { HairStyleSession } = await import("../dist/js/engines/hair_women/short-sides.js");
  const [photo,hair] = scene();
  const session = new HairStyleSession(2);
  for (const level of [1,1.7,2,3.5,5]) {
    session.render(photo,hair,geometry,"pixie_taper",level,{
      primaryFaceBox:[0,0,1,1],identityGuard:passThrough,
    });
  }
  assert.equal(session.zoneComputations,1);
  hair.fill(0);
  const corrected = session.render(photo,hair,geometry,"pixie_taper",5,{
    primaryFaceBox:[0,0,1,1],identityGuard:passThrough,
  });
  assert.deepEqual(corrected.data,photo.data);
  session.clear();
  session.render(photo,hair,geometry,"pixie_taper",5,{
    primaryFaceBox:[0,0,1,1],identityGuard:passThrough,
  });
  assert.equal(session.zoneComputations,2);
});

test("R25c hairstyle cache cannot reuse a changed photo or stale selection", async () => {
  const { HairStyleSession } = await import("../dist/js/engines/hair_women/short-sides.js");
  const session = new HairStyleSession(2);
  const [firstPhoto, hair] = scene(40);
  const [secondPhoto] = scene(80);
  const opts = { primaryFaceBox:[0,0,1,1], identityGuard:passThrough };
  session.render(firstPhoto,hair,geometry,"pixie_taper",5,opts);
  session.render(secondPhoto,hair,geometry,"pixie_taper",5,opts);
  assert.equal(session.zoneComputations,2);
  hair.fill(0);
  const corrected=session.render(firstPhoto,hair,geometry,"pixie_taper",5,opts);
  assert.deepEqual(corrected.data,firstPhoto.data);
});
