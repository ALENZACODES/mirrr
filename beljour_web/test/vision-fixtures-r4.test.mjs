// R4 fixture contract parity with Python (base64 byte masks, no image data).
// Author: John Khan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createFixture, validateFixture, decodeMask, encodeMask,
         base64ToBytes, bytesToBase64 } from '../dist/js/vision/fixtures.js';
import { floatImage } from '../dist/js/engines/core/buffer.js';
const example=JSON.parse(readFileSync(new URL('../../parity/vision-fixture-r4.json',import.meta.url)));
const imgHash='a'.repeat(64);
function manual(){const mask=floatImage(9,7,1);mask.data.set(Array.from({length:63},(_,i)=>(i%9)/8));return mask;}

 test('Python reference mask passes TypeScript validation and exact checksum',async()=>{
  const parsed=await validateFixture(example);
  assert.equal(parsed.source.author,'John Khan');
  assert.equal(parsed.faces.length,0);
  const bytes=await decodeMask(parsed.masks[0]);
  assert.equal(bytes.length,9*7);
  assert.equal(bytes[0],17);assert.equal(bytes[1],46);
  assert.equal(bytesToBase64(bytes),parsed.masks[0].data);
  assert.deepEqual([...base64ToBytes(parsed.masks[0].data)],[...bytes]);
});

test('recorder creates a manual fixture with no pixels, no filename, release required',async()=>{
  const fixture=await createFixture({releaseRef:'case-123',imageHash:imgHash,width:9,height:7,
    released:true,mode:'manual',masks:[{name:'manual_selection',mask:manual()}]});
  assert.equal(fixture.source.captureMode,'manual');
  assert.equal(fixture.masks.length,1);
  assert.equal(fixture.masks[0].encoding,'u8-base64');
  assert.ok(!Object.hasOwn(fixture,'photo'));
  assert.ok(!JSON.stringify(fixture).includes('image/jpeg'));
  assert.equal((await decodeMask(fixture.masks[0]))[8],255);
  await assert.rejects(createFixture({releaseRef:'case-123',imageHash:imgHash,width:9,height:7,
    released:false,mode:'manual',masks:[{name:'manual_selection',mask:manual()}]}),/signed release/);
});

test('bad user-supplied fixtures are rejected without eval or remote fetch',async()=>{
  const edits=[
    d=>{d.source.releaseRef='../private';},
    d=>{d.source.released=false;},
    d=>{d.source.author='Other';},
    d=>{d.photo='sensitive data';},
    d=>{d.masks[0].sha256='0'.repeat(64);},
    d=>{d.masks[0].data='!!';},
    d=>{d.image.width=999999;},
    d=>{d.masks.push({...d.masks[0]});},
    d=>{d.pose.landmarks=[[0,0,0]];},
  ];
  for(const edit of edits){const value=structuredClone(example);edit(value);await assert.rejects(validateFixture(value));}
});

test('float mask quantizes and round-trips through SHA-256 exactly',async()=>{
  const mask=manual();const encoded=await encodeMask('crown',mask);
  const got=await decodeMask(encoded);
  for(let i=0;i<mask.data.length;i++)assert.equal(got[i],Math.round(mask.data[i]*255));
  assert.equal(await validateFixture({...example,masks:[encoded]}).then(()=>true),true);
  await assert.rejects(encodeMask('wrong/path',mask),/invalid mask name/);
});
