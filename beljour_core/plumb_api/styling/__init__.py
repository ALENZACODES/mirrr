"""Hair Studio's deterministic, offline-only planning, catalogue and quality checks.

This package does not import or call a YouCam client. An approved styling request must
pass through ``plumb_api.actions`` and the existing provider/gateway, with the same
consent, quotes, ledger and unit limits as every other styling action.

Author: John Khan.
"""

from .demo_gate import checked_demo, checked_demo_batch
from .evidence import analyse_demo, summarise_evidence
from .local_demo import DemoRefusal, DemoRender, demo_catalogue, render_demo_style

__all__ = [
    "DemoRefusal", "DemoRender", "analyse_demo", "checked_demo",
    "checked_demo_batch", "demo_catalogue",
    "render_demo_style", "summarise_evidence",
]
