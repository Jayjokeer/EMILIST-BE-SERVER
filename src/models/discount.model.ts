import mongoose, { Schema, Document } from 'mongoose';
import { IDiscount } from '../interfaces/discount.interface';


const discountSchema = new Schema(
    {
        code: { type: String, required: true, unique: true },
        discountPercentage: { type: Number, required: true },
        expiryDate: { type: Date, required: true },
        isActive: { type: Boolean, default: true },
        isSingleUse: { type: Boolean, default: false },
        useCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export default mongoose.model<IDiscount>('Discount', discountSchema);