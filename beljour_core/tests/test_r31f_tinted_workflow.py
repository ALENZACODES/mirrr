"""R31F corrected readings to a guarded tinted fibre preview, on a drawn hair block.

Pass definition: the readings must agree before any pigment is chosen; five strength
changes reuse one prepared zone and spend no provider calls; moving frames are
preview-only; released frames carry final-pixel evidence; receipts never contain
photos, masks, landmarks or hashes. Literal values are shared with
web/test/r31f-colour-workflow.test.mjs. Author: John Khan.
"""
from __future__ import annotations

import pytest

from plumb_api.engines.concealer.colour_workflow import TintedFibreWorkflow, plan_tint
from tests.r31f_fibre_scene import HEAD, SWATCH, readings, scene


def test_agreeing_readings_choose_the_swatch() -> None:
    plan = plan_tint(readings())
    assert (plan.refused, plan.swatch_id, plan.rgb) == (False, SWATCH, (63, 44, 38))


@pytest.mark.parametrize("rows,code", [
    (readings(mode="none"), "uncorrected_lighting"),
    (readings(offsets=(0.0, 12.0)), "unstable_swatch"),
    (readings(offsets=(0.0, 30.0)), "mixed_lighting"),
])
def test_disagreeing_or_uncorrected_readings_refuse(rows: list, code: str) -> None:  # type: ignore[type-arg]
    plan = plan_tint(rows)
    assert (plan.refused, plan.code, plan.swatch_id) == (True, code, None)
    image, region, scalp = scene()
    receipt = TintedFibreWorkflow().render(plan, image, region, scalp, landmarks=HEAD)
    assert (receipt.status, receipt.code, receipt.changed_pixels) == ("refused", code, 0)


def test_five_levels_share_one_prepared_zone_and_spend_nothing() -> None:
    image, region, scalp = scene()
    workflow = TintedFibreWorkflow()
    receipts = workflow.render_levels(plan_tint(readings()), image, region, scalp, landmarks=HEAD)
    assert workflow.session.zone_grid_calls == workflow.session.split_calls == 1
    assert [r.status for r in receipts] == ["unchanged"] + ["rendered_closer"] * 4
    assert [r.changed_pixels for r in receipts] == [0, 820, 820, 820, 820]
    after = [None if r.evidence is None or r.evidence.after_delta_e is None else round(r.evidence.after_delta_e, 4)
             for r in receipts]
    assert after == [None, 34.6777, 26.0886, 25.0257, 25.0391]
    assert all(r.public()["provider_calls"] == 0 for r in receipts)


def test_moving_frames_are_preview_only() -> None:
    image, region, scalp = scene()
    receipt = TintedFibreWorkflow().render(plan_tint(readings()), image, region, scalp, landmarks=HEAD,
                                           level=4.2, phase="moving")
    assert (receipt.status, receipt.evidence) == ("preview_only", None)
    assert receipt.changed_pixels == 820


def test_missing_landmarks_and_bad_levels_are_refused() -> None:
    image, region, scalp = scene()
    workflow = TintedFibreWorkflow()
    assert workflow.render(plan_tint(readings()), image, region, scalp, landmarks=None).code == "no_mesh"
    with pytest.raises(ValueError):
        workflow.render(plan_tint(readings()), image, region, scalp, landmarks=HEAD, level=5.5)
    with pytest.raises(ValueError):
        workflow.render(plan_tint(readings()), image, region, scalp, landmarks=HEAD, phase="later")  # type: ignore[arg-type]


def test_primary_box_limits_the_audited_region() -> None:
    image, region, scalp = scene()
    receipt = TintedFibreWorkflow().render(plan_tint(readings()), image, region, scalp, landmarks=HEAD,
                                           level=3.0, primary_box=(22, 12, 48, 62))
    assert receipt.status == "rendered_closer"
    assert receipt.evidence is not None and receipt.evidence.region_pixels == 400
    assert receipt.changed_pixels == 400


def test_receipts_carry_no_photo_mask_landmark_or_hash() -> None:
    image, region, scalp = scene()
    public = TintedFibreWorkflow().render(plan_tint(readings()), image, region, scalp, landmarks=HEAD).public()
    text = repr(public)
    for word in ("hash", "mask", "landmark", "image", "points", "temple"):
        assert word not in text
    assert len(text) < 1200
