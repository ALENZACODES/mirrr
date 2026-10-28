"""Edge cases: odd image formats, an all-broken shard, extended-plan resume.

Author: John Khan.
"""

from __future__ import annotations

import io
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from lab.facescale import checkers as C
from lab.facescale import decode as D
from lab.facescale import pool as PL
from lab.facescale import runner as RN
from lab.facescale.loaders import loader_for
from lab.facescale.registry import LocalSource, load_local
from lab.facescale.resume import read_json, shard_name
from lab.facescale.shards import build_plan, load_plan, save_plan, scan
from lab.facescale.synthetic import make_flat, sources_file, write_image


def _bytes(image: Image.Image, fmt: str, **kw: object) -> bytes:
    out = io.BytesIO()
    image.save(out, format=fmt, **kw)
    return out.getvalue()


def test_webp_gif_and_bmp_decode() -> None:
    rgb = Image.fromarray(np.random.default_rng(1).integers(0, 255, (90, 300, 3), np.uint8))
    for fmt in ("WEBP", "BMP", "PNG"):
        out = D.decode(_bytes(rgb, fmt), 128)
        assert out.rgb.shape == (38, 128, 3), fmt
    gif = rgb.convert("P")
    gif.info["transparency"] = 0
    assert D.decode(_bytes(gif, "GIF", transparency=0), 128).rgb.shape[2] == 3


def test_truncated_png_is_an_open_failure() -> None:
    data = _bytes(Image.new("RGB", (200, 200), (9, 9, 9)), "PNG")
    with pytest.raises(D.DecodeFailure) as info:
        D.decode(data[: len(data) // 2], 128)
    assert info.value.code == "open_corrupt"


def test_one_bit_image_becomes_rgb() -> None:
    data = _bytes(Image.new("1", (40, 40), 1), "PNG")
    out = D.decode(data, 128).rgb
    assert out.shape == (40, 40, 3) and int(out.max()) == 255


def _plan(tmp_path: Path, broken: int, good: int) -> tuple[Path, dict[str, LocalSource]]:
    root = tmp_path / "flat"
    make_flat(root, good)
    for n in range(broken):
        (root / f"broken{n}.png").write_bytes(b"\x89PNG\r\n\x1a\n" + bytes([n]) * 30)
    local = load_local(sources_file(tmp_path / "s.json", {"S04": {"root": str(root)}}))
    plan = build_plan(scan([loader_for(local["S04"])]), shard_size=100)
    save_plan(plan, tmp_path / "plan")
    return tmp_path / "plan", dict(local)


def test_shard_of_broken_files_finishes_with_counted_failures(tmp_path: Path) -> None:
    plan_dir, local = _plan(tmp_path, broken=5, good=2)
    config = RN.ShardConfig(plan_dir, 0, tmp_path / "out", local,
                            C.fake_spec(), "scale", 128, PL.plan_workers(2, 2**33, 2**20, 1))
    outcome = RN.run_shard(config)
    assert outcome.status == "done" and outcome.items_done == 7
    data = read_json(tmp_path / "out" / shard_name(0))
    assert data["open_failures"] == {"open_corrupt": 5}
    assert data["complete"] is True


def test_extended_plan_keeps_old_results_done(tmp_path: Path) -> None:
    plan_dir, local = _plan(tmp_path, broken=0, good=4)
    config = RN.ShardConfig(plan_dir, 0, tmp_path / "out", local,
                            C.fake_spec(), "scale", 128, PL.plan_workers(2, 2**33, 2**20, 1),
                            run_id="fs-fixed")
    assert RN.run_shard(config).status == "done"
    write_image(tmp_path / "flat" / "zz_new.png", 77_777)
    grown = build_plan(scan([loader_for(local["S04"])]), previous=load_plan(plan_dir))
    save_plan(grown, plan_dir)
    assert RN.run_shard(config).status == "already-done"
    config.index = 1
    assert RN.run_shard(config).items_done == 1
