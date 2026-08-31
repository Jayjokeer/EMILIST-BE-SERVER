import mongoose, { Schema } from 'mongoose';
import { IDiscount } from '../interfaces/discount.interface';

// Promo codes are seller-owned and product-scoped: a code belongs to exactly one
// seller (sellerId) and only ever discounts the products listed in productIds.
// It must never apply to the whole cart.
const discountSchema = new Schema(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        discountPercentage: { type: Number, required: true, min: 1, max: 100 },
        expiryDate: { type: Date, required: true },
        isActive: { type: Boolean, default: true },
        isSingleUse: { type: Boolean, default: false },
        useCount: { type: Number, default: 0 },
        // === Scope ===
        sellerId: { type: Schema.Types.ObjectId, ref: "Users", required: true, index: true },
        productIds: [{ type: Schema.Types.ObjectId, ref: "Product", required: true }],
    },
    { timestamps: true }
);

discountSchema.index({ sellerId: 1, isActive: 1 });

export default mongoose.model<IDiscount>('Discount', discountSchema);