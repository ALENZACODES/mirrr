# BELJOUR — Tuesday lock evidence handoff

Author: John Khan. Evidence layout prepared before Tuesday's engineering lock.

The accompanying dossier is deliberately **unmeasured**. It contains 205 command
slots, 82 quality-tier slots and 82 STUDIO/POSE diagnostic slots. Its verified
status is **incomplete**, with no device or independent real-face approval.
Do not present the template as evidence that any edit has passed on a person.

## Collecting evidence on the box

1. Commit the exact renderer build and the written pass definitions before using
   held-out inputs. Preserve the original frozen-set lock and source hashes.
2. Run the same guarded command at every level from 1.0 to 5.0 in 0.1 steps,
   recording actual preview and export timings, identity decisions, alpha and
   protected-region preservation. Never substitute a hand-written PASS flag.
3. Run the 1080 and 4K tiers separately at every level. The tier must meet its
   minimum long edge (1920 or 3840 pixels) without changing aspect ratio.
   Record both `/CLEANUP` then `/UPSCALE` identity checks and each measured latency.
   Unsupported input sizes receive an explicit refusal.
4. For `/STUDIOQUALITY`, attach real final-byte measurements for soft key light,
   gentle sculpting, skin lift, true colour, retained texture, mask preservation
   and alpha; do not infer a new numerical colour threshold.
5. For `/POSEONLY`, require checked face-mask evidence with **zero changed face
   pixels**, a working identity guard, no changed alpha, and the existing fold
   and retention tests. Missing masks are unproven, not successes.
6. Save the verified command JSON, tier JSON and optional Studio/Pose annex
   separately. Bind all evidence to one actual `run_id` and `renderer_build`.

To create the create-only BELJOUR technical review dossier from those files:

```sh
cd api
PYTHONPATH=. python -m plumb_api.commands.lock_pack_cli \
  --commands /local/evidence/tuesday-lock.json \
  --tiers /local/evidence/quality-tiers.json \
  --studio-pose-annex /local/evidence/studio-pose-annex.json \
  --output /local/existing/private-evidence-directory
```

To generate a new, **empty** operator checklist (not measured evidence):

```sh
PYTHONPATH=. python -m plumb_api.commands.lock_pack_cli \
  --template --run-id planned-tuesday-run --renderer-build unverified-build \
  --output /local/existing/private-evidence-directory
```

The CLI validates checksums, exact coverage, ordering, safety and timing statuses,
rejects symlinks and refuses overwriting a previous run. The reviewer sheet and
CSV list every missing, failed, late or device-unmeasured slot. A complete
engineering packet still requires approved model provenance, actual device
performance, independent adult-face assessments and the frozen 100,000-face
release gate before locking for production.

## Direct measured capture in Lane H

`plumb_api.commands.lock_capture_session.TuesdayCaptureSession` accepts paired,
actually executed guarded preview/export results from the same original photo.
It rejects a changed original, duplicate command/level receipts and any
nonmatching preview/export plan. Quality-tier level 1.0 compares actual pixels
against the independent bilinear resize reference rather than trusting a
caller-supplied neutral-pass flag. The photo digest is held only in memory and
never appears in the dossier. `close()` revokes the local capture state.

Studio and Pose diagnostics can be added only alongside their corresponding
captured command level. They do not replace the independent face-model,
protected-region, device-timing or 100,000-face acceptance gates.
