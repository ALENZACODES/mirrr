"""Runtime settings, read once from environment variables.

The YouCam key lives only here, on the server. It is never sent to the browser.

Every setting is read as BELJOUR_<NAME> first and PLUMB_<NAME> second, so existing
deployments keep working after the rename to BELJOUR. YOUCAM_API_KEY keeps its name.
"""
from __future__ import annotations

import os
from collections.abc import Mapping
from dataclasses import dataclass, field
from pathlib import Path

PACKAGE_DIR = Path(__file__).resolve().parent


def _flag(value: str | None, default: bool) -> bool:
    if value is None or value.strip() == "":
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _int(value: str | None, default: int) -> int:
    try:
        return int(value) if value not in (None, "") else default
    except ValueError:
        return default


def _get(env: Mapping[str, str], name: str, default: str | None = None) -> str | None:
    """BELJOUR_<name>, then PLUMB_<name>, then the default."""
    for prefix in ("BELJOUR_", "PLUMB_"):
        value = env.get(prefix + name)
        if value is not None and value.strip() != "":
            return value
    return default


def _hashes(value: str | None) -> tuple[str, ...]:
    """Judge codes are configured as sha256 hex digests, never as plain codes."""
    out = []
    for item in (value or "").split(","):
        item = item.strip().lower()
        if item.startswith("sha256:"):
            item = item[7:]
        if len(item) == 64 and all(c in "0123456789abcdef" for c in item):
            out.append(item)
    return tuple(out)


@dataclass(frozen=True)
class Settings:
    youcam_api_key: str = ""
    youcam_base_url: str = "https://yce-api-01.makeupar.com"
    data_dir: Path = Path("/tmp/plumb")
    fixtures_dir: Path = PACKAGE_DIR / "demo" / "fixtures"
    demo_only: bool = False
    allowed_origins: tuple[str, ...] = ("http://localhost:8080", "http://127.0.0.1:8080")
    max_upload_bytes: int = 8_000_000
    max_pixels: int = 24_000_000     # ASSUMED: width x height limit checked before any decode
    unit_reserve: int = 200          # live balance floor: no live call may take the balance below this
    daily_unit_cap: int = 150
    photo_ttl_seconds: int = 3600
    result_ttl_seconds: int = 86_400
    poll_interval_s: float = 3.0
    poll_timeout_s: float = 240.0
    # YouCam scope (decisions.md, 2026-10-22): makeup and hair styling only, behind one flag.
    youcam_styling: bool = True      # BELJOUR_YOUCAM_STYLING=0 turns every YouCam call off
    youcam_legacy: bool = False      # Deprecated inert constructor compatibility; no environment flag or live path
    # Skin AI (decisions.md, 2026-10-23 10:21 AM ET): skin analysis for product matching only,
    # through services/skin_match.py. BELJOUR_YOUCAM_SKIN=0 turns it off on its own.
    youcam_skin: bool = True
    # Unit policy
    kill_switch: bool = False        # BELJOUR_KILL_SWITCH=1 stops every live call at once
    session_cap_public: int = 6      # units per browser session; 0 turns the session cap off
    session_cap_judge: int = 40      # units per session after a valid judge code
    judge_code_hashes: tuple[str, ...] = ()
    judge_attempts: int = 5          # wrong codes allowed per session
    resume_secret: str = ""          # signs task tickets so a browser can resume after a restart
    # Tests construct Settings directly; deployed environment loading enables admission.
    rate_limit_enabled: bool = False
    rate_limit_capacity: int = 12
    rate_limit_refill_s: float = 0.2
    rate_limit_max_entries: int = 10000
    trusted_proxy_header: str = ""
    trusted_proxy_networks: tuple[str, ...] = ()
    extra: dict = field(default_factory=dict)

    @property
    def live(self) -> bool:
        """True when real YouCam calls are allowed."""
        return bool(self.youcam_api_key) and not self.demo_only and self.youcam_styling


def load_settings(env: Mapping[str, str] | None = None) -> Settings:
    env = os.environ if env is None else env
    origins = tuple(
        o.strip() for o in (_get(env, "ALLOWED_ORIGINS") or "").split(",") if o.strip()
    ) or Settings.allowed_origins
    return Settings(
        youcam_api_key=env.get("YOUCAM_API_KEY", "").strip(),
        youcam_base_url=env.get("YOUCAM_BASE_URL", Settings.youcam_base_url).rstrip("/"),
        data_dir=Path(_get(env, "DATA_DIR", str(Settings.data_dir)) or ""),
        fixtures_dir=Path(_get(env, "FIXTURES_DIR", str(Settings().fixtures_dir)) or ""),
        demo_only=_flag(_get(env, "DEMO_ONLY"), False),
        allowed_origins=origins,
        max_upload_bytes=_int(_get(env, "MAX_UPLOAD_BYTES"), Settings.max_upload_bytes),
        max_pixels=_int(_get(env, "MAX_PIXELS"), Settings.max_pixels),
        unit_reserve=_int(_get(env, "BALANCE_FLOOR") or _get(env, "UNIT_RESERVE"), Settings.unit_reserve),
        daily_unit_cap=_int(_get(env, "DAILY_UNIT_CAP"), Settings.daily_unit_cap),
        photo_ttl_seconds=_int(_get(env, "PHOTO_TTL"), Settings.photo_ttl_seconds),
        result_ttl_seconds=_int(_get(env, "RESULT_TTL"), Settings.result_ttl_seconds),
        youcam_styling=_flag(_get(env, "YOUCAM_STYLING"), Settings.youcam_styling),
        youcam_skin=_flag(_get(env, "YOUCAM_SKIN"), Settings.youcam_skin),
        kill_switch=_flag(_get(env, "KILL_SWITCH"), Settings.kill_switch),
        session_cap_public=_int(_get(env, "SESSION_CAP"), Settings.session_cap_public),
        session_cap_judge=_int(_get(env, "JUDGE_SESSION_CAP"), Settings.session_cap_judge),
        judge_code_hashes=_hashes(_get(env, "JUDGE_CODE_HASHES")),
        judge_attempts=_int(_get(env, "JUDGE_ATTEMPTS"), Settings.judge_attempts),
        resume_secret=(_get(env, "RESUME_SECRET") or "").strip(),
        rate_limit_enabled=_flag(_get(env, "RATE_LIMIT_ENABLED"), True),
        rate_limit_capacity=int(_get(env, "RATE_LIMIT_CAPACITY", "12") or "12"),
        rate_limit_refill_s=float(_get(env, "RATE_LIMIT_REFILL_PER_SECOND", "0.2") or "0.2"),
        rate_limit_max_entries=int(_get(env, "RATE_LIMIT_MAX_ENTRIES", "10000") or "10000"),
        trusted_proxy_header=(_get(env, "TRUSTED_PROXY_HEADER") or "").strip(),
        trusted_proxy_networks=tuple(s.strip() for s in (_get(env, "TRUSTED_PROXY_NETWORKS") or "").split(",") if s.strip()),
    )
