"""Stretch: more drawn adversarial cases for the C16 fixes, ported to main's code.

Pass definition: a 48 px face in a 320 px photo, missed by the 256 px first
crop, is recovered by an enlarged recovery crop and mapped back onto its box;
a skin-coloured hand over an open mouth is never whitened in any of the 96
tooth x light x tone cases, and the teeth beside it are whitened in all 96 on every
tone; the Still Her measurement with the per-face cache
(still_her.prepare_face) equals a fresh measurement on heavily JPEG-blocked
and sepia portraits; glasses glare over an iris is kept untouched while the
visible iris is recoloured. Drawn images only. The C16 originals are kept at
commit 4c97dad. Author: John Khan.
"""
from __future__ import annotations

import io
import sys
from collections.abc import Callable
from typing import Any

import numpy as np
import pytest
from gatefix_drawing import FakeMeshes, boxes_for, draw_face, head_box
from gatefix_gates import REALFACE
from gatefix_meshes import drawn_photo, placed_face
from PIL import Image
from test_gatefix_teeth import LIGHTS, SKINS, TEETH, drawn_mouth

from plumb_api.engines.core import regions
from plumb_api.engines.teeth.whiten import whiten
from plumb_api.filters.qa import fixtures as F
from plumb_api.filters.qa import still_her as SH
from plumb_api.filters.recipe import registry
from plumb_api.vision import box_first as bf

if str(REALFACE) not in sys.path:
    sys.path.insert(0, str(REALFACE))

import feature_checks as fc  # noqa: E402


def test_tiny_face_is_recovered_by_an_enlarged_recovery_crop() -> None:
    image = draw_face(320, 320, 160, 170, 20, 24)
    box = head_box(160, 170, 20, 24)
    meshes = FakeMeshes(lambda patch: min(patch.shape[:2]) >= 400)
    result = bf.BoxFirstDetector(boxes_for(box), meshes).detect(image)
    assert meshes.calls[0] == (256, 256, 3)
    assert len(result.faces) == 1
    assert result.reason_code == "recovered"
    assert bf.associated(result.faces[0], bf.FaceBox(*box[:4]), 320, 320) >= 0.6
    matched = [row for row in result.attempts if row.get("matched")]
    assert len(matched) == 1 and matched[0].get("extra_call") is True


def hand_cases() -> list[tuple[tuple[str, str, str], np.ndarray, np.ndarray, Any]]:
    cases = []
    for light_name, light in LIGHTS.items():
        for teeth_name, teeth in TEETH.items():
            for tone, skin in SKINS.items():
                photo, opening, _ = drawn_mouth(skin, teeth, light)
                hand = np.zeros(opening.shape, dtype=bool)
                hand[25:55, 60:110] = True
                photo[hand] = np.clip(np.rint(np.array(skin) * np.array(light)), 0, 255)
                result = whiten(photo, opening, strength=100)
                cases.append(((light_name, teeth_name, tone), photo, hand, result))
    return cases


def test_a_hand_over_the_mouth_is_never_whitened() -> None:
    cases = hand_cases()
    assert len(cases) == 96
    touched = [name for name, photo, hand, result in cases
               if not np.array_equal(result.image[hand], photo[hand])]
    assert touched == []


def test_teeth_beside_a_hand_are_still_whitened_on_every_skin_tone() -> None:
    """The hand is left out of the mouth's measurements (enamel.occluder), so how light the hand
    is no longer decides whether the teeth are found: every tooth x light x tone case is edited."""
    by_tone: dict[str, list[int]] = {}
    for (_, _, tone), _, _, result in hand_cases():
        by_tone.setdefault(tone, []).append(result.changed)
    assert {tone: sum(1 for n in changed if n > 0) for tone, changed in by_tone.items()} == \
        {tone: 16 for tone in SKINS}


def jpeg_blocked(image: np.ndarray) -> np.ndarray:
    buffer = io.BytesIO()
    Image.fromarray(image).save(buffer, format="JPEG", quality=8)
    with Image.open(io.BytesIO(buffer.getvalue())) as reader:
        decoded: np.ndarray = np.asarray(reader.convert("RGB"), dtype=np.uint8).copy()
    return decoded


def sepia(image: np.ndarray) -> np.ndarray:
    matrix = np.array([[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]])
    toned: np.ndarray = np.rint(image.astype(np.float64) @ matrix.T).clip(0, 255).astype(np.uint8)
    return toned


@pytest.mark.parametrize("damage", (jpeg_blocked, sepia), ids=("jpeg", "sepia"))
def test_cached_still_her_equals_a_fresh_measurement_on_damaged_photos(
        damage: Callable[[np.ndarray], np.ndarray]) -> None:
    portrait = F.portrait("dark", width=160, height=192)
    image = damage(portrait.image)
    centre = F.face_centre(portrait)
    recipes = registry.default().ranked()[::6]
    known = SH.prepare_face(image, portrait.face.points, portrait.masks)
    after = [SH.measure_image(r, image, portrait.face.points, portrait.masks, "t",
                              face_centre=centre, inputs=known) for r in recipes]
    fresh = [SH.measure_image(r, image, portrait.face.points, portrait.masks, "t",
                              face_centre=centre) for r in recipes]
    assert after == fresh
    assert [vars(a) for a in after] == [vars(b) for b in fresh]


def test_glasses_glare_over_an_iris_is_kept_while_the_iris_is_recoloured() -> None:
    points = placed_face(200, 250)
    photo = drawn_photo(500, 400, [(points, SKINS["medium"])])
    iris = regions.region_mask("right_iris", points, 500, 400, normalized=False) >= 0.5
    rows, cols = np.nonzero(iris)
    glare = np.zeros(iris.shape, dtype=bool)
    glare[rows.min():rows.min() + 3, cols.min():cols.max() + 1] = True
    glare &= iris
    photo[glare] = (250, 250, 248)
    row = fc.iris_recolour(photo, points)
    assert row.passed
    assert row.measurements["catchlight_unchanged"] is True
    assert row.output is not None and np.array_equal(row.output[glare], photo[glare])
