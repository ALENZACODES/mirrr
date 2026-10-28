// User-selected style browsing parity; synthetic catalogue only.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import * as C from '../dist/js/engines/menshair/consultation.js';
const styles = JSON.parse(readFileSync('../api/plumb_api/engines/menshair/presets.json', 'utf8')).styles;

function settings(overrides={}) { return {...C.DEFAULT_CONSULTATION, ...overrides}; }

test('offline inclusive browsing recommends from the authored local catalogue', () => {
  const found = C.findConcepts(styles, settings(), 18);
  assert.equal(found.length, 18);
  assert.equal(new Set(found.map(p=>p.style.id)).size, 18);
  assert.ok(new Set(found.map(p=>p.style.family)).size >= 5);
  assert.ok(found.every(p=>p.consultation_version==='r19c/1'&&p.score>=0&&p.score<=160));
});

test('no photograph, guessed traits or unexpected fields enter a preference recipe', () => {
  for (const [key,value] of [['photo','pixels'],['race','anything'],['maintenance_minutes',-1],
    ['texture','auto-detect'],['presentation','gender-from-camera'],['prefer_volume','false'],
    ['fade_shape','unavailable'],['scalp_visibility','medical'],['part','center']]) {
    assert.throws(()=>C.parseConsultation({[key]:value}));
  }
  assert.deepEqual(C.parseConsultation({}),C.DEFAULT_CONSULTATION);
});

test('ordering and diversity are deterministic irrespective of catalogue enumeration', () => {
  const p = settings({texture:'coily',fade:'mid',fade_shape:'burst',require_short_sides:true,desired_length:'short'});
  assert.deepEqual(C.findConcepts(styles,p,12).map(x=>x.style.id),
    C.findConcepts([...styles].reverse(),p,12).map(x=>x.style.id));
  const ranked = C.findConcepts(styles,p,15,false).map(x=>x.score);
  assert.ok(ranked.every((v,i)=>i===0||v<=ranked[i-1]));
  for(const limit of [-1,0,49,0.5]) assert.throws(()=>C.findConcepts(styles,p,limit));
});

test('comparison board and stylist brief carry simulation and no provider claims',()=>{
  const board=C.compareStyles(styles.slice(0,4));
  assert.equal(board.provider_calls,0);
  assert.equal(board.real_face_tested,false);
  assert.equal(board.tiles.length,4);
  assert.ok(board.tiles.every(p=>p.visual_quality_verified===false));
  assert.throws(()=>C.compareStyles([styles[0],styles[0]]));
  assert.throws(()=>C.compareStyles([]));
  const brief=C.stylistBrief(styles[0],settings({scalp_visibility:'keep',maintenance_minutes:0}));
  assert.equal(brief.quality_status,'UNPROVEN');
  assert.equal(brief.photo_required,false);
  assert.ok(brief.questions.some(q=>q.includes('scalp')));
});

test('Python and TypeScript score and comparison mirrors agree across diverse authored styles',()=>{
  const configs=[
    settings(),settings({texture:'coily',desired_length:'short',fade:'mid',require_short_sides:true}),
    settings({texture:'straight',desired_length:'long',presentation:'feminine',maintenance_minutes:6}),
    settings({texture:'curly',fade_shape:'burst',scalp_visibility:'reveal',prefer_volume:true}),
    settings({part:'left',presentation:'masculine',scalp_visibility:'keep',maintenance_minutes:20}),
  ];
  const specimens=styles.filter((_,i)=>i%7===0).slice(0,43);
  const expected=configs.flatMap(p=>specimens.map(style=>C.scoreStyle(style,p).score));
  const script=`import sys,json\nfrom plumb_api.engines.menshair.render import HairRecipe\nfrom plumb_api.engines.menshair.consultation import Consultation,score_style\ndata=json.load(sys.stdin)\nprint(json.dumps([score_style(HairRecipe.parse(item),Consultation.parse(p)).score for p in data["configs"] for item in data["styles"]]))`;
  const result=spawnSync('python3',['-c',script],{input:JSON.stringify({configs,styles:specimens}),
    env:{...process.env,PYTHONPATH:'../api'},encoding:'utf8',maxBuffer:512000});
  assert.equal(result.status,0,result.stderr);
  assert.deepEqual(expected,JSON.parse(result.stdout));
});
