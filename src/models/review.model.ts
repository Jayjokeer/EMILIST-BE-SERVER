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
      rateCommunication: { type: Number, required: true, min: 1, max: 5 },
      isRecommendVendor: {type: Boolean},
      helpfulUsers: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
      helpfulCount: { type: Number, default: 0 },
    },
    { timestamps: true }
  );
  
  export default mongoose.model<IReview>("Review", reviewSchema);