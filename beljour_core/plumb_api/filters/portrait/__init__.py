"""Named portrait looks: skin polish, feature definition and a colour grade under one name.

Local and deterministic; the browser twin is web/src/filters/portrait/. Every look is a
labelled simulation and never lightens skin by default.
Author: John Khan.
"""
from .compose import LABEL, REFUSALS, PortraitRefused, Result, render
from .looks import Look, default, get

__all__ = ["LABEL", "REFUSALS", "Look", "PortraitRefused", "Result", "default", "get", "render"]
