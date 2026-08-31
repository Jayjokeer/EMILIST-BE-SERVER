"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const order_enum_1 = require("../enums/order.enum");
const OrderProductSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    // === Snapshot fields captured at order-creation time ===
    productName: { type: String, trim: true },
    brand: { type: String, trim: true },
    categoryName: { type: String, trim: true },
    thumbnail: { type: String, trim: true },
    quantityMetric: { type: String, trim: true },
    merchantId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Users" },
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
const DeliveryStepSchema = new mongoose_1.Schema({
    status: { type: String, enum: order_enum_1.OrderDeliveryStatus, required: true },
    timestamp: { type: Date, required: true },
    note: { type: String, trim: true },
}, { _id: false });
const OrderSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Users", required: true },
    // These are a price snapshot. Product prices must never alter a placed order.
    products: { type: [OrderProductSchema], required: true },
    subtotalAmount: { type: Number, required: true },
    taxAmount: { type: Number, required: true, default: 0 },
    shippingAmount: { type: Number, required: true, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: order_enum_1.OrderStatus,
        default: order_enum_1.OrderStatus.pending,
    },
    paymentStatus: {
        type: String,
        enum: order_enum_1.OrderPaymentStatus,
        default: order_enum_1.OrderPaymentStatus.unpaid,
    },
    shippingAddress: { type: String, trim: true },
    orderNote: { type: String, trim: true, maxlength: 1000 },
    discountApplied: { type: Boolean, default: false },
    discountAmount: { type: Number },
    originalTotalAmount: { type: Number },
    discountCode: { type: String },
    promoCodes: { type: [String], default: [] },
    cartId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Cart", required: true, unique: true },
    // === Delivery / tracking ===
    deliveryStatus: {
        type: String,
        enum: order_enum_1.OrderDeliveryStatus,
        default: order_enum_1.OrderDeliveryStatus.orderConfirmed,
    },
    deliveryDate: { type: Date },
    deliveredAt: { type: Date },
    deliverySteps: { type: [DeliveryStepSchema], default: [] },
    cancelReason: { type: String, trim: true },
    cancelledAt: { type: Date },
    returnReason: { type: String, trim: true },
    returnedAt: { type: Date },
}, { timestamps: true });
exports.default = mongoose_1.default.model("Order", OrderSchema);
