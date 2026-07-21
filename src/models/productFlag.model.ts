import mongoose, { Schema } from "mongoose";
import { IProductFlag } from "../interfaces/productFlag.interface";

const ProductFlagSchema = new Schema<IProductFlag>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IProductFlag>("ProductFlag", ProductFlagSchema);