"""Offline synthetic command-lock sweep for a Tuesday review worksheet.

Generated pixels only. This is technical evidence, not a face dataset,
identity-model clearance, human evaluation, or a release authorization.
Author: John Khan.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

from plumb_api.commands.embedders import DeterministicTestEmbedder
from plumb_api.commands.frames import ImageFrame
from plumb_api.commands.identity import IdentityGuard
from plumb_api.commands.observed_sweep import run_observed_sweep
from plumb_api.commands.pose_geometry import PoseEvidence, PoseHandle
from plumb_api.commands.r2h_session import R2HSession
from plumb_api.commands.regions import FaceRegions
from plumb_api.commands.tuesday_sheet import render_tuesday_lock_sheet
from plumb_api.commands.tuesday_lock import (
    build_tuesday_lock_packet,
    verify_tuesday_lock_json,
)


def sample() -> ImageFrame:
    """Original abstract blocks and gradients, not synthetic human faces."""
    height = 24
    width = 26
    yy, xx = np.indices((height, width))
    pixels = np.stack((
        np.asarray((xx * 17 + yy * 3 + 54) % 256, dtype=np.uint8),
        np.asarray((xx * 7 + yy * 23 + 18) % 256, dtype=np.uint8),
        np.asarray((xx * 11 + yy * 19 + 91) % 256, dtype=np.uint8),
    ), axis=-1)
    return ImageFrame(width, height, 3, pixels.tobytes())


def session(source: ImageFrame) -> R2HSession:
    """Only injected approved-test double and explicitly checked masks."""
    face = np.zeros((source.height, source.width), dtype=np.uint8)
    face[2:13, 4:21] = 255
    hair = np.zeros_like(face)
    hair[3:8, 6:18] = 255
    eye = np.zeros_like(face)
    eye[8:10, 7:11] = 255
    fixed = np.zeros_like(face)
    fixed[3:6, 6:19] = 255
    regions = FaceRegions(
        source.width, source.height,
        skin=face.tobytes(), hair=hair.tobytes(),
        eyes=eye.tobytes(), protected=fixed.tobytes(),
        evidence="synthetic_test",
    )
    body = np.zeros_like(face)
    body[12:23, 4:23] = 255
    pose = PoseEvidence(source.width, source.height, body.tobytes(), (
        PoseHandle("left", 0.30, 0.66, -0.010, 0.003),
        PoseHandle("right", 0.73, 0.66, 0.010, 0.003),
    ), "synthetic_test")
    identity = IdentityGuard(DeterministicTestEmbedder(), allow_test_embedder=True)
    result = R2HSession(identity=identity, tile_size=32)
    result.open_photo(source, regions=regions, pose=pose)
    return result


def generate() -> tuple[str, dict[str, object]]:
    """Execute every decimal level on every command, not invented pass rows."""
    source = sample()
    observed = run_observed_sweep(
        session(source), source,
        checked_protected_regions=True,
    )
    packet = build_tuesday_lock_packet(
        observed.observations,
        run_id="tuesday-205-synthetic-r10h",
        renderer_build="r10h-local-cpu",
    )
    content = packet.to_json()
    verify_tuesday_lock_json(content)
    summary: dict[str, object] = {
        "attempted": observed.attempted,
        "captured": observed.captured,
        "cancelled": observed.cancelled,
        "problems": [problem.public_metadata() for problem in observed.problems],
        "technical_status": packet.technical_status,
        "matrix_status": packet.matrix.status,
        "missing": sum(row.status == "missing" for row in packet.rows),
        "safety_failed": sum(row.status == "failed_safety" for row in packet.rows),
        "over_budget": sum(row.status == "over_budget" for row in packet.rows),
        "independent_face_evidence": False,
        "release_qualified": False,
    }
    return content, summary


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create a local, image-free 205-slot synthetic lock worksheet."
    )
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--sheet", type=Path, default=None)
    arguments = parser.parse_args()
    payload, summary = generate()
    arguments.output.write_text(payload + "\n", encoding="utf-8")
    if arguments.sheet is not None:
        arguments.sheet.write_text(render_tuesday_lock_sheet(payload), encoding="utf-8")
    print(json.dumps(summary, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
