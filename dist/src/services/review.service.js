"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchReviewForProduct = exports.normalizeBusinessReview = exports.fetchReviewsForBusiness = exports.findJobOwnerReview = exports.isReviewedbyUser = exports.isUserReviewed = exports.addReview = void 0;
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
const findJobOwnerReview = async (jobId, reviewerId, ownerId) => review_model_1.default.findOne({ jobId, userId: reviewerId, reviewedUserId: ownerId });
exports.findJobOwnerReview = findJobOwnerReview;
const fetchReviewsForBusiness = async (businessId, page = 1, limit = 4, sortBy = "newest") => {
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(50, Math.max(1, Number(limit) || 10));
    const skip = (pageNumber - 1) * limitNumber;
    const matchStage = { businessId: new mongoose_1.default.Types.ObjectId(businessId) };
    const sortStage = sortBy === "mostRelevant"
        ? { helpfulCount: -1, createdAt: -1 }
        : { createdAt: -1 };
    const [result] = await review_model_1.default.aggregate([
        { $match: matchStage },
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
                            averageCommunicationRating: { $avg: "$rateCommunication" },
                            recommendedCount: { $sum: { $cond: ["$isRecommendVendor", 1, 0] } },
                        },
                    },
                ],
                reviews: [
                    { $sort: sortStage },
                    { $skip: skip },
                    { $limit: limitNumber },
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
                            rateCommunication: 1,
                            isRecommendVendor: 1,
                            helpfulCount: 1,
                            notHelpfulCount: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            "user._id": 1,
                            "user.firstName": 1,
                            "user.lastName": 1,
                            "user.userName": 1,
                            "user.displayImage": 1,
                        },
                    },
                ],
            },
        },
        {
            $project: {
                averageRating: { $round: [{ $ifNull: [{ $arrayElemAt: ["$stats.averageRating", 0] }, 0] }, 1] },
                numberOfRatings: { $ifNull: [{ $arrayElemAt: ["$stats.numberOfRatings", 0] }, 0] },
                averageCommunicationRating: { $round: [{ $ifNull: [{ $arrayElemAt: ["$stats.averageCommunicationRating", 0] }, 0] }, 1] },
                recommendedCount: { $ifNull: [{ $arrayElemAt: ["$stats.recommendedCount", 0] }, 0] },
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
    const summary = result || {
        averageRating: 0,
        numberOfRatings: 0,
        averageCommunicationRating: 0,
        recommendedCount: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        reviews: [],
    };
    const numberOfRatings = Number(summary.numberOfRatings || 0);
    const reviews = (summary.reviews || []).map(exports.normalizeBusinessReview);
    return {
        averageRating: Number(summary.averageRating || 0),
        averageCommunicationRating: Number(summary.averageCommunicationRating || 0),
        serviceAsSeen: numberOfRatings > 0
            ? Number(((Number(summary.recommendedCount || 0) / numberOfRatings) * 100).toFixed(2))
            : 0,
        numberOfRatings,
        ratingDistribution: summary.ratingDistribution,
        reviews,
        currentPage: pageNumber,
        totalPages: Math.ceil(numberOfRatings / limitNumber),
        limit: limitNumber,
    };
};
exports.fetchReviewsForBusiness = fetchReviewsForBusiness;
const normalizeBusinessReview = (review) => {
    const user = review?.user || null;
    const fullName = user
        ? [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
            || user.userName
            || "Emilist user"
        : "Emilist user";
    const displayImage = user?.displayImage || null;
    const comment = review?.comment || "";
    return {
        ...review,
        comment,
        note: comment,
        reviewedAt: review?.createdAt || null,
        user: user ? {
            _id: user._id,
            firstName: user.firstName || null,
            lastName: user.lastName || null,
            fullName,
            userName: user.userName || null,
            displayImage,
            profileImage: displayImage,
        } : {
            _id: null,
            firstName: null,
            lastName: null,
            fullName,
            userName: null,
            displayImage: null,
            profileImage: null,
        },
    };
};
exports.normalizeBusinessReview = normalizeBusinessReview;
const fetchReviewForProduct = async (productId, page = 1, limit = 4, search) => {
    const skip = (page - 1) * limit;
    const matchStage = { productId: new mongoose_1.default.Types.ObjectId(productId) };
    // If search param is provided, filter reviews by comment
    if (search) {
        matchStage.comment = { $regex: search, $options: "i" };
    }
    return await review_model_1.default.aggregate([
        { $match: matchStage },
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
