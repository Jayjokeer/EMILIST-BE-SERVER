import mongoose, { Schema, Document } from "mongoose";
import { IOrder} from "../interfaces/order.interface";
import { OrderPaymentStatus, OrderStatus } from "../enums/order.enum";


const OrderProductSchema: Schema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
});

const OrderSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Users"},
    products: [OrderProductSchema],
    totalAmount: { type: Number,  },
    status: {
      type: String,
      enum: OrderStatus,
      default: OrderStatus.pending,
    },
    paymentStatus: {
      type: String,
      enum: OrderPaymentStatus,
      default: OrderPaymentStatus.unpaid,
    },
    shippingAddress: { type: String,  },
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>("Order", OrderSchema);