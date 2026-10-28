"""Kaggle kernel folders: private, prefixed, offline except for S05.

Only files are written; nothing is pushed or run.
Author: John Khan.
"""

from __future__ import annotations

import ast
import json
from pathlib import Path

import pytest

from lab.facescale import kaggle_gen as KG
from lab.facescale.loaders import loader_for
from lab.facescale.registry import load_local
from lab.facescale.shards import build_plan, read_header, save_plan, scan
from lab.facescale.synthetic import all_layouts, sources_file

OPTIONS = KG.KaggleOptions(owner="box-owner", code_slug="box-owner/beljour-code",
                           plan_slug="box-owner/beljour-plan", shards_per_kernel=2)


@pytest.fixture()
def generated(tmp_path: Path) -> list[Path]:
    local = load_local(sources_file(tmp_path / "s.json", all_layouts(tmp_path / "sets")))
    plan = build_plan(scan([loader_for(e) for e in local.values()]), shard_size=3)
    save_plan(plan, tmp_path / "plan")
    return KG.write_kernels(tmp_path / "kernels", read_header(tmp_path / "plan"), local, OPTIONS)


def test_every_kernel_is_private_and_prefixed(generated: list[Path]) -> None:
    assert len(generated) == 5
    for folder in generated:
        meta = json.loads((folder / "kernel-metadata.json").read_text())
        assert meta["id"].startswith("box-owner/beljour-facescale-s")
        assert folder.name == meta["id"].split("/")[1]
        assert meta["is_private"] is True
        assert meta["enable_gpu"] is False and meta["enable_tpu"] is False
        assert "box-owner/beljour-code" in meta["dataset_sources"]
        assert "box-owner/beljour-plan" in meta["dataset_sources"]
        assert meta["code_file"] == "run_kernel.py"


def test_internet_only_for_generated_source(generated: list[Path]) -> None:
    for folder in generated:
        meta = json.loads((folder / "kernel-metadata.json").read_text())
        script = (folder / "run_kernel.py").read_text()
        uses_s05 = '"S05"' in script
        assert meta["enable_internet"] is uses_s05
        assert KG.network_tokens(script) == []


def test_script_is_valid_python_with_thread_caps_and_deadline(generated: list[Path]) -> None:
    script = (generated[0] / "run_kernel.py").read_text()
    ast.parse(script)
    for name in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS"):
        assert name in script
    assert '"stop_margin_s": 420' in script and '"time_cap_hours": 12.0' in script
    assert "--checkpoint-seconds\", \"900\"" in script
    assert "/kaggle/working" in script and "Author: John Khan." in script


def test_tpu_flag_and_option_checks() -> None:
    meta = KG.metadata(KG.KaggleOptions("o-wner", "o-wner/c-c", "o-wner/p-p", tpu=True),
                       [0], [], {})
    assert meta["enable_tpu"] is True and meta["id"] == "o-wner/beljour-facescale-s000"
    for bad in (KG.KaggleOptions("Bad Owner", "a/b", "a/c"),
                KG.KaggleOptions("owner", "noslash", "owner/p"),
                KG.KaggleOptions("owner", "owner/c", "owner/p", workers=0),
                KG.KaggleOptions("owner", "owner/c", "owner/p", time_cap_hours=13)):
        with pytest.raises(KG.KaggleGenError):
            bad.check()


def test_blocks_cover_every_shard_once() -> None:
    assert KG.blocks(7, 3) == [[0, 1, 2], [3, 4, 5], [6]]
    assert KG.kernel_slug(12) == "beljour-facescale-s012"


def test_source_without_slug_is_refused(tmp_path: Path) -> None:
    from lab.facescale.registry import SourceError

    (tmp_path / "r").mkdir()
    local = load_local(sources_file(tmp_path / "s.json", {"S04": {"root": str(tmp_path / "r")}}))
    with pytest.raises(SourceError, match="kaggle_slug"):
        KG.kernel_sources_file(local, ["S04"])
