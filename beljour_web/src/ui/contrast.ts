/**
 * WCAG 2.x contrast, used by the tests to check every text and background pair in theme.css,
 * and available to screens that colour text by data (swatches, badges).
 *
 * Author: John Khan.
 */

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`not a #RRGGBB colour: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Relative luminance, WCAG 2.x definition (sRGB, 0.03928 threshold as written in the spec). */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** AA: 4.5 for body text, 3 for large text (24px, or 18.7px bold) and for UI parts. */
export function passesAA(fg: string, bg: string, large = false): boolean {
  return contrast(fg, bg) >= (large ? 3 : 4.5);
}

/** Black or white text, whichever reads better on a swatch. */
export function textOn(bg: string): "#000000" | "#FFFFFF" {
  return contrast("#000000", bg) >= contrast("#FFFFFF", bg) ? "#000000" : "#FFFFFF";
}

/** Read `--name: #RRGGBB;` pairs out of a stylesheet's text. */
export function readTokens(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of css.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{6})\b/g)) out[m[1]] = m[2].toUpperCase();
  return out;
}
