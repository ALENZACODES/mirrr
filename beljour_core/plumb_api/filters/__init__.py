"""BELJOUR filter pack (filters-plan.md): every filter is a JSON recipe plus shared engines.

Python is canonical for the recipes (recipes/*.json) and mirrors the TypeScript kernels the
quality harness needs (colour, masks, glow and position light). No module in this package may
import the YouCam adapter: filters are our own maths only (scripts/check_boundaries.py).
Author: John Khan.
"""
