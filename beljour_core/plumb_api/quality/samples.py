"""The reference quality report both languages validate (parity/report-sample-python.json).

Built from the local tint engine on two synthetic photos with a fixed date, so it is
the same on every machine. Regenerate with `python scripts/make_parity_vectors.py`.
Author: John Khan.
"""
from __future__ import annotations

from typing import Any

from ..engines.core.local import TintEngine
from . import harness

SAMPLE_DATE = "2026-10-22"


def sample_report() -> dict[str, Any]:
    photos = [harness.synthetic_photo(1), harness.synthetic_photo(2)]
    stops = [harness.StopSpec("natural", {"rgb": [180, 40, 60], "strength": 0.3}),
             harness.StopSpec("full", {"rgb": [180, 40, 60], "strength": 1.0}, target="#B4283C")]
    return harness.run("tint", "1.0.0", TintEngine(), photos, stops, skin="skin", created=SAMPLE_DATE).report
