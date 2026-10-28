import assert from "node:assert/strict";
import { test } from "node:test";
import { createGoldenWidget } from "../dist/js/save/golden-widget.js";

class FakeElement {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.listeners = new Map();
    this.disabled = false;
    this.textContent = "";
    this.value = "";
    this.checked = false;
    this.className = "";
    this.type = "";
    this.firstChild = null;
  }
  setAttribute(key, value) {this[key] = value;}
  append(...nodes) {this.children.push(...nodes);if(!this.firstChild)this.firstChild=nodes[0];}
  prepend(...nodes) {this.children.unshift(...nodes);this.firstChild=nodes[0];}
  replaceChildren(...nodes) {this.children=[...nodes];this.firstChild=nodes[0]??null;}
  addEventListener(event, fn) {this.listeners.set(event,fn);}
  removeEventListener(event, fn) {if(this.listeners.get(event)===fn)this.listeners.delete(event);}
  emit(event) {this.listeners.get(event)?.();}
  remove() {this.removed = true;}
  find(tag) {
    if(this.tagName===tag)return this;
    for(const child of this.children){const hit=child.find?.(tag);if(hit)return hit;}
    return undefined;
  }
}
function withFakeDOM(fn) {
  const before=globalThis.document;
  globalThis.document={createElement:(tag)=>new FakeElement(tag)};
  try{return fn();}finally{globalThis.document=before;}
}
test("no detected face never triggers a user-visible fake edit",()=>withFakeDOM(()=>{
  const previews=[];
  const widget=createGoldenWidget({onPreview:(level)=>previews.push(level)});
  const slider=widget.element.find("input");
  assert.equal(slider.disabled,true);
  slider.value="3";slider.emit("input");
  assert.equal(previews.length,0);
  assert.equal(widget.state().level,1);
  widget.dispose();
}));
test("1.0 to 5.0 in steps of 0.1 previews live with identity lock on",()=>withFakeDOM(()=>{
  const calls=[];
  const widget=createGoldenWidget({onPreview:(level,lock)=>calls.push([level,lock])});
  widget.update({available:true,faceCount:1,selectedIndex:0,message:"Ready"});
  assert.equal(widget.state().identityLock,true);
  const slider=widget.element.find("input");
  assert.equal(slider.disabled,false);
  slider.value="2.4";slider.emit("input");
  assert.deepEqual(calls,[[2.4,true]]);
  assert.equal(widget.state().level,2.4);
  widget.dispose();
}));
test("selected face can change without editing another person",()=>withFakeDOM(()=>{
  const selected=[],previews=[];
  const widget=createGoldenWidget({onPreview:(l)=>previews.push(l),onSelectFace:(i)=>selected.push(i)});
  widget.update({available:true,faceCount:3,selectedIndex:0,message:"Three faces"});
  const picker=widget.element.find("select");
  assert.equal(picker.children.length,3);
  picker.value="2";picker.emit("change");
  assert.deepEqual(selected,[2]);
  assert.deepEqual(previews,[1]);
  assert.equal(widget.state().selectedIndex,2);
  widget.dispose();
}));
test("lock is explicitly lowered and preview invalidation is immediate",()=>withFakeDOM(()=>{
  const log=[];
  const widget=createGoldenWidget({onPreview:(level,lock)=>log.push([level,lock])});
  widget.update({available:true,faceCount:1,selectedIndex:0,message:"Ready"});
  const labels=[];
  function collect(node) {
    if(node.tagName==="input") labels.push(node);
    for(const child of node.children)collect(child);
  }
  collect(widget.element);
  const checkbox=labels.find(node=>node.type==="checkbox");
  assert.equal(checkbox.checked,true);
  checkbox.checked=false;checkbox.emit("change");
  assert.deepEqual(log,[[1,false]]);
  widget.update({available:false,faceCount:0,selectedIndex:null,message:"No face"});
  assert.equal(widget.state().available,false);
  widget.dispose();
}));
test("disposed component removes listeners and cannot issue stale previews",()=>withFakeDOM(()=>{
  let count=0;
  const widget=createGoldenWidget({onPreview:()=>count++});
  widget.update({available:true,faceCount:1,selectedIndex:0,message:"Ready"});
  const slider=widget.element.find("input");
  widget.dispose();
  slider.value="5";slider.emit("input");
  widget.update({available:true,faceCount:1,selectedIndex:0,message:"Old"});
  assert.equal(count,0);
  assert.equal(widget.element.removed,true);
}));
