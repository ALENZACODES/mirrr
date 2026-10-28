"""Outside services, each behind one module.

`youcam` is the only module in the app that talks to YouCam (decisions.md, 2026-10-22).
`replay` serves recorded YouCam replies for tests and spikes, with no network.
scripts/check_boundaries.py fails the build if any other module imports the YouCam client.
"""
