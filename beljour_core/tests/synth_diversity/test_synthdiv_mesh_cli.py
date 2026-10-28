"""Local entry-point smoke tests for exact-face synthetic mesh plan and audit.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from lab.synth_diversity.stress_mesh_budget import make_mesh_budget
from lab.synth_diversity.stress_mesh_cli import main
from lab.synth_diversity.stress_mesh_exchange import write_mesh_observations
from lab.synth_diversity.stress_mesh_oracle import MeshDetection, MeshObservation, MeshPolicy
from lab.synth_diversity.stress_mesh_report import MeshAcceptance
from lab.synth_diversity.stress_pose_pack import Rect
from lab.synth_diversity.stress_profiles import ALL_PROFILES
from lab.synth_diversity.stress_schedule import StressSchedule
from lab.synth_diversity.types import SyntheticInputError


def saved_config(path: Path, value: dict[str, object]) -> Path:
    path.write_text(json.dumps(value, sort_keys=True))
    return path


def sample_results(tmp_path: Path, faces: int = 1000) -> tuple[Path, Path, Path]:
    budget = make_mesh_budget(StressSchedule(seed=29, count=len(ALL_PROFILES)), faces)
    policy = MeshPolicy(0.45, 0.45, 0.45, 0.5, True, 20, True, 15.0, True)
    acceptance = MeshAcceptance({"group": 0.95, "cropped": 0.95, "profile": 0.95},
                                1, 0.95, 0)

    def outcomes() -> tuple[MeshObservation, ...]:
        rows: list[MeshObservation] = []
        for scene in budget.scenes():
            detections: list[MeshDetection] = []
            for subject in scene.subjects:
                box = subject.rectangle
                x = max(0.0, box.x)
                y = max(0.0, box.y)
                clipped = Rect(x, y, min(1.0, box.x + box.width) - x,
                               min(1.0, box.y + box.height) - y)
                detections.append(MeshDetection(clipped, 0.99, 468,
                                                float(subject.yaw_degrees)))
            rows.append(MeshObservation(scene.identity, tuple(detections)))
        return tuple(rows)

    result = tmp_path / "run"
    write_mesh_observations(result, budget, policy, outcomes(), "synthetic_fixture")
    policy_path = saved_config(tmp_path / "policy.json", {
        name: value for name, value in policy.to_dict().items() if name != "format"
    })
    acceptance_path = saved_config(tmp_path / "acceptance.json", {
        name: value for name, value in acceptance.to_dict().items() if name != "format"
    })
    return result, policy_path, acceptance_path


def test_cli_can_plan_and_verify_1000_declared_faces(
    tmp_path: Path, capsys: pytest.CaptureFixture[str],
) -> None:
    target = tmp_path / "plan"
    common = ["--seed", "29", "--faces", "1000", "--folder", str(target)]
    assert main(["plan", *common]) == 0
    first = json.loads(capsys.readouterr().out)
    assert first["budget"]["face_budget"] == 1000
    assert first["budget"]["scene_count"] == 735
    assert main(["verify", *common]) == 0
    second = json.loads(capsys.readouterr().out)
    assert second["verified_plan"]["rows"] == 735
    assert second["face_budget"] == 1000


def test_cli_audit_of_supplied_fixture_results(
    tmp_path: Path, capsys: pytest.CaptureFixture[str],
) -> None:
    folder = tmp_path / "plan"
    common = ["--seed", "29", "--faces", "1000", "--folder", str(folder)]
    main(["plan", *common])
    capsys.readouterr()
    results, policy_file, acceptance_file = sample_results(tmp_path)
    arguments = [
        "audit", *common,
        "--results", str(results),
        "--policy", str(policy_file),
        "--acceptance", str(acceptance_file),
    ]
    assert main(arguments) == 0
    report = json.loads(capsys.readouterr().out)
    assert report["synthetic_screen"] == "PASS"
    assert report["real_face_gate"] == "NOT_EVALUATED"
    assert report["runner_attestation"] == "SUPPLIED_RESULTS_NOT_INDEPENDENTLY_ATTESTED"


def test_cli_refuses_audit_without_all_three_required_paths(tmp_path: Path) -> None:
    folder = tmp_path / "plan"
    common = ["--seed", "29", "--faces", "20", "--folder", str(folder)]
    main(["plan", *common])
    with pytest.raises(SyntheticInputError, match="requires results"):
        main(["audit", *common])


def test_cli_cannot_make_second_manifest_at_same_path(tmp_path: Path) -> None:
    args = ["plan", "--seed", "19", "--faces", "20", "--folder", str(tmp_path / "plan")]
    assert main(args) == 0
    with pytest.raises(SyntheticInputError):
        main(args)


def test_cli_plan_and_verify_reject_seed_mismatch(tmp_path: Path) -> None:
    folder = tmp_path / "plan"
    assert main(["plan", "--seed", "99", "--faces", "20", "--folder", str(folder)]) == 0
    with pytest.raises(SyntheticInputError):
        main(["verify", "--seed", "98", "--faces", "20", "--folder", str(folder)])


def test_cli_rejects_unknown_policy_fields(tmp_path: Path) -> None:
    folder = tmp_path / "plan"
    main(["plan", "--seed", "29", "--faces", "20", "--folder", str(folder)])
    bad = saved_config(tmp_path / "bad.json", {"allow_unverified": True})
    with pytest.raises(SyntheticInputError):
        main(["audit", "--seed", "29", "--faces", "20", "--folder", str(folder),
              "--results", str(tmp_path), "--policy", str(bad),
              "--acceptance", str(bad)])


def test_cli_rejects_symlinked_policy_config(tmp_path: Path) -> None:
    folder = tmp_path / "plan"
    main(["plan", "--seed", "29", "--faces", "20", "--folder", str(folder)])
    real = saved_config(tmp_path / "real.json", {})
    link = tmp_path / "linked.json"
    link.symlink_to(real)
    with pytest.raises(SyntheticInputError):
        main(["audit", "--seed", "29", "--faces", "20", "--folder", str(folder),
              "--results", str(tmp_path), "--policy", str(link),
              "--acceptance", str(real)])
