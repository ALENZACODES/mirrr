"""Append-only R15 Lane B registry extension over the shared base snapshot.

The parallel lane owns the existing snapshot. This extension changes the effective
status of its 17 W rows without reserializing Lane A's shared JSON. The old registry
readers remain a compatibility view; effective_women_rows is the current combined
view used by this lane's gate and report. Integration after both lanes merge can
materialize that view deliberately, without duplicate JSON keys or lost changes.
Author: John Khan.
"""
from __future__ import annotations

import json
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any

VERSION = "beljour-eyes-brows-registry/1"
EYE_IDS = ("W59", "W60", "W61", "W62", "W63", "W64", "W65", "W66", "W67", "W75", "W76")
BROW_IDS = ("W69", "W70", "W71", "W72", "W73", "W74")
FILTER_IDS = ("ink-study", "pigment-oil", "rain-expression", "meadow-crown")
NOTES = {
    "W59": "Procedural extension strands and technician map; sparse-density warnings; no new learned model.",
    "W60": "Per-eye geometry and five lash maps; anatomy-specific warnings; professional fit is not established.",
    "W61": "Observed/manual lash traces only; lift preserves measured count and length; no unseen lash synthesis.",
    "W62": "Original strip and cluster geometries fitted per eye; glasses-clearance warning; no product catalogue claim.",
    "W63": "Coats observed upper/lower traces only; lengthening, volumising, tubing and smudge controls.",
    "W64": "Separate eye frames and anatomy-specific wing/tightline geometry; no facial reshaping.",
    "W65": "Graphic and soft liner support is bounded by lid geometry; contrast warnings never force thicker lines.",
    "W66": "Cut crease, halo and smokey placement; assumed digital pigment response disclosed.",
    "W67": "Continuous light-angle simulation of foil/duochrome response; no claimed product reflectance.",
    "W69": "Tint confined to observed brow detail with grey resistance and first-week/settled/faded states.",
    "W70": "Observed hair transport and flow guide; sparse/short warnings; no skin smoothing or invented growth.",
    "W71": "Original healed-default hair strokes, explicit adult confirmation and consultation framing.",
    "W72": "Capped powder and nano comparison; adult confirmation; hypothetical healing and retention only.",
    "W73": "Editable asymmetric geometry guides; no automatic thinning and no treatment promise.",
    "W74": "Hypothetical month-by-month diary; zero assumed growth default, no efficacy or sales claims.",
    "W75": "Dedicated per-anatomy placement; artist and real-model validation NOT TESTED.",
    "W76": "Original navy/burgundy/forest liner and observed-lash coating; iris colour unchanged.",
}


def built_entries() -> dict[str, dict[str, Any]]:
    entries: dict[str, dict[str, Any]] = {}
    for wid in (*EYE_IDS, *BROW_IDS):
        package = "eyes" if wid in EYE_IDS else "brows"
        entries[wid] = {
            "modules": [f"api/plumb_api/engines/{package}", f"web/src/engines/{package}",
                        "web/src/ui/eyes-brows/session.ts", "web/src/ui/eyes-brows/entry.ts"],
            "tests": ["api/tests/test_eyes_brows_integration.py", "web/test/eyes-brows-integration.test.mjs"],
            "note": NOTES[wid] + " Built local fallback; frozen real-face quality remains Not tested.",
        }
    return entries


def effective_women_rows(base: Sequence[Mapping[str, Any]] | None = None) -> list[dict[str, Any]]:
    """Apply only this lane's IDs; retain every other lane's fields and status."""
    from . import registry
    source = registry.women_rows() if base is None else base
    if [str(row.get("id")) for row in source] != [f"W{i}" for i in range(1, 101)]:
        raise ValueError("extension requires the complete ordered W1..W100 base")
    built = built_entries()
    result = []
    for item in source:
        row = dict(item)
        entry = built.get(str(row["id"]))
        if entry:
            # A later integrated result is never downgraded by a historical overlay.
            if row.get("status") == "built" and row.get("result"):
                result.append(row)
                continue
            row.update(entry)
            row["status"] = "built"
            row["tested"] = "Not tested"
            row["implementation_provider"] = "local procedural fallback"
            row["evidence_status"] = "synthetic_verified_realface_unproven"
            row.pop("blocked_reason", None)
        result.append(row)
    return result


def artistic_rows() -> list[dict[str, Any]]:
    names = ("Ink Study", "Pigment Oil", "Rain Expression", "Meadow Crown")
    requirements = (("hair mask", "eye protection"), (), ("478-point mesh",), ("478-point mesh", "hair mask"))
    return [
        {"id": fid, "name": name, "status": "Built", "tested": "Not tested", "provider": "local",
         "source_row": row, "simulation_label": True, "round": "R15 Lane B",
         "requires": list(needs), "modules": ["api/plumb_api/filters/artistic", "web/src/filters/artistic"],
         "tests": ["api/tests/test_eyes_brows_integration.py", "web/test/eyes-brows-integration.test.mjs"]}
        for fid, name, row, needs in zip(FILTER_IDS, names, (18, 21, 16, 15), requirements, strict=True)
    ]


def module_entries() -> list[dict[str, Any]]:
    """Ownership entries for the shared registry, appended without editing its JSON."""
    return [{"id": "r15b-eyes-brows-art", "name": "Eyes, lashes, brows and original artistic simulations",
             "status": "Built", "tested": "Not tested", "provider": "local",
             "modules": ["api/plumb_api/engines/eyes", "api/plumb_api/engines/brows",
                         "web/src/engines/eyes", "web/src/engines/brows",
                         "api/plumb_api/filters/artistic", "web/src/filters/artistic",
                         "web/src/ui/eyes-brows"],
             "tests": ["api/tests/test_eyes_brows_integration.py", "web/test/eyes-brows-integration.test.mjs"],
             "note": "Additive parallel-lane registry: use effective_women_rows for the combined W status."}]


def validate(root: Path | None = None) -> list[str]:
    from . import registry, women
    root = registry.REPO_ROOT if root is None else root
    rows = effective_women_rows()
    problems = women.validate_women(rows, root=root)
    if len(built_entries()) != 17 or "W68" in built_entries():
        problems.append("Lane B must own exactly 17 eye/brow W entries and exclude W68")
    for entry in artistic_rows():
        for path in (*entry["modules"], *entry["tests"]):
            if not (root / path).exists():
                problems.append(f"{entry['id']}: missing {path}")
    return problems


def document() -> str:
    from . import women
    lines = ["## R15 Lane B — effective registry", "", "Author: John Khan.", "",
             "The append-only extension below takes precedence for these 17 W rows. "
             "Other rows retain their shared-base status. Built records implementation and synthetic tests; "
             "it does not mean real-face or expert acceptance.", "", women.markdown(effective_women_rows()), "",
             "| Original filter | Gap row | Implementation | Real-face status |", "| --- | --- | --- | --- |"]
    lines += [f"| {row['name']} | {row['source_row']} | Built | Not tested |" for row in artistic_rows()]
    return "\n".join(lines) + "\n"


def main() -> int:
    problems = validate()
    print(json.dumps({"format": VERSION, "author": "John Khan", "lane_w_built": len(built_entries()),
                      "lane_filters_built": len(artistic_rows()), "errors": problems,
                      "realface": "Not tested"}, sort_keys=True))
    return int(bool(problems))


if __name__ == "__main__":
    raise SystemExit(main())
