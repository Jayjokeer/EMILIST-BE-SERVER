"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const review_service_1 = require("../src/services/review.service");
(0, node_test_1.default)("business reviews expose reviewer identity, image, note, and timestamp", () => {
    const createdAt = new Date("2026-11-18T12:00:00.000Z");
    const review = (0, review_service_1.normalizeBusinessReview)({
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
    strict_1.default.equal(review.user.fullName, "Jane Doe");
    strict_1.default.equal(review.user.displayImage, "https://cdn.example.com/jane.jpg");
    strict_1.default.equal(review.user.profileImage, "https://cdn.example.com/jane.jpg");
    strict_1.default.equal(review.note, "Excellent work");
    strict_1.default.equal(review.reviewedAt, createdAt);
});
(0, node_test_1.default)("deleted reviewers and empty review notes receive safe fallbacks", () => {
    const review = (0, review_service_1.normalizeBusinessReview)({ rating: 4, user: null });
    strict_1.default.equal(review.user.fullName, "Emilist user");
    strict_1.default.equal(review.user.displayImage, null);
    strict_1.default.equal(review.note, "");
    strict_1.default.equal(review.reviewedAt, null);
});
