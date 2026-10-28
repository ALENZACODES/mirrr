"""Per-shard file lists for training loaders, checked against the lock.

Each shard of a locked set gets a plain TSV list (content hash, exported
path) in manifest order, so a loader worker can read just its shard. An
index JSON names every list with its row count and the shard hash pinned by
the lock. `verify_shard_lists` re-reads the lists and fails on a missing
list, a wrong count, or a hash that belongs to another shard.
Author: John Khan.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .hashing import is_sha256, shard_of
from .lockfile import assert_lock
from .manifest import ManifestReader

INDEX_SCHEMA = "beljour-shard-lists/1"


def _list_name(set_name: str, shard: int) -> str:
    return f"{set_name}.shard-{shard:05d}.tsv"


def write_shard_lists(lock_path: Path, out_dir: Path) -> Path:
    """Write one TSV per non-empty shard plus <set>.shards.json; return the index path."""
    lock = assert_lock(lock_path, require_tool_version=False)
    set_name = str(lock["set_name"])
    manifest = lock_path.parent / str(lock["manifest"]["file"])
    rows: dict[int, list[str]] = {}
    for row in ManifestReader(manifest):
        rows.setdefault(row.shard, []).append(f"{row.record.content_sha256}\t{row.record.path}")
    out_dir.mkdir(parents=True, exist_ok=True)
    shards: dict[str, Any] = {}
    for shard, lines in sorted(rows.items()):
        name = _list_name(set_name, shard)
        (out_dir / name).write_text("\n".join(lines) + "\n", encoding="utf-8")
        shards[str(shard)] = {"file": name, "count": len(lines),
                              "lock_shard_sha256": lock["manifest"]["shards"][str(shard)]["sha256"]}
    index = {"schema": INDEX_SCHEMA, "set_name": set_name, "lock_sha256": lock["lock_sha256"],
             "shard_count": lock["manifest"]["shard_count"], "shards": shards}
    path = out_dir / f"{set_name}.shards.json"
    path.write_text(json.dumps(index, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    return path


def verify_shard_lists(lock_path: Path, index_path: Path) -> list[str]:
    """Problems with written shard lists; empty means they match the lock."""
    lock = assert_lock(lock_path, require_tool_version=False)
    try:
        index = json.loads(index_path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return [f"{index_path.name} is unreadable"]
    if not isinstance(index, dict) or index.get("schema") != INDEX_SCHEMA:
        return [f"{index_path.name} is not a {INDEX_SCHEMA} index"]
    if index.get("lock_sha256") != lock["lock_sha256"]:
        return ["shard lists were written for another lock"]
    problems: list[str] = []
    total = int(lock["manifest"]["shard_count"])
    locked = lock["manifest"]["shards"]
    listed = index.get("shards", {})
    if set(listed) != set(locked):
        problems.append("shard lists do not cover the locked shards")
    for shard, info in sorted(listed.items(), key=lambda item: int(item[0])):
        path = index_path.parent / str(info.get("file", ""))
        if not path.is_file():
            problems.append(f"shard {shard}: list missing")
            continue
        lines = [line for line in path.read_text(encoding="utf-8").splitlines() if line]
        if shard in locked and len(lines) != int(locked[shard]["count"]):
            problems.append(f"shard {shard}: {len(lines)} rows, lock has {locked[shard]['count']}")
        for line in lines:
            digest = line.split("\t", 1)[0]
            if not is_sha256(digest) or shard_of(digest, total) != int(shard):
                problems.append(f"shard {shard}: row {digest[:12]} belongs elsewhere")
                break
    return problems
