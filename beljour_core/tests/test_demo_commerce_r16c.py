"""Offline cassette demonstration check, no photo assets and no YouCam network.
Author: John Khan.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "demo_commerce.py"


def test_recorded_judge_path_is_offline_and_completed_within_budget():
    result = subprocess.run([sys.executable, str(SCRIPT), "--json"], capture_output=True,
                            text=True, timeout=20, check=True)
    data = json.loads(result.stdout)
    assert data["status"] == "PASS"
    assert data["duration_seconds"] < 90
    assert data["real_provider_calls"] == 0
    assert data["private_photos_retained"] is False
    assert data["gateway_features"] == ["skin-analysis", "makeup-vto"]
    assert [s["step"] for s in data["steps"]] == [
        "synthetic_photo", "consent_gate", "skin_ai_mock", "makeup_vto_mock", "wishlist_and_bag", "remove_item"]
    assert data["steps"][1]["status"] == 403
    assert data["steps"][4]["checkout_enabled"] is False
    assert data["steps"][5]["items"] == 0
