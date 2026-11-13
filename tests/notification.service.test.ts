import test from "node:test";
import assert from "node:assert/strict";
import { normalizeNotification, safeNotificationMessage } from "../src/services/notification.service";

test("legacy notification actor placeholders are replaced with a readable name", () => {
  assert.equal(
    safeNotificationMessage("undefined applied to your job titled: Plumber"),
    "An Emilist user applied to your job titled: Plumber",
  );
  assert.equal(
    safeNotificationMessage("undefined accepted your counteroffer for Plumber"),
    "An Emilist user accepted your counteroffer for Plumber",
  );
  assert.equal(
    safeNotificationMessage("undefined sent a counteroffer for Door maintenance"),
    "An Emilist user sent a counteroffer for Door maintenance",
  );
});

test("other unresolved notification fields use a neutral fallback", () => {
  assert.equal(
    safeNotificationMessage("Your update for undefined is ready"),
    "Your update for unavailable is ready",
  );
  assert.equal(
    safeNotificationMessage(undefined),
    "You have a new update on Emilist.",
  );
});

test("legacy severity types are converted to navigable notification targets", () => {
  const notification = normalizeNotification({
    _id: "6af2f146f91a6041de5e4b2f",
    title: "Counteroffer accepted",
    message: "undefined accepted your counteroffer for Plumber",
    type: "info",
  });

  assert.equal(notification.type, "job");
  assert.equal(notification.level, "info");
  assert.deepEqual(notification.target, { type: "job", id: null, action: null });
});

test("new notifications expose their resource and action as a target", () => {
  const notification = normalizeNotification({
    title: "Job Application",
    message: "A user applied to your job",
    type: "job",
    resourceId: "6af4d581420372f785c021c5",
    action: "application_received",
    metadata: { jobId: "6af4d581420372f785c021c5", applicationId: "6af4d581420372f785c021c6" },
  });

  assert.deepEqual(notification.target, {
    type: "job",
    id: "6af4d581420372f785c021c5",
    action: "application_received",
  });
});
