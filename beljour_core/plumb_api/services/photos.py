"""Temporary photo store. Photos are normalised (rotation applied, EXIF and other metadata
dropped by re-encoding), hashed, kept on disk for a short TTL, then deleted.

R13 hardening (improve-r12 item 11, code review fix 10):
  * ids are exactly 64 lowercase hex characters (`check_id`), on get and on delete;
  * only JPEG, PNG and WEBP are accepted (415), checked from the header before decoding;
  * the pixel count is checked from the header before `load()` (413), and Pillow's
    decompression-bomb error is a 413 too, never a 500;
  * each photo records the browser sessions that added it. A session that did not add a
    photo gets the same 404 as a deleted photo, for reads and deletes. Deleting removes
    this session's claim; the file goes when no session claims it any more.
R14 closes the old anonymous-owner exception: uploaded photos require a private session;
old anonymous owner records cannot authorize external reads or deletes. The shared sample
is handled explicitly by AppState.photo, never by granting anonymous ownership.
No photo bytes are logged. Author: John Khan.
"""
from __future__ import annotations

import hashlib
import io
import json
import re
import time
import warnings
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageOps, UnidentifiedImageError

from ..errors import PlumbError

MAX_SIDE = 2048
MIN_SHORT_SIDE = 480
MAX_PIXELS = 24_000_000          # ASSUMED limit, also in config.Settings.max_pixels
FORMATS = frozenset({"JPEG", "PNG", "WEBP"})
_ID = re.compile(r"^[0-9a-f]{64}$")


def check_id(sha: object) -> str:
    """Photo ids are sha256 hex digests, lowercase. Anything else is refused before any file
    access, so `..`, slashes, uppercase or short ids never reach the filesystem."""
    if not isinstance(sha, str) or not _ID.fullmatch(sha):
        raise PlumbError(400, "bad_id", "That photo id isn't valid.")
    return sha


def _gone() -> PlumbError:
    return PlumbError(404, "photo_gone", "That photo has already been deleted. Please add it again.")


def _too_many_pixels(max_pixels: int) -> PlumbError:
    return PlumbError(413, "too_many_pixels",
                      f"That photo has more than {max_pixels // 1_000_000} million pixels. Please use a smaller one.")


@dataclass
class StoredPhoto:
    sha: str
    data: bytes
    width: int
    height: int
    content_type: str = "image/jpeg"


def normalise(raw: bytes, max_side: int = MAX_SIDE, max_pixels: int = MAX_PIXELS) -> tuple[bytes, int, int]:
    """Check the header, decode, apply EXIF rotation, convert to RGB, cap size and re-encode
    as JPEG. Re-encoding with no exif argument writes a file with no EXIF, GPS or maker notes."""
    if max_pixels < 1:
        raise ValueError("max_pixels must be positive")
    unsupported = PlumbError(415, "bad_image", "That file isn't a photo we can read. Try a JPEG, PNG or WEBP.")
    try:
        with warnings.catch_warnings():
            # Pillow warns between its own limit and twice it; we enforce our lower limit instead.
            warnings.simplefilter("ignore", Image.DecompressionBombWarning)
            img = Image.open(io.BytesIO(raw))
            if img.format not in FORMATS:
                raise unsupported
            width, height = img.size
            if width < 1 or height < 1:
                raise unsupported
            if width * height > max_pixels:
                raise _too_many_pixels(max_pixels)
            img.load()
    except Image.DecompressionBombError as exc:
        raise _too_many_pixels(max_pixels) from exc
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError) as exc:
        raise unsupported from exc
    rgb = ImageOps.exif_transpose(img).convert("RGB")
    if max(rgb.size) > max_side:
        rgb.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    out = io.BytesIO()
    rgb.save(out, "JPEG", quality=92, optimize=True)
    return out.getvalue(), rgb.width, rgb.height


class PhotoStore:
    def __init__(self, root: Path, ttl_s: int = 3600, max_pixels: int = MAX_PIXELS):
        self.root = Path(root) / "photos"
        self.root.mkdir(parents=True, exist_ok=True)
        self.ttl_s = ttl_s
        self.max_pixels = max_pixels

    # owners --------------------------------------------------------------------------
    def _owners_path(self, sha: str) -> Path:
        return self.root / f"{sha}.owners"

    def owners(self, sha: str) -> set[str]:
        path = self._owners_path(check_id(sha))
        try:
            data = json.loads(path.read_text())
        except (OSError, ValueError):
            return set()
        return {s for s in data if isinstance(s, str)} if isinstance(data, list) else set()

    def _write_owners(self, sha: str, owners: set[str]) -> None:
        path = self._owners_path(sha)
        if owners:
            path.write_text(json.dumps(sorted(owners)))
        else:
            path.unlink(missing_ok=True)

    def owned_by(self, sha: str, session: str) -> bool:
        """Only the actual private uploading session owns a stored photo.

        Fail closed for anonymous records written by older builds. Internal sample and
        TTL operations deliberately call get/delete without a session.
        """
        return session != "anonymous" and session in self.owners(sha)

    # photos --------------------------------------------------------------------------
    def put(self, raw: bytes, min_short_side: int = MIN_SHORT_SIDE, owner: str | None = None) -> StoredPhoto:
        if owner == "anonymous":
            raise PlumbError(428, "session_required", "A private session is required to store this photo.")
        data, w, h = normalise(raw, max_pixels=self.max_pixels)
        if min(w, h) < min_short_side:
            raise PlumbError(422, "too_small", f"The image is {w}x{h}. Please use one at least {min_short_side} pixels on the short side.")
        sha = hashlib.sha256(data).hexdigest()
        (self.root / f"{sha}.jpg").write_bytes(data)
        if owner is not None:
            self._write_owners(sha, self.owners(sha) | {owner})
        return StoredPhoto(sha, data, w, h)

    def get(self, sha: str, session: str | None = None) -> StoredPhoto:
        """With `session`, only a session that added the photo may read it (others get 404)."""
        check_id(sha)
        path = self.root / f"{sha}.jpg"
        if not path.exists() or (session is not None and not self.owned_by(sha, session)):
            raise _gone()
        data = path.read_bytes()
        with Image.open(io.BytesIO(data)) as img:
            w, h = img.size
        return StoredPhoto(sha, data, w, h)

    def delete(self, sha: str, session: str | None = None) -> bool:
        """Without `session` the file goes at once (TTL purge, tests). With `session`, only an
        owner may delete: its claim is removed, and the file goes with the last claim.
        A surviving owner claim is removable even if the byte file has already gone.
        Returns True when the file was removed."""
        check_id(sha)
        path = self.root / f"{sha}.jpg"
        if session is not None:
            owners = self.owners(sha)
            if not self.owned_by(sha, session):
                raise _gone()
            owners.discard(session)
            self._write_owners(sha, owners)
            if owners:
                return False
        existed = path.exists()
        path.unlink(missing_ok=True)
        self._owners_path(sha).unlink(missing_ok=True)
        return existed

    def purge_expired(self, now: float | None = None, keep: set[str] | None = None) -> int:
        now = time.time() if now is None else now
        removed = 0
        for path in self.root.glob("*.jpg"):
            if keep and path.stem in keep:
                continue
            if now - path.stat().st_mtime > self.ttl_s:
                path.unlink(missing_ok=True)
                (self.root / f"{path.stem}.owners").unlink(missing_ok=True)
                removed += 1
        return removed
