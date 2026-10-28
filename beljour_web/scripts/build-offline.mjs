// Build an exact public-shell cache inventory; no uploads, models, maps or reports.
// Source and icon are original work. Author: John Khan.
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

mkdirSync("dist/icons", { recursive: true });
for (const [from, to] of [["public/manifest.webmanifest", "manifest.webmanifest"],
  ["public/icons/beljour.svg", "icons/beljour.svg"], ["public/service-worker.js", "service-worker.js"]]) {
  copyFileSync(from, `dist/${to}`);
}
const rootFiles = new Set(["index.html", "home.html", "studio.html", "trust.html", "recorder.html", "arena.html",
  "shell.css", "layout.css", "hair.css", "theme.css", "styles.css", "config.js", "manifest.webmanifest"]);
const eligible = (path) => rootFiles.has(path) || /^js\/[a-zA-Z0-9_/-]+\.js$/.test(path) || path === "icons/beljour.svg" ||
  /^hair-assets\/(before-hairstyle|s2-hairstyle)-synthetic\.jpeg$/.test(path);
function collect(directory, prefix = "") {
  const result = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = prefix + entry.name;
    if (entry.isDirectory()) result.push(...collect(join(directory, entry.name), `${path}/`));
    else if (entry.isFile() && eligible(path)) {
      const bytes = readFileSync(join(directory, entry.name));
      result.push({ path: `/${path}`, sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length });
    }
  }
  return result;
}
const assets = collect("dist").sort((a, b) => a.path.localeCompare(b.path));
if (assets.length < 20 || !assets.some((row) => row.path === "/studio.html")) throw new Error("Incomplete offline shell");
const version = createHash("sha256").update(JSON.stringify(assets)).digest("hex").slice(0, 24);
writeFileSync("dist/offline-manifest.js", `self.BELJOUR_OFFLINE = ${JSON.stringify({ version, assets })};\n`);
console.log(`offline shell: ${assets.length} public assets, version ${version}`);
