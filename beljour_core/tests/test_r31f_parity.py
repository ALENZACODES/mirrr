"""R31F two-tone parity vectors: the committed file stays in sync with the Python plan.

web/test/r31f-parity.test.mjs recomputes the same 30 cases in the browser.
Author: John Khan.
"""
from __future__ import annotations

from collections import Counter

from plumb_api.engines.concealer import colour_parity


def test_parity_file_is_in_sync() -> None:
    assert colour_parity.parity_in_sync()


def test_thirty_cases_cover_mixes_and_refusals() -> None:
    cases = colour_parity.parity_cases()
    assert len(cases) == 30 and len({c["id"] for c in cases}) == 30
    codes = Counter(c["code"] for c in cases)
    assert codes[None] >= 25 and codes["too_far"] >= 1 and codes["too_light"] >= 1
    assert len({c["second_percent"] for c in cases if c["code"] is None}) >= 10
    assert any(c["approve_lighter"] for c in cases)
    for case in cases:
        assert (case["rgb"] is None) == (case["code"] is not None)
        if case["code"] is None:
            assert case["delta_e"] <= 6.0
            assert case["approve_lighter"] or case["level"] <= case["reading_level"]


def test_payload_declares_synthetic_screen_estimates() -> None:
    payload = colour_parity.parity_payload()
    assert payload["synthetic"] is True and payload["tolerance_delta_e"] == 1e-6
    assert "not physical" in payload["note"]
