"""R28E scalar measurement schema and committed-limit checks. Author: John Khan."""
from __future__ import annotations

import math
from typing import Any

import pytest

from . import body_measurement as M

RUN = "a" * 64
BODY = "b" * 64


def _record(fix: str = "J14", **changes: Any) -> dict[str, Any]:
    return M.measurement_record(RUN, 3, BODY, fix, **changes)


def _check(fix: str = "J14", **changes: Any) -> tuple[bool, tuple[str, ...]]:
    return M.check_measurement(M.parse_measurement(_record(fix, **changes)))


def test_a_full_level_record_inside_every_limit_passes() -> None:
    assert _check() == (True, ())
    assert _check("J10") == (False, ("identity_not_measured",))
    assert _check("J10", identity_similarity=0.96) == (True, ())


@pytest.mark.parametrize(("changes", "reason"), [
    ({"strength_level": 4.9}, "not_full_strength"),
    ({"lock_level": 3.0}, "not_default_lock"),
    ({"head_changed_pixels": 1}, "protected_head_changed"),
    ({"outside_band_changed_pixels": 2}, "outside_band_changed"),
    ({"movement_share": 0.0601}, "movement_over_cap"),
    ({"movement_share": -0.01}, "movement_over_cap"),
    ({"min_jacobian": 0.19}, "fold_guard_below_floor"),
    ({"reduction": 0.09}, "insufficient_reduction"),
    ({"overshoot": 0.001}, "overshot_neutral"),
    ({"simulation_label": "Edited"}, "simulation_label_missing"),
    ({"identity_similarity": 1.5}, "identity_out_of_range"),
])
def test_each_committed_limit_is_enforced(changes: dict[str, Any], reason: str) -> None:
    passed, reasons = _check(**changes)
    assert not passed and reasons == (reason,)


def test_lean_limit_applies_to_j10_and_face_fixes_need_similarity() -> None:
    assert _check("J10", lean_degrees=8.5, identity_similarity=0.99)[1] == ("lean_over_cap",)
    assert _check("J10", lean_degrees=None, identity_similarity=0.99)[1] == ("lean_over_cap",)
    for fix in M.FACE_FIX_IDS:
        assert "identity_not_measured" in _check(fix, lean_degrees=1.0)[1]
        assert "identity_below_floor" in _check(fix, lean_degrees=1.0, identity_similarity=0.94)[1]
    assert M.FACE_FIX_IDS == {"J10", "J12", "J13"}


def test_explicit_refusals_never_pass() -> None:
    refused = M.parse_measurement({"format": M.MEASUREMENT_FORMAT, "run": RUN, "shard": 0, "photo_sha256": BODY,
                                   "fix": "J11", "view": "front", "status": "refused", "refusal": "mask_rejected"})
    assert M.check_measurement(refused) == (False, ("refused:mask_rejected",))


@pytest.mark.parametrize(("changes", "code"), [
    ({"format": "other"}, "invalid_measurement_format"),
    ({"status": "skipped"}, "invalid_measurement_schema"),
    ({"subject": "x"}, "invalid_measurement_schema"),
    ({"view": "front"}, "wrong_view_measurement"),
    ({"fix": "J99"}, "wrong_view_measurement"),
    ({"run": "Z" * 64}, "invalid_measurement_binding"),
    ({"shard": -1}, "invalid_measurement_binding"),
    ({"photo_sha256": "x"}, "invalid_measurement_binding"),
    ({"movement_share": math.nan}, "invalid_measurement_value"),
    ({"movement_share": True}, "invalid_measurement_value"),
    ({"head_changed_pixels": 0.0}, "invalid_measurement_value"),
    ({"simulation_label": None}, "invalid_measurement_value"),
])
def test_malformed_records_are_refused(changes: dict[str, Any], code: str) -> None:
    record = {**_record(), **changes}
    with pytest.raises(M.MeasurementError, match=code):
        M.parse_measurement(record)


def test_missing_fields_are_refused() -> None:
    record = _record()
    del record["min_jacobian"]
    with pytest.raises(M.MeasurementError, match="invalid_measurement_schema"):
        M.parse_measurement(record)


def test_refusal_codes_are_constrained() -> None:
    with pytest.raises(M.MeasurementError, match="invalid_refusal_code"):
        M.parse_measurement({"format": M.MEASUREMENT_FORMAT, "run": RUN, "shard": 0, "photo_sha256": BODY,
                             "fix": "J11", "view": "front", "status": "refused", "refusal": "Body of /home/x"})
