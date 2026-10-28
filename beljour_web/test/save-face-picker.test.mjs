import assert from 'node:assert/strict';
import { test } from 'node:test';
import { composeFace, makePicker, pickCounts } from '../dist/js/save/face-picker.js';

const b = (x, y, width, height, score = .95) => ({ x, y, width, height, score });
test('interactive picker defaults to biggest, center breaks exact area tie', () => {
  assert.equal(makePicker([b(1,1,20,20), b(45,45,20,20)], 100,100).primary.index,1);
  assert.equal(makePicker([b(45,45,20,20), b(2,2,21,25)], 100,100).primary.index,1);
});
test('all eligible detections are available to tap, not only the primary', () => {
  const p = makePicker([b(0,0,40,50), b(72,70,21,23)],100,100);
  assert.equal(p.primary.index,0);
  assert.equal(p.tap(.8,.8).index,1);
  assert.equal(p.select(1).untouchedFaces,1);
  assert.equal(p.tap(.6,.6).code,'no_face_at_point');
  assert.equal(p.tap(-1,.5).code,'invalid_tap');
  assert.equal(p.select(9).code,'invalid_selection');
});
test('small confidence, no faces and excessive crowd have explicit non-success', () => {
  assert.equal(makePicker([],100,100).primary.code,'no_face_found');
  assert.equal(makePicker([b(0,0,20,20,.3)],100,100).primary.code,'no_face_found');
  assert.equal(makePicker(Array.from({length:17},(_,i)=>b(i*3,5,3,6)),100,100).primary.code,'too_many_faces');
});
test('selected person changes, another full body and alpha remain original', () => {
  const w=20,h=16, n=w*h;
  const before = new Uint8ClampedArray(n*4);
  const after = new Uint8ClampedArray(n*4);
  const chosen = new Float32Array(n);
  const bystander = new Float32Array(n);
  for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
    const j=y*w+x;
    for(let c=0;c<3;c++) { before[j*4+c]=70; after[j*4+c]=220; }
    before[j*4+3]=180; after[j*4+3]=25;
    if(x>=2 && x<13) chosen[j] = 1;
    if(x>=11) bystander[j]=1;
  }
  const output = composeFace(before,after,chosen,[bystander],w,h);
  for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
    const i=y*w+x;
    assert.equal(output[4*i],x>=2&&x<11?220:70);
    assert.equal(output[4*i+3],180);
  }
  assert.equal(before[0],70);
});
test('invalid masks and buffer sizes refuse', () => {
  const o = new Uint8ClampedArray(4*4*4);
  assert.throws(()=>composeFace(o,o,new Float32Array(16),[],4,4),/verified/);
  assert.throws(()=>composeFace(o,o,new Float32Array(15),[],4,4),/invalid/);
  const bad = new Float32Array(16).fill(1); bad[5]=NaN;
  assert.throws(()=>composeFace(o,o,bad,[],4,4),/invalid/);
});
test('no identity-bearing geometry enters receipt', () => {
  const counts = pickCounts(makePicker([b(2,2,10,11)],32,32).primary,true,true);
  assert.deepEqual(Object.keys(counts).sort(), ['bystandersUnchanged','code','processed','untouchedFaces','verifiedMask','visibleFaces']);
});
