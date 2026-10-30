#!/usr/bin/env node
/**
 * Per-slice harness (audit 2026-10-30, §5.7 / Appendix C). Five Monk slices x five lighting
 * conditions x four geometries x two tones, on synthetic portraits; metrics per slice; floors;
 * writes docs/SCORECARD.md and docs/scorecard.json. `--gate` exits 1 when any floor fails.
 * Usage: node test/harness/run.mjs [--gate] [--out docs] [--label "before"]
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { portrait, labOf } from './portrait.mjs';
import { findFace, applyLook, hexToLab, rgbToLab, deltaE2000 } from '../../public/photo-engine.js';
import * as sampling from '../../public/skin-sample.js';
import { SHADE_SPECTRUM, matchShadeByColor } from '../../src/shade_finder.js';
import { MONK_LAB, validateSpectrum } from '../../src/skin_gamut.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const QUICK = args.includes('--quick'), ONLY = opt('--slice', null);
const GATE = args.includes('--gate'), OUT = path.resolve(ROOT, opt('--out', 'docs')), LABEL = opt('--label', '');

export const SLICES = [['Monk 1-2', ['mst1', 'mst2']], ['Monk 3-4', ['mst3', 'mst4']], ['Monk 5-6', ['mst5', 'mst6']], ['Monk 7-8', ['mst7', 'mst8']], ['Monk 9-10', ['mst9', 'mst10']]];
export const CONDITIONS = [['daylight', 'daylight', 0], ['tungsten', 'tungsten', 0], ['fluorescent', 'fluorescent', 0], ['shade', 'shade', 0], ['under -1 EV', 'daylight', -1]];
const GEOMETRY = [{}, { dx: 0.12, dy: -0.05 }, { scale: 0.8, background: 'bright' }, { dx: -0.1, background: 'dark' }];
const JITTER = [[0, 0, 0], [1.5, 0.3, 0.8], [-1.5, -0.2, -0.5], [0.8, 0.2, 0.4]];
export const FLOORS = { detection: 98, detectionGap: 2, samplingMedian: 2.5, matchMedian: 3, matchP90: 6, lipDrift: 3, outOfFace: 0, falseMatch: 5 };

const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : NaN; };
const p90 = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.ceil(0.9 * s.length) - 1)] : NaN; };
const hue = ([, a, b]) => (Math.atan2(b, a) * 180) / Math.PI;
const hueDiff = (x, y) => { const d = Math.abs(x - y) % 360; return d > 180 ? 360 - d : d; };
const LIP = '#b3262e';
const FULL = { lip: LIP, lipFinish: 'satin', lid: ['#c9a26b'], liner: '#111111', linerStyle: 'wing', blush: '#d9706a', highlight: '#e8cfa0', baseFinish: 'matte' };

/** The measuring pipeline under test: what the app does with a photo to get a skin colour. */
function measure(img) {
  if (sampling.measureSkin) return sampling.measureSkin(img);
  const rgb = sampling.sampleSkin(img); return rgb ? { rgb } : null;
}
function matchTop(rgb) {
  const m = matchShadeByColor(rgb, { topN: 1 });
  return m.matches[0] ? { hex: m.matches[0].hex, band: m.band ?? m.matches[0].band ?? null } : null;
}

export function runHarness() {
  const cells = [];
  for (const [slice, tones] of SLICES) for (const [cond, light, ev] of CONDITIONS) for (const tone of tones) for (let g = 0; g < GEOMETRY.length; g++) {
    if (ONLY && !slice.includes(ONLY)) continue;
    if (QUICK && (g % 2 || tone !== tones[tones.length - 1])) continue;
    const [jL, ja, jb] = JITTER[g], base = MONK_LAB[tone];
    const skin = [base[0] + jL, Math.max(0.3, base[1] + ja), Math.max(1, base[2] + jb)];
    const img = portrait(skin, { ...GEOMETRY[g], light, ev, seed: 11 + g * 7 + tone.length });
    const t = img.truth, rec = { slice, cond, tone, g, detected: false };
    const f = findFace(img);
    if (f.ok) {
      rec.detected = true;
      const mx = (t.eyes[0][0] + t.eyes[1][0]) / 2, my = t.eyes[0][1];
      rec.eyeErr = Math.hypot(f.frame.ox - mx, f.frame.oy - my) / t.d;
      rec.mouthErr = Math.abs(f.frame.oy + f.mouth.v * f.frame.d - t.mouthY) / t.d;
      const out = { width: img.width, height: img.height, data: new Uint8ClampedArray(img.data) };
      applyLook(out, f, { lip: LIP, lipFinish: 'satin' });
      const lip = [0, 0, 0]; let n = 0;
      for (let x = t.cx - 0.15 * t.d; x <= t.cx + 0.15 * t.d; x += 2) { const c = labOf(out, x, t.mouthY + 0.07 * t.d); lip[0] += c[0]; lip[1] += c[1]; lip[2] += c[2]; n++; }
      rec.lipDrift = hueDiff(hue(lip.map(v => v / n)), hue(hexToLab(LIP)));
      const full = { width: img.width, height: img.height, data: new Uint8ClampedArray(img.data) };
      applyLook(full, f, FULL);
      let outside = 0; const { cx, cy, ru, rv } = t.face;
      for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
        if (((x - cx) / (ru * 1.2)) ** 2 + ((y - cy) / (rv * 1.15)) ** 2 < 1) continue;
        const o = (y * img.width + x) * 4; if (full.data[o] !== img.data[o] || full.data[o + 1] !== img.data[o + 1] || full.data[o + 2] !== img.data[o + 2]) outside++;
      }
      rec.outOfFace = outside;
    }
    const m = measure(img);
    if (m?.rgb) {
      rec.sampledDE = deltaE2000(rgbToLab(m.rgb.r, m.rgb.g, m.rgb.b), skin);
      rec.confidence = m.confidence ?? null; rec.flags = m.flags ?? [];
      const top = matchTop(m.rgb);
      if (top) { rec.matchDE = deltaE2000(hexToLab(top.hex), skin); rec.band = top.band; }
    } else rec.sampleFailed = true;
    cells.push(rec);
  }
  const rows = SLICES.filter(([slice]) => !ONLY || slice.includes(ONLY)).map(([slice]) => {
    const c = cells.filter(x => x.slice === slice), det = c.filter(x => x.detected);
    const byCond = Object.fromEntries(CONDITIONS.map(([k]) => { const cc = c.filter(x => x.cond === k); return [k, (100 * cc.filter(x => x.detected).length) / cc.length]; }));
    const sampled = c.filter(x => x.sampledDE !== undefined);
    return {
      slice, n: c.length, detection: (100 * det.length) / c.length, byCond,
      eyeErr: med(det.map(x => x.eyeErr)), mouthErr: med(det.map(x => x.mouthErr)),
      sampled: sampled.length, samplingMedian: med(sampled.map(x => x.sampledDE)), samplingP90: p90(sampled.map(x => x.sampledDE)),
      samplingDaylight: med(sampled.filter(x => x.cond === 'daylight').map(x => x.sampledDE)),
      matchMedian: med(sampled.map(x => x.matchDE)), matchP90: p90(sampled.map(x => x.matchDE)),
      matchDaylight: med(sampled.filter(x => x.cond === 'daylight').map(x => x.matchDE)),
      lipDrift: med(det.map(x => x.lipDrift)), outOfFace: Math.max(0, ...det.map(x => x.outOfFace)),
      // No-match correctness: how often the app says "match" (ΔE2000 <= 3 to its own sample) while the
      // shade is more than 6 from the true skin, and how often it honestly says "outside our range".
      falseMatch: sampled.length ? (100 * sampled.filter(x => x.band === 'match' && x.matchDE > 6).length) / sampled.length : NaN,
      saidOutside: sampled.length ? (100 * sampled.filter(x => x.band === 'outside').length) / sampled.length : NaN,
      samplingByCond: Object.fromEntries(CONDITIONS.map(([k]) => [k, med(sampled.filter(x => x.cond === k).map(x => x.sampledDE))])),
    };
  });
  const oracle = Object.fromEntries(Object.entries(MONK_LAB).map(([id, lab]) => [id, Math.min(...SHADE_SPECTRUM.filter(s => /^#[0-9a-f]{6}$/i.test(s.hex)).map(s => deltaE2000(lab, hexToLab(s.hex))))]));
  const spectrum = validateSpectrum(SHADE_SPECTRUM);
  const best = Math.max(...rows.map(r => r.detection));
  const fails = [];
  for (const r of rows) {
    if (!(r.detection >= FLOORS.detection)) fails.push(`${r.slice}: detection ${r.detection.toFixed(1)}% < ${FLOORS.detection}%`);
    if (best - r.detection > FLOORS.detectionGap) fails.push(`${r.slice}: detection ${(best - r.detection).toFixed(1)} pts below the best slice`);
    if (!(r.samplingMedian <= FLOORS.samplingMedian)) fails.push(`${r.slice}: sampling ΔE2000 median ${fmt(r.samplingMedian)} > ${FLOORS.samplingMedian}`);
    if (!(r.matchMedian <= FLOORS.matchMedian)) fails.push(`${r.slice}: match ΔE2000 median ${fmt(r.matchMedian)} > ${FLOORS.matchMedian}`);
    if (!(r.matchP90 <= FLOORS.matchP90)) fails.push(`${r.slice}: match ΔE2000 p90 ${fmt(r.matchP90)} > ${FLOORS.matchP90}`);
    if (!(r.lipDrift <= FLOORS.lipDrift)) fails.push(`${r.slice}: lip hue drift ${fmt(r.lipDrift)}° > ${FLOORS.lipDrift}°`);
    if (r.outOfFace > FLOORS.outOfFace) fails.push(`${r.slice}: ${r.outOfFace} pixels changed outside the face`);
    if (!(r.falseMatch <= FLOORS.falseMatch)) fails.push(`${r.slice}: ${fmt(r.falseMatch, 1)}% of readings claimed a match that is more than ΔE 6 from the true skin`);
  }
  for (const p of spectrum.problems) fails.push(`spectrum: ${p}`);
  return { rows, cells, oracle, spectrum, fails };
}

const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : 'n/a');
const mark = ok => (ok ? '' : ' ✗');

function render(res, meta) {
  const { rows, oracle, spectrum, fails } = res;
  const L = [];
  L.push('# MIRRR per-tone scorecard', '');
  L.push(`Generated by \`node test/harness/run.mjs\` on ${meta.date} at commit \`${meta.commit}\`${meta.label ? ` (${meta.label})` : ''}. **All numbers are synthetic**: parameterised portraits whose skin is set from the Monk Skin Tone references (incl. the low-chroma deep end), photographed under five lighting conditions by a simulated phone camera (partial auto white balance, exposure error, sensor noise). They are a regression instrument. They are not measurements on real faces; no consented real-photo set exists yet (audit §5.11).`, '');
  L.push(`Each slice: 2 Monk tones x 5 conditions x 4 geometries (centred; off-centre; smaller on a bright background; off-centre on a dark background) = ${rows[0].n} portraits. Floors (audit Appendix C): detection ≥ ${FLOORS.detection}% per slice and within ${FLOORS.detectionGap} pts of the best slice; skin sampling ΔE2000 median ≤ ${FLOORS.samplingMedian}; top-1 shade ΔE2000 median ≤ ${FLOORS.matchMedian}, p90 ≤ ${FLOORS.matchP90}; lipstick hue drift ≤ ${FLOORS.lipDrift}°; zero pixels changed outside the face; at most ${FLOORS.falseMatch}% false 'match' claims (the app says match but the shade is more than ΔE 6 from the true skin). A photo the detector rejects counts as not detected, and the app says so instead of painting off the face. ✗ marks a floor breach.`, '');
  L.push('| Slice | Detection | daylight / tungsten / fluor. / shade / −1 EV | Eye / mouth error (face units) | Sampling ΔE (median, p90; daylight) | Top-1 shade ΔE (median, p90; daylight) | Lip hue drift | Out-of-face px | False “match” / said “outside” |');
  L.push('|---|---|---|---|---|---|---|---|---|');
  const best = Math.max(...rows.map(r => r.detection));
  for (const r of rows) {
    const detOk = r.detection >= FLOORS.detection && best - r.detection <= FLOORS.detectionGap;
    L.push(`| ${r.slice} | ${fmt(r.detection, 0)}%${mark(detOk)} | ${Object.values(r.byCond).map(v => fmt(v, 0)).join(' / ')} | ${fmt(r.eyeErr, 3)} / ${fmt(r.mouthErr, 3)} | ${fmt(r.samplingMedian)}${mark(r.samplingMedian <= FLOORS.samplingMedian)}, ${fmt(r.samplingP90)}; ${fmt(r.samplingDaylight)} | ${fmt(r.matchMedian)}${mark(r.matchMedian <= FLOORS.matchMedian)}, ${fmt(r.matchP90)}${mark(r.matchP90 <= FLOORS.matchP90)}; ${fmt(r.matchDaylight)} | ${fmt(r.lipDrift, 1)}°${mark(r.lipDrift <= FLOORS.lipDrift)} | ${r.outOfFace}${mark(r.outOfFace === 0)} | ${fmt(r.falseMatch, 1)}%${mark(r.falseMatch <= FLOORS.falseMatch)} / ${fmt(r.saidOutside, 1)}% |`);
  }
  L.push('', 'Sampling ΔE2000 median by condition (daylight / tungsten / fluorescent / shade / −1 EV):', '');
  for (const r of rows) {
    L.push(`- ${r.slice}: ${Object.values(r.samplingByCond).map(v => fmt(v, 1)).join(' / ')}`);
  }
  L.push('', '## Shade spectrum', '');
  const s = spectrum.stats;
  L.push(`${s.shades} shades; ${s.validHex} valid hexes; L* ${s.minL}-${s.maxL}; ${s.belowL13} below L* 13; ${s.inBand13to32} in L* 13-32; ${s.inGamut} of ${s.validHex} inside the skin gamut (src/skin_gamut.js); ${s.nearDuplicatePairs} near-duplicate pairs (ΔE2000 < 1).`, '');
  L.push('Nearest shade to each Monk reference (ΔE2000, floor ≤ 3): ' + s.monk.map(m => `${m.id.replace('mst', 'Monk ')} ${m.dE} (${m.shade})${mark(m.dE <= 3)}`).join(' · '), '');
  L.push('', `## Gate: ${fails.length ? `FAIL (${fails.length})` : 'PASS'}`, '');
  for (const f of fails.slice(0, 80)) L.push(`- ${f}`);
  if (fails.length > 80) L.push(`- … and ${fails.length - 80} more`);
  L.push('', 'Floors may only be loosened by a commit that says so in its message (audit Appendix C, governance).', '');
  return L.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const res = runHarness();
  let commit = 'unknown'; try { commit = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); const dirty = execSync('git status --porcelain -- src public test', { cwd: ROOT }).toString().trim(); if (dirty) commit += '+working-tree'; } catch {}
  const meta = { date: new Date().toISOString().slice(0, 10), commit, label: LABEL };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'SCORECARD.md'), render(res, meta));
  fs.writeFileSync(path.join(OUT, 'scorecard.json'), JSON.stringify({ meta, rows: res.rows, oracle: res.oracle, spectrum: res.spectrum.stats, fails: res.fails, cells: res.cells }, null, 1));
  console.log(render(res, meta).split('\n').slice(4, 14).join('\n'));
  console.log(`gate: ${res.fails.length ? 'FAIL ' + res.fails.length : 'PASS'}`);
  if (GATE && res.fails.length) process.exit(1);
}
