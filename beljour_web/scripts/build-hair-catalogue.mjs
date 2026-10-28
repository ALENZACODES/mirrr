/** Embed authored hair catalogue in the offline browser build. No fetch at runtime.
 * Source of truth: api/plumb_api/styling/catalogue.json. The minified TS literal is
 * generated build output, NOT credited as authored code lines.
 * Author: John Khan.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
const source = resolve("../api/plumb_api/styling/catalogue.json");
const target = resolve("src/ui/studios/hair/generated/catalogue.ts");
const data = JSON.parse(readFileSync(source, "utf8"));
if (data.format !== "beljour-hair-catalogue/1" || data.author !== "John Khan") throw Error("Bad hair catalogue source");
if (!Array.isArray(data.styles) || data.styles.length < 12) throw Error("Hair catalogue is missing its S1 records");
const ids = new Set();
for (const row of data.styles) {
  if (ids.has(row.id)) throw Error(`Duplicate haircut id: ${row.id}`);
  ids.add(row.id);
  if (row.source !== "synthetic-s1" && row.template_id !== null) throw Error("Editorial idea cannot have an endpoint ID");
}
const content = `/** GENERATED from api/plumb_api/styling/catalogue.json. Do not edit. Author: John Khan. */\n` +
  `export const HAIR_DATA = ${JSON.stringify(data)} as const;\n`;
mkdirSync(dirname(target), { recursive: true });
if (process.argv.includes("--check")) {
  if (readFileSync(target, "utf8") !== content) throw Error("Hair catalogue generated module is stale");
} else writeFileSync(target, content);
console.log(`Hair catalogue: ${data.styles.length} entries, offline embed ready`);
