"""Tests for the seeded-generator plan, box config and kernel writer.

Nothing here touches the network; kernels are written to temporary folders
and only their files are checked.
Author: John Khan.
"""

from __future__ import annotations

import ast
import json
import re
from pathlib import Path

import pytest

from lab.facescale_synth import policy
from lab.facescale_synth.gan import job
from lab.facescale_synth.gan.boxconfig import BOX_FORMAT, BoxConfig, load_box_config
from lab.facescale_synth.gan.kernel import (
    SCRIPT_NAME,
    job_config,
    job_script,
    kernel_metadata,
    write_kernels,
)
from lab.facescale_synth.gan.seedplan import PSI_CHOICES, SeedPlan

BOX = BoxConfig(
    weights_url="https://weights.example.invalid/net.pkl",
    weights_sha256="ab" * 32,
    code_repo="https://code.example.invalid/gen.git",
    code_commit="cd" * 20,
    kernel_prefix="beljour-gen-test-",
)


def test_plan_shards_cover_every_seed_once() -> None:
    plan = SeedPlan(master_seed=4, count=1000, shard_count=7)
    seeds: list[int] = []
    for shard in range(7):
        part = plan.shard(shard)
        assert all(p % 7 == shard for p in part.positions)
        assert len(part.seeds) == len(part.psi) == len(part)
        assert all(psi in PSI_CHOICES for psi in part.psi)
        seeds.extend(part.seeds)
    assert sorted(seeds) == sorted(int(s) for s in plan.seeds)
    assert len(set(seeds)) == 1000


def test_plan_psi_spreads_and_is_fixed() -> None:
    plan = SeedPlan(master_seed=9, count=4000, shard_count=1)
    values = [plan.psi_for(i) for i in range(4000)]
    assert set(values) == set(PSI_CHOICES)
    assert values == [SeedPlan(master_seed=9, count=4000).psi_for(i) for i in range(4000)]


def test_plan_summary_and_validation() -> None:
    summary = SeedPlan(master_seed=1, count=2_000_000, shard_count=64).summary()
    assert summary["items_per_shard_min"] == summary["items_per_shard_max"] == 31_250
    with pytest.raises(ValueError):
        SeedPlan(master_seed=1, count=0)
    with pytest.raises(ValueError):
        SeedPlan(master_seed=1, psi_choices=(2.0,))
    with pytest.raises(ValueError):
        SeedPlan(master_seed=1, count=10, shard_count=2).shard(2)


def _box_file(folder: Path, **change: str) -> Path:
    body = {
        "format": BOX_FORMAT,
        "weights_url": BOX.weights_url,
        "weights_sha256": BOX.weights_sha256,
        "code_repo": BOX.code_repo,
        "code_commit": BOX.code_commit,
        "kernel_prefix": BOX.kernel_prefix,
    }
    body.update(change)
    path = folder / "generator.box.json"
    path.write_text(json.dumps(body))
    return path


def test_box_config_loads_and_validates(tmp_path: Path) -> None:
    assert load_box_config(_box_file(tmp_path)) == BOX
    with pytest.raises(ValueError, match="https"):
        load_box_config(_box_file(tmp_path, weights_url="http://x/y"))
    with pytest.raises(ValueError, match="64"):
        load_box_config(_box_file(tmp_path, weights_sha256="abc"))
    with pytest.raises(ValueError, match="40"):
        load_box_config(_box_file(tmp_path, code_commit="main"))
    with pytest.raises(ValueError, match="kernel_prefix"):
        load_box_config(_box_file(tmp_path, kernel_prefix="other-"))
    with pytest.raises(ValueError, match="format"):
        load_box_config(_box_file(tmp_path, format="x"))


def test_box_config_inside_a_git_tree_is_refused(tmp_path: Path) -> None:
    (tmp_path / ".git").mkdir()
    with pytest.raises(policy.UsageRefused):
        load_box_config(_box_file(tmp_path))


def test_kernel_metadata_is_private_with_internet_and_no_tpu() -> None:
    meta = kernel_metadata(BOX, "box-owner", 3, gpu=False)
    assert meta["id"] == "box-owner/beljour-gen-test-003"
    assert meta["is_private"] is True
    assert meta["enable_internet"] is True
    assert meta["enable_gpu"] is False and meta["enable_tpu"] is False
    assert meta["code_file"] == SCRIPT_NAME
    assert kernel_metadata(BOX, "box-owner", 3, gpu=True)["enable_gpu"] is True
    with pytest.raises(ValueError):
        kernel_metadata(BOX, "bad owner!", 0, gpu=False)


def test_job_script_embeds_config_and_stays_valid_python() -> None:
    plan = SeedPlan(master_seed=2, count=50, shard_count=5)
    config = job_config(BOX, plan, 1)
    script = job_script(config)
    tree = ast.parse(script)
    assigned = [
        node.value.value
        for node in tree.body
        if isinstance(node, ast.Assign)
        and isinstance(node.targets[0], ast.Name)
        and node.targets[0].id == "EMBEDDED_CONFIG"
        and isinstance(node.value, ast.Constant)
    ]
    assert len(assigned) == 1
    embedded = json.loads(str(assigned[0]))
    assert embedded["seeds"] == list(plan.shard(1).seeds)
    assert embedded["weights_sha256"] == BOX.weights_sha256
    assert embedded["stamp"] == policy.stamp()
    assert embedded["source_id"] == "S05"
    assert job.load_config(str(assigned[0]))["code_commit"] == BOX.code_commit


def test_write_kernels_writes_folders_outside_the_repo(tmp_path: Path) -> None:
    plan = SeedPlan(master_seed=3, count=40, shard_count=4)
    folders = write_kernels(tmp_path / "kernels", BOX, "box-owner", plan, [0, 2], gpu=True)
    assert [f.name for f in folders] == ["beljour-gen-test-000", "beljour-gen-test-002"]
    for folder in folders:
        meta = json.loads((folder / "kernel-metadata.json").read_text())
        assert meta["enable_gpu"] is True
        assert (folder / SCRIPT_NAME).read_text().count("EMBEDDED_CONFIG = ") == 1
    with pytest.raises(FileExistsError):
        write_kernels(tmp_path / "kernels", BOX, "box-owner", plan, [0])
    with pytest.raises(policy.UsageRefused):
        write_kernels(policy.REPO_ROOT / "lab" / "kernels", BOX, "box-owner", plan, [0])


def test_no_weights_url_or_commit_is_hard_coded_in_the_package() -> None:
    package = Path(job.__file__).parent
    for path in package.glob("*.py"):
        text = path.read_text(encoding="utf-8")
        assert re.search(r"https://[A-Za-z0-9]", text) is None, path.name
        assert re.search(r"\b[0-9a-f]{40}\b", text) is None, path.name
