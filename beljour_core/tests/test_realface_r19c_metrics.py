"""Synthetic-only tests of metric primitives; no real images or demographic inference."""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from typing import Any

import numpy as np
import pytest

from plumb_api.commerce.catalogue import products, source
from plumb_api.commerce.shortlist import ShortlistOptions, shortlist

HERE = Path(__file__).resolve().parents[2] / "tests" / "realface" / "pass_definitions_r19c"
SPEC = importlib.util.spec_from_file_location("lane_c_r19c_metrics", HERE / "metrics.py")
assert SPEC is not None and SPEC.loader is not None
module = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = module
SPEC.loader.exec_module(module)


def grid(rgba: bool = True, *, width: int = 37, height: int = 41) -> tuple[np.ndarray, np.ndarray]:
    yy, xx = np.mgrid[:height, :width]
    channels = 4 if rgba else 3
    a = np.empty((height, width, channels), dtype=np.uint8)
    a[..., 0] = (2 * xx + 3 * yy + 31) % 256
    a[..., 1] = (5 * xx + 7 * yy + 17) % 256
    a[..., 2] = (11 * xx + yy + 13) % 256
    if rgba:
        a[..., 3] = (xx + yy) % 200 + 50
    support = ((xx-17)**2 + (yy-16)**2) <= 100
    return a, support


@pytest.mark.parametrize("rgba", [True, False])
def test_masked_metrics_detect_outside_and_inside_differences(rgba: bool) -> None:
    original, support = grid(rgba)
    source_image = original.copy()
    mask = support.copy()
    edited = original.copy()
    edited[..., 0][support] = 255 - edited[..., 0][support]
    outcome = module.masked_difference(original, edited, mask, region="detail")
    assert outcome.invariant_pass()
    assert outcome.outside_max_delta == 0 and outcome.outside_changed_pixels == 0
    assert outcome.support_pixels == int(support.sum())
    assert outcome.edited_support_pixels > 0 and outcome.inside_max_delta > 0
    assert outcome.alpha_channel_max_delta == 0
    assert np.array_equal(original, source_image) and np.array_equal(support, mask)
    edited[0, 0, 1] ^= 42
    violation = module.masked_difference(original, edited, support)
    assert violation.outside_max_delta > 0
    assert violation.outside_changed_pixels == 1
    assert not violation.invariant_pass()
    if rgba:
        edited[3, 3, 3] = 0
        assert module.masked_difference(original, edited, support).alpha_channel_max_delta > 0


@pytest.mark.parametrize("mask_dtype", [np.bool_, np.uint8, np.float32, np.float64])
def test_explicit_mask_types_have_equivalent_support(mask_dtype: Any) -> None:
    image, support = grid()
    converted = support.astype(mask_dtype)
    a = module.masked_difference(image, image, converted)
    assert a.support_pixels == int(support.sum())
    assert a.edited_support_pixels == 0 and a.invariant_pass()


@pytest.mark.parametrize("invalid", [
    lambda im,m: (im.astype(np.float64),m),
    lambda im,m: (im[:, :-1],m),
    lambda im,m: (im.reshape((-1,4)),m),
    lambda im,m: (im,np.ones_like(m,dtype=np.int32)),
    lambda im,m: (im,np.full_like(m,np.nan,dtype=np.float64)),
    lambda im,m: (im,np.full_like(m,1.1,dtype=np.float64)),
])
def test_rejects_unsupported_quality_inputs(invalid: Any) -> None:
    img, mask = grid()
    x, y = invalid(img,mask)
    with pytest.raises(ValueError):
        module.masked_difference(x,img,y)


def test_zero_mask_is_not_a_successful_visual_edit() -> None:
    image,_ = grid()
    empty=np.zeros(image.shape[:2],dtype=np.uint8)
    outcome=module.masked_difference(image,image,empty)
    assert outcome.support_pixels == 0
    assert not outcome.invariant_pass()


@pytest.mark.parametrize("gain", [0.1,0.5,0.90,0.95,1.0])
def test_synthetic_scalp_ratio_matches_true_visibility_gain(gain: float) -> None:
    _, support=grid()
    before=np.full(support.shape,.4,dtype=np.float64)
    after=np.full(support.shape,.4 * gain,dtype=np.float64)
    outcome=module.scalp_visibility_evidence(before,after,support)
    assert outcome.eligible
    assert outcome.eligible_pixels == int(support.sum())
    assert outcome.before_mean == pytest.approx(.4)
    assert outcome.after_mean == pytest.approx(.4*gain)
    assert outcome.after_to_before_ratio == pytest.approx(gain)


def test_zero_baseline_is_explicitly_ineligible_not_fake_zero_success() -> None:
    _,support=grid()
    empty=np.zeros(support.shape,dtype=np.float64)
    result=module.scalp_visibility_evidence(empty,empty,support)
    assert not result.eligible
    assert result.eligible_pixels == 0
    assert np.isinf(result.after_to_before_ratio)
    for bad in (-1,0,1,float("nan"),float("inf")):
        with pytest.raises(ValueError):
            module.scalp_visibility_evidence(empty,empty,support,minimum_visible=bad)


def test_scape_ratio_rejects_nonfinite_or_negative_unauthorized_data() -> None:
    _,mask=grid()
    visibility=np.full(mask.shape,.2)
    for bad in (np.full(mask.shape,np.nan),np.full(mask.shape,np.inf),
                np.full(mask.shape,-1.0),np.full(mask.shape,2.0),
                np.zeros((4,6),dtype=float)):
        with pytest.raises(ValueError):
            module.scalp_visibility_evidence(visibility,bad,mask)


def sample_shortlist() -> dict[str, Any]:
    selected=[p for p in products() if p.depth is None or p.depth==5 and p.undertone=="warm"]
    ranked=[{"product":row.to_json(),"score":200} for row in selected]
    return shortlist(ranked,ShortlistOptions(budget_cents=9000)).public()


def test_sample_receipt_is_owned_stable_does_not_enable_checkout() -> None:
    owned=[p.to_json() for p in products()]
    receipt=sample_shortlist()
    audit=module.shortlist_audit(receipt,owned)
    assert audit.provider_calls==0
    assert not audit.checkout_enabled
    assert audit.untrusted_products_displayed==0
    assert audit.exceeded_budget==0
    assert audit.sku_count > 0
    assert audit.three_piece_correct_roles
    assert len(audit.stable_digest or "") == 64
    assert module.shortlist_audit(sample_shortlist(),owned)==audit


def test_receipt_audit_fails_bad_budget_forged_shade_checkout_or_provider_call() -> None:
    owned=[p.to_json() for p in products()]
    original=sample_shortlist()
    for key, value in (("provider_calls",2),("checkout_enabled",True)):
        bad={**original,key:value}
        report=module.shortlist_audit(bad,owned)
        assert (report.provider_calls>0 or report.checkout_enabled) and not report.three_piece_correct_roles
    bad={**original,"items":[dict(original["items"][0])],}
    bad["items"][0]["product"]={**bad["items"][0]["product"],"swatch":"#ffffff"}
    assert module.shortlist_audit(bad,owned).untrusted_products_displayed==1
    with pytest.raises(ValueError):module.shortlist_audit({**original,"budget_cents":-1},owned)
    with pytest.raises(ValueError):module.shortlist_audit({**original,"items":[1]*17},owned)
    assert all(isinstance(concern,str) for concern in source()["concerns"])
