"""R7 LS6 enhance: estimators against drawn ground truth, denoisers, Q11 rows, modes.

Author: John Khan.
"""
from __future__ import annotations

import math

import numpy as np
import pytest

from plumb_api.engines.repair import analyse as an, denoise as dn, restore, synthetic as rs
from plumb_api.quality.metrics import digest

CLEAN = rs.scene()
LUMA = math.sqrt(0.299 ** 2 + 0.587 ** 2 + 0.114 ** 2)


@pytest.mark.parametrize("sigma", [5.0, 10.0, 15.0, 20.0])
def test_noise_estimate_within_15_percent(sigma):
    got = an.noise_sigma(an.luma255(rs.add_noise(CLEAN, sigma, 2)))
    assert abs(got - sigma * LUMA) / (sigma * LUMA) <= 0.15


@pytest.mark.parametrize("blur", [1.0, 1.5, 2.0, 3.0])
def test_blur_estimate_within_15_percent_of_total_blur(blur):
    base = an.blur_sigma(an.luma255(CLEAN))
    truth = math.hypot(blur, base)
    assert abs(an.blur_sigma(an.luma255(rs.blur(CLEAN, blur))) - truth) / truth <= 0.15


def test_blocking_cast_motion_and_exposure():
    for amp in (4.0, 8.0, 12.0):
        assert abs(an.blockiness(an.luma255(rs.blocking(CLEAN, amp))) - 2 * amp / 3) / (2 * amp / 3) <= 0.15
    assert an.blockiness(an.luma255(CLEAN)) < 0.5
    g0, g1 = an.analyse(CLEAN).grey_gains, an.analyse(rs.cast(CLEAN, (1.2, 1.0, 0.8))).grey_gains
    assert g1[0] / g0[0] == pytest.approx(1 / 1.2, rel=0.15) and g1[2] / g0[2] == pytest.approx(1 / 0.8, rel=0.15)
    m = an.analyse(rs.motion_blur(CLEAN, 9, 1))
    assert m.blur_type == "motion" and abs(m.motion_degrees) < 10
    v = an.analyse(rs.motion_blur(CLEAN, 9, 0))
    assert v.blur_type == "motion" and abs(abs(v.motion_degrees) - 90) < 10
    assert an.analyse(CLEAN).blur_type == "none"
    dark = an.analyse(rs.low_light(CLEAN, 0.25))
    assert dark.ev_offset > an.analyse(CLEAN).ev_offset + 1.5
    assert set(dark.to_json()) >= {"noise_sigma", "blur_type", "grey_gains"}
    with pytest.raises(ValueError, match="too small"):
        an.noise_sigma(np.zeros((3, 3)))
    with pytest.raises(ValueError):
        an.gaussian_kernel(0)


def test_auto_choice_and_methods():
    assert [dn.choose(s) for s in (1, 5, 10, 30)] == ["none", "guided", "bilateral", "nlm"]
    with pytest.raises(ValueError):
        dn.choose(-1)
    noisy = rs.add_noise(CLEAN, 15.0, 3)
    sigma = an.noise_sigma(an.luma255(noisy))
    for method in ("guided", "bilateral", "nlm"):
        out, used = dn.denoise(noisy, sigma, method=method)
        assert used == method and rs.psnr(CLEAN, out) > rs.psnr(CLEAN, noisy) + 3
    same, used = dn.denoise(noisy, sigma, strength=0)
    assert used == "none" and (same == noisy).all()
    with pytest.raises(ValueError):
        dn.denoise(noisy, sigma, method="median")
    with pytest.raises(ValueError):
        dn.denoise(noisy, sigma, strength=3)


@pytest.mark.parametrize("sigma,expected", [
    (0.0, "none"),
    (math.nextafter(3.0, 0.0), "none"),
    (3.0, "guided"),
    (math.nextafter(3.0, math.inf), "guided"),
    (math.nextafter(8.0, 0.0), "guided"),
    (8.0, "bilateral"),
    (math.nextafter(8.0, math.inf), "bilateral"),
    (math.nextafter(16.0, 0.0), "bilateral"),
    (16.0, "nlm"),
    (math.nextafter(16.0, math.inf), "nlm"),
    (30.0, "nlm"),
    (255.0, "nlm"),
    (math.nextafter(math.inf, 0.0), "nlm"),
])
def test_auto_choice_preserves_exact_half_open_noise_bands(sigma, expected):
    """R14: all three original thresholds and the final open interval stay intact."""
    assert dn.AUTO_LIMITS == (3.0, 8.0, 16.0)
    assert dn.choose(sigma) == expected


def test_ycc_round_trip_is_exact():
    y, cb, cr = dn.to_ycc(CLEAN)
    assert (dn.from_ycc(y, cb, cr) == CLEAN).all()


def test_q11_rows_m1_m4_pass_and_m2_fallback_is_reported():
    noisy = rs.add_noise(CLEAN, 15.0, 4)
    e = restore.enhance(noisy, steps={"white_balance": False, "exposure": False, "colour": False})
    m1 = rs.q11("M1", psnr_before=rs.psnr(CLEAN, noisy), psnr_after=rs.psnr(CLEAN, e.image),
                sigma_before=e.before.noise_sigma, sigma_after=e.after.noise_sigma)
    assert m1["passed"], m1
    noisy = rs.add_noise(CLEAN, 20.0, 6)
    sigma = an.noise_sigma(an.luma255(noisy))
    den, _ = dn.denoise(noisy, sigma)
    m4 = rs.q11("M4", psnr_before=rs.psnr(CLEAN, noisy), psnr_after=rs.psnr(CLEAN, den), sigma_before=sigma,
                sigma_after=an.noise_sigma(an.luma255(den)))
    assert m4["passed"], m4
    blurred = rs.motion_blur(CLEAN, 7, 1)
    d = restore.enhance(blurred, steps={"white_balance": False, "exposure": False, "colour": False, "denoise": False})
    m2 = rs.q11("M2", psnr_before=rs.psnr(CLEAN, blurred), psnr_after=rs.psnr(CLEAN, d.image),
                lap_before=d.before.laplacian_variance, lap_after=d.after.laplacian_variance)
    assert m2["parts"]["laplacian_up"] and "deblur" in d.steps
    assert m2["rule"].startswith("M2")


def test_modes_steps_and_unsharp():
    dark = rs.low_light(CLEAN, 0.4)
    for mode in restore.MODES:
        out = restore.enhance(dark, mode, strength=0.8)
        assert out.after.mean_luminance > out.before.mean_luminance, mode
        assert out.label == restore.LABEL
    off = restore.enhance(CLEAN, steps={s: False for s in restore.STEPS})
    assert digest(off.image) == digest(CLEAN)
    with pytest.raises(ValueError, match="mode"):
        restore.enhance(CLEAN, "magic")
    with pytest.raises(ValueError, match="unknown steps"):
        restore.enhance(CLEAN, steps={"glow": True})
    soft = rs.blur(CLEAN, 1.5)
    sharp = restore.unsharp(soft, 1.5, 2.0)
    assert an.laplacian_variance(an.luma255(sharp)) > an.laplacian_variance(an.luma255(soft))
    with pytest.raises(ValueError):
        restore.unsharp(soft, 1.0, 5.0)
    with pytest.raises(ValueError):
        rs.motion_blur(CLEAN, 4)
    assert rs.psnr(CLEAN, CLEAN) == math.inf
