"""Make a judge code and the digest to configure, or the digest of a code you chose.

  python scripts/judge_code.py                 a new code and its sha256 digest
  python scripts/judge_code.py ABCD-EFGH-JKLM  the digest of that code

Give the code to the judges (for example in the Devpost testing instructions). Put only the
digest on the server, in BELJOUR_JUDGE_CODE_HASHES (comma separated for several codes).
A session with a valid code gets BELJOUR_JUDGE_SESSION_CAP units (default 40) instead of
BELJOUR_SESSION_CAP (default 6). Run from the api/ folder. Author: John Khan.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from plumb_api.sessions import hash_code, make_judge_code  # noqa: E402


def main(argv: list[str] | None = None, out=print) -> int:
    argv = sys.argv[1:] if argv is None else argv
    code = argv[0] if argv else make_judge_code()
    out(f"code:   {code.strip().upper()}")
    out(f"digest: {hash_code(code)}")
    out("Set BELJOUR_JUDGE_CODE_HASHES to the digest on the server. Never commit the code.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
