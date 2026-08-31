import mongoose, { Schema, Document } from "mongoose";
import { IOrder} from "../interfaces/order.interface";
import { OrderDeliveryStatus, OrderPaymentStatus, OrderStatus } from "../enums/order.enum";


const OrderProductSchema: Schema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  // === Snapshot fields captured at order-creation time ===
  productName: { type: String, trim: true },
  brand: { type: String, trim: true },
  categoryName: { type: String, trim: true },
  thumbnail: { type: String, trim: true },
  quantityMetric: { type: String, trim: true },
  merchantId: { type: Schema.Types.ObjectId, ref: "Users" },
  merchantName: { type: String, trim: true },
  merchantRating: { type: Number },
  merchantReviewCount: { type: Number },
  totalUnitsSoldAtPurchase: { type: Number },
  // === Promo snapshot: which code hit this line and how much it saved ===
  discountAmount: { type: Number, default: 0 },
  promoCode: { type: String, trim: true, uppercase: true },
  // === Tax snapshot: the product's own rate and what this line was charged ===
  taxPercentage: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
});

const DeliveryStepSchema: Schema = new Schema(
  {
    status: { type: String, enum: OrderDeliveryStatus, required: true },
    timestamp: { type: Date, required: true },
    note: { type: String, trim: true },
  },
  { _id: false }
);

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
    promoCodes: { type: [String], default: [] },
    cartId: { type: Schema.Types.ObjectId, ref: "Cart", required: true, unique: true },
    // === Delivery / tracking ===
    deliveryStatus: {
      type: String,
      enum: OrderDeliveryStatus,
      default: OrderDeliveryStatus.orderConfirmed,
    },
    deliveryDate: { type: Date },
    deliveredAt: { type: Date },
    deliverySteps: { type: [DeliveryStepSchema], default: [] },
    cancelReason: { type: String, trim: true },
    cancelledAt: { type: Date },
    returnReason: { type: String, trim: true },
    returnedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>("Order", OrderSchema);
