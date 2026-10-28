"""Expose offline lab harnesses to tests without adding them to the API package.

The production application's import boundary prohibits dependencies on lab.
Author: John Khan.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
