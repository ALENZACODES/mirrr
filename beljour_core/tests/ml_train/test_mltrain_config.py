"""Config system: JSON/TOML loading, overrides, validation messages, stable hash.

Includes a small seeded fuzz pass that mutates random fields to wrong types and
checks every failure is a ConfigError naming the field. Author: John Khan.
"""

from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Any

import pytest

from lab.ml.train import config as C


def test_defaults_are_valid_and_round_trip(tmp_path: Path) -> None:
    default = C.ExperimentConfig()
    assert C.from_dict(C.to_dict(default)) == default
    path = tmp_path / "cfg.json"
    C.save(default, path)
    assert C.load(path) == default


def test_toml_loading(tmp_path: Path) -> None:
    path = tmp_path / "cfg.toml"
    path.write_text(
        'name = "denoise-small"\n'
        "[model]\nkind = \"encoder_decoder\"\nwidth = 4\n"
        "[data]\ntask = \"denoise\"\nsamples = 64\naugment = [\"flip\", \"noise\"]\n"
        "[optim]\nname = \"adamw\"\nlr = 0.002\nclip_norm = 1.0\n"
    )
    cfg = C.load(path)
    assert cfg.name == "denoise-small"
    assert cfg.model.width == 4 and cfg.data.augment == ["flip", "noise"]
    assert cfg.optim.lr == 0.002 and cfg.optim.clip_norm == 1.0
    assert cfg.train.epochs == 5


def test_integer_is_accepted_for_float_fields() -> None:
    cfg = C.from_dict({"optim": {"lr": 1}})
    assert isinstance(cfg.optim.lr, float) and cfg.optim.lr == 1.0


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ({"optim": {"lr": "fast"}}, "optim.lr: expected a number, got 'fast'"),
        ({"optim": {"lr": -1}}, "optim.lr: must be positive, got -1.0"),
        ({"optim": {"lrr": 0.1}}, "optim.lrr: unknown field (did you mean 'lr'?)"),
        ({"train": {"epochs": 2.5}}, "train.epochs: expected an integer, got 2.5"),
        ({"train": {"epochs": True}}, "train.epochs: expected an integer, got True"),
        ({"model": {"residual": "yes"}}, "model.residual: expected true or false, got 'yes'"),
        ({"model": {"hidden": 32}}, "model.hidden: expected a list, got int"),
        ({"model": {"hidden": [8, "x"]}}, "model.hidden[1]: expected an integer, got 'x'"),
        ({"data": "big"}, "data: expected a table/object, got str"),
        ({"name": 5}, "name: expected a string, got 5"),
        ({"data": {"image_size": 30}}, "data.image_size: must be a multiple of 4"),
        ({"model": {"kind": "mlp"}, "data": {"task": "denoise"}},
         "model.kind: the denoise task needs 'encoder_decoder'"),
        ({"train": {"dtype": "float16"}}, "train.dtype: 'float16' is not one of"),
        ({"lora": {"enabled": True, "rank": 0}}, "lora.rank: must be at least 1"),
    ],
)
def test_validation_names_field_and_reason(raw: dict[str, Any], expected: str) -> None:
    with pytest.raises(C.ConfigError) as info:
        C.from_dict(raw)
    assert any(p.startswith(expected) for p in info.value.problems), info.value.problems


def test_all_problems_are_reported_together() -> None:
    with pytest.raises(C.ConfigError) as info:
        C.from_dict({"optim": {"lr": 0, "grad_accum": 0}, "data": {"batch_size": 0}})
    text = str(info.value)
    assert "optim.lr" in text and "optim.grad_accum" in text and "data.batch_size" in text


def test_overrides() -> None:
    base = C.to_dict(C.ExperimentConfig())
    raw = C.apply_overrides(base, ["optim.name=sgd", "optim.lr=0.05", "train.max_steps=7",
                                   "optim.clip_norm=none", "model.hidden=[4, 4]",
                                   "optim.nesterov=true", "notes=hello world"])
    cfg = C.from_dict(raw)
    assert cfg.optim.name == "sgd" and cfg.optim.lr == 0.05 and cfg.train.max_steps == 7
    assert cfg.optim.clip_norm is None and cfg.model.hidden == [4, 4]
    assert cfg.optim.nesterov is True and cfg.notes == "hello world"
    assert base["optim"]["name"] == "adam", "overrides must not mutate the input"


def test_override_errors() -> None:
    with pytest.raises(C.ConfigError, match="section.field=value"):
        C.apply_overrides({}, ["optim.lr"])
    with pytest.raises(C.ConfigError, match="is not a section"):
        C.apply_overrides({"name": "x"}, ["name.part=1"])
    with pytest.raises(C.ConfigError, match="unknown field"):
        C.resolve(None, ["optim.speed=3"])


def test_resolve_file_then_overrides(tmp_path: Path) -> None:
    path = tmp_path / "cfg.json"
    path.write_text(json.dumps({"name": "base", "train": {"epochs": 3}}))
    cfg = C.resolve(path, ["train.epochs=9"])
    assert cfg.name == "base" and cfg.train.epochs == 9


def test_file_errors(tmp_path: Path) -> None:
    bad = tmp_path / "cfg.yaml"
    bad.write_text("name: x")
    with pytest.raises(C.ConfigError, match="json or .toml"):
        C.load(bad)
    broken = tmp_path / "cfg.json"
    broken.write_text("{nope")
    with pytest.raises(C.ConfigError, match="cannot parse"):
        C.load(broken)
    listed = tmp_path / "list.json"
    listed.write_text("[1, 2]")
    with pytest.raises(C.ConfigError, match="top level"):
        C.load(listed)
    broken_toml = tmp_path / "cfg.toml"
    broken_toml.write_text("name = ")
    with pytest.raises(C.ConfigError, match="cannot parse"):
        C.load(broken_toml)


def test_hash_is_stable_and_sensitive(tmp_path: Path) -> None:
    a = C.from_dict({"name": "x", "optim": {"lr": 0.01}})
    b = C.from_dict({"optim": {"lr": 0.01}, "name": "x"})
    assert C.config_hash(a) == C.config_hash(b)
    assert len(C.config_hash(a)) == 16
    c = C.from_dict({"name": "x", "optim": {"lr": 0.02}})
    assert C.config_hash(a) != C.config_hash(c)
    assert C.config_hash(C.ExperimentConfig()) == C.config_hash(C.ExperimentConfig())


WRONG_VALUES: list[Any] = ["text", -3, 2.5, True, None, [1], {"a": 1}]


def test_fuzzed_configs_fail_cleanly() -> None:
    rng = random.Random(7)
    base = C.to_dict(C.ExperimentConfig())
    sections = [k for k, v in base.items() if isinstance(v, dict)]
    failures = 0
    for _ in range(300):
        raw = json.loads(json.dumps(base))
        section = rng.choice(sections)
        key = rng.choice(sorted(raw[section]))
        raw[section][key] = rng.choice(WRONG_VALUES)
        try:
            C.from_dict(raw)
        except C.ConfigError as exc:
            failures += 1
            assert all(p.split(":")[0].split(".")[0] in base or p.startswith("model.kind")
                       for p in exc.problems), exc.problems
            assert any(f"{section}.{key}" in p for p in exc.problems), (section, key, exc)
    assert failures > 150
