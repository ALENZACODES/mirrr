"""W93 Salon Decision Pack: the rules from round 2 plan section 7, checked on built packs.

Pass definition (written before the run): page 1 starts with her unedited photo and the
photo set lists it first; at most two pages; the consent footer is word for word; allergies
appear only when turned on; scores, ranks and affiliate data are refused; price and
maintenance never invent numbers; renders escape every value; the share token expires and
cannot be forged. Author: John Khan.
"""
from __future__ import annotations

import hashlib
from datetime import date

import pytest

from plumb_api.engines.haircolour import balayage
from plumb_api.services import salon_pack as sp

DAY = date(2026, 10, 23)


def sha(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def pack(**overrides):
    plan = balayage.session_plan(3, 9, "virgin")
    kwargs = dict(
        created=DAY,
        original_photo={"sha256": sha("original"), "width": 1200, "height": 1600},
        previews=[{"sha256": sha("front-day"), "view": "front", "light": "daylight"},
                  {"sha256": sha("side-office"), "view": "side", "light": "office"}],
        measured={"skin_lab": [58.2, 13.1, 19.4], "undertone": "warm", "depth_band": 5, "hair_level": 3,
                  "hair_history": "virgin", "allergies": ["fragrance", "PPD"]},
        target={"kind": "hair", "description": "Soft face-framing balayage, session 1",
                "lab": [46.0, 12.9, 24.9],
                "nearest_shades": [{"name": "Reference 12W", "lab": [48.0, 9.9, 21.3], "delta_e": 3.21}]},
        maps=[{"kind": "balayage", "coverage": 0.31, "zones": ["face frame left", "face frame right", "crown ribbons"]}],
        plan={"sessions": plan["sessions"], "levels_by_session": plan["levels_by_session"], "note": plan["note"]},
    )
    kwargs.update(overrides)
    return sp.build_pack(**kwargs)


def test_page_one_starts_with_the_unedited_photo() -> None:
    p = pack()
    assert sp.check_pack(p) == []
    assert p["photo_set"][0] == {"role": "original", "sha256": sha("original"), "width": 1200, "height": 1600,
                                 "caption": "Your unedited photo"}
    assert p["pages"][0]["sections"][0]["kind"] == "original_photo"
    assert p["pages"][0]["sections"][0]["sha256"] == sha("original")
    assert len(p["pages"]) == 2
    assert all(ph["caption"].startswith("Simulation") for ph in p["photo_set"][1:])


def test_consent_footer_is_word_for_word() -> None:
    p = pack()
    assert p["footer"] == ("Visual aid generated 2026-10-23. Professional assessment in person governs "
                           "suitability, formula and price.")
    broken = dict(p, footer="Visual aid.")
    assert "the consent footer is missing or changed" in sp.check_pack(broken)


def test_allergies_only_when_she_turns_them_on() -> None:
    hidden = pack()["pages"][0]["sections"][1]["facts"]
    assert "allergies" not in hidden
    shown = pack(include_allergies=True)["pages"][0]["sections"][1]["facts"]
    assert shown["allergies"] == ["fragrance", "PPD"]
    assert "No flag does not mean safe" in shown["allergy_note"]


@pytest.mark.parametrize("where,value", [
    ("measured", {"skin_lab": [58, 13, 19], "beauty_score": 8}),
    ("target", {"kind": "hair", "description": "x", "lab": [46, 13, 25], "rank": 1}),
    ("plan", {"sessions": 1, "affiliate": "https://example.invalid"}),
])
def test_scores_ranks_and_affiliate_data_are_refused(where: str, value: dict) -> None:
    with pytest.raises(sp.PackError, match="not allowed"):
        pack(**{where: value})


def test_no_invented_prices_or_calendar() -> None:
    plan = pack()["pages"][1]["sections"][2]
    assert plan["price_range"].startswith("Not estimated")
    assert plan["maintenance"].startswith("Not planned")
    assert plan["levels_by_session"] == [7, 9]
    assert plan["patch_test"] and "48 hours" in plan["patch_test_note"]


def test_target_lists_lab_and_delta_e_and_source_note() -> None:
    target = pack()["pages"][1]["sections"][0]
    assert target["kind"] == "target" and target["subject"] == "hair"
    assert target["lab"] == [46.0, 12.9, 24.9]
    assert target["nearest_shades"][0]["delta_e"] == 3.21
    assert "Not tested against real products" in target["shade_source"]


@pytest.mark.parametrize("bad", [
    dict(original_photo={"sha256": "nope", "width": 10, "height": 10}),
    dict(previews=[{"sha256": sha("original"), "view": "front", "light": "daylight"}]),
    dict(previews=[{"sha256": sha("p"), "view": "top", "light": "daylight"}]),
    dict(measured={}),
    dict(target={"kind": "tattoo", "description": "x", "lab": [50, 0, 0]}),
    dict(target={"kind": "hair", "description": "x", "lab": [150, 0, 0]}),
    dict(maps=[{"kind": "foil", "coverage": 1.4}]),
    dict(plan={"sessions": 2, "levels_by_session": [5]}),
])
def test_invalid_inputs_are_refused(bad: dict) -> None:
    with pytest.raises(sp.PackError):
        pack(**bad)


def test_the_original_can_never_be_passed_as_a_preview() -> None:
    with pytest.raises(sp.PackError, match="different image"):
        pack(previews=[{"sha256": sha("original"), "view": "front", "light": "office"}])


def test_pack_id_is_content_addressed_and_stable() -> None:
    a, b = pack(), pack()
    assert a["id"] == b["id"] and len(a["id"]) == 64
    assert pack(created=date(2026, 10, 24))["id"] != a["id"]


def test_text_and_html_renders_are_deterministic_and_escaped() -> None:
    p = pack(target={"kind": "makeup", "description": "<script>alert(1)</script> berry lip", "lab": [40, 40, 15]})
    text = sp.render_text(p)
    assert text == sp.render_text(p)
    assert text.splitlines()[-1] == p["footer"]
    assert "Your unedited photo" in text.splitlines()[4]
    page = sp.render_html(p)
    assert "<script>" not in page and "&lt;script&gt;" in page
    assert p["footer"] in page and "#E1000F" not in page
    assert page.count("<h2>") == 2


def test_share_token_expires_and_cannot_be_forged() -> None:
    secret = b"0123456789abcdef-local-only"
    pid = pack()["id"]
    token = sp.share_token(pid, issued_at=1_000_000, days=7, secret=secret)
    assert sp.verify_share_token(token, now=1_000_000 + 6 * 86400, secret=secret) == (True, "ok")
    assert sp.verify_share_token(token, now=1_000_000 + 7 * 86400, secret=secret) == (False, "expired")
    assert sp.verify_share_token(token, now=1_000_000, secret=b"another-secret-0123456") == (False, "bad signature")
    pid2, expires, sig = token.split(".")
    assert sp.verify_share_token(f"{pid2}.{int(expires) + 86400}.{sig}", now=0, secret=secret)[1] == "bad signature"
    assert sp.verify_share_token("garbage", now=0, secret=secret) == (False, "malformed")
    with pytest.raises(sp.PackError):
        sp.share_token(pid, issued_at=0, days=31, secret=secret)
    with pytest.raises(sp.PackError):
        sp.share_token(pid, issued_at=0, days=1, secret=b"short")
    assert pack()["hosted"] is False
