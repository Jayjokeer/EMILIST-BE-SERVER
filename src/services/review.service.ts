import Review from "../models/review.model";

export const addReview = async(payload: any)=>{
    return await Review.create(payload);
  };

export const isUserReviewed = async(productId: string, userId: string)=>{
    return await Review.findOne({userId: userId, productId:productId});
  };
export const isReviewedbyUser = async(businessId: string, userId: string)=>{
    return await Review.findOne({userId: userId, businessId: businessId});
  };