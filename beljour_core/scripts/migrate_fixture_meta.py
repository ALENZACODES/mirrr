"""Write fixture meta version 2 (explicit endpoint, version, provider, status) into every
committed demo fixture. Run from the api/ folder:

    python scripts/migrate_fixture_meta.py            # rewrite fixtures in place
    python scripts/migrate_fixture_meta.py --check    # list fixtures that need it, exit 1

Author: John Khan.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from plumb_api.demo.fixture_meta import migrate, problems  # noqa: E402

FIXTURES = Path(__file__).resolve().parent.parent / "plumb_api" / "demo" / "fixtures"


def run(directory: Path, check: bool) -> int:
    stale = []
    for path in sorted(directory.glob("*.json")):
        meta = json.loads(path.read_text())
        issues = problems(meta)
        if not issues:
            continue
        stale.append((path.name, issues))
        if not check:
            try:
                migrated = migrate(meta)
            except ValueError:
                print(f"REFUSED  {path.name}: remove the retired fixture instead")
                return 1
            path.write_text(json.dumps(migrated, indent=1, sort_keys=True))
    for name, issues in stale:
        print(f"{'STALE' if check else 'fixed'}  {name}: {issues[0]}")
    print(f"fixture meta: {len(stale)} of {len(list(directory.glob('*.json')))} "
          f"{'need migrating' if check else 'migrated'}")
    return 1 if check and stale else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dir", type=Path, default=FIXTURES)
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    return run(args.dir, args.check)


if __name__ == "__main__":
    sys.exit(main())
