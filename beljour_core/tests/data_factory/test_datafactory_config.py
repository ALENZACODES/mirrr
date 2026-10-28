"""Pipeline config parsing, path rules and hashing.

Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from plumb_api.data_factory.cli import starter_config
from plumb_api.data_factory.config import ConfigError, load_config, parse_config


def base() -> dict[str, Any]:
    return starter_config("intake.jsonl", "images", "set-a")


def test_starter_config_parses(tmp_path: Path) -> None:
    config = parse_config(base(), tmp_path)
    assert config.intake == tmp_path / "intake.jsonl"
    assert config.work_dir == tmp_path / "work"
    assert config.shards == 16 and not config.compress
    assert config.on_leak == "fail" and config.balance is None


def test_paths_resolve_from_config_folder(tmp_path: Path) -> None:
    path = tmp_path / "conf" / "c.json"
    path.parent.mkdir()
    raw = base()
    raw["image_root"] = str(tmp_path / "abs-images")
    path.write_text(json.dumps(raw))
    config = load_config(path)
    assert config.intake == path.parent.resolve() / "intake.jsonl"
    assert config.image_root == tmp_path / "abs-images"


@pytest.mark.parametrize(("change", "message"), [
    ({"schema": "x/1"}, "schema"),
    ({"surprise": 1}, "unknown config keys"),
    ({"set_name": "a b"}, "set_name"),
    ({"intake": "https://example.invalid/intake.jsonl"}, "local path"),
    ({"intake": ""}, "must be a path"),
    ({"workers": 0}, "workers"),
    ({"workers": True}, "workers"),
    ({"manifest": {"shards": 0}}, "shards"),
    ({"manifest": {"shards": 4, "zip": True}}, "only shards and gzip"),
    ({"manifest": {"gzip": "yes"}}, "true or false"),
    ({"holdout": {"locks": "x"}}, "list of paths"),
    ({"holdout": {"on_leak": "warn"}}, "fail or drop"),
    ({"holdout": {"locks": [], "extra": 1}}, "only locks"),
    ({"licence": {"bad": 1}}, "unknown licence keys"),
    ({"licence": {"extra_allowed": "CC-BY-4.0"}}, "extra_allowed"),
    ({"licence": []}, "licence must be an object"),
    ({"limits": {"max_side": 0}}, "positive"),
    ({"limits": {"huge": 1}}, "unknown limits"),
    ({"limits": 5}, "limits must be an object"),
    ({"quality": {"min_score": 4}}, "min_score"),
    ({"quality": []}, "quality must be an object"),
    ({"near_dedup": {"phash_threshold": 50}}, "phash_threshold"),
    ({"near_dedup": {"other": 1}}, "unexpected keyword"),
    ({"balance": {"dimensions": ["lighting"]}}, "per_cell or targets"),
    ({"strip_metadata": "no"}, "true or false"),
])
def test_bad_configs(tmp_path: Path, change: dict[str, Any], message: str) -> None:
    raw = base()
    raw.update(change)
    with pytest.raises(ConfigError, match=message):
        parse_config(raw, tmp_path)


def test_non_object_and_unreadable(tmp_path: Path) -> None:
    with pytest.raises(ConfigError):
        parse_config([1], tmp_path)
    with pytest.raises(ConfigError):
        load_config(tmp_path / "missing.json")


def test_filter_hash_tracks_settings_not_locations(tmp_path: Path) -> None:
    one = parse_config(base(), tmp_path / "one")
    two = parse_config(base(), tmp_path / "two")
    licence = one.licence.build()
    assert one.filter_config_sha256(licence) == two.filter_config_sha256(licence)
    raw = base()
    raw["quality"] = {"min_score": 0.6}
    three = parse_config(raw, tmp_path)
    assert three.filter_config_sha256(licence) != one.filter_config_sha256(licence)
    raw = base()
    raw["workers"] = 8
    assert parse_config(raw, tmp_path).filter_config_sha256(licence) == \
        one.filter_config_sha256(licence)


def test_holdout_fingerprint_reads_lock_hashes(tmp_path: Path) -> None:
    folder = tmp_path / "frozen" / "set"
    folder.mkdir(parents=True)
    (folder / "frozen.lock").write_text("{}")
    raw = base()
    raw["holdout"] = {"locks": [str(tmp_path / "frozen")], "on_leak": "drop"}
    config = parse_config(raw, tmp_path)
    assert len(config.holdout_fingerprint()) == 1
    licence = config.licence.build()
    assert config.stage_settings(licence)["holdout"]["on_leak"] == "drop"
