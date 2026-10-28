// Usability fix 4.8 (round 2 plan): functional text is at least 12px everywhere.
// Parses every web/*.css file: font-size and the font shorthand, px/rem/em (16px root),
// and the smallest value inside clamp()/min()/max(). Author: John Khan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const sheets = readdirSync(ROOT).filter((f) => f.endsWith(".css"));

function px(value, unit) {
  const v = Number(value);
  return unit === "px" ? v : v * 16;
}

/** Every font size in a declaration value, as pixels. */
export function sizes(value) {
  const out = [];
  for (const m of value.matchAll(/(-?\d*\.?\d+)(px|rem|em)\b/g)) out.push(px(m[1], m[2]));
  return out;
}

function declarations(css) {
  const found = [];
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of text.matchAll(/font-size\s*:\s*([^;}]+)/g)) found.push(["font-size", m[1].trim()]);
  for (const m of text.matchAll(/(?<![-\w])font\s*:\s*([^;}]+)/g)) {
    // in the shorthand the size comes before an optional "/line-height"
    const size = m[1].split("/")[0].trim().split(/\s+/).pop();
    found.push(["font", size]);
  }
  return found;
}

test("there are stylesheets to check", () => {
  assert.ok(sheets.length >= 4, sheets.join(","));
});

for (const sheet of sheets) {
  test(`${sheet}: no functional text under 12px`, () => {
    const css = readFileSync(new URL(sheet, ROOT), "utf8");
    const small = [];
    for (const [prop, value] of declarations(css)) {
      for (const size of sizes(value)) if (size < 12 - 1e-9) small.push(`${prop}: ${value}`);
    }
    assert.deepEqual(small, [], `${sheet} has text under 12px`);
  });
}

test("the parser sees small sizes in every form it checks", () => {
  const css = ".a{font-size:11px}.b{font: 600 0.7rem/1.2 serif}.c{font-size:clamp(0.6rem,2vw,1rem)}.d{font-size:12px}";
  const bad = declarations(css).flatMap(([, v]) => sizes(v).filter((s) => s < 12));
  assert.deepEqual(bad.sort((a, b) => a - b), [9.6, 11, 11.2]);
});

// R23d: enforce the same minimum on every stylesheet Lane D owns, including
// future layout/mobile/shell nested CSS. Preserve all historic root checks.
const clientRoots = ["src/layout", "src/mobile", "src/ui/shell"];
function nestedOwnedCss(relative) {
  const dir = new URL(`../${relative}/`, import.meta.url);
  const found = [];
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    if (item.isFile() && item.name.endsWith(".css")) found.push(`${relative}/${item.name}`);
    if (item.isDirectory()) {
      const nested = `${relative}/${item.name}`;
      found.push(...nestedOwnedCss(nested));
    }
  }
  return found;
}
const nestedSheets = clientRoots.flatMap(nestedOwnedCss);
for (const sheet of nestedSheets) {
  test(`${sheet}: nested owned functional text at least 12px`, () => {
    const css = readFileSync(new URL(`../${sheet}`, import.meta.url), "utf8");
    const violations = declarations(css).flatMap(([prop, value]) =>
      sizes(value).filter((size) => size < 12 - 1e-9).map(() => `${prop}: ${value}`));
    assert.deepEqual(violations, [], `${sheet} contains text below 12px`);
  });
}

test("the owned layout and shell stylesheets are included in the root scan", () => {
  for (const sheet of ["theme.css", "layout.css", "shell.css", "styles.css"]) {
    assert.ok(sheets.includes(sheet), `${sheet} cannot silently escape the 12px rule`);
  }
});
