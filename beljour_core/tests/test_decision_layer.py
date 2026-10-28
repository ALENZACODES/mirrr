"""Decision layer: shade target, placement, cost and longevity on drawn data with known answers.

Hair photos here are drawn: a striped backdrop with a rectangle of hair painted in one
in-house catalogue colour, so the measured level and the nearest swatch are known in
advance. Masks and paint strokes are drawn rectangles with known shares. Checks: the
nearest swatch of a catalogue colour is itself, sessions follow the W28 lift limits, the
placement shares are exact, the cost ranges follow the W94 visit rule and her own figures
replace the ASSUMED ones, every printed line is labelled, and refusals are coded.
Author: John Khan.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest

from plumb_api.engines.hair_palette.catalogue import catalogue, require_shade
from plumb_api.engines.haircolour.balayage import level_of_lightness, measure_base_level, session_plan
from plumb_api.engines.shade.finder import reference_table, thresholds
from plumb_api.engines.workflow_w import decision
from plumb_api.engines.workflow_w.pricing import estimate

ROOT = Path(__file__).resolve().parents[2]


def drawn_hair(shade_id: str, size: tuple[int, int] = (48, 40)) -> tuple[np.ndarray, np.ndarray]:
    """A drawn photo whose hair rectangle is painted in one catalogue swatch colour."""
    height, width = size
    yy, xx = np.mgrid[:height, :width]
    image = np.zeros((height, width, 3), dtype=np.uint8)
    image[..., 0] = 200 - (xx % 5) * 9
    image[..., 1] = 180
    image[..., 2] = 150 + (yy % 3) * 20
    mask = np.zeros((height, width))
    mask[6:42, 8:32] = 1.0
    image[mask > 0] = require_shade(shade_id).rgb
    return image, mask


def test_vectors_and_the_typescript_table_match_python() -> None:
    run = subprocess.run([sys.executable, str(ROOT / "api/scripts/make_decision_vectors.py"), "--check"],
                         capture_output=True, text=True, check=False)
    assert run.returncode == 0, run.stdout + run.stderr


def test_the_table_is_canadian_dollars_assumed_and_says_it_is_not_a_quote() -> None:
    data = decision.table()
    assert data["currency"] == "CAD" and data["status"].startswith("ASSUMED")
    assert "not a quote" in data["label"]
    ids = {row["id"] for row in data["services"]}
    assert {"all_over_colour", "balayage", "root_touch_up", "toner_gloss", "foundation_bottle"} <= ids
    for row in data["services"]:
        assert 0 <= row["price"][0] <= row["price"][1] and 1 <= row["lasts"][0] <= row["lasts"][1]
        assert row["upkeep"] is None or row["upkeep"] in ids
    data["services"].clear()  # a caller's copy; the table itself is unchanged
    assert decision.table()["services"]


@pytest.mark.parametrize("shade_id", ["natural-04-n", "natural-07-n", "copper-04-w", "natural-09-n"])
def test_a_drawn_catalogue_colour_resolves_to_itself_with_its_level(shade_id: str) -> None:
    shade = require_shade(shade_id)
    image, mask = drawn_hair(shade_id)
    base = measure_base_level(image, mask)
    spec = decision.hair_spec(list(shade.lab), base_level=base)
    assert spec["nearest"][0]["id"] == shade_id and spec["nearest"][0]["delta_e00"] < 1e-9
    # Base and target share the lift scale, so a colour painted on her hair is its own target level.
    assert spec["target_level"] == base and spec["sessions"] == 1 and spec["undertone"] == shade.undertone
    assert (decision.SCALE_NOTE in decision.spec_lines(spec)) == (shade.level != base)
    assert [s["delta_e00"] for s in spec["nearest"]] == sorted(s["delta_e00"] for s in spec["nearest"])
    assert spec["service"] == "all_over_colour" and spec["note"] == decision.SPEC_NOTE
    assert "mixing recipe" in decision.spec_lines(spec)[-1]


def test_lightening_needs_the_sessions_the_lift_limits_allow() -> None:
    image, mask = drawn_hair("natural-05-n")
    base = measure_base_level(image, mask)
    assert base == level_of_lightness(require_shade("natural-05-n").lab[0]) == 3
    target = next(s for s in catalogue() if s.family == "natural" and s.undertone == "neutral" and s.level == 9)
    assert level_of_lightness(target.lab[0]) == 9
    for history in ("virgin", "colour_treated", "box_dye"):
        spec = decision.hair_spec(list(target.lab), base_level=base, history=history)
        plan = session_plan(base, 9, history)
        assert spec["sessions"] == plan["sessions"] and spec["levels_by_session"] == plan["levels_by_session"]
        assert spec["levels_by_session"][-1] == 9
    darker = decision.hair_spec(list(require_shade("natural-02-n").lab), base_level=base)
    assert darker["sessions"] == 1 and "ASSUMED" in darker["plan_note"]
    unknown = decision.hair_spec(list(target.lab))
    assert unknown["base_level"] is None and "Starting level unknown" in unknown["plan_note"]


def test_balayage_targets_come_from_the_level_and_toner() -> None:
    spec = decision.hair_spec(mode="balayage", base_level=4, target_level=8, toner="ash")
    assert spec["service"] == "balayage" and spec["toner"] == "ash" and spec["target_level"] == 8
    assert spec["sessions"] == session_plan(4, 8, "colour_treated")["sessions"]
    assert "ash toner" in decision.spec_lines(spec)[0]
    with pytest.raises(ValueError):
        decision.hair_spec(mode="balayage", base_level=4)
    with pytest.raises(ValueError):
        decision.hair_spec(None)


def test_foundation_targets_are_reference_shades_never_lighter_than_measured() -> None:
    allowance = float(thresholds()["never_lighter_allowance"])
    for row in reference_table()[::7]:
        spec = decision.makeup_spec(row["lab"])
        assert spec["nearest"][0]["id"] == row["id"] and spec["nearest"][0]["delta_e00"] < 1e-9
        by_id = {r["id"]: r for r in reference_table()}
        assert all(by_id[s["id"]]["lab"][0] - row["lab"][0] <= allowance for s in spec["nearest"])
        assert spec["service"] == "foundation_bottle" and "never lighter" in spec["note"]
    with pytest.raises(decision.DecisionError) as caught:
        decision.makeup_spec([3.0, 0.0, 0.0])
    assert caught.value.code == "no_shade"


def test_placement_shares_on_drawn_masks_are_exact() -> None:
    mask = np.zeros((30, 20))
    mask[3:27, 2:18] = 1.0            # 24 rows of hair: thirds of 8 rows each
    paint = np.zeros_like(mask)
    paint[19:27, 2:18] = 0.8          # exactly the lowest third
    place = decision.placement(mask, paint)
    assert place["kind"] == "painted" and place["coverage"] == pytest.approx(1 / 3)
    assert place["zones"] == {"roots": 0.0, "mid_lengths": 0.0, "ends": 1.0}
    paint[3:11, 2:10] = 0.16          # half the roots, just above the printed hatch cut
    paint[11:19, 2:18] = 0.15         # at the cut: not placed
    place = decision.placement(mask, paint)
    assert place["zones"] == {"roots": 0.5, "mid_lengths": 0.0, "ends": 1.0}
    assert decision.placement_lines(place)[1] == "By height: roots 50%, mid-lengths 0%, ends 100%."
    whole = decision.placement(mask)
    assert whole["coverage"] == 1.0 and decision.placement_lines(whole) == ["Placement: all of your marked hair, roots to ends."]
    paint_outside = np.zeros_like(mask)
    paint_outside[:3, :] = 1.0        # strokes off the hair never count
    assert decision.placement(mask, paint_outside)["coverage"] == 0.0
    with pytest.raises(decision.DecisionError) as caught:
        decision.placement(np.zeros((30, 20)), paint)
    assert caught.value.code == "no_hair_mask"
    with pytest.raises(ValueError):
        decision.placement(mask, np.zeros((5, 5)))


def test_cost_follows_the_table_and_the_w94_visit_rule() -> None:
    cost = decision.cost_and_longevity("all_over_colour")
    row, upkeep = decision.service("all_over_colour"), decision.service("root_touch_up")
    assert cost["currency"] == "CAD" and cost["source"] == "ASSUMED estimate table" and cost["edited"] == []
    assert cost["per_session"] == row["price"] and cost["lasts"] == row["lasts"]
    low, high = upkeep["price"]
    fewest = estimate(low, high, 1, row["lasts"][1])["maintenance_visits_estimate"]
    most = estimate(low, high, 1, row["lasts"][0])["maintenance_visits_estimate"]
    assert cost["upkeep"]["visits_per_year"] == [fewest, most]
    assert cost["year_one"] == [row["price"][0] + upkeep["price"][0] * fewest, row["price"][1] + upkeep["price"][1] * most]
    assert cost["first_visit"][0] <= cost["first_visit"][1] <= cost["year_one"][1]
    two = decision.cost_and_longevity("balayage", sessions=2)
    assert two["first_visit"] == [2 * v for v in decision.service("balayage")["price"]]
    day = decision.cost_and_longevity("makeup_application")
    assert day["unit"] == "hours" and day["upkeep"] is None and day["year_one"] is None


def test_her_own_figures_replace_the_assumed_ones_and_are_named() -> None:
    cost = decision.cost_and_longevity("balayage", price=[250, 380], lasts=[10, 16], upkeep_price=[60, 95])
    assert cost["edited"] == ["price", "lasts", "upkeep_price"] and cost["source"] == "your figures"
    assert cost["per_session"] == [250.0, 380.0] and cost["upkeep"]["per_visit"] == [60.0, 95.0]
    assert "(your figures)" in decision.cost_lines(cost)[0]
    same = decision.cost_and_longevity("balayage", price=list(decision.service("balayage")["price"]))
    assert same["edited"] == [] and "(ASSUMED estimate)" in decision.cost_lines(same)[0]


def test_printed_lines_are_labelled_estimates_in_whole_dollars() -> None:
    lines = decision.cost_lines(decision.cost_and_longevity("all_over_colour", price=[99.5, 1234.4]))
    assert lines[0] == "All-over permanent colour: $100 to $1,234 CAD per session (your figures)."
    assert all("CAD" in line or "estimate" in line.lower() for line in lines)
    assert lines[-1] == decision.table()["label"]
    assert decision.money(0.5) == "$1" and decision.money(2.5) == "$3" and decision.percent(0.125) == 13
    assert decision.one_decimal(2.25) == "2.3"


@pytest.mark.parametrize(("call", "code"), [
    (lambda: decision.cost_and_longevity("made_up"), "unknown_service"),
    (lambda: decision.cost_and_longevity("balayage", price=[300, 200]), "invalid_figures"),
    (lambda: decision.cost_and_longevity("balayage", price=[float("nan"), 2]), "invalid_figures"),
    (lambda: decision.cost_and_longevity("balayage", price=[True, 2]), "invalid_figures"),
    (lambda: decision.cost_and_longevity("balayage", lasts=[6.5, 8]), "invalid_figures"),
    (lambda: decision.cost_and_longevity("balayage", lasts=[6, 200]), "invalid_figures"),
    (lambda: decision.cost_and_longevity("balayage", sessions=0), "invalid_figures"),
    (lambda: decision.cost_and_longevity("balayage", upkeep_price=[5]), "invalid_figures"),
])
def test_refusals_are_coded(call, code: str) -> None:
    with pytest.raises(decision.DecisionError) as caught:
        call()
    assert caught.value.code == code and str(caught.value).startswith(decision.REFUSALS[code])
    with pytest.raises(ValueError, match="unknown decision refusal"):
        decision.DecisionError("made_up")


def test_decisions_hold_no_photo_mask_or_landmark() -> None:
    image, mask = drawn_hair("natural-05-n")
    paint = np.zeros_like(mask)
    paint[30:42, 8:32] = 1.0
    out = {"spec": decision.hair_spec(list(require_shade("natural-07-n").lab), base_level=measure_base_level(image, mask)),
           "placement": decision.placement(mask, paint), "cost": decision.cost_and_longevity("all_over_colour")}
    text = json.dumps(out)
    assert len(text) < 4000
    for key in ("image", "mask", "sha", "landmark", "photo", "pixels"):
        assert f'"{key}' not in text


def _pack(**overrides: object) -> dict[str, object]:
    from datetime import date

    from plumb_api.services import salon_pack
    kwargs: dict[str, object] = {"created": date(2026, 10, 28), "measured": {"hair_level": 4, "undertone": "warm"},
                                 "target": {"kind": "hair", "description": "Copper all over", "lab": [38.0, 30.0, 20.0]}}
    kwargs.update(overrides)
    return salon_pack.build_pack(**kwargs)  # type: ignore[arg-type]


def test_a_settings_only_pack_holds_no_photo_or_photo_reference() -> None:
    from plumb_api.services import salon_pack
    pack = _pack()
    assert pack["photo_set"] == [] and pack["photos_included"] is False
    pages = pack["pages"]
    assert isinstance(pages, list) and pages[0]["sections"][0]["kind"] == "measured"
    assert salon_pack.check_pack(pack) == []
    text = salon_pack.render_text(pack)
    assert "Photo set: none (settings only)" in text and "unedited photo:" not in text
    with pytest.raises(salon_pack.PackError, match="settings-only"):
        _pack(previews=[{"sha256": "a" * 64, "view": "front", "light": "daylight"}])
    broken = json.loads(json.dumps(pack))
    broken["photo_set"] = [{"role": "preview"}]
    assert "a settings-only pack holds no photo or photo reference" in salon_pack.check_pack(broken)


def test_a_named_service_prices_the_pack_from_the_decision_estimates() -> None:
    from plumb_api.services import salon_pack
    plan = _pack(plan={"sessions": 2, "service": "balayage"})["pages"][1]["sections"][2]  # type: ignore[index]
    lines = decision.cost_lines(decision.cost_and_longevity("balayage", sessions=2))
    assert plan["price_range"] == " ".join([lines[0], lines[1], lines[4]])
    assert plan["maintenance"] == " ".join([lines[2], lines[3]])
    assert plan["estimate_source"] == "ASSUMED estimate table" and "not a quote" in plan["estimate_label"]
    mine = _pack(plan={"service": "all_over_colour", "price": [100, 120]})["pages"][1]["sections"][2]  # type: ignore[index]
    assert mine["estimate_source"] == "your figures" and "$100 to $120 CAD" in mine["price_range"]
    day = _pack(plan={"service": "makeup_application"})["pages"][1]["sections"][2]  # type: ignore[index]
    assert "Year one" not in day["price_range"] and "hours" in day["maintenance"]
    with pytest.raises(salon_pack.PackError, match="plan estimate"):
        _pack(plan={"service": "made_up"})
