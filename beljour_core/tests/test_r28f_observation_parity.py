"""R28F observation parity: the committed 18 invented RGB blocks stay in sync with Python.

web/test/r28f-observation-parity.test.mjs recomputes the same vectors in the browser.
Author: John Khan.
"""
from __future__ import annotations

import json

import numpy as np

from plumb_api.engines.concealer import observed


def test_parity_file_is_in_sync() -> None:
    assert observed.parity_in_sync()


def test_eighteen_vectors_cover_every_outcome() -> None:
    vectors = observed.parity_vectors()
    assert len(vectors) == 18 and len({v["id"] for v in vectors}) == 18
    codes = {v["expected"]["code"] for v in vectors}
    assert codes == {None, "leaked_pixels", "unrelated_colour_movement", "insufficient_contrast", "invalid_mask"}
    fractions = [v["expected"]["observed_effect_fraction"] for v in vectors if v["expected"]["code"] is None]
    assert min(fractions) == 0.0 and max(fractions) == 1.0


def test_vectors_recompute_from_their_own_pixels() -> None:
    payload = json.loads(observed.PARITY.read_text(encoding="utf-8"))
    for vector in payload["vectors"]:
        shape = (payload["height"], payload["width"])
        before = np.asarray(vector["before"], dtype=np.uint8).reshape(*shape, 3)
        after = np.asarray(vector["after"], dtype=np.uint8).reshape(*shape, 3)
        mask = np.asarray(vector["mask"], dtype=bool).reshape(shape)
        found = observed.observe_cover(before, after, mask, tuple(vector["pigment"]))
        assert found.public() == vector["expected"], vector["id"]
