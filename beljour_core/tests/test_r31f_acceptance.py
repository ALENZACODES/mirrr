"""R31F aggregate acceptance of local tinted previews: counts only, no photos.

Pass definition: every attempt stays in the denominator; preview-only frames are
never released results; release_pass is false without external evidence.
Author: John Khan.
"""
from __future__ import annotations

import pytest

from plumb_api.engines.concealer.colour_acceptance import summarize_colour_acceptance
from plumb_api.engines.concealer.colour_workflow import TintedFibreWorkflow, TintReceipt, plan_tint
from tests.r31f_fibre_scene import HEAD, readings, scene


def receipts() -> list[TintReceipt]:
    image, region, scalp = scene()
    workflow = TintedFibreWorkflow()
    plan = plan_tint(readings())
    rows = list(workflow.render_levels(plan, image, region, scalp, landmarks=HEAD))
    rows.append(workflow.render(plan, image, region, scalp, landmarks=HEAD, phase="moving", level=2.5))
    rows.append(workflow.render(plan_tint(readings(mode="none")), image, region, scalp, landmarks=HEAD))
    return rows


def test_every_attempt_stays_in_the_denominator() -> None:
    report = summarize_colour_acceptance(receipts())
    assert report.attempted == 7 and report.released == 6
    assert dict(report.counts) == {"rendered_closer": 4, "adverse_shift": 0, "unchanged": 1,
                                   "refused": 1, "preview_only": 1}
    assert report.closer_rate == pytest.approx(4 / 7)
    assert report.worst_after_delta_e == pytest.approx(34.6777, abs=1e-4)


def test_release_pass_needs_external_evidence_and_all_closer() -> None:
    rows = receipts()
    assert summarize_colour_acceptance(rows).release_pass is False
    assert summarize_colour_acceptance(rows, external_evidence=True).release_pass is False
    closer = [r for r in rows if r.status == "rendered_closer"]
    assert summarize_colour_acceptance(closer).release_pass is False
    assert summarize_colour_acceptance(closer, external_evidence=True).release_pass is True
    assert summarize_colour_acceptance([], external_evidence=True).release_pass is False


def test_public_receipts_are_accepted_and_bad_ones_refused() -> None:
    public = [r.public() for r in receipts()]
    assert summarize_colour_acceptance(public).attempted == 7
    with pytest.raises(ValueError):
        summarize_colour_acceptance([{"status": "approved"}])
    with pytest.raises(ValueError):
        summarize_colour_acceptance([{"status": "preview_only", "phase": "release"}])
    with pytest.raises(ValueError):
        summarize_colour_acceptance(public, external_evidence=1)  # type: ignore[arg-type]


def test_report_has_counts_only() -> None:
    out = summarize_colour_acceptance(receipts()).public()
    assert "natural" not in repr(out)
    assert out["evidence"] == "synthetic_local" and out["tested_against_real_products"] is False
