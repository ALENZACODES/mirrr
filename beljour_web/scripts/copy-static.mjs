// Copies the static files next to the compiled JS so dist/ is a complete site.
import { copyFileSync, mkdirSync } from "node:fs";
import { copyConfiguredModels } from "./copy-models.mjs";

mkdirSync("dist", { recursive: true });
for (const f of ["index.html", "recorder.html", "studio.html", "home.html", "trust.html", "arena.html", "shell.css", "layout.css", "hair.css", "theme.css", "styles.css", "config.js",
  // Cloudflare Pages reads _headers from the output root: CSP and security headers (R13).
  "_headers"]) copyFileSync(f, `dist/${f}`);
console.log("dist/ ready");

// Offline Hair Studio: one checked synthetic cassette illustration, not a YouCam render.
mkdirSync("dist/hair-assets", { recursive: true });
copyFileSync("hair-assets/s2-hairstyle-synthetic.jpeg", "dist/hair-assets/s2-hairstyle-synthetic.jpeg");
copyFileSync("hair-assets/before-hairstyle-synthetic.jpeg", "dist/hair-assets/before-hairstyle-synthetic.jpeg");

// Model binaries are an external, ignored deployment input, validated before copy.
copyConfiguredModels();
copyFileSync("../THIRD_PARTY_NOTICES.md", "dist/THIRD_PARTY_NOTICES.txt");
copyFileSync("../docs/licenses/Apache-2.0.txt", "dist/Apache-2.0.txt");

// R15 Lane B local studio entry assets. Author: John Khan.
for (const file of ["eyes-brows.html", "eyes-brows.css"]) copyFileSync(file, `dist/${file}`);
// R16 Lane B local studio. Author: John Khan.
copyFileSync("r16b-studio.html", "dist/r16b-studio.html");
copyFileSync("r16b-studio.css", "dist/r16b-studio.css");

// R16/R18 Lane C commerce: local static assets for independent opt-in studio.
for (const [source, target] of [
  ["commerce.html", "dist/commerce.html"],
  ["commerce.css", "dist/commerce.css"],
  ["../api/plumb_api/commerce/catalogue.json", "dist/commerce-catalogue.json"],
  ["../api/plumb_api/engines/menshair/presets.json", "dist/menshair-presets.json"],
]) copyFileSync(source, target);

// Verify embedded inert JSON against both authored local Python catalogues.
// The CSP forbids execution of inline JavaScript; these inert data blocks must
// not permit '<' or an embedded end tag which would escape their script nodes.
import { readFileSync } from "node:fs";
const commerceMarkup = readFileSync("commerce.html", "utf8");
for (const [tag, source] of [
  ["commerce-catalogue-data", "../api/plumb_api/commerce/catalogue.json"],
  ["menshair-presets-data", "../api/plumb_api/engines/menshair/presets.json"],
]) {
  const found = new RegExp(`<script id="${tag}" type="application/json">([^<]*)<\/script>`).exec(commerceMarkup);
  if (!found) throw Error(`Missing inert static JSON: ${tag}`);
  const canonical = JSON.stringify(JSON.parse(readFileSync(source, "utf8")));
  const actual = JSON.stringify(JSON.parse(found[1]));
  if (actual !== canonical) throw Error(`Stale inline JSON: ${tag}. Re-author commerce page data.`);
}

// --- Lane B r18b: R17 standalone local studio assets ---
// Rebased on integration bfc4a9d. Author: John Khan.
copyFileSync("r17b-studio.html", "dist/r17b-studio.html");
copyFileSync("r17b-studio.css", "dist/r17b-studio.css");


// --- Lane D r23d-cp2: CSP-safe external commerce data, deployment output only ---
// The checked source page remains unchanged for Lane C's catalogue-parity tests.
// External classic scripts run before the earlier deferred module script starts.
const { writeFileSync } = await import("node:fs");
let commerceBuilt = readFileSync("dist/commerce.html", "utf8");
const commerceDataBlocks = [];
for (const id of ["commerce-catalogue-data", "menshair-presets-data"]) {
  const pattern = new RegExp(`<script id="${id}" type="application/json">([^<]*)<\\/script>`, "g");
  const found = [...commerceBuilt.matchAll(pattern)];
  if (found.length !== 1) throw Error(`Expected one static commerce data block: ${id}`);
  JSON.parse(found[0][1]);
  commerceDataBlocks.push([id, found[0][1]]);
  commerceBuilt = commerceBuilt.replace(found[0][0], commerceDataBlocks.length === 1
    ? '<script src="js/commerce-static-data.js"></script>' : "");
}
const commerceLoader = [
  "(() => {",
  `  const blocks = ${JSON.stringify(commerceDataBlocks)};`,
  "  const anchor = document.currentScript;",
  "  if (!anchor || !anchor.parentNode) throw Error('Commerce data loader is unavailable');",
  "  for (const [id, json] of blocks) {",
  "    const node = document.createElement('div');",
  "    node.id = id;",
  "    node.hidden = true;",
  "    node.textContent = json;",
  "    anchor.parentNode.insertBefore(node, anchor);",
  "  }",
  "})();",
  "",
].join("\n");
writeFileSync("dist/commerce.html", commerceBuilt);
writeFileSync("dist/js/commerce-static-data.js", commerceLoader);
