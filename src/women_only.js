/**
 * MIRRR is made for women. The knowledge guides were written for a general audience, so a few
 * passages are about men's grooming (beards, barbershops, men's fragrances). This module finds
 * those passages so the Library and studios can leave them out. Pure functions; no I/O.
 */

/** Words that mark a passage as men's grooming content. */
export const MENS_CONTENT = /\b(beards?|bearded|beardruff|moustaches?|mustaches?|barbers?|barbershops?|goatees?|men['’]s|menswear|for men|male grooming)(?![a-z])|\(men\)/i;
const MENS_KEY = /(beard|moustache|mustache|barber|goatee|^mens?(_|$)|_mens?(_|$)|^mens?[A-Z]|[a-z]Mens?([A-Z]|$))/;

export function isMensContent(text) {
  return typeof text === 'string' && MENS_CONTENT.test(text);
}

/**
 * A copy of `value` without men's-grooming passages: strings that mention them are dropped from
 * arrays and objects, keys named for them are dropped, and containers left empty are dropped.
 * Returns undefined when nothing is left.
 */
export function withoutMensContent(value, seen = new WeakMap()) {
  if (value == null) return value;
  if (typeof value === 'string') return isMensContent(value) ? undefined : value;
  if (typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);
  if (Array.isArray(value)) {
    const out = [];
    seen.set(value, out);
    for (const v of value) { const k = withoutMensContent(v, seen); if (k !== undefined) out.push(k); }
    return out.length || !value.length ? out : undefined;
  }
  const out = {};
  seen.set(value, out);
  for (const [k, v] of Object.entries(value)) {
    if (MENS_KEY.test(k)) continue;
    const kept = withoutMensContent(v, seen);
    if (kept !== undefined) out[k] = kept;
  }
  return Object.keys(out).length || !Object.keys(value).length ? out : undefined;
}
