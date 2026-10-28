"""Preview and release tickets reject stale, superseded and cancelled work.

Author: John Khan.
"""

from __future__ import annotations

import pytest

from .preview_session import PREVIEW_MAX_EDGE, PreviewSession, preview_size

PHOTO = "a" * 64
OTHER = "b" * 64


def _session(width: int = 2000, height: int = 1500) -> PreviewSession:
    session = PreviewSession()
    session.open(PHOTO, width, height)
    return session


def test_previews_are_bounded_and_releases_are_full_size() -> None:
    session = _session()
    preview = session.preview(detail_level=2.0)
    release = session.release(detail_level=2.0)
    assert (preview.width, preview.height) == (512, 384)
    assert not preview.full_resolution
    assert (release.width, release.height) == (2000, 1500) and release.full_resolution


def test_small_photos_preview_at_their_own_size() -> None:
    assert preview_size(300, 200) == (300, 200)
    assert max(preview_size(4000, 30)) == PREVIEW_MAX_EDGE
    assert preview_size(4000, 30)[1] >= 8


def test_only_the_newest_ticket_of_each_kind_is_accepted() -> None:
    session = _session()
    first = session.preview(detail_level=2.0)
    second = session.preview(detail_level=2.1)
    release = session.release()
    assert not session.accepts(first)
    assert session.accepts(second) and session.accepts(release)


def test_cancelled_tickets_are_refused() -> None:
    session = _session()
    ticket = session.release()
    session.cancel(ticket)
    assert not session.accepts(ticket)
    assert not session.exportable(ticket)


def test_replacing_or_closing_the_photo_invalidates_everything() -> None:
    session = _session()
    preview, release = session.preview(), session.release()
    revision = session.revision
    assert session.open(OTHER, 640, 480) == revision + 1
    assert not session.accepts(preview) and not session.accepts(release)
    fresh = session.release()
    session.close()
    assert not session.accepts(fresh)
    with pytest.raises(ValueError, match="no photo"):
        session.preview()


def test_previews_are_never_exportable() -> None:
    session = _session()
    preview = session.preview()
    assert session.accepts(preview) and not session.exportable(preview)
    assert session.exportable(session.release())


@pytest.mark.parametrize(("kwargs", "message"), [
    ({"detail_level": 0.5}, "strength"), ({"lock_level": 3.05}, "strength"),
    ({"scale": 3}, "scale"), ({"detail_level": True}, "strength"),
])
def test_invalid_settings(kwargs: dict[str, object], message: str) -> None:
    with pytest.raises(ValueError, match=message):
        _session().release(**kwargs)  # type: ignore[arg-type]


@pytest.mark.parametrize(("digest", "size"), [
    ("A" * 64, (100, 100)), ("a" * 63, (100, 100)), (PHOTO, (4, 100)), (PHOTO, (100, 20000)),
])
def test_invalid_photos(digest: str, size: tuple[int, int]) -> None:
    with pytest.raises(ValueError):
        PreviewSession().open(digest, *size)
