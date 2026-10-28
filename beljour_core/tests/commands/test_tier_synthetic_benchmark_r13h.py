"""A local generated-image timing probe cannot self-certify device readiness.
Author: John Khan.
"""

from __future__ import annotations

from tests.commands.tier_synthetic_benchmark_r13h import run_synthetic_tier_probe


def test_real_guard_calls_measure_each_tier_without_release_claim() -> None:
    output = run_synthetic_tier_probe()
    assert output["missing_rows"] == 80
    assert output["release_qualified"] is False
    assert output["device_qualified"] is False
    assert output["identity_model"] == "synthetic_test_only"
    observed = output["measured_rows"]
    assert len(observed) == 2
    assert [row["tier"] for row in observed] == ["1080", "4k"]
    assert [row["minimum_long_edge"] for row in observed] == [1920, 3840]
    for row in observed:
        assert row["cleanup_first"] is True
        assert row["identity_lock_on"] is True
        assert row["guarded_preview_steps"] == 2
        assert row["guarded_export_steps"] == 2
        assert row["preview_ms"] >= 0
        assert row["export_ms"] >= 0
        assert row["neutral_reference_exact"] is True
        assert row["measured_device"] is False
