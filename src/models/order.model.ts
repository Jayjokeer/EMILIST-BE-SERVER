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
    userId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    // These are a price snapshot. Product prices must never alter a placed order.
    products: { type: [OrderProductSchema], required: true },
    subtotalAmount: { type: Number, required: true },
    taxAmount: { type: Number, required: true, default: 0 },
    shippingAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },
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
    shippingAddress: { type: String, trim: true },
    orderNote: { type: String, trim: true, maxlength: 1000 },
    discountApplied: { type: Boolean, default: false },
    discountAmount:{ type: Number },
    originalTotalAmount: { type: Number },
    discountCode:{type: String},
    cartId: { type: Schema.Types.ObjectId, ref: "Cart", required: true, unique: true }
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>("Order", OrderSchema);
