"""Animation tests: frames match single renders and never touch the eyes.

Author: John Khan.
"""

from __future__ import annotations

import numpy as np
import pytest

from plumb_api.seasonal.packs import PackError, animate_look, apply_look
from plumb_api.seasonal.packs.particles import LOOP_FRAMES
from plumb_api.seasonal.packs.synthetic import single
from plumb_api.seasonal.packs.target import protected_mask


def test_clip_frames_match_single_frame_renders() -> None:
    image, target = single(160)
    clip = animate_look(image, "christmas", "snow_fall", target, frames=4, start=7, seed=3)
    assert len(clip.frames) == 4
    for index, frame in enumerate(clip.frames):
        alone = apply_look(image, "christmas", "snow_fall", target, seed=3, frame=7 + index)
        assert np.array_equal(frame, alone)


def test_clip_moves_and_keeps_eyes_clear() -> None:
    image, target = single(200)
    clip = animate_look(image, "halloween", "floating_bats", target, frames=6, fps=24)
    eyes = protected_mask(target, image.shape[1], image.shape[0])
    for frame in clip.frames:
        assert np.array_equal(frame[eyes], image[eyes])
    assert not np.array_equal(clip.frames[0], clip.frames[3])
    assert clip.seconds == pytest.approx(0.25)


def test_only_light_looks_animate() -> None:
    image, target = single(96)
    with pytest.raises(PackError, match="only light looks"):
        animate_look(image, "halloween", "witch_hat", target)


@pytest.mark.parametrize(
    ("kwargs", "message"),
    [
        ({"frames": 0}, "frames"),
        ({"frames": 500}, "frames"),
        ({"fps": 7}, "fps"),
        ({"start": -2}, "start"),
    ],
)
def test_clip_arguments_are_checked(kwargs: dict[str, int], message: str) -> None:
    image, target = single(96)
    with pytest.raises(PackError, match=message):
        animate_look(image, "new_year", "confetti_fall", target, **kwargs)  # type: ignore[arg-type]


def test_loop_clip_is_one_seamless_period() -> None:
    image, target = single(96)
    clip = animate_look(image, "new_year", "confetti_fall", target, loop=True, fps=24)
    assert len(clip.frames) == LOOP_FRAMES
    assert clip.seconds == pytest.approx(LOOP_FRAMES / 24)
    after = apply_look(image, "new_year", "confetti_fall", target, frame=LOOP_FRAMES)
    assert np.array_equal(clip.frames[0], after)
