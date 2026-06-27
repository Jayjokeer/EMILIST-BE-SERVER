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
export const fetchReviewForProduct = async (
  productId: string,
  page = 1,
  limit = 4
) => {
  const skip = (page - 1) * limit;

  return await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },

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
              "user.fullName": 1,
              "user.profileImage": 1,
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