import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { test } from "node:test";

import { checkedProportions } from "../dist/js/engines/proportions/guarded.js";
import { GoldenCache, prepare, renderPreview, targets, validateLevel } from "../dist/js/engines/proportions/golden.js";

const vectors = JSON.parse(readFileSync(new URL("../../parity/warp-fill-r5.json", import.meta.url), "utf8"));
const samples = vectors.vectors.filter((v) => v.kernel === "proportions.symmetry");
const fixture = JSON.parse(readFileSync(new URL("../../parity/golden-controls.json", import.meta.url), "utf8"));
const mesh = samples[0].args.points;
function near(actual, expected, tol = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= tol, `${actual} differs from ${expected} by more than ${tol}`);
}

test("recorded drawn-mesh parity is equal between Python and TypeScript", () => {
  assert.equal(fixture.records.length, 3);
  for(const record of fixture.records) {
    const selected = samples.find((v) => v.id === record.face_vector_id);
    assert.ok(selected);
    const plan = prepare(selected.args.points, `golden-vector-${samples.indexOf(selected)}`);
    assert.equal("refused" in plan, false);
    near(plan.beforeDistance, record.before_distance);
    for(const row of record.observations) {
      const outcome = targets(plan,row.level);
      assert.equal(outcome.refused, false);
      near(outcome.targetDistance, row.distance);
      near(outcome.distanceReduction, row.reduction);
      near(outcome.maxMoveIOD, row.move_iod);
      [61,291,152,13,14].forEach((index,i) => {
        near(outcome.points[index][0],row.handles[i][0]);
        near(outcome.points[index][1],row.handles[i][1]);
      });
    }
  }
});

test("level 1 is no image or point edit", () => {
  const p=prepare(mesh,"level-one");
  assert.equal("refused" in p,false);
  const outcome=targets(p,1);
  assert.deepEqual(outcome.points,mesh);
  const source=new Uint8ClampedArray(96*96*4).fill(40);
  const mask=new Float32Array(96*96).fill(1);
  const returned=renderPreview(source,96,96,4,p,1,mask);
  assert.equal("refused" in returned,false);
  assert.deepEqual(returned.image,source);
  assert.equal(outcome.identityProxy,1);
});

test("no level may increase the target distance on a drawn face", () => {
  for(const sample of samples) {
    const p=prepare(sample.args.points, "monotone");
    if("refused" in p) continue;
    let previous=Infinity;
    for(let tick=10;tick<=50;tick++) {
      const outcome=targets(p,tick/10);
      assert.equal(outcome.refused,false);
      assert.ok(outcome.targetDistance<=previous+1e-7);
      previous=outcome.targetDistance;
      assert.ok(outcome.maxMoveIOD<=.0200001);
    }
  }
});

test("the default lock cannot be disabled implicitly and lowered lock is explicit", () => {
  const p=prepare(mesh,"lock");
  const ordinary=targets(p,5);
  const lowered=targets(p,5,false);
  assert.equal(ordinary.identityLock,true);
  assert.equal(lowered.identityLock,false);
  assert.ok(ordinary.identityProxy>=.98-1e-8);
  assert.ok(lowered.maxMoveIOD>=ordinary.maxMoveIOD);
});

test("reused photo revision with changed geometry refuses", () => {
  const cache=new GoldenCache();
  const first=cache.get(mesh,"rev-1");
  assert.equal("refused" in first,false);
  for(const level of [1,2,3,5]) {
    assert.equal(cache.get(mesh,"rev-1"),first);
    assert.equal(targets(first,level).refused,false);
  }
  assert.equal(cache.preparations,1);
  const changed=mesh.map((p)=>[...p]);changed[61][0]++;
  const second=cache.get(changed,"rev-1");
  assert.equal(second.refused,true);
  assert.equal(second.code,"stale_source");
  cache.clear();
  assert.equal("refused" in cache.get(changed,"rev-1"),false);
});

test("strict 1.0-5.0 level validation", () => {
  for(const item of [0,5.1,3.05,1.01,NaN,Infinity,-Infinity]) assert.throws(()=>validateLevel(item));
  for(const item of [1,1.1,2.4,3.3,5]) near(validateLevel(item),item);
});

test("degenerate and non-finite geometry never becomes a quality success", () => {
  const zero=Array.from({length:478},()=>[0,0]);
  const result=checkedProportions(zero);
  assert.equal(result.refused,true);
  const broken=mesh.map(p=>[...p]);broken[40][0]=NaN;
  assert.equal(prepare(broken,"bad").refused,true);
});

test("other person pixels are exact original, including alpha", () => {
  const width=96,height=96, n=width*height;
  const before=new Uint8ClampedArray(n*4);
  const chosen=new Float32Array(n), bystander=new Float32Array(n);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const i=y*width+x;
    for(let c=0;c<3;c++) before[4*i+c]=(x*3+y*4+c*40)%256;
    before[4*i+3]=180;
    if(x>=5 && x<70) chosen[i]=1;
    if(x>=68) bystander[i]=1;
  }
  // Coordinate ratio: the fixture's pixel mesh is 400x500, so scale to this image.
  const scaled=mesh.map(([x,y])=>[x*width/400,y*height/500]);
  const p=prepare(scaled,"raster");
  assert.equal("refused" in p,false);
  const result=renderPreview(before,width,height,4,p,5,chosen,[bystander]);
  assert.equal("refused" in result,false);
  for(let i=0;i<n;i++) {
    const x=i%width;
    if(x<5 || x>=68) {
      for(let c=0;c<4;c++) assert.equal(result.image[i*4+c],before[i*4+c]);
    }
    assert.equal(result.image[4*i+3],180);
  }
});

test("a missing reviewed mask makes the pipeline unavailable", () => {
  const p=prepare(mesh,"mask");
  const source=new Uint8ClampedArray(96*96*4);
  assert.equal(renderPreview(source,96,96,4,p,4,new Float32Array(96*96)).code,"unverified_mask");
  const nan=new Float32Array(96*96).fill(1);nan[0]=NaN;
  assert.equal(renderPreview(source,96,96,4,p,4,nan).refused,true);
});

test("96px CPU preview timing is measured and separately identifiable", () => {
  const pixels=96*96;
  const source=new Uint8ClampedArray(pixels*4);
  for(let i=0;i<pixels;i++){source[4*i]=i%256;source[4*i+3]=255;}
  const p=prepare(mesh.map(([x,y])=>[x*96/400,y*96/500]),"speed");
  const t0=performance.now();
  const r=renderPreview(source,96,96,4,p,3,new Float32Array(pixels).fill(1));
  const elapsedMs=performance.now()-t0;
  assert.equal("refused" in r,false);
  assert.ok(elapsedMs>=0);
  // Box timing is the acceptance authority; this is only an instrumented smoke.
});
