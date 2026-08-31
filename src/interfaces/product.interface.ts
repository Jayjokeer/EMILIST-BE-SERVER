import { Types } from "mongoose";

export interface IProductImage {
  _id?: Types.ObjectId;
  imageUrl: string;
  isPrimary: boolean;
  order?: number;
}

export interface IDeliveryLocation {
  state: string;
  lga: string;
  area?: string;
  latitude?: number;
  longitude?: number;
}

export interface IProductClicks {
  users: Types.ObjectId[];
  clickCount: number;
}

export interface IProduct {
  _id?: Types.ObjectId;

  name: string;
  slug?: string;

  category: Types.ObjectId;

  subCategory?: string;
  brand?: string;

  description: string;

  images: IProductImage[];

  availableQuantity: number;
  quantityMetric: "bag" | "kg" | "ton";

  price: number;
  currency: string;

  priceMetric: "bag" | "kg" | "ton";

  merchantName: string;
  storeName?: string;

  deliveryLocations: IDeliveryLocation[];
  deliveryTime?: "immediately" | "1_day" | "2_3_days" | "1_week" | "1_2_weeks" | "2_3_weeks" | "1_month" | "3_months";

  minimumOrder?: number;
  maximumOrder?: number;

  isDiscounted: boolean;
  discountedPrice?: number;

  // Per-product tax rate in percent; 0 (or unset) = tax free
  taxPercentage?: number;

  isFeatured?: boolean;
  totalUnitsSold?: number;

  status: "draft" | "pending" | "active" | "rejected" | "inactive" | "sold_out";

  reviews: Types.ObjectId[];

  clicks: IProductClicks;

  userId: Types.ObjectId;

  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;

  isDeleted: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}