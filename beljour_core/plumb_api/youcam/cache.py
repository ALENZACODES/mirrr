"""Result cache keyed by image hash, feature and parameters.

Two layers:
  * runtime store: SQLite plus blob files under the data dir, expires after a TTL
  * fixtures: read only JSON files committed to the repo, used for demo mode

The same key always means the same photo, the same feature and the same settings, so a
repeat request never spends units twice.

Two key formats exist:
  * v1 (Plumb): sha256("image|feature|params")[:40]. The committed demo fixtures use it.
  * v2 (BELJOUR): "k2" + sha256 of a canonical JSON object holding the image hash,
    endpoint, endpoint version, sorted params, every reference image hash and the pipeline
    version, cut to 46 hex characters. New results are written under v2. Reads try v2 first,
    then v1, so the v1 fixtures keep working until they are re-recorded.
"""
from __future__ import annotations

import hashlib
import json
import sqlite3
import threading
import time
from dataclasses import dataclass
from datetime import date
from pathlib import Path


def cache_key(image_sha: str, feature: str, params: dict) -> str:
    canonical = json.dumps(params, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(f"{image_sha}|{feature}|{canonical}".encode()).hexdigest()[:40]


KEY_V2_PREFIX = "k2"


def cache_key_v2(image_sha: str, endpoint: str, endpoint_version: str, params: dict,
                 ref_shas: dict[str, str] | None = None, pipeline_version: str = "") -> str:
    """See the module docstring. Every part is required to be a plain JSON value."""
    if not image_sha or not endpoint or not endpoint_version or not pipeline_version:
        raise ValueError("cache key v2 needs an image hash, endpoint, endpoint version and pipeline version")
    body = {
        "v": 2,
        "image": image_sha,
        "endpoint": endpoint,
        "endpoint_version": endpoint_version,
        "params": params,
        "refs": dict(sorted((ref_shas or {}).items())),
        "pipeline": pipeline_version,
    }
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    return KEY_V2_PREFIX + hashlib.sha256(canonical.encode()).hexdigest()[:46]


def legacy_key(image_sha: str, feature: str, params: dict, ref_shas: dict[str, str] | None = None) -> str:
    """The v1 key exactly as Plumb's gateway built it, reference hashes folded into params."""
    return cache_key(image_sha, feature, {**params, **{f"_{k}": v for k, v in (ref_shas or {}).items()}})


def key_version(key: str) -> int:
    return 2 if key.startswith(KEY_V2_PREFIX) and len(key) == 48 else 1


@dataclass
class CachedResult:
    feature: str
    image_sha: str
    data: dict
    units: int = 0
    image: bytes | None = None
    image_type: str | None = None
    created: float = 0.0
    source: str = "live"  # "live", "cache" or "demo"
    endpoint: str | None = None   # fixture meta v2: the YouCam task that made a recorded result
    status: str | None = None     # fixture meta v2: "active" only


_EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


class ResultCache:
    def __init__(self, data_dir: Path, fixtures_dir: Path | None = None, ttl_s: int | None = 86_400):
        self.data_dir = Path(data_dir)
        self.blob_dir = self.data_dir / "blobs"
        self.blob_dir.mkdir(parents=True, exist_ok=True)
        self.fixtures_dir = Path(fixtures_dir) if fixtures_dir else None
        self.ttl_s = ttl_s
        self._lock = threading.Lock()
        self._db = sqlite3.connect(self.data_dir / "cache.sqlite3", check_same_thread=False)
        self._db.executescript(
            """
            CREATE TABLE IF NOT EXISTS results(
              key TEXT PRIMARY KEY, feature TEXT, image_sha TEXT, data TEXT,
              units INTEGER, blob TEXT, image_type TEXT, created REAL);
            CREATE INDEX IF NOT EXISTS results_sha ON results(image_sha);
            CREATE TABLE IF NOT EXISTS spend(day TEXT PRIMARY KEY, units INTEGER);
            """
        )

    # results ---------------------------------------------------------------
    def get(self, key: str, now: float | None = None) -> CachedResult | None:
        now = time.time() if now is None else now
        with self._lock:
            row = self._db.execute(
                "SELECT feature,image_sha,data,units,blob,image_type,created FROM results WHERE key=?",
                (key,),
            ).fetchone()
        if row:
            feature, sha, data, units, blob, image_type, created = row
            if self.ttl_s is None or now - created <= self.ttl_s:
                image = (self.blob_dir / blob).read_bytes() if blob and (self.blob_dir / blob).exists() else None
                return CachedResult(feature, sha, json.loads(data), units, image, image_type, created, "cache")
            self._delete_keys([key])
        return self.get_fixture(key)

    def get_first(self, keys: list[str], now: float | None = None) -> tuple[str, CachedResult] | None:
        """The first key that has a result, and that result. Used for v2-then-v1 lookups."""
        for key in keys:
            hit = self.get(key, now)
            if hit:
                return key, hit
        return None

    def get_fixture(self, key: str) -> CachedResult | None:
        if not self.fixtures_dir:
            return None
        meta_path = self.fixtures_dir / f"{key}.json"
        if not meta_path.exists():
            return None
        meta = json.loads(meta_path.read_text())
        from ..demo.fixture_meta import problems
        if problems(meta):
            return None
        image = None
        if meta.get("image_file"):
            img_path = self.fixtures_dir / meta["image_file"]
            image = img_path.read_bytes() if img_path.exists() else None
        return CachedResult(
            meta["feature"], meta["image_sha"], meta["data"], meta.get("units", 0),
            image, meta.get("image_type"), meta.get("created", 0.0), "demo",
            meta.get("endpoint"), meta.get("status"),
        )

    def put(self, key: str, result: CachedResult) -> None:
        blob = None
        if result.image is not None:
            blob = f"{key}.{_EXT.get(result.image_type or '', 'bin')}"
            (self.blob_dir / blob).write_bytes(result.image)
        with self._lock:
            self._db.execute(
                "INSERT OR REPLACE INTO results VALUES(?,?,?,?,?,?,?,?)",
                (key, result.feature, result.image_sha, json.dumps(result.data), result.units,
                 blob, result.image_type, result.created or time.time()),
            )
            self._db.commit()

    def write_fixture(self, key: str, result: CachedResult) -> Path:
        """Record an approved styling result with one physical blob per distinct image."""
        assert self.fixtures_dir is not None
        self.fixtures_dir.mkdir(parents=True, exist_ok=True)
        from ..demo.fixture_meta import migrate  # local import: demo depends on youcam, not the reverse

        meta = migrate({"feature": result.feature, "image_sha": result.image_sha, "units": result.units,
                        "data": result.data, "image_type": result.image_type, "created": result.created})
        if result.image is not None:
            digest = hashlib.sha256(result.image).hexdigest()
            name = f"{digest}.{_EXT.get(result.image_type or '', 'bin')}"
            (self.fixtures_dir / name).write_bytes(result.image)
            meta["image_file"] = name
        path = self.fixtures_dir / f"{key}.json"
        path.write_text(json.dumps(meta, indent=1, sort_keys=True))
        return path

    def keys_for(self, image_sha: str) -> list[str]:
        with self._lock:
            return [r[0] for r in self._db.execute("SELECT key FROM results WHERE image_sha=?", (image_sha,))]

    def purge_image(self, image_sha: str) -> int:
        with self._lock:
            keys = [r[0] for r in self._db.execute("SELECT key FROM results WHERE image_sha=?", (image_sha,))]
        self._delete_keys(keys)
        return len(keys)

    def purge_expired(self, now: float | None = None) -> int:
        if self.ttl_s is None:
            return 0
        now = time.time() if now is None else now
        with self._lock:
            keys = [r[0] for r in self._db.execute("SELECT key FROM results WHERE created < ?", (now - self.ttl_s,))]
        self._delete_keys(keys)
        return len(keys)

    def _delete_keys(self, keys: list[str]) -> None:
        if not keys:
            return
        with self._lock:
            for key in keys:
                row = self._db.execute("SELECT blob FROM results WHERE key=?", (key,)).fetchone()
                if row and row[0]:
                    (self.blob_dir / row[0]).unlink(missing_ok=True)
                self._db.execute("DELETE FROM results WHERE key=?", (key,))
            self._db.commit()

    # unit ledger -----------------------------------------------------------
    def record_spend(self, units: int, day: date | None = None) -> None:
        d = (day or date.today()).isoformat()
        with self._lock:
            self._db.execute(
                "INSERT INTO spend VALUES(?,?) ON CONFLICT(day) DO UPDATE SET units = units + excluded.units",
                (d, units),
            )
            self._db.commit()

    def spent_on(self, day: date | None = None) -> int:
        d = (day or date.today()).isoformat()
        with self._lock:
            row = self._db.execute("SELECT units FROM spend WHERE day=?", (d,)).fetchone()
        return int(row[0]) if row else 0

    def spent_total(self) -> int:
        with self._lock:
            row = self._db.execute("SELECT COALESCE(SUM(units),0) FROM spend").fetchone()
        return int(row[0])
