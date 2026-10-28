# BELJOUR /UPSCALE neutral reference: paired regression

Compared output bytes: **648880**
Before correction: **14/16** cases differed, **343147** bytes differed.
After correction: **0/16** cases differed, **0** bytes differed.

| Pattern | Source | Channels | Scale | Before differing | After differing | Before max delta | After max delta |
|---|---|---:|---:|---:|---:|---:|---:|
| uniform | 1×1 | 3 | 2× | 0 | 0 | 0 | 0 |
| uniform | 1×1 | 3 | 4× | 0 | 0 | 0 | 0 |
| checker | 8×7 | 3 | 2× | 374 | 0 | 26 | 0 |
| checker | 8×7 | 3 | 4× | 1142 | 0 | 32 | 0 |
| gradient | 19×13 | 3 | 2× | 2403 | 0 | 31 | 0 |
| gradient | 19×13 | 3 | 4× | 9390 | 0 | 34 | 0 |
| alpha_corner | 47×31 | 4 | 2× | 6595 | 0 | 255 | 0 |
| alpha_corner | 47×31 | 4 | 4× | 25403 | 0 | 255 | 0 |
| edge | 32×17 | 4 | 2× | 3132 | 0 | 234 | 0 |
| edge | 32×17 | 4 | 4× | 11843 | 0 | 234 | 0 |
| ramp | 63×44 | 3 | 2× | 22566 | 0 | 34 | 0 |
| ramp | 63×44 | 3 | 4× | 87795 | 0 | 33 | 0 |
| gradient | 73×37 | 4 | 2× | 27295 | 0 | 238 | 0 |
| gradient | 73×37 | 4 | 4× | 106134 | 0 | 239 | 0 |
| checker | 29×38 | 4 | 2× | 8900 | 0 | 255 | 0 |
| checker | 29×38 | 4 | 4× | 30175 | 0 | 255 | 0 |

## Scope and evidence

The earlier neutral path sampled the input using Keys cubic interpolation, while the checked independent resize used bilinear interpolation.
The current neutral path uses the independent reference's clamped pixel-centre coordinates, float64 arithmetic and half-up byte rounding.
Higher levels deliberately retain the cubic sampler. A mandatory /CLEANUP pre-step changes which image is the upscale input; the claim must be checked against that actual intermediate image.

PSNR is infinite for byte-identical pairs. The reported 8×8 SSIM is a diagnostic of sampled RGB windows, not an external quality gate.
Generated colour grids only. Authorized paired real-face fixtures and independent identity qualification: **NOT RUN**.
No fidelity, reconstruction, face-quality, or release claim is made.
