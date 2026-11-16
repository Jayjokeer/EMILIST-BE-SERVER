import mongoose, { Document, Schema } from 'mongoose';
import { IReview } from '../interfaces/review.interface';


  const reviewSchema: Schema = new mongoose.Schema(
    {
      productId: { type: Schema.Types.ObjectId, ref: "Product" },
      userId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String, trim: true },
      businessId: { type: Schema.Types.ObjectId, ref: "Business" },
      projectId: { type: Schema.Types.ObjectId, ref: "Project" },
      jobId: { type: Schema.Types.ObjectId, ref: "Jobs" },
      reviewedUserId: { type: Schema.Types.ObjectId, ref: "Users" },
      rateCommunication: { type: Number,  min: 1, max: 5 },
      isRecommendVendor: {type: Boolean},
      helpfulUsers: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
      notHelpfulUsers: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
      helpfulCount: { type: Number, default: 0 },
      notHelpfulCount: { type: Number, default: 0 },
    },
    { timestamps: true }
  );

  reviewSchema.index(
    { jobId: 1, userId: 1, reviewedUserId: 1 },
    { unique: true, sparse: true },
  );
  
  export default mongoose.model<IReview>("Review", reviewSchema);
