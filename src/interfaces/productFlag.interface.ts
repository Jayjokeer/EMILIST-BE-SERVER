import mongoose from "mongoose";

export interface IProductFlag extends mongoose.Document {
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}