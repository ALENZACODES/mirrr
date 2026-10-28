'Workflow quality and privacy checks. Author: John Khan.'
from __future__ import annotations

import json
from typing import Any


def no_network_contract(result: dict[str, Any]) -> bool:
    return result.get('network') is False or result.get('feature') in {'W94', 'W99'}

def estimate_labelled(result: dict[str, Any]) -> bool:
    if result.get('feature') not in {'W94', 'W99'}:
        return True
    return 'estimate' in json.dumps(result).casefold() or 'estimated' in json.dumps(result).casefold()

def price_order(result: dict[str, Any]) -> bool:
    if result.get('feature') != 'W94':
        return True
    return float(result['initial_low']) <= float(result['initial_high']) <= float(result['year1_high'])

def pass_result(result: dict[str, Any]) -> bool:
    return no_network_contract(result) and estimate_labelled(result) and price_order(result)
