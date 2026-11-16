import mongoose from "mongoose";

export interface IReview extends Document {
    productId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    reviewedUserId?: mongoose.Types.ObjectId;
    jobId?: mongoose.Types.ObjectId;
    rating: number;
    comment?: string;
    helpfulCount?: number;
    helpfulUsers?: any;
    createdAt?: any;
    isRecommendVendor?:boolean;
    rateCommunication?: number;
    notHelpfulUsers?: any;
    notHelpfulCount?: number;
  }
  
