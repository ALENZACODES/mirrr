/**
 * "Finish your look — your choice". After makeup or shades MIRRR never routes a woman straight to
 * wigs: she picks how she wants to finish (wigs, lashes, brows, her own hair, locs and braids,
 * nails, or nothing). The planner and the Transform plan only add a wig or lashes when she picked
 * them; otherwise they style her own hair. Pure functions; no I/O.
 */

export const FINISH_OPTIONS = [
  { id: 'wigs', label: 'Wigs' },
  { id: 'lashes', label: 'Lashes' },
  { id: 'brows', label: 'Brows' },
  { id: 'natural', label: 'My Natural Hair' },
  { id: 'locs', label: 'Locs & Braids' },
  { id: 'nails', label: 'Nails' },
  { id: 'none', label: 'None — I’m done' },
];
const IDS = new Set(FINISH_OPTIONS.map(o => o.id));

/** Her picks, cleaned: known ids only, no duplicates; "none" on its own means "nothing extra". */
export function normaliseFinish(finish) {
  const picked = [...new Set((Array.isArray(finish) ? finish : []).map(x => String(x).toLowerCase().trim()).filter(x => IDS.has(x)))];
  return picked.includes('none') && picked.length > 1 ? picked.filter(x => x !== 'none') : picked;
}

export const wantsWig = finish => normaliseFinish(finish).includes('wigs');
export const wantsLashes = finish => normaliseFinish(finish).includes('lashes');

/** How the finishing steps were chosen, in words the plan can show. */
export function finishBasis(finish) {
  const picked = normaliseFinish(finish);
  if (!picked.length) return { picked, basis: 'Nothing picked yet, so hair is styled as your own hair. Pick finishing options any time.' };
  if (picked.includes('none')) return { picked, basis: 'You chose to finish with the makeup alone.' };
  const labels = picked.map(id => FINISH_OPTIONS.find(o => o.id === id).label);
  return { picked, basis: `From your picks: ${labels.join(', ')}.` };
}

/**
 * Finishing steps for the look, from her picks only. `wig` is the wig match to use when she
 * picked wigs; `lash` and `hairTip` come from the look and her hair texture when known.
 */
export function finishingSteps(finish, { wig = null, lash = null, hairTip = null, hairTexture = null } = {}) {
  const picked = normaliseFinish(finish);
  const steps = [];
  const own = !picked.length || picked.includes('natural') || (!picked.includes('wigs') && !picked.includes('locs') && !picked.includes('none'));
  if (picked.includes('wigs') && wig) steps.push({ option: 'wigs', title: `Wig: ${wig.name}`, text: wig.why || 'Matches this look’s hair story.' });
  if (picked.includes('locs')) steps.push({ option: 'locs', title: 'Locs & braids', text: 'Refresh the roots or re-braid a few days before, oil the scalp lightly, and wrap at night in satin so the style stays neat for the day.' });
  if (own && !picked.includes('none')) steps.push({ option: 'natural', title: hairTexture ? `Your ${hairTexture} hair` : 'Your own hair', text: hairTip ? `Style your own hair. For your texture: ${hairTip}` : 'Style your own hair the way you wear it: cleanse and condition the day before, then a style that frames the face. No wig needed.' });
  if (picked.includes('lashes')) steps.push({ option: 'lashes', title: 'Lashes', text: lash ? `Lashes: ${lash}.` : 'Apply lashes after liner and before mascara, trimmed to your eye width.' });
  if (picked.includes('brows')) steps.push({ option: 'brows', title: 'Brows', text: 'Brush brows up, fill gaps with hair-like strokes a shade softer than your hair, and set with a clear gel.' });
  if (picked.includes('nails')) steps.push({ option: 'nails', title: 'Nails', text: 'Pick a nail colour that echoes the lip or the eye colour of the look; paint the day before so it is fully dry.' });
  return steps;
}
