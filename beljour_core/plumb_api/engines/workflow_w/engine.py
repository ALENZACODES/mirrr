'R17B workflow dispatcher. Author: John Khan.'
from __future__ import annotations

from datetime import date
from typing import Any

from .calendar import schedule
from .contracts import WorkflowRequest, parse
from .passport import encode, payload
from .pricing import estimate


def run(value: dict[str, Any] | WorkflowRequest) -> dict[str, Any]:
    request = parse(value)
    if request.feature == 'W94':
        if not request.service:
            raise ValueError('service required')
        result = estimate(request.price_low, request.price_high, request.sessions, request.maintenance_weeks)
        return {'feature': 'W94', 'city': request.city, 'service': request.service, **result}
    if request.feature == 'W96':
        if not request.occasion or not request.look_id:
            raise ValueError('occasion and look_id required')
        return {'feature': 'W96', 'occasion': request.occasion, 'look_id': request.look_id, 'storage': 'local recipe reference', 'network': False}
    if request.feature == 'W99':
        raw = str(request.metadata.get('start_date', date.today().isoformat()))
        start = date.fromisoformat(raw)
        return {'feature': 'W99', 'calendar': schedule(start, request.maintenance_weeks), 'label': 'estimated maintenance schedule'}
    if request.feature == 'W100':
        data = payload(request.depth, request.undertone, request.hair_base, request.allergens, request.measured_on)
        return {'feature': 'W100', 'export': encode(data), 'network': False, 'encrypted': False, 'note': 'integrity protected local export; encrypt externally before sharing'}
    raise ValueError('unsupported workflow feature')
