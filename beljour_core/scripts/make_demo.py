"""Build the demo fixtures that let judges use the app without spending units.

  python scripts/make_demo.py --synthetic
      Illustrated sample face and clearly labelled made up results. Free.

  YOUCAM_API_KEY=... python scripts/make_demo.py --photo my_selfie.jpg --yes
      Runs the demo plan once against the real API on a photo you have the rights to,
      then saves approved makeup results as fixtures. Prints the unit estimate first.
      --yes confirms an adult photo, your rights, and the displayed unit spend.

Run from the api/ folder. Author: John Khan.
"""
from __future__ import annotations

import argparse
import os
import secrets
import shutil
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
os.environ["PLUMB_NO_AUTOCREATE"] = "1"

from fastapi.testclient import TestClient  # noqa: E402

from plumb_api.config import Settings  # noqa: E402
from plumb_api.demo.plan import estimated_units, run_plan  # noqa: E402
from plumb_api.demo.synthetic import SyntheticYouCam, draw_sample_face  # noqa: E402
from plumb_api.main import create_app  # noqa: E402
from plumb_api.services.photos import normalise  # noqa: E402
from plumb_api.sessions import hash_code  # noqa: E402

FIXTURES = Path(__file__).resolve().parent.parent / "plumb_api" / "demo" / "fixtures"


def main() -> int:
    ap = argparse.ArgumentParser()
    mode = ap.add_mutually_exclusive_group(required=True)
    mode.add_argument("--synthetic", action="store_true")
    mode.add_argument("--photo", type=Path)
    ap.add_argument("--yes", action="store_true", help="confirm adult photo, image rights and spending units in live mode")
    ap.add_argument("--out", type=Path, default=FIXTURES)
    args = ap.parse_args()

    if args.synthetic:
        sample, key, client = normalise(draw_sample_face())[0], "synthetic", SyntheticYouCam()
    else:
        key = os.environ.get("YOUCAM_API_KEY", "")
        if not key:
            print("Set YOUCAM_API_KEY first.")
            return 2
        print(f"This records the demo on {args.photo} and spends about {estimated_units()} units.")
        if not args.yes:
            print("Add --yes to go ahead.")
            return 1
        sample, client = normalise(args.photo.read_bytes())[0], None

    out: Path = args.out
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    (out / "sample.jpg").write_bytes(sample)

    with tempfile.TemporaryDirectory() as tmp:
        empty = Path(tmp) / "no_fixtures"
        # Use the existing judge allowance through its normal verification route;
        # do not disable session limits to record seven examples.
        recording_code = secrets.token_urlsafe(24)
        settings = Settings(youcam_api_key=key, data_dir=Path(tmp) / "data", fixtures_dir=empty,
                            daily_unit_cap=10_000, unit_reserve=0 if args.synthetic else 50,
                            judge_code_hashes=(hash_code(recording_code),))
        app = create_app(settings, client=client)
        state = app.state.plumb
        # register the sample under the same hash the server will compute at startup
        import hashlib
        sha = hashlib.sha256(sample).hexdigest()
        (state.photos.root / f"{sha}.jpg").write_bytes(sample)
        state.sample_sha = sha  # This explicitly selected demonstration sample is public.
        with TestClient(app, headers={"X-Beljour-Session": "demoRecorderPrivateR14"}) as tc:
            approved = tc.post("/api/session/judge", json={"code": recording_code})
            if approved.status_code != 200:
                raise RuntimeError("The demo recorder could not obtain its judge allowance.")
            def post(path: str, body: dict) -> dict:
                r = tc.post(path, json=body)
                return r.json()
            summary = run_plan(post, sha)
        state.cache.fixtures_dir = out
        keys = state.cache.keys_for(sha)
        for k in keys:
            res = state.cache.get(k)
            if res is not None:
                state.cache.write_fixture(k, res)
        print(f"Saved {len(keys)} fixtures to {out} ({sum(summary.values())} requests).")
        print(f"Units recorded as spent: {state.cache.spent_total()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
