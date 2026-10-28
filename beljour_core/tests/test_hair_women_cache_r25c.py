"""R25c bounded cache lifecycle without timings or photo persistence. Author: John Khan."""

from __future__ import annotations

import numpy as np

from plumb_api.engines.gender_look.levels import GuardDecision
from plumb_api.engines.hair_women.contracts import HairGeometry
from plumb_api.engines.hair_women.short_sides import HairStyleSession


class Passthrough:
    def guard(self, before: np.ndarray, after: np.ndarray, lock_level: float) -> GuardDecision:
        return GuardDecision(after.copy(), 1.0, False)


def case(tone: int) -> tuple[np.ndarray, np.ndarray, HairGeometry]:
    yy, xx = np.mgrid[:32, :32]
    photo = np.zeros((32, 32, 4), dtype=np.uint8)
    photo[..., :3] = np.uint8(tone)
    photo[..., 0] = ((tone + xx * 2 + yy) % 256).astype(np.uint8)
    photo[..., 3] = 255
    hair = ((xx > 4) & (xx < 27) & (yy > 4) & (yy < 29)).astype(float)
    geometry = HairGeometry((.5,.04),(.22,.30),(.78,.30),(.5,.95),.56,.91)
    return photo, hair, geometry


def test_cache_evicts_oldest_preparation_when_full() -> None:
    session = HairStyleSession(max_styles=2)
    image, mask, geometry = case(90)
    for name in ("pixie_taper", "bixie", "side_undercut"):
        session.render(image, mask, geometry, name, 5, primary_face_box=(0,0,1,1),
                       identity_guard=Passthrough())
    assert session.zone_computations == 3
    session.render(image, mask, geometry, "pixie_taper", 5,
                   primary_face_box=(0,0,1,1), identity_guard=Passthrough())
    assert session.zone_computations == 4


def test_photo_replacement_invalidates_prepared_zone_key() -> None:
    session = HairStyleSession()
    for tone in (60, 90):
        image, mask, geometry = case(tone)
        session.render(image, mask, geometry, "pixie_taper", 5,
                       primary_face_box=(0,0,1,1), identity_guard=Passthrough())
    assert session.zone_computations == 2


def test_cached_mask_is_not_stored_or_reused_after_user_correction() -> None:
    session = HairStyleSession()
    image, mask, geometry = case(110)
    first = session.render(image, mask, geometry, "pixie_taper", 5,
                           primary_face_box=(0,0,1,1), identity_guard=Passthrough())
    corrected = np.zeros(mask.shape, dtype=float)
    second = session.render(image, corrected, geometry, "pixie_taper", 5,
                            primary_face_box=(0,0,1,1), identity_guard=Passthrough())
    assert first.changed_pixel_share > 0
    assert np.array_equal(second.image, image)
    assert session.zone_computations == 1
