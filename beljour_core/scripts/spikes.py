"""Run spikes S1 to S6. See plumb_api/spikes/runner.py for the options.

  python scripts/spikes.py                  replayed and local, free, no key needed

Run from the api/ folder. Author: John Khan.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from lab.python.beljour_lab.runner import main  # noqa: E402

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
