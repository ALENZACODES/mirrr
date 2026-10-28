"""C16 item (d), teeth: adaptive enamel finder, warmth floor and closed-mouth rule.

Pass definition: on drawn mouths with white, ivory, yellowish and greyish
teeth under neutral, dim, warm and cool light, on six skin and lip tones, the
adaptive finder whitens every case, every touched pixel keeps b* >= 3.75 after
8-bit rounding, only enamel pixels change, and the pass count is equal for
every skin tone (parity guard); a tongue-only or empty dark mouth reports "no
teeth visible"; a mesh-closed mouth is NOT APPLICABLE and an open one is
measured. The default fixed finder is unchanged (parity vectors). Drawn only.

Ported to main: Lane B's adaptive finder (engines/teeth/enamel.py) is now the
only finder and the default of whiten(), so the checks run on whiten() with
no finder argument; the closed mouth is measured by engines/teeth/mouth_state
(teeth.render). The fixed-finder checks are kept for retirement, and the gate
row declares a closed mouth NOT APPLICABLE (teeth v2, applicability.py). Author: John Khan.
"""
from __future__ import annotations

import sys

import numpy as np
import pytest
from gatefix_gates import REALFACE
from gatefix_meshes import drawn_photo, placed_face

from plumb_api.engines import teeth as teeth_engine
from plumb_api.engines.core import regions
from plumb_api.engines.shade.colourspace import srgb_to_lab
from plumb_api.engines.teeth.whiten import whiten

if str(REALFACE) not in sys.path:
    sys.path.insert(0, str(REALFACE))

import feature_checks as fc  # noqa: E402

SKINS = {"very_light": (244, 214, 196), "light": (226, 186, 160), "medium": (198, 150, 118),
         "tan": (160, 112, 80), "deep": (112, 74, 52), "very_deep": (70, 46, 34)}
TEETH = {"white": (236, 234, 228), "ivory": (228, 214, 184), "yellowish": (214, 194, 146),
         "greyish": (176, 174, 168)}
LIGHTS = {"neutral": (1.0, 1.0, 1.0), "dim": (0.45, 0.45, 0.45), "warm": (1.0, 0.86, 0.66),
          "cool": (0.82, 0.92, 1.0)}
# Main's whiten() keeps every touched pixel at b* >= 3.75 after rounding (literal in whiten.py).
WARMTH_FLOOR = 3.75
RETIRE_FIXED_FINDER = (
    "Retire: checks the C16 finder= / lips= options of whiten() and the old fixed cut-off "
    "finder. Main has neither: Lane B's adaptive finder (engines/teeth/enamel.py) is the only "
    "finder, so there is no fixed default left to pin or to compare against.")


def drawn_mouth(skin: tuple[int, int, int], teeth: tuple[int, int, int] | None,
                light: tuple[float, float, float], *, tongue: bool = True,
                band: tuple[int, int] = (29, 41)) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Photo, mouth-opening mask and lip mask of one drawn open mouth."""
    height, width = 80, 120
    yy, xx = np.mgrid[:height, :width]
    outer = ((xx - 60) / 40.0) ** 2 + ((yy - 40) / 20.0) ** 2 <= 1
    inner = ((xx - 60) / 32.0) ** 2 + ((yy - 40) / 12.0) ** 2 <= 1
    image = np.zeros((height, width, 3))
    image[:] = skin
    image[outer] = np.array(skin) * np.array([0.85, 0.62, 0.66])
    image[inner] = (40, 22, 24)
    if tongue:
        image[inner & (yy > 44)] = (150, 70, 72)
    if teeth is not None:
        rows = inner & (yy >= band[0]) & (yy <= band[1])
        image[rows] = teeth
        image[rows & ((xx - 28) % 9 == 0)] = np.array(teeth) * 0.7
    photo = np.clip(np.rint(image * np.array(light)), 0, 255).astype(np.uint8)
    return photo, inner.astype(np.float64), (outer & ~inner).astype(np.float64)


def whitened_ok(photo: np.ndarray, opening: np.ndarray, lips: np.ndarray) -> bool:
    result = whiten(photo, opening, strength=100)
    touched = result.alpha > 0
    warm = srgb_to_lab(result.image)[..., 2]
    only_enamel = np.array_equal(result.image[~touched], photo[~touched])
    return bool(result.changed > 0 and touched.any() and np.all(warm[touched] >= 3.75)
                and only_enamel)


def pass_counts(band: tuple[int, int]) -> dict[str, int]:
    counts = {}
    for tone, skin in SKINS.items():
        counts[tone] = sum(whitened_ok(*drawn_mouth(skin, teeth, light, band=band))
                           for teeth in TEETH.values() for light in LIGHTS.values())
    return counts


@pytest.mark.parametrize("band", ((29, 41), (29, 33)))
def test_adaptive_finder_whitens_every_drawn_case_on_every_skin_tone(band: tuple[int, int]) -> None:
    counts = pass_counts(band)
    cases = len(TEETH) * len(LIGHTS)
    assert counts == {tone: cases for tone in SKINS}


@pytest.mark.skip(reason=RETIRE_FIXED_FINDER)
def test_fixed_finder_misses_teeth_that_fill_most_of_the_opening() -> None:
    # The old median + 5 cut-off excludes enamel when teeth are most of the opening.
    photo, opening, lips = drawn_mouth(SKINS["tan"], TEETH["white"], LIGHTS["neutral"])
    assert whiten(photo, opening, strength=100, finder="fixed",  # type: ignore[call-arg]
                  lips=lips).changed == 0


@pytest.mark.parametrize("tone", sorted(SKINS))
def test_tongue_only_and_empty_dark_mouths_report_no_teeth(tone: str) -> None:
    for tongue in (True, False):
        photo, opening, lips = drawn_mouth(SKINS[tone], None, LIGHTS["neutral"], tongue=tongue)
        result = whiten(photo, opening, strength=100)
        assert result.changed == 0 and not result.alpha.any()
        assert (result.status, result.reason_code) == ("refused", "no_teeth_visible")
        assert np.array_equal(result.image, photo)


def test_warmth_floor_holds_for_bluish_teeth_in_cool_light() -> None:
    photo, opening, lips = drawn_mouth(SKINS["medium"], (226, 236, 252), (0.8, 0.94, 1.0))
    result = whiten(photo, opening, strength=100)
    touched = result.alpha > 0
    assert touched.any()
    assert np.all(srgb_to_lab(result.image)[..., 2][touched] >= WARMTH_FLOOR)


@pytest.mark.skip(reason=RETIRE_FIXED_FINDER)
def test_default_fixed_finder_is_unchanged_and_unknown_finder_is_refused() -> None:
    photo, opening, _ = drawn_mouth(SKINS["tan"], TEETH["white"], LIGHTS["neutral"], band=(29, 32))
    first = whiten(photo, opening, strength=100)
    fixed = whiten(photo, opening, strength=100, finder="fixed")  # type: ignore[call-arg]
    assert np.array_equal(first.image, fixed.image) and first.changed == fixed.changed
    with pytest.raises(ValueError, match="finder"):
        whiten(photo, opening, finder="guess")  # type: ignore[call-arg]


def face_with_mouth(gap: float) -> tuple[np.ndarray, np.ndarray]:
    points = placed_face(200, 250)
    top, bottom = points[13, 1], points[14, 1]
    centre = (top + bottom) / 2
    width = float(np.linalg.norm(points[291] - points[61]))
    for index in regions.LIPS_INNER:
        if gap == 0:
            points[index, 1] = centre
        elif points[index, 1] < centre - 1e-6 or index == 13:
            points[index, 1] -= gap * width / 2
        elif points[index, 1] > centre + 1e-6 or index == 14:
            points[index, 1] += gap * width / 2
    photo = drawn_photo(500, 400, [(points, SKINS["deep"])])
    opening = regions.region_mask("mouth_opening", points, 500, 400, normalized=False) > 0.5
    yy = np.mgrid[:500, :400][0]
    upper = opening & (yy <= centre)
    photo[upper] = TEETH["ivory"]
    photo[opening & ~upper] = (150, 70, 72)
    return photo, points


def test_mesh_closed_mouth_is_not_applicable_and_open_mouth_is_whitened() -> None:
    closed_photo, closed = face_with_mouth(0.0)
    observed = teeth_engine.observe(closed)
    assert (observed.state, observed.reason_code) == ("closed", "mouth_closed")
    skipped = teeth_engine.render(closed_photo, closed)
    assert skipped.not_applicable and skipped.reason_code == "mouth_closed"
    assert skipped.changed == 0 and np.array_equal(skipped.image, closed_photo)
    open_photo, opened = face_with_mouth(0.3)
    assert teeth_engine.observe(opened).state == "open"
    edited = teeth_engine.render(open_photo, opened)
    assert edited.status == "edited" and edited.changed > 0
    touched = edited.alpha > 0
    assert np.all(srgb_to_lab(edited.image)[..., 2][touched] >= WARMTH_FLOOR)
    assert np.array_equal(edited.image[~touched], open_photo[~touched])
    row = fc.teeth_whitening(open_photo, opened)
    assert row.passed and row.measurements["warmth_ok"] is True, row.measurements


def test_closed_mouth_is_not_applicable_and_open_mouth_is_measured() -> None:
    closed_photo, closed = face_with_mouth(0.0)
    row = fc.teeth_whitening(closed_photo, closed)
    assert row.measurements["applicability"] == "not_applicable"
    assert row.measurements["reason_code"] == "mouth_closed"
    open_photo, opened = face_with_mouth(0.3)
    assert fc.mouth_gap(opened) >= fc.MOUTH_CLOSED_GAP
    measured = fc.teeth_whitening(open_photo, opened)
    assert "applicability" not in measured.measurements
    assert measured.passed, measured.measurements
    assert measured.measurements["warmth_ok"] is True
