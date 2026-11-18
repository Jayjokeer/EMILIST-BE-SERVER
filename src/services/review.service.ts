import Review from "../models/review.model";
import mongoose from "mongoose";

export const addReview = async(payload: any)=>{
    return await Review.create(payload);
  };

export const isUserReviewed = async(productId: string, userId: string)=>{
    return await Review.findOne({userId: userId, productId:productId});
  };
export const isReviewedbyUser = async(businessId: string, userId: string)=>{
    return await Review.findOne({userId: userId, businessId: businessId});
  };
export const findJobOwnerReview = async (jobId: string, reviewerId: string, ownerId: string) =>
  Review.findOne({ jobId, userId: reviewerId, reviewedUserId: ownerId });
export const fetchReviewsForBusiness = async (
  businessId: string,
  page = 1,
  limit = 4,
  sortBy: "mostRelevant" | "newest" = "newest",
) => {
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.min(50, Math.max(1, Number(limit) || 10));
  const skip = (pageNumber - 1) * limitNumber;

  const matchStage = { businessId: new mongoose.Types.ObjectId(businessId) };
  const sortStage: Record<string, 1 | -1> = sortBy === "mostRelevant"
    ? { helpfulCount: -1, createdAt: -1 }
    : { createdAt: -1 };

  const [result] = await Review.aggregate([
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
  const reviews = (summary.reviews || []).map(normalizeBusinessReview);

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

export const normalizeBusinessReview = (review: any) => {
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

export const fetchReviewForProduct = async (
  productId: string,
  page = 1,
  limit = 4,
  search?: string
) => {
  const skip = (page - 1) * limit;

  const matchStage: any = { productId: new mongoose.Types.ObjectId(productId) };

  // If search param is provided, filter reviews by comment
  if (search) {
    matchStage.comment = { $regex: search, $options: "i" };
  }

  return await Review.aggregate([
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
