"""Preregistered body-photo evidence admission: no photographs or metrics bundled.

This is a Lane E definition/manifest validator, NOT the Lane A real-face runner.
Absent or underpowered evidence cannot become PASS. Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import re
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from ...arena.constants import BANNED_SOURCES

REPO_ROOT = Path(__file__).resolve().parents[4]
DEFINITIONS = REPO_ROOT / "tests/realface/pass_definitions_r25e"
SPEC_PATH = REPO_ROOT / "docs/posture-body-test-set.md"
DEFINITION_FORMAT = "beljour-posture-body-pass/1"
MANIFEST_FORMAT = "beljour-posture-body-manifest/1"
EXPECTED_DEFINITIONS = ("posture_levels", "posture_front", "posture_side")
LICENSES = frozenset({"CC0", "CC-BY-4.0", "Public-Domain", "Owner-Consent"})
BODY_SIZES = ("small", "medium", "large")
VIEWS = ("front", "side")
SHA = re.compile(r"[0-9a-f]{64}\Z")
MIN_PER_GROUP = 20
MIN_BODIES_PER_VIEW = 600
MIN_TOTAL_BODIES = 1200


class BodyEvidenceError(ValueError):
    """One or more preregistration or provenance rules were violated."""


@dataclass(frozen=True)
class BodyEvidenceState:
    status: str
    checked: int
    missing: tuple[str, ...]

    def to_json(self) -> dict[str, Any]:
        return {"status": self.status, "checked": self.checked, "missing": list(self.missing)}


def _load(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_definition(data: object, expected_id: str) -> dict[str, Any]:
    if not isinstance(data, dict):
        raise BodyEvidenceError("pass definition must be an object")
    if data.get("format") != DEFINITION_FORMAT or data.get("id") != expected_id:
        raise BodyEvidenceError("wrong definition id or format")
    if data.get("version") != 1 or data.get("author") != "John Khan":
        raise BodyEvidenceError("version 1 and named author are required")
    if data.get("status") != "awaiting body set":
        raise BodyEvidenceError("unmeasured definitions must remain awaiting body set")
    if data.get("face_set") != {"id": "body-r25e-1200", "number_of_bodies": MIN_TOTAL_BODIES}:
        raise BodyEvidenceError("a frozen 1200-body set must be declared")
    if data.get("view") not in ("all", *VIEWS):
        raise BodyEvidenceError("pass definition must name a view")
    ids = data.get("fix_ids")
    expected: set[str] = {
        "posture_levels": set(f"J{n}" for n in range(10, 17)),
        "posture_front": {"J10", "J11"},
        "posture_side": set(f"J{n}" for n in range(12, 17)),
    }[expected_id]
    if not isinstance(ids, list) or set(ids) != expected or len(ids) != len(expected):
        raise BodyEvidenceError("incorrect fix list")
    if data.get("slices") != ["view", "body_size", "monk", "body_size_monk"]:
        raise BodyEvidenceError("view, size and tone intersection slices are all required")
    if data.get("minimum_slice_bodies") != MIN_PER_GROUP:
        raise BodyEvidenceError("minimum group count must be 20")
    t = data.get("threshold")
    if not isinstance(t, dict) or t != {
        "minimum_reduction": 0.10,
        "maximum_overshoot": 0.0,
        "outside_band_change": 0.0,
        "minimum_identity_similarity": 0.95,
        "minimum_group_pass_rate": 0.95,
        "maximum_movement_share": 0.06,
        "maximum_lean_degrees": 8.0,
    }:
        raise BodyEvidenceError("preregistered metric thresholds must be unchanged")
    if data.get("regression") != {"required": True, "max_drop": 0.0}:
        raise BodyEvidenceError("no-drop regression rule is required")
    return data


def load_definitions(folder: Path = DEFINITIONS) -> dict[str, dict[str, Any]]:
    """Fail closed if even one expected definition is absent or malformed."""
    out: dict[str, dict[str, Any]] = {}
    for name in EXPECTED_DEFINITIONS:
        path = folder / f"{name}.json"
        try:
            out[name] = validate_definition(_load(path), name)
        except (OSError, ValueError) as exc:
            raise BodyEvidenceError(f"{name}: invalid or missing definition: {exc}") from exc
    return out


def spec_uses_canonical_denylist(path: Path = SPEC_PATH) -> bool:
    """The spec cites the one canonical list, never maintains a shadow deny-list."""
    text = path.read_text(encoding="utf-8")
    if "plumb_api.arena.constants.BANNED_SOURCES" not in text or "derived pose labels" not in text:
        return False
    return not any(re.search(rf"(?<!\w){re.escape(name)}(?!\w)", text.lower()) for name in BANNED_SOURCES)


def _check_item(item: Mapping[str, Any]) -> None:
    digest = item.get("photo_sha256")
    if not isinstance(digest, str) or SHA.fullmatch(digest) is None:
        raise BodyEvidenceError("every body needs the photo's SHA-256")
    if item.get("licence") not in LICENSES or not item.get("derived_metrics_allowed"):
        raise BodyEvidenceError("licence must allow commercial use and derived metrics")
    if item.get("released_adult") is not True or item.get("minors_excluded") is not True:
        raise BodyEvidenceError("adult consent/release evidence is required")
    if item.get("view") not in VIEWS or item.get("body_size") not in BODY_SIZES:
        raise BodyEvidenceError("front/side view and body-size slice are required")
    if item.get("monk") not in tuple(str(i) for i in range(1, 11)):
        raise BodyEvidenceError("an independently supplied Monk tone label is required")
    source = item.get("source")
    ancestors = item.get("source_ancestry")
    if not isinstance(source, str) or not source.strip() or not isinstance(ancestors, list):
        raise BodyEvidenceError("source and complete source ancestry are required")
    for label in (source, *ancestors):
        if not isinstance(label, str):
            raise BodyEvidenceError("source ancestry must be text")
        clean = re.sub(r"[^a-z0-9_-]", "", label.lower())
        if any(banned in clean for banned in BANNED_SOURCES):
            raise BodyEvidenceError("source or derived source is on the canonical deny-list")


def evaluate_manifest(
    manifest: Sequence[Mapping[str, Any]],
    definitions: Mapping[str, Mapping[str, Any]] | None = None,
) -> BodyEvidenceState:
    """Validation only, never a quality PASS without Lane A's frozen result runner."""
    validated = load_definitions() if definitions is None else definitions
    if set(validated) != set(EXPECTED_DEFINITIONS):
        raise BodyEvidenceError("all three registered definitions are required")
    if not manifest:
        return BodyEvidenceState("NOT_RUN", 0, ("awaiting body set",))
    found: set[str] = set()
    groups: dict[tuple[str, str, str], int] = {}
    for item in manifest:
        _check_item(item)
        digest = str(item["photo_sha256"])
        if digest in found:
            raise BodyEvidenceError("body SHA-256 reused in a frozen set")
        found.add(digest)
        key = (str(item["view"]), str(item["body_size"]), str(item["monk"]))
        groups[key] = groups.get(key, 0) + 1
    missing: list[str] = []
    if len(manifest) < MIN_TOTAL_BODIES:
        missing.append("fewer than 1200 released bodies")
    for view in VIEWS:
        if sum(amount for key, amount in groups.items() if key[0] == view) < MIN_BODIES_PER_VIEW:
            missing.append(f"{view} below 600")
        for size in BODY_SIZES:
            for tone in (str(i) for i in range(1, 11)):
                if groups.get((view, size, tone), 0) < MIN_PER_GROUP:
                    missing.append(f"{view}/{size}/{tone} underpowered")
    if missing:
        return BodyEvidenceState("UNPROVEN", len(manifest), tuple(missing))
    return BodyEvidenceState("NOT_RUN", len(manifest), ("preregistered external measurements not yet executed",))


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--validate-definitions", action="store_true")
    parser.add_argument("--manifest", type=Path)
    args = parser.parse_args(argv)
    if not args.validate_definitions:
        parser.error("--validate-definitions is required to audit these new definitions")
    try:
        loaded = load_definitions()
        for key, data in loaded.items():
            print(f"{key}: awaiting body set; {len(data['fix_ids'])} fixes; NOT_RUN")
        if args.manifest is None:
            print("NOT_RUN: no released body manifest supplied")
            return 0
        raw = _load(args.manifest)
        if not isinstance(raw, dict) or raw.get("format") != MANIFEST_FORMAT:
            raise BodyEvidenceError("invalid body manifest format")
        rows = raw.get("rows")
        if not isinstance(rows, list):
            raise BodyEvidenceError("body manifest rows must be a list")
        print(json.dumps(evaluate_manifest(rows, loaded).to_json(), sort_keys=True))
        return 0
    except (OSError, ValueError) as exc:
        print(f"UNPROVEN: {exc}")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
