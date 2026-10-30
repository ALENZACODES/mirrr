/**
 * The human skin gamut in CIELAB (D65), used to validate every shade MIRRR shows.
 *
 * Centre line: the Monk Skin Tone scale (Monk 2019, Google, CC BY 4.0; the same hexes as
 * MONK_TONES in src/skin/clinic.js), in depth order 1, 2, 4, 5, ..., 10 so lightness falls
 * monotonically (Monk 3 sits off the line as a golden fair and is covered by the tolerance).
 * Its chroma collapses toward neutral at the deep end (Monk 9: C* 6.5; Monk 10: C* 3.8), as
 * measured deep skin does: forehead ITA by Monk category in 244 adults from 10 African countries
 * (Konica Minolta CM-700d, J Invest Dermatol 2025, abstract 0699) runs from -41.7° (Monk F) to
 * -74.2° (Monk J), i.e. b* well under 10 at L* 20-30.
 *
 * Tolerance around the centre line grows with the line's chroma (undertone variation is wider in
 * chromatic mid tones than at the near-neutral extremes), and every shade must also sit in the
 * skin hue band and the lightness range of living skin (no shade darker than L* 13).
 */
import { hexToLab, deltaE2000 } from '../public/photo-engine.js';

export const MONK_LAB = {
  mst1: [94.2, 1.5, 5.4], mst2: [92.3, 2.1, 7.3], mst3: [93.1, 0.2, 14.2], mst4: [87.6, 0.5, 17.8], mst5: [77.9, 3.5, 23.1],
  mst6: [55.1, 7.8, 26.7], mst7: [42.5, 12.3, 20.5], mst8: [30.7, 11.7, 13.3], mst9: [21.1, 2.7, 6.0], mst10: [14.6, 1.5, 3.5],
};
const LINE = ['mst1', 'mst2', 'mst4', 'mst5', 'mst6', 'mst7', 'mst8', 'mst9', 'mst10'].map(k => MONK_LAB[k]);
export const L_MIN = 13, L_MAX = 96;
const HUE_MIN = 35, HUE_MAX = 95;

export const HEX_RE = /^#[0-9a-f]{6}$/i;

/** The centre line's a*, b* at a lightness (linear between Monk anchors, held flat past the ends). */
export function centreAt(L) {
  if (L >= LINE[0][0]) return [LINE[0][1], LINE[0][2]];
  for (let i = 1; i < LINE.length; i++) {
    const [L0, a0, b0] = LINE[i - 1], [L1, a1, b1] = LINE[i];
    if (L >= L1) { const t = (L0 - L) / (L0 - L1); return [a0 + (a1 - a0) * t, b0 + (b1 - b0) * t]; }
  }
  const e = LINE[LINE.length - 1]; return [e[1], e[2]];
}
/** Allowed half-widths in a* and b* at a lightness. */
export function toleranceAt(L) {
  const [a, b] = centreAt(L), C = Math.hypot(a, b);
  return { da: 4 + 0.25 * C, db: 4 + 0.35 * C };
}

/** Is a Lab colour human skin? Returns { ok, why } with the first rule it breaks. */
export function inSkinGamut([L, a, b]) {
  if (!(L >= L_MIN && L <= L_MAX)) return { ok: false, why: `L* ${L.toFixed(1)} outside living skin (${L_MIN}-${L_MAX})` };
  const [ca, cb] = centreAt(L), { da, db } = toleranceAt(L);
  if (a < 0.3 || b < 1) return { ok: false, why: 'greener or bluer than any skin' };
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < HUE_MIN || h > HUE_MAX) return { ok: false, why: `hue ${h.toFixed(0)}° outside the skin band` };
  if (Math.abs(a - ca) > da) return { ok: false, why: `a* ${a.toFixed(1)} vs skin ${ca.toFixed(1)}±${da.toFixed(1)} at L* ${L.toFixed(0)}` };
  if (Math.abs(b - cb) > db) return { ok: false, why: `b* ${b.toFixed(1)} vs skin ${cb.toFixed(1)}±${db.toFixed(1)} at L* ${L.toFixed(0)}` };
  return { ok: true };
}

/**
 * Validate a shade list: schema, lightness, gamut, depth order, and how well it covers the Monk
 * references. Returns { ok, problems, stats }.
 */
export function validateSpectrum(shades, { monkMax = 3 } = {}) {
  const problems = [], labs = [];
  const ids = new Set();
  for (const s of shades) {
    if (ids.has(s.id)) problems.push(`${s.id}: duplicate id`); ids.add(s.id);
    if (!HEX_RE.test(String(s.hex))) { problems.push(`${s.id}: invalid hex '${s.hex}'`); continue; }
    const lab = hexToLab(s.hex); labs.push({ s, lab });
    const g = inSkinGamut(lab); if (!g.ok) problems.push(`${s.id} ${s.name}: ${g.why}`);
  }
  const ordered = labs.filter(x => !x.s.mixed && x.s.tier !== 'mixed').sort((p, q) => p.s.depth - q.s.depth);
  for (let i = 1; i < ordered.length; i++) if (ordered[i].lab[0] > ordered[i - 1].lab[0] + 0.05) problems.push(`${ordered[i].s.id}: lighter than ${ordered[i - 1].s.id} despite a deeper depth`);
  const monk = Object.entries(MONK_LAB).map(([id, m]) => { let best = Infinity, by = null; for (const x of labs) { const e = deltaE2000(m, x.lab); if (e < best) { best = e; by = x.s.id; } } return { id, dE: +best.toFixed(2), shade: by }; });
  for (const m of monk) if (m.dE > monkMax) problems.push(`${m.id}: nearest shade ${m.shade} is ΔE2000 ${m.dE} away (> ${monkMax})`);
  let nearDup = 0;
  for (let i = 0; i < labs.length; i++) for (let j = i + 1; j < labs.length; j++) if (deltaE2000(labs[i].lab, labs[j].lab) < 1) nearDup++;
  const Ls = labs.map(x => x.lab[0]);
  const stats = {
    shades: shades.length, validHex: labs.length, minL: +Math.min(...Ls).toFixed(1), maxL: +Math.max(...Ls).toFixed(1),
    inBand13to32: Ls.filter(L => L >= 13 && L <= 32).length, belowL13: Ls.filter(L => L < 13).length,
    inGamut: labs.filter(x => inSkinGamut(x.lab).ok).length, monk, nearDuplicatePairs: nearDup,
  };
  return { ok: problems.length === 0, problems, stats };
}
