// Score the TypeScript reference engines with the E29 checks and write §17 reports next to the
// Python ones:  cd web && npm run build && node scripts/quality-report.mjs [--strict]
// Synthetic photos only, until released photos and their masks exist. Author: John Khan.
import { mkdirSync, writeFileSync } from "node:fs";

import { ExposureEngine, TintEngine } from "../dist/js/engines/core/engine.js";
import { run, syntheticPhoto } from "../dist/js/quality/harness.js";
import { toMarkdown } from "../dist/js/quality/report.js";
import { reports } from "../dist/js/quality/warpfill.js";

const out = new URL("../../quality-reports/", import.meta.url);
const photos = [1, 2, 3].map((seed) => syntheticPhoto(seed));
const tools = {
  exposure: [new ExposureEngine(), [{ name: "natural", params: { stops: 0.2 } }, { name: "medium", params: { stops: 0.5 } },
    { name: "strong", params: { stops: 0.9 } }], "skin"],
  tint: [new TintEngine(), [{ name: "natural", params: { rgb: [180, 40, 60], strength: 0.3 } },
    { name: "full", params: { rgb: [180, 40, 60], strength: 1.0 }, target: "#B4283C" }], null],
};

mkdirSync(out, { recursive: true });
let failed = 0;
for (const [tool, [engine, stops, skin]] of Object.entries(tools)) {
  const report = run(tool, engine.version, engine, photos, stops, { skin });
  writeFileSync(new URL(`${tool}-typescript.json`, out), JSON.stringify(report, null, 1) + "\n");
  writeFileSync(new URL(`${tool}-typescript.md`, out), toMarkdown(report));
  failed += report.summary.failed;
  console.log(`${tool}: ${report.summary.passed}/${report.summary.checks} checks passed`);
}
// R5: E06 warp and E07 fill on synthetic grid scenes (Q1, Q3, Q4, Q12)
for (const [tool, report] of Object.entries(reports(new Date().toISOString().slice(0, 10)))) {
  writeFileSync(new URL(`${tool}-typescript.json`, out), JSON.stringify(report, null, 1) + "\n");
  writeFileSync(new URL(`${tool}-typescript.md`, out), toMarkdown(report));
  failed += report.summary.failed;
  console.log(`${tool}: ${report.summary.passed}/${report.summary.checks} checks passed`);
}
process.exit(process.argv.includes("--strict") && failed ? 1 : 0);
