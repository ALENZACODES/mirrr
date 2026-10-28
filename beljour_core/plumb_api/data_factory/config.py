"""Pipeline config (beljour-data-config/1) and the hashes that pin it.

The config is one JSON file. Paths inside it are relative to the file's own
folder and must stay local: URLs are refused because the data factory never
uses the network. Each stage hashes only the settings that change its
output, and the filter config hash covers every setting that changes which
images end up in the set. Folder locations are not hashed, so a set can be
rebuilt in another place with the same lock.
Author: John Khan.
"""

from __future__ import annotations

import json
from collections.abc import Mapping
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .dedup import NearDupConfig
from .hashing import hash_json, sha256_file
from .imaging import DecodeLimits
from .licence import LicenceFilter, build_filter
from .quality_score import QualityConfig
from .slices import SliceSpec
from .takedown import TakedownRegistry

CONFIG_SCHEMA = "beljour-data-config/1"
ON_LEAK = ("fail", "drop")
TOP_KEYS = frozenset({
    "schema", "set_name", "intake", "image_root", "work_dir", "output_dir", "licence",
    "limits", "strip_metadata", "export_images", "quality", "near_dedup", "balance",
    "manifest", "holdout", "workers", "takedowns",
})
LICENCE_KEYS = frozenset({"policy_path", "extra_allowed", "denylist_path", "require_consent",
                          "use_builtin_denylist"})


class ConfigError(ValueError):
    """The pipeline config is invalid."""


@dataclass(frozen=True)
class LicenceOptions:
    """How the licence filter is built."""

    policy_path: Path | None = None
    extra_allowed: tuple[str, ...] = ()
    denylist_path: Path | None = None
    require_consent: bool = True
    use_builtin_denylist: bool = True

    def build(self) -> LicenceFilter:
        """Read the policy and deny-list files and return the filter."""
        return build_filter(policy_path=self.policy_path, extra_allowed=self.extra_allowed,
                            denylist_path=self.denylist_path,
                            require_consent=self.require_consent,
                            use_builtin_denylist=self.use_builtin_denylist)


@dataclass(frozen=True)
class PipelineConfig:
    """Everything one pipeline run needs."""

    base_dir: Path
    set_name: str
    intake: Path
    image_root: Path
    work_dir: Path
    output_dir: Path
    licence: LicenceOptions = field(default_factory=LicenceOptions)
    limits: DecodeLimits = field(default_factory=DecodeLimits)
    strip_metadata: bool = True
    export_images: bool = True
    quality: QualityConfig = field(default_factory=QualityConfig)
    near_dedup: NearDupConfig = field(default_factory=NearDupConfig)
    balance: SliceSpec | None = None
    shards: int = 16
    compress: bool = False
    holdout_paths: tuple[Path, ...] = ()
    on_leak: str = "fail"
    holdout_near: bool = True
    workers: int = 1
    takedown_path: Path | None = None

    def takedown_hashes(self) -> frozenset[str]:
        """Hashes in the takedown registry, empty when none is configured."""
        if self.takedown_path is None:
            return frozenset()
        return TakedownRegistry(self.takedown_path).hashes()

    def holdout_fingerprint(self) -> list[str]:
        """Hashes of every frozen lock the guard will read, sorted."""
        hashes: list[str] = []
        for path in self.holdout_paths:
            locks = sorted(path.rglob("frozen.lock")) if path.is_dir() else [path]
            hashes.extend(sha256_file(lock) for lock in locks if lock.is_file())
        return sorted(hashes)

    def stage_settings(self, licence_filter: LicenceFilter) -> dict[str, Any]:
        """Settings per stage; a stage reruns when its settings change."""
        return {
            "ingest": {"limits": self.limits.to_dict()},
            "licence": licence_filter.fingerprint(),
            "exact_dedup": {},
            "quality": {"quality": self.quality.to_dict(), "limits": self.limits.to_dict(),
                        "strip_metadata": self.strip_metadata},
            "near_dedup": self.near_dedup.to_dict(),
            "holdout": {"locks": self.holdout_fingerprint(), "on_leak": self.on_leak,
                        "takedowns": sorted(self.takedown_hashes()),
                        "near": self.near_dedup.to_dict() if self.holdout_near else None},
            "balance": None if self.balance is None else self.balance.to_dict(),
            "manifest": {"shards": self.shards, "compress": self.compress,
                         "export_images": self.export_images, "set_name": self.set_name},
        }

    def filter_config_sha256(self, licence_filter: LicenceFilter) -> str:
        """Hash of every setting that changes which images are in the set."""
        return hash_json(self.stage_settings(licence_filter))


def _local_path(base: Path, value: Any, key: str) -> Path:
    if not isinstance(value, str) or not value.strip():
        raise ConfigError(f"{key} must be a path")
    if "://" in value:
        raise ConfigError(f"{key} must be a local path; network locations are not used")
    path = Path(value)
    return path if path.is_absolute() else (base / path)


def _bool(raw: Mapping[str, Any], key: str, default: bool) -> bool:
    value = raw.get(key, default)
    if not isinstance(value, bool):
        raise ConfigError(f"{key} must be true or false")
    return value


def _licence(base: Path, raw: Any) -> LicenceOptions:
    if raw is None:
        return LicenceOptions()
    if not isinstance(raw, dict):
        raise ConfigError("licence must be an object")
    unknown = sorted(set(raw) - LICENCE_KEYS)
    if unknown:
        raise ConfigError("unknown licence keys: " + ", ".join(unknown))
    extra = raw.get("extra_allowed", [])
    if not isinstance(extra, list) or not all(isinstance(item, str) for item in extra):
        raise ConfigError("licence.extra_allowed must be a list of licence ids")
    policy = raw.get("policy_path")
    deny = raw.get("denylist_path")
    return LicenceOptions(
        policy_path=None if policy is None else _local_path(base, policy, "licence.policy_path"),
        extra_allowed=tuple(extra),
        denylist_path=None if deny is None else _local_path(base, deny, "licence.denylist_path"),
        require_consent=_bool(raw, "require_consent", True),
        use_builtin_denylist=_bool(raw, "use_builtin_denylist", True),
    )


def _limits(raw: Any) -> DecodeLimits:
    if raw is None:
        return DecodeLimits()
    if not isinstance(raw, dict):
        raise ConfigError("limits must be an object")
    allowed = set(DecodeLimits.__dataclass_fields__)
    unknown = sorted(set(raw) - allowed)
    if unknown:
        raise ConfigError("unknown limits keys: " + ", ".join(unknown))
    values = {key: int(value) for key, value in raw.items()}
    if any(value < 1 for value in values.values()):
        raise ConfigError("limits must be positive")
    return DecodeLimits(**values)


def _manifest(raw: Any) -> tuple[int, bool]:
    if raw is None:
        return 16, False
    if not isinstance(raw, dict) or set(raw) - {"shards", "gzip"}:
        raise ConfigError("manifest takes only shards and gzip")
    shards = raw.get("shards", 16)
    if not isinstance(shards, int) or isinstance(shards, bool) or not 1 <= shards <= 4096:
        raise ConfigError("manifest.shards must be an integer from 1 to 4096")
    return shards, _bool(raw, "gzip", False)


def _holdout(base: Path, raw: Any) -> tuple[tuple[Path, ...], str, bool]:
    if raw is None:
        return (), "fail", True
    if not isinstance(raw, dict) or set(raw) - {"locks", "on_leak", "near"}:
        raise ConfigError("holdout takes only locks, on_leak and near")
    locks = raw.get("locks", [])
    if not isinstance(locks, list):
        raise ConfigError("holdout.locks must be a list of paths")
    on_leak = raw.get("on_leak", "fail")
    if on_leak not in ON_LEAK:
        raise ConfigError("holdout.on_leak must be fail or drop")
    paths = tuple(_local_path(base, value, "holdout.locks") for value in locks)
    return paths, str(on_leak), _bool(raw, "near", True)


def _nested(raw: Any, key: str) -> dict[str, Any]:
    if raw is None:
        return {}
    if not isinstance(raw, dict):
        raise ConfigError(f"{key} must be an object")
    return raw


def parse_config(raw: Any, base_dir: Path) -> PipelineConfig:
    """Validate a config object; relative paths resolve against base_dir."""
    if not isinstance(raw, dict):
        raise ConfigError("config must be a JSON object")
    if raw.get("schema") != CONFIG_SCHEMA:
        raise ConfigError(f"config schema must be {CONFIG_SCHEMA}")
    unknown = sorted(set(raw) - TOP_KEYS)
    if unknown:
        raise ConfigError("unknown config keys: " + ", ".join(unknown))
    name = raw.get("set_name")
    if not isinstance(name, str) or not name or not name.replace("-", "").replace(
            "_", "").isalnum():
        raise ConfigError("set_name must use letters, digits, - and _ only")
    workers = raw.get("workers", 1)
    if not isinstance(workers, int) or isinstance(workers, bool) or not 1 <= workers <= 64:
        raise ConfigError("workers must be an integer from 1 to 64")
    shards, compress = _manifest(raw.get("manifest"))
    holdout_paths, on_leak, holdout_near = _holdout(base_dir, raw.get("holdout"))
    try:
        quality = QualityConfig.from_dict(_nested(raw.get("quality"), "quality"))
        near = NearDupConfig(**_nested(raw.get("near_dedup"), "near_dedup"))
        balance_raw = raw.get("balance")
        balance = None if balance_raw is None else SliceSpec.from_dict(
            _nested(balance_raw, "balance"))
    except (TypeError, ValueError) as exc:
        raise ConfigError(str(exc)) from exc
    return PipelineConfig(
        base_dir=base_dir,
        set_name=name,
        intake=_local_path(base_dir, raw.get("intake"), "intake"),
        image_root=_local_path(base_dir, raw.get("image_root"), "image_root"),
        work_dir=_local_path(base_dir, raw.get("work_dir", "work"), "work_dir"),
        output_dir=_local_path(base_dir, raw.get("output_dir", "out"), "output_dir"),
        licence=_licence(base_dir, raw.get("licence")),
        limits=_limits(raw.get("limits")),
        strip_metadata=_bool(raw, "strip_metadata", True),
        export_images=_bool(raw, "export_images", True),
        quality=quality,
        near_dedup=near,
        balance=balance,
        shards=shards,
        compress=compress,
        holdout_paths=holdout_paths,
        on_leak=on_leak,
        holdout_near=holdout_near,
        workers=workers,
        takedown_path=None if raw.get("takedowns") is None else _local_path(
            base_dir, raw.get("takedowns"), "takedowns"),
    )


def load_config(path: Path) -> PipelineConfig:
    """Read and validate a config file."""
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise ConfigError(f"config unreadable: {path}") from exc
    return parse_config(raw, path.resolve().parent)
