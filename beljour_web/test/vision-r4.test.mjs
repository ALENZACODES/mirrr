// R4 E05 worker geometry, multi-face tracking, mocked MediaPipe and offline bridge.
// Author: John Khan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { BrowserModelRegistry } from '../dist/js/vision/model-registry.js';
import { VisionWorkerClient } from '../dist/js/vision/client.js';
import { FaceTracker, normaliseFaces, selectFace, headPoseFromMesh, boundsFromMesh,
         boxIoU } from '../dist/js/vision/geometry.js';
import { requireVisionRequest,transferResponse } from '../dist/js/vision/protocol.js';
import { MediaPipeRunners } from '../dist/js/vision/runners.js';
const fixture=JSON.parse(readFileSync(new URL('../../parity/face-regions-r4.json',import.meta.url))).cases[0];
const mesh=fixture.landmarks.map(([x,y,z])=>({x,y,z}));
const shifted=mesh.map((p)=>({...p,x:p.x+0.20}));
const fakeModel={id:'fake-model',task:'face-landmarks',filename:'fake.task',
  url:'https://storage.googleapis.com/mediapipe-models/face_landmarker/fake.task',sha256:'c'.repeat(64),bytes:10,
  licenceName:'test',licence:'MIT',status:'allowed',runsOn:'browser',note:'not fetched'};
const registered=new BrowserModelRegistry({format:'beljour-models/1',version:1,models:[fakeModel]},
  {test:{licence:'MIT',status:'allowed',urls:['https://storage.googleapis.com/mediapipe-models/']}});
// Matching the face landmarks default ID enables the client in a fake worker.
const mockRegistry=new BrowserModelRegistry({format:'beljour-models/1',version:1,
  models:[{...fakeModel,id:'face-landmarker-478'}]},
  {test:{licence:'MIT',status:'allowed',urls:['https://storage.googleapis.com/mediapipe-models/']}});
const image=()=>({width:4,height:3,rgba:new ArrayBuffer(4*3*4)});

 test('head pose, image bounds and malformed faces',()=>{
  const p=headPoseFromMesh(mesh,640,480);
  for(const angle of ['rollDegrees','yawDegrees','pitchDegrees']) assert.ok(Math.abs(p[angle])<=89.9);
  assert.ok(p.interOcularDistance>0.015&&p.faceWidth>0.03);
  assert.equal(p.confidence,'estimate');
  const b=boundsFromMesh(mesh);
  assert.ok(b.left<b.right&&b.top<b.bottom);
  assert.equal(boxIoU(b,b),1);
  assert.equal(boxIoU(b,{left:2,top:2,right:3,bottom:3}),0);
  assert.throws(()=>headPoseFromMesh(mesh.slice(0,468),640,480),/478/);
  assert.throws(()=>headPoseFromMesh(mesh,0,480),/positive/);
  assert.throws(()=>headPoseFromMesh(mesh.map(()=>({x:0.5,y:0.5,z:0})),640,480),/degenerate/);
  const corrupt=mesh.map((p)=>({...p}));corrupt[100].x=NaN;
  assert.throws(()=>headPoseFromMesh(corrupt,640,480),/finite/);
});

test('tracking IDs remain stable when detector ordering reverses',()=>{
  const tracker=new FaceTracker();
  const toRaw=(p)=>({landmarks:p,blendshapes:{smile:0.5}});
  const first=normaliseFaces([toRaw(mesh),toRaw(shifted)],640,480,tracker);
  assert.equal(first.length,2);
  const second=normaliseFaces([toRaw(shifted),toRaw(mesh)],640,480,tracker);
  assert.deepEqual(second.map((p)=>p.id),first.map((p)=>p.id).reverse());
  assert.equal(selectFace(first, -1,0),null);
  assert.ok(selectFace(first,0.5,0.5));
  assert.equal(selectFace([],0.5,0.5),null);
  tracker.reset();
  assert.equal(normaliseFaces([toRaw(mesh)],640,480,tracker)[0].id,'face-1');
  assert.throws(()=>normaliseFaces([],640,480,tracker,7),/1..6/);
});

test('worker request sizes, masks and types are validated',()=>{
  const message={kind:'detect',id:1,operation:'face-landmarks',image:image(),maxFaces:6};
  assert.equal(requireVisionRequest(message),message);
  assert.throws(()=>requireVisionRequest({...message,id:-1}),/invalid vision/);
  assert.throws(()=>requireVisionRequest({...message,operation:'speech'}),/invalid vision/);
  assert.throws(()=>requireVisionRequest({...message,maxFaces:10}),/face limit/);
  assert.throws(()=>requireVisionRequest({...message,image:{...image(),width:5}}),/complete/);
  const mask=new Float32Array(4);
  assert.deepEqual(transferResponse({kind:'result',id:1,ok:true,
    output:{width:2,height:2,operation:'pose',segmentation:{width:2,height:2,channels:[mask],categoryMask:null}}}),[mask.buffer]);
});

test('the pending default pose licence never allocates workers or leaves the manual fallback',async()=>{
  let created=0;
  const client=new VisionWorkerClient(undefined,()=>{created++;throw Error('worker should not start')});
  for(const operation of ['pose']){
    const result=await client.detect(operation,image());
    assert.equal(result.ok,false);
    assert.equal(result.source,'manual');
    assert.match(result.error,/pending/);
  }
  assert.equal(created,0);
  client.close();
});

class LocalPort extends EventTarget {
  constructor(onRequest){super();this.onRequest=onRequest;this.terminated=false;this.requests=[];}
  postMessage(data){this.requests.push(data);this.onRequest?.(data,this);}
  reply(data){this.dispatchEvent(new MessageEvent('message',{data}));}
  terminate(){this.terminated=true;}
}

test('worker client hands off buffers, handles async results and rejects stale timeouts',async()=>{
  let port;
  const client=new VisionWorkerClient(mockRegistry,()=>port=new LocalPort((req,local)=>{
    queueMicrotask(()=>local.reply({kind:'result',id:req.id,ok:true,
      output:{width:req.image.width,height:req.image.height,operation:'face-landmarks',faces:[{landmarks:mesh,blendshapes:{}}]}}));
  }),500);
  const data=image();const result=await client.detect('face-landmarks',data,{maxFaces:3});
  assert.equal(result.ok,true); assert.equal(result.faces?.length,1);
  assert.equal(result.faces?.[0].id,'face-1');
  assert.equal(data.rgba.byteLength,4*3*4); // Mock does not detach; real worker transfer does.
  assert.equal(port.requests[0].maxFaces,3);
  assert.equal(client.activeJobs,0);
  assert.equal(client.pick(result.faces,0.5,0.5).id,'face-1');
  client.close();assert.equal(port.terminated,true);
});

test('worker errors, cancellation and timeouts return manual mode without network',async()=>{
  let port;
  const client=new VisionWorkerClient(mockRegistry,()=>port=new LocalPort(),20);
  const controller=new AbortController();
  const first=client.detect('face-landmarks',image(),{signal:controller.signal});
  controller.abort();
  assert.match((await first).error,/Cancelled/);
  const timed=await client.detect('face-landmarks',image());
  assert.match(timed.error,/timed out/);
  const lost=client.detect('face-landmarks',image());
  port.dispatchEvent(new Event('error'));
  assert.match((await lost).error,/stopped/);
  assert.equal(client.activeJobs,0);
  client.close();
  assert.equal(registered.ready('fake-model'),true);
});

test('MediaPipe runners use injected SDK and no model download in tests',async()=>{
  const calls=[];const closed=[];let masksClosed=0;
  const mask=()=>({width:2,height:2,getAsFloat32Array:()=>new Float32Array([0,0.5,1,0.25]),
    getAsUint8Array:()=>new Uint8Array([0,1,2,3]),close:()=>masksClosed++});
  const factory=(kind,fn)=>({createFromOptions:async(files,opts)=>{
    calls.push([kind,files,opts]);
    return {detect:fn,segment:fn,close:()=>closed.push(kind)};
  }});
  const sdk={FilesetResolver:{forVisionTasks:async()=>({wasm:'synthetic'})},
    FaceDetector:factory('detector',()=>({detections:[{boundingBox:{originX:10,originY:20,width:50,height:70},categories:[{score:0.9}]}]})),
    FaceLandmarker:factory('mesh',()=>({faceLandmarks:[mesh],faceBlendshapes:[{categories:[{categoryName:'mouthSmileLeft',score:.8}]}]})),
    PoseLandmarker:factory('pose',()=>({landmarks:[Array.from({length:33},()=>({x:0.5,y:0.5,z:0}))],segmentationMasks:[mask()]})),
    ImageSegmenter:factory('segment',()=>({confidenceMasks:[mask()],categoryMask:mask()}))};
  let loads=0;const runner=new MediaPipeRunners(sdk,'wasm://fake',async()=>{loads++;return new Uint8Array([0x11]);});
  const frame={width:100,height:100,data:new Uint8ClampedArray(100*100*4)};
  const det=await runner.run('face-detection',frame);assert.deepEqual(det.detections[0],{x:.1,y:.2,width:.5,height:.7,score:.9});
  const face=await runner.run('face-landmarks',frame);
  assert.equal(face.faces.length,1);assert.equal(face.faces[0].landmarks.length,478);
  assert.equal(face.faces[0].blendshapes.mouthSmileLeft,0.8);
  const pose=await runner.run('pose',frame);assert.equal(pose.poses[0].length,33);
  const seg=await runner.run('hair-segmentation',frame);
  assert.equal(seg.segmentation.channels[0][2],1);
  assert.deepEqual([...seg.segmentation.categoryMask],[0,1,2,3]);
  await runner.run('person-segmentation',frame);
  await runner.run('face-landmarks',frame);
  assert.equal(loads,5,'each model loads once, face mesh runner is cached');
  assert.equal(masksClosed,5);
  assert.equal(calls.find(c=>c[0]==='mesh')[2].numFaces,6);
  await runner.dispose();assert.equal(closed.length,5);
});
