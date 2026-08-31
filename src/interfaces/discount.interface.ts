import { Document, Schema } from "mongoose";

export interface IDiscount extends Document {
    code: string;
    discountPercentage: number;
    expiryDate: Date;
    isActive: boolean;
    isSingleUse: boolean;
    useCount: number;
    // === Scope: the seller who owns this code and the products it applies to ===
    sellerId: Schema.Types.ObjectId;
    productIds: Schema.Types.ObjectId[];
}
