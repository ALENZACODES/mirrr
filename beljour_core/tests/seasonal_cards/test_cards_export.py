"""Export tests: PNG metadata, virtual-card payload contents and privacy checks.

Author: John Khan.
"""

from __future__ import annotations

import base64
import io
import json
import socket
from collections.abc import Iterator

import pytest
from PIL import Image

from plumb_api.seasonal.cards import (
    Card,
    FaceBox,
    export_payload,
    export_payload_json,
    export_png,
    export_svg,
    make_card,
)
from plumb_api.seasonal.cards.export import (
    ALLOWED_PAYLOAD_KEYS,
    AUTHOR,
    check_payload,
    embedded_images,
    png_bytes,
)
from plumb_api.seasonal.cards.synthetic import encode_with_metadata, synthetic_portrait


@pytest.fixture()
def no_network(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    def refuse(*args: object, **kwargs: object) -> None:
        raise AssertionError("cards must not open network connections")

    monkeypatch.setattr(socket, "create_connection", refuse)
    monkeypatch.setattr(socket.socket, "connect", refuse)
    yield


def _card(seed: int = 11, **kwargs: object) -> Card:
    image, faces = synthetic_portrait(480, 600, seed=seed)
    data = encode_with_metadata(image, "JPEG", orientation=1)
    return make_card("halloween", data, to="Sam", sender="Alex", message="Boo!", seed=seed,
                     face=faces[0], **kwargs)  # type: ignore[arg-type]


def test_png_has_share_size_and_only_author_and_app_metadata(no_network: None) -> None:
    data = export_png(_card())
    with Image.open(io.BytesIO(data)) as image:
        assert image.size == (1080, 1350)
        assert image.format == "PNG"
        assert image.info == {"Author": "John Khan", "Software": "BELJOUR"}
        assert len(image.getexif()) == 0
    assert b"metadata-that-must-not-survive" not in data


def test_png_custom_width() -> None:
    with Image.open(io.BytesIO(export_png(_card(), width=540))) as image:
        assert image.size == (540, 675)
    with pytest.raises(ValueError):
        export_png(_card(), width=10)


def test_png_bytes_drop_incoming_info() -> None:
    image = Image.new("RGB", (20, 20))
    image.info["Comment"] = "leak"
    with Image.open(io.BytesIO(png_bytes(image))) as again:
        assert "Comment" not in again.info


def test_payload_fields_and_privacy(no_network: None) -> None:
    card = _card()
    payload = export_payload(card)
    assert set(payload) == ALLOWED_PAYLOAD_KEYS
    assert payload["version"] == 1
    assert payload["occasion"] == "halloween"
    assert payload["author"] == AUTHOR
    assert payload["text"] == {"to": "Sam", "from": "Alex", "message": "Boo!",
                               "greeting": "Happy Halloween"}
    assert payload["design"]["fingerprint"] == card.fingerprint
    assert check_payload(payload) == []
    text = json.dumps(payload)
    assert "metadata-that-must-not-survive" not in text
    for forbidden in ("face", "landmark", "exif", "gps"):
        assert forbidden not in {k.lower() for k in payload}
    images = embedded_images(payload["svg"])
    assert len(images) == 1
    assert not set(images[0].info) - {"jfif", "jfif_version", "jfif_unit", "jfif_density", "dpi"}


def test_payload_json_is_deterministic_and_round_trips() -> None:
    card = _card()
    first = export_payload_json(card)
    assert first == export_payload_json(card)
    assert json.loads(first) == export_payload(card)


def test_check_payload_flags_problems() -> None:
    payload = export_payload(_card())
    payload["face_box"] = [1, 2, 3, 4]
    payload["author"] = "Someone"
    payload["svg"] = payload["svg"].replace("</svg>", '<script src="https://x"/></svg>')
    problems = check_payload(payload)
    assert any("unexpected keys" in p for p in problems)
    assert any("author" in p for p in problems)
    assert any("<script" in p for p in problems)


def test_user_text_may_contain_a_link_without_failing_the_markup_scan() -> None:
    image, _ = synthetic_portrait(300, 300, seed=1)
    card = make_card("new_year", encode_with_metadata(image), message="see https://example.org",
                     seed=3)
    assert check_payload(export_payload(card)) == []


def test_embedded_photo_with_exif_would_be_caught() -> None:
    dirty = encode_with_metadata(synthetic_portrait(64, 64)[0], "JPEG")
    encoded = base64.b64encode(dirty).decode()
    svg = f'<svg><image href="data:image/jpeg;base64,{encoded}"/></svg>'
    payload = {"author": AUTHOR, "svg": svg}
    assert any("metadata" in p for p in check_payload(payload))


def test_svg_export_embeds_a_clean_fitted_photo() -> None:
    card = _card()
    svg = export_svg(card)
    assert svg.count("<image") == 1
    tile = embedded_images(svg)[0]
    box = card.design.layout.photo_box
    assert abs(tile.width - box.w) <= 1 and abs(tile.height - box.h) <= 1


def test_face_box_never_appears_in_any_export() -> None:
    card = _card()
    assert isinstance(card.face, FaceBox)
    blob = export_payload_json(card)
    for value in (card.face.x, card.face.y, card.face.w, card.face.h):
        assert f'"{value}"' not in blob
    assert "FaceBox" not in blob
