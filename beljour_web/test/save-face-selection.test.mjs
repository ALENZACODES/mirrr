import assert from "node:assert/strict";
import { test } from "node:test";
import { FaceSelectionSession } from "../dist/js/save/face-selection.js";

const faces = [{x:5,y:5,width:15,height:16,score:.95},{x:24,y:10,width:7,height:8,score:.95}];
const mask = (width=40,height=32) => new Float32Array(width*height);
function sample() {
  const m = mask(),b=mask();
  for(let y=0;y<32;y++)for(let x=0;x<40;x++){
    const p=y*40+x;
    if(x>=2&&x<29)m[p]=1;
    if(x>=25)b[p]=1;
  }
  return {m,b};
}
test("new photo selects largest without pretending a mask was validated",()=>{
  const s=new FaceSelectionSession();
  const state=s.newPhoto(faces,40,32);
  assert.equal(state.chosen,0);
  assert.equal(state.verifiedRegion,false);
  assert.equal(state.faceCount,2);
});
test("tapping a different detected person clears prior mask",()=>{
  const s=new FaceSelectionSession();
  const first=s.newPhoto(faces,40,32);
  const {m,b}=sample();
  assert.equal(s.provideMasks(first.revision,m,[b]).verifiedRegion,true);
  assert.equal(s.tap(.67,.45).chosen,1);
  assert.equal(s.state().verifiedRegion,false);
  assert.throws(()=>s.apply(first.revision,new Uint8ClampedArray(40*32*4),new Uint8ClampedArray(40*32*4),40,32));
});
test("reviewed masks are copied and bystander pixels survive",()=>{
  const s=new FaceSelectionSession();
  const first=s.newPhoto(faces,40,32);
  const {m,b}=sample();
  s.provideMasks(first.revision,m,[b]);
  m.fill(0);b.fill(0);
  const input=new Uint8ClampedArray(40*32*4).fill(70);
  const edited=new Uint8ClampedArray(40*32*4).fill(220);
  const result=s.apply(first.revision,input,edited,40,32);
  assert.equal(result[(15*40+10)*4],220);
  assert.equal(result[(15*40+30)*4],70);
  assert.equal(result[0],70);
  assert.equal(input[0],70);
});
test("a new source invalidates previously verified geometry",()=>{
  const s=new FaceSelectionSession();
  const first=s.newPhoto(faces,40,32);
  const {m,b}=sample();
  s.provideMasks(first.revision,m,[b]);
  const second=s.newPhoto([],40,32);
  assert.equal(second.code,"no_face_found");
  assert.throws(()=>s.provideMasks(first.revision,m,[b]));
  assert.throws(()=>s.apply(first.revision,new Uint8ClampedArray(40*32*4),new Uint8ClampedArray(40*32*4),40,32));
});
test("clear removes selection, masks and the old revision",()=>{
  const s=new FaceSelectionSession();
  const first=s.newPhoto(faces,40,32);
  s.clear();
  assert.equal(s.state().chosen,null);
  assert.equal(s.state().verifiedRegion,false);
  assert.ok(s.state().revision>first.revision);
});
