/** R29E fixtures: counts-only body evidence reports and coverage plans.
 * `pythonOutputs()` runs the real Python body pipeline on the artificial control manifest
 * and returns its browser report and coverage plan, so the TypeScript readers are tested
 * against what the offline command actually emits. Counts only; no photographs.
 * Author: John Khan. */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { expectedNumericStatus, expectedRowStatus, registeredRows } from "../dist/js/body/posture-proof.js";

const API = fileURLToPath(new URL("../../api", import.meta.url));

/** Bodies per slice for a set of `perCell` bodies in every size x tone intersection. */
function bodiesFor(slice, perCell) {
  return { view: 30 * perCell, body_size: 10 * perCell, monk: 3 * perCell, body_size_monk: perCell }[slice];
}

/** A consistent report where `outcome(row)` gives [passed, refused] per intersection cell. */
export function cellReport(perCell = 20, outcome = (cell) => [cell.bodies, 0]) {
  const cells = new Map();
  for (const row of registeredRows()) {
    if (row.slice !== "body_size_monk") continue;
    const [passed, refused] = outcome({ ...row, bodies: perCell });
    cells.set(`${row.fix}|${row.group}`, { passed, refused });
  }
  const rows = registeredRows().map((row) => {
    const own = [...cells.entries()].filter(([key]) => {
      const [fix, group] = key.split("|");
      if (fix !== row.fix) return false;
      const [size, tone] = group.split("/");
      return row.slice === "view" || (row.slice === "body_size" && size === row.group) ||
        (row.slice === "monk" && tone === row.group) || (row.slice === "body_size_monk" && group === row.group);
    }).map(([, value]) => value);
    const bodies = bodiesFor(row.slice, perCell);
    const passed = own.reduce((sum, item) => sum + item.passed, 0);
    const refused = own.reduce((sum, item) => sum + item.refused, 0);
    const counts = { bodies, expected_jobs: bodies, measured_jobs: bodies, refused_jobs: refused, passed_jobs: passed };
    return { ...row, ...counts, status: expectedRowStatus(counts) };
  });
  const tops = rows.filter((row) => row.slice === "view");
  const total = (key) => tops.reduce((sum, row) => sum + row[key], 0);
  const setStatus = perCell >= 20 ? "NOT_RUN" : "UNPROVEN";
  return { format: "beljour-posture-body-evidence/1", run: "9".repeat(64), definitions_sha256: "8".repeat(64),
    set_status: setStatus, numeric_status: expectedNumericStatus(rows, setStatus), release_status: "NOT_RUN",
    human_review: "NOT_RUN", completion: { expected_jobs: total("expected_jobs"), recorded_jobs: total("measured_jobs"),
      missing_jobs: 0, refused_jobs: total("refused_jobs"), passed_jobs: total("passed_jobs"),
      failed_jobs: total("measured_jobs") - total("passed_jobs") - total("refused_jobs") }, rows };
}

const SCRIPT = `
import json
from plumb_api.engines.posture.body_freeze import control_rows, freeze_manifest, FIX_IDS_BY_VIEW
from plumb_api.engines.posture.body_ledger import BodyLedger
from plumb_api.engines.posture.body_measurement import FACE_FIX_IDS, measurement_record, parse_measurement
from plumb_api.engines.posture.body_scorecard import build_scorecard
from plumb_api.engines.posture.body_public import browser_report
from plumb_api.engines.posture.body_coverage import coverage_plan
run = freeze_manifest(control_rows(1), shard_count=4)
ledger = BodyLedger(run)
for body in run.bodies[:40]:
    for fix in FIX_IDS_BY_VIEW[body.view]:
        ledger.record(parse_measurement(measurement_record(run.fingerprint, body.shard, body.photo_sha256, fix,
            identity_similarity=0.99 if fix in FACE_FIX_IDS else None)))
print(json.dumps({"evidence": browser_report(build_scorecard(ledger)), "coverage": coverage_plan(run)}))
`;

let cached;
/** Real Python outputs, or null when Python and the api package are unavailable here. */
export function pythonOutputs() {
  if (cached !== undefined) return cached;
  const result = spawnSync("python3", ["-c", SCRIPT], { cwd: API, encoding: "utf8", timeout: 120000,
    env: { ...process.env, PYTHONPATH: API } });
  cached = result.status === 0 ? JSON.parse(result.stdout) : null;
  return cached;
}
