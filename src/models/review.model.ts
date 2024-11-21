import mongoose, { Document, Schema } from 'mongoose';
import { IReview } from '../interfaces/review.interface';


  const reviewSchema: Schema = new mongoose.Schema(
    {
      productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
      userId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String, trim: true },
    },
    { timestamps: true }
  );
  
  export default mongoose.model<IReview>("Review", reviewSchema);