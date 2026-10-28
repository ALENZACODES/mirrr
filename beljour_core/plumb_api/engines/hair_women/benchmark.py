'Written pass definitions for R17B women hair features. Author: John Khan.'
from __future__ import annotations

from .contracts import FEATURES

PASS_DEFINITIONS = {feature: 'Outside declared hair/scalp coverage unchanged <=0.5%; alpha exact; texture edge-energy ratio >= feature floor; real-face evidence required before release.' for feature in FEATURES}
PASS_DEFINITIONS['W33'] += ' Grey natural-share timeline must be monotone.'
PASS_DEFINITIONS['W40'] += ' Curl-pattern edge structure must be retained.'
PASS_DEFINITIONS['W42'] += ' Sensitive mode must avoid scalp darkening and use calm copy.'
PASS_DEFINITIONS['W44'] += ' Forecast must state it is an estimate from user-entered humidity.'
