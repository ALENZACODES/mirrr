"""Interruption sequences on the product's preview tokens, and parallel render mixing.

Author: John Khan.
"""
from __future__ import annotations

import numpy as np
import pytest

from lab.bqa_render import interrupt
from lab.bqa_render.adapters import Product
from lab.bqa_render.bench import Bench
from lab.bqa_render.rows import parse_context
from plumb_api.pro import PreviewJob, ProgressivePreview


@pytest.fixture()
def bench() -> Bench:
    return Bench(parse_context({"run_id": "int", "seed": 1}), limit=2, variants=1)


class LeakyPreview:
    """A broken token store that treats every job as current (a synthetic defect)."""

    def __init__(self) -> None:
        self.inner = ProgressivePreview()

    def request(self, photo_hash: str, width: int, height: int, level: float,
                stage: interrupt.Stage) -> PreviewJob:
        job: PreviewJob = self.inner.request(photo_hash, width, height, level, stage)
        return job

    def is_current(self, job: PreviewJob) -> bool:
        return True

    def cancel(self) -> None:
        self.inner.cancel()


@pytest.mark.parametrize("kind", interrupt.KINDS)
def test_every_kind_passes_on_the_product_tokens(bench: Bench, kind: str) -> None:
    scenes = interrupt.sequence_scenes(bench, 0)
    result = interrupt.run_sequence("synthetic", kind, scenes, Product.of("blush"),
                                    np.random.default_rng(0))
    assert result.violations == []


def test_a_leaky_token_store_is_caught(bench: Bench) -> None:
    scenes = interrupt.sequence_scenes(bench, 1)
    rng = np.random.default_rng(0)
    switch = interrupt.run_sequence("synthetic", "switch_photo", scenes, Product.of("blush"),
                                    rng, LeakyPreview)
    assert "wrong_face" in switch.violations
    cancel = interrupt.run_sequence("synthetic", "cancel", scenes, Product.of("blush"), rng,
                                    LeakyPreview)
    assert "shown_after_cancel" in cancel.violations


def test_rows_and_parallel_renders(bench: Bench) -> None:
    jrn = interrupt.check_jrn02(bench)
    assert jrn["n"] == 12 and jrn["measured"] == {"wrong_face_sequences": 0}
    mixed, total = interrupt.parallel_mixing(bench, workers=2)
    assert mixed == 0 and total == 16
    rb = interrupt.check_rb203(bench)
    assert rb["status"] in ("PASS", "UNPROVEN")
