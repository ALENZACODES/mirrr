"""Speed budget: each look under 100 ms on a 1024 x 1024 picture on CPU.

ASSUMED budget. The median of three runs is used so one slow scheduler tick
does not fail the suite; shared CI machines get a 3x allowance through the
SEASONAL_SPEED_FACTOR environment variable when set.
Author: John Khan.
"""

from __future__ import annotations

import os
import statistics
import time

import pytest

from plumb_api.seasonal.packs import apply_look, list_packs
from plumb_api.seasonal.packs.raster import ImageArray
from plumb_api.seasonal.packs.synthetic import PortraitSpec, scene
from plumb_api.seasonal.packs.target import FaceTarget

BUDGET_MS = 100.0
ALL_LOOKS = [(pack.occasion, look.id) for pack in list_packs() for look in pack.looks]
_CACHE: dict[str, tuple[ImageArray, FaceTarget]] = {}


def big_scene() -> tuple[ImageArray, FaceTarget]:
    if "big" not in _CACHE:
        spec = PortraitSpec(512.0, 560.0, 360.0, 450.0)
        image, (target,) = scene(1024, 1024, [spec], seed=1)
        _CACHE["big"] = (image, target)
    return _CACHE["big"]


def budget() -> float:
    try:
        factor = float(os.environ.get("SEASONAL_SPEED_FACTOR", "1"))
    except ValueError:
        factor = 1.0
    return BUDGET_MS * max(1.0, factor)


@pytest.mark.parametrize(("occasion", "look_id"), ALL_LOOKS)
def test_look_runs_within_budget_on_1024(occasion: str, look_id: str) -> None:
    image, target = big_scene()
    apply_look(image, occasion, look_id, target, strength=5.0)
    timings = []
    for _ in range(3):
        start = time.perf_counter()
        apply_look(image, occasion, look_id, target, strength=5.0)
        timings.append((time.perf_counter() - start) * 1000.0)
    assert statistics.median(timings) < budget(), f"{occasion}/{look_id}: {timings}"
