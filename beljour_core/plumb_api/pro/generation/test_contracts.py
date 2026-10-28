"""Synthetic scene request and safety boundary regressions. Author: John Khan."""

from __future__ import annotations

import io
from dataclasses import replace

import pytest
from PIL import Image

from .contracts import (
    JOB_SCHEMA,
    MODEL_ID,
    SETTINGS_SCHEMA,
    GenerationRefused,
    GenerationSettings,
    SceneRequest,
)
from .safety import check_prompt, verify_and_label_output
from .test_support import AllowedReviews, scene_request


def _settings(**changes: object) -> dict[str, object]:
    values: dict[str, object] = {
        "schema": SETTINGS_SCHEMA,
        "width": 256,
        "height": 512,
        "steps": 4,
        "seed": 9,
        "images": 1,
        "gpu_rate": None,
    }
    values.update(changes)
    return values


@pytest.mark.parametrize("field,value", [
    ("width", 128), ("width", 257), ("width", 4096), ("height", 191),
    ("height", -256), ("height", 300), ("steps", 0), ("steps", 5),
    ("seed", -1), ("seed", 2**32), ("images", 0), ("images", 5),
    ("width", True), ("images", 1.0), ("gpu_rate", -0.1),
    ("gpu_rate", float("nan")), ("gpu_rate", float("inf")),
    ("gpu_rate", 1001), ("schema", "invalid"),
])
def test_reject_invalid_generation_settings(field: str, value: object) -> None:
    with pytest.raises(GenerationRefused):
        GenerationSettings.from_mapping(_settings(**{field: value}))


def test_settings_canonical_replay_digest() -> None:
    first = GenerationSettings.from_mapping(_settings())
    reordered = _settings()
    reordered = dict(reversed(list(reordered.items())))
    second = GenerationSettings.from_mapping(reordered)
    assert first.digest() == second.digest()
    assert GenerationSettings.from_mapping(_settings(images=4)).images == 4


def test_unknown_setting_is_rejected() -> None:
    with pytest.raises(GenerationRefused):
        GenerationSettings.from_mapping({**_settings(), "untrusted": 5})


@pytest.mark.parametrize("purpose", ["background", "place", "prop"])
def test_supported_purposes_are_available(purpose: str) -> None:
    request = scene_request(purpose=purpose)
    assert check_prompt(request, AllowedReviews()) == "a" * 64
    assert request.public_audit()["schema"] == JOB_SCHEMA
    assert request.public_audit()["prompt_sha256"] != request.prompt


@pytest.mark.parametrize("purpose", ["avatar", "identity", "face", "costume", "unknown", ""])
def test_forbidden_purposes_refuse_before_review(purpose: str) -> None:
    with pytest.raises(GenerationRefused, match="purpose"):
        check_prompt(scene_request(purpose=purpose), AllowedReviews())


@pytest.mark.parametrize("phrase", [
    "A portrait with a face", "A child in a park", "A nude scene",
    "Person standing", "Celebrity photograph", "An imitation logo",
    "Violent scene", "Deepfake identity picture", "A nude sculpture",
    "A perSON in the frame", "Children on a beach",
])
def test_subject_screening_requires_scene_only(phrase: str) -> None:
    request = replace(scene_request(), prompt=phrase)
    reviewer = AllowedReviews()
    with pytest.raises(GenerationRefused, match="restricted"):
        check_prompt(request, reviewer)
    assert reviewer.calls == 0


def test_normalize_unicode_width_in_restricted_tokens() -> None:
    request = replace(scene_request(), prompt="A fullwidth ＰＥＲＳＯＮ in the photo")
    with pytest.raises(GenerationRefused):
        check_prompt(request, AllowedReviews())


def test_prompt_reviews_fail_closed() -> None:
    with pytest.raises(GenerationRefused, match="refused"):
        check_prompt(scene_request(), AllowedReviews(False))


@pytest.mark.parametrize("value", ["Bad\nPrompt", "Zero\u200bwidth", " Leading", "Trailing ", ""])
def test_invalid_or_hidden_prompt_text(value: str) -> None:
    with pytest.raises(GenerationRefused):
        SceneRequest("place", value, scene_request().settings).validate()


def _source_image(size: tuple[int, int] = (256, 256), *, fmt: str = "JPEG") -> bytes:
    image = Image.new("RGB", size, (33, 44, 55))
    with io.BytesIO() as stream:
        image.save(stream, fmt, exif=b"GPS-private-not-to-copy")
        return stream.getvalue()


def test_label_and_metadata_removal() -> None:
    output, digest = verify_and_label_output(
        _source_image(), purpose="background", width=256, height=256,
        reviewer=AllowedReviews(), cancelled=lambda: False,
    )
    assert digest == "a" * 64
    assert b"GPS-private-not-to-copy" not in output
    with Image.open(io.BytesIO(output)) as picture:
        assert picture.format == "PNG"
        assert picture.size == (256, 256)
        assert not picture.getexif()
        assert picture.getpixel((5, 251)) != (33, 44, 55)


@pytest.mark.parametrize("size", [(512, 256), (255, 256), (256, 255)])
def test_wrong_output_dimensions_refuse(size: tuple[int, int]) -> None:
    with pytest.raises(GenerationRefused, match="size"):
        verify_and_label_output(
            _source_image(size), purpose="prop", width=256, height=256,
            reviewer=AllowedReviews(), cancelled=lambda: False,
        )


def test_refuses_generated_image_review_and_cancellation() -> None:
    with pytest.raises(GenerationRefused, match="review"):
        verify_and_label_output(
            _source_image(), purpose="prop", width=256, height=256,
            reviewer=AllowedReviews(False), cancelled=lambda: False,
        )
    with pytest.raises(GenerationRefused):
        verify_and_label_output(
            _source_image(), purpose="prop", width=256, height=256,
            reviewer=AllowedReviews(), cancelled=lambda: True,
        )


@pytest.mark.parametrize("bad", [b"", b"plaintext portrait", b"<svg/>", b"x" * 1024])
def test_nonimage_output_is_not_released(bad: bytes) -> None:
    with pytest.raises(GenerationRefused):
        verify_and_label_output(
            bad, purpose="place", width=256, height=256,
            reviewer=AllowedReviews(), cancelled=lambda: False,
        )


def test_model_id_is_single_permitted_variant() -> None:
    assert MODEL_ID == "black-forest-labs/FLUX.1-schnell"
