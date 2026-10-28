"""R27A 1.0-5.0 turn control: strict identity and bystander preservation.

All meshes and photos are drawn by the synthetic generator. No real faces.
"""
from __future__ import annotations

import numpy as np
import pytest

from plumb_api.engines.core.refusal import Refusal
from plumb_api.engines.shape import turn_level
from plumb_api.engines.shape.synthetic_heads import drawn_head
from plumb_api.vision.face_region_audit import audit


def scene() -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    mesh, source = drawn_head(0, width=220, height=240)
    height, width = source.shape[:2]
    chosen = np.zeros((height, width), dtype=np.float32)
    bystander = np.zeros_like(chosen)
    chosen[:, :width - 28] = 1
    bystander[:, width - 30:] = 1
    return mesh, source, chosen, bystander


@pytest.mark.parametrize("level", (1.0, 1.1, 2.0, 3.5, 5.0))
def test_decimal_step_and_signed_direction(level: float) -> None:
    assert turn_level.level_value(level) == level
    assert turn_level.requested_yaw(level, "right") == pytest.approx(-turn_level.requested_yaw(level, "left"))
    assert abs(turn_level.requested_yaw(level, "left")) <= 8


@pytest.mark.parametrize("value", (False, True, 1.05, 5.01, -1, float("nan"), float("inf"), "3.0"))
def test_invalid_level_refuses(value: object) -> None:
    with pytest.raises(ValueError):
        turn_level.level_value(value)


def test_level_one_is_byte_identical_and_does_not_disable_lock() -> None:
    mesh, source, chosen, bystander = scene()
    result = turn_level.render_level(source, mesh, 1.0, chosen, bystanders=(bystander,))
    assert isinstance(result, turn_level.TurnLevelResult)
    assert result.identity_lock
    assert result.max_move_iod == 0
    assert result.effective_yaw == 0
    np.testing.assert_array_equal(result.image, source)
    assert result.selected_pixels > 0 and result.protected_pixels > 0
    assert "image" not in result.counts()


def test_geometric_cap_uses_same_limit_as_advanced_renderer() -> None:
    mesh, _, _, _ = scene()
    for cap in (turn_level.LOCKED_MOVE_IOD, turn_level.UNLOCKED_MOVE_IOD):
        yaw = turn_level.safe_yaw(mesh, 8.0, cap)
        proposal = turn_level.turn.project(mesh, yaw=yaw, pivot="silhouette").points
        iod = turn_level.frame(mesh[:, :2]).iod
        max_move = float(np.max(np.linalg.norm(proposal - mesh[:, :2], axis=1))) / iod
        assert 0 < yaw <= 8
        assert max_move <= cap + 1e-9
    assert turn_level.safe_yaw(mesh, 8.0, turn_level.LOCKED_MOVE_IOD) < turn_level.safe_yaw(
        mesh, 8.0, turn_level.UNLOCKED_MOVE_IOD
    )


def test_no_person_mask_or_fully_protected_selection_refuses() -> None:
    mesh, source, chosen, _ = scene()
    missing = np.zeros_like(chosen)
    for selected, bystanders in ((missing, ()), (chosen, (chosen,))):
        outcome = turn_level.render_level(source, mesh, 3, selected, bystanders=bystanders)
        assert isinstance(outcome, Refusal)
        assert outcome.code == "invalid_turn_input"
    np.testing.assert_array_equal(source, scene()[1])


def test_invalid_weights_and_bad_mesh_return_coded_refusal() -> None:
    mesh, source, chosen, bystander = scene()
    corrupted = chosen.copy()
    corrupted[0, 0] = np.nan
    refused = turn_level.render_level(source, mesh, 3, corrupted, bystanders=(bystander,))
    assert isinstance(refused, Refusal)
    assert refused.code == "invalid_turn_input"
    invalid = mesh.copy()
    invalid[33, 0] = np.inf
    bad = turn_level.render_level(source, invalid, 3, chosen)
    assert isinstance(bad, Refusal)
    assert bad.code == "invalid_turn_input"


def test_turn_protects_bystander_and_enforces_existing_engine_checks() -> None:
    mesh, source, chosen, bystander = scene()
    outcome = turn_level.render_level(source, mesh, 4, chosen, bystanders=(bystander,), identity_lock=False)
    assert isinstance(outcome, turn_level.TurnLevelResult)
    assert outcome.effective_yaw > 0
    assert np.any(outcome.image != source)
    assert outcome.max_move_iod <= turn_level.UNLOCKED_MOVE_IOD + 1e-8
    np.testing.assert_array_equal(source[:, -28:], outcome.image[:, -28:])
    report = audit(source, outcome.image, chosen, [bystander])
    assert report.passed and report.changed_bystanders == 0
