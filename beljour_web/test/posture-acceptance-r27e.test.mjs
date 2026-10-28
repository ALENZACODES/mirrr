/** R27E export readiness: a labelled save needs every condition; body-set evidence stays NOT_RUN.
 * Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { BODY_SET_COPY, BODY_SET_STATUS, READINESS_MESSAGES, studioReadiness } from "../dist/js/body/posture-acceptance.js";
import { checkedPostureRender } from "../dist/js/body/posture-binding.js";
import { PostureIntake } from "../dist/js/body/posture-intake.js";
import { HeadPixelGuard } from "../dist/js/body/posture-pixel-guard.js";
import { annotate, drawnPhoto } from "./posture-fixtures-r27e.mjs";

function released() {
  const photo = drawnPhoto("side");
  const intake = new PostureIntake();
  intake.setSource(photo.digest, photo.pixels);
  const accepted = annotate(intake, photo);
  const checked = checkedPostureRender(accepted, { fix: "forward_head", level: 5, lockLevel: 5, stage: "release" },
    new HeadPixelGuard(accepted.image, accepted.head));
  const release = { digest: photo.digest, revision: 1, stage: "release", ...checked };
  return { intake, accepted, release };
}

test("an accepted, released and inspected edit of this photo is ready", () => {
  const { intake, accepted, release } = released();
  const state = studioReadiness({ digest: intake.digest, revision: intake.revision, accepted, release,
    releaseRevision: intake.revision });
  assert.deepEqual(state, { ready: true, gaps: [], bodySet: "NOT_RUN" });
});

test("each missing condition blocks the save with its own reason", () => {
  const { intake, accepted, release } = released();
  const base = { digest: intake.digest, revision: intake.revision, accepted, release, releaseRevision: intake.revision };
  const gaps = (change) => studioReadiness({ ...base, ...change }).gaps;
  assert.deepEqual(gaps({ digest: null }), ["photo_required", "release_for_other_photo"]);
  assert.deepEqual(gaps({ accepted: null }), ["annotation_not_accepted"]);
  assert.deepEqual(gaps({ release: null }), ["release_required"]);
  assert.deepEqual(gaps({ release: { ...release, stage: "preview" } }), ["release_required"]);
  assert.deepEqual(gaps({ release: { ...release, digest: "0".repeat(64) } }), ["release_for_other_photo"]);
  assert.deepEqual(gaps({ releaseRevision: intake.revision - 1 }), ["release_out_of_date"]);
  assert.deepEqual(gaps({ release: { ...release, inspection: { ...release.inspection, headChanged: 1 } } }),
    ["output_checks_failed"]);
  assert.deepEqual(gaps({ release: { ...release, result: { ...release.result, label: "Edited" } } }),
    ["simulation_label_missing"]);
  for (const gap of Object.keys(READINESS_MESSAGES)) assert.ok(READINESS_MESSAGES[gap].length > 0);
});

test("body-set copy never claims a pass", () => {
  assert.equal(BODY_SET_STATUS, "NOT_RUN");
  assert.match(BODY_SET_COPY, /NOT_RUN/);
  assert.match(BODY_SET_COPY, /not medical advice/);
  assert.doesNotMatch(BODY_SET_COPY, /\bPASS(ED)?\b/);
});
