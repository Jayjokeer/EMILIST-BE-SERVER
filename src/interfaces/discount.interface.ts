export interface IDiscount extends Document {
    code: string;
    discountPercentage: number;
    expiryDate: Date;
    isActive: boolean;
}
