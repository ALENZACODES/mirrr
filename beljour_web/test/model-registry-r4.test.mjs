// R4 strict policy: licences, pinning, streaming SHA-256 and model lazy loading.
// Author: John Khan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { BrowserModelRegistry, ModelGateError, fetchVerifiedModel,
         hashModel, ModelDownloads, modelAssetPath } from '../dist/js/vision/model-registry.js';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/mock/1/dummy.task';
const bytes = new TextEncoder().encode('R4 synthetic bytes, not a real model');
const sha = createHash('sha256').update(bytes).digest('hex');
const item = (change = {}) => ({ id:'test-model',task:'face-landmarks',filename:'dummy.task',url:MODEL_URL,
  sha256:sha,bytes:bytes.length,licenceName:'Test mock licence',licence:'MIT',status:'allowed',runsOn:'browser',note:'synthetic',...change });
const licence = (change = {}) => ({ 'Test mock licence': { licence:'MIT',status:'allowed',urls:['https://storage.googleapis.com/mediapipe-models/face_landmarker/'],...change } });
const registry = (entry = item(), lic = licence()) => new BrowserModelRegistry({format:'beljour-models/1',version:1,models:[entry]},lic);

 test('uncleared real bundles and MI-GAN refuse loading before any network use', async () => {
  const actual = new BrowserModelRegistry();
  assert.equal(actual.items.size,6);
  for (const name of actual.items.keys()) {
    if (['face-detector-short','face-landmarker-478','hair-segmenter','selfie-multiclass'].includes(name)) {
      assert.equal(actual.ready(name),true);
      assert.equal(actual.approve(name).licence,'Apache-2.0');
      continue;
    }
    assert.equal(actual.ready(name),false);
    assert.throws(()=>actual.approve(name),/pending/);
    let requests=0;
    await assert.rejects(fetchVerifiedModel(name,actual, async()=>{requests++;throw Error('network');}),/pending/);
    assert.equal(requests,0);
  }
  assert.throws(()=>actual.get('not-in-catalogue'),/unknown model/);
});

test('validated bytes load exactly, with credentials omitted and redirect blocked', async () => {
  const reg = registry();
  assert.equal(reg.ready('test-model'),true);
  const calls=[];
  const result=await fetchVerifiedModel('test-model',reg,async(url,opts)=>{
    calls.push([url,opts]);return new Response(bytes,{status:200,headers:{'content-length':String(bytes.length)}});
  });
  assert.deepEqual([...result],[...bytes]);
  assert.equal(await hashModel(result.buffer),sha);
  assert.equal(calls.length,1);
  assert.equal(calls[0][0],modelAssetPath(item()));
  assert.equal(calls[0][1].mode,'same-origin');
  assert.equal(calls[0][1].credentials,'omit');
  assert.equal(calls[0][1].redirect,'error');
  assert.equal(calls[0][1].cache,'no-store');
});

test('a synthetic unlicensed or unpinned file never reaches the downloader',async()=>{
  for (const [change,pattern] of [
    [{status:'pending'},/licence ledger/],
    [{sha256:null},/sha256/],
    [{bytes:null},/sha256/],
    [{task:'music'},/unknown/],
    [{url:'http://bad.example/a.task'},/unapproved/],
    [{url:MODEL_URL+'?token=abc'},/unapproved/],
    [{url:'https://google.com/x.task'},/unapproved/],
    [{licenceName:'no-match'},/licence ledger/],
    [{runsOn:'server'},/browser/],
    [{sha256:'A'.repeat(64)},/sha256/],
    [{bytes:121*1024*1024},/byte size/],
  ]) assert.throws(()=>registry(item(change)),pattern);
  assert.throws(()=>registry(item(),licence({status:'blocked'})),/licence ledger/);
  assert.throws(()=>registry(item(),licence({licence:'GPL-3.0'})),/licence ledger/);
});

test('HTTP status, byte length, digest, stream limit and redirect all fail', async()=>{
  const reg = registry();
  const altered=Uint8Array.from(bytes);altered[0]^=1;
  const fetches=[
    async()=>new Response('not found',{status:404}),
    async()=>new Response(altered,{status:200}),
    async()=>new Response(bytes,{status:200,headers:{'content-length':'2'}}),
    async()=>new Response(bytes.subarray(0,10),{status:200}),
    async()=>new Response(new Uint8Array(bytes.length+1),{status:200}),
  ];
  const patterns=[/download rejected/,/sha256 mismatch/,/length header/,/downloaded size/,/oversize/];
  for(let i=0;i<fetches.length;i++) await assert.rejects(fetchVerifiedModel('test-model',reg,fetches[i]),patterns[i]);
});

test('pending concurrent jobs share a verified byte load; failures permit retry', async()=>{
  let count=0;
  const fetcher=async()=>{count++; await new Promise(r=>setImmediate(r));return new Response(bytes)};
  const cache=new ModelDownloads(registry(),fetcher);
  const [a,b]=await Promise.all([cache.load('test-model'),cache.load('test-model')]);
  assert.equal(count,1);
  assert.strictEqual(a,b);
  cache.clear();await cache.load('test-model');assert.equal(count,2);
  let tries=0;
  const recover=new ModelDownloads(registry(), async()=>{tries++;return new Response(tries===1?new Uint8Array(3):bytes)});
  await assert.rejects(recover.load('test-model'));
  await recover.load('test-model');assert.equal(tries,2);
});
