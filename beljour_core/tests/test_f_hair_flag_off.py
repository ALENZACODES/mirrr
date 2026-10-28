"""The full local fibre/palette/short-sides trio spends zero YouCam units."""
from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock

from plumb_api.engines.concealer import CoverResult, CoverSession
from plumb_api.engines.hair_palette import PalettePreview, apply_shade, catalogue, suggest
from plumb_api.engines.menshair import StyleRender, render_style_for_face
from tests.test_commerce_r16c import api as api
from tests.test_f_primary_face_input import scene


def test_three_local_hair_features_work_when_provider_flag_is_disabled(api: object) -> None:
    _client, _photo_id, app = api
    state = app.state.plumb
    state.settings = SimpleNamespace(live=False, youcam_styling=False, youcam_skin=False, kill_switch=True)
    state.gateway.run = AsyncMock(side_effect=AssertionError("Local hair previews cannot call YouCam"))
    image, mask, scalp, landmarks = scene()
    fibre = CoverSession().render(image, mask, scalp, landmarks=landmarks, level=4,
                                  primary_box=(0, 0, 96, 96))
    assert isinstance(fibre, CoverResult) and fibre.provider_calls == 0
    palette = catalogue()
    assert palette and all(row.assumed for row in palette)
    recommendations = suggest(palette[18].lab)
    assert recommendations and all(row.no_lightening for row in recommendations)
    coloured = apply_shade(image, mask, landmarks, "natural-03-n", level=4,
                           primary_box=(0, 0, 96, 96))
    assert isinstance(coloured, PalettePreview) and coloured.provider_calls == 0
    haircut = render_style_for_face(image, mask, landmarks, "local-low-fade", 4,
                                    primary_box=(0, 0, 96, 96))
    assert isinstance(haircut, StyleRender) and haircut.provider_calls == 0
    assert state.gateway.run.await_count == 0
