"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchReviewForProduct = exports.isReviewedbyUser = exports.isUserReviewed = exports.addReview = void 0;
const review_model_1 = __importDefault(require("../models/review.model"));
const mongoose_1 = __importDefault(require("mongoose"));
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
const fetchReviewForProduct = async (productId, page = 1, limit = 4) => {
    const skip = (page - 1) * limit;
    return await review_model_1.default.aggregate([
        { $match: { productId: new mongoose_1.default.Types.ObjectId(productId) } },
        {
            $facet: {
                stats: [
                    {
                        $group: {
                            _id: null,
                            averageRating: { $avg: "$rating" },
                            numberOfRatings: { $sum: 1 },
                            fiveStar: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
                            fourStar: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
                            threeStar: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
                            twoStar: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
                            oneStar: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
                        },
                    },
                ],
                reviews: [
                    { $sort: { createdAt: -1 } },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: "users",
                            localField: "userId",
                            foreignField: "_id",
                            as: "user",
                        },
                    },
                    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            _id: 1,
                            rating: 1,
                            comment: 1,
                            helpfulCount: 1,
                            helpfulUsers: 1,
                            createdAt: 1,
                            "user._id": 1,
                            "user.firstName": 1,
                            "user.lastName": 1,
                            "user.displayImage": 1,
                        },
                    },
                ],
            },
        },
        {
            $project: {
                averageRating: { $round: [{ $arrayElemAt: ["$stats.averageRating", 0] }, 1] },
                numberOfRatings: { $arrayElemAt: ["$stats.numberOfRatings", 0] },
                ratingDistribution: {
                    5: { $ifNull: [{ $arrayElemAt: ["$stats.fiveStar", 0] }, 0] },
                    4: { $ifNull: [{ $arrayElemAt: ["$stats.fourStar", 0] }, 0] },
                    3: { $ifNull: [{ $arrayElemAt: ["$stats.threeStar", 0] }, 0] },
                    2: { $ifNull: [{ $arrayElemAt: ["$stats.twoStar", 0] }, 0] },
                    1: { $ifNull: [{ $arrayElemAt: ["$stats.oneStar", 0] }, 0] },
                },
                reviews: 1,
            },
        },
    ]);
};
exports.fetchReviewForProduct = fetchReviewForProduct;
