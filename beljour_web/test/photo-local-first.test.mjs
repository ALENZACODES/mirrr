// Photo lifecycle regression: no implicit transfer, normalized explicit upload,
// consent changes, stale work, app-owned URLs and cameras. Synthetic only.
// Author: John Khan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installDOM, buttonNamed } from './helpers/dom.mjs';
import { photoScreen, normalizePhoto, beforeNextPhotoUpload, SERVER_PHOTO_BYTES } from '../dist/js/screens/photo.js';
import { ConsentGate } from '../dist/js/ui/shell/consent.js';
import { releaseLocalPhoto, routeReady } from '../dist/js/ctx.js';
import { hasMetadata } from '../dist/js/save/export.js';
import { readHeader } from '../dist/js/image/decode.js';

function png(width = 512, height = 480) {
  const bytes = new Uint8Array(33), view = new DataView(bytes.buffer);
  bytes.set([137,80,78,71,13,10,26,10]); view.setUint32(8,13); bytes.set([73,72,68,82],12);
  view.setUint32(16,width); view.setUint32(20,height); bytes[24]=8; bytes[25]=6; return bytes;
}
function jpeg(width, height, orientation = 1) {
  const exif = new Uint8Array(32), view = new DataView(exif.buffer);
  exif.set([69,120,105,102,0,0,73,73]); view.setUint16(8,42,true); view.setUint32(10,8,true);
  view.setUint16(14,1,true); view.setUint16(16,274,true); view.setUint16(18,3,true); view.setUint32(20,1,true); view.setUint16(24,orientation,true);
  const head = [255,216,255,225,0,34,...exif,255,192,0,17,8,height>>8,height&255,width>>8,width&255,3,1,17,0,2,17,0,3,17,0,255,218,0,2,1,2,3,255,217];
  return Uint8Array.from(head);
}
function pixels(width, height, value = 100) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i=0;i<data.length;i+=4) { data[i]=value; data[i+1]=80; data[i+2]=65; data[i+3]=255; }
  return { width, height, data };
}
const blob = (width = 512, height = 480) => new Blob([png(width,height)], { type: 'image/png' });
const returned = (id = 'a'.repeat(64), width = 512, height = 480) => ({ photo_id:id, width, height, sample:false });
const tick = () => new Promise(resolve => setImmediate(resolve));
function deferred() { let resolve, reject; const promise = new Promise((yes,no) => { resolve=yes; reject=no; }); return { promise, resolve, reject }; }
function harness(overrides = {}, accepted = true) {
  const dom = installDOM(), consent = new ConsentGate(() => 1234567890);
  if (accepted) consent.acceptVisit({ adult:true, understood:true });
  const context = { consent:accepted, photo:null, photoSrc:null, face:null, size:null, shade:null, localShade:null, tryon:{}, faceShape:null, body:null,
    go(route) { this.route=route; }, refreshPhotoPanel() { this.refreshes=(this.refreshes??0)+1; } };
  const uploads=[], deleted=[], remembered=[], created=new Map(), revoked=[], encodes=[];
  let serial=0;
  const deps = { consent, base:()=> 'https://app-server.example',
    decoder:async (_bytes,header)=>pixels(header.width,header.height),
    encoder:{ async encode(image,options) { encodes.push({ width:image.width,height:image.height,data:image.data.slice(),options }); return jpeg(image.width,image.height); } },
    createURL(value) { const url='blob:normalized-'+ ++serial; created.set(url,value); return url; },
    revokeURL(url) { revoked.push(url); },
    async loadImage(url) { const header=readHeader(new Uint8Array(await created.get(url).arrayBuffer())); return { naturalWidth:header.width,naturalHeight:header.height }; },
    readFace:async ()=>null,
    upload:async value=>{ uploads.push(value); return returned(); }, deletePhoto:async id=>{ deleted.push(id); }, remember:id=>remembered.push(id), ...overrides };
  const screen=photoScreen(context,deps), root=screen.element;
  root.querySelector('video').play=async ()=>{}; root.querySelector('video').pause=()=>{};
  return { dom,consent,context,deps,screen,root,uploads,deleted,remembered,created,revoked,encodes,
    async choose(file=blob()) { const input=root.querySelector('#file'); input.files=[file]; await input.dispatch('change'); },
    prepare() { return buttonNamed(root,'Prepare photo on app server'); },
    close() { screen.dispose(); releaseLocalPhoto(context); dom.restore(); } };
}

test('opening a valid local photo never uploads even with a configured app server', async () => {
  const h=harness(), original=blob(), beforeFetch=globalThis.fetch;
  globalThis.fetch=()=>{ throw new Error('local photo opening must not fetch'); };
  try {
    await h.choose(original); assert.equal(h.uploads.length,0); assert.equal(h.context.photo,null);
    assert.ok(h.context.localPhoto); assert.equal(h.context.photoSrc,'blob:normalized-1');
    assert.match(h.root.textContent,/Photo ready on this device. Nothing was uploaded/);
    assert.match(h.root.textContent,/Optional: this button uploads a metadata-free JPEG/);
    assert.equal(h.prepare().disabled,false); assert.equal(h.encodes[0].options.label,null);
    await buttonNamed(h.root,'Find my shade on this device').click(); assert.equal(h.context.route,'shade'); assert.equal(h.uploads.length,0);
  } finally { h.close(); globalThis.fetch=beforeFetch; }
});

test('explicit server preparation sends only the normalized JPEG and preserves separate provider consent', async () => {
  const h=harness(), original=blob();
  try {
    await h.choose(original); const normalized=h.context.localPhoto.blob; await h.prepare().click();
    assert.equal(h.uploads.length,1); assert.equal(h.uploads[0],normalized); assert.notEqual(h.uploads[0],original);
    const sent=new Uint8Array(await h.uploads[0].arrayBuffer()); assert.equal(hasMetadata(sent),false); assert.equal(readHeader(sent).format,'jpeg');
    assert.equal(h.context.photo.photo_id,'a'.repeat(64)); assert.equal(h.remembered.length,1);
    assert.match(h.root.textContent,/YouCam consent is requested with that action/);
    assert.equal(h.consent.check(h.context.photo.photo_id,'makeup').allowed,false,'preparation never grants YouCam consent');
    assert.ok(buttonNamed(h.root,'Open Hair Studio')); assert.equal(h.prepare().disabled,true);
  } finally { h.close(); }
});

test('localOnly forbids both an ordinary click and a forced upload listener call', async () => {
  const h=harness(); h.consent.setLocalOnly(true);
  try {
    await h.choose(); assert.ok(h.context.localPhoto); assert.equal(h.prepare().disabled,true);
    await h.prepare().click(); await h.prepare().dispatch('click');
    assert.equal(h.uploads.length,0); assert.equal(h.context.photo,null); assert.match(h.root.textContent,/On-device only is on/);
    h.consent.setLocalOnly(false); assert.equal(h.prepare().disabled,false); await h.prepare().click(); assert.equal(h.uploads.length,1);
  } finally { h.close(); }
});

test('visit consent is required before reading bytes or starting the camera', async () => {
  let reads=0,cameras=0; const h=harness({ getCamera:async()=>{ cameras++; throw new Error('must not acquire'); } },false);
  try {
    await h.choose({ size:1, async arrayBuffer() { reads++; return new Uint8Array([0]).buffer; } });
    await buttonNamed(h.root,'Use my camera').dispatch('click'); assert.equal(reads,0); assert.equal(cameras,0);
    h.root.querySelector('#adult').checked=true; await h.root.querySelector('#adult').dispatch('change');
    assert.equal(buttonNamed(h.root,'Agree and continue').disabled,true);
    h.root.querySelector('#agree').checked=true; await h.root.querySelector('#agree').dispatch('change');
    await buttonNamed(h.root,'Agree and continue').click(); await h.choose();
    assert.equal(h.context.consent,true); assert.ok(h.context.localPhoto); assert.equal(h.uploads.length,0);
  } finally { h.close(); }
});

test('normalization applies EXIF orientation once, flattens transparency, and strips encoder metadata', async () => {
  const raw=jpeg(512,480,6), seen=[];
  const normalized=await normalizePhoto(new Blob([raw]),async (_bytes,header)=>{
    assert.equal(header.orientation,6); const image=pixels(header.width,header.height); image.data[(479*512)*4+3]=0; return image;
  },{ async encode(image,options) { seen.push({ image,options }); return jpeg(image.width,image.height); } });
  assert.equal(normalized.width,480); assert.equal(normalized.height,512); assert.equal(normalized.orientationApplied,6);
  assert.equal(normalized.flattened,true); assert.deepEqual(Array.from(seen[0].image.data.subarray(0,4)),[255,255,255,255]);
  assert.equal(seen[0].options.label,null); const output=new Uint8Array(await normalized.blob.arrayBuffer());
  assert.equal(hasMetadata(output),false); assert.equal(readHeader(output).orientation,1); assert.equal(readHeader(output).width,480);
});

test('byte, pixel, format and encoder-shape refusals happen without any upload', async () => {
  let decodes=0,reads=0;
  const h=harness({ decoder:async (_bytes,header)=>{ decodes++; return pixels(header.width,header.height); } });
  try {
    await h.choose({ size:26*1024*1024, arrayBuffer:async()=>{ reads++; return png().buffer; } });
    assert.equal(reads,0); assert.equal(decodes,0); assert.match(h.root.textContent,/no larger than 25 MB/);
    await h.choose(new Blob([png(8000,8000)])); assert.equal(decodes,0); assert.match(h.root.textContent,/24 megapixels/);
    await h.choose(new Blob(['<svg/>'],{ type:'image/png' })); assert.equal(decodes,0); assert.match(h.root.textContent,/Only JPEG, PNG and WEBP/);
    assert.equal(h.uploads.length,0); assert.equal(h.created.size,0);
    await assert.rejects(normalizePhoto(blob(),async()=>pixels(512,480),{ encode:async()=>jpeg(513,480) }),/does not match its pixels/);
  } finally { h.close(); }
});

test('normalized server size limits refuse before fetch while keeping the complete local photo', async () => {
  const h=harness({ encoder:{ async encode(image) { const bytes=new Uint8Array(SERVER_PHOTO_BYTES+1024); bytes.set(jpeg(image.width,image.height)); return bytes; } } });
  try {
    await h.choose(); const src=h.context.photoSrc, size={...h.context.size}; await h.prepare().click();
    assert.equal(h.uploads.length,0); assert.equal(h.context.photoSrc,src); assert.deepEqual(h.context.size,size);
    assert.ok(h.context.localPhoto.blob.size>SERVER_PHOTO_BYTES); assert.match(h.root.textContent,/over the app server's 8 MB limit/);
    assert.ok(buttonNamed(h.root,'Find my shade on this device'));
  } finally { h.close(); }
  const small=harness(); try {
    await small.choose(blob(32,24)); await small.prepare().click(); assert.equal(small.uploads.length,0); assert.ok(small.context.localPhoto);
    assert.match(small.root.textContent,/at least 480 pixels/);
  } finally { small.close(); }
});

test('a slower earlier decode cannot replace a newer photo or leak a preview URL', async () => {
  const delayed=deferred(); let first=true;
  const h=harness({ decoder:async (_bytes,header)=>{ if(first) { first=false; await delayed.promise; } return pixels(header.width,header.height); } });
  try {
    const earlier=h.choose(blob()); await tick(); await h.choose(blob(600,500)); const src=h.context.photoSrc;
    delayed.resolve(); await earlier; assert.equal(h.context.photoSrc,src); assert.deepEqual(h.context.size,{w:600,h:500});
    assert.equal(h.created.size,1); assert.equal(h.uploads.length,0);
  } finally { h.close(); }
});

test('late uploads are cleaned up and cannot adopt their id onto newer local pixels', async () => {
  const first=deferred(),second=deferred(); let sent=0;
  const h=harness({ upload:async()=>++sent===1?first.promise:second.promise });
  try {
    await h.choose(); const earlier=h.prepare().click(); await tick(); await h.choose(blob(600,500));
    const currentSrc=h.context.photoSrc,later=h.prepare().click(); await tick();
    second.resolve(returned('b'.repeat(64),600,500)); await later;
    first.resolve(returned('a'.repeat(64))); await earlier; await tick();
    assert.equal(h.context.photoSrc,currentSrc); assert.equal(h.context.photo.photo_id,'b'.repeat(64));
    assert.deepEqual(h.deleted,['a'.repeat(64)]); assert.equal(h.remembered.length,2);
  } finally { h.close(); }
});

test('identical content IDs from overlapping uploads cannot delete the adopted current photo', async () => {
  const first=deferred(),second=deferred(); let sent=0;
  const h=harness({ upload:async()=>++sent===1?first.promise:second.promise });
  try {
    await h.choose(); const earlier=h.prepare().click(); await tick(); await h.choose();
    const later=h.prepare().click(); await tick(); second.resolve(returned()); await later;
    first.resolve(returned()); await earlier; await tick();
    assert.equal(h.context.photo.photo_id,'a'.repeat(64)); assert.deepEqual(h.deleted,[]);
  } finally { h.close(); }
});

test('an explicit deletion finishes before a replacement photo can upload', async () => {
  const delayed=deferred(),h=harness();
  try {
    await h.choose(); const deleting=beforeNextPhotoUpload(h.context,()=>delayed.promise);
    const preparing=h.prepare().click(); await tick(); assert.equal(h.uploads.length,0);
    delayed.resolve({deleted:true}); await deleting; await preparing; assert.equal(h.uploads.length,1);
    assert.equal(h.context.photo.photo_id,'a'.repeat(64));
  } finally { h.close(); }
});

test('a localOnly change during upload invalidates its result even if the switch is turned off again', async () => {
  const delayed=deferred(),h=harness({ upload:async()=>delayed.promise });
  try {
    await h.choose(); const pending=h.prepare().click(); await tick(); const src=h.context.photoSrc;
    h.consent.setLocalOnly(true); h.consent.setLocalOnly(false); delayed.resolve(returned()); await pending; await tick();
    assert.equal(h.context.photo,null); assert.equal(h.context.photoSrc,src); assert.deepEqual(h.deleted,['a'.repeat(64)]);
    assert.equal(h.prepare().disabled,false);
  } finally { h.close(); }
});

test('teardown invalidates uploads and revokes pending URLs; adopted URLs have an explicit app owner', async () => {
  const image=deferred(),h=harness({ loadImage:async()=>image.promise });
  try {
    const pending=h.choose(); await tick(); assert.equal(h.created.size,1); h.screen.dispose();
    assert.deepEqual(h.revoked,['blob:normalized-1']); image.resolve({naturalWidth:512,naturalHeight:480}); await pending;
    assert.equal(h.context.photoSrc,null); assert.equal(h.revoked.length,1);
  } finally { h.close(); }
  const upload=deferred(),ready=harness({ upload:async()=>upload.promise });
  try {
    await ready.choose(); const pending=ready.prepare().click(); await tick(); ready.screen.dispose();
    assert.equal(ready.revoked.length,0,'the app owns the adopted URL for navigation to local tools');
    upload.resolve(returned()); await pending; await tick(); assert.equal(ready.context.photo,null); assert.equal(ready.deleted.length,1);
    releaseLocalPhoto(ready.context); releaseLocalPhoto(ready.context); assert.deepEqual(ready.revoked,['blob:normalized-1']);
  } finally { ready.close(); }
});

test('a replacement or withdrawn visit releases the prior normalized photo and clears its measurements', async () => {
  const h=harness(); try {
    await h.choose(); h.context.localShade={measured_lab:[30,10,8]}; await h.choose(blob(600,500));
    assert.deepEqual(h.revoked,['blob:normalized-1']); assert.equal(h.context.localShade,null);
    h.consent.withdraw(); assert.equal(h.context.photoSrc,null); assert.equal(h.context.localPhoto,null); assert.equal(h.context.size,null);
    assert.deepEqual(h.revoked,['blob:normalized-1','blob:normalized-2']); assert.equal(h.context.consent,false);
  } finally { h.close(); }
});

test('late camera acquisition stops its tracks after teardown and active capture stays local', async () => {
  const camera=deferred(); let stops=0; const stream={getTracks:()=>[{stop(){stops++;}}]};
  const h=harness({getCamera:async()=>camera.promise});
  try {
    const pending=buttonNamed(h.root,'Use my camera').click(); await tick(); h.screen.dispose(); camera.resolve(stream); await pending;
    assert.equal(stops,1); assert.equal(h.root.querySelector('video').srcObject,null); assert.equal(h.uploads.length,0);
  } finally { h.close(); }
  const active=harness({getCamera:async()=>stream,capture:async()=>blob()});
  try {
    await buttonNamed(active.root,'Use my camera').click(); assert.equal(buttonNamed(active.root,'Take photo').disabled,false);
    await buttonNamed(active.root,'Take photo').click(); assert.ok(active.context.localPhoto); assert.equal(active.uploads.length,0);
    assert.equal(stops,2); assert.equal(active.root.querySelector('video').srcObject,null);
  } finally { active.close(); }
});

test('the drawn sample is generated locally with labelled pixels and known synthetic points', async () => {
  const h=harness({readFace:async()=>{throw new Error('sample has its own explicitly synthetic points');}});
  try {
    await buttonNamed(h.root,'Use a drawn sample').click(); assert.equal(h.uploads.length,0); assert.equal(h.context.localPhoto.synthetic,true);
    assert.equal(h.encodes[0].options.label,'Drawn sample'); assert.equal(h.context.face.points.length,478);
    assert.match(h.root.textContent,/This is not a real person's photo/); assert.ok(h.context.size.w>=480);
  } finally { h.close(); }
});

test('local routes stay available without upload; cloud routes, cleanup and resume honor their separate gates', () => {
  const local={consent:true,photo:null,photoSrc:'blob:local'};
  for(const route of ['skin','shade','proportions','previews']) assert.equal(routeReady(local,route),true,route);
  for(const route of ['hair','tryon']) assert.equal(routeReady(local,route),false,route);
  assert.equal(routeReady({...local,photo:returned()},'hair'),true);
  for(const route of ['skin','shade','proportions','previews']) assert.equal(routeReady({...local,photoSrc:null},route),false,route);
  assert.equal(routeReady({consent:false,photo:null,photoSrc:null},'palettes'),true);
  const main=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
  assert.match(main,/class: routeReady\(ctx, s.route\)/); assert.match(main,/const target = routeReady\(ctx, r\)/);
  assert.match(main,/case "photo": disposeScreen = renderPhoto/);
  assert.match(main,/pagehide[\s\S]*releaseLocalPhoto\(ctx\)/);
  assert.match(main,/const photo = ctx.photo, bodyPhoto = ctx.body\?\.photo;\s*if \(photo\) appConsent.revokePhoto\(photo.photo_id\)/);
  assert.match(main,/pagehide", \(\) => \{\s*if \(ctx.photo\) appConsent.revokePhoto\(ctx.photo.photo_id\)/);
  assert.match(main,/beforeNextPhotoUpload\(ctx, \(\) => api.deletePhoto\(photo.photo_id\)\)/);
  assert.match(main,/if \(!appConsent.localOnly\) void resumePending\(store, api.resumeTasks\)/);
  assert.doesNotMatch(main,/They are only sent when you preview a brow lift|Scores and dates only/);
  assert.match(main,/Skin AI product matching each ask for action-specific consent/);
});
