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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const order_enum_1 = require("../enums/order.enum");
const OrderProductSchema = new mongoose_1.Schema({
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
});
const OrderSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Users" },
    products: [OrderProductSchema],
    totalAmount: { type: Number },
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
    shippingAddress: { type: String },
    discountApplied: { type: Boolean, default: false },
    discountAmount: { type: Number },
    originalTotalAmount: { type: Number },
    discountCode: { type: String },
    cartId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Cart" }
}, { timestamps: true });
exports.default = mongoose_1.default.model("Order", OrderSchema);
