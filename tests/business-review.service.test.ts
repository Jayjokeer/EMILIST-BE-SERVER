import test from "node:test";
import assert from "node:assert/strict";
import { normalizeBusinessReview } from "../src/services/review.service";

test("business reviews expose reviewer identity, image, note, and timestamp", () => {
  const createdAt = new Date("2026-11-18T12:00:00.000Z");
  const review = normalizeBusinessReview({
    _id: "review-1",
    rating: 5,
    comment: "Excellent work",
    createdAt,
    user: {
      _id: "user-1",
      firstName: "Jane",
      lastName: "Doe",
      userName: "janedoe",
      displayImage: "https://cdn.example.com/jane.jpg",
    },
  });

  assert.equal(review.user.fullName, "Jane Doe");
  assert.equal(review.user.displayImage, "https://cdn.example.com/jane.jpg");
  assert.equal(review.user.profileImage, "https://cdn.example.com/jane.jpg");
  assert.equal(review.note, "Excellent work");
  assert.equal(review.reviewedAt, createdAt);
});

test("deleted reviewers and empty review notes receive safe fallbacks", () => {
  const review = normalizeBusinessReview({ rating: 4, user: null });
  assert.equal(review.user.fullName, "Emilist user");
  assert.equal(review.user.displayImage, null);
  assert.equal(review.note, "");
  assert.equal(review.reviewedAt, null);
});
