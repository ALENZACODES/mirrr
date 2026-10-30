// Calm & Self-Image studio: options, defaults, every choice matters, crisis lines, and the audited guide content.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCalmPlan, calmOptions, searchCalmRituals, MINUTES, FOCUS, PRINCIPLES, SEASONS, SCENTS, HAIR, REGIONS, ritualsFor } from '../src/calm/studio.js';
import { FITZPATRICK, MONK_TONES } from '../src/skin/clinic.js';
import * as ethnic from '../src/mental_health_beauty_ethnic_guide.js';
import * as guide from '../src/mental_health_beauty_guide.js';

const shown = p => { const { choices, ...rest } = p; return JSON.stringify(rest); };
const DEFAULTS = { community: 'west_african', ritual: '0', minutes: '20', focus: 'calm', principle: 'time', season: 'autumn', scent: 'rose', hair: 'type4', region: 'canada', fitzpatrick: 'V', tone: 'mst7' };
const text = m => JSON.stringify(Object.fromEntries(Object.entries(m).filter(([, v]) => typeof v !== 'function')));

test('options list every community with its rituals, and every other choice', () => {
  const o = calmOptions();
  assert.equal(o.communities.length, 9); assert.equal(o.minutes.length, 3); assert.equal(o.focus.length, 4);
  assert.equal(o.principles.length, 6); assert.equal(o.seasons.length, 4); assert.equal(o.scents.length, 8);
  assert.equal(o.hair.length, 3); assert.equal(o.regions.length, 6); assert.equal(o.fitzpatrick.length, 6); assert.equal(o.tones.length, 10);
  for (const c of o.communities) assert.ok(o.rituals[c.id].length >= 4, c.id);
});

test('the defaults are what an empty request gets, and bad values fall back to them', () => {
  assert.deepEqual(buildCalmPlan({}).choices, DEFAULTS);
  assert.deepEqual(buildCalmPlan({ community: 'nowhere', ritual: '99', minutes: '3', focus: 'cure', principle: 'x', season: 'monsoon', scent: 'smoke', hair: 'type9', region: 'mars', fitzpatrick: 'VII', tone: 'x' }).choices, DEFAULTS);
});

test('every value of every choice changes the plan or the picture', () => {
  const values = {
    community: calmOptions().communities.map(c => c.id), ritual: ritualsFor('west_african').map(r => r.id), minutes: MINUTES.map(m => m.id),
    focus: FOCUS.map(f => f.id), principle: PRINCIPLES.map(p => p.id), season: SEASONS.map(s => s.id), scent: SCENTS.map(s => s.id),
    hair: HAIR.map(h => h.id), region: REGIONS.map(r => r.id), fitzpatrick: FITZPATRICK, tone: MONK_TONES.map(t => t.id),
  };
  const base = shown(buildCalmPlan(DEFAULTS));
  for (const [k, list] of Object.entries(values)) {
    for (const v of list) {
      if (v === DEFAULTS[k]) continue;
      assert.notEqual(shown(buildCalmPlan({ ...DEFAULTS, [k]: v })), base, `${k}=${v} changed nothing`);
    }
  }
});

test('every ritual of every community has a name and what it is for', () => {
  for (const c of calmOptions().communities) {
    for (const r of ritualsFor(c.id)) {
      const p = buildCalmPlan({ community: c.id, ritual: r.id }).ritual;
      assert.equal(p.name, r.label); assert.ok(p.function, `${c.id} ${r.id}`);
    }
  }
});

test('the session fits the time: short sessions keep the closing step', () => {
  const ten = buildCalmPlan({ minutes: '10' }).session; const all = buildCalmPlan({ minutes: '45' }).session;
  assert.equal(ten.steps.length, 3); assert.ok(ten.short);
  assert.equal(all.steps.length, all.allSteps); assert.equal(all.short, false);
  assert.equal(ten.steps.at(-1), all.steps.at(-1));
  for (const c of calmOptions().communities) assert.ok(buildCalmPlan({ community: c.id, minutes: '45' }).session.steps.length >= 6, c.id);
});

test('support lines are always in the plan, and Canada leads with 9-8-8', () => {
  const ca = buildCalmPlan({}).support;
  assert.equal(ca.lines[0].contact.startsWith('Call or text 9-8-8'), true);
  assert.match(ca.lines.map(l => l.contact).join(' '), /686868/);
  assert.match(ca.lines.find(l => /Black Youth/.test(l.name)).note, /not a crisis line/);
  assert.match(buildCalmPlan({ region: 'united-states' }).support.lines[0].contact, /988/);
  assert.match(buildCalmPlan({ region: 'united-kingdom' }).support.lines[0].contact, /116 123/);
  assert.match(buildCalmPlan({ region: 'south-africa' }).support.lines[0].contact, /0800 567 567/);
  assert.match(buildCalmPlan({ region: 'australia' }).support.lines[0].contact, /13 11 14/);
  const other = buildCalmPlan({ region: 'other' }).support;
  assert.equal(other.lines.length, 0); assert.match(other.global[0].url, /iasp/);
  for (const f of FOCUS) assert.ok(buildCalmPlan({ focus: f.id }).support.note.includes('emergency'));
});

test('focus areas quote the guides: self-image includes the gentle check, shedding the recovery steps', () => {
  const img = buildCalmPlan({ focus: 'image' }).focus;
  assert.ok(img.check.signs.length >= 4); assert.match(img.check.ritual, /compulsive/);
  assert.equal(img.identity.community, 'West African and East African');
  assert.equal(buildCalmPlan({ community: 'arab', focus: 'image' }).focus.identity, null);
  const shed = buildCalmPlan({ focus: 'shedding', hair: 'type3' }).focus;
  assert.match(shed.steps.join(' '), /See a doctor if shedding lasts more than six months/);
  assert.equal(shed.points[0].title, 'Type 3 (curly)');
  assert.ok(buildCalmPlan({ focus: 'connection' }).focus.community.length >= 3);
});

test('deeper Fitzpatrick types see the pigment pathway first, as the guide notes', () => {
  assert.equal(buildCalmPlan({ fitzpatrick: 'VI' }).skin.pathways[0].title, 'Hyperpigmentation acceleration');
  assert.equal(buildCalmPlan({ fitzpatrick: 'II' }).skin.pathways[0].title, 'Barrier dysfunction');
});

test('ritual search uses the guide and needs three letters', () => {
  assert.ok(searchCalmRituals('henna').results.length >= 2);
  assert.equal(searchCalmRituals('he').results.length, 0);
});

test('the audit removed the claims it set out to remove, and the crisis numbers are current', () => {
  const all = [ethnic, guide].map(text).join(' ');
  for (const bad of [
    /only sense/i, /collectivist/i, /4× more likely/, /P\. acnes/, /asianmhp/, /45645/, /1-833-456-4566/, /Nahr/, /Crisis Services Canada/,
    /boswellic acids have documented/, /strong evidence/i, /most sophisticated/, /Sanskrit "champua"/, /Ellis Cose/, /teff butter/, /debaseh/,
    /Biotin/, /Saw palmetto/, /DHT/, /ashwagandha/i, /Iso E Super/, /\d\s?%/, /olfactory antidepressant/, /serotonin delivery/,
    /Magnesium from seawater is absorbed/, /antimony-based/, /copper and lawsone/, /Long Dan Xie Gan Tang/, /laws against braids/,
    /Mind Yourself/, /Horn of Africa Mental Health/, /Caribbean Mental Health Network/, /Korean American Mental Health/, /Integrate UK/,
    /Soch Mental Health \(UK\)/, /0800 456 789 \(24-hour\)/, /chrysoeriol/, /lime or neroli/, /psychoactive/, /delivers a measurable reduction/,
  ]) assert.doesNotMatch(all, bad, String(bad));
  assert.match(all, /9-8-8 Suicide Crisis Helpline/);
  assert.match(all, /0800 567 567/);
  assert.match(all, /asianmentalhealthproject\.com/);
  assert.match(all, /contain high levels of lead/);
  assert.match(all, /tignon laws/);
  assert.match(all, /incensole acetate/);
});
