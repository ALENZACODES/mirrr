/** R27E per-photo intake: mandatory markings, invalidation on correction, clean replacement.
 * Author: John Khan. */
import assert from "node:assert/strict";
import { test } from "node:test";

import { PostureIntake } from "../dist/js/body/posture-intake.js";
import { annotate, drawnPhoto } from "./posture-fixtures-r27e.mjs";

test("every marking is mandatory and reported in order", () => {
  const intake = new PostureIntake();
  assert.deepEqual(intake.missing(), ["photo_required"]);
  const photo = drawnPhoto("side");
  intake.setSource(photo.digest, photo.pixels);
  assert.deepEqual(intake.missing(), ["view_required", "person_outline_required", "head_outline_required"]);
  intake.setView("side", 1);
  intake.setPersonOutline(photo.person);
  intake.setHeadOutline(photo.head);
  assert.deepEqual(intake.missing(), ["head_confirmation_required", "control_points_required"]);
  assert.throws(() => intake.accept(), /annotation incomplete/);
  intake.confirmHead(true);
  for (const [name, point] of Object.entries(photo.points)) intake.setPoint(name, point);
  assert.deepEqual(intake.missing(), []);
  const frame = intake.accept();
  assert.equal(frame.controls.view, "side");
  assert.equal(frame.controls.facing, 1);
  assert.deepEqual(frame.controls.manual.sort(), Object.keys(photo.points).sort());
  assert.equal(intake.accepted, frame);
});

test("any correction revokes the accepted frame", () => {
  const photo = drawnPhoto("front");
  const intake = new PostureIntake();
  intake.setSource(photo.digest, photo.pixels);
  annotate(intake, photo);
  assert.ok(intake.accepted);
  intake.setPoint("navel", [photo.points.navel[0] + 1, photo.points.navel[1]]);
  assert.equal(intake.accepted, null);
  intake.accept();
  intake.setHeadOutline(photo.head);
  assert.equal(intake.accepted, null, "a redrawn head must be confirmed again");
  assert.deepEqual(intake.missing(), ["head_confirmation_required"]);
});

test("changing the view clears its control points", () => {
  const photo = drawnPhoto("side");
  const intake = new PostureIntake();
  intake.setSource(photo.digest, photo.pixels);
  annotate(intake, photo);
  intake.setView("side", -1);
  assert.deepEqual(intake.snapshot().points, {});
  assert.throws(() => intake.setView("front", 1), /no facing/);
  assert.throws(() => intake.setPoint("navel", [5, 5]), /does not belong/);
});

test("the session owns its pixels and replacement wipes the old photo", () => {
  const photo = drawnPhoto("front");
  const intake = new PostureIntake();
  intake.setSource(photo.digest, photo.pixels);
  const frame = annotate(intake, photo);
  photo.pixels.data[0] = 7;
  assert.notEqual(intake.source.data[0], 7);
  const oldSource = intake.source;
  const other = drawnPhoto("side");
  intake.setSource(other.digest, other.pixels);
  assert.ok(oldSource.data.every((value) => value === 0), "old pixels are zeroed");
  assert.ok(frame.image.data.every((value) => value === 0), "old accepted copy is zeroed");
  assert.equal(intake.snapshot().person, null);
  assert.equal(intake.digest, other.digest);
});

test("a head outline largely outside the person is refused at acceptance", () => {
  const photo = drawnPhoto("front");
  const intake = new PostureIntake();
  intake.setSource(photo.digest, photo.pixels);
  annotate(intake, photo);
  intake.setHeadOutline([[0, 0], [20, 0], [20, 20], [0, 20]]);
  intake.confirmHead(true);
  assert.throws(() => intake.accept(), /head_outside_person/);
});

test("invalid digests, points outside the photo and confirmation without a head are refused", () => {
  const photo = drawnPhoto("front");
  const intake = new PostureIntake();
  assert.throws(() => intake.setSource("NOT-HEX", photo.pixels), /digest/);
  intake.setSource(photo.digest, photo.pixels, "front", 0);
  assert.throws(() => intake.confirmHead(true), /head outline/);
  assert.throws(() => intake.setPoint("navel", [-3, 5]), /outside the photo/);
  intake.dispose();
  assert.equal(intake.source, null);
});
