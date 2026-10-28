"""Small synthetic gate fixtures for the C16 definition tests (no faces, no models).

Builds a committed-looking Definition from a shipped pass definition with a
tiny face set, a frozen plan for it, and row dictionaries in the runner's
shape, so gates.evaluate can be exercised on numbers alone.
Author: John Khan.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

REALFACE = Path(__file__).resolve().parents[3] / "tests" / "realface"
if str(REALFACE) not in sys.path:
    sys.path.insert(0, str(REALFACE))

import definitions  # noqa: E402
import gates  # noqa: E402
import run_state  # noqa: E402

TONES = ("1", "10")


def tiny_definition(name: str, faces: int, folder: str = "pass_definitions") -> Any:
    content = json.loads((REALFACE / folder / f"{name}.json").read_text(encoding="utf-8"))
    content["face_set"] = {"id": "drawn-c16", "number_of_faces": faces}
    content["required_monk_tones"] = list(TONES)
    content["required_matrix"] = {"gender": ["female"], "age": ["30-39"]}
    return definitions.Definition(name, run_state.digest(content), content, True)


def frozen_plan(definition: Any) -> dict[str, Any]:
    faces = []
    for index in range(definition.expected_faces):
        tone = TONES[index % 2]
        labels = {"source": "drawn", "race": "not-inferred", "gender": "female", "age": "30-39",
                  "monk": tone, "monk_gender_age": f"{tone}/female/30-39", "slice": "drawn",
                  "size": "large", "yaw": "frontal", "occlusion": "none"}
        faces.append({"face_id": f"drawn-{index}", "labels": labels})
    return {"run_id": "drawn-run", "faces": faces, "number_of_faces": len(faces),
            "face_set_sha256": run_state.digest(faces), "engine_sha256": "engine", "max_side": 640,
            "include": ["drawn-c16"], "model_hashes": {}, "definition_committed": True,
            "definitions": {definition.id: definition.sha256}}


def observation(definition: Any, plan: dict[str, Any], face: int, check: str, passed: bool,
                **fields: Any) -> dict[str, Any]:
    return {"module": definition.id, "check": check, "face_id": f"drawn-{face}",
            "run_id": plan["run_id"], "pass": passed, "metric_pass": passed,
            "definition_sha256": definition.sha256, **fields}


def gate(definition: Any, plan: dict[str, Any], rows: list[dict[str, Any]]) -> dict[str, Any]:
    first = gates.evaluate(rows, {definition.id: definition}, plan)
    evidence = gates.evaluate(rows, {definition.id: definition}, plan, baseline=first)
    found: dict[str, Any] = evidence["gates"][0]
    return found
