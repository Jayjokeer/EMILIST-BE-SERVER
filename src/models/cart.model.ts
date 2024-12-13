import mongoose, { Schema, Document } from "mongoose";
import { CartStatus } from "../enums/cart.enum";
import { ICart } from "../interfaces/cart.interface";
  
  const CartProductSchema: Schema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: "Product"},
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
  });
  
  const CartSchema: Schema = new Schema(
    {
      userId: { type: Schema.Types.ObjectId, ref: "Users" },
      products: [CartProductSchema],
      totalAmount: { type: Number, required: true, default: 0 },
      status: {
        type: String,
        enum: CartStatus,
        default: CartStatus.active,
      },
      isPaid: {type: Boolean, default: false},
    },
    { timestamps: true }
  );
  
  export default mongoose.model<ICart>("Cart", CartSchema);