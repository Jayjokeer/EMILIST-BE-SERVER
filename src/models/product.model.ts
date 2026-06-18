import mongoose, { Schema } from "mongoose";
import { IProduct } from "../interfaces/product.interface";

const ProductImageSchema = new Schema(
  {
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const DeliveryLocationSchema = new Schema(
  {
    state: { type: String, index: true },
    lga: { type: String, index: true },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    userId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: "Users",
    },

    approvedAt: Date,

    rejectionReason: {
      type: String,
    },

    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],

    clicks: {
      users: [
        {
          type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);


ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ brand: 1, status: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ "deliveryLocations.state": 1, "deliveryLocations.lga": 1 });

ProductSchema.index({
  name: "text",
  brand: "text",
  category: "text",
});

export default mongoose.model<IProduct>("Product", ProductSchema);