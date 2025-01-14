import { Schema } from "mongoose";

export interface IProduct {
    name?: string;
    category?: string;
    subCategory?: string;
    brand?: string;
    description?: string;
    images?: any;
    availableQuantity?: number;
    price?: number;
    storeName?: string;
    location?: string;
    currency?: string;
    userId?: string;
    reviews?: string[];
    discountedPrice?: number;
    isDiscounted?: boolean;
    // orders?: string[];
    clicks: any;

}