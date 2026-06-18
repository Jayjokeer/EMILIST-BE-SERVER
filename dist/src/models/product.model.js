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
const ProductImageSchema = new mongoose_1.Schema({
    imageUrl: {
        type: String,
        required: true,
        trim: true,
    },
    isPrimary: {
        type: Boolean,
        default: false,
    },
}, { _id: true });
const DeliveryLocationSchema = new mongoose_1.Schema({
    state: { type: String, index: true },
    lga: { type: String, index: true },
}, { _id: false });
const ProductSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        index: true,
    },
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
        index: true,
    },
    subCategory: {
        type: String,
        trim: true,
        index: true,
    },
    brand: {
        type: String,
        trim: true,
        index: true,
    },
    description: {
        type: String,
        required: true,
        maxlength: 3000,
    },
    images: [ProductImageSchema],
    availableQuantity: {
        type: Number,
        required: true,
        min: 1,
        index: true,
    },
    quantityMetric: {
        type: String,
        enum: ["bag", "kg", "ton"],
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
        index: true,
    },
    currency: {
        type: String,
        default: "NGN",
    },
    priceMetric: {
        type: String,
        enum: ["bag", "kg", "ton"],
        required: true,
    },
    merchantName: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    storeName: {
        type: String,
        trim: true,
        index: true,
    },
    deliveryLocations: {
        type: [DeliveryLocationSchema],
        index: true,
    },
    isDiscounted: {
        type: Boolean,
        default: false,
    },
    discountedPrice: Number,
    status: {
        type: String,
        enum: ["draft", "pending", "active", "rejected", "inactive", "sold_out"],
        default: "pending",
        index: true,
    },
    approvedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Users",
    },
    approvedAt: Date,
    rejectionReason: {
        type: String,
    },
    reviews: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
    clicks: {
        users: [
            {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Users",
            },
        ],
        clickCount: {
            type: Number,
            default: 0,
        },
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true,
    },
}, {
    timestamps: true,
});
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ brand: 1, status: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ "deliveryLocations.state": 1, "deliveryLocations.lga": 1 });
ProductSchema.index({
    name: "text",
    brand: "text",
    category: "text",
});
exports.default = mongoose_1.default.model("Product", ProductSchema);
