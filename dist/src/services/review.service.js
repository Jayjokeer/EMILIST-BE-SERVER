"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReviewedbyUser = exports.isUserReviewed = exports.addReview = void 0;
const review_model_1 = __importDefault(require("../models/review.model"));
const addReview = async (payload) => {
    return await review_model_1.default.create(payload);
};
exports.addReview = addReview;
const isUserReviewed = async (productId, userId) => {
    return await review_model_1.default.findOne({ userId: userId, productId: productId });
};
exports.isUserReviewed = isUserReviewed;
const isReviewedbyUser = async (businessId, userId) => {
    return await review_model_1.default.findOne({ userId: userId, businessId: businessId });
};
exports.isReviewedbyUser = isReviewedbyUser;
